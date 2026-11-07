#!/usr/bin/env python3
"""Deterministic benchmark for the DevSkim pull-request review checker.

The workflow runs the suppression filter, then replays the same production
entry point, on every pull request. This harness measures the production
`suppress_sarif` entry point (the exact code the workflow runs) against SARIF
fixtures built from the repository's real allowlisted files, so the before and
after runs process identical input.

Usage:
    python3 artifacts/devskim-review-pipeline/benchmark.py --label before \
        --json artifacts/devskim-review-pipeline/before.json

Metrics recorded per size: best-of-N wall time, `Path.read_text` calls,
`json.loads` calls and the SHA-256 of the filtered SARIF. The digest is the
correctness anchor: a faster run that changes any suppression decision, drops a
finding or reorders results produces a different digest.
"""

import argparse
import hashlib
import json
import re
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _install_scripts_path(scripts):
    """Import the checker from a chosen directory so old and new code can be compared."""
    path = (ROOT / scripts).resolve() if not Path(scripts).is_absolute() else Path(scripts)
    sys.path.insert(0, str(path))


_install_scripts_path(".github/scripts")
import suppress_devskim_false_positives as suppressions  # noqa: E402

MANIFEST = ".docs/manifest.json"
PLAYWRIGHT = "playwright.config.ts"
REVEAL = "app/lucky-reveal-popup.js"
LOCKFILE = "pnpm-lock.yaml"
UNRELATED = "app/page.js"

SHA_ENTRY = re.compile(r'^\s*"(?P<key>/[^"]+)": "(?P<digest>[0-9a-f]{40})",?\s*$')

READS = 0
PARSES = 0
_ORIGINAL_READ_TEXT = Path.read_text
_ORIGINAL_JSON_LOADS = json.loads


def _counting_read_text(self, *args, **kwargs):
    global READS
    READS += 1
    return _ORIGINAL_READ_TEXT(self, *args, **kwargs)


def _counting_json_loads(*args, **kwargs):
    global PARSES
    PARSES += 1
    return _ORIGINAL_JSON_LOADS(*args, **kwargs)


def reset_counters():
    global READS, PARSES
    READS = 0
    PARSES = 0


def _result(rule_id, uri, region, message):
    return {
        "ruleId": rule_id,
        "message": {"text": message},
        "level": "warning",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {"uri": uri},
                    "region": region,
                }
            }
        ],
    }


def _region_for(source_text, line_number, token, token_occurrence=0):
    """Build a real DevSkim-shaped region for one token on one source line."""
    lines = source_text.splitlines()
    line = lines[line_number - 1]
    column = -1
    for _ in range(token_occurrence + 1):
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


def build_anchors():
    """Collect real finding anchors from the repository's allowlisted files."""
    manifest_text = (ROOT / MANIFEST).read_text(encoding="utf-8")
    anchors = []
    for index, line in enumerate(manifest_text.splitlines(), start=1):
        match = SHA_ENTRY.match(line)
        if match:
            anchors.append((line_number := index, match.group("digest")))

    playwright_text = (ROOT / PLAYWRIGHT).read_text(encoding="utf-8")
    playwright_line = next(
        number
        for number, line in enumerate(playwright_text.splitlines(), start=1)
        if "command: `pnpm dev --hostname" in line
    )
    reveal_text = (ROOT / REVEAL).read_text(encoding="utf-8")
    reveal_line = next(
        number
        for number, line in enumerate(reveal_text.splitlines(), start=1)
        if "const timer = window.setTimeout(" in line
    )
    return {
        "manifest_text": manifest_text,
        "anchors": anchors,
        "playwright_text": playwright_text,
        "playwright_line": playwright_line,
        "reveal_text": reveal_text,
        "reveal_line": reveal_line,
    }


def build_findings(anchors, manifest_findings):
    """Build one run of findings: `manifest_findings` in the allowlisted manifest."""
    results = []
    for repeat in range(manifest_findings):
        line_number, digest = anchors["anchors"][repeat % len(anchors["anchors"])]
        results.append(
            _result(
                "DS173237",
                MANIFEST,
                _region_for(anchors["manifest_text"], line_number, digest),
                f"Potential credential: {digest}",
            )
        )
    for _ in range(10):
        results.append(
            _result(
                "DS162092",
                PLAYWRIGHT,
                _region_for(
                    anchors["playwright_text"], anchors["playwright_line"],
                    "127.0.0.1",
                ),
                "Debug or development origin",
            )
        )
    for _ in range(10):
        results.append(
            _result(
                "DS172411",
                REVEAL,
                _region_for(
                    anchors["reveal_text"], anchors["reveal_line"], "setTimeout"
                ),
                "String-based timer call",
            )
        )
    # Unrelated paths stay in the fixture so the fast path is measured too.
    for index in range(40):
        results.append(
            _result(
                "DS173237",
                UNRELATED,
                {"startLine": index + 1, "startColumn": 1, "endColumn": 2},
                "Potential credential in unrelated file",
            )
        )
    return results


def run_fixture(results, repeats):
    document = {
        "version": "2.1.0",
        "runs": [{"tool": {"driver": {"name": "DevSkim"}}, "results": results}],
    }
    payload = json.dumps(document)
    timings = []
    digest = None
    reads = parses = 0
    suppressed = remaining = 0
    with tempfile.TemporaryDirectory(prefix="devskim-bench-") as directory:
        target = Path(directory) / "devskim-alerts.sarif"
        for _ in range(repeats):
            target.write_text(payload, encoding="utf-8")
            reset_counters()
            started = time.perf_counter()
            suppressed = suppressions.suppress_sarif(target, ROOT)
            timings.append(time.perf_counter() - started)
            reads, parses = READS, PARSES
            filtered_document = json.loads(target.read_text(encoding="utf-8"))
            remaining = sum(
                len(run.get("results", [])) for run in filtered_document.get("runs", [])
            )
            digest = hashlib.sha256(target.read_bytes()).hexdigest()
    return {
        "findings": len(results),
        "best_ms": round(min(timings) * 1000, 2),
        "median_ms": round(sorted(timings)[len(timings) // 2] * 1000, 2),
        "source_reads": reads,
        "json_parse_calls": parses,
        "suppressed": suppressed,
        "filtered_results": remaining,
        "filtered_sha256": digest,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", default="run")
    parser.add_argument("--json", dest="json_path")
    parser.add_argument("--repeats", type=int, default=5)
    parser.add_argument(
        "--scripts",
        default=".github/scripts",
        help="Directory holding the checker modules (default: current tree)",
    )
    arguments = parser.parse_args()
    if Path(arguments.scripts).resolve() != (ROOT / ".github" / "scripts").resolve():
        global suppressions
        sys.path.remove(str((ROOT / ".github" / "scripts").resolve()))
        _install_scripts_path(arguments.scripts)
        for name in [key for key in sys.modules if key.startswith(("suppress_", "verify_devskim"))]:
            del sys.modules[name]
        import suppress_devskim_false_positives as replacement

        suppressions = replacement

    anchors = build_anchors()
    Path.read_text = _counting_read_text
    json.loads = _counting_json_loads
    record = {
        "label": arguments.label,
        "workspace": str(ROOT),
        "sizes": {},
    }
    for size in (25, 50, 100, 200, 400):
        record["sizes"][size] = run_fixture(
            build_findings(anchors, size), arguments.repeats
        )

    rendered = json.dumps(record, indent=2) + "\n"
    if arguments.json_path:
        Path(arguments.json_path).write_text(rendered, encoding="utf-8")
    print(rendered)
    return 0


if __name__ == "__main__":
    sys.exit(main())
