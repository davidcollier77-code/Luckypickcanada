#!/usr/bin/env python3
"""Review added pull-request lines for a small set of verified risks.

This is intentionally not a second general-purpose scanner. DevSkim and CodeQL
remain the broad security scanners; TypeScript, Vitest, Playwright and the
production build remain the broad correctness and reliability checks. This
reviewer adds narrow, patch-level evidence for:

* private key blocks, recognizable provider tokens and merge markers (hard);
* unsafe HTML/code-execution sinks, insecure links, hardcoded credential
  assignments and dependency additions (advisory warnings);
* focused tests, floating promises in `forEach`, empty catch blocks and
  unused imports in fully added files (advisory warnings).

Every finding names the changed file, the new-file line, the rule, a severity, a
confidence level, whether it is a confirmed defect or a potential concern, the
matched excerpt, a short recommendation, and a concrete suggested fix that a
developer can apply or reject without asking what was meant. Placeholder and
environment-variable patterns are suppressed for advisory rules. Findings are
deduplicated by location and rule, so the same defect reported twice for
different excerpts collapses to one entry.

The report also states which verification it suggests. Playwright visual or
performance work is suggested only when the change set actually touches
rendering or performance-sensitive paths; documentation, tooling, CI and
unit-test-only changes are told plainly that no browser verification is
suggested. The Visual QA workflow remains the authority for what CI requires.

Read-only: no network request is made here. The workflow supplies GitHub's
changed-file records, including their unified-diff patches.
"""

from __future__ import annotations

import argparse
import fnmatch
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
    r"(?i)(?<![\w:/])http" + "://" + r"([^\s\"'<>]+)"
)
TARGET_BLANK_PATTERN = re.compile(r"(?i)target\s*=\s*[\"']_blank[\"']")
NOOPENER_PATTERN = re.compile(r"(?i)rel\s*=\s*[\"'][^\"']*noopener")
PACKAGE_ENTRY_PATTERN = re.compile(r'^\s*"([^"]+)"\s*:\s*"[^"]+"')
# Match the directive itself; comment context is required separately so an
# example inside a string literal or documentation prose is not reported.
QUALITY_SUPPRESSION_PATTERN = re.compile(
    r"(?i)@ts-(?:ignore|nocheck)\b|eslint-disable(?:-next-line|-line)?\b"
)
DEBUGGER_PATTERN = re.compile(r"^\s*debugger\s*;?\s*$")
DEPRECATED_API_PATTERN = re.compile(
    r"\bdocument\.execCommand\b|\bcomponentWillMount\b|"
    r"\bcomponentWillReceiveProps\b|\bReactDOM\.render\("
)
# A committed focused test silently shrinks the suite: everything else in the
# file stops running. Only runner calls are matched, not a `.only` property read.
FOCUSED_TEST_PATTERN = re.compile(
    r"\b(?:describe|it|test|context|suite|fit|fdescribe)\s*\.\s*only\s*\("
)
# `forEach(async ...)` cannot be awaited, so its promises float: rejections are
# lost and the loop finishes before the work does. `map(async ...)` is excluded
# because collecting promises and awaiting them is a valid, common pattern.
AWAIT_IN_FOR_EACH_PATTERN = re.compile(r"\.\s*forEach\s*\(\s*async\b")
# An empty catch swallows the failure, including resource and validation errors.
EMPTY_CATCH_PATTERN = re.compile(r"\bcatch\s*(?:\([^)]*\))?\s*\{\s*\}\s*;?\s*$")
IMPORT_STATEMENT_PATTERN = re.compile(
    r"^\s*import\s+(?:type\s+)?(.*?)\s*from\s*['\"]", re.DOTALL
)
# `React` is imported by convention; an unused default import is not evidence of
# a defect in this codebase, so it is never reported as an unused binding.
IGNORED_IMPORT_BINDINGS = frozenset({"React"})
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


