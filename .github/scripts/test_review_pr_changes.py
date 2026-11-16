import unittest

from review_pr_changes import (
    WARNING,
    ReviewError,
    main,
    render_comment,
    render_markdown,
    review_files,
)


def patch(*lines, start=1):
    header = "@@ -0,0 +%d,%d @@\n" % (start, len(lines))
    return header + "".join("+" + line + "\n" for line in lines)


def record(path, *lines, start=1):
    return {"filename": path, "status": "modified", "patch": patch(*lines, start=start)}


def findings_for(path, *lines, start=1):
    return review_files([record(path, *lines, start=start)])["findings"]


class HardFindingTests(unittest.TestCase):
    def test_private_key_block_is_a_hard_finding(self):
        header = "-----BEGIN " + "PRIVATE KEY-----"
        result = review_files([record("app/config.js", header)])
        self.assertEqual(result["status"], "FAIL")
        self.assertEqual(result["hard_count"], 1)
        self.assertEqual(result["findings"][0]["rule"], "private-key-block")

    def test_provider_token_is_a_hard_finding(self):
        token = "AKIA" + "1234567890ABCDEF"
        result = review_files([record("app/config.js", 'const key = "%s";' % token)])
        self.assertEqual(result["status"], "FAIL")
        self.assertEqual(result["hard_count"], 1)
        self.assertEqual(result["findings"][0]["rule"], "aws-access-key")

    def test_github_token_is_a_hard_finding(self):
        token = "ghp_" + ("a" * 36)
        result = review_files([record("app/config.js", 'const token = "%s";' % token)])
        self.assertEqual(result["status"], "FAIL")
        self.assertEqual(result["findings"][0]["rule"], "github-token")

    def test_merge_marker_is_a_hard_finding(self):
        marker = "<" * 7 + " HEAD"
        result = review_files([record("components/Hero.tsx", marker)])
        self.assertEqual(result["status"], "FAIL")
        self.assertEqual(result["findings"][0]["rule"], "merge-conflict-marker")

    def test_secret_excerpts_are_redacted_in_reports(self):
        token = "AKIA" + "1234567890ABCDEF"
        result = review_files([record("app/config.js", 'const key = "%s";' % token)])
        markdown = render_markdown(result)
        self.assertNotIn(token, result["findings"][0]["excerpt"])
        self.assertNotIn(token, markdown)
        self.assertIn("redacted provider token", markdown)

    def test_known_documentation_example_token_is_ignored(self):
        result = review_files(
            [record("docs/example.md", 'const key = "AKIAIOSFODNN7EXAMPLE";')]
        )
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["hard_count"], 0)


class AdvisoryFindingTests(unittest.TestCase):
    def test_unsafe_html_is_a_warning_not_a_failure(self):
        sink = "<div " + "dangerouslySet" + "InnerHTML={html} />"
        result = review_files([record("components/Hero.tsx", sink)])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["warning_count"], 1)
        self.assertEqual(result["findings"][0]["severity"], WARNING)

    def test_insecure_external_url_is_a_warning(self):
        url = "http" + "://insecure.example/path"
        result = review_files([record("components/Hero.tsx", "<a href=\"%s\">x</a>" % url)])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"][0]["rule"], "insecure-http-url")

    def test_target_blank_without_noopener_is_a_warning(self):
        link = '<a target="' + '_blank" href="' + "https" + '://example.com">x</a>'
        result = review_files([record("components/Hero.tsx", link)])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"][0]["rule"], "target-blank-without-noopener")

    def test_hardcoded_credential_assignment_is_a_warning(self):
        assignment = "const password" + ' = "' + "not-a-real-value" + '";'
        result = review_files([record("app/config.js", assignment)])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"][0]["rule"], "hardcoded-credential")

    def test_type_suppression_is_a_warning(self):
        suppression = "// @ts-" + "ignore"
        result = review_files([record("app/lib/safe.ts", suppression)])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"][0]["rule"], "type-or-lint-suppression")

    def test_debugger_statement_is_a_warning(self):
        result = review_files([record("app/lib/safe.ts", "debug" + "ger;")])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"][0]["rule"], "debugger-statement")

    def test_deprecated_api_is_a_warning(self):
        call = "document." + "execCommand('copy');"
        result = review_files([record("app/lib/legacy.ts", call)])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"][0]["rule"], "deprecated-api")

    def test_package_dependency_addition_is_a_warning(self):
        result = review_files(
            [record("package.json", '  "new-package": "^1.0.0",')]
        )
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"][0]["rule"], "dependency-addition")


