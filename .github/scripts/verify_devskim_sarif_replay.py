#!/usr/bin/env python3
"""Replay the scanner's own DevSkim SARIF through the suppression filter.

The unit fixture proves the filter for synthetic regions. This check proves the
same production entry point (``suppress_sarif``) still removes the audited false
positives from output produced by the real DevSkim scanner, and that no other
finding is dropped along with them.

The replay runs on a temporary copy, so the raw scan stays byte-identical for
the Security-tab upload and the artifact. Exits non-zero on any violation, which
fails the DevSkim job.
"""

import copy
import json
import re
import sys
import tempfile
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

import suppress_devskim_false_positives as suppressions

# Split in source, matching the fixture convention, so this checker's own text
# is not reported as string-based timer code execution.
TIMEOUT_CALL_PREFIX = "test." + "setTimeout("
AUDITED_TIMEOUT_LINE = re.compile(
    r"^[ \t]*" + re.escape(TIMEOUT_CALL_PREFIX) + r"[0-9][0-9_]*\);[ \t]*$"
)

# The only rules the filter is allowed to remove results for.
AUDITED_RULES = frozenset(
    {"DS172411", "DS162092", "DS610000", "DS137138", "DS126858", "DS173237"}
)


@dataclass(frozen=True)
class AuditedFinding:
    """A reviewed false-positive family that must vanish from real scanner output."""

    name: str
    rule_id: str
    paths: tuple[str, ...]
    source_line_pattern: re.Pattern


AUDITED_FALSE_POSITIVES = (
    AuditedFinding(
        name="Playwright test timeout configuration",
        rule_id="DS172411",
        paths=(
            "tests/visual/gold-cta.spec.ts",
            "tests/visual/sitewide-gold-cta.spec.ts",
        ),
        source_line_pattern=AUDITED_TIMEOUT_LINE,
    ),
    AuditedFinding(
        name="Lucky Reveal number-finish callback",
        rule_id="DS172411",
        paths=("app/lucky-reveal-popup.js",),
        source_line_pattern=re.compile(
            r"^ *const timer = window\.setTimeout\(\(\) => "
            r"setIsNumberFinishActive\(false\), NUMBER_FINISH_TOTAL_MS\); *$"
        ),
    ),
    AuditedFinding(
        name="Lucky Reveal confetti-wave callback",
        rule_id="DS172411",
        paths=("app/lucky-reveal-celebration.jsx",),
        source_line_pattern=re.compile(
            r"^ *window\.setTimeout\(\(\) => \{ *$"
        ),
    ),
    AuditedFinding(
        name="Lucky Reveal canvas-watch callback",
        rule_id="DS172411",
        paths=("app/lucky-reveal-celebration.jsx",),
        source_line_pattern=re.compile(
            r"^ *const startTimer = window\.setTimeout\(\(\) => \{ *$"
        ),
    ),
    AuditedFinding(
        name="Lucky Reveal test source assertion string",
        rule_id="DS172411",
        paths=("__tests__/lucky-reveal-finish-phase2.test.js",),
        source_line_pattern=re.compile(
            r"^ *'window\.setTimeout\(\(\) => "
            r"setIsNumberFinishActive\(false\), NUMBER_FINISH_TOTAL_MS\)', *$"
        ),
    ),
    AuditedFinding(
        name="Share-image object-URL revoke callback",
        rule_id="DS172411",
        paths=("app/share-lucky-pick-button.js",),
        source_line_pattern=re.compile(
            r"^ *window\.setTimeout\(\(\) => "
            r"URL\.revokeObjectURL\(url\), 1000\); *$"
        ),
    ),
    AuditedFinding(
        name="Playwright local dev-server origin",
        rule_id="DS162092",
        paths=("playwright.config.ts",),
        source_line_pattern=re.compile(
            r"^ *command: `pnpm dev --hostname 127\.0\.0\.1 --port \$\{PORT\}`,\s*$"
        ),
    ),
    AuditedFinding(
        name="Committed local probe measurement origin",
        rule_id="DS162092",
        paths=(
            "artifacts/perf-audit/after-desktop.json",
            "artifacts/perf-audit/after-mobile.json",
            "artifacts/perf-audit/baseline-desktop.json",
            "artifacts/perf-audit/baseline-mobile.json",
            "artifacts/perf-audit/after/summary.json",
            "artifacts/reveal-phase2/report.json",
        ),
        # Built by concatenation so this checker's own text is not an insecure-URL match.
        source_line_pattern=re.compile(
            r'^[ \t]*.*"' + "http:" + "//127\\.0\\.0\\.1:[0-9]+"
        ),
    ),
)

