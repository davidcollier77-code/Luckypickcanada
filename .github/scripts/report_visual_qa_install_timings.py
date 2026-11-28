#!/usr/bin/env python3
"""Report Visual QA dependency-install timings and cache states for a CI run.

Usage:
    python3 .github/scripts/report_visual_qa_install_timings.py RUN_ID [--repo OWNER/NAME]

The report answers one question after a rendering-capable pull request runs:
did the "Install dependencies" step stay at the pre-change baseline, and were
the pnpm store and Playwright Chromium caches warm?

The comparison baseline is the last merged Visual QA run before
``PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`` was introduced (PR #1914, run
43730539554): 7 s for each browser shard and 8 s for the verification job.
A warm pnpm store makes the install step roughly 7-8 s because pnpm never runs
playwright-chromium's install script. A cold pnpm store is the only state where
that postinstall would previously have downloaded a browser (~681 MB).

Only read-only GitHub REST calls are made. The token is read from the
environment or ``gh auth token`` and is never printed.

Tests use ``--fixture-dir`` so no network access is required.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone

# Last merged Visual QA run before PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD (PR #1914).
BASELINE_RUN_ID = 43730539554
BASELINE_LABEL = "PR #1914"
BASELINE_INSTALL_SECONDS = {
    # The always-required job was renamed from "Visual QA" to "Application
    # Verification"; the old name stays for historical runs.
    "Application Verification": 8,
    "Visual QA": 8,
    "Visual QA (shard 1/2)": 7,
    "Visual QA (shard 2/2)": 7,
}

INSTALL_STEP_NAME = "Install dependencies"
VISUAL_JOB_PREFIX = "Visual QA"
APPLICATION_VERIFICATION_JOB = "Application Verification"
CHROMIUM_CACHE_PREFIX = "playwright-chromium-"
PNPM_CACHE_PREFIX = "node-cache-"
CHROMIUM_RESTORE_STEP = "Restore cached Playwright Chromium"
REPO_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")

LOG_TIMESTAMP = re.compile(r"^\d{4}-\d{2}-\d{2}T[0-9:.]+Z ?")
ANSI_ESCAPE = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
CACHE_RESTORED = re.compile(r"Cache restored from key:\s*(\S+)")
CACHE_NOT_FOUND = re.compile(r"Cache not found for input keys:\s*(.+?)\s*$")
CACHE_HIT_PRIMARY = re.compile(r"Cache hit occurred on the primary key\s*(\S+)")


class ReportError(RuntimeError):
    """The report cannot be produced (bad input or an API failure)."""


class _AuthStrippingRedirect(urllib.request.HTTPRedirectHandler):
    """Follow GitHub's log redirect without leaking the token to blob storage."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        redirected = super().redirect_request(req, fp, code, msg, headers, newurl)
        if redirected is not None:
            old_host = urllib.parse.urlsplit(req.full_url).netloc
            new_host = urllib.parse.urlsplit(newurl).netloc
            if old_host != new_host:
                redirected.remove_header("Authorization")
                redirected.unredirected_hdrs.pop("Authorization", None)
        return redirected


def parse_timestamp(value):
    """Parse a GitHub ISO-8601 timestamp, returning None when absent."""
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def step_duration_seconds(step):
    """Whole seconds between a step's start and completion."""
    started = parse_timestamp(step.get("started_at"))
    completed = parse_timestamp(step.get("completed_at"))
    if started is None or completed is None:
        return None
    return max(0, round((completed - started).total_seconds()))


def find_step(job, name):
    for step in job.get("steps") or []:
        if isinstance(step, dict) and step.get("name") == name:
            return step
    return None


def install_step(job):
    return find_step(job, INSTALL_STEP_NAME)


def select_visual_jobs(jobs):
    """Return jobs that ran the QA dependency install, verify job first."""
    selected = [
        job
        for job in jobs
        if isinstance(job, dict)
        and (
            str(job.get("name") or "").startswith(VISUAL_JOB_PREFIX)
            or str(job.get("name") or "") == APPLICATION_VERIFICATION_JOB
        )
        and install_step(job) is not None
    ]

    def sort_key(job):
        name = str(job.get("name") or "")
        if name in (VISUAL_JOB_PREFIX, APPLICATION_VERIFICATION_JOB):
            return (0, 0, name)
        match = re.search(r"\(shard (\d+)/(\d+)\)", name)
        if match:
            return (1, int(match.group(1)), name)
        return (2, 0, name)

    return sorted(selected, key=sort_key)


def _strip_log_line(line):
    return ANSI_ESCAPE.sub("", LOG_TIMESTAMP.sub("", line.rstrip("\r")))


