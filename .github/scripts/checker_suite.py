#!/usr/bin/env python3
"""Independent changed-code checkers that report on the pull request itself.

Each mode owns one responsibility and one sticky comment, so the general
code-defect reviewer does not accumulate unrelated duties:

* ``test-quality``  - weak tests: no assertion, tautological assertion,
                      un-restored module mock, unnamed snapshot.
* ``performance``   - resource leaks in the patch: interval, listener and
                      animation frame started without teardown.
* ``security-summary`` - open code-scanning alerts for the pull request, as
                      text on the PR page instead of only in the Security tab.
* ``browser-summary``  - Visual QA results after a run, so a failing or skipped
                      browser check is readable without opening the workflow.

Dependency-free, read-only and advisory: no network request is made here; the
workflow supplies the GitHub JSON. Findings never fail a required check.
"""

from __future__ import annotations

import argparse
import json
import re
import sys

LIMIT = 60000
WARNING = "warning"
CONFIRMED = "confirmed"
POTENTIAL = "potential"

MARKERS = {
    "test-quality": "<!-- qa-test-quality -->",
    "performance": "<!-- qa-performance -->",
    "security-summary": "<!-- qa-security-summary -->",
    "browser-summary": "<!-- qa-browser-summary -->",
}

TEST_PATH_PATTERN = re.compile(
    r"(?:^|/)(?:__tests__|tests)/|\.(?:test|spec)\.[cm]?[jt]sx?$"
)
CODE_SUFFIXES = (".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs")
DOCUMENTATION_PREFIXES = ("specs/", "memory-bank/", ".docs/")
DOCUMENTATION_SUFFIXES = (".md", ".mdx", ".txt", ".rst")

RUNNER_CALL = re.compile(r"^\s*(?:it|test)(?:\.\w+)?\s*\(")
ASSERTION = re.compile(
    r"\bexpect\s*\(|\bassert\b|\.should\b|\bassertThat\b|\bt\.(?:is|deepEqual)\b"
)
TAUTOLOGY = re.compile(
    r"expect\(\s*(true|false|-?\d+)\s*\)\s*\.\s*(?:toBe|toEqual|toStrictEqual)"
    r"\(\s*(true|false|-?\d+)\s*\)"
)
ALWAYS_TRUTHY = re.compile(r"expect\(\s*(true|false)\s*\)\s*\.\s*(toBeTruthy|toBeFalsy)\(\s*\)")
MOCK_CALL = re.compile(r"\b(?:jest|vi)\.mock\s*\(")
MOCK_CLEANUP = re.compile(
    r"\b(?:restoreAllMocks|resetAllMocks|clearAllMocks)\b|restoreMocks\s*:\s*true"
)
UNNAMED_SNAPSHOT = re.compile(r"\.toMatchSnapshot\(\s*\)")

RESOURCE_RULES = (
    (
        "interval-without-clear",
        re.compile(r"\bsetInterval\s*\("),
        re.compile(r"\bclearInterval\s*\("),
        "An interval is started but nothing in this patch clears it.",
        "Keep the id and clear it on unmount: `useEffect(() => { const id = setInterval(tick, 1000); return () => clearInterval(id); }, [])`.",
    ),
    (
        "listener-without-cleanup",
        re.compile(r"\baddEventListener\s*\("),
        re.compile(r"\bremoveEventListener\s*\("),
        "An event listener is added but nothing in this patch removes it.",
        "Return a cleanup that removes the same reference: `el.addEventListener('x', onX); return () => el.removeEventListener('x', onX);`.",
    ),
    (
        "animation-frame-without-cancel",
        re.compile(r"\brequestAnimationFrame\s*\("),
        re.compile(r"\bcancelAnimationFrame\s*\("),
        "An animation frame loop is started but nothing in this patch cancels it.",
        "Store the handle and cancel it when the loop should stop: `const id = requestAnimationFrame(tick); ... cancelAnimationFrame(id);`.",
    ),
)