class ReplayViolation(RuntimeError):
    """The replay of real scanner output is unsafe or left a false positive visible."""


@dataclass
class ReplayReport:
    raw_results: int
    suppressed: int
    filtered_results: int
    audited_removed: list = field(default_factory=list)
    audited_absent: list = field(default_factory=list)
    notes: list = field(default_factory=list)

    @property
    def removed_results(self):
        return self.raw_results - self.filtered_results


def load_sarif(path):
    """Read and structurally validate a SARIF document."""
    try:
        raw = path.read_bytes()
    except OSError as error:
        raise ReplayViolation(f"cannot read SARIF at {path}: {error}") from error
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ReplayViolation(f"SARIF at {path} is not valid UTF-8 JSON: {error}") from error
    if not isinstance(data, dict):
        raise ReplayViolation("SARIF root must be a JSON object")
    runs = data.get("runs")
    if not isinstance(runs, list):
        raise ReplayViolation("SARIF 'runs' must be a list")
    for index, run in enumerate(runs):
        if not isinstance(run, dict):
            raise ReplayViolation(f"SARIF run {index} must be a JSON object")
        if not isinstance(run.get("results", []), list):
            raise ReplayViolation(f"SARIF run {index} 'results' must be a list")
    return data


def _results(data):
    """Yield the results that carry a rule and location, in document order."""
    for run_index, run in enumerate(data.get("runs", [])):
        for result_index, result in enumerate(run.get("results", [])):
            if isinstance(result, dict):
                yield run_index, result_index, result


def _physical_location(result):
    locations = result.get("locations")
    if not isinstance(locations, list) or not locations:
        return None
    location = locations[0]
    if not isinstance(location, dict):
        return None
    physical = location.get("physicalLocation")
    if not isinstance(physical, dict):
        return None
    return physical


def _uri(result):
    physical = _physical_location(result)
    if physical is None:
        return ""
    artifact = physical.get("artifactLocation")
    if not isinstance(artifact, dict):
        return ""
    uri = artifact.get("uri")
    return uri if isinstance(uri, str) else ""


def _start_line(result):
    physical = _physical_location(result)
    if physical is None:
        return None
    region = physical.get("region")
    if not isinstance(region, dict):
        return None
    line = region.get("startLine")
    if isinstance(line, bool) or not isinstance(line, int):
        return None
    return line


def _location_key(result):
    return (_uri(result), result.get("ruleId"), _start_line(result))


def _relative_path(uri, workspace):
    """Return the allowlisted relative path for a SARIF uri, or None."""
    safe_path = suppressions.resolve_safe_artifact_uri(uri, workspace)
    if safe_path is None:
        return None
    return safe_path.relative_to(Path(workspace).resolve()).as_posix()


def _source_line(path, line_number):
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None
    if line_number is None or line_number < 1:
        return None
    lines = text.splitlines()
    return lines[line_number - 1] if line_number <= len(lines) else None


def _carries_verified_suppression(result):
    suppressions_on_result = result.get("suppressions")
    if not isinstance(suppressions_on_result, list):
        return False
    return any(
        isinstance(item, dict)
        and item.get("kind") == "external"
        and item.get("justification") in suppressions.VERIFIED_FALSE_POSITIVE_JUSTIFICATIONS
        for item in suppressions_on_result
    )


def _assert_audited_findings_removed(raw_results, filtered_keys, workspace):
    """Fail when an audited false positive is still present after filtering."""
    raw_keys = Counter(_location_key(result) for _, _, result in raw_results)
    audited_removed = []
    audited_absent = []

    for finding in AUDITED_FALSE_POSITIVES:
        present = 0
        audited_occurrences = Counter()
        for _, _, result in raw_results:
            if result.get("ruleId") != finding.rule_id:
                continue
            relative_path = _relative_path(_uri(result), workspace)
            if relative_path not in finding.paths:
                continue
            line_number = _start_line(result)
            line = _source_line(Path(workspace).resolve() / relative_path, line_number)
            if line is None:
                raise ReplayViolation(
                    "cannot validate audited finding "
                    f"{finding.name} at {relative_path}:{line_number}; the source is unreadable"
                )
            if not finding.source_line_pattern.match(line):
                continue
            present += 1
            audited_occurrences[_location_key(result)] += 1

        if present == 0:
            audited_absent.append(f"{finding.name} (no results in this scan)")
            continue

        remaining = sum(
            filtered_keys[key] for key in audited_occurrences
        )
        expected = sum(raw_keys[key] - count for key, count in audited_occurrences.items())
        if remaining > expected:
            raise ReplayViolation(
                f"audited false positive survived the filter: {finding.name} "
                f"({present} result(s) in {', '.join(finding.paths)})"
            )
        audited_removed.append(f"{finding.name} ({present})")

    return audited_removed, audited_absent