def classify_cache_key(key):
    normalized = key.strip().strip("'\"")
    if normalized.startswith(CHROMIUM_CACHE_PREFIX):
        return "chromium"
    if normalized.startswith(PNPM_CACHE_PREFIX) or "pnpm" in normalized:
        return "pnpm"
    return None


def parse_cache_states(log_text):
    """Read pnpm and Chromium cache outcomes from a job log.

    Both setup-node and actions/cache use @actions/cache, whose restore path
    logs either ``Cache restored from key: <key>`` or
    ``Cache not found for input keys: <key>, ...``.
    """
    states = {
        "pnpm": {"state": "unknown", "key": ""},
        "chromium": {"state": "unknown", "key": ""},
    }
    if not isinstance(log_text, str):
        return states

    for raw_line in log_text.splitlines():
        line = _strip_log_line(raw_line)
        restored = CACHE_RESTORED.search(line) or CACHE_HIT_PRIMARY.search(line)
        if restored:
            key = restored.group(1)
            slot = classify_cache_key(key)
            # Keep the first recorded state for each family so a later
            # duplicate restore line cannot replace the key that was
            # actually restored.
            if slot and states[slot]["state"] == "unknown":
                states[slot] = {"state": "hit", "key": key}
            continue
        missing = CACHE_NOT_FOUND.search(line)
        if missing:
            for key in missing.group(1).split(","):
                slot = classify_cache_key(key)
                # The first key in the list is the primary key; keep it when
                # restore-keys follow, and never replace a recorded hit.
                if slot and states[slot]["state"] == "unknown":
                    states[slot] = {"state": "miss", "key": key.strip()}
    return states


def chromium_state_from_steps(job):
    """Report whether the job has a Chromium cache restore at all.

    The cache outcome comes from the restore log lines; the workflow installs
    Chromium unconditionally, so no step conclusion encodes a hit or a miss. A
    job without a restore step (the verification job) is ``n/a``; a job with
    one but no readable log stays ``unknown`` rather than guessing.
    """
    return "n/a" if find_step(job, CHROMIUM_RESTORE_STEP) is None else "unknown"


def decode_log(payload):
    """Decode a job log, which GitHub serves as a one-entry zip or plain text."""
    if not isinstance(payload, (bytes, bytearray)):
        raise ReportError("job log payload is not bytes")
    data = bytes(payload)
    if data[:4] == b"PK\x03\x04":
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                parts = [
                    archive.read(name).decode("utf-8", "replace")
                    for name in sorted(archive.namelist())
                    if name.lower().endswith((".txt", ".log"))
                ]
        except zipfile.BadZipFile as error:
            raise ReportError("job log archive is not a valid zip file") from error
        return "\n".join(parts)
    return data.decode("utf-8", "replace")


def build_row(job, log_text=""):
    step = install_step(job)
    seconds = step_duration_seconds(step) if step else None
    name = str(job.get("name") or "")
    baseline = BASELINE_INSTALL_SECONDS.get(name)
    delta = seconds - baseline if seconds is not None and baseline is not None else None

    caches = parse_cache_states(log_text)
    chromium_step_state = chromium_state_from_steps(job)
    chromium_key = caches["chromium"]["key"]
    if chromium_step_state == "n/a":
        chromium_state = "n/a"
        chromium_key = ""
    elif chromium_step_state in {"hit", "miss"}:
        chromium_state = chromium_step_state
    else:
        chromium_state = caches["chromium"]["state"]

    started = parse_timestamp(step.get("started_at")) if step else None
    completed = parse_timestamp(step.get("completed_at")) if step else None
    if started and completed:
        window = "%s-%s" % (started.strftime("%H:%M:%S"), completed.strftime("%H:%M:%S"))
    else:
        window = ""

    return {
        "job": name,
        "status": job.get("conclusion") or job.get("status") or "",
        "install_seconds": seconds,
        "install_window_utc": window,
        "baseline_seconds": baseline,
        "delta_seconds": delta,
        "pnpm_cache": caches["pnpm"],
        "chromium_cache": {"state": chromium_state, "key": chromium_key},
    }


def _format_seconds(value):
    return "?" if value is None else "%ds" % value


def _format_delta(value):
    if value is None:
        return "n/a"
    if value > 0:
        return "+%ds" % value
    return "%ds" % value


def _format_cache(cache):
    state = cache.get("state") or "unknown"
    key = cache.get("key") or ""
    if not key:
        return state
    return "%s (%s)" % (state, key if len(key) <= 40 else key[:39] + "…")