def _flatten(records):
    """Flatten paginated GitHub file lists into one list of records."""
    flat = []
    for item in records if isinstance(records, list) else [records]:
        if isinstance(item, list):
            flat.extend(_flatten(item))
        else:
            flat.append(item)
    return flat


def _added_lines(patch):
    """Yield (new_file_line_number, line_text) for added lines only."""
    new_line = 0
    in_hunk = False
    for raw in (patch or "").splitlines():
        if raw.startswith("@@"):
            match = re.search(r"\+(\d+)(?:,\d+)?", raw)
            if not match:
                in_hunk = False
                continue
            new_line = int(match.group(1))
            in_hunk = True
            continue
        if not in_hunk or raw.startswith(("+++", "---")):
            continue
        if raw.startswith("+"):
            yield new_line, raw[1:]
            new_line += 1
        elif raw.startswith("-") or raw.startswith("\\"):
            continue
        elif raw.startswith(" "):
            new_line += 1


def _documentation_path(path):
    return path.startswith(DOCUMENTATION_PREFIXES) or path.endswith(DOCUMENTATION_SUFFIXES)


def _test_path(path):
    return bool(TEST_PATH_PATTERN.search(path))


def _code_path(path):
    return path.casefold().endswith(CODE_SUFFIXES) and not _documentation_path(path)


def _inline(text, limit=160):
    collapsed = " ".join((text or "").split())
    if len(collapsed) > limit:
        collapsed = collapsed[: limit - 1] + "…"
    return "`%s`" % collapsed.replace("`", "'")


def _finding(path, line, rule, what, evidence, suggestion, classification=POTENTIAL):
    return {
        "path": path,
        "line": line,
        "rule": rule,
        "severity": WARNING,
        "classification": classification,
        "message": what,
        "evidence": evidence,
        "suggestion": suggestion,
    }


def _render_finding(item):
    return "\n".join(
        [
            "- **%s · %s · %s** `%s:%s`"
            % (item["severity"], item["classification"], item["rule"], item["path"], item["line"]),
            "  - What happened: %s" % item["message"],
            "  - Evidence: %s" % _inline(item["evidence"]),
            "  - Suggested fix: %s" % item["suggestion"],
        ]
    )


def render_comment(mode, status, blocks, limit=LIMIT):
    """Render a sticky comment, dropping whole findings before cutting a fix."""
    marker = MARKERS[mode]
    header = [marker, "## %s" % _TITLES[mode], "", status, ""]
    body = list(header)
    used = len("\n".join(body)) + 1
    kept = 0
    for index, block in enumerate(blocks):
        cost = len(block) + 2
        if used + cost > limit:
            break
        body.append(block)
        used += cost
        kept = index + 1
    omitted = len(blocks) - kept
    if omitted:
        body.append(
            "_%d more finding(s) omitted; this comment is capped at %d bytes._"
            % (omitted, limit)
        )
    return "\n".join(body).rstrip() + "\n"


_TITLES = {
    "test-quality": "Test quality",
    "performance": "Performance",
    "security-summary": "Security alerts",
    "browser-summary": "Visual QA summary",
}


def _test_blocks(added):
    """Yield (start_line, lines) for runner blocks whose braces are all added."""
    index = 0
    while index < len(added):
        line_number, text = added[index]
        if not RUNNER_CALL.match(text) or "{" not in text:
            index += 1
            continue
        depth = 0
        collected = []
        end = index
        for cursor in range(index, len(added)):
            collected.append(added[cursor])
            depth += added[cursor][1].count("{") - added[cursor][1].count("}")
            end = cursor
            if depth <= 0:
                break
        if depth == 0:
            yield line_number, collected
            index = end + 1
        else:
            index += 1