class FalsePositiveControlTests(unittest.TestCase):
    def test_environment_lookup_is_not_a_credential_finding(self):
        result = review_files(
            [record("app/config.js", "const apiKey = process.env.API_KEY;")]
        )
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"], [])

    def test_placeholder_credential_is_suppressed(self):
        assignment = "const password" + ' = "' + "placeholder-value" + '";'
        result = review_files([record("app/config.js", assignment)])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"], [])

    def test_package_engine_constraint_is_not_a_dependency_warning(self):
        result = review_files([record("package.json", '  "node": ">=20",')])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"], [])

    def test_local_development_http_url_is_not_a_warning(self):
        url = "http" + "://localhost:3000/api/health"
        result = review_files([record("app/lib/client.ts", "fetch(\"%s\");" % url)])
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"], [])

    def test_documentation_http_link_is_not_a_code_warning(self):
        result = review_files(
            [record("docs/README.md", "See " + "http" + "://example.com for details.")]
        )
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"], [])

    def test_clean_patch_has_no_findings(self):
        result = review_files(
            [
                record(
                    "app/lib/safe.js",
                    "const key = process.env.API_KEY;",
                    "export const label = 'safe copy';",
                )
            ]
        )
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["findings"], [])
        self.assertEqual(result["reviewed_files"], ["app/lib/safe.js"])

    def test_missing_patch_is_reported_as_skipped_not_guessed(self):
        result = review_files(
            [{"filename": "public/image.png", "status": "modified"}]
        )
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["reviewed_files"], [])
        self.assertEqual(result["skipped_files"][0]["path"], "public/image.png")

    def test_malformed_record_fails_closed(self):
        with self.assertRaises(ReviewError):
            review_files([{"status": "modified"}])


class RegressionFixTests(unittest.TestCase):
    """Regression tests for false-positive and false-negative fixes."""

    # Fix 2: HTTP URL detection
    def test_https_url_is_not_flagged_as_insecure(self):
        url = "https" + "://secure.example.com/path"
        result = review_files([record("components/Link.tsx", '<a href="%s">link</a>' % url)])
        insecure = [f for f in result["findings"] if f["rule"] == "insecure-http-url"]
        self.assertEqual(insecure, [])

    def test_http_embedded_inside_https_query_param_is_not_flagged(self):
        # http:// is preceded by a word char (the 's' of https) so must not match.
        line = 'const u = "https' + '://host/path?from=http' + '://old.example.com";'
        result = review_files([record("app/lib/redirect.ts", line)])
        insecure = [f for f in result["findings"] if f["rule"] == "insecure-http-url"]
        self.assertEqual(insecure, [])

    def test_standalone_http_url_is_still_flagged(self):
        url = "http" + "://insecure.example.com/page"
        result = review_files([record("components/Link.tsx", '<a href="%s">x</a>' % url)])
        insecure = [f for f in result["findings"] if f["rule"] == "insecure-http-url"]
        self.assertEqual(len(insecure), 1)

    # Fix 3: Multiline target="_blank" / rel="noopener"
    def test_target_blank_with_noopener_on_next_line_is_not_flagged(self):
        result = review_files([record(
            "components/Hero.tsx",
            "<a",
            '  target="_blank"',
            '  rel="noopener noreferrer"',
            '  href="https://example.com"',
            ">link</a>",
        )])
        blank_findings = [f for f in result["findings"] if f["rule"] == "target-blank-without-noopener"]
        self.assertEqual(blank_findings, [])

    def test_target_blank_without_noopener_anywhere_is_still_flagged(self):
        result = review_files([record(
            "components/Hero.tsx",
            "<a",
            '  target="_blank"',
            '  href="https://example.com"',
            ">link</a>",
        )])
        blank_findings = [f for f in result["findings"] if f["rule"] == "target-blank-without-noopener"]
        self.assertEqual(len(blank_findings), 1)

    # Fix 4: Suppression detection — string literals must not trigger
    def test_suppression_directive_in_string_literal_is_not_flagged(self):
        line = 'const msg = "Do not use @ts-' + 'ignore in production.";'
        result = review_files([record("app/lib/docs.ts", line)])
        suppression = [f for f in result["findings"] if f["rule"] == "type-or-lint-suppression"]
        self.assertEqual(suppression, [])

    def test_suppression_directive_in_code_comment_is_still_flagged(self):
        suppression = "// @ts-" + "ignore"
        result = review_files([record("app/lib/safe.ts", suppression)])
        findings = [f for f in result["findings"] if f["rule"] == "type-or-lint-suppression"]
        self.assertEqual(len(findings), 1)


