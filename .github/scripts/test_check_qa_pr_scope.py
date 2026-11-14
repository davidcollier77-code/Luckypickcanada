import json
import unittest

from check_qa_pr_scope import (
    END_MARKER,
    START_MARKER,
    ScopeError,
    _digest,
    _entries_with_reasons,
    _file_purpose_entries,
    _baseline_paths,
    _validate_pattern,
    changed_paths,
    render_markdown,
    validate,
)

OWNER = "davidcollier77-code"
HEAD_SHA = "fixture-head-sha"


def declaration(**overrides):
    value = {
        "version": 1,
        "summary": "Add reviewable QA scope and evidence controls",
        "features": ["QA scope verification"],
        "paths": [".github/scripts/checker.py", ".github/scripts/test_checker.py"],
        "file_purposes": [
            {"path": ".github/scripts/checker.py", "purpose": "Implement the PR scope validation contract."},
            {"path": ".github/scripts/test_checker.py", "purpose": "Cover the PR scope checker behavior."},
        ],
        "shared_dependencies": [],
        "visual_baseline_updates": [],
        "scope_expansion": [],
        "governance_changes": [],
        "browser_evidence": [],
    }
    value.update(overrides)
    if "file_purposes" not in overrides:
        value["file_purposes"] = [
            {"path": path, "purpose": "This file supports the declared QA infrastructure change."}
            for path in value["paths"]
        ]
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


def approval_digest(entries, value, body=None):
    file_purposes = {
        item["path"]: item["purpose"]
        for item in value["file_purposes"]
    }
    scope_context = {
        "complete_pr_body": body if body is not None else pr_body(value),
        "summary": value["summary"],
        "features": value["features"],
        "paths": value["paths"],
        "file_purposes": file_purposes,
        "shared_dependencies": value["shared_dependencies"],
    }
    return _digest({"head_sha": HEAD_SHA, "entries": entries, "scope": scope_context})