def review_test_quality(file_records):
    """Report weak tests in changed test files."""
    findings = []
    for record in _flatten(file_records):
        path = record.get("filename") or ""
        if not _test_path(path):
            continue
        added = list(_added_lines(record.get("patch")))
        if not added:
            continue
        patch_text = "\n".join(text for _, text in added)

        for line, text in added:
            if TAUTOLOGY.search(text) or ALWAYS_TRUTHY.search(text):
                findings.append(
                    _finding(
                        path,
                        line,
                        "tautological-assertion",
                        "The assertion compares a literal with itself, so it cannot fail.",
                        text,
                        "Assert the behaviour instead: call the code and compare its result "
                        "with the expected value.",
                        CONFIRMED,
                    )
                )
            if UNNAMED_SNAPSHOT.search(text):
                findings.append(
                    _finding(
                        path,
                        line,
                        "unnamed-snapshot",
                        "An unnamed snapshot is written, so a reviewer cannot tell what it covers.",
                        text,
                        "Name the assertion: `.toMatchSnapshot('empty cart')`.",
                    )
                )

        for start, block in _test_blocks(added):
            body = "\n".join(text for _, text in block)
            if not ASSERTION.search(body):
                findings.append(
                    _finding(
                        path,
                        start,
                        "test-without-assertion",
                        "This test has no assertion, so it passes whatever the code does.",
                        block[0][1],
                        "Assert the observable result with `expect(...)` before the test ends, "
                        "or delete the test if it only exercises setup.",
                        CONFIRMED,
                    )
                )

        if MOCK_CALL.search(patch_text) and not MOCK_CLEANUP.search(patch_text):
            line, text = next((l, t) for l, t in added if MOCK_CALL.search(t))
            findings.append(
                _finding(
                    path,
                    line,
                    "mock-without-restore",
                    "A module is mocked and nothing in this patch restores the mock, so later tests inherit it.",
                    text,
                    "Restore between tests: call `vi.restoreAllMocks()` in `afterEach`, or set "
                    "`restoreMocks: true` in the test configuration.",
                )
            )
    return findings


def review_performance(file_records):
    """Report resource work that the patch starts without a teardown."""
    findings = []
    for record in _flatten(file_records):
        path = record.get("filename") or ""
        if not _code_path(path):
            continue
        added = list(_added_lines(record.get("patch")))
        if not added:
            continue
        patch_text = "\n".join(text for _, text in added)
        for rule, start, teardown, message, suggestion in RESOURCE_RULES:
            if not start.search(patch_text) or teardown.search(patch_text):
                continue
            line, text = next((l, t) for l, t in added if start.search(t))
            findings.append(_finding(path, line, rule, message, text, suggestion))
    return findings


def _alert_severity(alert):
    rule = alert.get("rule") or {}
    return (
        rule.get("security_severity_level")
        or rule.get("severity")
        or alert.get("rule", {}).get("severity")
        or "unknown"
    ).casefold()


def render_security_summary(alerts):
    """Render open code-scanning alerts supplied by the workflow."""
    if isinstance(alerts, dict):
        message = alerts.get("message") or "the code-scanning alerts could not be read"
        return render_comment(
            "security-summary",
            "**Unavailable** — %s. Security scanning itself is unchanged." % message,
            [],
        )
    items = [alert for alert in alerts if alert.get("state", "open") == "open"]
    if not items:
        return render_comment(
            "security-summary",
            "**PASS** — no open code-scanning alerts are reported for this pull request.",
            [],
        )
    rank = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    items.sort(key=lambda alert: rank.get(_alert_severity(alert), 0), reverse=True)
    worst = max((rank.get(_alert_severity(alert), 0) for alert in items), default=0)
    status = "**FAIL** — %d open alert(s); fix the high and critical ones before merging." % len(items)
    if worst <= 2:
        status = "**WARN** — %d open alert(s) reported for this pull request." % len(items)
    blocks = []
    for alert in items[:25]:
        rule = alert.get("rule") or {}
        instance = alert.get("most_recent_instance") or {}
        location = instance.get("location") or {}
        path = location.get("path") or "unknown file"
        line = location.get("start_line") or 1
        tool = ((rule.get("tool") or {}).get("name")) or "scanner"
        text = (instance.get("message") or {}).get("text") or rule.get("description") or rule.get("name") or "alert"
        url = alert.get("html_url") or ""
        blocks.append(
            _render_finding(
                {
                    "severity": _alert_severity(alert),
                    "classification": "confirmed",
                    "rule": "%s/%s" % (tool, rule.get("id") or rule.get("name") or "rule"),
                    "path": path,
                    "line": line,
                    "message": text,
                    "evidence": rule.get("description") or text,
                    "suggestion": "Open the alert and apply the scanner's remediation%s."
                    % (" (%s)" % url if url else ""),
                }
            )
        )
    return render_comment("security-summary", status, blocks)


