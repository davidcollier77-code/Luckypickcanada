import json
import unittest

from check_qa_pr_scope import (
    END_MARKER,
    START_MARKER,
    ScopeError,
    _digest,
    validate,
)

OWNER = "davidcollier77-code"


def declaration(**overrides):
    value = {
        "version": 1,
        "summary": "Add reviewable QA scope and evidence controls",
        "features": ["QA scope verification"],
        "paths": [".github/scripts/checker.py", ".github/scripts/test_checker.py"],
        "shared_dependencies": [],
        "visual_baseline_updates": [],
        "scope_expansion": [],
        "governance_changes": [],
        "browser_evidence": [],
    }
    value.update(overrides)
    return value


def pr_body(value):
    return (
        "## Purpose\nThis change improves QA infrastructure.\n\n"
        + START_MARKER
        + "\n"
        + json.dumps(value)
        + "\n"
        + END_MARKER
    )


def run_check(paths, value=None, comments=None):
    records = [
        {"filename": path, "status": "modified"}
        for path in paths
    ]
    return validate(
        {"number": 42, "body": pr_body(value or declaration())},
        records,
        comments or [],
        OWNER,
    )


class ScopeDeclarationTests(unittest.TestCase):
    def test_declared_paths_pass(self):
        result = run_check([".github/scripts/checker.py", ".github/scripts/test_checker.py"])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(len(result["matched_paths"]), 2)

    def test_unmentioned_path_fails_even_when_feature_name_is_similar(self):
        result = run_check([".github/scripts/checker.py", "app/lucky-map/page.tsx"])
        self.assertEqual(result["status"], "FAIL")
        self.assertTrue(any("not declared" in error for error in result["errors"]))

    def test_renamed_file_checks_both_old_and_new_paths(self):
        record = {
            "filename": ".github/scripts/new-checker.py",
            "previous_filename": "app/old-checker.py",
            "status": "renamed",
        }
        result = validate(
            {"number": 43, "body": pr_body(declaration(paths=[".github/scripts/new-checker.py"]))},
            [record],
            [],
            OWNER,
        )
        self.assertIn("app/old-checker.py", result["changed_paths"])
        self.assertIn(".github/scripts/new-checker.py", result["changed_paths"])
        self.assertEqual(result["status"], "FAIL")

    def test_missing_scope_markers_are_rejected(self):
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": "No scope section"}, [{"filename": "x"}], [], OWNER)

    def test_duplicate_scope_markers_are_rejected(self):
        body = pr_body(declaration()) + START_MARKER
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": body}, [{"filename": ".github/scripts/x.py"}], [], OWNER)

    def test_invalid_json_is_rejected(self):
        body = START_MARKER + "\n{not-json}\n" + END_MARKER
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": body}, [{"filename": ".github/scripts/x.py"}], [], OWNER)

    def test_placeholder_summary_is_rejected(self):
        value = declaration(summary="TODO fill this in")
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(value)}, [{"filename": ".github/scripts/x.py"}], [], OWNER)

    def test_broad_wildcard_is_rejected(self):
        value = declaration(paths=["**"])
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(value)}, [{"filename": "app/page.tsx"}], [], OWNER)

    def test_empty_changed_file_list_fails_closed(self):
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(declaration())}, [], [], OWNER)