FOCUSED_TEST_REWRITE = re.compile(
    r"\b(describe|it|test|context|suite|fit|fdescribe)\s*\.\s*only\s*\("
)
AWAIT_IN_FOR_EACH_CALL = re.compile(
    r"(?P<collection>[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\.\s*forEach\s*"
    r"\(\s*async\s*\(?\s*(?P<param>[A-Za-z_$][\w$]*)?"
)
_DEPRECATED_REPLACEMENTS = (
    (
        "document.execcommand",
        "Replace `document.execCommand` with the Clipboard API "
        "(`await navigator.clipboard.writeText(text)`).",
    ),
    (
        "componentwillmount",
        "Run the initialisation in `useEffect(() => { ... }, [])` or in the "
        "state initialiser instead of `componentWillMount`.",
    ),
    (
        "componentwillreceiveprops",
        "Derive the value during render, or use `getDerivedStateFromProps`/"
        "`useEffect` instead of `componentWillReceiveProps`.",
    ),
    (
        "reactdom.render(",
        "Use `createRoot(container).render(<App />)` from `react-dom/client`.",
    ),
)
_STATIC_SUGGESTIONS = {
    "merge-conflict-marker": (
        "Delete the `<<<<<<<`, `=======` and `>>>>>>>` lines and keep the "
        "intended side, then re-run the tests."
    ),
    "private-key-block": (
        "Remove the key, rotate it, and load the replacement from the secret "
        "store at runtime."
    ),
    "hardcoded-credential": (
        "Read the value from `process.env` or the approved secret store, or "
        "replace it with an obviously non-secret fixture value."
    ),
    "unsafe-html-or-dynamic-code": (
        "Render the value as text, or sanitise it with a reviewed allowlist "
        "before it reaches the sink."
    ),
    "target-blank-without-noopener": (
        'Add `rel="noopener noreferrer"` beside `target="_blank"`.'
    ),
    "insecure-http-url": (
        "Change the URL to `https://`; if the endpoint cannot use TLS, document "
        "why and keep it out of production paths."
    ),
    "type-or-lint-suppression": (
        "Fix the underlying diagnostic, or narrow the suppression to the "
        "affected line and record the reason in the comment."
    ),
    "debugger-statement": "Delete the `debugger` line before merging.",
    "empty-catch-block": (
        "Do something with the failure: `catch (error) { console.error(error); }`, "
        "or rethrow after cleanup so the error is not hidden."
    ),
}
PROVIDER_TOKEN_SUGGESTION = (
    "Revoke and rotate the token, remove it from the diff, and read the "
    "replacement from the environment or a secret store."
)
PROVIDER_TOKEN_RULES = frozenset(rule for rule, _pattern in PROVIDER_TOKEN_PATTERNS)
# The change classifier in .github/scripts/classify-visual-changes.sh is the
# authority for whether CI requires the browser job. These patterns mirror its
# non-rendering list so the advisory suggestion matches that decision; an
# unknown path is treated as rendering-affecting, exactly as the shell classifier
# fails closed.
NON_RENDERING_ANY_DEPTH = (
    "*.md",
    "specs/*",
    "memory-bank/*",
    ".docs/*",
    ".agents/skills/*",
)
NON_RENDERING_EXACT_GLOBS = (
    ".specify/feature.json",
    ".github/*",
    "app/api/*",
    "pages/api/*",
    "__tests__/*.test.js",
    "__tests__/*.test.jsx",
    "__tests__/*.test.ts",
    "__tests__/*.test.tsx",
    "playwright.*.config.ts",
    "playwright-*.config.ts",
)
PERFORMANCE_PATH_PATTERN = re.compile(
    r"(?:engine|renderer|shader|gpu|perf|animation|canvas|webgl|frame)", re.I
)
PERFORMANCE_CODE_SUFFIXES = (".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs")


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
    classification: str | None = None,
    suggestion: str | None = None,
) -> dict:
    # A hard rule has a proven payload (a key, a token, a conflict marker); an
    # advisory rule reports a pattern whose intent is not proven from the patch.
    if classification is None:
        classification = "confirmed" if severity == HARD else "potential"
    return {
        "path": path,
        "line": line,
        "rule": rule,
        "severity": severity,
        "confidence": confidence,
        "classification": classification,
        "message": message,
        "recommendation": recommendation,
        "suggestion": suggestion
        or _suggestion(rule, excerpt, message, recommendation),
        "excerpt": excerpt.strip()[:180],
    }