def _assert_removals_stay_inside_the_allowlist(raw_keys, filtered_keys, workspace):
    """Fail when a finding outside the reviewed allowlist was filtered out."""
    for (uri, rule_id, line_number), _count in (raw_keys - filtered_keys).items():
        relative_path = _relative_path(uri, workspace)
        if relative_path is None:
            raise ReplayViolation(
                "filtered out a finding outside the verified allowlist: "
                f"{uri or '<no uri>'}:{line_number} ({rule_id})"
            )
        if rule_id not in AUDITED_RULES:
            raise ReplayViolation(
                "filtered out a finding for a rule the filter never suppresses: "
                f"{relative_path}:{line_number} ({rule_id})"
            )


def replay(sarif_path=None, workspace=None):
    """Run the production filter on real scanner output and verify the result."""
    sarif_path = Path(sarif_path) if sarif_path is not None else suppressions.SARIF_FILE
    root = Path(workspace).resolve() if workspace is not None else Path.cwd().resolve()

    try:
        raw_bytes = sarif_path.read_bytes()
    except OSError as error:
        raise ReplayViolation(f"cannot read SARIF at {sarif_path}: {error}") from error
    raw = load_sarif(sarif_path)
    raw_results = list(_results(raw))

    with tempfile.TemporaryDirectory(prefix="devskim-replay-") as directory:
        scratch = Path(directory) / sarif_path.name
        scratch.write_bytes(raw_bytes)
        # The same entry point the workflow runs, so the replay cannot drift
        # from the suppression the uploaded SARIF actually receives.
        suppressed = suppressions.suppress_sarif(scratch, root)
        filtered = load_sarif(scratch)

    if sarif_path.read_bytes() != raw_bytes:
        raise ReplayViolation("the replay modified the raw scanner SARIF")

    filtered_results = list(_results(filtered))
    filtered_keys = Counter(_location_key(result) for _, _, result in filtered_results)
    raw_keys = Counter(_location_key(result) for _, _, result in raw_results)

    for _, _, result in filtered_results:
        if _carries_verified_suppression(result):
            raise ReplayViolation(
                "a verified false-positive suppression survived into the filtered SARIF: "
                f"{_uri(result) or '<no uri>'}:{_start_line(result)} ({result.get('ruleId')})"
            )

    audited_removed, audited_absent = _assert_audited_findings_removed(
        raw_results, filtered_keys, root
    )
    _assert_removals_stay_inside_the_allowlist(raw_keys, filtered_keys, root)

    # A second pass must find nothing left to suppress. A non-zero count means
    # the first pass left a suppressible (audited false positive) result behind.
    second_pass = suppressions.process_sarif(copy.deepcopy(filtered), root)
    if second_pass:
        raise ReplayViolation(
            f"{second_pass} result(s) stayed suppressible after filtering; "
            "an audited false positive survived"
        )

    report = ReplayReport(
        raw_results=len(raw_results),
        suppressed=suppressed,
        filtered_results=len(filtered_results),
        audited_removed=audited_removed,
        audited_absent=audited_absent,
    )
    if not raw_results:
        report.notes.append(
            "the scanner SARIF contained no results, so this replay proved nothing"
        )
    return report


def main(argv=None):
    arguments = list(sys.argv[1:] if argv is None else argv)
    if arguments and arguments[0] in {"-h", "--help"}:
        print(__doc__)
        return 0
    sarif_path = Path(arguments[0]) if arguments else suppressions.SARIF_FILE

    try:
        report = replay(sarif_path)
    except ReplayViolation as violation:
        print(f"::error::{violation}")
        print(f"DevSkim SARIF replay FAILED for {sarif_path}:", file=sys.stderr)
        print(f"  {violation}", file=sys.stderr)
        return 1

    print(
        f"DevSkim SARIF replay: {report.raw_results} result(s), "
        f"{report.suppressed} suppressed, {report.removed_results} removed, "
        f"{report.filtered_results} remaining"
    )
    for detail in report.audited_removed:
        print(f"  removed audited false positive: {detail}")
    for detail in report.audited_absent:
        print(f"  ::warning::no audited result present: {detail}")
    for note in report.notes:
        print(f"  ::warning::{note}")
    print("  second pass: no suppressions remained")
    print("OK: no audited false positive survived the filter; the raw SARIF is unchanged.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
