#!/usr/bin/env python3
"""Before/after proof for the DevSkim report identity.

Imports an earlier snapshot of ``append_devskim_findings.py`` alongside the
current module and runs the same scenarios against both:

1. two distinct findings on the same line (same rule, same message, same
   columns, no fingerprint) -- the original identity key collapsed them;
2. the identical finding twice in one report -- must be recorded once;
3. the same scan appended twice -- the second run appends nothing;
4. a report already holding the earlier module's entry -- the current module
   must recognise it;
5. a new same-shape finding inserted *between* two known findings -- the
   insertion must be recorded at its own line and the known findings must not be
   recorded again (the occurrence-rank defect reported on PR #2065);
6. a known finding remediated and a different new one appearing afterwards --
   the new finding must be recorded rather than skipped.

Findings are built from real source text, the way DevSkim reports them, so the
identity can use the matched span instead of a per-scan rank.

    python3 artifacts/devskim-review-pipeline/identity_benchmark.py \
        --old-scripts /tmp/old-scripts \
        --json specs/231-devskim-ledger-stable-identity/evidence/identity-benchmark.json
"""

import argparse
import contextlib
import importlib.util
import json
import os
import re
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CURRENT_SCRIPTS = ROOT / ".github" / "scripts"
URI = "src/example.ts"
MESSAGE = "Do not store tokens or keys in source code."
ROW = re.compile(r"`([^`\n]+)`[^\n]*?<!-- devskim-id:[0-9a-f]{20} -->")


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def _source(*tokens):
    """One line per token, with identical prefixes so every line has one column."""
    return "\n".join(f'const token = "{token}";' for token in tokens) + "\n"


