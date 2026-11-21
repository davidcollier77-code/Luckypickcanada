import json
import unittest

from check_qa_pr_scope import (
    END_MARKER,
    START_MARKER,
    ScopeError,
    _digest,
    _is_visual_path,
    changed_paths,
    validate,
)

OWNER = "davidcollier77-code"
HEAD_SHA = "fixture-head-sha"
SCOPE_CHANGE = "Scope changed: the shared component is required by the QA change.\n\n"


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


def pr_body(value, preamble=""):
    return (
        "## Purpose\nThis change improves QA infrastructure.\n\n"
        + preamble
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


def run_check(paths, value=None, comments=None, preamble=""):
    records = [
        {"filename": path, "status": "modified"}
        for path in paths
    ]
    return validate(
        {"number": 42, "body": pr_body(value or declaration(), preamble), "head": {"sha": HEAD_SHA}, "changed_files": len(records)},
        records,
        comments or [],
        OWNER,
    )


class ChangedPathRecordTests(unittest.TestCase):
    def test_modified_record_without_previous_filename(self):
        self.assertEqual(
            changed_paths([{"filename": "app/page.tsx", "status": "modified"}]),
            {"app/page.tsx"},
        )

    def test_added_record_without_previous_filename(self):
        self.assertEqual(
            changed_paths([{"filename": "app/new-page.tsx", "status": "added"}]),
            {"app/new-page.tsx"},
        )

    def test_renamed_record_includes_both_paths(self):
        self.assertEqual(
            changed_paths(
                [
                    {
                        "filename": "components/NewHero.tsx",
                        "previous_filename": "components/OldHero.tsx",
                        "status": "renamed",
                    }
                ]
            ),
            {"components/NewHero.tsx", "components/OldHero.tsx"},
        )

    def test_rename_without_previous_path_fails_closed(self):
        with self.assertRaises(ScopeError):
            changed_paths([{"filename": "components/NewHero.tsx", "status": "renamed"}])

    def test_record_without_filename_fails_closed(self):
        with self.assertRaises(ScopeError):
            changed_paths([{"status": "modified"}])


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
        value = declaration(summary="TODO fill this in")
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(value), "head": {"sha": HEAD_SHA}, "changed_files": 1}, [{"filename": ".github/scripts/x.py"}], [], OWNER)

    def test_placeholder_feature_names_are_rejected(self):
        value = declaration(features=["Name each affected feature or QA responsibility"])
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(value), "head": {"sha": HEAD_SHA}, "changed_files": 1}, [{"filename": ".github/scripts/x.py"}], [], OWNER)

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

    def test_empty_changed_file_list_fails_closed(self):
        with self.assertRaises(ScopeError):
            validate({"number": 1, "body": pr_body(declaration()), "head": {"sha": HEAD_SHA}}, [], [], OWNER)


