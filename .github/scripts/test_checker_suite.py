"""Controlled fixtures for the independent checker suite."""

from __future__ import annotations

import json
import os
import tempfile
import unittest

import checker_suite as suite


def record(path, *lines, start=1, status="added"):
    patch = ["@@ -%d,0 +%d,%d @@" % (start, start, len(lines))]
    patch.extend("+%s" % line for line in lines)
    return {"filename": path, "status": status, "patch": "\n".join(patch)}


class TestQualityTests(unittest.TestCase):
    def test_test_without_assertion_is_confirmed(self):
        findings = suite.review_test_quality(
            [
                record(
                    "__tests__/hero.test.js",
                    "it('renders', () => {",
                    "  render(<Hero />);",
                    "});",
                )
            ]
        )
        self.assertEqual([item["rule"] for item in findings], ["test-without-assertion"])
        self.assertEqual(findings[0]["classification"], "confirmed")
        self.assertIn("expect(", findings[0]["suggestion"])

    def test_test_with_assertion_is_not_reported(self):
        findings = suite.review_test_quality(
            [
                record(
                    "__tests__/hero.test.js",
                    "it('renders', () => {",
                    "  expect(screen.getByText('Hero')).toBeTruthy();",
                    "});",
                )
            ]
        )
        self.assertEqual(findings, [])

    def test_tautological_assertion_is_confirmed(self):
        findings = suite.review_test_quality(
            [record("__tests__/hero.test.js", "expect(true).toBe(true);")]
        )
        self.assertEqual(findings[0]["rule"], "tautological-assertion")
        self.assertEqual(findings[0]["classification"], "confirmed")

    def test_real_comparison_is_not_tautological(self):
        findings = suite.review_test_quality(
            [record("__tests__/hero.test.js", "expect(count).toBe(2);")]
        )
        self.assertEqual(findings, [])

    def test_unnamed_snapshot_is_potential(self):
        findings = suite.review_test_quality(
            [record("__tests__/hero.test.jsx", "expect(tree).toMatchSnapshot();")]
        )
        self.assertEqual(findings[0]["rule"], "unnamed-snapshot")
        self.assertEqual(findings[0]["classification"], "potential")

    def test_named_snapshot_is_not_reported(self):
        findings = suite.review_test_quality(
            [record("__tests__/hero.test.jsx", "expect(tree).toMatchSnapshot('empty');")]
        )
        self.assertEqual(findings, [])

    def test_mock_without_restore_is_potential(self):
        findings = suite.review_test_quality(
            [
                record(
                    "__tests__/api.test.js",
                    "vi.mock('./api');",
                    "it('loads', () => {",
                    "  expect(load()).toBeTruthy();",
                    "});",
                )
            ]
        )
        rules = [item["rule"] for item in findings]
        self.assertIn("mock-without-restore", rules)
        mock = findings[rules.index("mock-without-restore")]
        self.assertEqual(mock["classification"], "potential")

    def test_restored_mock_is_not_reported(self):
        findings = suite.review_test_quality(
            [
                record(
                    "__tests__/api.test.js",
                    "vi.mock('./api');",
                    "afterEach(() => { vi.restoreAllMocks(); });",
                )
            ]
        )
        self.assertEqual(
            [item for item in findings if item["rule"] == "mock-without-restore"], []
        )

    def test_application_files_are_out_of_scope(self):
        findings = suite.review_test_quality(
            [record("app/lib/pick.js", "expect(true).toBe(true);")]
        )
        self.assertEqual(findings, [])

    def test_paginated_pages_are_flattened(self):
        findings = suite.review_test_quality(
            [[record("__tests__/a.test.js", "expect(true).toBe(true);")]]
        )
        self.assertEqual(len(findings), 1)


class PerformanceTests(unittest.TestCase):
    def test_interval_without_clear_is_potential(self):
        findings = suite.review_performance(
            [record("app/lib/tick.js", "const id = setInterval(tick, 1000);")]
        )
        self.assertEqual(findings[0]["rule"], "interval-without-clear")
        self.assertEqual(findings[0]["classification"], "potential")
        self.assertIn("clearInterval", findings[0]["suggestion"])

    def test_cleared_interval_is_not_reported(self):
        findings = suite.review_performance(
            [
                record(
                    "app/lib/tick.js",
                    "const id = setInterval(tick, 1000);",
                    "clearInterval(id);",
                )
            ]
        )
        self.assertEqual(findings, [])

    def test_listener_without_cleanup_is_potential(self):
        findings = suite.review_performance(
            [record("components/Rotate.tsx", "window.addEventListener('resize', onResize);")]
        )
        self.assertEqual(findings[0]["rule"], "listener-without-cleanup")

    def test_removed_listener_is_not_reported(self):
        findings = suite.review_performance(
            [
                record(
                    "components/Rotate.tsx",
                    "window.addEventListener('resize', onResize);",
                    "return () => window.removeEventListener('resize', onResize);",
                )
            ]
        )
        self.assertEqual(findings, [])

    def test_animation_frame_without_cancel_is_potential(self):
        findings = suite.review_performance(
            [record("app/lib/loop.js", "requestAnimationFrame(tick);")]
        )
        self.assertEqual(findings[0]["rule"], "animation-frame-without-cancel")

    def test_documentation_is_out_of_scope(self):
        findings = suite.review_performance(
            [record("specs/171/notes.md", "setInterval(tick, 1000);")]
        )
        self.assertEqual(findings, [])


