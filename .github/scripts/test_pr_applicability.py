#!/usr/bin/env python3
"""Fail-closed tests for the build and visual applicability classifier."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pr_applicability as applicability  # noqa: E402

SCRIPT = Path(__file__).resolve().parent / "pr_applicability.py"


class BuildApplicabilityTests(unittest.TestCase):
    def test_documentation_spec_and_memory_changes_do_not_require_the_build(self):
        required, reason = applicability.classify_build(
            [
                "README.md",
                "PR_SUBMISSION.md",
                "specs/211-x/spec.md",
                "memory-bank/activeContext.md",
                ".github/workflows/visual-qa.yml",
                ".github/scripts/pr_applicability.py",
                "__tests__/fixture.test.js",
                "tests/visual/homepage.spec.ts",
                ".docs/testing/_google_eng-practices.md",
                "AGENTS.md",
            ]
        )
        self.assertFalse(required)
        self.assertIn("documentation", reason)

    def test_application_build_and_dependency_changes_require_the_build(self):
        for path in (
            "app/page.js",
            "components/Hero.jsx",
            "app/globals.css",
            "public/images/hero.avif",
            "next.config.mjs",
            "package.json",
            "pnpm-lock.yaml",
            "middleware.ts",
            "tailwind.config.js",
            "scripts/measure-performance.mjs",
        ):
            with self.subTest(path=path):
                required, _reason = applicability.classify_build([path])
                self.assertTrue(required)

    def test_mixed_and_unknown_change_sets_require_the_build(self):
        required, _reason = applicability.classify_build(
            ["README.md", "components/Hero.jsx"]
        )
        self.assertTrue(required)
        required, _reason = applicability.classify_build(["data/unknown-blob.bin"])
        self.assertTrue(required)
        required, _reason = applicability.classify_build(["LICENSE.extra"])
        self.assertTrue(required)

    def test_empty_or_unreadable_change_set_fails_closed(self):
        required, _reason = applicability.classify_build([])
        self.assertTrue(required)
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            handle.write("[{ not json")
            broken = handle.name
        try:
            with self.assertRaises(applicability.ApplicabilityError):
                applicability.read_changed_paths(broken)
        finally:
            os.unlink(broken)

    def test_github_files_json_and_plain_text_are_both_read(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            json.dump([{"filename": "app/page.js"}, {"filename": "README.md"}], handle)
            json_path = handle.name
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as handle:
            handle.write("README.md\r\n\napp/page.js\n")
            text_path = handle.name
        try:
            self.assertEqual(
                applicability.read_changed_paths(json_path), ["app/page.js", "README.md"]
            )
            self.assertEqual(
                applicability.read_changed_paths(text_path), ["README.md", "app/page.js"]
            )
        finally:
            os.unlink(json_path)
            os.unlink(text_path)


class VisualApplicabilityTests(unittest.TestCase):
    def _classify(self, paths, *extra):
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as handle:
            handle.write("\n".join(paths) + "\n")
            path = handle.name
        try:
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--files", path, "--classify-visual", *extra],
                capture_output=True,
                text=True,
                check=False,
            )
        finally:
            os.unlink(path)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = dict(
            line.split("=", 1) for line in result.stdout.strip().splitlines() if "=" in line
        )
        return payload

    def test_documentation_changes_skip_visual_qa(self):
        payload = self._classify(["README.md", "specs/211-x/tasks.md", ".github/workflows/x.yml"])
        self.assertEqual(payload["visual_required"], "false")
        self.assertEqual(payload["build_required"], "false")

    def test_rendering_changes_require_visual_qa(self):
        payload = self._classify(["components/Hero.jsx", "README.md"])
        self.assertEqual(payload["visual_required"], "true")
        self.assertEqual(payload["build_required"], "true")

    def test_declared_visual_impact_forces_visual_qa(self):
        payload = self._classify(["README.md"], "--declared-visual-required")
        self.assertEqual(payload["visual_required"], "true")

    def test_empty_change_set_fails_closed_for_both_checks(self):
        payload = self._classify([])
        self.assertEqual(payload["build_required"], "true")
        self.assertEqual(payload["visual_required"], "true")


if __name__ == "__main__":
    unittest.main()