class PlaceholderWordTests(unittest.TestCase):
    """The marker word is rejected only when it is the whole field value."""

    PATHS = [".github/scripts/checker.py", ".github/scripts/test_checker.py"]

    def test_filled_summary_may_mention_the_marker_word(self):
        value = declaration(
            summary="Publish the rendered report instead of the marker-first placeholder fallback."
        )
        result = run_check(self.PATHS, value)
        self.assertEqual(result["status"], "PASS")

    def test_filled_feature_name_may_mention_the_marker_word(self):
        value = declaration(features=["Preserve the marker-first placeholder fallback"])
        result = run_check(self.PATHS, value)
        self.assertEqual(result["status"], "PASS")

    def test_filled_file_purpose_may_mention_the_marker_word(self):
        value = declaration(
            file_purposes=[
                {
                    "path": ".github/scripts/checker.py",
                    "purpose": "Keep the marker-first placeholder fallback visible in the report.",
                },
                {
                    "path": ".github/scripts/test_checker.py",
                    "purpose": "Cover both outcomes of the marker wording.",
                },
            ]
        )
        result = run_check(self.PATHS, value)
        self.assertEqual(result["status"], "PASS")

    def test_marker_only_summary_feature_and_purpose_are_rejected(self):
        markers = (
            "**placeholder**",
            "placeholder text",
            "placeholder goes here",
            "TODO",
            "TBD",
            "fill this in",
        )
        for marker in markers:
            with self.subTest(field="summary", marker=marker):
                with self.assertRaises(ScopeError):
                    run_check(self.PATHS, declaration(summary=marker))
            with self.subTest(field="features", marker=marker):
                with self.assertRaises(ScopeError):
                    run_check(self.PATHS, declaration(features=[marker]))
            with self.subTest(field="file_purposes", marker=marker):
                value = declaration(
                    file_purposes=[
                        {"path": ".github/scripts/checker.py", "purpose": marker},
                        {
                            "path": ".github/scripts/test_checker.py",
                            "purpose": "Cover the scope checker behavior.",
                        },
                    ]
                )
                with self.assertRaises(ScopeError):
                    run_check(self.PATHS, value)

    def test_filled_scope_reason_may_mention_the_marker_word(self):
        path = "app/new-component.tsx"
        value = declaration(
            paths=[path],
            scope_expansion=[
                {
                    "path": path,
                    "reason": "Shared component preserves the marker-first placeholder fallback.",
                }
            ],
        )
        result = run_check(
            [path],
            value,
            preamble="Scope changed: preserve the marker-first placeholder fallback in the report.\n\n",
        )
        self.assertEqual(
            result["scope_change_statement"],
            "preserve the marker-first placeholder fallback in the report.",
        )
        self.assertFalse(any("placeholder wording" in error for error in result["errors"]))
        self.assertTrue(any("scope_expansion" in error for error in result["errors"]))

    def test_filled_visual_impact_reason_may_mention_the_marker_word(self):
        value = declaration(
            paths=[".github/scripts/checker.py"],
            visual_impact={
                "required": False,
                "reason": "Only the marker-first placeholder fallback changes in report text.",
            },
        )
        result = run_check([".github/scripts/checker.py"], value)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["warnings"], [])

    def test_marker_only_scope_reasons_are_rejected(self):
        path = "app/new-component.tsx"
        for marker in ("**placeholder**", "placeholder text", "TODO", "fill this in"):
            with self.subTest(field="scope_expansion", marker=marker):
                value = declaration(
                    paths=[path],
                    scope_expansion=[{"path": path, "reason": marker}],
                )
                with self.assertRaises(ScopeError):
                    run_check([path], value, preamble=SCOPE_CHANGE)
            with self.subTest(field="visual_impact", marker=marker):
                value = declaration(
                    paths=[".github/scripts/checker.py"],
                    visual_impact={"required": False, "reason": marker},
                )
                with self.assertRaises(ScopeError):
                    run_check([".github/scripts/checker.py"], value)

    def test_marker_only_scope_change_explanation_is_rejected(self):
        path = "app/new-component.tsx"
        for marker in ("**placeholder**", "placeholder text", "TODO", "fill this in"):
            with self.subTest(marker=marker):
                value = declaration(
                    paths=[path],
                    scope_expansion=[
                        {"path": path, "reason": "Shared component required by the QA change"}
                    ],
                )
                result = run_check(
                    [path], value, preamble=f"Scope changed: {marker}\n\n"
                )
                self.assertEqual(result["scope_change_statement"], "")
                self.assertTrue(any("Scope changed" in error for error in result["errors"]))


