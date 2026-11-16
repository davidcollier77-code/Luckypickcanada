import unittest

from review_pr_changes import WARNING, ReviewError, render_markdown, review_files


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


if __name__ == "__main__":
    unittest.main()