class SecuritySummaryTests(unittest.TestCase):
    def alert(self, severity="high", path="app/lib/pick.js", line=12):
        return {
            "state": "open",
            "html_url": "https://example.invalid/alert/1",
            "rule": {
                "id": "js/xss",
                "name": "XSS",
                "description": "Unsanitised input reaches a sink.",
                "severity": severity,
                "tool": {"name": "CodeQL"},
            },
            "most_recent_instance": {
                "location": {"path": path, "start_line": line},
                "message": {"text": "This value reaches innerHTML."},
            },
        }

    def test_no_alerts_is_a_pass(self):
        body = suite.render_security_summary([])
        self.assertTrue(body.startswith(suite.MARKERS["security-summary"]))
        self.assertIn("**PASS**", body)

    def test_high_alert_is_a_fail_with_a_location(self):
        body = suite.render_security_summary([self.alert()])
        self.assertIn("**FAIL**", body)
        self.assertIn("`app/lib/pick.js:12`", body)
        self.assertIn("CodeQL/js/xss", body)
        self.assertIn("Suggested fix:", body)

    def test_low_alert_is_a_warning(self):
        body = suite.render_security_summary([self.alert(severity="low")])
        self.assertIn("**WARN**", body)
        self.assertNotIn("**FAIL**", body)

    def test_unavailable_api_is_reported_without_failing(self):
        body = suite.render_security_summary({"message": "the code-scanning API returned 404"})
        self.assertIn("**Unavailable**", body)
        self.assertIn("404", body)


class BrowserSummaryTests(unittest.TestCase):
    def check(self, name, conclusion):
        return {
            "name": name,
            "conclusion": conclusion,
            "html_url": "https://example.invalid/run",
            "details_url": "https://example.invalid/job",
        }

    def test_failed_shard_is_a_fail(self):
        body = suite.render_browser_summary(
            {"check_runs": [self.check("Visual QA", "success"), self.check("Visual QA (shard 1/2)", "failure")]}
        )
        self.assertIn("**FAIL**", body)
        self.assertIn("Visual QA (shard 1/2)", body)

    def test_skipped_shard_is_not_a_pass(self):
        body = suite.render_browser_summary(
            {"check_runs": [self.check("Visual QA", "success"), self.check("Visual QA (shard 1/2)", "skipped")]}
        )
        self.assertIn("NOT RUN", body)
        self.assertNotIn("**PASS** — every Visual QA check passed", body)

    def test_all_passing_is_a_pass(self):
        body = suite.render_browser_summary(
            {"check_runs": [self.check("Visual QA", "success"), self.check("Visual QA (shard 1/2)", "success")]}
        )
        self.assertIn("**PASS** — every Visual QA check passed", body)

    def test_missing_checks_is_not_run(self):
        body = suite.render_browser_summary({"check_runs": []})
        self.assertIn("**NOT RUN**", body)


class RenderTests(unittest.TestCase):
    def test_marker_is_the_first_line(self):
        body = suite.render_comment("performance", "**WARN** — 1", ["- block"])
        self.assertEqual(body.splitlines()[0], suite.MARKERS["performance"])

    def test_cap_drops_whole_findings_and_says_so(self):
        blocks = ["- finding %02d\n  - Suggested fix: do the thing" % index for index in range(200)]
        body = suite.render_comment("test-quality", "**WARN**", blocks, limit=2000)
        self.assertLessEqual(len(body.encode()), 2000 + 200)
        self.assertIn("more finding(s) omitted", body)
        self.assertIn("Suggested fix:", body)

    def test_every_mode_has_a_unique_marker(self):
        self.assertEqual(len(set(suite.MARKERS.values())), 4)

    def test_cli_writes_the_comment_file(self):
        files = [record("__tests__/a.test.js", "expect(true).toBe(true);")]
        with tempfile.TemporaryDirectory() as folder:
            source = os.path.join(folder, "files.json")
            target = os.path.join(folder, "comment.md")
            with open(source, "w", encoding="utf-8") as handle:
                json.dump(files, handle)
            self.assertEqual(
                suite.main(["test-quality", "--files", source, "--comment", target]), 0
            )
            with open(target, encoding="utf-8") as handle:
                body = handle.read()
        self.assertTrue(body.startswith(suite.MARKERS["test-quality"]))


if __name__ == "__main__":
    unittest.main()