class ScopeExpansionApprovalTests(unittest.TestCase):
    def test_scope_expansion_requires_owner_comment_for_exact_digest(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        value = declaration(
            paths=["app/new-component.tsx"],
            scope_expansion=[
                {"path": "app/new-component.tsx", "reason": entries["app/new-component.tsx"]}
            ],
            browser_evidence=[
                {"tool": "playwright", "reference": "pending-pr-check", "purpose": "Visual regression verification"}
            ],
        )
        result = run_check(["app/new-component.tsx"], value, preamble=SCOPE_CHANGE)
        self.assertEqual(result["status"], "FAIL")
        approval = result["approvals"]["scope_expansion"]
        self.assertFalse(approval["approved"])
        self.assertIn(
            "/approve-scope " + approval_digest(entries, value, pr_body(value, SCOPE_CHANGE)),
            approval["command"],
        )

        comments = [{
            "body": "/approve-scope " + approval_digest(entries, value, pr_body(value, SCOPE_CHANGE)),
            "user": {"login": OWNER},
        }]
        approved = run_check(["app/new-component.tsx"], value, comments, SCOPE_CHANGE)
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
            "body": "/approve-scope " + approval_digest(entries, value, pr_body(value, SCOPE_CHANGE)),
            "user": {"login": "outside-contributor"},
        }]
        result = run_check(["app/new-component.tsx"], value, comments, SCOPE_CHANGE)
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
            "body": "/approve-scope " + approval_digest(entries, value, pr_body(value, SCOPE_CHANGE)),
            "user": {"login": OWNER},
        }]
        result = run_check(["app/new-component.tsx"], value, comments, SCOPE_CHANGE)
        self.assertEqual(result["status"], "FAIL")

    def test_approval_is_invalidated_when_prose_scope_description_changes(self):
        entries = {"app/new-component.tsx": "Shared component required by the QA change"}
        value = declaration(
            paths=["app/new-component.tsx"],
            scope_expansion=[{"path": "app/new-component.tsx", "reason": entries["app/new-component.tsx"]}],
            browser_evidence=[{"tool": "playwright", "reference": "run-42", "purpose": "Visual regression verification"}],
        )
        original_body = pr_body(value, SCOPE_CHANGE)
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
            "body": "/approve-scope " + approval_digest(entries, value, pr_body(value, SCOPE_CHANGE)),
            "user": {"login": OWNER},
        }]
        records = [{"filename": "app/new-component.tsx"}]
        changed_head = validate(
            {"number": 44, "body": pr_body(value, SCOPE_CHANGE), "head": {"sha": "newer-head-sha"}, "changed_files": 1},
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

    def test_global_stylesheet_and_visual_tooling_config_need_no_submitter_browser_evidence(self):
        for path in ("styles/tokens.css", "app/theme.scss", "tailwind.config.ts", "next.config.mjs"):
            with self.subTest(path=path):
                value = declaration(paths=[path])
                result = run_check([path], value)
                self.assertEqual(result["status"], "PASS")
                self.assertEqual(result["browser_evidence"], [])
                self.assertFalse(any("browser evidence" in error for error in result["errors"]))

    def test_visual_change_needs_no_personal_browser_evidence(self):
        # Automated Playwright verification owns the browser result; the
        # submitter is never required to run a browser or take screenshots.
        value = declaration(paths=["components/Example.tsx"])
        result = run_check(["components/Example.tsx"], value)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["browser_evidence"], [])
        self.assertEqual(result["visual_changes"], ["components/Example.tsx"])

    def test_backend_api_and_ci_paths_do_not_require_browser_evidence(self):
        for path in (
            "app/api/checkout/route.js",
            "app/api/health/route.ts",
            "pages/api/status.js",
            ".github/workflows/visual-qa.yml",
            ".github/scripts/check_qa_pr_scope.py",
        ):
            with self.subTest(path=path):
                self.assertFalse(_is_visual_path(path))
                value = declaration(paths=[path])
                result = run_check([path], value)
                self.assertEqual(result["status"], "PASS")
                self.assertEqual(result["browser_evidence"], [])

    def test_mixed_api_and_frontend_paths_need_no_submitter_browser_evidence(self):
        paths = ["app/api/checkout/route.js", "app/page.tsx"]
        value = declaration(paths=paths)
        result = run_check(paths, value)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["browser_evidence"], [])

    def test_declared_visual_impact_forces_automated_visual_qa_without_submitter_evidence(self):
        # Visual QA already reads visual_impact.required; the submitter still
        # supplies no personal browser run.
        value = declaration(
            visual_impact={
                "required": True,
                "reason": "The logic change controls visible hero copy and layout.",
            }
        )
        result = run_check([".github/scripts/checker.py"], value)
        self.assertEqual(result["status"], "PASS")
        self.assertTrue(result["visual_impact"]["required"])
        self.assertEqual(result["browser_evidence"], [])

    def test_nonvisual_impact_on_visual_path_is_a_reviewer_warning(self):
        value = declaration(
            paths=["components/Example.tsx"],
            visual_impact={
                "required": False,
                "reason": "Only an internal calculation changes; rendered output is unchanged.",
            },
        )
        result = run_check(["components/Example.tsx"], value)
        self.assertEqual(result["status"], "PASS")
        self.assertTrue(result["warnings"])
        self.assertTrue(any("visual_impact.required is declared as false" in item for item in result["warnings"]))
        self.assertTrue(any("A reviewer should confirm" in item for item in result["warnings"]))

    def test_nonvisual_impact_on_nonvisual_path_passes(self):
        value = declaration(
            visual_impact={
                "required": False,
                "reason": "The checker logic does not affect rendered application output.",
            }
        )
        result = run_check([".github/scripts/checker.py"], value)
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["warnings"], [])

    def test_visual_impact_requires_a_boolean_and_specific_reason(self):
        for impact in (
            {"required": "yes", "reason": "Visible layout changes require browser verification."},
            {"required": True, "reason": "TODO"},
            {"required": True},
        ):
            with self.subTest(impact=impact):
                with self.assertRaises(ScopeError):
                    run_check([".github/scripts/checker.py"], declaration(visual_impact=impact))

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


