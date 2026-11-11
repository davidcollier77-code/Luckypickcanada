#!/usr/bin/env python3
"""Gate AGENTS.md changes to dedicated, path-classified governance pull requests.

The Protected File Changes workflow runs this module against the trusted base
checkout for every pull request that touches ``AGENTS.md``. It answers one
question: is this pull request a dedicated agent-governance change?

Rules (fail closed):

* A dedicated governance pull request may change ``AGENTS.md`` together with
  the protection code, its regression tests, the governance tests that anchor
  the requirements, and the Spec Kit and Memory Bank records this repository
  requires for every task.
* Any other pull request that includes ``AGENTS.md`` is a violation. This is
  what catches a governance edit hidden inside an unrelated application,
  dependency, workflow or documentation change.
* The baseline is the ``AGENTS.md`` committed on the pull request's base
  branch. Once an authorized governance change is merged, that merged file is
  the baseline for every later pull request, so the same change is never
  reported again. An unchanged blob (for example a permission-only change) is
  allowed.
* Deleting or renaming ``AGENTS.md`` away is never a dedicated governance
  change and is always a violation.

The classifier is deliberately path-based. It accepts no title, body, label,
comment, branch name or commit-message argument, so a pull request cannot talk
its way past the gate. An unreadable or empty change set fails closed.

Read-only: no network request is made here. The workflow supplies the changed
paths and AGENTS.md blob identities from the trusted base checkout.
"""

from __future__ import annotations

import argparse
import json
import re
import sys

GOVERNANCE_FILE = "AGENTS.md"

# Exact files that belong to the protection itself, its regression tests, or the
# governance contract that anchors AGENTS.md requirements. These may accompany
# AGENTS.md in a dedicated governance pull request.
GOVERNANCE_SUPPORT_FILES = frozenset(
    {
        "PR_SUBMISSION.md",
        ".github/CODEOWNERS",
        ".github/workflows/protected-files.yml",
        ".github/scripts/agents_md_protection.py",
        ".github/scripts/test_agents_md_protection.py",
        "__tests__/agent-governance-single-source.test.js",
        "scripts/verify-startup.sh",
        "freebuff-verify.sh",
    }
)

# Documentation, evidence and task records the repository requires in every
# pull request. Only these shapes qualify; source code cannot hide here.
MEMORY_BANK_PATTERN = re.compile(r"^memory-bank/[A-Za-z0-9._-]+\.md$")
FEATURE_RECORD_PATTERNS = (
    re.compile(
        r"^specs/[0-9]{3,}-[a-z0-9]+(?:-[a-z0-9]+)*/"
        r"(?:spec|plan|tasks|pr_summary)\.md$"
    ),
    re.compile(
        r"^specs/[0-9]{3,}-[a-z0-9]+(?:-[a-z0-9]+)*/"
        r"checklists/[A-Za-z0-9._-]+\.md$"
    ),
    re.compile(
        r"^specs/[0-9]{3,}-[a-z0-9]+(?:-[a-z0-9]+)*/"
        r"evidence/[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*"
        r"\.(?:md|json|txt|csv)$"
    ),
)
ARTIFACT_PATTERN = re.compile(
    r"^artifacts/[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*"
    r"\.(?:md|json|txt|csv|log|png|svg)$"
)
FEATURE_POINTER = ".specify/feature.json"

ALLOWED = "allowed"
VIOLATION = "violation"
INDETERMINATE = "indeterminate"

STATUSES = (
    "added",
    "modified",
    "removed",
    "renamed",
    "copied",
    "changed",
    "unchanged",
)


class ChangeSetError(ValueError):
    """The supplied change set cannot be classified safely."""


def normalize_path(raw):
    """Return a repository-relative path or raise ChangeSetError.

    GitHub reports repository-relative paths. Anything absolute, containing a
    backslash, a NUL byte, an empty segment or a ``..`` segment is refused
    rather than guessed at, because a loose path could be misclassified.
    """
    path = (raw or "").strip()
    while path.startswith("./"):
        path = path[2:]
    if not path:
        raise ChangeSetError("an empty changed path was supplied")
    if path.startswith("/") or "\\" in path or "\x00" in path:
        raise ChangeSetError("an unsafe changed path was supplied: %r" % raw)
    if any(part in ("", ".", "..") for part in path.split("/")):
        raise ChangeSetError("an unsafe changed path was supplied: %r" % raw)
    return path