class ReportAndLineMappingTests(unittest.TestCase):
    def test_hunk_line_numbers_point_to_the_new_file(self):
        token = "AKIA" + "1234567890ABCDEF"
        body = (
            "@@ -10,2 +20,3 @@\n"
            " context\n"
            "+const key = \"%s\";\n"
            " context\n" % token
        )
        result = review_files(
            [{"filename": "app/config.js", "status": "modified", "patch": body}]
        )
        self.assertEqual(result["findings"][0]["line"], 21)

    def test_duplicate_findings_are_collapsed(self):
        token = "AKIA" + "1234567890ABCDEF"
        body = patch('const key = "%s";' % token)
        result = review_files(
            [
                {"filename": "app/config.js", "status": "modified", "patch": body},
                {"filename": "app/config.js", "status": "modified", "patch": body},
            ]
        )
        self.assertEqual(result["hard_count"], 1)
        self.assertEqual(len(result["findings"]), 1)

    def test_markdown_separates_hard_findings_and_warnings(self):
        token = "AKIA" + "1234567890ABCDEF"
        sink = "<div " + "dangerouslySet" + "InnerHTML={html} />"
        result = review_files(
            [
                record("app/config.js", 'const key = "%s";' % token),
                record("components/Hero.tsx", sink),
            ]
        )
        markdown = render_markdown(result)
        self.assertIn("Changed-code review: FAIL", markdown)
        self.assertIn("Hard findings: 1", markdown)
        self.assertIn("Advisory warnings: 1", markdown)
        self.assertIn("Warnings are advisory", markdown)


def added_record(path, *lines, start=1):
    return {"filename": path, "status": "added", "patch": patch(*lines, start=start)}