def render_report(run, rows, repository):
    run_id = run.get("id") or "unknown"
    attempt = run.get("run_attempt") or "?"
    conclusion = run.get("conclusion") or run.get("status") or "unknown"
    html_url = run.get("html_url") or ""
    head_sha = str(run.get("head_sha") or "")[:8]

    lines = [
        "Visual QA dependency install timings",
        "Repository: %s" % repository,
        "Run: %s (attempt %s, %s)%s"
        % (run_id, attempt, conclusion, "  " + html_url if html_url else ""),
        "Head: %s" % (head_sha or "unknown"),
        "Baseline: %s run %s (verification 8s, each browser shard 7s)"
        % (BASELINE_LABEL, BASELINE_RUN_ID),
        "",
    ]

    header = "%-23s %7s %8s %6s  %-41s %s" % (
        "Job",
        "Install",
        "Baseline",
        "Delta",
        "pnpm store cache",
        "Chromium cache",
    )
    lines.append(header)
    lines.append("-" * len(header))
    for row in rows:
        lines.append(
            "%-23s %7s %8s %6s  %-41s %s"
            % (
                row["job"][:23],
                _format_seconds(row["install_seconds"]),
                _format_seconds(row["baseline_seconds"]),
                _format_delta(row["delta_seconds"]),
                _format_cache(row["pnpm_cache"]),
                _format_cache(row["chromium_cache"]),
            )
        )

    lines.append("")
    lines.append(
        "A warm pnpm store keeps Install dependencies at about 7-8s because pnpm does "
        "not run playwright-chromium's install script. A cold store is the only state "
        "where the removed postinstall would previously have downloaded a browser "
        "(about 681 MB)."
    )

    if not any(re.search(r"\(shard \d+/\d+\)", row["job"]) for row in rows):
        lines.append("")
        lines.append("No Chromium browser shard ran for this change set.")

    cold = [row["job"] for row in rows if row["pnpm_cache"]["state"] == "miss"]
    if cold:
        lines.append("")
        lines.append(
            "Cold pnpm store on %s: compare this install duration with the baseline, "
            "because this is the case where the skipped postinstall download mattered."
            % ", ".join(cold)
        )
    unknown = [row["job"] for row in rows if row["pnpm_cache"]["state"] == "unknown"]
    if unknown:
        lines.append("")
        lines.append(
            "pnpm store cache state could not be read from the job log for %s; the "
            "install duration is still comparable." % ", ".join(unknown)
        )

    return "\n".join(lines)


def _github_request(url, token, accept="application/vnd.github+json"):
    headers = {
        "Accept": accept,
        "User-Agent": "luckypickcanada-visual-qa-timings",
    }
    if token:
        headers["Authorization"] = "Bearer %s" % token
    request = urllib.request.Request(url, headers=headers)
    opener = urllib.request.build_opener(_AuthStrippingRedirect)
    try:
        return opener.open(request, timeout=60)
    except urllib.error.HTTPError as error:
        raise ReportError(
            "GitHub API request failed with HTTP %s for %s"
            % (error.code, urllib.parse.urlsplit(url).path)
        ) from None
    except urllib.error.URLError as error:
        raise ReportError(
            "GitHub API request could not reach %s: %s"
            % (urllib.parse.urlsplit(url).netloc, error.reason)
        ) from None


def api_json(url, token):
    path = urllib.parse.urlsplit(url).path
    with _github_request(url, token) as response:
        body = response.read()
    try:
        return json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        if isinstance(error, json.JSONDecodeError):
            detail = "%s at line %d column %d" % (error.msg, error.lineno, error.colno)
        else:
            detail = "payload is not valid UTF-8: %s" % error
        raise ReportError(
            "GitHub API returned invalid JSON for %s: %s" % (path, detail)
        ) from error


def api_bytes(url, token):
    with _github_request(url, token) as response:
        return response.read()


def load_live(repository, run_id, token):
    base = "https://api.github.com/repos/%s" % repository
    run = api_json("%s/actions/runs/%d" % (base, run_id), token)

    jobs = []
    page = 1
    while True:
        payload = api_json(
            "%s/actions/runs/%d/jobs?filter=latest&per_page=100&page=%d"
            % (base, run_id, page),
            token,
        )
        chunk = payload.get("jobs") or []
        jobs.extend(chunk)
        # GitHub omits total_count on some responses and reports zero when it
        # does not count. Only a positive total can end pagination early; a
        # full page must otherwise request the next page.
        try:
            total = int(payload.get("total_count") or 0)
        except (TypeError, ValueError):
            total = 0
        if len(chunk) < 100:
            break
        if total > 0 and len(jobs) >= total:
            break
        page += 1

    logs = {}
    for job in select_visual_jobs(jobs):
        job_id = job.get("id")
        if not job_id:
            continue
        try:
            payload = api_bytes("%s/actions/jobs/%s/logs" % (base, job_id), token)
        except ReportError:
            # A missing or unavailable log only changes cache details from
            # known to unknown; the report still renders.
            continue
        # Decoding stays outside the retrieval guard. A corrupt archive is not
        # unavailable evidence: it must fail the report visibly.
        logs[str(job_id)] = decode_log(payload)
    return run, jobs, logs