def run_check(paths, value=None, comments=None):
    records = [
        {"filename": path, "status": "modified"}
        for path in paths
    ]
    return validate(
        {"number": 42, "body": pr_body(value or declaration()), "head": {"sha": HEAD_SHA}, "changed_files": len(records)},
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
            {"number": 43, "body": pr_body(declaration(paths=[".github/scripts/new-checker.py"])), "head": {"sha": HEAD_SHA}, "changed_files": 1},
            [record],
            [],
            OWNER,
        )
        self.assertIn("app/old-checker.py", result["changed_paths"])
        self.assertIn(".github/scripts/new-checker.py", result["changed_paths"])
        self.assertEqual(result["status"], "FAIL")

    def test_added_file_without_previous_filename_is_accepted(self):
        self.assertEqual(
            changed_paths([{"filename": ".github/scripts/checker.py"}]),
            {".github/scripts/checker.py"},
        )

    def test_added_file_with_null_previous_filename_is_accepted(self):
        self.assertEqual(
            changed_paths([{
                "filename": ".github/scripts/checker.py",
                "previous_filename": None,
            }]),
            {".github/scripts/checker.py"},
        )

    def test_rename_previous_filename_collision_with_another_record_is_rejected(self):
        records = [
            {
                "filename": "app/new-component.tsx",
                "previous_filename": "app/old-component.tsx",
            },
            {"filename": "app/old-component.tsx"},
        ]
        with self.assertRaisesRegex(ScopeError, "repeats a filename"):
            changed_paths(records)

    def test_missing_scope_markers_are_rejected(self):
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": "No scope section", "head": {"sha": HEAD_SHA}}, [{"filename": "x"}], [], OWNER)

    def test_duplicate_scope_markers_are_rejected(self):
        body = pr_body(declaration()) + START_MARKER
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": body, "head": {"sha": HEAD_SHA}, "changed_files": 1}, [{"filename": ".github/scripts/x.py"}], [], OWNER)

    def test_invalid_json_is_rejected(self):
        body = START_MARKER + "\n{not-json}\n" + END_MARKER
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": body, "head": {"sha": HEAD_SHA}, "changed_files": 1}, [{"filename": ".github/scripts/x.py"}], [], OWNER)

    def test_placeholder_summary_is_rejected(self):
        value = declaration(summary="TO" + "DO fill this in")
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(value), "head": {"sha": HEAD_SHA}, "changed_files": 1}, [{"filename": ".github/scripts/x.py"}], [], OWNER)

    def test_placeholder_feature_names_are_rejected(self):
        value = declaration(features=["Name each affected feature or QA responsibility"])
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(value), "head": {"sha": HEAD_SHA}, "changed_files": 1}, [{"filename": ".github/scripts/x.py"}], [], OWNER)

    def test_dynamic_route_brackets_parentheses_and_hyphens_are_allowed(self):
        self.assertIsNone(_validate_pattern("app/[id]/(content)/my-component.tsx"))

    def test_comma_is_not_accepted_as_a_path_character(self):
        with self.assertRaisesRegex(ScopeError, "unsupported characters"):
            _validate_pattern("app/my,component.tsx")

    def test_broad_wildcard_is_rejected(self):
        value = declaration(paths=["**"])
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(value), "head": {"sha": HEAD_SHA}, "changed_files": 1}, [{"filename": "app/page.tsx"}], [], OWNER)

    def test_file_purposes_must_cover_every_declared_path(self):
        value = declaration(file_purposes=[])
        result = run_check([".github/scripts/checker.py", ".github/scripts/test_checker.py"], value)
        self.assertEqual(result["status"], "FAIL")

    def test_missing_current_head_sha_fails_closed(self):
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(declaration())}, [{"filename": ".github/scripts/checker.py"}], [], OWNER)

    def test_changed_file_count_must_match_complete_github_file_list(self):
        records = [{"filename": ".github/scripts/checker.py"}]
        pr = {
            "number": 45,
            "body": pr_body(declaration(paths=[".github/scripts/checker.py"])),
            "head": {"sha": HEAD_SHA},
            "changed_files": 2,
        }
        with self.assertRaises(ScopeError):
            validate(pr, records, [], OWNER)

    def test_missing_changed_files_key_has_a_specific_error(self):
        pr = {
            "number": 47,
            "body": pr_body(declaration(paths=[".github/scripts/checker.py"])),
            "head": {"sha": HEAD_SHA},
        }
        with self.assertRaisesRegex(ScopeError, "missing the changed_files count"):
            validate(pr, [{"filename": ".github/scripts/checker.py"}], [], OWNER)

    def test_boolean_changed_files_count_is_rejected(self):
        pr = {
            "number": 48,
            "body": pr_body(declaration(paths=[".github/scripts/checker.py"])),
            "head": {"sha": HEAD_SHA},
            "changed_files": True,
        }
        with self.assertRaisesRegex(ScopeError, "changed-file count does not match"):
            validate(pr, [{"filename": ".github/scripts/checker.py"}], [], OWNER)

    def test_duplicate_changed_file_records_are_rejected(self):
        records = [
            {"filename": ".github/scripts/checker.py"},
            {"filename": ".github/scripts/checker.py"},
        ]
        pr = {
            "number": 46,
            "body": pr_body(declaration(paths=[".github/scripts/checker.py"])),
            "head": {"sha": HEAD_SHA},
            "changed_files": 2,
        }
        with self.assertRaises(ScopeError):
            validate(pr, records, [], OWNER)

    def test_missing_scope_expansion_path_names_the_field(self):
        with self.assertRaisesRegex(ScopeError, "scope_expansion.*path"):
            _entries_with_reasons(
                [{"reason": "The additional path is required by this change."}],
                "scope_expansion",
            )

    def test_missing_file_purpose_path_names_the_field(self):
        with self.assertRaisesRegex(ScopeError, "file_purposes.*path"):
            _file_purpose_entries(
                [{"purpose": "This file contains the QA scope implementation."}]
            )

    def test_blocked_markdown_uses_none_without_joining_characters(self):
        rendered = render_markdown({
            "status": "BLOCKED",
            "errors": ["The scope declaration could not be validated."],
        })
        self.assertIn("- Declared features: none", rendered)
        self.assertIn("- Shared dependencies declared: none", rendered)
        self.assertNotIn("n, o, n, e", rendered)

    def test_avif_screenshot_baseline_is_recognized(self):
        path = "tests/visual/__screenshots__/chromium/homepage.avif"
        self.assertEqual(_baseline_paths({path}), {path})

    def test_empty_changed_file_list_fails_closed(self):
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(declaration()), "head": {"sha": HEAD_SHA}}, [], [], OWNER)