def _is_non_rendering_path(path: str) -> bool:
    """Mirror the non-rendering exemptions of classify-visual-changes.sh."""
    if any(fnmatch.fnmatchcase(path, pattern) for pattern in NON_RENDERING_ANY_DEPTH):
        return True
    if any(fnmatch.fnmatchcase(path, pattern) for pattern in NON_RENDERING_EXACT_GLOBS):
        return True
    if path == "open-next.config.ts":
        return True
    # The committed Playwright configuration decides how CI produces the
    # baselines, so it stays rendering-affecting; package.json needs a manifest
    # comparison this checker cannot make, so it is treated as rendering-affecting.
    return False


def _is_performance_path(path: str) -> bool:
    """True for code that plausibly changes measured rendering or frame timing."""
    if _documentation_path(path) or _test_path(path):
        return False
    if not path.casefold().endswith(PERFORMANCE_CODE_SUFFIXES):
        return False
    return bool(PERFORMANCE_PATH_PATTERN.search(path))


def _suggested_verification(paths) -> dict:
    rendering = sorted({path for path in paths if not _is_non_rendering_path(path)})
    performance = sorted({path for path in paths if _is_performance_path(path)})
    return {
        "playwright_visual": bool(rendering),
        "playwright_performance": bool(performance),
        "rendering_path_count": len(rendering),
        "performance_path_count": len(performance),
        "rendering_paths": rendering[:5],
        "performance_paths": performance[:5],
    }


def _suggestion(rule: str, excerpt: str, message: str, recommendation: str) -> str:
    """Return a concrete correction a developer can apply from the comment."""
    if rule == "focused-test":
        rewritten = FOCUSED_TEST_REWRITE.sub(r"\1(", excerpt.strip())
        return "Remove the focus so the whole suite runs: `%s`" % rewritten
    if rule == "await-in-for-each":
        match = AWAIT_IN_FOR_EACH_CALL.search(excerpt)
        if match:
            param = match.group("param") or "item"
            return (
                "Await the work instead of dropping it: "
                "`for (const %s of %s) { await ... }`, or collect the promises "
                "and `await Promise.all(...)`."
                % (param, match.group("collection"))
            )
        return (
            "Use `for...of` with `await`, or collect the promises and "
            "`await Promise.all(...)`."
        )
    if rule == "deprecated-api":
        lowered = excerpt.casefold()
        for needle, replacement in _DEPRECATED_REPLACEMENTS:
            if needle in lowered:
                return replacement
    if rule in PROVIDER_TOKEN_RULES:
        return PROVIDER_TOKEN_SUGGESTION
    return _STATIC_SUGGESTIONS.get(rule, recommendation)


def _test_path(path: str) -> bool:
    return (
        path.startswith(("__tests__/", "tests/"))
        or re.search(r"\.(?:test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs)$", path) is not None
    )


def _in_comment_context(text: str, position: int) -> bool:
    """True when the token at position sits in a comment, not a string literal."""
    prefix = text[:position]
    if not prefix.strip():
        return True
    for marker in ("//", "/*", "<!--", "#"):
        index = prefix.find(marker)
        if index == -1:
            continue
        before_marker = prefix[:index]
        if before_marker.count('"') % 2 or before_marker.count("'") % 2:
            continue
        return True
    return False