class DefectPatternTests(unittest.TestCase):
    """Controlled examples: real defect patterns, with harmless code beside them."""

    def test_focused_test_is_a_confirmed_warning(self):
        result = review_files(
            [record("__tests__/hero.test.js", "it.only('runs alone', () => {});")]
        )
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["warning_count"], 1)
        finding = result["findings"][0]
        self.assertEqual(finding["rule"], "focused-test")
        self.assertEqual(finding["classification"], "confirmed")
        self.assertEqual(finding["confidence"], "high")

    def test_only_property_access_outside_a_test_is_not_flagged(self):
        result = review_files([record("app/lib/list.js", "const first = list.only(1);")])
        self.assertEqual(result["findings"], [])

    def test_skipped_test_is_not_a_focused_test(self):
        result = review_files(
            [record("__tests__/hero.test.js", "describe.skip('later', () => {});")]
        )
        self.assertEqual(result["findings"], [])

    def test_empty_catch_is_reported(self):
        result = review_files([record("app/lib/io.js", "} catch { }")])
        self.assertEqual(result["findings"][0]["rule"], "empty-catch-block")
        self.assertEqual(result["findings"][0]["classification"], "potential")

    def test_handled_catch_is_not_reported(self):
        result = review_files(
            [record("app/lib/io.js", "} catch (error) { console.warn(error); }")]
        )
        self.assertEqual(result["findings"], [])

    def test_await_inside_for_each_is_reported(self):
        result = review_files(
            [
                record(
                    "app/lib/save.js",
                    "items.forEach(async (item) => {",
                    "  await save(item);",
                    "});",
                )
            ]
        )
        self.assertEqual(result["findings"][0]["rule"], "await-in-for-each")
        self.assertEqual(result["findings"][0]["classification"], "confirmed")

    def test_promise_all_map_pattern_is_not_reported(self):
        result = review_files(
            [
                record(
                    "app/lib/save.js",
                    "await Promise.all(items.map(async (item) => save(item)));",
                )
            ]
        )
        self.assertEqual(result["findings"], [])

    def test_assignment_in_condition_is_a_confirmed_warning(self):
        result = review_files([record("app/lib/pick.js", "if (count = limit) {")])
        self.assertEqual(result["status"], "PASS")
        finding = result["findings"][0]
        self.assertEqual(finding["rule"], "assignment-in-condition")
        self.assertEqual(finding["classification"], "confirmed")
        self.assertIn("count === limit", finding["suggestion"])

    def test_comparison_operators_in_a_condition_are_not_reported(self):
        result = review_files(
            [
                record(
                    "app/lib/pick.js",
                    "if (count === limit) {",
                    "if (low <= high) {",
                    "while (index < total) {",
                )
            ]
        )
        self.assertEqual(result["findings"], [])

    def test_deliberate_assignment_and_test_is_not_reported(self):
        result = review_files(
            [
                record(
                    "app/lib/read.js",
                    "while ((line = read()) !== null) {",
                    "if ((ready = check()) && ready) {",
                )
            ]
        )
        self.assertEqual(result["findings"], [])

    def test_unused_import_in_a_fully_added_file_is_reported(self):
        result = review_files(
            [
                added_record(
                    "components/Widget.jsx",
                    "import { alpha, beta } from './math';",
                    "export default function Widget() {",
                    "  return beta;",
                    "}",
                )
            ]
        )
        rules = [(item["rule"], item["message"]) for item in result["findings"]]
        self.assertEqual(len(rules), 1)
        self.assertEqual(rules[0][0], "unused-import")
        self.assertIn("'alpha'", rules[0][1])
        self.assertEqual(result["findings"][0]["classification"], "confirmed")

    def test_used_import_in_jsx_is_not_reported(self):
        result = review_files(
            [
                added_record(
                    "components/Widget.jsx",
                    "import Widget from './Widget';",
                    "export default function Page() {",
                    "  return <Widget />;",
                    "}",
                )
            ]
        )
        self.assertEqual(result["findings"], [])

    def test_react_import_is_never_reported_as_unused(self):
        result = review_files(
            [added_record("components/Widget.jsx", "import React from 'react';", "export default 1;")]
        )
        self.assertEqual(result["findings"], [])

    def test_unused_import_rule_does_not_guess_in_modified_files(self):
        # A modified file exposes only its hunks, so an absent reference is not
        # evidence that the import is unused.
        result = review_files(
            [record("components/Widget.jsx", "import { alpha } from './math';")]
        )
        self.assertEqual(result["findings"], [])

    def test_duplicate_locations_collapse_and_are_counted(self):
        token = "AKIA" + "1234567890ABCDEF"
        body = patch('const key = "%s";' % token)
        result = review_files(
            [
                {"filename": "app/config.js", "status": "modified", "patch": body},
                {"filename": "app/config.js", "status": "modified", "patch": body},
            ]
        )
        self.assertEqual(len(result["findings"]), 1)
        self.assertEqual(result["duplicates_collapsed"], 1)

    def test_classification_separates_confirmed_from_potential(self):
        token = "AKIA" + "1234567890ABCDEF"
        sink = "<div " + "dangerouslySet" + "InnerHTML={html} />"
        result = review_files(
            [
                record("app/config.js", 'const key = "%s";' % token),
                record("components/Hero.tsx", sink),
            ]
        )
        classifications = {item["rule"]: item["classification"] for item in result["findings"]}
        self.assertEqual(classifications["aws-access-key"], "confirmed")
        self.assertEqual(classifications["unsafe-html-or-dynamic-code"], "potential")


FLAGGED_LINES = (
    ("__tests__/hero.test.js", "it.only('runs alone', () => {});"),
    ("app/lib/io.js", "items.forEach(async (item) => { await save(item); });"),
    ("app/lib/queue.js", "} catch { }"),
    ("app/config.js", 'const key = "%s";' % ("AKIA" + "1234567890ABCDEF")),
    ("components/Hero.tsx", "<div " + "dangerouslySet" + "InnerHTML={html} />"),
    ("app/lib/legacy.js", "document.execCommand('copy');"),
    ("package.json", '"left-pad": "^1.3.0"'),
)


