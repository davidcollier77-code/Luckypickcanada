#!/usr/bin/env python3
"""Validate a pull request's declared QA scope against its actual GitHub diff.

The checker runs from a trusted base-branch checkout. The PR body declares
intent and a narrow path manifest; GitHub's API supplies the actual changed
files and owner-authored approval comments. PR text is never approval by itself.

An unlisted path is a scope violation. To expand scope, add an exact path and
rationale under scope_expansion, then obtain /approve-scope <digest> from the
repository owner. Visual baseline and governance changes have separate
approvals. Existing protected-file governance gates remain independent.
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


class ScopeError(ValueError):
    """The declaration or GitHub evidence cannot be classified safely."""


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
    if re.search(r"\b(todo|tbd|placeholder|fill this in)\b|<[^>]+>", summary, re.I):
        raise ScopeError("QA scope summary still contains placeholder wording")
    features = _string_list(declaration.get("features"), "features", required=True)
    if any(re.search(r"\\b(todo|tbd|placeholder|name each|describe the|fill this in)\\b", item, re.I) for item in features):
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
    if any(character in pattern for character in "*?[]"):
        raise ScopeError(f"scope paths must be exact file paths, not globs: {pattern!r}")
    if not re.fullmatch(r"[A-Za-z0-9._@+-]+(?:/[A-Za-z0-9._@+-]+)*", pattern):
        raise ScopeError(f"scope path contains unsupported characters: {pattern!r}")


def changed_paths(file_records: list) -> set[str]:
    if not isinstance(file_records, list) or not file_records:
        raise ScopeError("GitHub returned no changed files; scope cannot be verified")
    paths: set[str] = set()
    for record in file_records:
        if not isinstance(record, dict):
            raise ScopeError("GitHub changed-file evidence contains a malformed record")
        if record.get("filename"):
            paths.add(normalize_path(record["filename"]))
        if record.get("previous_filename"):
            paths.add(normalize_path(record["previous_filename"]))
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
        path = normalize_path(item.get("path"))
        reason = item.get("reason")
        if not isinstance(reason, str) or len(reason.strip()) < 12:
            raise ScopeError(f"{field} requires a specific reason for {path}")
        if re.search(r"\b(todo|tbd|placeholder|fill this in)\b|<[^>]+>", reason, re.I):
            raise ScopeError(f"{field} reason for {path} contains placeholder wording")
        if path in entries:
            raise ScopeError(f"{field} contains duplicate path {path}")
        entries[path] = reason.strip()
    return entries


def _digest(entries: dict[str, str] | list[str]) -> str:
    payload = json.dumps(entries, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


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
    return path.startswith(VISUAL_PREFIXES)


def validate(pr: dict, file_records: list, comments: list, owner: str) -> dict:
    if not isinstance(pr, dict) or not isinstance(pr.get("body"), str):
        raise ScopeError("GitHub pull request metadata is missing its body")
    if not isinstance(owner, str) or not owner.strip():
        raise ScopeError("repository owner identity is required for approval checks")

    declaration = extract_declaration(pr["body"])
    actual = changed_paths(file_records)
    patterns = declaration["paths"]
    expansion = _entries_with_reasons(declaration.get("scope_expansion"), "scope_expansion")
    baseline_updates = [
        normalize_path(path)
        for path in _string_list(declaration.get("visual_baseline_updates"), "visual_baseline_updates")
    ]
    governance = _entries_with_reasons(declaration.get("governance_changes"), "governance_changes")
    shared_dependencies = _string_list(declaration.get("shared_dependencies"), "shared_dependencies")
    evidence = declaration.get("browser_evidence", [])
    if not isinstance(evidence, list):
        raise ScopeError("browser_evidence must be an array")
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

    errors = []
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

    actual_governance = actual.intersection(GOVERNANCE_PATHS)
    declared_governance = set(governance)
    if actual_governance != declared_governance:
        missing = sorted(actual_governance - declared_governance)
        stale = sorted(declared_governance - actual_governance)
        if missing:
            errors.append("governance files changed without a declared reason: " + ", ".join(missing))
        if stale:
            errors.append("declared governance changes are not in this diff: " + ", ".join(stale))

    visual_changes = sorted(path for path in actual if _is_visual_path(path))
    if visual_changes and not normalized_evidence:
        errors.append("visual/application paths changed without browser evidence; declare Playwright, Firecrawl, or Browserless evidence")

    approvals = {}
    for category, entries in (
        ("scope_expansion", expansion),
        ("visual_baseline_updates", {path: path for path in baseline_updates}),
        ("governance_changes", governance),
    ):
        if not entries:
            continue
        digest = _digest(entries)
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
        "features": features,
        "shared_dependencies": shared_dependencies,
        "matched_paths": sorted(path for path in actual if path in patterns),
        "scope_expansion": sorted(expansion),
        "visual_changes": visual_changes,
        "visual_baseline_updates": sorted(declared_baselines),
        "governance_changes": sorted(declared_governance),
        "browser_evidence": normalized_evidence,
        "approvals": approvals,
        "errors": errors,
        "note": "This scope check does not grant permission to change protected files. Existing protected-file and Agent MD authorization workflows remain mandatory.",
    }


def render_markdown(report: dict) -> str:
    lines = [
        "## PR change-scope verification: " + report["status"],
        "",
        f"- Pull request: #{report.get('pr_number')}",
        f"- Changed paths checked: {len(report.get('changed_paths', []))}",
        f"- Declared features: {', '.join(report.get('features', [])) or 'none'}",
        f"- Shared dependencies declared: {', '.join(report.get('shared_dependencies', [])) or 'none'}",
        "",
        "### Changed paths",
    ]
    lines.extend(f"- {path}" for path in report.get("changed_paths", []))
    lines.extend(["", "### Browser evidence"])
    if report.get("browser_evidence"):
        for item in report["browser_evidence"]:
            lines.append(f"- {item['tool']}: {item['reference']} — {item['purpose']}")
    else:
        lines.append("- No browser evidence declaration was required for this non-visual change set.")
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
