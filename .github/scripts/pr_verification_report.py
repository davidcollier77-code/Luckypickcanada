#!/usr/bin/env python3
"""One consolidated seven-category verification report for a pull request.

The seven categories are fixed. Every category is always rendered with exactly
one of the four report statuses: ``PASSED``, ``FAILED``, ``WARNING`` or
``NOT RUN``. No extra top-level category exists; the detailed findings of the
existing checkers (changed-code review, test quality, performance, Visual QA,
DevSkim alerts and dependency advisories) are kept as evidence inside the
category that owns them.

The PR description is the submitter's task summary and handoff: it carries the
declarations and documentation. This report publishes the checker results that
belong to the current PR HEAD. A declaration is reported as an attestation, not
as independent proof that the declared work happened.

Dependency-free and read-only: the workflow supplies GitHub evidence as JSON.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import PurePosixPath

import check_qa_pr_scope as scope
import checker_suite
import review_pr_changes

REPORT_MARKER = "<!-- qa-verification-report -->"
REPORT_TITLE = "PR verification report — seven checker categories"
LIMIT = 60000

PASSED = "PASSED"
FAILED = "FAILED"
WARNING = "WARNING"
NOT_RUN = "NOT RUN"
STATUSES = (PASSED, FAILED, WARNING, NOT_RUN)

# The exact declarations the PR description must carry. Matching is exact: a
# close approximation (a hyphen instead of the em dash, different casing or a
# missing sentence) is not the required declaration.
QA_DECLARATION = (
    "Pre-Submission Code Quality Review: VERIFIED — Pre-check completed before PR submission."
)
PROTECTED_DECLARATION = (
    "Human Authorization: APPROVED — Protected-file changes are explicitly authorized "
    "by the user as part of the assigned task."
)
SCOPE_CHANGE_PHRASE = "Scope changed"

CATEGORIES = (
    ("qa-checker", "QA Checker"),
    ("devskim", "DevSkim"),
    ("pr-scope", "PR Scope Verification"),
    ("protected-files", "Protected File Changes"),
    ("verification-integrity", "Verification Integrity"),
    ("governance", "Governance and Workflow Verification"),
    ("dependency-health", "Dependency Health & Vulnerability Review"),
)
CATEGORY_NAMES = {key: name for key, name in CATEGORIES}

# Supporting results that belong to the QA Checker category. They are always
# rendered, so a missing or skipped result is visible instead of disappearing.
QA_SUPPORTING_CHECKS = (
    (
        "Visual QA",
        "full unit test suite and standalone TypeScript check",
    ),
    (
        "Visual QA (shard 1/2)",
        "Playwright visual regression shard 1",
    ),
    (
        "Visual QA (shard 2/2)",
        "Playwright visual regression shard 2",
    ),
    (
        "Validate OpenNext build artifacts",
        "production build, compiled CSS and the 495 MiB build-size gate",
    ),
)

DEVSKIM_CHECK = "DevSkim scan and Security upload"
PROTECTED_AUTHORIZATION_CHECK = "Protected File Authorization"

# Manifest and lockfile names that make a pull request a dependency change.
DEPENDENCY_MANIFEST = re.compile(
    r"(^|/)(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$"
)
DEPENDENCY_CONFIG = ".github/dependabot.yml"
SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "moderate": 2, "low": 1}

# Kept identical to .github/workflows/protected-files.yml. A regression test
# compares both lists so the two cannot drift apart silently.
PROTECTED_FILES = (
    "AGENTS.md",
    "next.config.mjs",
    "package.json",
    "pnpm-lock.yaml",
    "wrangler.jsonc",
    "tailwind.config.js",
    "postcss.config.cjs",
    "app/globals.css",
    "middleware.ts",
    ".github/workflows/deploy-open-next.yml",
    ".github/workflows/validate-open-next-repair.yml",
    ".github/workflows/refresh-docs.yml",
    "scripts/refresh-docs.js",
    ".github/workflows/protected-files.yml",
    ".github/scripts/agents_md_protection.py",
    ".github/scripts/test_agents_md_protection.py",
    "__tests__/agent-governance-single-source.test.js",
)

PLACEHOLDER = re.compile(
    r"\b(todo|tbd|placeholder|fill this in|name each|describe the|replace with|list the completed|select the applicable)\b"
    r"|<[^>]+>",
    re.I,
)
GOVERNANCE_LABELS = {
    "stages": "Spec Kit stages completed",
    "artifacts": "Spec Kit artifact paths",
    "task_groups": "Task groups selected",
    "library": "Library documents consulted",
    "memory": "Memory Bank",
}
GOVERNANCE_STAGE_WORDS = ("specify", "plan", "tasks", "implement")


class ReportError(ValueError):
    """The supplied evidence cannot be evaluated safely."""


def _plain_text(body):
    """Remove HTML comments so template guidance is not read as a declaration."""
    if not isinstance(body, str):
        return ""
    return re.sub(r"<!--.*?-->", "", body, flags=re.DOTALL)


def _label_value(body, label):
    """Return the value written after a label, or an empty string."""
    pattern = re.compile(
        r"(?im)^[\s>*\-]*\**\s*" + re.escape(label) + r"\s*\**\s*:?\s*(.*)$"
    )
    for match in pattern.finditer(body or ""):
        value = match.group(1).strip().strip("*").strip()
        if value:
            return value
    return ""


def _placeholder(value):
    return not value or bool(PLACEHOLDER.search(value))


def _category(key, status, summary, details=None, attention=None):
    return {
        "id": key,
        "name": CATEGORY_NAMES[key],
        "status": status,
        "summary": summary,
        "details": list(details or []),
        "attention": list(attention or []),
    }


def _flatten(records):
    flat = []
    for item in records if isinstance(records, list) else [records]:
        if isinstance(item, list):
            flat.extend(_flatten(item))
        else:
            flat.append(item)
    return flat


def _check_runs(evidence):
    records = evidence.get("check_runs")
    if isinstance(records, dict):
        records = records.get("check_runs")
    return [run for run in _flatten(records or []) if isinstance(run, dict)]


def _latest(runs):
    return max(
        runs,
        key=lambda run: (
            run.get("completed_at") or run.get("started_at") or "",
            int(run.get("id") or 0),
        ),
    )


def _run_status(run):
    """Classify one GitHub check run into the report vocabulary."""
    status = (run.get("status") or "").lower()
    conclusion = (run.get("conclusion") or "").lower()
    if status != "completed":
        return WARNING, "the run is %s, not completed" % (status or "unknown")
    if conclusion == "success":
        return PASSED, "conclusion success"
    if conclusion in {"failure", "timed_out", "action_required", "startup_failure"}:
        return FAILED, "conclusion %s" % conclusion
    return NOT_RUN, "conclusion %s is not verification" % (conclusion or "missing")


def _named_runs(evidence, name):
    head = _head_sha(evidence)
    if not head:
        return []
    runs = [
        run
        for run in _check_runs(evidence)
        if (run.get("name") or "") == name
        and (run.get("head_sha") or "") == head
    ]
    return runs


def _check_state(evidence, name):
    """Return (status, detail, latest_run) for one exact check name."""
    runs = _named_runs(evidence, name)
    if not runs:
        return NOT_RUN, "no run is attached to the current head", None
    latest = _latest(runs)
    status, detail = _run_status(latest)
    return status, detail, latest


def _head_sha(evidence):
    pr = evidence.get("pull_request") or {}
    head = pr.get("head") if isinstance(pr.get("head"), dict) else {}
    return head.get("sha") or ""


def _supporting_rows(evidence):
    rows = []
    for name, purpose in QA_SUPPORTING_CHECKS:
        status, detail, run = _check_state(evidence, name)
        rows.append(
            {
                "name": name,
                "purpose": purpose,
                "status": status,
                "detail": detail,
                "head_sha": (run or {}).get("head_sha") or "",
                "url": (run or {}).get("html_url") or (run or {}).get("details_url") or "",
            }
        )
    return rows


def _render_finding(item):
    path = item.get("path") or "unknown"
    line = item.get("line") or 1
    # ``review_pr_changes`` emits the matched source line as ``excerpt`` and a
    # short ``recommendation``; older evidence bundles used ``evidence`` and
    # ``suggestion``. Read both so a finding never renders an empty excerpt.
    evidence = item.get("excerpt") or item.get("evidence") or ""
    fix = (
        item.get("suggestion")
        or item.get("recommendation")
        or "Review the finding."
    )
    return "\n".join(
        [
            "- **%s · %s · %s** `%s:%s`"
            % (
                item.get("severity") or "warning",
                item.get("classification") or "potential",
                item.get("rule") or "finding",
                path,
                line,
            ),
            "  - What happened: %s" % (item.get("message") or ""),
            "  - Evidence: `%s`"
            % " ".join(str(evidence).split())[:200].replace("`", "'"),
            "  - Suggested fix: %s" % fix,
        ]
    )


def _finding_blocks(findings, limit=15):
    blocks = [_render_finding(item) for item in findings[:limit]]
    if len(findings) > limit:
        blocks.append(
            "_%d more finding(s) are recorded in the checker report and the job summary._"
            % (len(findings) - limit)
        )
    return blocks


def _findings_summary(findings):
    hard = sum(1 for item in findings if item.get("severity") in {"error", "hard"})
    confirmed = sum(1 for item in findings if item.get("classification") == "confirmed")
    return "%d finding(s), %d hard, %d confirmed" % (len(findings), hard, confirmed)


# ---------------------------------------------------------------------------
# 1. QA Checker
# ---------------------------------------------------------------------------


def qa_checker_category(evidence):
    pr = evidence.get("pull_request") or {}
    body = _plain_text(pr.get("body"))
    author = ((pr.get("user") or {}).get("login") or "")
    is_bot = author.endswith("[bot]")
    declaration_present = QA_DECLARATION in body
    details = []
    attention = []

    if declaration_present:
        details.append(
            "Pre-submission declaration present: the submitter attested that the personal "
            "code quality review was completed. Its presence is an attestation, not proof "
            "that the review was performed."
        )
    elif is_bot:
        details.append(
            "This pull request is authored by `%s`. The human pre-submission attestation is "
            "not applicable and is reported as NOT RUN, not as a failure." % author
        )
        attention.append(
            "Bot-authored pull request: the human pre-submission attestation is NOT RUN. Its "
            "supporting automated results still decide this category."
        )
    else:
        attention.append(
            "Add the exact declaration to the PR description: `%s`" % QA_DECLARATION
        )

    supporting = _supporting_rows(evidence)
    details.append(
        "Supporting automated results in this category: %s."
        % ", ".join("%s (%s)" % (row["name"], row["status"]) for row in supporting)
    )
    for row in supporting:
        details.append(
            "%s: %s — %s." % (row["name"], row["status"], row["detail"])
        )

    findings = []
    try:
        files = evidence.get("files")
        review = review_pr_changes.review_files(files)
        findings.extend(
            {**item, "source": "changed-code review"} for item in review.get("findings", [])
        )
        review_status = (
            PASSED
            if review.get("status") == "PASS"
            else FAILED
            if review.get("status") == "FAIL"
            else NOT_RUN
        )
        details.append(
            "Automated changed-code review: %s — %s."
            % (review_status, _findings_summary(review.get("findings", [])))
        )
        if review.get("skipped_files"):
            details.append(
                "%d file(s) had no textual patch and were not examined by the changed-code review."
                % len(review["skipped_files"])
            )
        hard = [item for item in review.get("findings", []) if item.get("severity") in {"error", "hard"}]
    except review_pr_changes.ReviewError as error:
        review = {"status": "BLOCKED"}
        hard = []
        details.append("Automated changed-code review could not run: %s." % error)
        attention.append("Provide readable changed-file evidence so the changed-code review can run.")

    for mode, label in (
        ("test-quality", "Test quality"),
        ("performance", "Performance and resource cleanup"),
    ):
        try:
            mode_findings = (
                checker_suite.review_test_quality(evidence.get("files"))
                if mode == "test-quality"
                else checker_suite.review_performance(evidence.get("files"))
            )
        except Exception as error:  # noqa: BLE001 - evidence is untrusted input
            details.append("%s checker could not run: %s." % (label, error))
            attention.append("%s could not run against the supplied diff." % label)
            continue
        findings.extend({**item, "source": label} for item in mode_findings)
        details.append("%s supporting check: %d advisory finding(s)." % (label, len(mode_findings)))

    for block in _finding_blocks(findings):
        details.append(block)

    if (not declaration_present and not is_bot) or hard or review.get("status") == "FAIL":
        status = FAILED
    elif any(row["status"] == FAILED for row in supporting):
        status = FAILED
    elif not declaration_present and is_bot:
        status = WARNING
    elif any(row["status"] in {WARNING, NOT_RUN} for row in supporting):
        status = WARNING
    elif review.get("status") == "BLOCKED":
        status = WARNING
    else:
        status = PASSED

    for row in supporting:
        if row["status"] != PASSED:
            attention.append(
                "%s is %s on the current head: %s." % (row["name"], row["status"], row["detail"])
            )

    if status == PASSED:
        summary = "Declaration present and every supporting automated result passed."
    elif status == FAILED:
        summary = "Required QA evidence is missing or failed."
    elif not declaration_present and is_bot:
        summary = (
            "Bot-authored pull request: the human attestation is NOT RUN; supporting results "
            "are reported without failing the pull request for the missing attestation."
        )
    elif status == WARNING:
        summary = "Incomplete coverage: at least one supporting result is not a pass."
    else:
        summary = "No supporting QA result is available for the current head."
    return _category("qa-checker", status, summary, details, attention)


# ---------------------------------------------------------------------------
# 2. DevSkim
# ---------------------------------------------------------------------------


def devskim_category(evidence):
    status, detail, run = _check_state(evidence, DEVSKIM_CHECK)
    details = [
        "DevSkim scanning, suppression handling, SARIF processing and Security-tab upload are "
        "unchanged; this category reports their result without weakening the scanner."
    ]
    attention = []

    alerts = evidence.get("alerts")
    high = 0
    open_count = None
    if isinstance(alerts, dict):
        details.append(
            "Open code-scanning alerts could not be read: %s. DevSkim itself is unaffected."
            % (alerts.get("message") or "the API was unavailable")
        )
        attention.append("Open the Security tab to triage code-scanning alerts for this PR.")
    elif isinstance(alerts, list):
        open_alerts = [item for item in alerts if (item.get("state") or "open") == "open"]
        open_count = len(open_alerts)
        rank = {}
        for item in open_alerts:
            rule = item.get("rule") or {}
            severity = (
                rule.get("security_severity_level") or rule.get("severity") or "unknown"
            ).casefold()
            rank[severity] = rank.get(severity, 0) + 1
        high = rank.get("critical", 0) + rank.get("high", 0)
        details.append(
            "Open code-scanning alerts for this pull request: %d (%s)."
            % (
                open_count,
                ", ".join("%s: %d" % (name, count) for name, count in sorted(rank.items()))
                or "none",
            )
        )
        if open_count:
            attention.append(
                "Triage the open code-scanning alerts; high and critical alerts must be resolved "
                "or explicitly dispositioned."
            )
    else:
        details.append("No code-scanning alert evidence was supplied to this report.")
        attention.append("Open the Security tab to triage code-scanning alerts for this PR.")

    if run:
        details.append(
            "`%s` on head `%s`: %s (%s)."
            % (DEVSKIM_CHECK, (run.get("head_sha") or "unknown")[:12], status, detail)
        )
    else:
        details.append("`%s` has no run attached to the current head." % DEVSKIM_CHECK)

    if status == FAILED:
        final = FAILED
        summary = "The DevSkim security scan failed on the current head."
    elif status == NOT_RUN:
        final = NOT_RUN
        summary = "The DevSkim security scan did not run for the current head; not a pass."
    elif status == WARNING:
        final = WARNING
        summary = "The DevSkim security scan has not completed on the current head."
    elif high:
        final = FAILED
        summary = "%d high or critical code-scanning alert(s) are open." % high
    elif open_count:
        final = WARNING
        summary = "%d open code-scanning alert(s) need triage." % open_count
    elif isinstance(alerts, dict):
        final = WARNING
        summary = "DevSkim passed, but the code-scanning alert list could not be read."
    else:
        final = PASSED
        summary = "DevSkim scan passed on the current head and no open alert is reported."
    return _category("devskim", final, summary, details, attention)


# ---------------------------------------------------------------------------
# 7. Dependency Health & Vulnerability Review
# ---------------------------------------------------------------------------


def _changed_dependency_records(evidence):
    records = [
        record
        for record in _flatten(evidence.get("files") or [])
        if isinstance(record, dict)
    ]
    return [
        record
        for record in records
        if DEPENDENCY_MANIFEST.search(record.get("filename") or "")
    ]


def _version_tuple(value):
    match = re.search(r"(\d+)\.(\d+)\.(\d+)", str(value or ""))
    if not match:
        return ()
    return tuple(int(part) for part in match.groups())


def _added_dependencies(records):
    """Read changed dependency names and their highest added version."""
    found = {}
    for record in records:
        filename = record.get("filename") or ""
        patch = record.get("patch") or ""
        base = PurePosixPath(filename).name
        for line in patch.splitlines():
            if not line.startswith("+") or line.startswith("+++"):
                continue
            text = line[1:].strip().rstrip(",")
            if base == "package.json":
                match = re.match(r'^"(@?[^"]+)"\s*:\s*"([^"]+)"', text)
                if not match or match.group(1).startswith("$"):
                    continue
                if not re.match(
                    r"([~^<>=*\d]|workspace:|npm:|file:|link:|github:|https?:)",
                    match.group(2),
                ):
                    continue
                name, value = match.group(1), match.group(2)
            elif base in {"pnpm-lock.yaml", "package-lock.json", "yarn.lock"}:
                match = re.match(
                    r"^['\"]?((?:@[^/@'\"]+/)?[^@'\":\s]+)@([^'\":\s]+)['\"]?:?$",
                    text,
                )
                if not match:
                    continue
                name, value = match.group(1), match.group(2)
            else:
                continue
            version = _version_tuple(value)
            previous = found.get(name, ())
            found[name] = max(previous, version)
    return found


def _patched_version(alert):
    vulnerability = alert.get("security_vulnerability")
    vulnerability = vulnerability if isinstance(vulnerability, dict) else {}
    patched = vulnerability.get("first_patched_version")
    if not isinstance(patched, dict):
        return ()
    return _version_tuple(patched.get("identifier"))


def _alert_package(alert):
    dependency = alert.get("dependency")
    dependency = dependency if isinstance(dependency, dict) else {}
    package = dependency.get("package")
    package = package if isinstance(package, dict) else {}
    return (package.get("name") or alert.get("package_name") or "").strip()


def _alert_severity(alert):
    advisory = alert.get("security_advisory")
    advisory = advisory if isinstance(advisory, dict) else {}
    vulnerability = alert.get("security_vulnerability")
    vulnerability = vulnerability if isinstance(vulnerability, dict) else {}
    return (advisory.get("severity") or vulnerability.get("severity") or "").casefold()


def dependency_health_category(evidence):
    pr = evidence.get("pull_request") or {}
    author = ((pr.get("user") or {}).get("login") or "").casefold()
    records = _changed_dependency_records(evidence)
    filenames = {
        record.get("filename")
        for record in _flatten(evidence.get("files") or [])
        if isinstance(record, dict)
    }
    config_changed = DEPENDENCY_CONFIG in filenames
    manifest_changed = any(
        PurePosixPath(record.get("filename") or "").name == "package.json"
        for record in records
    )
    lock_changed = any(
        PurePosixPath(record.get("filename") or "").name
        in {"pnpm-lock.yaml", "package-lock.json", "yarn.lock"}
        for record in records
    )
    details = [
        "Known vulnerabilities are read from GitHub's Dependabot advisory alerts; that is a "
        "dependency-advisory source, separate from the DevSkim code scan, so this category does "
        "not duplicate the DevSkim security check.",
        "Dependabot remains the scheduled weekly updater for npm/pnpm and GitHub Actions. This "
        "review runs on every pull request and does not depend on a Dependabot update having run.",
    ]
    attention = []

    if author == "dependabot[bot]":
        details.append(
            "This pull request is an applicable weekly Dependabot update; the same dependency "
            "health and advisory rules apply to it."
        )
    if config_changed:
        details.append(
            "`.github/dependabot.yml` is changed in this pull request. The weekly update schedule "
            "is expected to remain unchanged."
        )
        attention.append(
            "Confirm the Dependabot configuration change is intentional and separately authorized; "
            "its weekly schedule must stay in place."
        )

    alerts = evidence.get("dependabot_alerts")
    if isinstance(alerts, dict):
        message = alerts.get("message") or "the dependency advisory API was unavailable"
        details.append(
            "Dependency advisories could not be read: %s. Dependency-manifest health was still "
            "checked, but the known-vulnerability review did not run." % message
        )
        attention.append(
            "Restore access to Dependabot alerts or triage dependency advisories manually; this "
            "category is not a pass while the advisory source is unavailable."
        )
        return _category(
            "dependency-health",
            NOT_RUN,
            "The known-vulnerability review could not run, so no dependency-health pass is claimed.",
            details,
            attention,
        )
    if alerts is None:
        details.append(
            "No dependency-advisory evidence was supplied to this report, so known vulnerabilities "
            "could not be assessed."
        )
        attention.append(
            "Supply the Dependabot alert evidence and re-run the report; this category is not a pass."
        )
        return _category(
            "dependency-health",
            NOT_RUN,
            "No dependency-advisory evidence is available; the review did not run.",
            details,
            attention,
        )

    open_alerts = [
        alert
        for alert in alerts
        if isinstance(alert, dict) and (alert.get("state") or "open") == "open"
    ]
    alerts_for = {}
    by_package = {}
    for alert in open_alerts:
        name = _alert_package(alert)
        if not name:
            continue
        alerts_for.setdefault(name, []).append(alert)
        severity = _alert_severity(alert)
        if SEVERITY_ORDER.get(severity, 0) >= SEVERITY_ORDER.get(by_package.get(name, ""), 0):
            by_package[name] = severity
    high_repo = sum(
        1 for severity in by_package.values() if SEVERITY_ORDER.get(severity, 0) >= 3
    )

    if not records:
        details.append(
            "No dependency manifest or lockfile is changed by this pull request, so no dependency "
            "risk is attributed to it."
        )
        if by_package:
            details.append(
                "%d open dependabot advisory(ies) exist for packages this pull request does not "
                "change (%d high or critical). They are reported as context and are not attributed "
                "to, or failed against, this pull request." % (len(by_package), high_repo)
            )
        status = WARNING if config_changed else PASSED
        summary = (
            "No dependency change in this pull request; unrelated advisories do not fail it."
            if status == PASSED
            else "No dependency change, but the Dependabot configuration changed."
        )
        return _category("dependency-health", status, summary, details, attention)

    changed = _added_dependencies(records)
    names = set(changed)
    matched = {}
    addressed = 0
    for name in sorted(names & set(alerts_for)):
        version = changed.get(name) or ()
        still_open = []
        for alert in alerts_for[name]:
            patched = _patched_version(alert)
            if version and patched and version >= patched:
                # The changed version reaches the recorded first patched
                # release, so that advisory is addressed by this update.
                continue
            still_open.append(_alert_severity(alert))
        if still_open:
            matched[name] = max(
                still_open, key=lambda severity: SEVERITY_ORDER.get(severity, 0)
            )
        else:
            addressed += 1
    if matched:
        details.append(
            "Changed dependencies with open advisories: %s."
            % ", ".join(
                "%s (%s)" % (name, severity or "unknown")
                for name, severity in sorted(matched.items())
            )
        )
    else:
        details.append(
            "No open advisory matches a dependency added or changed by this pull request."
        )
    if addressed:
        details.append(
            "%d changed dependenc(ies) are at or above the recorded first patched version, so "
            "their open advisory is treated as addressed by this update." % addressed
        )
    if names:
        details.append(
            "Dependency names read from the changed manifest/lockfile: %s."
            % ", ".join(sorted(names)[:20])
        )
    else:
        details.append(
            "The changed dependency names could not be read from the supplied patches."
        )

    worst = max(
        (SEVERITY_ORDER.get(severity, 0) for severity in matched.values()), default=0
    )
    lockfile_missing = manifest_changed and bool(names) and not lock_changed
    if lockfile_missing:
        details.append(
            "`package.json` adds or changes dependencies but no lockfile is changed with it."
        )
        attention.append(
            "Regenerate the lockfile with the repository's package manager so package.json and "
            "pnpm-lock.yaml stay consistent."
        )

    if worst >= 3 and author != "dependabot[bot]":
        status = FAILED
        summary = "A dependency changed by this pull request has an open high or critical advisory."
        attention.append(
            "Update or remove the affected dependency, or record an approved disposition before merge."
        )
    elif worst:
        status = WARNING
        summary = (
            "The Dependabot update touches a dependency with an open advisory; confirm the new "
            "version reaches the patched release."
            if author == "dependabot[bot]"
            else "A dependency changed by this pull request has an open advisory that needs triage."
        )
        attention.append("Review the advisory and update or disposition the affected dependency.")
    elif lockfile_missing:
        status = WARNING
        summary = "The dependency manifest changed without its lockfile."
    elif not names and high_repo:
        status = WARNING
        summary = (
            "Dependencies changed, but their names could not be read, so open high or critical "
            "advisories could not be attributed."
        )
        attention.append(
            "Provide readable dependency patches or confirm manually that no changed dependency "
            "has an open high or critical advisory."
        )
    else:
        status = PASSED
        summary = (
            "Dependency changes in this pull request have no matching open advisory and keep the "
            "manifest and lockfile consistent."
        )
    if config_changed and status == PASSED:
        status = WARNING
        summary = "Dependencies are healthy, but the Dependabot configuration changed."
    return _category("dependency-health", status, summary, details, attention)


# ---------------------------------------------------------------------------
# 4. PR Scope Verification
# ---------------------------------------------------------------------------


def pr_scope_category(evidence):
    pr = evidence.get("pull_request")
    files = evidence.get("files")
    comments = evidence.get("comments") or []
    owner = evidence.get("owner") or ""
    try:
        report = scope.validate(pr, files, comments, owner)
    except (scope.ScopeError, ReportError) as error:
        return _category(
            "pr-scope",
            FAILED,
            "The scope declaration cannot be verified: %s" % error,
            ["The scope checker could not evaluate the declaration against the diff."],
            [
                "Fix the PR description scope declaration: %s" % error,
                "Keep every declared path exact and add one purpose per changed file.",
            ],
        )

    details = [
        "Changed paths checked: %d." % len(report.get("changed_paths", [])),
        "Every changed file has a declared purpose: %s."
        % ("yes" if report.get("file_purposes") else "no"),
        "Exact-path declaration, scope-expansion validation and owner-approval digests are "
        "enforced; a description alone never approves an expansion.",
    ]
    if report.get("scope_expansion"):
        details.append(
            "Scope expansion declared for: %s."
            % ", ".join(report["scope_expansion"])
        )
    if report.get("scope_change_statement"):
        details.append(
            "Declared \"%s\" explanation: %s."
            % (SCOPE_CHANGE_PHRASE, report["scope_change_statement"])
        )
    for name, approval in (report.get("approvals") or {}).items():
        details.append(
            "%s approval: %s (`%s`)."
            % (
                name,
                "APPROVED" if approval.get("approved") else "PENDING",
                approval.get("command"),
            )
        )
    if report.get("visual_changes"):
        details.append(
            "%d path(s) can affect rendering; automated Playwright verification is responsible "
            "for browser evidence and is not required from the submitter."
            % len(report["visual_changes"])
        )
    for warning in report.get("warnings") or []:
        details.append("Reviewer warning: %s" % warning)

    attention = list(report.get("errors") or [])
    if report.get("status") == "FAIL":
        status = FAILED
        summary = "The declared scope does not match the actual diff or a required approval is missing."
    elif report.get("warnings"):
        status = WARNING
        summary = "Scope matches the diff; a reviewer warning needs attention."
    else:
        status = PASSED
        summary = "Every changed file is declared with an accurate purpose."
    return _category("pr-scope", status, summary, details, attention)


# ---------------------------------------------------------------------------
# 5. Protected File Changes
# ---------------------------------------------------------------------------


def protected_files_category(evidence):
    body = _plain_text((evidence.get("pull_request") or {}).get("body"))
    try:
        changed = scope.changed_paths(evidence.get("files"))
    except scope.ScopeError as error:
        return _category(
            "protected-files",
            FAILED,
            "Protected-file detection failed closed: %s" % error,
            ["The changed-file list could not be verified, so authorization cannot be assumed."],
            ["Repair the changed-file evidence; protected-file authorization cannot be skipped."],
        )

    protected_changed = sorted(path for path in changed if path in PROTECTED_FILES)
    details = []
    attention = []
    if not protected_changed:
        return _category(
            "protected-files",
            PASSED,
            "No protected files were changed; the human authorization gate is not required.",
            [
                "Protected-file detection, authorization requirements and fail-closed behaviour "
                "are unchanged."
            ],
        )

    details.append("Protected file(s) changed: %s." % ", ".join(protected_changed))
    declaration_present = PROTECTED_DECLARATION in body
    gate_status, gate_detail, gate_run = _check_state(evidence, PROTECTED_AUTHORIZATION_CHECK)

    if declaration_present:
        details.append(
            "The required protected-file authorization declaration is present. It is the "
            "submitter's attestation and does not replace the human authorization gate."
        )
    else:
        attention.append(
            "Add the exact declaration to the PR description when the task explicitly authorizes "
            "the protected-file change: `%s`" % PROTECTED_DECLARATION
        )
    if gate_run:
        details.append(
            "`%s` on head `%s`: %s (%s)."
            % (
                PROTECTED_AUTHORIZATION_CHECK,
                (gate_run.get("head_sha") or "unknown")[:12],
                gate_status,
                gate_detail,
            )
        )
    else:
        details.append(
            "`%s` has no completed run on the current head; the environment-protected human "
            "approval is still required." % PROTECTED_AUTHORIZATION_CHECK
        )

    if not declaration_present or gate_status == FAILED:
        status = FAILED
        summary = (
            "Protected files changed without the required authorization declaration."
            if not declaration_present
            else "The protected-file human authorization gate failed."
        )
    elif gate_status == PASSED:
        status = PASSED
        summary = "Protected change declared and the human authorization gate recorded approval."
    else:
        status = WARNING
        summary = (
            "Protected change declared; the separate human authorization gate is not yet recorded."
        )
        attention.append(
            "Obtain repository-owner approval in the environment-protected human authorization "
            "gate; the declaration alone is not approval and does not replace that gate."
        )
    return _category("protected-files", status, summary, details, attention)


# ---------------------------------------------------------------------------
# 6. Verification Integrity
# ---------------------------------------------------------------------------


def _audit_status(record):
    """Translate the audit vocabulary into the seven-category vocabulary."""
    status = (record.get("status") or "").upper()
    if status == "PASS":
        return PASSED
    if status == "FAIL":
        return FAILED
    if status == "PENDING":
        return WARNING
    return NOT_RUN


def verification_integrity_category(evidence):
    report = evidence.get("verification")
    if not isinstance(report, dict):
        return _category(
            "verification-integrity",
            NOT_RUN,
            "No current-head verification audit is available for this report.",
            [
                "The audit that matches check runs to the current HEAD SHA could not produce a "
                "report."
            ],
            ["Re-run the Verification Integrity audit for this pull request."],
        )

    pr = report.get("pr") if isinstance(report.get("pr"), dict) else {}
    head_sha = pr.get("head_sha") or ""
    current_head = _head_sha(evidence)
    required = report.get("required_checks")
    conditional = report.get("conditional_checks")
    stale = report.get("stale_check_runs") or []
    head_commit = (
        report.get("head_commit") if isinstance(report.get("head_commit"), dict) else {}
    )
    directives = head_commit.get("skip_directives") or []

    # Fail closed: an empty or malformed audit is not evidence that anything
    # ran. Every required record must also be readable.
    if (
        not isinstance(required, list)
        or not required
        or not all(isinstance(record, dict) for record in required)
        or not isinstance(conditional, list)
        or not all(isinstance(record, dict) for record in conditional)
    ):
        return _category(
            "verification-integrity",
            NOT_RUN,
            "The current-head verification audit is empty or malformed, so no result is claimed.",
            [
                "The audit must contain at least one required check and readable check lists.",
                "An empty or misshapen audit is never reported as passed.",
            ],
            ["Re-run the Verification Integrity audit for this pull request."],
        )
    if not current_head:
        return _category(
            "verification-integrity",
            FAILED,
            "The pull request has no current HEAD SHA, so verification cannot be proven.",
            ["No current head is available to match the audit against."],
            ["Re-run verification against the current head."],
        )
    if head_sha != current_head:
        return _category(
            "verification-integrity",
            FAILED,
            "The verification audit describes a different commit than the current PR HEAD.",
            [
                "Audit head: `%s`." % (head_sha or "missing"),
                "Current PR head: `%s`." % current_head,
                "An audit for another commit is never accepted as current-head evidence.",
            ],
            ["Re-run the verification audit against the current head."],
        )

    details = [
        "Results are audited against head `%s`." % head_sha,
        "Check runs attached to earlier commits are ignored and are never accepted as proof "
        "that the latest commit passed.",
    ]
    for record in required:
        details.append(
            "%s (required): %s — %s"
            % (record.get("name"), _audit_status(record), record.get("detail"))
        )
    for record in conditional:
        details.append(
            "%s (conditional): %s — %s"
            % (record.get("name"), _audit_status(record), record.get("detail"))
        )
    if stale:
        details.append(
            "%d check run(s) belong to earlier commits and were excluded: %s."
            % (
                len(stale),
                ", ".join(
                    "%s on %s" % (item.get("name") or "unnamed", (item.get("head_sha") or "unknown")[:12])
                    for item in stale[:10]
                ),
            )
        )

    attention = []
    required_statuses = [_audit_status(record) for record in required]
    conditional_statuses = [_audit_status(record) for record in conditional]
    observed = required_statuses + conditional_statuses
    no_runs = bool(observed) and all(status == NOT_RUN for status in observed)

    if directives:
        status = FAILED
        summary = "The head commit carries a CI-skip directive, so its checks did not run."
        attention.append(
            "Remove the CI-skip directive and push a commit that runs the required checks."
        )
    elif FAILED in required_statuses or FAILED in conditional_statuses:
        status = FAILED
        summary = "At least one required check failed on the current head."
        attention.append("Fix the failed checks and re-run verification on the new head.")
    elif no_runs:
        status = NOT_RUN
        summary = "No verification result exists for the current head; that is not a pass."
        attention.append("Wait for the required checks to run on the current head.")
    elif any(item in {WARNING, NOT_RUN} for item in required_statuses):
        status = WARNING
        summary = "Required verification on the current head is incomplete."
        for record in required:
            if _audit_status(record) != PASSED:
                attention.append(
                    "%s is %s on the current head: %s"
                    % (record.get("name"), _audit_status(record), record.get("detail"))
                )
    elif any(item == WARNING for item in conditional_statuses):
        status = WARNING
        summary = "A conditional check is still running on the current head."
        attention.append("Wait for the running conditional checks to finish.")
    else:
        status = PASSED
        summary = "Every required check completed successfully against the current head."
        if any(item == NOT_RUN for item in conditional_statuses):
            details.append(
                "At least one conditional check did not run for this change set; it is reported "
                "as NOT RUN and is not counted as a pass."
            )
    return _category("verification-integrity", status, summary, details, attention)


# ---------------------------------------------------------------------------
# 6. Governance and Workflow Verification
# ---------------------------------------------------------------------------


def governance_category(evidence):
    body = _plain_text((evidence.get("pull_request") or {}).get("body"))
    files = _flatten(evidence.get("files") or [])
    changed = {
        record.get("filename")
        for record in files
        if isinstance(record, dict) and record.get("filename")
    }

    values = {
        key: _label_value(body, label) for key, label in GOVERNANCE_LABELS.items()
    }
    missing = []
    attention = []
    details = [
        "Governance declarations in the PR description are submitter-reported. They are reported "
        "as available evidence and are never presented as facts proven by this checker."
    ]

    stages = values["stages"].casefold()
    absent_stages = [word for word in GOVERNANCE_STAGE_WORDS if word not in stages]
    if _placeholder(values["stages"]):
        missing.append(GOVERNANCE_LABELS["stages"])
    elif absent_stages:
        missing.append(
            "%s (missing: %s)"
            % (GOVERNANCE_LABELS["stages"], ", ".join(absent_stages))
        )
    else:
        details.append("Spec Kit stages declared: %s." % values["stages"])

    declared_artifacts = sorted(
        set(
            re.findall(
                r"(?:specs|\.specify/features)/[A-Za-z0-9._-]+/(?:spec|plan|tasks)\.md",
                values["artifacts"],
            )
        )
    )
    if _placeholder(values["artifacts"]):
        missing.append(GOVERNANCE_LABELS["artifacts"])
    else:
        absent = [
            path
            for path in declared_artifacts
            if PurePosixPath(path).name in {"spec.md", "plan.md", "tasks.md"}
            and path not in changed
        ]
        details.append(
            "Spec Kit artifacts declared: %s."
            % (", ".join(declared_artifacts) or "none named")
        )
        for name in ("spec.md", "plan.md", "tasks.md"):
            if not any(PurePosixPath(path).name == name for path in declared_artifacts):
                missing.append("%s (no artifact path named)" % GOVERNANCE_LABELS["artifacts"])
                break
        if absent:
            details.append(
                "Declared artifact(s) not present in this pull request diff: %s."
                % ", ".join(absent)
            )
            attention.append(
                "Confirm the declared Spec Kit artifacts are committed in this PR or correct the "
                "declared paths."
            )

    for key in ("task_groups", "library", "memory"):
        value = values[key]
        if _placeholder(value):
            missing.append(GOVERNANCE_LABELS[key])
        else:
            details.append("%s: %s" % (GOVERNANCE_LABELS[key], value.rstrip(".")) + ".")

    for label in missing:
        attention.append("Complete the required PR description reporting: %s." % label)

    if missing:
        status = FAILED
        summary = "Required governance and workflow reporting is missing from the PR description."
    elif attention:
        status = WARNING
        summary = "Governance reporting is present, but declared artifacts are not evidenced in this diff."
    else:
        status = PASSED
        summary = (
            "Required governance declarations are present and the declared Spec Kit artifacts "
            "appear in this diff."
        )
    return _category("governance", status, summary, details, attention)


# ---------------------------------------------------------------------------
# Report assembly and rendering
# ---------------------------------------------------------------------------


def build_report(evidence):
    """Build the seven-category report from one evidence bundle."""
    if not isinstance(evidence, dict):
        raise ReportError("the evidence bundle must be a JSON object")
    pr = evidence.get("pull_request")
    if not isinstance(pr, dict):
        raise ReportError("the pull request evidence is missing")
    categories = [
        qa_checker_category(evidence),
        devskim_category(evidence),
        pr_scope_category(evidence),
        protected_files_category(evidence),
        verification_integrity_category(evidence),
        governance_category(evidence),
        dependency_health_category(evidence),
    ]
    expected = [key for key, _name in CATEGORIES]
    if [item["id"] for item in categories] != expected:
        raise ReportError("the report must contain exactly the seven checker categories")
    for item in categories:
        if item["status"] not in STATUSES:
            raise ReportError("unsupported report status: %s" % item["status"])

    if any(item["status"] == FAILED for item in categories):
        overall = FAILED
    elif any(item["status"] == WARNING for item in categories):
        overall = WARNING
    elif any(item["status"] == NOT_RUN for item in categories):
        overall = NOT_RUN
    else:
        overall = PASSED

    return {
        "marker": REPORT_MARKER,
        "title": REPORT_TITLE,
        "pr_number": pr.get("number"),
        "head_sha": _head_sha(evidence),
        "overall_status": overall,
        "categories": categories,
        "supporting_checks": _supporting_rows(evidence),
    }


def _render_supporting_table(rows):
    lines = ["| Check | Purpose | Status on current head | Evidence |", "| --- | --- | --- | --- |"]
    for row in rows:
        evidence = row.get("url") or row.get("detail") or "no run"
        lines.append(
            "| %s | %s | **%s** | %s |"
            % (row["name"], row["purpose"], row["status"], evidence)
        )
    return lines


def render_comment(report, limit=LIMIT):
    """Render the one sticky consolidated report, always under the body cap."""
    head = report.get("head_sha") or "unknown"
    lines = [
        report["marker"],
        "## " + report["title"],
        "",
        "- Pull request: #%s" % report.get("pr_number"),
        "- Current PR head: `%s`" % head,
        "- Overall: **%s**" % report.get("overall_status"),
        "",
        "The report is updated in place on every run and always describes the current head. "
        "A result from an earlier commit is never accepted as proof that the latest commit passed.",
        "",
        "| # | Checker category | Status | Summary |",
        "| --- | --- | --- | --- |",
    ]
    for index, item in enumerate(report["categories"], start=1):
        lines.append(
            "| %d | %s | **%s** | %s |"
            % (index, item["name"], item["status"], item["summary"])
        )
    lines.extend(["", "### Supporting automated results (QA Checker)", ""])
    lines.extend(_render_supporting_table(report.get("supporting_checks") or []))

    attention = [
        (item["name"], item)
        for item in report["categories"]
        if item["status"] != PASSED and item.get("attention")
    ]
    lines.extend(["", "### Required attention", ""])
    if attention:
        for name, item in attention:
            lines.append("**%s — %s**" % (name, item["status"]))
            lines.append("")
            lines.extend("- %s" % entry for entry in item["attention"])
            lines.append("")
    else:
        lines.extend(["No category requires attention.", ""])

    for index, item in enumerate(report["categories"], start=1):
        lines.extend(
            [
                "### %d. %s — %s" % (index, item["name"], item["status"]),
                "",
                item["summary"],
                "",
            ]
        )
        details = item.get("details") or []
        rendered = []
        for entry in details:
            if "\n" in entry:
                rendered.append(entry)
            else:
                rendered.append("- %s" % entry)
        lines.extend(rendered)
        lines.append("")

    lines.extend(
        [
            "---",
            "",
            "Statuses are limited to `PASSED`, `FAILED`, `WARNING` and `NOT RUN`. A missing, "
            "skipped, cancelled, incomplete or outdated result is never shown as passed. "
            "The PR description carries the submitter's declarations and documentation; this "
            "report publishes the checker results for the current head.",
        ]
    )
    body = "\n".join(lines).rstrip() + "\n"
    if len(body.encode("utf-8")) <= limit:
        return body

    # Drop detail blocks from the end of each category before ever truncating a
    # finding or the mandatory category table.
    for budget in (24, 16, 10, 6, 3, 1):
        trimmed = []
        for item in report["categories"]:
            item = dict(item)
            item["details"] = (item.get("details") or [])[:budget]
            trimmed.append(item)
        lines = [
            report["marker"],
            "## " + report["title"],
            "",
            "- Pull request: #%s" % report.get("pr_number"),
            "- Current PR head: `%s`" % head,
            "",
            "| # | Checker category | Status | Summary |",
            "| --- | --- | --- | --- |",
        ]
        for index, item in enumerate(trimmed, start=1):
            lines.append(
                "| %d | %s | **%s** | %s |"
                % (index, item["name"], item["status"], item["summary"])
            )
        lines.extend(["", "### Supporting automated results (QA Checker)", ""])
        lines.extend(_render_supporting_table(report.get("supporting_checks") or []))
        lines.extend(["", "### Category details", ""])
        for index, item in enumerate(trimmed, start=1):
            lines.extend(["#### %d. %s — %s" % (index, item["name"], item["status"]), ""])
            if item.get("attention"):
                lines.extend("- Needs attention: %s" % entry for entry in item["attention"])
            lines.extend(
                (entry if "\n" in entry else "- %s" % entry)
                for entry in item.get("details") or []
            )
            lines.append("")
        lines.append("_Detail blocks were shortened to keep this report under the size cap._")
        body = "\n".join(lines).rstrip() + "\n"
        if len(body.encode("utf-8")) <= limit:
            return body
    # Slice the encoded bytes, never the code points: the em dashes used in the
    # category headings are multi-byte, so a character slice can exceed the
    # byte budget. Decoding with ``ignore`` keeps the tail valid UTF-8.
    encoded = body.encode("utf-8")[: limit - 2]
    return encoded.decode("utf-8", errors="ignore") + "\n"


def _read_json(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def _read_optional(path):
    if not path:
        return None
    try:
        return _read_json(path)
    except (OSError, json.JSONDecodeError):
        return None


def build_parser():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--pull-request", required=True, help="GitHub pull request JSON")
    parser.add_argument("--files", required=True, help="GitHub changed-file records JSON")
    parser.add_argument("--comments", help="GitHub issue comment records JSON")
    parser.add_argument("--owner", required=True, help="repository owner login")
    parser.add_argument("--checks", help="check runs JSON for the current head")
    parser.add_argument("--verification", help="current-head verification audit JSON")
    parser.add_argument("--alerts", help="code-scanning alerts JSON")
    parser.add_argument(
        "--dependency-alerts", help="open Dependabot dependency advisory records JSON"
    )
    parser.add_argument("--comment", help="write the sticky pull request comment here")
    parser.add_argument("--summary", help="append the report to this Markdown file")
    parser.add_argument("--json", help="write the machine-readable report here")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        evidence = {
            "pull_request": _read_json(args.pull_request),
            "files": _read_json(args.files),
            "comments": _read_json(args.comments) if args.comments else [],
            "owner": args.owner,
        }
    except (OSError, json.JSONDecodeError) as error:
        # Missing or unreadable evidence is a render error (2), not a failed
        # category (1); the workflow reports it separately.
        print("PR verification report could not be built: %s" % error, file=sys.stderr)
        return 2
    checks = _read_optional(args.checks)
    if checks is not None:
        evidence["check_runs"] = checks
    verification = _read_optional(args.verification)
    if verification is not None:
        evidence["verification"] = verification
    alerts = _read_optional(args.alerts)
    if alerts is not None:
        evidence["alerts"] = alerts
    elif args.alerts:
        evidence["alerts"] = {"message": "the code-scanning alerts could not be read"}
    dependency_alerts = _read_optional(args.dependency_alerts)
    if dependency_alerts is not None:
        evidence["dependabot_alerts"] = dependency_alerts
    elif args.dependency_alerts:
        evidence["dependabot_alerts"] = {
            "message": "the Dependabot alerts could not be read"
        }

    try:
        report = build_report(evidence)
    except (OSError, json.JSONDecodeError, ReportError, scope.ScopeError) as error:
        print("PR verification report could not be built: %s" % error, file=sys.stderr)
        return 2

    markdown = render_comment(report)
    print(markdown)
    if args.comment:
        with open(args.comment, "w", encoding="utf-8") as handle:
            handle.write(markdown)
    if args.summary:
        with open(args.summary, "a", encoding="utf-8") as handle:
            handle.write(markdown)
    if args.json:
        with open(args.json, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2, sort_keys=True)
            handle.write("\n")
    return 0 if report["overall_status"] != FAILED else 1


if __name__ == "__main__":
    raise SystemExit(main())
