import json
import tempfile
import unittest
from pathlib import Path

from summarize_devskim_findings import SarifSummaryError, build_report, render_markdown


def write_sarif(path, results):
    path.write_text(json.dumps({
        "version": "2.1.0",
        "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
        "runs": [{
            "tool": {"driver": {"name": "Microsoft DevSkim"}},
            "results": results,
        }],
    }), encoding="utf-8")


def result(rule, path, line, message, severity="ManualReview", confidence="High"):
    return {
        "ruleId": rule,
        "level": "note",
        "message": {"text": message},
        "locations": [{
            "physicalLocation": {
                "artifactLocation": {"uri": path},
                "region": {"startLine": line},
            }
        }],
        "properties": {
            "DevSkimSeverity": severity,
            "DevSkimConfidence": confidence,
        },
    }


class DevSkimSummaryTests(unittest.TestCase):
    def test_reports_raw_filtered_and_suppressed_counts(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory) / "raw.sarif"
            filtered = Path(directory) / "filtered.sarif"
            results = [
                result("DS1", "app/a.ts", 10, "first"),
                result("DS2", "app/b.ts", 20, "second"),
                result("DS3", "app/c.ts", 30, "third"),
            ]
            write_sarif(raw, results)
            write_sarif(filtered, [results[2]])
            report = build_report(raw, filtered)
            self.assertEqual(report["raw_count"], 3)
            self.assertEqual(report["filtered_count"], 1)
            self.assertEqual(report["suppressed_count"], 2)

    def test_keeps_every_remaining_finding_visible_with_location_and_rule(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory) / "raw.sarif"
            filtered = Path(directory) / "filtered.sarif"
            finding = result(
                "DS172411",
                "components/DailyResonance.tsx",
                386,
                "Review setTimeout for untrusted data",
            )
            write_sarif(raw, [finding])
            write_sarif(filtered, [finding])
            rendered = render_markdown(build_report(raw, filtered))
            self.assertIn("DS172411", rendered)
            self.assertIn("components/DailyResonance.tsx:386", rendered)
            self.assertIn("ManualReview", rendered)
            self.assertIn("not by itself proof of a vulnerability", rendered)

    def test_does_not_label_remaining_findings_as_false_positives(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory) / "raw.sarif"
            filtered = Path(directory) / "filtered.sarif"
            finding = result("DS1", "app/a.ts", 10, "review this")
            write_sarif(raw, [finding])
            write_sarif(filtered, [finding])
            rendered = render_markdown(build_report(raw, filtered))
            self.assertNotIn("false positive: DS1", rendered)
            self.assertIn("not automatically a false positive", rendered)

    def test_rejects_filtered_result_count_greater_than_raw(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory) / "raw.sarif"
            filtered = Path(directory) / "filtered.sarif"
            finding = result("DS1", "app/a.ts", 10, "review this")
            write_sarif(raw, [])
            write_sarif(filtered, [finding])
            with self.assertRaises(SarifSummaryError):
                build_report(raw, filtered)

    def test_rejects_invalid_sarif(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory) / "raw.sarif"
            filtered = Path(directory) / "filtered.sarif"
            raw.write_text("not json", encoding="utf-8")
            write_sarif(filtered, [])
            with self.assertRaises(SarifSummaryError):
                build_report(raw, filtered)

    def test_empty_scan_is_reported_as_zero_not_as_reviewed_coverage(self):
        with tempfile.TemporaryDirectory() as directory:
            raw = Path(directory) / "raw.sarif"
            filtered = Path(directory) / "filtered.sarif"
            write_sarif(raw, [])
            write_sarif(filtered, [])
            report = build_report(raw, filtered)
            self.assertEqual(report["raw_count"], 0)
            self.assertIn("No findings remain", render_markdown(report))


if __name__ == "__main__":
    unittest.main()