class ScopeChangeWordingTests(unittest.TestCase):
    def expansion_declaration(self):
        return declaration(
            paths=["app/new-component.tsx"],
            scope_expansion=[
                {
                    "path": "app/new-component.tsx",
                    "reason": "Shared component required by the QA change",
                }
            ],
        )

    def run_expansion(self, preamble):
        return run_check(
            ["app/new-component.tsx"], self.expansion_declaration(), preamble=preamble
        )

    def test_expansion_requires_the_exact_scope_changed_wording(self):
        for preamble in (
            "",
            "Scope Change: the component was added.\n\n",
            "scope changed: the component was added.\n\n",
            "Changed scope: the component was added.\n\n",
        ):
            with self.subTest(preamble=preamble):
                result = self.run_expansion(preamble)
                self.assertTrue(any("Scope changed" in error for error in result["errors"]))
                self.assertEqual(result["scope_change_statement"], "")

    def test_a_mid_sentence_mention_does_not_satisfy_the_requirement(self):
        result = self.run_expansion(
            "This description mentions Scope changed: but not as its own line.\n\n"
        )
        self.assertEqual(result["scope_change_statement"], "")
        self.assertTrue(any("Scope changed" in error for error in result["errors"]))

    def test_a_line_starting_with_the_phrase_and_an_explanation_is_accepted(self):
        result = self.run_expansion(
            "**Scope changed:** the shared component is required by the QA change.\n\n"
        )
        self.assertEqual(
            result["scope_change_statement"],
            "the shared component is required by the QA change.",
        )

    def test_scope_changed_requires_a_specific_explanation(self):
        result = self.run_expansion("Scope changed:\n\n")
        self.assertTrue(any("Scope changed" in error for error in result["errors"]))
        self.assertEqual(result["scope_change_statement"], "")

    def test_scope_changed_wording_is_captured_but_not_an_approval(self):
        result = self.run_expansion(SCOPE_CHANGE)
        self.assertEqual(
            result["scope_change_statement"],
            "the shared component is required by the QA change.",
        )
        self.assertFalse(result["approvals"]["scope_expansion"]["approved"])
        self.assertTrue(
            any("scope_expansion" in error for error in result["errors"])
        )


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