class ScopeExpansionApprovalTests(unittest.TestCase):
    def test_pending_browser_evidence_reference_is_rejected(self):
        value = declaration(
            browser_evidence=[{
                "tool": "playwright",
                "reference": "pending-pr-check",
                "purpose": "Visual regression verification",
            }]
        )
        with self.assertRaisesRegex(ScopeError, "pending or placeholder"):
            run_check([".github/scripts/checker.py", ".github/scripts/test_checker.py"], value)

    def test_scope_expansion_requires_owner_comment_for_exact_digest(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        value = declaration(
            paths=["app/new-component.tsx"],
            scope_expansion=[
                {"path": "app/new-component.tsx", "reason": entries["app/new-component.tsx"]}
            ],
            browser_evidence=[
                {"tool": "playwright", "reference": "https://github.com/example/repo/actions/runs/42", "purpose": "Visual regression verification"}
            ],
        )
        result = run_check(["app/new-component.tsx"], value)
        self.assertEqual(result["status"], "FAIL")
        approval = result["approvals"]["scope_expansion"]
        self.assertFalse(approval["approved"])
        self.assertIn("/approve-scope " + approval_digest(entries, value), approval["command"])

        comments = [{
            "body": "/approve-scope " + approval_digest(entries, value),
            "user": {"login": OWNER},
        }]
        approved = run_check(["app/new-component.tsx"], value, comments)
        self.assertEqual(approved["status"], "PASS")
        self.assertTrue(approved["approvals"]["scope_expansion"]["approved"])

    def test_non_owner_comment_cannot_approve_scope(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        value = declaration(
            paths=["app/new-component.tsx"],
            scope_expansion=[{"path": "app/new-component.tsx", "reason": entries["app/new-component.tsx"]}],
            browser_evidence=[{"tool": "playwright", "reference": "run-42", "purpose": "Visual regression verification"}],
        )
        comments = [{
            "body": "/approve-scope " + approval_digest(entries, value),
            "user": {"login": "outside-contributor"},
        }]
        result = run_check(["app/new-component.tsx"], value, comments)
        self.assertEqual(result["status"], "FAIL")

    def test_scope_approval_digest_is_bound_to_paths_and_reasons(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        changed_entries = {"app/new-component.tsx": "Different rationale for the changed scope"}
        value = declaration(
            paths=["app/new-component.tsx"],
            scope_expansion=[{"path": "app/new-component.tsx", "reason": changed_entries["app/new-component.tsx"]}],
            browser_evidence=[{"tool": "playwright", "reference": "run-42", "purpose": "Visual regression verification"}],
        )
        comments = [{
            "body": "/approve-scope " + approval_digest(entries, value),
            "user": {"login": OWNER},
        }]
        result = run_check(["app/new-component.tsx"], value, comments)
        self.assertEqual(result["status"], "FAIL")

    def test_approval_is_invalidated_when_prose_scope_description_changes(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        value = declaration(
            paths=["app/new-component.tsx"],
            scope_expansion=[{"path": "app/new-component.tsx", "reason": entries["app/new-component.tsx"]}],
            browser_evidence=[{"tool": "playwright", "reference": "run-42", "purpose": "Visual regression verification"}],
        )
        original_body = pr_body(value)
        comments = [{
            "body": "/approve-scope " + approval_digest(entries, value, original_body),
            "user": {"login": OWNER},
        }]
        changed_body = original_body.replace(
            "This change improves QA infrastructure.",
            "This change also modifies the unrelated Lucky Map feature.",
        )
        result = validate(
            {"number": 42, "body": changed_body, "head": {"sha": HEAD_SHA}, "changed_files": 1},
            [{"filename": "app/new-component.tsx"}],
            comments,
            OWNER,
        )
        self.assertEqual(result["status"], "FAIL")
        self.assertFalse(result["approvals"]["scope_expansion"]["approved"])

    def test_scope_approval_is_invalidated_by_a_new_head_commit(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        value = declaration(
            paths=["app/new-component.tsx"],
            scope_expansion=[{"path": "app/new-component.tsx", "reason": entries["app/new-component.tsx"]}],
            browser_evidence=[{"tool": "playwright", "reference": "run-42", "purpose": "Visual regression verification"}],
        )
        comments = [{
            "body": "/approve-scope " + approval_digest(entries, value),
            "user": {"login": OWNER},
        }]
        records = [{"filename": "app/new-component.tsx"}]
        changed_head = validate(
            {"number": 44, "body": pr_body(value), "head": {"sha": "newer-head-sha"}, "changed_files": 1},
            records,
            comments,
            OWNER,
        )
        self.assertEqual(changed_head["status"], "FAIL")
        self.assertFalse(changed_head["approvals"]["scope_expansion"]["approved"])

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

    def test_global_stylesheet_and_visual_tooling_config_require_browser_evidence(self):
        for path in ("styles/tokens.css", "app/theme.scss", "tailwind.config.ts", "next.config.mjs"):
            with self.subTest(path=path):
                value = declaration(paths=[path])
                result = run_check([path], value)
                self.assertEqual(result["status"], "FAIL")
                self.assertTrue(any("without browser evidence" in error for error in result["errors"]))

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
            browser_evidence=[{"tool": "playwright", "reference": "run-42", "purpose": "Verify screenshot baseline updates"}],
        )
        result = run_check([path], value)
        self.assertEqual(result["status"], "FAIL")
        self.assertIn("visual_baseline_updates", result["approvals"])
        digest = approval_digest({path: path}, value)
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
        entries = {".freebuff/testing.md": "Document the new QA scope and evidence requirements"}
        value = declaration(
            paths=[".freebuff/testing.md"],
            governance_changes=[{"path": ".freebuff/testing.md", "reason": entries[".freebuff/testing.md"]}],
        )
        result = run_check([".freebuff/testing.md"], value)
        self.assertEqual(result["status"], "FAIL")
        digest = approval_digest(entries, value)
        comments = [{"body": "/approve-governance " + digest, "user": {"login": OWNER}}]
        approved = run_check([".freebuff/testing.md"], value, comments)
        self.assertEqual(approved["status"], "PASS")
        self.assertIn("protected-file", approved["note"])


if __name__ == "__main__":
    unittest.main()