def _insecure_http_match(text: str):
    """Return the first http:// URL that does not sit inside an https:// URL."""
    for match in INSECURE_URL_PATTERN.finditer(text):
        prefix = text[: match.start()]
        boundary = max(prefix.rfind(quote) for quote in "\"'`") + 1
        token = prefix[boundary:].lstrip()
        if token.casefold().startswith("https://"):
            continue
        return match
    return None


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
        combined = text + "\n" + nearby_text
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
        url_match = _insecure_http_match(text)
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

    suppression = QUALITY_SUPPRESSION_PATTERN.search(text)
    if (
        not documentation
        and suppression
        and _in_comment_context(text, suppression.start())
    ):
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

    if not documentation and _test_path(path) and FOCUSED_TEST_PATTERN.search(text):
        findings.append(
            _finding(
                path,
                line,
                "focused-test",
                WARNING,
                CONFIDENCE_HIGH,
                "A focused test was committed, so every other test in this file is silently skipped.",
                "Remove .only (and any .skip you did not intend) so the whole suite runs.",
                stripped,
                classification="confirmed",
            )
        )

    if not documentation and AWAIT_IN_FOR_EACH_PATTERN.search(text):
        findings.append(
            _finding(
                path,
                line,
                "await-in-for-each",
                WARNING,
                CONFIDENCE_HIGH,
                "An async callback passed to forEach cannot be awaited: its promises float and rejections are lost.",
                "Use for...of with await, or collect the promises and await Promise.all.",
                stripped,
                classification="confirmed",
            )
        )

    if not documentation and EMPTY_CATCH_PATTERN.search(text):
        findings.append(
            _finding(
                path,
                line,
                "empty-catch-block",
                WARNING,
                CONFIDENCE_MEDIUM,
                "An empty catch block discards the error, so a real failure becomes silent.",
                "Handle the error, log it with context, or rethrow after cleanup.",
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
                    suggestion=(
                        "Confirm `%s` is needed, add it with `pnpm add %s` so "
                        "`pnpm-lock.yaml` matches, and check the build-size budget."
                        % (package_match.group(1), package_match.group(1))
                    ),
                )
            )

    return findings


def _import_bindings(clause: str) -> list[str]:
    """Return the local names bound by one single-line import clause."""
    bindings: list[str] = []
    clause = clause.strip()
    if not clause:
        return bindings
    namespace = re.match(r"\*\s+as\s+([A-Za-z_$][\w$]*)", clause)
    if namespace:
        return [namespace.group(1)]
    default_match = re.match(r"([A-Za-z_$][\w$]*)\s*(?:,|$)", clause)
    if default_match:
        bindings.append(default_match.group(1))
    named = re.search(r"\{([^}]*)\}", clause)
    if named:
        for part in named.group(1).split(","):
            part = part.strip()
            if not part:
                continue
            local = part.split(" as ")[-1].strip()
            if re.fullmatch(r"[A-Za-z_$][\w$]*", local):
                bindings.append(local)
    return bindings