def parse_changed_files(lines):
    """Parse ``new_path`` or ``new_path<TAB>previous_path`` records.

    Blank lines and ``#`` comments are ignored. Order and duplicates are
    insignificant; the classifier works from the unique path set.
    """
    records = []
    for raw in lines:
        line = raw.rstrip("\n")
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if "\t" in line:
            new_path, previous_path = line.split("\t", 1)
        else:
            new_path, previous_path = line, ""
        records.append(
            {
                "path": normalize_path(new_path),
                "previous_path": normalize_path(previous_path)
                if previous_path.strip()
                else "",
            }
        )
    if not records:
        raise ChangeSetError("no changed paths were supplied")
    return records


def is_governance_support_path(path):
    """Return True when ``path`` may accompany AGENTS.md in a dedicated PR."""
    if path in GOVERNANCE_SUPPORT_FILES:
        return True
    if path == FEATURE_POINTER:
        return True
    if MEMORY_BANK_PATTERN.match(path):
        return True
    if ARTIFACT_PATTERN.match(path):
        return True
    return any(pattern.match(path) for pattern in FEATURE_RECORD_PATTERNS)


def _result(status, allowed, mode, reason, **extra):
    result = {
        "status": status,
        "allowed": allowed,
        "mode": mode,
        "governance_file": GOVERNANCE_FILE,
        "reason": reason,
        "changed_paths": [],
        "offending_paths": [],
        "base_agents_sha": "",
        "head_agents_sha": "",
        "baseline_source": "pull-request base branch",
    }
    result.update(extra)
    return result


def classify(records, agents_status, base_agents_sha, head_agents_sha):
    """Classify a parsed change set.

    ``agents_status`` is GitHub's status for AGENTS.md (``modified``,
    ``removed``, ``renamed``, ...). ``base_agents_sha`` and ``head_agents_sha``
    are the Git blob identities of AGENTS.md on the base and head commits.
    """
    changed_paths = set()
    for record in records:
        changed_paths.add(record["path"])
        # For a rename into AGENTS.md the previous path disappears as part of
        # the governance change itself; it is not an unrelated file.
        if record["previous_path"] and record["path"] != GOVERNANCE_FILE:
            changed_paths.add(record["previous_path"])
    changed_paths = sorted(changed_paths)

    touches_governance = any(
        GOVERNANCE_FILE in (record["path"], record["previous_path"])
        for record in records
    )
    if not touches_governance:
        return _result(
            ALLOWED,
            True,
            "not-applicable",
            "AGENTS.md is not part of this pull request's change set.",
            changed_paths=changed_paths,
        )

    common = {
        "changed_paths": changed_paths,
        "base_agents_sha": base_agents_sha,
        "head_agents_sha": head_agents_sha,
    }

    if agents_status == "removed":
        return _result(
            VIOLATION,
            False,
            "removed",
            "AGENTS.md must not be deleted; agent governance can only be "
            "updated, through a dedicated governance pull request.",
            **common,
        )

    renamed_away = any(
        record["previous_path"] == GOVERNANCE_FILE
        and record["path"] != GOVERNANCE_FILE
        for record in records
    )
    if renamed_away:
        return _result(
            VIOLATION,
            False,
            "renamed-away",
            "AGENTS.md must not be renamed away; agent governance can only be "
            "updated, through a dedicated governance pull request.",
            **common,
        )

    if not base_agents_sha:
        return _result(
            INDETERMINATE,
            False,
            "indeterminate",
            "The base-branch AGENTS.md identity could not be established, so "
            "the approved baseline is unknown. The gate fails closed.",
            **common,
        )
    if not head_agents_sha:
        return _result(
            INDETERMINATE,
            False,
            "indeterminate",
            "The head AGENTS.md identity could not be established. The gate "
            "fails closed.",
            **common,
        )

    if base_agents_sha == head_agents_sha:
        return _result(
            ALLOWED,
            True,
            "unchanged",
            "AGENTS.md is byte-identical to the approved baseline already "
            "merged on the base branch; this pull request does not change "
            "governance content.",
            **common,
        )

    offending = [
        path
        for path in changed_paths
        if path != GOVERNANCE_FILE and not is_governance_support_path(path)
    ]
    if offending:
        return _result(
            VIOLATION,
            False,
            "unrelated",
            "AGENTS.md may only change in a dedicated governance pull request. "
            "This pull request also changes files outside the governance "
            "surface, so the AGENTS.md edit is unrelated and is refused.",
            offending_paths=offending,
            **common,
        )

    return _result(
        ALLOWED,
        True,
        "dedicated",
        "Dedicated governance pull request: AGENTS.md changes together with "
        "governance support, tests and task records only. Human authorization "
        "is still required before merge.",
        **common,
    )


