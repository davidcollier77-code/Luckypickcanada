"""Regression tests for the AGENTS.md protection classifier."""

import json
import os
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import agents_md_protection as protection  # noqa: E402

BASE_SHA = "1" * 40
HEAD_SHA = "2" * 40
SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "agents_md_protection.py")


def classify(paths, status="modified", base_sha=BASE_SHA, head_sha=HEAD_SHA):
    lines = []
    for item in paths:
        if isinstance(item, tuple):
            lines.append("%s\t%s\n" % item)
        else:
            lines.append("%s\n" % item)
    records = protection.parse_changed_files(lines)
    return protection.classify(records, status, base_sha, head_sha)


class DedicatedGovernancePrTests(unittest.TestCase):
    def test_agents_md_alone_is_a_dedicated_governance_change(self):
        result = classify(["AGENTS.md"])
        self.assertEqual(result["status"], protection.ALLOWED)
        self.assertEqual(result["mode"], "dedicated")
        self.assertEqual(result["offending_paths"], [])

    def test_directly_related_governance_files_are_allowed(self):
        result = classify(
            [
                "AGENTS.md",
                "PR_SUBMISSION.md",
                ".github/CODEOWNERS",
                ".github/workflows/protected-files.yml",
                ".github/scripts/agents_md_protection.py",
                ".github/scripts/test_agents_md_protection.py",
                "__tests__/agent-governance-single-source.test.js",
                "scripts/verify-startup.sh",
                "freebuff-verify.sh",
            ]
        )
        self.assertEqual(result["status"], protection.ALLOWED)
        self.assertEqual(result["mode"], "dedicated")
        self.assertEqual(result["offending_paths"], [])

    def test_required_spec_kit_and_memory_bank_records_are_allowed(self):
        result = classify(
            [
                "AGENTS.md",
                ".specify/feature.json",
                "specs/141-pr-checker-reliability-and-governance-protection/spec.md",
                "specs/141-pr-checker-reliability-and-governance-protection/plan.md",
                "specs/141-pr-checker-reliability-and-governance-protection/tasks.md",
                "specs/141-pr-checker-reliability-and-governance-protection/checklists/requirements.md",
                "specs/141-pr-checker-reliability-and-governance-protection/evidence/run.json",
                "memory-bank/activeContext.md",
                "memory-bank/progress.md",
                "artifacts/pr-checker/before.json",
            ]
        )
        self.assertEqual(result["status"], protection.ALLOWED)
        self.assertEqual(result["mode"], "dedicated")

    def test_rename_into_agents_md_is_a_dedicated_change(self):
        result = classify([("AGENTS.md", "docs/AGENTS-draft.md")])
        self.assertEqual(result["status"], protection.ALLOWED)
        self.assertEqual(result["mode"], "dedicated")


class UnrelatedPullRequestTests(unittest.TestCase):
    def test_application_code_alongside_agents_md_is_refused(self):
        result = classify(["AGENTS.md", "app/page.tsx"])
        self.assertEqual(result["status"], protection.VIOLATION)
        self.assertEqual(result["mode"], "unrelated")
        self.assertEqual(result["offending_paths"], ["app/page.tsx"])

    def test_dependency_and_workflow_changes_are_refused(self):
        for path in (
            "package.json",
            "pnpm-lock.yaml",
            ".github/workflows/devskim.yml",
            "scripts/refresh-docs.js",
            "README.md",
        ):
            with self.subTest(path=path):
                result = classify(["AGENTS.md", path])
                self.assertEqual(result["status"], protection.VIOLATION)
                self.assertEqual(result["offending_paths"], [path])

    def test_source_code_cannot_hide_under_specs_or_artifacts(self):
        for path in (
            "specs/141-feature/app/page.tsx",
            "specs/141-feature/evidence/payload.sh",
            "artifacts/run.sh",
            "memory-bank/notes.txt",
        ):
            with self.subTest(path=path):
                result = classify(["AGENTS.md", path])
                self.assertEqual(result["status"], protection.VIOLATION)
                self.assertEqual(result["offending_paths"], [path])

    def test_unrelated_paths_are_all_reported(self):
        result = classify(
            ["AGENTS.md", "app/page.tsx", "components/Hero.tsx", "package.json"]
        )
        self.assertEqual(
            result["offending_paths"],
            ["app/page.tsx", "components/Hero.tsx", "package.json"],
        )