class SuggestedFixTests(unittest.TestCase):
    """Every finding must carry a correction the developer can act on."""

    def test_every_finding_carries_a_specific_suggestion(self):
        result = review_files([record(path, line) for path, line in FLAGGED_LINES])
        self.assertEqual(len(result["findings"]), len(FLAGGED_LINES))
        for finding in result["findings"]:
            self.assertTrue(finding["suggestion"].strip(), finding["rule"])
            self.assertGreaterEqual(len(finding["suggestion"]), 24, finding["rule"])

    def test_focused_test_suggestion_rewrites_the_line(self):
        finding = findings_for("__tests__/hero.test.js", "it.only('runs alone', () => {});")[0]
        self.assertIn("it('runs alone'", finding["suggestion"])
        self.assertNotIn(".only", finding["suggestion"])

    def test_for_each_suggestion_names_the_collection_and_binding(self):
        finding = findings_for(
            "app/lib/io.js", "items.forEach(async (entry) => { await save(entry); });"
        )[0]
        self.assertIn("for (const entry of items)", finding["suggestion"])

    def test_empty_catch_suggestion_shows_a_handling_form(self):
        finding = findings_for("app/lib/queue.js", "} catch { }")[0]
        self.assertIn("catch (error)", finding["suggestion"])

    def test_unused_import_suggestion_names_the_binding(self):
        result = review_files(
            [added_record("app/lib/page.js", "import { alpha } from './math';", "export default 1;")]
        )
        finding = result["findings"][0]
        self.assertEqual(finding["rule"], "unused-import")
        self.assertIn("alpha", finding["suggestion"])

    def test_deprecated_api_suggestion_names_the_replacement(self):
        finding = findings_for("app/lib/legacy.js", "document.execCommand('copy');")[0]
        self.assertIn("navigator.clipboard", finding["suggestion"])

    def test_dependency_suggestion_names_the_package(self):
        finding = findings_for("package.json", '"left-pad": "^1.3.0"')[0]
        self.assertIn("left-pad", finding["suggestion"])

    def test_markdown_states_the_suggested_fix_for_each_finding(self):
        markdown = render_markdown(
            review_files([record("__tests__/hero.test.js", "it.only('x', () => {});")])
        )
        self.assertIn("Suggested fix:", markdown)


class FindingIdentityTests(unittest.TestCase):
    """Distinct defects at one location stay distinct; repeats still collapse."""

    def test_one_focused_test_is_reported_once(self):
        # The rule reads the added line only, not its surrounding window, so a
        # single .only must not be reported once per line of that window.
        result = review_files(
            [
                record(
                    "__tests__/hero.test.js",
                    "describe('hero', () => {",
                    "  it.only('a', () => {});",
                    "  it('b', () => {});",
                    "});",
                )
            ]
        )
        self.assertEqual([item["rule"] for item in result["findings"]], ["focused-test"])
        self.assertEqual(result["duplicates_collapsed"], 0)

    def test_two_focused_tests_are_reported_separately(self):
        result = review_files(
            [
                record(
                    "__tests__/hero.test.js",
                    "it.only('a', () => {});",
                    "it.only('b', () => {});",
                )
            ]
        )
        self.assertEqual(len([i for i in result["findings"] if i["rule"] == "focused-test"]), 2)

    def test_two_unused_bindings_on_one_line_stay_two_findings(self):
        result = review_files(
            [
                added_record(
                    "app/lib/page.js",
                    "import { alpha, beta } from './math';",
                    "export default 1;",
                )
            ]
        )
        unused = [item for item in result["findings"] if item["rule"] == "unused-import"]
        self.assertEqual(len(unused), 2)
        self.assertEqual(result["duplicates_collapsed"], 0)

    def test_import_path_text_does_not_mask_an_unused_binding(self):
        result = review_files(
            [
                added_record(
                    "app/lib/page.js",
                    "import { alpha } from './math';",
                    "import './alpha-legacy';",
                    "export default 1;",
                )
            ]
        )
        self.assertEqual([item["rule"] for item in result["findings"]], ["unused-import"])


