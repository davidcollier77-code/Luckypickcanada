#!/usr/bin/env python3
"""Validate a pull request's declared QA scope against its actual GitHub diff.

The checker runs from a trusted base-branch checkout. The PR body declares
intent and a narrow path manifest; GitHub's API supplies the actual changed
files and owner-authored approval comments. PR text is never approval by itself.

An unlisted path is a scope violation. To expand scope, add an exact path and
rationale under scope_expansion, write the exact words "Scope changed" and an
explanation in the PR description, then obtain /approve-scope <digest> from the
repository owner. A description never substitutes for that approval. Visual
baseline and governance changes have separate approvals. Existing protected-file
governance gates remain independent.

Browser verification belongs to the automated Playwright workflow. This checker
never requires the submitter to run a browser, take screenshots or supply manual
browser evidence; optional browser_evidence entries are accepted and reported
when a submitter chooses to supply them.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import PurePosixPath

START_MARKER = "<!-- qa-scope:start -->"
END_MARKER = "<!-- qa-scope:end -->"
ALLOWED_BROWSER_TOOLS = frozenset({"playwright", "firecrawl", "browserless"})
VISUAL_PREFIXES = ("app/", "components/", "pages/", "public/", "styles/", "tests/visual/")
BASELINE_PREFIX = "tests/visual/__screenshots__/"
GOVERNANCE_PATHS = frozenset({
    "AGENTS.md",
    "PR_SUBMISSION.md",
    ".github/CODEOWNERS",
    ".github/workflows/protected-files.yml",
    ".github/scripts/agents_md_protection.py",
    ".github/scripts/test_agents_md_protection.py",
    "__tests__/agent-governance-single-source.test.js",
    ".specify/memory/constitution.md",
})
APPROVAL_COMMANDS = {
    "scope_expansion": "approve-scope",
    "visual_baseline_updates": "approve-visual-baselines",
    "governance_changes": "approve-governance",
}
SCOPE_CHANGE_PHRASE = "Scope changed"
SCOPE_CHANGE_MIN_EXPLANATION = 20
PLACEHOLDER_ONLY = re.compile(
    r"^[\W_]*placeholder(?:\s+(?:text|value|here|goes here))?[\W_]*$",
    re.I,
)
SUMMARY_WORDING = re.compile(r"\b(todo|tbd|fill this in)\b|<[^>]+>", re.I)
FEATURE_WORDING = re.compile(
    r"\b(todo|tbd|name each|describe the|fill this in)\b", re.I
)
REASON_WORDING = re.compile(r"\b(todo|tbd|fill this in)\b|<[^>]+>", re.I)
PURPOSE_WORDING = re.compile(
    r"\b(todo|tbd|describe this|fill this in)\b|<[^>]+>", re.I
)


class ScopeError(ValueError):
    """The declaration or GitHub evidence cannot be classified safely."""


def _placeholder_wording(value: str, pattern: re.Pattern) -> bool:
    """Reject template instructions anywhere and a bare marker as the whole value."""
    text = value.strip()
    return bool(pattern.search(text) or PLACEHOLDER_ONLY.match(text))


def normalize_path(raw: str) -> str:
    if not isinstance(raw, str):
        raise ScopeError("a changed path is not text")
    path = raw.strip()
    if not path or path.startswith("/") or "\\" in path or "\x00" in path:
        raise ScopeError(f"unsafe or empty repository path: {raw!r}")
    parts = path.split("/")
    if any(part in {"", ".", ".."} for part in parts):
        raise ScopeError(f"unsafe repository path: {raw!r}")
    return str(PurePosixPath(path))


def _string_list(value, field: str, *, required: bool = False) -> list[str]:
    if value is None and not required:
        return []
    if not isinstance(value, list) or (required and not value):
        raise ScopeError(f"{field} must be a non-empty array of strings")
    result = []
    for item in value:
        if not isinstance(item, str) or not item.strip():
            raise ScopeError(f"{field} contains an empty or non-string value")
        result.append(item.strip())
    if len(result) != len(set(result)):
        raise ScopeError(f"{field} contains duplicate entries")
    return result


def extract_declaration(body: str) -> dict:
    if not isinstance(body, str):
        raise ScopeError("pull request body is missing")
    if body.count(START_MARKER) != 1 or body.count(END_MARKER) != 1:
        raise ScopeError("PR description must contain exactly one QA scope declaration")
    match = re.search(
        re.escape(START_MARKER) + r"\s*(\{.*?\})\s*" + re.escape(END_MARKER),
        body,
        flags=re.DOTALL,
    )
    if not match:
        raise ScopeError("QA scope declaration is not valid JSON between its markers")
    try:
        declaration = json.loads(match.group(1))
    except json.JSONDecodeError as error:
        raise ScopeError(f"QA scope declaration JSON is invalid: {error}") from error
    if not isinstance(declaration, dict) or declaration.get("version") != 1:
        raise ScopeError("QA scope declaration must be an object with version 1")
    summary = declaration.get("summary")
    if not isinstance(summary, str) or len(summary.strip()) < 12:
        raise ScopeError("QA scope summary must describe the intended change")
    if _placeholder_wording(summary, SUMMARY_WORDING):
        raise ScopeError("QA scope summary still contains placeholder wording")
    features = _string_list(declaration.get("features"), "features", required=True)
    if any(_placeholder_wording(item, FEATURE_WORDING) for item in features):
        raise ScopeError("features still contains placeholder wording")
    patterns = _string_list(declaration.get("paths"), "paths", required=True)
    for pattern in patterns:
        _validate_pattern(pattern)
    return declaration


def _validate_pattern(pattern: str) -> None:
    if pattern.startswith("/") or "\\" in pattern or "\x00" in pattern:
        raise ScopeError(f"unsafe scope path pattern: {pattern!r}")
    parts = pattern.split("/")
    if any(part in {"", ".", ".."} for part in parts):
        raise ScopeError(f"unsafe scope path pattern: {pattern!r}")
    if any(character in pattern for character in "*?"):
        raise ScopeError(f"scope paths must be exact file paths, not globs: {pattern!r}")
    if not re.fullmatch(r"[A-Za-z0-9._@+()\[\] -]+(?:/[A-Za-z0-9._@+()\[\] -]+)*", pattern):
        raise ScopeError(f"scope path contains unsupported characters: {pattern!r}")


def changed_paths(file_records: list) -> set[str]:
    if not isinstance(file_records, list) or not file_records:
        raise ScopeError("GitHub returned no changed files; scope cannot be verified")
    paths: set[str] = set()
    current_names: set[str] = set()
    for record in file_records:
        if not isinstance(record, dict):
            raise ScopeError("GitHub changed-file evidence contains a malformed record")
        if not record.get("filename"):
            raise ScopeError("GitHub changed-file evidence contains a record without a filename")
        status = (record.get("status") or "").casefold()
        raw_previous = record.get("previous_filename")
        previous = None
        if raw_previous not in (None, ""):
            previous = normalize_path(raw_previous)
        # GitHub supplies previous_filename only for renames and copies. A
        # rename without it is incomplete evidence, not an ordinary change.
        if status in {"renamed", "copied"} and previous is None:
            raise ScopeError(
                "GitHub changed-file evidence is missing the previous path for a rename"
            )

        filename = normalize_path(record["filename"])
        if filename in current_names:
            raise ScopeError(f"GitHub changed-file evidence repeats a filename: {filename}")
        current_names.add(filename)
        paths.add(filename)
        if previous is not None:
            if previous in current_names:
                raise ScopeError(
                    f"GitHub changed-file evidence repeats a filename: {previous}"
                )
            current_names.add(previous)
            paths.add(previous)
    if not paths:
        raise ScopeError("GitHub changed-file evidence contains no usable paths")
    return paths


def _entries_with_reasons(value, field: str) -> dict[str, str]:
    if value is None:
        return {}
    if not isinstance(value, list):
        raise ScopeError(f"{field} must be an array")
    entries: dict[str, str] = {}
    for item in value:
        if not isinstance(item, dict):
            raise ScopeError(f"{field} entries must be objects with path and reason")
        raw_path = item.get("path")
        if raw_path is None:
            raise ScopeError(f"{field} entry is missing the required 'path' key")
        path = normalize_path(raw_path)
        reason = item.get("reason")
        if not isinstance(reason, str) or len(reason.strip()) < 12:
            raise ScopeError(f"{field} requires a specific reason for {path}")
        if _placeholder_wording(reason, REASON_WORDING):
            raise ScopeError(f"{field} reason for {path} contains placeholder wording")
        if path in entries:
            raise ScopeError(f"{field} contains duplicate path {path}")
        entries[path] = reason.strip()
    return entries


def _file_purpose_entries(value) -> dict[str, str]:
    if not isinstance(value, list):
        raise ScopeError("file_purposes must be an array of path/purpose objects")
    entries: dict[str, str] = {}
    for item in value:
        if not isinstance(item, dict):
            raise ScopeError("file_purposes entries must be objects")
        raw_path = item.get("path")
        if raw_path is None:
            raise ScopeError("file_purposes entry is missing the required 'path' key")
        path = normalize_path(raw_path)
        purpose = item.get("purpose")
        if not isinstance(purpose, str) or len(purpose.strip()) < 12:
            raise ScopeError(f"file_purposes requires a specific purpose for {path}")
        if _placeholder_wording(purpose, PURPOSE_WORDING):
            raise ScopeError(f"file purpose for {path} contains placeholder wording")
        if path in entries:
            raise ScopeError(f"file_purposes contains duplicate path {path}")
        entries[path] = purpose.strip()
    return entries


def _visual_impact(value) -> dict | None:
    """Validate the optional author declaration of actual visual impact."""
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ScopeError("visual_impact must be an object with required and reason")
    required = value.get("required")
    if type(required) is not bool:
        raise ScopeError("visual_impact.required must be true or false")
    reason = value.get("reason")
    if not isinstance(reason, str) or len(reason.strip()) < 12:
        raise ScopeError("visual_impact requires a specific reason")
    if _placeholder_wording(reason, REASON_WORDING):
        raise ScopeError("visual_impact reason contains placeholder wording")
    return {"required": required, "reason": reason.strip()}


def _prose(body: str) -> str:
    """Strip HTML comments so template guidance is not read as a declaration."""
    if not isinstance(body, str):
        return ""
    return re.sub(r"<!--.*?-->", "", body, flags=re.DOTALL)


def _scope_change_statement(body: str) -> str:
    """Return the explanation written after the exact words "Scope changed".

    The phrase must begin a line, so an unrelated mention inside prose cannot
    satisfy the requirement. The explanation must be specific: the phrase alone,
    a placeholder, or a different sentence is not enough. The explanation is not
    an approval; the owner digest command remains mandatory.
    """
    body = _prose(body)
    pattern = re.compile(
        r"(?m)^[\s>*\-]*\**\s*"
        + re.escape(SCOPE_CHANGE_PHRASE)
        + r"[ \t]*(?:[:—–-][ \t]*)?\**[ \t]*([^\n]+)$"
    )
    for match in pattern.finditer(body):
        statement = " ".join(match.group(1).split()).strip()
        if len(statement) < SCOPE_CHANGE_MIN_EXPLANATION:
            continue
        if _placeholder_wording(statement, REASON_WORDING):
            continue
        return statement
    return ""


def _digest(entries: dict | list) -> str:
    payload = json.dumps(entries, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _approval_digest(head_sha: str, entries: dict[str, str] | list[str], scope_context: dict) -> str:
    # Any new commit or material scope-description edit invalidates prior approval.
    return _digest({"head_sha": head_sha, "entries": entries, "scope": scope_context})


def _owner_approval(comments: list, owner: str, command: str, digest: str) -> bool:
    if not isinstance(comments, list):
        raise ScopeError("GitHub issue-comment evidence is malformed")
    expected = f"/{command} {digest}"
    for comment in comments:
        if not isinstance(comment, dict):
            continue
        user = comment.get("user") or {}
        body = comment.get("body")
        if (
            isinstance(user, dict)
            and (user.get("login") or "").casefold() == owner.casefold()
            and isinstance(body, str)
            and any(line.strip() == expected for line in body.splitlines())
        ):
            return True
    return False


def _baseline_paths(paths: set[str]) -> set[str]:
    extensions = (".png", ".jpg", ".jpeg", ".webp")
    return {
        path for path in paths
        if path.startswith(BASELINE_PREFIX) and path.lower().endswith(extensions)
    }


def _is_visual_path(path: str) -> bool:
    # API handlers and GitHub automation/configuration do not render UI. They
    # remain subject to normal unit, type, security, scope and CI checks; only
    # the browser-evidence requirement is omitted. A PR can still force browser
    # coverage with visual_impact.required=true when API changes have a specific
    # user-visible consequence that needs browser verification.
    if path.startswith(("app/api/", "pages/api/", ".github/")):
        return False
    if path.startswith(VISUAL_PREFIXES):
        return True
    suffix = PurePosixPath(path).suffix.casefold()
    if suffix in {".css", ".scss", ".sass", ".less", ".svg"}:
        return True
    return PurePosixPath(path).name in {
        "next.config.js",
        "next.config.mjs",
        "next.config.ts",
        "tailwind.config.js",
        "tailwind.config.cjs",
        "tailwind.config.ts",
        "postcss.config.js",
        "postcss.config.mjs",
        "postcss.config.cjs",
    }


def _is_governance_path(path: str) -> bool:
    # Spec Kit commands/templates and Freebuff specialist guidance are repository
    # governance. The active feature pointer is task state, not a governance edit.
    return (
        path in GOVERNANCE_PATHS
        or path.startswith(".freebuff/")
        or (path.startswith(".specify/") and path != ".specify/feature.json")
    )


def validate(pr: dict, file_records: list, comments: list, owner: str) -> dict:
    if not isinstance(pr, dict) or not isinstance(pr.get("body"), str):
        raise ScopeError("GitHub pull request metadata is missing its body")
    if not isinstance(owner, str) or not owner.strip():
        raise ScopeError("repository owner identity is required for approval checks")
    head = pr.get("head")
    head_sha = head.get("sha") if isinstance(head, dict) else None
    if not isinstance(head_sha, str) or not head_sha.strip():
        raise ScopeError("current pull request head SHA is required for approval-bound scope checks")

    declaration = extract_declaration(pr["body"])
    actual = changed_paths(file_records)
    changed_file_count = pr.get("changed_files")
    if type(changed_file_count) is not int:
        raise ScopeError(
            "GitHub pull request metadata is missing the changed_files count"
        )
    if changed_file_count != len(file_records):
        raise ScopeError(
            "GitHub changed-file count does not match the complete file list "
            f"(reported {changed_file_count!r}; received {len(file_records)})"
        )
    patterns = declaration["paths"]
    file_purposes = _file_purpose_entries(declaration.get("file_purposes"))
    expansion = _entries_with_reasons(declaration.get("scope_expansion"), "scope_expansion")
    baseline_updates = [
        normalize_path(path)
        for path in _string_list(declaration.get("visual_baseline_updates"), "visual_baseline_updates")
    ]
    governance = _entries_with_reasons(declaration.get("governance_changes"), "governance_changes")
    shared_dependencies = _string_list(declaration.get("shared_dependencies"), "shared_dependencies")
    features = declaration["features"]
    visual_impact = _visual_impact(declaration.get("visual_impact"))
    scope_context = {
        # Bind approvals to the full prose description as well as the JSON manifest.
        # An out-of-scope/verification paragraph edit must trigger a new review.
        "complete_pr_body": pr["body"],
        "summary": declaration["summary"],
        "features": features,
        "paths": patterns,
        "file_purposes": file_purposes,
        "shared_dependencies": shared_dependencies,
    }
    evidence = declaration.get("browser_evidence", [])
    if not isinstance(evidence, list):
        raise ScopeError("browser_evidence must be an array when supplied")
    normalized_evidence = []
    for item in evidence:
        if not isinstance(item, dict):
            raise ScopeError("browser_evidence entries must be objects")
        tool = item.get("tool")
        reference = item.get("reference")
        purpose = item.get("purpose")
        if not isinstance(tool, str) or tool.casefold() not in ALLOWED_BROWSER_TOOLS:
            raise ScopeError("browser evidence tool must be Playwright, Firecrawl, or Browserless")
        if not isinstance(reference, str) or not reference.strip():
            raise ScopeError(f"{tool} browser evidence requires a run, artifact, or trace reference")
        if not isinstance(purpose, str) or len(purpose.strip()) < 8:
            raise ScopeError(f"{tool} browser evidence requires a specific verification purpose")
        normalized_evidence.append({
            "tool": tool.casefold(),
            "reference": reference.strip(),
            "purpose": purpose.strip(),
        })

    scope_change_statement = _scope_change_statement(pr["body"])

    errors = []
    if set(file_purposes) != set(patterns):
        missing_purposes = sorted(set(patterns) - set(file_purposes))
        stale_purposes = sorted(set(file_purposes) - set(patterns))
        if missing_purposes:
            errors.append("declared paths are missing file purposes: " + ", ".join(missing_purposes))
        if stale_purposes:
            errors.append("file purposes reference paths not in the exact manifest: " + ", ".join(stale_purposes))

    for path in expansion:
        if path not in actual:
            errors.append(f"scope_expansion path is not in this diff: {path}")
        if path not in patterns:
            errors.append(f"scope_expansion path must also be added to the exact paths manifest: {path}")

    uncovered = {path for path in actual if path not in patterns}
    if uncovered:
        errors.append("changed paths are not declared in the PR description: " + ", ".join(sorted(uncovered)))

    actual_baselines = _baseline_paths(actual)
    declared_baselines = set(baseline_updates)
    if actual_baselines != declared_baselines:
        missing = sorted(actual_baselines - declared_baselines)
        stale = sorted(declared_baselines - actual_baselines)
        if missing:
            errors.append("visual baseline files changed but are not declared: " + ", ".join(missing))
        if stale:
            errors.append("declared visual baseline updates are not in this diff: " + ", ".join(stale))
    for path in declared_baselines:
        if path not in patterns:
            errors.append(f"visual baseline path is not included in declared paths: {path}")

    actual_governance = {path for path in actual if _is_governance_path(path)}
    declared_governance = set(governance)
    if actual_governance != declared_governance:
        missing = sorted(actual_governance - declared_governance)
        stale = sorted(declared_governance - actual_governance)
        if missing:
            errors.append("governance files changed without a declared reason: " + ", ".join(missing))
        if stale:
            errors.append("declared governance changes are not in this diff: " + ", ".join(stale))

    if expansion and not scope_change_statement:
        errors.append(
            'scope_expansion requires the exact words "%s" followed by a specific explanation '
            "of what was added or changed in the PR description; the structured entry is not "
            "enough and the owner approval digest is still required" % SCOPE_CHANGE_PHRASE
        )

    # Browser verification is the automated Playwright workflow's responsibility.
    # A visual path never requires the submitter to run a browser, take
    # screenshots or supply manual evidence.
    visual_changes = sorted(path for path in actual if _is_visual_path(path))

    warnings = []
    if visual_changes and visual_impact and not visual_impact["required"]:
        warnings.append(
            "Path-based detection found visual/application changes, but visual_impact.required is declared as false. "
            "A reviewer should confirm this assessment matches the actual rendering impact."
        )

    approvals = {}
    for category, entries in (
        ("scope_expansion", expansion),
        ("visual_baseline_updates", {path: path for path in baseline_updates}),
        ("governance_changes", governance),
    ):
        if not entries:
            continue
        digest = _approval_digest(head_sha, entries, scope_context)
        command = APPROVAL_COMMANDS[category]
        approvals[category] = {
            "digest": digest,
            "command": f"/{command} {digest}",
            "approved": _owner_approval(comments, owner, command, digest),
        }
        if not approvals[category]["approved"]:
            errors.append(f"{category} requires a separate repository-owner approval comment: /{command} {digest}")

    return {
        "status": "FAIL" if errors else "PASS",
        "pr_number": pr.get("number"),
        "changed_paths": sorted(actual),
        "declared_path_patterns": patterns,
        "file_purposes": file_purposes,
        "features": features,
        "shared_dependencies": shared_dependencies,
        "matched_paths": sorted(path for path in actual if path in patterns),
        "scope_expansion": sorted(expansion),
        "visual_changes": visual_changes,
        "visual_impact": visual_impact,
        "visual_baseline_updates": sorted(declared_baselines),
        "governance_changes": sorted(declared_governance),
        "scope_change_statement": scope_change_statement,
        "browser_evidence": normalized_evidence,
        "approvals": approvals,
        "warnings": warnings,
        "errors": errors,
        "note": "This scope check does not grant permission to change protected files. Existing protected-file and Agent MD authorization workflows remain mandatory.",
    }


def render_markdown(report: dict) -> str:
    lines = [
        "## PR change-scope verification: " + report["status"],
        "",
        f"- Pull request: #{report.get('pr_number')}",
        f"- Changed paths checked: {len(report.get('changed_paths', []))}",
        f"- Declared features: {', '.join(report.get('features') or []) or 'none'}",
        f"- Shared dependencies declared: {', '.join(report.get('shared_dependencies') or []) or 'none'}",
        "",
        "### Changed paths",
    ]
    lines.extend(f"- {path}" for path in report.get("changed_paths", []))
    lines.extend(["", "### Declared purpose per file"])
    lines.extend(
        f"- {path}: {purpose}"
        for path, purpose in sorted(report.get("file_purposes", {}).items())
    )
    lines.extend(["", "### Browser verification"])
    lines.append(
        "- Automated Playwright verification owns browser evidence; the submitter is not "
        "required to run a browser, take screenshots or supply manual evidence."
    )
    if report.get("browser_evidence"):
        lines.append("- Optional submitter-supplied browser references:")
        for item in report["browser_evidence"]:
            lines.append(f"  - {item['tool']}: {item['reference']} — {item['purpose']}")
    if report.get("scope_change_statement"):
        lines.extend(["", "### Declared scope change"])
        lines.append(f"- {report['scope_change_statement']}")
    if report.get("visual_impact"):
        impact = report["visual_impact"]
        lines.append(
            f"- Declared visual impact: {'required' if impact['required'] else 'not required'} — {impact['reason']}"
        )
    if report.get("warnings"):
        lines.extend(["", "### Reviewer warnings"])
        lines.extend(f"- {warning}" for warning in report["warnings"])
    if report.get("approvals"):
        lines.extend(["", "### Explicit approvals"])
        for name, item in report["approvals"].items():
            lines.append(f"- {name}: {'APPROVED' if item['approved'] else 'PENDING'} ({item['command']})")
    if report.get("errors"):
        lines.extend(["", "### Required action"])
        lines.extend(f"- {error}" for error in report["errors"])
    lines.extend(["", report.get("note", "")])
    return "\n".join(lines) + "\n"


def _read_json(path: str):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pull-request", required=True)
    parser.add_argument("--files", required=True)
    parser.add_argument("--comments", required=True)
    parser.add_argument("--owner", required=True)
    parser.add_argument("--summary")
    parser.add_argument("--json")
    args = parser.parse_args(argv)
    try:
        report = validate(_read_json(args.pull_request), _read_json(args.files), _read_json(args.comments), args.owner)
    except (OSError, json.JSONDecodeError, ScopeError) as error:
        report = {"status": "BLOCKED", "errors": [str(error)]}
        if args.summary:
            with open(args.summary, "a", encoding="utf-8") as handle:
                handle.write(render_markdown(report))
        if args.json:
            with open(args.json, "w", encoding="utf-8") as handle:
                json.dump(report, handle, indent=2)
        print(f"PR scope check BLOCKED: {error}", file=sys.stderr)
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