def render_markdown(result):
    if result["status"] == ALLOWED and result["mode"] == "dedicated":
        heading = "## ✅ AGENTS.md protection: dedicated governance pull request"
    elif result["status"] == ALLOWED and result["mode"] == "unchanged":
        heading = "## ✅ AGENTS.md protection: no governance content change"
    elif result["status"] == ALLOWED:
        heading = "## ✅ AGENTS.md protection: not applicable"
    elif result["status"] == VIOLATION:
        heading = "## 🔴 AGENTS.md protection: violation"
    else:
        heading = "## 🔴 AGENTS.md protection: could not be determined"

    lines = [heading, "", result["reason"], ""]
    lines.append("| Field | Value |")
    lines.append("| --- | --- |")
    lines.append("| Result | **%s** |" % result["status"].upper())
    lines.append("| Mode | `%s` |" % result["mode"])
    lines.append(
        "| Baseline AGENTS.md (base branch) | `%s` |"
        % (result["base_agents_sha"] or "unknown")
    )
    lines.append(
        "| Head AGENTS.md | `%s` |" % (result["head_agents_sha"] or "unknown")
    )
    lines.append("| Baseline source | %s |" % result["baseline_source"])
    lines.append("")

    if result["offending_paths"]:
        lines.append("Files outside the governance surface:")
        lines.append("")
        for path in result["offending_paths"]:
            lines.append("- `%s`" % path)
        lines.append("")

    if result["status"] == ALLOWED and result["mode"] == "dedicated":
        lines.append(
            "A dedicated governance pull request may include AGENTS.md, the "
            "protection workflow and checker, their regression tests, the "
            "governance tests that anchor AGENTS.md requirements, and the "
            "Spec Kit and Memory Bank records the repository requires."
        )
        lines.append("")
        lines.append(
            "Human authorization remains mandatory: the configured "
            "`protected-file-authorization` environment must approve this run "
            "before merge. A title, description, label or comment cannot "
            "replace that approval."
        )
        lines.append("")

    lines.append(
        "The approved baseline is the AGENTS.md merged on the pull request's "
        "base branch. Merging an authorized governance change moves the "
        "baseline forward automatically, so later pull requests are not "
        "flagged for that already-approved change."
    )
    return "\n".join(lines) + "\n"


def build_parser():
    parser = argparse.ArgumentParser(
        description=(
            "Classify a pull request that touches AGENTS.md as a dedicated "
            "governance change or an unrelated change. Path-based only: no "
            "title, body, label, comment or branch-name input is accepted."
        )
    )
    parser.add_argument(
        "--changed-files",
        required=True,
        help=(
            "file holding one changed path per line, optionally as "
            "'new_path<TAB>previous_path' for renames"
        ),
    )
    parser.add_argument(
        "--agents-md-status",
        choices=STATUSES,
        default="modified",
        help="GitHub's status for AGENTS.md in this pull request",
    )
    parser.add_argument(
        "--base-agents-sha",
        default="",
        help="Git blob identity of AGENTS.md on the pull request base commit",
    )
    parser.add_argument(
        "--head-agents-sha",
        default="",
        help="Git blob identity of AGENTS.md on the pull request head commit",
    )
    parser.add_argument("--summary", help="append the Markdown report here")
    parser.add_argument("--json", help="write the machine-readable report here")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)

    base_sha = (args.base_agents_sha or "").strip()
    head_sha = (args.head_agents_sha or "").strip()
    for label, value in (("base", base_sha), ("head", head_sha)):
        if value and not re.fullmatch(r"[0-9a-f]{40,64}", value):
            print(
                "AGENTS.MD PROTECTION ERROR: the %s AGENTS.md blob identity is "
                "not a hexadecimal Git object id." % label,
                file=sys.stderr,
            )
            return 2

    try:
        with open(args.changed_files, "r", encoding="utf-8") as handle:
            records = parse_changed_files(handle.readlines())
    except (OSError, ChangeSetError) as error:
        print(
            "AGENTS.MD PROTECTION ERROR: the changed-file list could not be "
            "read or classified: %s" % error,
            file=sys.stderr,
        )
        return 2

    result = classify(records, args.agents_md_status, base_sha, head_sha)
    markdown = render_markdown(result)
    print(markdown)

    if args.json:
        with open(args.json, "w", encoding="utf-8") as handle:
            json.dump(result, handle, indent=2, sort_keys=True)
            handle.write("\n")
    if args.summary:
        with open(args.summary, "a", encoding="utf-8") as handle:
            handle.write(markdown)

    if result["status"] == ALLOWED:
        return 0
    if result["status"] == VIOLATION:
        return 1
    return 2


if __name__ == "__main__":
    sys.exit(main())
