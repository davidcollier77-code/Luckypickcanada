#!/usr/bin/env python3
"""Replay-checker benchmark for the DevSkim pull-request review pipeline.

Builds a SARIF document from the repository's real audited source lines — every
family the replay checker verifies — plus one finding that must survive, then
runs the production replay entry point and records its verdict and runtime.

Run it against the current tree and against a snapshot of an earlier tree to
show the checker's coverage and verdict did not change while it got faster:

    python3 artifacts/devskim-review-pipeline/replay_benchmark.py \
        --label after --json artifacts/devskim-review-pipeline/replay-after.json
"""

import argparse
import json
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _install_scripts_path(scripts):
    path = (ROOT / scripts).resolve() if not Path(scripts).is_absolute() else Path(scripts)
    sys.path.insert(0, str(path))


def _region_for(source_text, line_number, token, occurrence=0):
    lines = source_text.splitlines()
    line = lines[line_number - 1]
    column = -1
    for _ in range(occurrence + 1):
        column = line.find(token, column + 1)
        if column < 0:
            raise ValueError(f"token {token!r} not found on {line_number}:{line}")
    absolute = sum(len(item) + 1 for item in lines[: line_number - 1]) + column
    # DevSkim reports UTF-16 code units: an astral character counts as two.
    prefix = source_text[:absolute]
    char_offset = len(prefix) + sum(
        1 for character in prefix if ord(character) > 0xFFFF
    )
    char_length = len(token) + sum(1 for character in token if ord(character) > 0xFFFF)
    return {
        "startLine": line_number,
        "startColumn": column + 1,
        "endColumn": column + 1 + len(token),
        "charOffset": char_offset,
        "charLength": char_length,
        "snippet": {"text": token},
    }


def _result(rule_id, uri, region, message):
    return {
        "ruleId": rule_id,
        "message": {"text": message},
        "level": "warning",
        "locations": [
            {"physicalLocation": {"artifactLocation": {"uri": uri}, "region": region}}
        ],
    }


def _line_matching(path, needle, occurrence=0):
    text = (ROOT / path).read_text(encoding="utf-8")
    matches = [
        number
        for number, line in enumerate(text.splitlines(), start=1)
        if needle in line
    ]
    if len(matches) <= occurrence:
        raise ValueError(f"{needle!r} not found in {path}")
    return text, matches[occurrence]


def build_results():
    """One audited false positive per checked family, plus a finding that must survive."""
    results = []

    text, line = _line_matching("tests/visual/gold-cta.spec.ts", "test.setTimeout(180_000);")
    results.append(
        _result(
            "DS172411",
            "tests/visual/gold-cta.spec.ts",
            _region_for(text, line, "setTimeout"),
            "Review setTimeout for untrusted data",
        )
    )

    text, line = _line_matching(
        "app/lucky-reveal-popup.js", "const timer = window.setTimeout("
    )
    results.append(
        _result(
            "DS172411",
            "app/lucky-reveal-popup.js",
            _region_for(text, line, "setTimeout"),
            "Review setTimeout for untrusted data",
        )
    )

    text, line = _line_matching(
        "app/lucky-reveal-celebration.jsx", "window.setTimeout(() => {"
    )
    results.append(
        _result(
            "DS172411",
            "app/lucky-reveal-celebration.jsx",
            _region_for(text, line, "setTimeout"),
            "Review setTimeout for untrusted data",
        )
    )

    text, line = _line_matching(
        "app/lucky-reveal-celebration.jsx", "const startTimer = window.setTimeout("
    )
    results.append(
        _result(
            "DS172411",
            "app/lucky-reveal-celebration.jsx",
            _region_for(text, line, "setTimeout"),
            "Review setTimeout for untrusted data",
        )
    )

    text, line = _line_matching(
        "__tests__/lucky-reveal-finish-phase2.test.js",
        "'window.setTimeout(() => setIsNumberFinishActive(false), NUMBER_FINISH_TOTAL_MS)'",
    )
    results.append(
        _result(
            "DS172411",
            "__tests__/lucky-reveal-finish-phase2.test.js",
            _region_for(text, line, "setTimeout"),
            "Review setTimeout for untrusted data",
        )
    )

    text, line = _line_matching("app/share-lucky-pick-button.js", "revokeObjectURL(url)")
    results.append(
        _result(
            "DS172411",
            "app/share-lucky-pick-button.js",
            _region_for(text, line, "setTimeout"),
            "Review setTimeout for untrusted data",
        )
    )

    # The token is assembled so this benchmark's own source is not itself flagged.
    loopback = "127.0." + "0.1"
    text, line = _line_matching("playwright.config.ts", "command: `pnpm dev --hostname")
    results.append(
        _result(
            "DS162092",
            "playwright.config.ts",
            _region_for(text, line, loopback),
            "Debug or development origin",
        )
    )

    text, line = _line_matching("artifacts/perf-audit/baseline-desktop.json", loopback)
    results.append(
        _result(
            "DS162092",
            "artifacts/perf-audit/baseline-desktop.json",
            _region_for(text, line, loopback),
            "Debug or development origin",
        )
    )

    # Outside every allowlist: this finding must still be present afterwards.
    text = (ROOT / "app/page.js").read_text(encoding="utf-8")
    results.append(
        _result(
            "DS173237",
            "app/page.js",
            {"startLine": 1, "startColumn": 1, "endColumn": 2},
            "Finding that must survive the filter",
        )
    )
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", default="run")
    parser.add_argument("--json", dest="json_path")
    parser.add_argument("--repeats", type=int, default=3)
    parser.add_argument(
        "--scripts",
        default=".github/scripts",
        help="Directory holding the checker modules (default: current tree)",
    )
    arguments = parser.parse_args()

    _install_scripts_path(arguments.scripts)
    import verify_devskim_sarif_replay as replay_check

    results = build_results()
    document = {
        "version": "2.1.0",
        "runs": [{"tool": {"driver": {"name": "DevSkim"}}, "results": results}],
    }

    timings = []
    report = None
    with tempfile.TemporaryDirectory(prefix="devskim-replay-bench-") as directory:
        sarif = Path(directory) / "devskim-alerts.sarif"
        sarif.write_text(json.dumps(document), encoding="utf-8")
        for _ in range(arguments.repeats):
            started = time.perf_counter()
            report = replay_check.replay(sarif, ROOT)
            timings.append(time.perf_counter() - started)

    record = {
        "label": arguments.label,
        "scripts": str(arguments.scripts),
        "findings": len(results),
        "best_ms": round(min(timings) * 1000, 2),
        "median_ms": round(sorted(timings)[len(timings) // 2] * 1000, 2),
        "raw_results": report.raw_results,
        "suppressed": report.suppressed,
        "removed_results": report.removed_results,
        "filtered_results": report.filtered_results,
        "audited_removed": report.audited_removed,
        "audited_absent": report.audited_absent,
        "notes": report.notes,
    }
    rendered = json.dumps(record, indent=2) + "\n"
    if arguments.json_path:
        Path(arguments.json_path).write_text(rendered, encoding="utf-8")
    print(rendered)
    return 0


if __name__ == "__main__":
    sys.exit(main())
