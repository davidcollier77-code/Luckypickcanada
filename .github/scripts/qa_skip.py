#!/usr/bin/env python3
"""Shared contract for an authorized, proven-inapplicable QA skip.

A check may only be skipped when a trusted authority proves it cannot apply and
the skip states why. The individual item is rendered as
``SKIPPED — NOT APPLICABLE``; it is never rendered as ``PASSED``. When every
other applicable requirement passes, the category and the pull request check
still report success.

Authorities are closed: no PR text, label, waiver command or free-form reason
can create a skip. An unauthorized, unexplained or accidental skip stays
``NOT RUN``/``FAILED`` and can never make verification green.

* ``trusted-applicability-classifier`` — the base-branch path classifier proved
  that no changed path can affect the build or rendered output. Applies to any
  pull request.
* ``actor-inapplicable`` — a human-only attestation on an automation-authored
  pull request, where the human action cannot exist.
* ``verified-dependabot-maintenance`` — the narrow declarations that cannot
  apply to a verified Dependabot dependency update.
"""

from __future__ import annotations

import re
from pathlib import PurePosixPath

LABEL = "SKIPPED — NOT APPLICABLE"

TRUSTED_CLASSIFIER = "trusted-applicability-classifier"
ACTOR_INAPPLICABLE = "actor-inapplicable"
VERIFIED_DEPENDABOT_MAINTENANCE = "verified-dependabot-maintenance"
AUTHORITIES = (
    TRUSTED_CLASSIFIER,
    ACTOR_INAPPLICABLE,
    VERIFIED_DEPENDABOT_MAINTENANCE,
)
MIN_REASON_LENGTH = 12
REASON_WORDING = re.compile(r"\b(todo|tbd|fill this in)\b|<[^>]+>", re.I)

DEPENDABOT_LOGIN = "dependabot[bot]"
DEPENDABOT_AUTHOR_EMAIL = "49699333+dependabot[bot]@users.noreply.github.com"
GITHUB_COMMITTER_EMAIL = "noreply@github.com"
LOCKFILES = frozenset({"pnpm-lock.yaml", "package-lock.json", "yarn.lock"})
MAINTENANCE_PATHS = frozenset({".github/dependabot.yml"})


class SkipError(ValueError):
    """A skip record cannot be trusted."""


def valid_reason(reason) -> bool:
    """Return True for a specific, non-placeholder reason."""
    if not isinstance(reason, str):
        return False
    text = reason.strip()
    if len(text) < MIN_REASON_LENGTH:
        return False
    return not REASON_WORDING.search(text)


def is_authorized(authority, reason) -> bool:
    """Return True only for a documented authority with a specific reason."""
    return isinstance(authority, str) and authority in AUTHORITIES and valid_reason(reason)


def record(authority: str, reason: str) -> dict:
    """Build one authorized skip record, rejecting anything untrusted."""
    if not is_authorized(authority, reason):
        raise SkipError(
            "an authorized skip needs a documented authority and a specific reason"
        )
    return {"authority": authority, "reason": reason.strip(), "label": LABEL}


def record_or_none(authority, reason):
    return record(authority, reason) if is_authorized(authority, reason) else None


def is_authorized_record(value) -> bool:
    if not isinstance(value, dict):
        return False
    return is_authorized(value.get("authority"), value.get("reason"))


def display_status(status: str, skip) -> str:
    """Render one item: an authorized skip keeps its own label, never a pass."""
    if is_authorized_record(skip):
        return LABEL
    return status


def _is_maintenance_path(path: str) -> bool:
    if path in MAINTENANCE_PATHS:
        return True
    name = PurePosixPath(path).name
    if name == "package.json" or name in LOCKFILES:
        # A dependency update may touch a nested workspace manifest as well as
        # the root one; neither can affect QA behaviour.
        return True
    return path.startswith(".github/workflows/") and path.endswith(
        (".yml", ".yaml")
    )


def dependabot_maintenance(pr, commits, files):
    """Prove that a pull request is a verified Dependabot maintenance update.

    Returns ``(verified, reason)``. Every condition must hold; a missing or
    malformed input is not verified, so the exemption fails closed.
    """
    if not isinstance(pr, dict):
        return False, "pull request metadata is missing"
    author = pr.get("user") if isinstance(pr.get("user"), dict) else {}
    if (author.get("login") or "").casefold() != DEPENDABOT_LOGIN:
        return False, "the author is not Dependabot"
    if (author.get("type") or "").casefold() != "bot":
        return False, "the Dependabot author is not a bot actor"
    if not isinstance(commits, list) or not commits:
        return False, "the pull request commit list is missing"
    for commit in commits:
        if not isinstance(commit, dict):
            return False, "the commit list contains a malformed record"
        top_author = commit.get("author") if isinstance(commit.get("author"), dict) else {}
        if (top_author.get("login") or "").casefold() != DEPENDABOT_LOGIN:
            return False, "a commit is not authored by Dependabot"
        author_email = (
            (commit.get("commit") or {}).get("author") or {}
        ).get("email") or ""
        committer_email = (
            (commit.get("commit") or {}).get("committer") or {}
        ).get("email") or ""
        if author_email.casefold() != DEPENDABOT_AUTHOR_EMAIL.casefold():
            return False, "a commit has an unexpected author email"
        if committer_email.casefold() != GITHUB_COMMITTER_EMAIL:
            return False, "a commit has an unexpected committer email"
    if not isinstance(files, list) or not files:
        return False, "the changed-file list is missing"
    for entry in files:
        if not isinstance(entry, dict) or not entry.get("filename"):
            return False, "the changed-file list contains a malformed record"
        if not _is_maintenance_path(entry["filename"]):
            return False, "the update changes a path outside dependency maintenance"
    return True, "verified Dependabot maintenance update"