def render_browser_summary(check_runs):
    """Render the Visual QA result for one head, never counting a skip as a pass."""
    runs = []
    for run in (check_runs or {}).get("check_runs", []):
        if str(run.get("name", "")).startswith("Visual QA"):
            runs.append(run)
    if not runs:
        return render_comment(
            "browser-summary",
            "**NOT RUN** — no Visual QA check is visible for this head yet.",
            [],
        )
    failed = [
        run
        for run in runs
        if run.get("conclusion") in {"failure", "timed_out", "cancelled", "action_required"}
    ]
    skipped = [run for run in runs if run.get("conclusion") == "skipped"]
    if failed:
        status = "**FAIL** — %d Visual QA check(s) did not pass." % len(failed)
        blocks = [
            _render_finding(
                {
                    "severity": "error",
                    "classification": "confirmed",
                    "rule": "visual-qa",
                    "path": str(run.get("name")),
                    "line": 1,
                    "message": "The %s check finished as %s."
                    % (run.get("name"), run.get("conclusion")),
                    "evidence": run.get("details_url") or run.get("html_url") or "",
                    "suggestion": "Open the run, read the failing test and baseline diff, then "
                    "update the code or the approved baseline: %s"
                    % (run.get("html_url") or run.get("details_url") or ""),
                }
            )
            for run in failed
        ]
        return render_comment("browser-summary", status, blocks)
    if skipped:
        return render_comment(
            "browser-summary",
            "**PASS for non-browser checks; browser shards NOT RUN** — %d Visual QA "
            "check(s) were skipped for this change set, which is not a browser pass."
            % len(skipped),
            [],
        )
    return render_comment(
        "browser-summary",
        "**PASS** — every Visual QA check passed on this head.",
        [],
    )


def _exit(text):
    sys.stdout.write(text.rstrip() + "\n")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("mode", choices=sorted(MARKERS))
    parser.add_argument("--files")
    parser.add_argument("--alerts")
    parser.add_argument("--checks")
    parser.add_argument("--comment")
    args = parser.parse_args(argv)

    if args.mode in {"test-quality", "performance"}:
        with open(args.files, encoding="utf-8") as handle:
            records = json.load(handle)
        findings = (
            review_test_quality(records)
            if args.mode == "test-quality"
            else review_performance(records)
        )
        if not findings:
            _exit("%s: no findings." % args.mode)
            return 0
        status = "**WARN** — %d finding(s); these are advisory." % len(findings)
        body = render_comment(
            args.mode, status, [_render_finding(item) for item in findings]
        )
        _exit("%s: %d finding(s)." % (args.mode, len(findings)))
    elif args.mode == "security-summary":
        with open(args.alerts, encoding="utf-8") as handle:
            body = render_security_summary(json.load(handle))
        _exit("security-summary rendered.")
    else:
        with open(args.checks, encoding="utf-8") as handle:
            body = render_browser_summary(json.load(handle))
        _exit("browser-summary rendered.")

    if args.comment:
        with open(args.comment, "w", encoding="utf-8") as handle:
            handle.write(body)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