def _result(source, token):
    index = source.index(token)
    line = source.count("\n", 0, index) + 1
    column = index - source.rfind("\n", 0, index)
    return {
        "ruleId": "DS173237",
        "level": "error",
        "message": {"text": MESSAGE},
        "locations": [
            {
                "physicalLocation": {
                    "artifactLocation": {"uri": URI},
                    "region": {
                        "startLine": line,
                        "startColumn": column,
                        "endColumn": column + len(token),
                        "charOffset": index,
                        "charLength": len(token),
                        "snippet": {"text": token},
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
    return report_path.read_text(encoding="utf-8").count("<!-- devskim-id:")


def _rows(report_path):
    """Return the ``uri:line`` locations the ledger names, in file order."""
    return ROW.findall(report_path.read_text(encoding="utf-8"))


def _row_lines(report_path):
    return [
        line
        for line in report_path.read_text(encoding="utf-8").splitlines()
        if "<!-- devskim-id:" in line
    ]


def _row_where(row):
    """Return the ``uri:line`` recorded in one ledger row."""
    return row.split("`")[1] if "`" in row else ""


def _line_of(source, token):
    return source.count("\n", 0, source.index(token)) + 1


@contextlib.contextmanager
def _working_directory(path):
    previous = Path.cwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(previous)


def _sequence(module, root, name, scans):
    """Run a sequence of scans and report what each one appended."""
    directory = root / name
    (directory / "src").mkdir(parents=True)
    source_file = directory / "src" / "example.ts"
    report = directory / "report.md"
    appended = []
    locations = []
    appended_rows = []
    previous = []
    with _working_directory(directory):
        for number, tokens in enumerate(scans):
            source = _source(*tokens)
            source_file.write_text(source, encoding="utf-8")
            sarif = directory / f"scan-{number}.sarif"
            results = [_result(source, token) for token in tokens]
            sarif.write_text(json.dumps(_sarif(results)), encoding="utf-8")
            appended.append(module.append_findings(sarif, report))
            locations.append(_rows(report))
            current = _row_lines(report)
            appended_rows.append(current[len(previous):])
            previous = current
    return {
        "appended": appended,
        "rows": locations,
        "appended_rows": appended_rows,
        "entries": _entries(report),
        "final_rows": _rows(report),
    }


def run(module, directory):
    """Run every scenario for one module and return its record."""
    source_file = directory / "src" / "example.ts"
    (directory / "src").mkdir(parents=True, exist_ok=True)
    alpha, beta, gamma, omega = ("a" * 56, "b" * 56, "c" * 56, "d" * 56)

    distinct_appended, distinct_entries, _ = _append(
        module,
        directory,
        source_file,
        "distinct",
        f'const pair = ["{alpha}", "{omega}"];\n',
    )
    duplicate_appended, duplicate_entries, _ = _append(
        module, directory, source_file, "duplicate", _source(alpha), [alpha, alpha]
    )
    repeat_sarif = directory / "repeat.sarif"
    repeat_report = directory / "repeat.md"
    repeat_source = _source(alpha)
    source_file.write_text(repeat_source, encoding="utf-8")
    repeat_sarif.write_text(
        json.dumps(_sarif([_result(repeat_source, alpha)])), encoding="utf-8"
    )
    with _working_directory(directory):
        module.append_findings(repeat_sarif, repeat_report)
        repeat_appended = module.append_findings(repeat_sarif, repeat_report)
    repeat_entries = _entries(repeat_report)

    # The same SARIF appended from a workspace whose source has changed: the
    # report job can reuse an older report branch, so the checkout may not match
    # the scanned revision and the identity must not read it.
    drift_dir = directory / "workspace-drift"
    (drift_dir / "src").mkdir(parents=True)
    drift_source = _source(alpha)
    (drift_dir / "src" / "example.ts").write_text(drift_source, encoding="utf-8")
    drift_sarif = drift_dir / "scan.sarif"
    drift_sarif.write_text(
        json.dumps(_sarif([_result(drift_source, alpha)])), encoding="utf-8"
    )
    drift_report = drift_dir / "report.md"
    with _working_directory(drift_dir):
        drift_first = module.append_findings(drift_sarif, drift_report)
        (drift_dir / "src" / "example.ts").write_text(
            "// source from another revision\n", encoding="utf-8"
        )
        drift_second = module.append_findings(drift_sarif, drift_report)
    drift_entries = _entries(drift_report)

    insertion_scans = [(alpha, omega), (alpha, beta, omega)]
    insertion = _sequence(module, directory, "insertion", insertion_scans)
    remediation_scans = [(alpha, omega), (alpha,), (alpha, gamma)]
    remediation = _sequence(module, directory, "remediation", remediation_scans)
    insertion_expected = f"{URI}:{_line_of(_source(*insertion_scans[1]), beta)}"
    remediation_expected = f"{URI}:{_line_of(_source(*remediation_scans[2]), gamma)}"
    insertion_added = insertion["appended_rows"][1]
    remediation_added = remediation["appended_rows"][2]

    return {
        "distinct_same_line_appended": distinct_appended,
        "distinct_same_line_entries": distinct_entries,
        "duplicate_appended": duplicate_appended,
        "duplicate_entries": duplicate_entries,
        "repeat_is_idempotent": repeat_appended == 0 and repeat_entries == 1,
        "workspace_changed_appended": [drift_first, drift_second],
        "workspace_changed_entries": drift_entries,
        "insertion_appended": insertion["appended"],
        "insertion_appended_rows": insertion["appended_rows"],
        "insertion_rows": insertion["rows"],
        "insertion_final_rows": insertion["final_rows"],
        "insertion_entries": insertion["entries"],
        "insertion_expected_where": insertion_expected,
        "insertion_new_finding_recorded_at_expected_line": (
            len(insertion_added) == 1
            and _row_where(insertion_added[0]) == insertion_expected
        ),
        "remediation_appended": remediation["appended"],
        "remediation_appended_rows": remediation["appended_rows"],
        "remediation_rows": remediation["rows"],
        "remediation_final_rows": remediation["final_rows"],
        "remediation_entries": remediation["entries"],
        "remediation_expected_where": remediation_expected,
        "remediation_new_finding_recorded_at_expected_line": (
            len(remediation_added) == 1
            and _row_where(remediation_added[0]) == remediation_expected
        ),
    }


def _append(module, directory, source_file, name, source, tokens=None):
    """Append one scan of ``tokens`` (default: every token in ``source``)."""
    tokens = tokens or [token for token in _tokens(source)]
    scan_dir = directory / name
    scan_dir.mkdir(parents=True, exist_ok=True)
    report = scan_dir / "report.md"
    source_file.write_text(source, encoding="utf-8")
    sarif = scan_dir / "scan.sarif"
    sarif.write_text(
        json.dumps(_sarif([_result(source, token) for token in tokens])), encoding="utf-8"
    )
    with _working_directory(directory):
        appended = module.append_findings(sarif, report)
    return appended, _entries(report), report


def _tokens(source):
    return re.findall(r'"([a-f]+)"', source)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--old-scripts", required=True)
    parser.add_argument("--json", dest="json_path")
    arguments = parser.parse_args()

    old_path = Path(arguments.old_scripts) / "append_devskim_findings.py"
    before_module = _load("append_devskim_findings_before", old_path)
    after_module = _load(
        "append_devskim_findings_after",
        CURRENT_SCRIPTS / "append_devskim_findings.py",
    )

    with tempfile.TemporaryDirectory(prefix="devskim-identity-bench-") as directory:
        base = Path(directory)
        before = run(before_module, base / "before")
        after = run(after_module, base / "after")

        # A report written by the earlier module must not be re-appended.
        legacy_dir = base / "legacy"
        legacy_dir.mkdir()
        source_file = legacy_dir / "src" / "example.ts"
        (legacy_dir / "src").mkdir()
        source = _source("a" * 56)
        source_file.write_text(source, encoding="utf-8")
        legacy_sarif = legacy_dir / "scan.sarif"
        legacy_sarif.write_text(
            json.dumps(_sarif([_result(source, "a" * 56)])), encoding="utf-8"
        )
        legacy_report = legacy_dir / "report.md"
        with _working_directory(legacy_dir):
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