def _unused_import_findings(path: str, added: list[tuple[int, str]]) -> list[dict]:
    """Report import bindings that are referenced nowhere in a fully added file.

    Only fully added files are reviewed: GitHub supplies every line of them, so a
    missing reference is evidence. A modified file exposes only its hunks, and
    treating an unmentioned name as unused there would be a false positive.

    Multi-line import statements are not parsed, so this rule can miss an unused
    binding but does not invent one.
    """
    bindings: list[tuple[int, str, str]] = []
    import_lines: set[int] = set()
    for line_number, text in added:
        match = IMPORT_STATEMENT_PATTERN.match(text)
        if not match:
            continue
        found = _import_bindings(match.group(1))
        if not found:
            continue
        import_lines.add(line_number)
        for binding in found:
            bindings.append((line_number, binding, text))
    if not bindings:
        return []

    body = "\n".join(
        text for line_number, text in added if line_number not in import_lines
    )
    findings: list[dict] = []
    reported: set[str] = set()
    for line_number, binding, text in bindings:
        if binding in IGNORED_IMPORT_BINDINGS or binding in reported:
            continue
        if re.search(r"(?<![\w$])%s(?![\w$])" % re.escape(binding), body):
            continue
        reported.add(binding)
        findings.append(
            _finding(
                path,
                line_number,
                "unused-import",
                WARNING,
                CONFIDENCE_HIGH,
                "The added file imports %r but never references it." % binding,
                "Remove the unused binding, or use it in the file.",
                text,
                classification="confirmed",
                suggestion=(
                    "Delete `%s` (line %d) or reference `%s` in this file."
                    % (text.strip(), line_number, binding)
                ),
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
    all_paths = []
    for record in file_records:
        if not isinstance(record, dict):
            raise ReviewError("GitHub changed-file evidence contains a malformed record")
        filename = record.get("filename")
        if not isinstance(filename, str) or not filename.strip():
            raise ReviewError("GitHub changed-file evidence contains a record without a filename")
        path = filename.strip()
        all_paths.append(path)
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
            nearby_text = "\n".join(line for _, line in window)
            findings.extend(_line_findings(path, line_number, text, nearby_text))
        if str(record.get("status") or "").lower() == "added" and not _documentation_path(path):
            findings.extend(_unused_import_findings(path, added))

    # Collapse by location and rule: one defect reported twice for slightly
    # different excerpts is one finding, and the duplicate count is reported.
    deduplicated = {}
    duplicates_collapsed = 0
    for finding in findings:
        key = (finding["path"], finding["line"], finding["rule"])
        if key in deduplicated:
            duplicates_collapsed += 1
            continue
        deduplicated[key] = finding

    ordered = sorted(
        deduplicated.values(),
        key=lambda item: (
            0 if item["severity"] == HARD else 1,
            0 if item["classification"] == "confirmed" else 1,
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
        "duplicates_collapsed": duplicates_collapsed,
        "suggested_verification": _suggested_verification(all_paths),
        "confirmed_count": sum(
            1 for item in ordered if item["classification"] == "confirmed"
        ),
        "note": (
            "Warnings are advisory and are not confirmed vulnerabilities. "
            "DevSkim, CodeQL, TypeScript, tests and reviewer judgment remain authoritative."
        ),
    }


def _inline_code(text: str) -> str:
    """Render evidence as one inline-code span that cannot break the Markdown."""
    cleaned = " ".join(str(text).split()).replace("`", "'")
    return "`%s`" % cleaned


def _render_suggested_verification(report: dict) -> list[str]:
    suggestion = report.get("suggested_verification") or {}
    lines = ["", "### Suggested verification", ""]
    rendered = False
    if suggestion.get("playwright_visual"):
        examples = ", ".join(
            "`%s`" % path for path in suggestion.get("rendering_paths", [])[:3]
        )
        lines.append(
            "- Playwright visual verification is suggested: %d rendering path(s) "
            "changed%s. Run `./scripts/playwright-cli.sh test` for desktop, "
            "mobile-390 and mobile-412."
            % (
                suggestion.get("rendering_path_count", 0),
                " (for example %s)" % examples if examples else "",
            )
        )
        rendered = True
    if suggestion.get("playwright_performance"):
        paths = suggestion.get("performance_paths", [])
        examples = ", ".join("`%s`" % path for path in paths[:3])
        lines.append(
            "- Playwright performance measurement is suggested: %d "
            "performance-sensitive path(s) changed%s. Drive the real interaction, "
            "then run the frame probe."
            % (
                suggestion.get("performance_path_count", 0),
                " (for example %s)" % examples if examples else "",
            )
        )
        rendered = True
    if not rendered:
        lines.append(
            "- No Playwright verification is suggested: every changed path is "
            "documentation, tooling, CI or unit-test-only."
        )
    lines.append(
        "- Playwright is not required for every change. The Visual QA workflow "
        "makes the required decision from the same changed-path evidence."
    )
    return lines


def render_markdown(report: dict) -> str:
    lines = [
        "## Changed-code review: " + report["status"],
        "",
        f"- Text files reviewed: {len(report.get('reviewed_files', []))}",
        f"- Files without a textual patch: {len(report.get('skipped_files', []))}",
        f"- Hard findings: {report.get('hard_count', 0)}",
        f"- Advisory warnings: {report.get('warning_count', 0)}",
        f"- Confirmed findings (hard and advisory): {report.get('confirmed_count', 0)}",
        f"- Duplicate findings collapsed: {report.get('duplicates_collapsed', 0)}",
        "",
        report.get("note", ""),
    ]
    lines.extend(_render_suggested_verification(report))
    findings = report.get("findings", [])
    if findings:
        lines.extend(["", "### Findings", ""])
        for item in findings:
            lines.append(
                "- **%s · %s · %s** `%s:%s` (confidence: %s)"
                % (
                    item["severity"],
                    item["classification"],
                    item["rule"],
                    item["path"],
                    item["line"],
                    item["confidence"],
                )
            )
            lines.append("  - What happened: %s" % item["message"])
            lines.append("  - Evidence: %s" % _inline_code(item["excerpt"]))
            lines.append("  - Suggested fix: %s" % item["suggestion"])
        lines.append("")
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