class BaselineTests(unittest.TestCase):
    def test_identical_base_and_head_blob_is_not_a_governance_change(self):
        result = classify(["AGENTS.md"], base_sha=BASE_SHA, head_sha=BASE_SHA)
        self.assertEqual(result["status"], protection.ALLOWED)
        self.assertEqual(result["mode"], "unchanged")

    def test_merged_governance_change_is_the_new_baseline(self):
        first = classify(["AGENTS.md"], base_sha=BASE_SHA, head_sha=HEAD_SHA)
        self.assertEqual(first["mode"], "dedicated")
        # After merge the approved head becomes the base of the next PR.
        later = classify(["AGENTS.md"], base_sha=HEAD_SHA, head_sha=HEAD_SHA)
        self.assertEqual(later["status"], protection.ALLOWED)
        self.assertEqual(later["mode"], "unchanged")

    def test_missing_base_identity_fails_closed(self):
        result = classify(["AGENTS.md"], base_sha="", head_sha=HEAD_SHA)
        self.assertEqual(result["status"], protection.INDETERMINATE)
        self.assertFalse(result["allowed"])

    def test_missing_head_identity_fails_closed(self):
        result = classify(["AGENTS.md"], base_sha=BASE_SHA, head_sha="")
        self.assertEqual(result["status"], protection.INDETERMINATE)
        self.assertFalse(result["allowed"])

    def test_removal_is_always_a_violation(self):
        result = classify(["AGENTS.md"], status="removed")
        self.assertEqual(result["status"], protection.VIOLATION)
        self.assertEqual(result["mode"], "removed")

    def test_rename_away_is_always_a_violation(self):
        result = classify([("docs/AGENTS.md", "AGENTS.md")], status="renamed")
        self.assertEqual(result["status"], protection.VIOLATION)
        self.assertEqual(result["mode"], "renamed-away")

    def test_no_governance_change_is_not_applicable(self):
        result = classify(["app/page.tsx", "package.json"])
        self.assertEqual(result["status"], protection.ALLOWED)
        self.assertEqual(result["mode"], "not-applicable")


class InputValidationTests(unittest.TestCase):
    def test_empty_change_set_fails_closed(self):
        with self.assertRaises(protection.ChangeSetError):
            protection.parse_changed_files(["\n", "# comment\n"])

    def test_unsafe_paths_are_refused(self):
        for path in ("/etc/passwd", "..\\AGENTS.md", "../AGENTS.md", "app//page.tsx"):
            with self.subTest(path=path):
                with self.assertRaises(protection.ChangeSetError):
                    protection.normalize_path(path)

    def test_leading_dot_slash_is_normalized(self):
        self.assertEqual(protection.normalize_path("./AGENTS.md"), "AGENTS.md")

    def test_paths_are_case_sensitive(self):
        result = classify(["agents.md", "app/page.tsx"])
        self.assertEqual(result["mode"], "not-applicable")

    def test_title_and_body_arguments_do_not_exist(self):
        parser = protection.build_parser()
        options = {action.dest for action in parser._actions}
        for forbidden in ("title", "body", "label", "comment", "branch", "reason"):
            self.assertNotIn(forbidden, options)


class CommandLineTests(unittest.TestCase):
    def run_cli(self, paths, extra=None):
        directory = tempfile.mkdtemp()
        changed = os.path.join(directory, "changed.txt")
        summary = os.path.join(directory, "summary.md")
        report = os.path.join(directory, "report.json")
        with open(changed, "w", encoding="utf-8") as handle:
            handle.writelines("%s\n" % path for path in paths)
        command = [
            sys.executable,
            SCRIPT,
            "--changed-files",
            changed,
            "--base-agents-sha",
            BASE_SHA,
            "--head-agents-sha",
            HEAD_SHA,
            "--summary",
            summary,
            "--json",
            report,
        ]
        command.extend(extra or [])
        return subprocess.run(command, capture_output=True, text=True), summary, report

    def test_dedicated_pr_exits_zero_and_writes_reports(self):
        completed, summary, report = self.run_cli(
            ["AGENTS.md", "__tests__/agent-governance-single-source.test.js"]
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        with open(report, encoding="utf-8") as handle:
            payload = json.load(handle)
        self.assertEqual(payload["mode"], "dedicated")
        with open(summary, encoding="utf-8") as handle:
            self.assertIn("dedicated governance pull request", handle.read())

    def test_unrelated_pr_exits_one_and_names_the_file(self):
        completed, summary, _ = self.run_cli(["AGENTS.md", "app/page.tsx"])
        self.assertEqual(completed.returncode, 1, completed.stderr)
        with open(summary, encoding="utf-8") as handle:
            text = handle.read()
        self.assertIn("VIOLATION", text)
        self.assertIn("`app/page.tsx`", text)

    def test_unreadable_change_set_exits_two(self):
        completed = subprocess.run(
            [
                sys.executable,
                SCRIPT,
                "--changed-files",
                "/nonexistent/changed.txt",
                "--base-agents-sha",
                BASE_SHA,
                "--head-agents-sha",
                HEAD_SHA,
            ],
            capture_output=True,
            text=True,
        )
        self.assertEqual(completed.returncode, 2)
        self.assertIn("could not be read or classified", completed.stderr)

    def test_malformed_blob_identity_exits_two(self):
        completed, _, _ = self.run_cli(
            ["AGENTS.md"], extra=["--base-agents-sha", "not-a-sha"]
        )
        self.assertEqual(completed.returncode, 2)
        self.assertIn("not a hexadecimal Git object id", completed.stderr)

    def test_a_governance_sounding_argument_cannot_bypass_the_gate(self):
        completed, _, _ = self.run_cli(
            ["AGENTS.md", "app/page.tsx"],
            extra=["--title", "chore(governance): approved AGENTS.md update"],
        )
        self.assertEqual(completed.returncode, 2)
        self.assertIn("unrecognized arguments", completed.stderr)


if __name__ == "__main__":
    unittest.main()