class ScopeExpansionApprovalTests(unittest.TestCase):
    def test_scope_expansion_requires_owner_comment_for_exact_digest(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        value = declaration(
            scope_expansion=[
                {"path": "app/new-component.tsx", "reason": entries["app/new-component.tsx"]}
            ],
            browser_evidence=[
                {"tool": "playwright", "reference": "pending-pr-check", "purpose": "Visual regression verification"}
            ],
        )
        result = run_check(["app/new-component.tsx"], value)
        self.assertEqual(result["status"], "FAIL")
        approval = result["approvals"]["scope_expansion"]
        self.assertFalse(approval["approved"])
        self.assertIn("/approve-scope " + _digest(entries), approval["command"])

        comments = [{
            "body": "/approve-scope " + _digest(entries),
            "user": {"login": OWNER},
        }]
        approved = run_check(["app/new-component.tsx"], value, comments)
        self.assertEqual(approved["status"], "PASS")
        self.assertTrue(approved["approvals"]["scope_expansion"]["approved"])

    def test_non_owner_comment_cannot_approve_scope(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        value = declaration(
            scope_expansion=[{"path": "app/new-component.tsx", "reason": entries["app/new-component.tsx"]}],
            browser_evidence=[{"tool": "playwright", "reference": "run-42", "purpose": "Visual regression verification"}],
        )
        comments = [{
            "body": "/approve-scope " + _digest(entries),
            "user": {"login": "outside-contributor"},
        }]
        result = run_check(["app/new-component.tsx"], value, comments)
        self.assertEqual(result["status"], "FAIL")

    def test_scope_approval_digest_is_bound_to_paths_and_reasons(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        changed_entries = {"app/new-component.tsx": "Different rationale for the changed scope"}
        value = declaration(
            scope_expansion=[{"path": "app/new-component.tsx", "reason": changed_entries["app/new-component.tsx"]}],
            browser_evidence=[{"tool": "playwright", "reference": "run-42", "purpose": "Visual regression verification"}],
        )
        comments = [{
            "body": "/approve-scope " + _digest(entries),
            "user": {"login": OWNER},
        }]
        result = run_check(["app/new-component.tsx"], value, comments)
        self.assertEqual(result["status"], "FAIL")

    def test_scope_expansion_must_refer_to_a_real_changed_file(self):
        value = declaration(
            scope_expansion=[{"path": "app/not-changed.tsx", "reason": "This file is needed for a different task"}]
        )
        result = run_check([".github/scripts/checker.py"], value)
        self.assertEqual(result["status"], "FAIL")
        self.assertTrue(any("not in this diff" in error for error in result["errors"]))


class VisualEvidenceTests(unittest.TestCase):
    def test_all_approved_browser_tools_are_accepted(self):
        for tool in ("Playwright", "Firecrawl", "Browserless"):
            with self.subTest(tool=tool):
                value = declaration(
                    paths=["components/Example.tsx"],
                    browser_evidence=[{
                        "tool": tool,
                        "reference": "https://example.invalid/artifact/42",
                        "purpose": "Verify the affected component at the required viewports",
                    }],
                )
                result = run_check(["components/Example.tsx"], value)
                self.assertEqual(result["status"], "PASS")
                self.assertEqual(result["browser_evidence"][0]["tool"], tool.casefold())

    def test_visual_change_without_browser_evidence_fails(self):
        value = declaration(paths=["components/Example.tsx"])
        result = run_check(["components/Example.tsx"], value)
        self.assertEqual(result["status"], "FAIL")
        self.assertTrue(any("without browser evidence" in error for error in result["errors"]))

    def test_unsupported_browser_tool_is_rejected(self):
        value = declaration(
            paths=["components/Example.tsx"],
            browser_evidence=[{
                "tool": "puppeteer",
                "reference": "run-42",
                "purpose": "Visual regression verification",
            }],
        )
        with self.assertRaises(ScopeError):
            run_check(["components/Example.tsx"], value)

    def test_tool_identity_is_normalized_not_relabelled(self):
        value = declaration(
            paths=["components/Example.tsx"],
            browser_evidence=[{
                "tool": "Browserless",
                "reference": "browserless-session-42",
                "purpose": "Visual regression verification",
            }],
        )
        result = run_check(["components/Example.tsx"], value)
        self.assertEqual(result["browser_evidence"][0]["tool"], "browserless")
        self.assertEqual(result["browser_evidence"][0]["reference"], "browserless-session-42")


class BaselineAndGovernanceApprovalTests(unittest.TestCase):
    def test_changed_baseline_requires_declaration_and_owner_approval(self):
        path = "tests/visual/__screenshots__/chromium/homepage.png"
        value = declaration(
            paths=["tests/visual/__screenshots__/chromium/homepage.png"],
            visual_baseline_updates=[path],
        )
        result = run_check([path], value)
        self.assertEqual(result["status"], "FAIL")
        self.assertIn("visual_baseline_updates", result["approvals"])
        digest = _digest({path: path})
        comments = [{"body": "/approve-visual-baselines " + digest, "user": {"login": OWNER}}]
        approved = run_check([path], value, comments)
        self.assertEqual(approved["status"], "PASS")

    def test_undeclared_baseline_change_fails(self):
        path = "tests/visual/__screenshots__/chromium/homepage.png"
        value = declaration(paths=["tests/visual/__screenshots__/chromium/homepage.png"])
        result = run_check([path], value)
        self.assertEqual(result["status"], "FAIL")
        self.assertTrue(any("not declared" in error for error in result["errors"]))

    def test_governance_change_needs_reason_and_owner_approval(self):
        entries = {"AGENTS.md": "Document the new scope and QA evidence requirements"}
        value = declaration(
            paths=["AGENTS.md"],
            governance_changes=[{"path": "AGENTS.md", "reason": entries["AGENTS.md"]}],
        )
        result = run_check(["AGENTS.md"], value)
        self.assertEqual(result["status"], "FAIL")
        digest = _digest(entries)
        comments = [{"body": "/approve-governance " + digest, "user": {"login": OWNER}}]
        approved = run_check(["AGENTS.md"], value, comments)
        self.assertEqual(approved["status"], "PASS")
        self.assertIn("protected-file", approved["note"])


if __name__ == "__main__":
    unittest.main()
