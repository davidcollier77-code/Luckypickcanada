#!/usr/bin/env python3
"""Review added pull-request lines for a small set of verified risks.

This is intentionally not a second general-purpose scanner. DevSkim and CodeQL
remain the broad security scanners; TypeScript, Vitest, Playwright and the
production build remain the broad correctness and reliability checks. This
reviewer adds narrow, patch-level evidence for:

* private key blocks, recognizable provider tokens and merge markers (hard);
* unsafe HTML/code-execution sinks, insecure links, hardcoded credential
  assignments and dependency additions (advisory warnings).

Every finding names the changed file, the new-file line, the rule, a confidence
level, and the matched excerpt. Placeholder and environment-variable patterns
are suppressed for advisory rules. Findings are deduplicated.

Read-only: no network request is made here. The workflow supplies GitHub's
changed-file records, including their unified-diff patches.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter

HARD = "hard"
WARNING = "warning"
CONFIDENCE_HIGH = "high"
CONFIDENCE_MEDIUM = "medium"

PRIVATE_KEY_PATTERN = re.compile(
    r"-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----"
)
PROVIDER_TOKEN_PATTERNS = (
    ("aws-access-key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("github-token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,}\b")),
    ("stripe-live-secret", re.compile(r"\bsk_live_[0-9A-Za-z]{24,}\b")),
    ("slack-token", re.compile(r"\bxox[baprs]-[0-9A-Za-z-]{10,}\b")),
    ("google-api-key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
)
CONFLICT_PATTERN = re.compile(r"^(?:<{7}|={7}|>{7})(?:\s|$)")
SECRET_ASSIGNMENT_PATTERN = re.compile(
    r"(?i)\b(?:password|passwd|secret|api[_-]?key|access[_-]?token|"
    r"auth[_-]?token|private[_-]?key)\b\s*[:=]\s*[\"'][^\"']{12,}[\"']"
)
UNSAFE_HTML_PATTERN = re.compile(
    "dangerouslySet"
    + "InnerHTML|innerHTML\\s*=|outerHTML\\s*=|document\\.write\\(|"
    + "insertAdjacentHTML\\(|\\beval\\(|new Function\\("
)
INSECURE_URL_PATTERN = re.compile(
    r"(?i)(?:^|(?<=[^\w:/]))http://" + r"([^\s\"'<>]+)"
)
TARGET_BLANK_PATTERN = re.compile(r"(?i)target\s*=\s*[\"']_blank[\"']")
NOOPENER_PATTERN = re.compile(r"(?i)rel\s*=\s*[\"'][^\"']*noopener")
PACKAGE_ENTRY_PATTERN = re.compile(r'^\s*"([^"]+)"\s*:\s*"[^"]+"')
QUALITY_SUPPRESSION_PATTERN = re.compile(
    r"(?:(?:^|(?<=//)|(?<=#))\s*.*?)?(?:@ts-(?:ignore|nocheck)\b|eslint-disable(?:-next-line|-line)?\b)"
)
DEBUGGER_PATTERN = re.compile(r"^\s*debugger\s*;?\s*$")
DEPRECATED_API_PATTERN = re.compile(
    r"\bdocument\.execCommand\b|\bcomponentWillMount\b|"
    r"\bcomponentWillReceiveProps\b|\bReactDOM\.render\("
)
PLACEHOLDER_PATTERN = re.compile(
    r"(?i)(?:example|placeholder|dummy|fake|redacted|your[_-]?|replace[_-]?me|"
    r"changeme|xxxx|sample|do[ -]?not[ -]?use)"
)
ENVIRONMENT_LOOKUP_PATTERN = re.compile(
    r"(?i)(?:process\.env|os\.environ|os\.getenv|getenv\(|env\[|secrets?\.|"
    r"secret[_-]?manager|vault)"
)
EXCLUDED_PACKAGE_KEYS = frozenset(
    {
        "name",
        "version",
        "private",
        "description",
        "main",
        "module",
        "types",
        "type",
        "license",
        "author",
        "homepage",
        "repository",
        "bugs",
        "scripts",
        "engines",
        "packageManager",
        "node",
        "npm",
        "pnpm",
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies",
    }
)
KNOWN_EXAMPLE_TOKENS = frozenset({"AKIAIOSFODNN7EXAMPLE"})


class ReviewError(ValueError):
    """The changed-file evidence cannot be reviewed safely."""


def _documentation_path(path: str) -> bool:
    return (
        path.startswith(("specs/", "memory-bank/", ".docs/"))
        or path.endswith((".md", ".mdx", ".txt", ".rst"))
    )


def _placeholder_or_environment_lookup(line: str) -> bool:
    return bool(
        PLACEHOLDER_PATTERN.search(line) or ENVIRONMENT_LOOKUP_PATTERN.search(line)
    )


def _is_known_example_token(line: str) -> bool:
    return any(token in line for token in KNOWN_EXAMPLE_TOKENS)


def _added_lines(patch: str):
    """Yield (new_file_line_number, line_text) for added lines only."""
    new_line = 0
    in_hunk = False
    for raw in patch.splitlines():
        if raw.startswith("@@"):
            match = re.search(r"\+(\d+)(?:,\d+)?", raw)
            if not match:
                in_hunk = False
                continue
            new_line = int(match.group(1))
            in_hunk = True
            continue
        if not in_hunk:
            continue
        if raw.startswith(("+++", "---")):
            continue
        if raw.startswith("+"):
            yield new_line, raw[1:]
            new_line += 1
        elif raw.startswith("-"):
            continue
        elif raw.startswith(" "):
            new_line += 1
        elif raw.startswith("\\"):
            continue


def _finding(
    path: str,
    line: int,
    rule: str,
    severity: str,
    confidence: str,
    message: str,
    recommendation: str,
    excerpt: str,
) -> dict:
    return {
        "path": path,
        "line": line,
        "rule": rule,
        "severity": severity,
        "confidence": confidence,
        "message": message,
        "recommendation": recommendation,
        "excerpt": excerpt.strip()[:180],
    }


def _line_findings(path: str, line: int, text: str, nearby_text: str = "") -> list[dict]:
    findings = []
    stripped = text.strip()
    if not stripped:
        return findings

    documentation = _documentation_path(path)

    if CONFLICT_PATTERN.match(stripped) and not (
        path.endswith(".md") and stripped.startswith("=======")
    ):
        findings.append(
            _finding(
                path,
                line,
                "merge-conflict-marker",
                HARD,
                CONFIDENCE_HIGH,
                "A merge-conflict marker was added to this file.",
                "Resolve the conflict and commit the intended content.",
                stripped,
            )
        )

    if PRIVATE_KEY_PATTERN.search(text):
        findings.append(
            _finding(
                path,
                line,
                "private-key-block",
                HARD,
                CONFIDENCE_HIGH,
                "A private key block was added to the repository.",
                "Remove the key, rotate it, and load the replacement from a secret store.",
                "[redacted private key block]",
            )
        )

    if not _is_known_example_token(text):
        for rule, pattern in PROVIDER_TOKEN_PATTERNS:
            if pattern.search(text):
                findings.append(
                    _finding(
                        path,
                        line,
                        rule,
                        HARD,
                        CONFIDENCE_HIGH,
                        "A provider token pattern was added to the repository.",
                        "Remove and rotate the token; use an environment or secret-manager reference.",
                        "[redacted provider token]",
                    )
                )

    if not documentation and not _placeholder_or_environment_lookup(text):
        if SECRET_ASSIGNMENT_PATTERN.search(text):
            findings.append(
                _finding(
                    path,
                    line,
                    "hardcoded-credential",
                    WARNING,
                    CONFIDENCE_MEDIUM,
                    "A credential-like value is assigned directly in code; the value may be a fixture or example.",
                    "Confirm the value is non-sensitive, or load it from the approved secret store.",
                    "[redacted credential-like assignment]",
                )
            )

    if not documentation and UNSAFE_HTML_PATTERN.search(text):
        findings.append(
            _finding(
                path,
                line,
                "unsafe-html-or-dynamic-code",
                WARNING,
                CONFIDENCE_MEDIUM,
                "A potentially unsafe HTML or dynamic-code sink was added; sanitization and input trust were not proven.",
                "Confirm the input is constant or sanitized, or use a safe rendering API.",
                stripped,
            )
        )

    if not documentation:
        combined = text + "
        if TARGET_BLANK_PATTERN.search(text) and not NOOPENER_PATTERN.search(combined):
            findings.append(
                _finding(
                    path,
                    line,
                    "target-blank-without-noopener",
                    WARNING,
                    CONFIDENCE_MEDIUM,
                    "A new-tab link does not include rel=noopener on the changed line or adjacent lines.",
                    "Add rel=\"noopener noreferrer\" or confirm the framework supplies it.",
                    stripped,
                )
            )
        url_match = INSECURE_URL_PATTERN.search(text)
        if url_match:
            authority = url_match.group(1).split("/", 1)[0]
            if authority.startswith("["):
                host = authority.split("]", 1)[0] + "]"
            else:
                host = authority.split(":", 1)[0]
            if host.casefold() not in {
                "localhost",
                "127.0.0.1",
                "0.0.0.0",
                "[::1]",
                "example.invalid",
            }:
                findings.append(
                    _finding(
                        path,
                        line,
                        "insecure-http-url",
                        WARNING,
                        CONFIDENCE_MEDIUM,
                        "An external http:// URL was added.",
                        "Use https:// for external resources, or confirm the endpoint cannot use TLS.",
                        stripped,
                    )
                )

    if not documentation and QUALITY_SUPPRESSION_PATTERN.search(text):
        findings.append(
            _finding(
                path,
                line,
                "type-or-lint-suppression",
                WARNING,
                CONFIDENCE_MEDIUM,
                "A type or lint suppression was added.",
                "Confirm the suppression is narrow and justified; fix the underlying error instead when practical.",
                stripped,
            )
        )

    if not documentation and DEBUGGER_PATTERN.match(text):
        findings.append(
            _finding(
                path,
                line,
                "debugger-statement",
                WARNING,
                CONFIDENCE_MEDIUM,
                "A debugger statement was added.",
                "Remove it before shipping unless the change is deliberately a debugging aid.",
                stripped,
            )
        )

    if not documentation and DEPRECATED_API_PATTERN.search(text):
        findings.append(
            _finding(
                path,
                line,
                "deprecated-api",
                WARNING,
                CONFIDENCE_MEDIUM,
                "A deprecated or legacy API was added.",
                "Confirm a supported replacement is not available and document the compatibility reason.",
                stripped,
            )
        )

    if path.endswith("package.json"):
        package_match = PACKAGE_ENTRY_PATTERN.match(text)
        if package_match and package_match.group(1) not in EXCLUDED_PACKAGE_KEYS:
            findings.append(
                _finding(
                    path,
                    line,
                    "dependency-addition",
                    WARNING,
                    CONFIDENCE_MEDIUM,
                    f"A dependency entry for {package_match.group(1)!r} was added or changed.",
                    "Confirm the package is necessary, reviewed, and reflected in the lockfile and build size.",
                    stripped,
                )
            )

    return findings


def review_files(file_records) -> dict:
    """Review GitHub changed-file records and return evidence-backed findings."""
    if not isinstance(file_records, list):
        raise ReviewError("GitHub changed-file evidence must be an array")
    if not file_records:
        raise ReviewError("GitHub returned no changed files; the review cannot run")

    findings = []
    reviewed = []
    skipped = []
    for record in file_records:
        if not isinstance(record, dict):
            raise ReviewError("GitHub changed-file evidence contains a malformed record")
        filename = record.get("filename")
        if not isinstance(filename, str) or not filename.strip():
            raise ReviewError("GitHub changed-file evidence contains a record without a filename")
        path = filename.strip()
        patch = record.get("patch")
        if not isinstance(patch, str) or not patch.strip():
            skipped.append(
                {
                    "path": path,
                    "reason": "GitHub did not provide a textual patch (binary, oversized, or unavailable).",
                }
            )
            continue
        reviewed.append(path)
        added = list(_added_lines(patch))
        for idx, (line_number, text) in enumerate(added):
            window = added[max(0, idx - 5):idx + 6]
            nearby_text = "
            findings.extend(_line_findings(path, line_number, text, nearby_text))

    deduplicated = {}
    for finding in findings:
        key = (
            finding["path"],
            finding["line"],
            finding["rule"],
            finding["excerpt"],
        )
        deduplicated.setdefault(key, finding)

    ordered = sorted(
        deduplicated.values(),
        key=lambda item: (
            0 if item["severity"] == HARD else 1,
            item["path"],
            item["line"],
            item["rule"],
        ),
    )
    counts = Counter(item["severity"] for item in ordered)
    hard_count = counts.get(HARD, 0)
    warning_count = counts.get(WARNING, 0)
    return {
        "status": "FAIL" if hard_count else "PASS",
        "reviewed_files": reviewed,
        "skipped_files": skipped,
        "findings": ordered,
        "hard_count": hard_count,
        "warning_count": warning_count,
        "note": (
            "Warnings are advisory and are not confirmed vulnerabilities. "
            "DevSkim, CodeQL, TypeScript, tests and reviewer judgment remain authoritative."
        ),
    }


def render_markdown(report: dict) -> str:
    lines = [
        "## Changed-code review: " + report["status"],
        "",
        f"- Text files reviewed: {len(report.get('reviewed_files', []))}",
        f"- Files without a textual patch: {len(report.get('skipped_files', []))}",
        f"- Hard findings: {report.get('hard_count', 0)}",
        f"- Advisory warnings: {report.get('warning_count', 0)}",
        "",
        report.get("note", ""),
    ]
    findings = report.get("findings", [])
    if findings:
        lines.extend(
            [
                "",
                "| Severity | Rule | Location | Confidence | Evidence |",
                "| --- | --- | --- | --- | --- |",
            ]
        )
        for item in findings:
            evidence = item["excerpt"].replace("|", "\\|")
            lines.append(
                "| %s | %s | `%s:%s` | %s | `%s` |"
                % (
                    item["severity"],
                    item["rule"],
                    item["path"],
                    item["line"],
                    item["confidence"],
                    evidence,
                )
            )
            lines.append(
                "|  |  |  |  | %s |"
                % item["recommendation"].replace("|", "\\|")
            )
    else:
        lines.extend(["", "No added-line findings were detected."])

    if report.get("skipped_files"):
        lines.extend(["", "Files not reviewed because GitHub supplied no textual patch:"])
        for item in report["skipped_files"]:
            lines.append(f"- `{item['path']}`: {item['reason']}")
    return "\n".join(lines) + "\n"


def _read_json(path: str):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--files", required=True, help="GitHub changed-file records JSON")
    parser.add_argument("--summary", help="append the Markdown report here")
    parser.add_argument("--json", help="write the machine-readable report here")
    args = parser.parse_args(argv)

    try:
        report = review_files(_read_json(args.files))
    except (OSError, json.JSONDecodeError, ReviewError) as error:
        report = {"status": "BLOCKED", "errors": [str(error)], "findings": []}
        if args.summary:
            with open(args.summary, "a", encoding="utf-8") as handle:
                handle.write("## Changed-code review: BLOCKED\n\n" + str(error) + "\n")
        if args.json:
            with open(args.json, "w", encoding="utf-8") as handle:
                json.dump(report, handle, indent=2)
        print(f"Changed-code review BLOCKED: {error}", file=sys.stderr)
        return 2

    markdown = render_markdown(report)
    if args.summary:
        with open(args.summary, "a", encoding="utf-8") as handle:
            handle.write(markdown)
    if args.json:
        with open(args.json, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2)
    print(markdown, end="")
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