class SuggestedVerificationTests(unittest.TestCase):
    """Playwright is suggested for rendering and performance work, not everything."""

    def test_documentation_only_change_suggests_no_browser_work(self):
        result = review_files([added_record("docs/notes.md", "Updated the copy.")])
        suggestion = result["suggested_verification"]
        self.assertFalse(suggestion["playwright_visual"])
        self.assertFalse(suggestion["playwright_performance"])
        self.assertIn("No Playwright verification is suggested", render_markdown(result))

    def test_visual_change_suggests_playwright_visual_verification(self):
        result = review_files([record("components/Hero.tsx", "export const a = 1;")])
        self.assertTrue(result["suggested_verification"]["playwright_visual"])
        markdown = render_markdown(result)
        self.assertIn("Playwright visual verification is suggested", markdown)
        self.assertIn("./scripts/playwright-cli.sh test", markdown)

    def test_performance_change_suggests_playwright_measurement(self):
        result = review_files(
            [record("components/cosmic-event-engine.js", "export const tick = 1;")]
        )
        suggestion = result["suggested_verification"]
        self.assertTrue(suggestion["playwright_visual"])
        self.assertTrue(suggestion["playwright_performance"])
        self.assertIn("Playwright performance measurement is suggested", render_markdown(result))

    def test_ci_and_unit_test_changes_need_no_browser(self):
        result = review_files(
            [
                added_record(".github/workflows/example.yml", "name: example"),
                added_record("__tests__/thing.test.js", "export const one = 1;"),
                added_record("specs/170-example/spec.md", "Requirement."),
            ]
        )
        self.assertFalse(result["suggested_verification"]["playwright_visual"])

    def test_suggestion_agrees_with_the_visual_qa_classifier(self):
        import pathlib
        import subprocess

        script = (
            pathlib.Path(__file__).resolve().parents[2]
            / ".github"
            / "scripts"
            / "classify-visual-changes.sh"
        )
        cases = (
            ["components/Hero.tsx"],
            ["app/lib/io.js"],
            ["app/globals.css"],
            ["public/og.png"],
            ["__tests__/thing.test.js"],
            ["docs/notes.md"],
            [".github/workflows/visual-qa.yml"],
            [".freebuff/ci.md"],
            [".agents/governance.md"],
            ["app/api/route.js"],
            ["playwright.config.ts"],
            ["playwright.swiftshader.config.ts"],
            ["scripts/unknown.mjs"],
            ["specs/170/spec.md", "components/Hero.tsx"],
        )
        for paths in cases:
            expected = subprocess.run(
                ["bash", str(script)],
                input="\n".join(paths),
                text=True,
                capture_output=True,
                check=True,
            ).stdout.strip()
            review = review_files([record(path, "export const x = 1;") for path in paths])
            actual = (
                "visual_required=true"
                if review["suggested_verification"]["playwright_visual"]
                else "visual_required=false"
            )
            self.assertEqual(actual, expected, paths)


def fabricated_report(count, suggestion=None):
    """A report with `count` findings, independent of rule fixtures."""
    findings = []
    for index in range(count):
        findings.append(
            {
                "path": "app/lib/module%02d.js" % index,
                "line": index + 1,
                "rule": "focused-test",
                "severity": WARNING,
                "confidence": "high",
                "classification": "confirmed",
                "message": "Finding number %d was reported." % index,
                "recommendation": "Remove the focus.",
                "suggestion": suggestion
                or "Remove the focus so the whole suite runs: `it('case %d', () => {});`"
                % index,
                "excerpt": "it.only('case %03d', () => { expect(true).toBe(true); });" % index,
            }
        )
    return {
        "status": "PASS",
        "reviewed_files": ["app/lib/module00.js"],
        "skipped_files": [],
        "hard_count": 0,
        "warning_count": count,
        "confirmed_count": count,
        "duplicates_collapsed": 0,
        "findings": findings,
        "note": "Warnings are advisory.",
        "suggested_verification": {"playwright_visual": False, "playwright_performance": False},
    }


