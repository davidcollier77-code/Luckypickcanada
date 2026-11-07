#!/usr/bin/env python3
"""Audit whether a pull request's CURRENT head has real verification evidence.

The audit exists because a commit message containing a CI-skip directive (for
example ``[skip ci]``) makes GitHub skip the ``push``/``pull_request``
workflows for that commit. The pull request then shows the green checks of an
EARLIER commit, which can look like the latest commit passed verification when
in fact nothing ran against it.

Rules enforced here (fail closed):

* verification always describes ``pull_request.head.sha`` at audit time;
* check runs are matched to that exact head SHA, never to an earlier commit;
* a required check with no run on the current head is reported ``NOT RUN``;
* a check GitHub reports as ``skipped``/``neutral``/``cancelled`` is ``NOT RUN``,
  never ``PASS``;
* a CI-skip directive on the head commit fails the audit even if some check
  happens to be green;
* checks that legitimately do not apply to every pull request are audited and
  reported as ``NOT RUN`` but never counted as passed verification, and their
  existing workflow behaviour is unchanged.

Only read-only GitHub REST calls are made. The token is read from the
environment and is never printed.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

# Directives GitHub documents as skipping push/pull_request workflow runs.
SKIP_CI_DIRECTIVES = (
    "[skip ci]",
    "[ci skip]",
    "[no ci]",
    "[skip actions]",
    "[actions skip]",
)

PASS_CONCLUSIONS = frozenset({"success"})
FAIL_CONCLUSIONS = frozenset(
    {"failure", "timed_out", "action_required", "startup_failure"}
)
NOT_RUN_CONCLUSIONS = frozenset({"skipped", "neutral", "cancelled", "stale"})

# Checks that must run and pass on the current head. These correspond to the
# workflows that run for every pull request in this repository.
REQUIRED_CHECKS = (
    "DevSkim scan and Security upload",
    "Validate OpenNext build artifacts",
)

# Checks that legitimately do not run for every pull request (for example
# Visual QA, whose own workflow classifies documentation-only changes). They are
# always audited and reported as NOT RUN when they did not run, but they never
# count as a passed verification or silently satisfy a requirement.
CONDITIONAL_CHECKS = ("Visual QA",)

REPO_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
SKIP_CHECKS_TRAILER = re.compile(r"^\s*skip-checks:\s*true\s*$", re.IGNORECASE)


def detect_skip_ci_directives(message):
    """Return the CI-skip directives present in a commit message.

    Matching is case-insensitive and literal, so ``[skip city]`` is not a skip
    directive. All documented GitHub spellings are recognised, including the
    ``skip-checks: true`` trailer and commits authored by automation.
    """
    if not isinstance(message, str):
        return []
    lowered = message.lower()
    directives = [item for item in SKIP_CI_DIRECTIVES if item in lowered]
    if any(SKIP_CHECKS_TRAILER.match(line) for line in message.splitlines()):
        directives.append("skip-checks: true")
    return directives


def actor_is_bot(actor):
    """Recognise automated GitHub actors without trusting a display name."""
    if not isinstance(actor, dict):
        return False
    actor_type = (actor.get("type") or "").lower()
    login = (actor.get("login") or "").lower()
    return actor_type == "bot" or login.endswith("[bot]")


def _commit_record(commit):
    inner = commit.get("commit") if isinstance(commit.get("commit"), dict) else {}
    author = commit.get("author") if isinstance(commit.get("author"), dict) else {}
    message = inner.get("message") or ""
    return {
        "sha": commit.get("sha") or "",
        "message": message,
        "author": author.get("login") or "",
        "author_is_bot": actor_is_bot(author),
        "skip_directives": detect_skip_ci_directives(message),
    }


def check_status(check_run):
    """Classify one GitHub check run as PASS, FAIL, PENDING or NOT RUN."""
    status = (check_run.get("status") or "").lower()
    conclusion = (check_run.get("conclusion") or "").lower()
    if status != "completed":
        return "PENDING", "the run is %s, not completed" % (status or "unknown")
    if conclusion in PASS_CONCLUSIONS:
        return "PASS", "conclusion success on the current head"
    if conclusion in FAIL_CONCLUSIONS:
        return "FAIL", "conclusion %s" % conclusion
    if conclusion in NOT_RUN_CONCLUSIONS:
        return "NOT RUN", "conclusion %s is not verification" % conclusion
    return "NOT RUN", "conclusion %s is not verification" % (conclusion or "missing")


def _latest_run(runs):
    """Pick the newest run, so a failed re-run cannot hide behind an old pass."""
    return max(
        runs,
        key=lambda run: (
            run.get("completed_at") or run.get("started_at") or "",
            int(run.get("id") or 0),
        ),
    )


def _audit_check(name, head_runs, stale_runs, head_directives):
    if head_runs:
        latest = _latest_run(head_runs)
        status, detail = check_status(latest)
        return {
            "name": name,
            "status": status,
            "conclusion": (latest.get("conclusion") or "").lower(),
            "head_sha": latest.get("head_sha") or "",
            "detail": detail,
        }

    if head_directives:
        detail = (
            "no run on the current head; the head commit message contains %s, "
            "so GitHub skipped the workflow" % ", ".join(head_directives)
        )
    elif stale_runs:
        earlier = _latest_run(stale_runs)
        detail = (
            "no run on the current head; only a run for earlier commit %s exists, "
            "which is not evidence for this head"
            % (earlier.get("head_sha") or "unknown")
        )
    else:
        detail = "no check run was recorded on the current head"
    return {
        "name": name,
        "status": "NOT RUN",
        "conclusion": "",
        "head_sha": "",
        "detail": detail,
    }


def audit_verification(pr, commits, check_runs):
    """Build an evidence report for the pull request's current head.

    ``pr``, ``commits`` and ``check_runs`` use the GitHub REST response shapes.
    ``check_runs`` may be either a list or a ``{"check_runs": [...]}`` payload.
    """
    if isinstance(check_runs, dict):
        check_runs = check_runs.get("check_runs") or []
    if not isinstance(check_runs, list):
        check_runs = []
    if not isinstance(commits, list):
        commits = []

    head = pr.get("head") if isinstance(pr.get("head"), dict) else {}
    head_sha = head.get("sha") or ""
    author = pr.get("user") if isinstance(pr.get("user"), dict) else {}

    commit_records = [_commit_record(commit) for commit in commits]
    head_commit = next(
        (record for record in commit_records if record["sha"] == head_sha), None
    )
    head_directives = head_commit["skip_directives"] if head_commit else []

    # Only runs attached to the exact current head SHA can count as evidence.
    on_head = [
        run for run in check_runs if (run.get("head_sha") or "") == head_sha
    ]
    stale = [
        run for run in check_runs if (run.get("head_sha") or "") != head_sha
    ]

    def runs_named(name, collection):
        return [run for run in collection if (run.get("name") or "") == name]

    required = []
    for name in REQUIRED_CHECKS:
        record = _audit_check(
            name,
            runs_named(name, on_head),
            runs_named(name, stale),
            head_directives,
        )
        record["blocking"] = True
        required.append(record)

    conditional = []
    for name in CONDITIONAL_CHECKS:
        record = _audit_check(
            name,
            runs_named(name, on_head),
            runs_named(name, stale),
            head_directives,
        )
        record["blocking"] = False
        conditional.append(record)

    audited_names = set(REQUIRED_CHECKS) | set(CONDITIONAL_CHECKS)
    other_checks = []
    for run in on_head:
        name = run.get("name") or ""
        if name in audited_names:
            continue
        status, detail = check_status(run)
        other_checks.append(
            {
                "name": name,
                "status": status,
                "conclusion": (run.get("conclusion") or "").lower(),
                "head_sha": run.get("head_sha") or "",
                "detail": detail,
            }
        )

    blocking_reasons = []
    if not head_sha:
        blocking_reasons.append("the pull request has no current head SHA")
    if head_sha and head_commit is None:
        blocking_reasons.append(
            "the current head %s is absent from the pull request commit list" % head_sha
        )
    if head_directives:
        blocking_reasons.append(
            "the head commit %s contains %s, so CI did not run for the current head"
            % (head_sha[:12] or "unknown", ", ".join(head_directives))
        )
    for record in required:
        if record["status"] != "PASS":
            blocking_reasons.append(
                "%s: %s — %s"
                % (record["name"], record["status"], record["detail"])
            )

    skipped_commits = [
        record for record in commit_records if record["skip_directives"]
    ]

    return {
        "pr": {
            "number": pr.get("number"),
            "head_sha": head_sha,
            "head_ref": head.get("ref") or "",
            "author": author.get("login") or "",
            "author_is_bot": actor_is_bot(author),
        },
        "head_commit": head_commit,
        "skipped_commits": skipped_commits,
        "required_checks": required,
        "conditional_checks": conditional,
        "other_checks": other_checks,
        "stale_check_runs": [
            {
                "name": run.get("name") or "",
                "head_sha": run.get("head_sha") or "",
                "status": run.get("status") or "",
                "conclusion": run.get("conclusion") or "",
            }
            for run in stale
        ],
        "overall_status": "NOT VERIFIED" if blocking_reasons else "VERIFIED",
        "blocking_reasons": blocking_reasons,
    }


def render_markdown(report):
    """Render the report so every unrun check is visibly NOT RUN."""
    pr = report["pr"]
    lines = [
        "## Verification status: %s" % report["overall_status"],
        "",
        "- Pull request: #%s" % pr["number"],
        "- Current head: `%s`" % (pr["head_sha"] or "unknown"),
        "- Head author: `%s`%s"
        % (pr["author"] or "unknown", " (automation)" if pr["author_is_bot"] else ""),
        "",
    ]

    if report["head_commit"] and report["head_commit"]["skip_directives"]:
        lines.extend(
            [
                "> [!WARNING]",
                "> The head commit contains %s. GitHub skipped the "
                "`push`/`pull_request` workflows for this commit; checks shown "
                "for earlier commits are **not** evidence for the current head."
                % ", ".join("`%s`" % item for item in report["head_commit"]["skip_directives"]),
                "",
            ]
        )

    lines.append("| Check | Status | Evidence |")
    lines.append("| --- | --- | --- |")
    for record in report["required_checks"]:
        lines.append(
            "| %s (required) | **%s** | %s |"
            % (record["name"], record["status"], record["detail"])
        )
    for record in report["conditional_checks"]:
        lines.append(
            "| %s (conditional) | **%s** | %s |"
            % (record["name"], record["status"], record["detail"])
        )
    lines.append("")

    if report["skipped_commits"]:
        lines.append("Commits carrying a CI-skip directive:")
        lines.append("")
        for commit in report["skipped_commits"]:
            lines.append(
                "- `%s` by `%s`%s — %s"
                % (
                    commit["sha"][:12] or "unknown",
                    commit["author"] or "unknown",
                    " (automation)" if commit["author_is_bot"] else "",
                    ", ".join("`%s`" % item for item in commit["skip_directives"]),
                )
            )
        lines.append("")

    if report["stale_check_runs"]:
        lines.append(
            "Check runs attached to earlier commits were ignored and are not "
            "evidence for `%s`:" % (pr["head_sha"] or "the current head")
        )
        lines.append("")
        for run in report["stale_check_runs"]:
            lines.append(
                "- %s on `%s` (%s/%s)"
                % (
                    run["name"] or "unnamed",
                    (run["head_sha"] or "unknown")[:12],
                    run["status"] or "unknown",
                    run["conclusion"] or "none",
                )
            )
        lines.append("")

    if report["blocking_reasons"]:
        lines.append("Blocking reasons:")
        lines.append("")
        for reason in report["blocking_reasons"]:
            lines.append("- %s" % reason)
        lines.append("")

    lines.append(
        "A check is only `PASS` when GitHub reports a completed `success` run "
        "attached to the current head SHA. `NOT RUN` means the check did not "
        "run for the current head and must not be read as a pass."
    )
    return "\n".join(lines) + "\n"


def _api_get(url, token):
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": "Bearer %s" % token,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "luckypickcanada-verification-audit",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        raise RuntimeError(
            "GitHub API request failed with HTTP %s for %s"
            % (error.code, url.split("?")[0])
        ) from None
    except urllib.error.URLError as error:
        raise RuntimeError(
            "GitHub API request could not reach %s: %s"
            % (url.split("?")[0], error.reason)
        ) from None
    except json.JSONDecodeError:
        raise RuntimeError(
            "GitHub API returned invalid JSON for %s" % url.split("?")[0]
        ) from None


def _paginate(url, token, key=None, limit=10):
    items = []
    for page in range(1, limit + 1):
        separator = "&" if "?" in url else "?"
        payload = _api_get("%s%sper_page=100&page=%d" % (url, separator, page), token)
        if isinstance(payload, dict) and key:
            chunk = payload.get(key) or []
        elif isinstance(payload, list):
            chunk = payload
        else:
            chunk = []
        items.extend(chunk)
        if len(chunk) < 100:
            break
    return items



def load_live(repo, pr_number, token):
    base = "https://api.github.com/repos/%s" % repo
    pr = _api_get("%s/pulls/%d" % (base, pr_number), token)
    head_sha = (pr.get("head") or {}).get("sha") or ""
    commits = _paginate(
        "%s/pulls/%d/commits" % (base, pr_number), token
    )

    # Fetch check runs for the head commit and for every earlier commit in the
    # PR, so that stale runs (attached to earlier SHAs) can be reported as
    # audit evidence, matching fixture-mode behavior.
    shas = []
    if head_sha:
        shas.append(head_sha)
    for commit in commits:
        sha = (commit or {}).get("sha")
        if sha and sha not in shas:
            shas.append(sha)

    check_runs = []
    seen_ids = set()
    for sha in shas:
        runs = _paginate(
            "%s/commits/%s/check-runs" % (base, sha), token, key="check_runs"
        )
        for run in runs:
            run_id = (run or {}).get("id")
            if run_id is not None:
                if run_id in seen_ids:
                    continue
                seen_ids.add(run_id)
            check_runs.append(run)
    return pr, commits, check_runs


def load_fixture(directory):
    def read(name):
        with open(os.path.join(directory, name), encoding="utf-8") as handle:
            return json.load(handle)

    return read("pr.json"), read("commits.json"), read("check-runs.json")


def wait_for_current_head(repo, pr_number, token, timeout_seconds, poll_seconds):
    """Wait, bounded, for the current head's audited checks to settle.

    The pull request is re-read on every poll, so if a new commit lands while
    waiting the audit follows the new head instead of the stale one.
    """
    deadline = time.monotonic() + timeout_seconds
    while True:
        pr, commits, check_runs = load_live(repo, pr_number, token)
        head_sha = (pr.get("head") or {}).get("sha") or ""
        head_commit = next(
            (item for item in commits if (item.get("sha") or "") == head_sha), None
        )
        head_message = ((head_commit or {}).get("commit") or {}).get("message") or ""
        # A skipped head cannot produce the required runs, so waiting is pointless.
        if detect_skip_ci_directives(head_message):
            return
        if isinstance(check_runs, dict):
            check_runs = check_runs.get("check_runs") or []
        on_head = [
            run for run in check_runs if (run.get("head_sha") or "") == head_sha
        ]
        unsettled = [
            run
            for run in on_head
            if (run.get("name") or "")
            in set(REQUIRED_CHECKS) | set(CONDITIONAL_CHECKS)
            and (run.get("status") or "").lower() != "completed"
        ]
        all_required_observed = set(REQUIRED_CHECKS).issubset(
            {run.get("name") for run in on_head}
        )
        if not unsettled and (all_required_observed or time.monotonic() >= deadline):
            return
        if time.monotonic() >= deadline:
            return
        time.sleep(max(1, poll_seconds))


def build_parser():
    parser = argparse.ArgumentParser(
        description=(
            "Report whether the pull request's current head has real, "
            "current-head verification evidence."
        )
    )
    parser.add_argument("--repo", help="owner/name of the repository")
    parser.add_argument("--pr", type=int, help="pull request number")
    parser.add_argument(
        "--fixture-dir",
        help="offline directory holding pr.json, commits.json and check-runs.json",
    )
    parser.add_argument("--summary", help="append the Markdown report to this file")
    parser.add_argument("--json", help="write the machine-readable report here")
    parser.add_argument(
        "--wait-seconds",
        type=int,
        default=0,
        help="bounded wait for the current head's checks to settle",
    )
    parser.add_argument(
        "--poll-interval", type=int, default=15, help="seconds between polls"
    )
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)

    try:
        if args.fixture_dir:
            pr, commits, check_runs = load_fixture(args.fixture_dir)
        else:
            if not args.repo or not REPO_PATTERN.match(args.repo):
                raise RuntimeError(
                    "a GitHub owner/name repository is required (--repo or --fixture-dir)"
                )
            if not args.pr or args.pr <= 0:
                raise RuntimeError("a positive pull request number is required")
            token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
            if not token:
                raise RuntimeError(
                    "GH_TOKEN or GITHUB_TOKEN is required for a live audit"
                )
            if args.wait_seconds > 0:
                wait_for_current_head(
                    args.repo,
                    args.pr,
                    token,
                    args.wait_seconds,
                    args.poll_interval,
                )
            pr, commits, check_runs = load_live(args.repo, args.pr, token)
    except RuntimeError as error:
        print("VERIFICATION AUDIT ERROR: %s" % error, file=sys.stderr)
        return 2

    report = audit_verification(pr, commits, check_runs)
    markdown = render_markdown(report)
    print(markdown)

    if args.json:
        with open(args.json, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2, sort_keys=True)
            handle.write("\n")
    if args.summary:
        with open(args.summary, "a", encoding="utf-8") as handle:
            handle.write(markdown)

    return 0 if report["overall_status"] == "VERIFIED" else 1


if __name__ == "__main__":
    sys.exit(main())
