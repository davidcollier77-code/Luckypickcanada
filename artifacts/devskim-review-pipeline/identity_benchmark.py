#!/usr/bin/env python3
"""Before/after proof for the DevSkim report identity gap.

Imports an earlier snapshot of ``append_devskim_findings.py`` alongside the
current module and runs the same three scenarios against both:

1. two distinct findings on the same line (same rule, same line, no
   fingerprint) — the earlier identity key ignored the column and collapsed
   them into one entry;
2. the identical finding twice in one report — must be recorded once;
3. a report already holding the earlier module's entry — the current module
   must recognise it and not append a duplicate.

    python3 artifacts/devskim-review-pipeline/identity_benchmark.py \
        --old-scripts /tmp/old-scripts \
        --json artifacts/devskim-review-pipeline/identity-before-after.json
"""

import argparse
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CURRENT_SCRIPTS = ROOT / ".github" / "scripts"


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def _result(column, message="Loopback address in documentation example"):
    return {
        "ruleId": "DS162092",
        "message": {"text": message},
        "level": "note",
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {"uri": "artifacts/example.json"},
                    "region": {
                        "startLine": 4,
                        "startColumn": column,
                        "endColumn": column + 9,
                    },
                }
            }
        ],
    }


def _sarif(results):
    return {
        "version": "2.1.0",
        "runs": [{"tool": {"driver": {"name": "DevSkim"}}, "results": results}],
    }


def _entries(report_path):
    text = report_path.read_text(encoding="utf-8")
    return text.count("<!-- devskim-id:")


def _append(module, results, directory, name):
    sarif = directory / f"{name}.sarif"
    report = directory / f"{name}.md"
    sarif.write_text(json.dumps(_sarif(results)), encoding="utf-8")
    appended = module.append_findings(sarif, report)
    return appended, _entries(report), report


def run(module, directory):
    distinct_appended, distinct_entries, _ = _append(
        module, [_result(3), _result(40)], directory, "distinct"
    )
    duplicate_appended, duplicate_entries, _ = _append(
        module, [_result(3), _result(3)], directory, "duplicate"
    )
    repeat_sarif = directory / "repeat.sarif"
    repeat_report = directory / "repeat.md"
    repeat_sarif.write_text(json.dumps(_sarif([_result(3)])), encoding="utf-8")
    module.append_findings(repeat_sarif, repeat_report)
    repeat_appended = module.append_findings(repeat_sarif, repeat_report)
    repeat_entries = _entries(repeat_report)
    return {
        "distinct_same_line_appended": distinct_appended,
        "distinct_same_line_entries": distinct_entries,
        "duplicate_appended": duplicate_appended,
        "duplicate_entries": duplicate_entries,
        "repeat_is_idempotent": repeat_appended == 0 and repeat_entries == 1,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--old-scripts", required=True)
    parser.add_argument("--json", dest="json_path")
    arguments = parser.parse_args()

    old_path = Path(arguments.old_scripts) / "append_devskim_findings.py"
    before_module = _load("append_devskim_findings_before", old_path)
    after_module = _load("append_devskim_findings_after", CURRENT_SCRIPTS / "append_devskim_findings.py")

    with tempfile.TemporaryDirectory(prefix="devskim-identity-bench-") as directory:
        base = Path(directory)
        (base / "before").mkdir()
        before = run(before_module, base / "before")

        (base / "after").mkdir()
        after = run(after_module, base / "after")

        # 4. A report written by the earlier module must not be re-appended.
        legacy_sarif = base / "legacy.sarif"
        legacy_report = base / "legacy.md"
        legacy_sarif.write_text(json.dumps(_sarif([_result(3)])), encoding="utf-8")
        before_module.append_findings(legacy_sarif, legacy_report)
        legacy_readded = after_module.append_findings(legacy_sarif, legacy_report)
        after["legacy_entry_readded"] = legacy_readded
        after["legacy_entries"] = _entries(legacy_report)

    record = {"before": before, "after": after}
    rendered = json.dumps(record, indent=2) + "\n"
    if arguments.json_path:
        Path(arguments.json_path).write_text(rendered, encoding="utf-8")
    print(rendered)
    return 0


if __name__ == "__main__":
    sys.exit(main())