def load_fixture(directory):
    def read_json(name):
        path = os.path.join(directory, name)
        try:
            with open(path, encoding="utf-8") as handle:
                return json.load(handle)
        except FileNotFoundError:
            raise ReportError("fixture file is missing: %s" % name) from None
        except json.JSONDecodeError as error:
            raise ReportError("fixture file is not valid JSON: %s (%s)" % (name, error)) from None

    run = read_json("run.json")
    jobs_payload = read_json("jobs.json")
    jobs = jobs_payload.get("jobs") if isinstance(jobs_payload, dict) else jobs_payload
    if not isinstance(jobs, list):
        raise ReportError("fixture jobs.json must be an array or an object with a jobs array")

    logs = {}
    logs_dir = os.path.join(directory, "logs")
    if os.path.isdir(logs_dir):
        for name in sorted(os.listdir(logs_dir)):
            if not name.endswith((".txt", ".log")):
                continue
            with open(os.path.join(logs_dir, name), encoding="utf-8", errors="replace") as handle:
                logs[os.path.splitext(name)[0]] = handle.read()
    return run, jobs, logs


def resolve_repository(explicit):
    if explicit:
        if not REPO_PATTERN.match(explicit):
            raise ReportError("repository must be owner/name, got %r" % explicit)
        return explicit
    from_env = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if from_env:
        if not REPO_PATTERN.match(from_env):
            raise ReportError("GITHUB_REPOSITORY is not owner/name: %r" % from_env)
        return from_env
    try:
        remote = subprocess.run(
            ["git", "config", "--get", "remote.origin.url"],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        remote = ""
    match = re.search(r"github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?$", remote)
    if match:
        return "%s/%s" % (match.group(1), match.group(2))
    raise ReportError("pass --repo OWNER/NAME (no GitHub origin remote was found)")


def resolve_token():
    for variable in ("GH_TOKEN", "GITHUB_TOKEN"):
        value = os.environ.get(variable, "").strip()
        if value:
            return value
    if shutil.which("gh"):
        try:
            result = subprocess.run(
                ["gh", "auth", "token"], capture_output=True, text=True, timeout=15
            )
        except (OSError, subprocess.SubprocessError):
            return None
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    return None


def build_rows(jobs, logs):
    rows = []
    for job in select_visual_jobs(jobs):
        rows.append(build_row(job, logs.get(str(job.get("id")), "")))
    return rows


def build_parser():
    parser = argparse.ArgumentParser(
        description=(
            "Report Visual QA Install dependencies durations and pnpm/Chromium "
            "cache states for a workflow run, compared with the PR #1914 baseline."
        )
    )
    parser.add_argument("run_id", type=int, help="Visual QA workflow run ID")
    parser.add_argument("--repo", help="owner/name (defaults to GITHUB_REPOSITORY or the git origin)")
    parser.add_argument(
        "--fixture-dir",
        help="offline directory with run.json, jobs.json and optional logs/<job-id>.txt",
    )
    parser.add_argument("--json", action="store_true", help="print machine-readable JSON instead of a table")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        if args.fixture_dir:
            repository = args.repo or "fixture/repository"
            run, jobs, logs = load_fixture(args.fixture_dir)
        else:
            repository = resolve_repository(args.repo)
            run, jobs, logs = load_live(repository, args.run_id, resolve_token())
        rows = build_rows(jobs, logs)
        if not rows:
            raise ReportError(
                "run %s has no Visual QA job with an %r step"
                % (args.run_id, INSTALL_STEP_NAME)
            )
    except ReportError as error:
        print("VISUAL QA TIMINGS ERROR: %s" % error, file=sys.stderr)
        return 2

    if args.json:
        print(
            json.dumps(
                {
                    "repository": repository,
                    "run": {
                        "id": run.get("id"),
                        "attempt": run.get("run_attempt"),
                        "conclusion": run.get("conclusion"),
                        "head_sha": run.get("head_sha"),
                        "html_url": run.get("html_url"),
                    },
                    "baseline": {
                        "run_id": BASELINE_RUN_ID,
                        "label": BASELINE_LABEL,
                        "install_seconds": BASELINE_INSTALL_SECONDS,
                    },
                    "jobs": rows,
                },
                indent=2,
                sort_keys=True,
            )
        )
    else:
        print(render_report(run, rows, repository))
    return 0


if __name__ == "__main__":
    sys.exit(main())
