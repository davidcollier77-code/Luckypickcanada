#!/usr/bin/env python3
"""Fail-closed applicability decisions for a pull request change set.

The production build is a pure function of committed build inputs, so a change
that cannot alter those inputs does not need the Next/OpenNext build. Visual QA
already has its own committed classifier; this module only composes it so the
executor and the trusted audit use exactly one set of rules.

Every decision fails closed: an empty, unreadable, malformed or unexpected
change set requires the check.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys

# Directories that are never bundled by the production build. Anything not
# positively listed here requires the build: app code, components, configs,
# dependencies, styles, public assets, scripts and unknown paths.
BUILD_EXEMPT_DIRECTORIES = (
    ".agents/",
    ".docs/",
    ".freebuff/",
    ".github/",
    ".specify/",
    "artifacts/",
    "docs/",
    "memory-bank/",
    "specs/",
    "tests/",
    "__tests__/",
)
BUILD_EXEMPT_NAMES = (
    "AGENTS.md",
    "LICENSE",
    "PR_SUBMISSION.md",
    "PR_SUMMARY.md",
    "README.md",
)
BUILD_EXEMPT_SUFFIXES = (".md",)


class ApplicabilityError(RuntimeError):
    """The change set cannot be read, so the decision must fail closed."""


def read_changed_paths(path=None):
    """Read a path list from a text file, a GitHub files JSON file or stdin."""
    if path:
        try:
            with open(path, encoding="utf-8") as handle:
                text = handle.read()
        except OSError as error:
            raise ApplicabilityError("the changed-file list could not be read: %s" % error)
    else:
        text = sys.stdin.read()

    stripped = text.strip()
    if not stripped:
        return []
    if stripped.startswith("["):
        try:
            payload = json.loads(stripped)
        except json.JSONDecodeError as error:
            raise ApplicabilityError("the changed-file JSON is malformed: %s" % error)
        if not isinstance(payload, list):
            raise ApplicabilityError("the changed-file JSON must be an array")
        paths = []
        for record in payload:
            if isinstance(record, dict):
                candidate = record.get("filename") or record.get("path") or ""
            else:
                candidate = record if isinstance(record, str) else ""
            if candidate:
                paths.append(candidate)
        return paths
    return [line.strip() for line in text.splitlines() if line.strip()]


def _normalized(path):
    return str(path or "").replace("\\", "/").strip()


def build_exempt(path):
    """True only when the path is proven unable to affect the build."""
    candidate = _normalized(path)
    if not candidate:
        return False
    if candidate in BUILD_EXEMPT_NAMES:
        return True
    if candidate.endswith(BUILD_EXEMPT_SUFFIXES):
        return True
    return any(candidate.startswith(directory) for directory in BUILD_EXEMPT_DIRECTORIES)


def classify_build(paths):
    """Return (required, reason). Empty or uncertain input requires the build."""
    cleaned = [_normalized(path) for path in paths if _normalized(path)]
    if not cleaned:
        return True, "the change set is empty or unreadable; the build is required (fail-closed)"
    affecting = [path for path in cleaned if not build_exempt(path)]
    if affecting:
        shown = ", ".join(affecting[:5])
        more = "" if len(affecting) <= 5 else " (+%d more)" % (len(affecting) - 5)
        return True, "build input(s) changed: %s%s" % (shown, more)
    return False, "every changed path is documentation, Spec Kit, Memory Bank, CI, test or agent metadata"


def classify_visual(paths, package_json_scripts_only=False, declared_required=False, script_dir=None):
    """Run the committed visual classifier; unknown output requires visual QA."""
    cleaned = [_normalized(path) for path in paths if _normalized(path)]
    if declared_required:
        return True, "the pull request declares visual_impact.required=true"
    if not cleaned:
        return True, "the change set is empty or unreadable; visual QA is required (fail-closed)"

    directory = script_dir or os.path.dirname(os.path.abspath(__file__))
    classifier = os.path.join(directory, "classify-visual-changes.sh")
    if not os.path.isfile(classifier):
        return True, "the visual classifier is missing; visual QA is required (fail-closed)"
    environment = dict(os.environ)
    environment["PACKAGE_JSON_SCRIPTS_ONLY"] = (
        "true" if package_json_scripts_only else "false"
    )
    try:
        result = subprocess.run(
            ["bash", classifier],
            input="\n".join(cleaned) + "\n",
            capture_output=True,
            text=True,
            env=environment,
            check=False,
        )
    except OSError as error:
        return True, "the visual classifier could not run (%s); fail-closed" % error
    if result.returncode != 0:
        return True, "the visual classifier failed; visual QA is required (fail-closed)"
    output = (result.stdout or "").strip()
    if output == "visual_required=false":
        return False, "every changed path is proven non-rendering"
    if output == "visual_required=true":
        return True, "a changed path can affect rendered output"
    return True, "the visual classifier returned unexpected output; fail-closed"


def _single_line(value):
    return " ".join(str(value).split())


def _emit(payload, output_format):
    if output_format == "json":
        print(json.dumps(payload, sort_keys=True))
        return
    for key, value in payload.items():
        if isinstance(value, bool):
            value = "true" if value else "false"
        print("%s=%s" % (key, value))


def build_parser():
    parser = argparse.ArgumentParser(
        description="Decide, fail-closed, whether a change set requires the build and visual QA."
    )
    parser.add_argument("--files", help="changed paths (text or GitHub files JSON); default stdin")
    parser.add_argument(
        "--format",
        choices=("github", "json"),
        default="github",
        help="github prints key=value lines; json prints one object",
    )
    parser.add_argument(
        "--classify-visual",
        action="store_true",
        help="also run the committed visual classifier",
    )
    parser.add_argument(
        "--package-json-scripts-only",
        choices=("true", "false"),
        default="false",
        help="the caller's package.json scripts-only determination",
    )
    parser.add_argument(
        "--declared-visual-required",
        action="store_true",
        help="the PR body declares visual_impact.required=true",
    )
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        paths = read_changed_paths(args.files)
    except ApplicabilityError as error:
        print("APPLICABILITY ERROR: %s" % error, file=sys.stderr)
        payload = {
            "build_required": True,
            "build_reason": _single_line(error),
            "visual_required": True,
            "visual_reason": _single_line(error),
        }
        _emit(payload, args.format)
        return 0

    build_required, build_reason = classify_build(paths)
    payload = {
        "build_required": build_required,
        "build_reason": _single_line(build_reason),
    }
    if args.classify_visual:
        visual_required, visual_reason = classify_visual(
            paths,
            package_json_scripts_only=args.package_json_scripts_only == "true",
            declared_required=args.declared_visual_required,
        )
        payload["visual_required"] = visual_required
        payload["visual_reason"] = _single_line(visual_reason)

    _emit(payload, args.format)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