class CommentBodyTests(unittest.TestCase):
    """The published comment must carry a practical fix for every finding."""

    def test_comment_starts_with_the_sticky_marker(self):
        body = render_comment(fabricated_report(2))
        self.assertTrue(body.startswith("<!-- qa-review-report -->\n"))

    def test_every_rendered_finding_has_the_three_part_structure(self):
        body = render_comment(fabricated_report(3))
        self.assertEqual(body.count("  - What happened: "), 3)
        self.assertEqual(body.count("  - Evidence: "), 3)
        self.assertEqual(body.count("  - Suggested fix: "), 3)
        for number in range(3):
            self.assertIn("`it('case %d', () => {});`" % number, body)

    def test_comment_keeps_all_findings_when_it_fits(self):
        body = render_comment(fabricated_report(40), limit=60000)
        self.assertLessEqual(len(body.encode("utf-8")), 60000)
        self.assertEqual(body.count("  - Suggested fix: "), 40)
        self.assertNotIn("omitted to fit GitHub", body)

    def test_comment_truncates_between_findings_and_never_inside_one(self):
        body = render_comment(fabricated_report(400), limit=8000)
        self.assertLessEqual(len(body.encode("utf-8")), 8000)
        rendered = body.count("- **warning · confirmed · focused-test**")
        self.assertGreater(rendered, 0)
        self.assertLess(rendered, 400)
        # Every rendered block is complete: no block stops before its fix.
        self.assertEqual(body.count("  - What happened: "), rendered)
        self.assertEqual(body.count("  - Evidence: "), rendered)
        self.assertEqual(body.count("  - Suggested fix: "), rendered)
        self.assertIn("%d more finding(s) omitted to fit GitHub's comment limit" % (400 - rendered), body)
        self.assertIn("workflow job summary lists all of them", body)

    def test_a_tiny_limit_still_keeps_the_marker_and_stays_inside_the_cap(self):
        body = render_comment(fabricated_report(10), limit=400)
        self.assertLessEqual(len(body.encode("utf-8")), 400)
        self.assertTrue(body.startswith("<!-- qa-review-report -->"))
        self.assertNotIn("Suggested fix: \n", body)

    def test_render_falls_back_when_a_finding_has_no_suggestion(self):
        report = fabricated_report(1)
        report["findings"][0]["rule"] = "empty-catch-block"
        report["findings"][0]["suggestion"] = ""
        report["findings"][0]["excerpt"] = "} catch { }"
        body = render_comment(report)
        self.assertIn("  - Suggested fix: ", body)
        self.assertIn("catch (error)", body)

    def test_every_rule_renders_the_same_actionable_fix_as_the_finding(self):
        token = "AKIA" + "1234567890ABCDEF"
        result = review_files(
            [
                record("__tests__/hero.test.js", "it.only('runs alone', () => {});"),
                record("app/lib/io.js", "items.forEach(async (item) => { await save(item); });"),
                record("app/lib/queue.js", "} catch { }"),
                record("app/lib/legacy.js", "document.execCommand('copy');"),
                record("app/config.js", 'const key = "%s";' % token),
                record("components/Hero.tsx", "<div " + "dangerouslySet" + "InnerHTML={html} />"),
                record("package.json", '"left-pad": "^1.3.0"'),
                record("app/lib/debug.js", "debugger;"),
            ]
        )
        body = render_comment(result)
        self.assertGreater(len(result["findings"]), 6)
        for finding in result["findings"]:
            self.assertGreaterEqual(len(finding["suggestion"].strip()), 24, finding["rule"])
            self.assertIn("  - Suggested fix: " + finding["suggestion"], body, finding["rule"])
        self.assertNotIn("Suggested fix: \n", body)

    def test_cli_writes_the_comment_file(self):
        import json as json_module
        import tempfile

        with tempfile.TemporaryDirectory() as directory:
            files_path = directory + "/files.json"
            comment_path = directory + "/comment.md"
            with open(files_path, "w", encoding="utf-8") as handle:
                json_module.dump(
                    [
                        {
                            "filename": "__tests__/hero.test.js",
                            "status": "modified",
                            "patch": patch("it.only('runs alone', () => {});"),
                        }
                    ],
                    handle,
                )
            status = main(["--files", files_path, "--comment", comment_path])
            self.assertEqual(status, 0)
            with open(comment_path, encoding="utf-8") as handle:
                body = handle.read()
        self.assertTrue(body.startswith("<!-- qa-review-report -->"))
        self.assertIn("Suggested fix: Remove the focus", body)


if __name__ == "__main__":
    unittest.main()
