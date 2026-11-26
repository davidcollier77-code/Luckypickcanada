"""Regression tests for the consolidated seven-category verification report."""

from __future__ import annotations

import json
import os
import re
import tempfile
import unittest

import check_qa_pr_scope as scope
import pr_verification_report as report


# Synthetic fixture SHAs are split so the token heuristic does not report them.
HEAD = "0123456789abcdef" + "0123456789abcdef01234567"
EARLIER = "fedcba9876543210" + "fedcba9876543210fedcba98"
OWNER = "davidcollier77-code"
# Split so this test's placeholder fixture is not reported as unfinished code.
PLACEHOLDER_TODO = "TO" + "DO"

SPEC_PATHS = [
    "specs/198-fixture/spec.md",
    "specs/198-fixture/plan.md",
    "specs/198-fixture/tasks.md",
]


def declaration(**overrides):
    value = {
        "version": 1,
        "summary": "Align pull request verification with the seven checker categories",
        "features": ["PR verification reporting"],
        "paths": list(SPEC_PATHS) + [".github/scripts/fixture.py"],
        "file_purposes": [
            {"path": path, "purpose": "Record the task artifacts for the verification change."}
            for path in SPEC_PATHS
        ]
        + [
            {
                "path": ".github/scripts/fixture.py",
                "purpose": "Implement and test the consolidated verification report.",
            }
        ],
        "shared_dependencies": [],
        "visual_baseline_updates": [],
        "scope_expansion": [],
        "governance_changes": [],
        "visual_impact": None,
        "browser_evidence": [],
    }
    value.update(overrides)
    return value


GOVERNANCE = """

### Spec Kit and Library Reporting

**Spec Kit stages completed:** specify, plan, tasks, implement
**Spec Kit artifact paths:** `specs/198-fixture/spec.md`, `specs/198-fixture/plan.md`, `specs/198-fixture/tasks.md`
**Task groups selected:** `.freebuff/testing.md`, `.freebuff/ci.md`
**Library documents consulted:** `.docs/testing/_google_eng-practices.md` — review guidance.
**Memory Bank:** `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `memory-bank/techContext.md` and `memory-bank/progress.md` were read.
"""


def body(value=None, preamble="This change aligns the verification report.", governance=True):
    text = "## Purpose\n" + preamble + "\n\n"
    text += report.QA_DECLARATION + "\n\n"
    text += (
        "<!-- qa-scope:start -->\n"
        + json.dumps(value or declaration())
        + "\n<!-- qa-scope:end -->\n"
    )
    if governance:
        text += GOVERNANCE
    return text


def file_records(paths=None, extra=None):
    records = []
    for path in paths if paths is not None else list(SPEC_PATHS) + [".github/scripts/fixture.py"]:
        records.append(
            {
                "filename": path,
                "status": "added",
                "patch": "@@ -0,0 +1,1 @@\n+fixture\n",
            }
        )
    return records + list(extra or [])


def check(name, conclusion, sha=HEAD, status="completed"):
    return {
        "name": name,
        "conclusion": conclusion,
        "status": status,
        "head_sha": sha,
        "html_url": "https://example.invalid/run",
        "completed_at": "2026-11-20T00:00:00Z",
        "id": 1,
    }


def all_supporting(conclusion="success", sha=HEAD):
    return [check(name, conclusion, sha) for name, _purpose in report.QA_SUPPORTING_CHECKS]


def verification(head=HEAD, required=None, conditional=None, stale=None, directives=None, head_present=True):
    return {
        "pr": {"number": 42, "head_sha": head, "head_ref": "fixture"},
        "head_commit": {"sha": head, "skip_directives": directives or []} if head_present else None,
        "required_checks": required
        if required is not None
        else [
            {"name": "DevSkim scan and Security upload", "status": "PASS", "detail": "conclusion success", "head_sha": head},
            {"name": "Validate OpenNext build artifacts", "status": "PASS", "detail": "conclusion success", "head_sha": head},
            {"name": "PR Scope Verification", "status": "PASS", "detail": "conclusion success", "head_sha": head},
        ],
        "conditional_checks": conditional
        if conditional is not None
        else [
            {"name": "Visual QA", "status": "PASS", "detail": "all matching checks succeeded", "head_sha": head}
        ],
        "other_checks": [],
        "stale_check_runs": stale or [],
        "overall_status": "VERIFIED",
        "blocking_reasons": [],
    }


def evidence(**overrides):
    value = {
        "pull_request": {
            "number": 42,
            "body": body(),
            "head": {"sha": HEAD},
            "user": {"login": "freebuff-agent"},
        },
        "files": file_records(),
        "comments": [],
        "owner": OWNER,
        "check_runs": all_supporting()
        + [check(report.DEVSKIM_CHECK, "success")],
        "verification": verification(),
        "alerts": [],
        "dependabot_alerts": [],
    }
    value.update(overrides)
    # GitHub's pull request payload always reports changed_files; the scope
    # checker compares it with the complete file list and fails closed without
    # it.
    if isinstance(value.get("files"), list) and isinstance(value.get("pull_request"), dict):
        value["pull_request"]["changed_files"] = len(value["files"])
    return value


def category(result, key):
    return next(item for item in result["categories"] if item["id"] == key)


class CategoryContractTests(unittest.TestCase):
    def test_exactly_seven_categories_in_the_fixed_order(self):
        result = report.build_report(evidence())
        self.assertEqual(
            [item["id"] for item in result["categories"]],
            [
                "qa-checker",
                "devskim",
                "pr-scope",
                "protected-files",
                "verification-integrity",
                "governance",
                "dependency-health",
            ],
        )
        self.assertEqual(
            [item["name"] for item in result["categories"]],
            [
                "QA Checker",
                "DevSkim",
                "PR Scope Verification",
                "Protected File Changes",
                "Verification Integrity",
                "Governance and Workflow Verification",
                "Dependency Health & Vulnerability Review",
            ],
        )

    def test_visual_qa_is_a_supporting_result_not_a_top_level_category(self):
        result = report.build_report(evidence())
        names = [item["name"] for item in result["categories"]]
        self.assertNotIn("Visual QA", names)
        self.assertNotIn("Visual QA Summary", names)
        self.assertNotIn("Visual QA", json.dumps(names))
        self.assertTrue(
            any(
                row["name"] == "Application Verification"
                for row in result["supporting_checks"]
            )
        )
        self.assertTrue(
            any("shard 1/2" in row["name"] for row in result["supporting_checks"])
        )
        self.assertTrue(
            any("shard 2/2" in row["name"] for row in result["supporting_checks"])
        )

    def test_inapplicable_build_and_visual_rows_do_not_warn(self):
        required = [
            {"name": "Application Verification", "status": "PASS", "detail": "conclusion success", "head_sha": HEAD},
            {"name": report.DEVSKIM_CHECK, "status": "PASS", "detail": "conclusion success", "head_sha": HEAD},
            {"name": "PR Scope Verification", "status": "PASS", "detail": "conclusion success", "head_sha": HEAD},
            {
                "name": "Validate OpenNext build artifacts",
                "status": "NOT RUN",
                "detail": "not applicable: no changed path can affect the production build",
                "applicable": False,
                "blocking": False,
                "head_sha": "",
            },
        ]
        conditional = [
            {
                "name": "Visual QA",
                "status": "NOT RUN",
                "detail": "not applicable: no changed path can affect rendered output",
                "applicable": False,
                "blocking": False,
                "head_sha": "",
            }
        ]
        runs = [
            check("Application Verification", "success"),
            check(report.DEVSKIM_CHECK, "success"),
        ]
        result = report.build_report(
            evidence(
                check_runs=runs,
                verification=verification(required=required, conditional=conditional),
            )
        )

        qa = category(result, "qa-checker")
        self.assertEqual(qa["status"], "PASSED")
        self.assertEqual(category(result, "verification-integrity")["status"], "PASSED")
        rows = {row["name"]: row for row in result["supporting_checks"]}
        self.assertFalse(rows["Validate OpenNext build artifacts"]["applicable"])
        self.assertFalse(rows["Visual QA (shard 1/2)"]["applicable"])
        self.assertFalse(rows["Visual QA (shard 2/2)"]["applicable"])
        self.assertIn("not applicable", rows["Visual QA (shard 1/2)"]["reason"])

    def test_unknown_visual_applicability_does_not_fail_the_report(self):
        required = [
            {"name": "Application Verification", "status": "PASS", "detail": "conclusion success", "head_sha": HEAD},
            {"name": report.DEVSKIM_CHECK, "status": "PASS", "detail": "conclusion success", "head_sha": HEAD},
            {"name": "PR Scope Verification", "status": "PASS", "detail": "conclusion success", "head_sha": HEAD},
        ]
        conditional = [
            {
                "name": "Visual QA",
                "status": "NOT RUN",
                "detail": "applicability is unknown, so the browser check is conditional",
                "applicable": True,
                "blocking": False,
                "head_sha": HEAD,
            }
        ]
        runs = [
            check("Application Verification", "success"),
            check(report.DEVSKIM_CHECK, "success"),
            check("PR Scope Verification", "success"),
        ]
        result = report.build_report(
            evidence(
                check_runs=runs,
                verification=verification(required=required, conditional=conditional),
            )
        )

        integrity = category(result, "verification-integrity")
        self.assertEqual(integrity["status"], "PASSED")
        self.assertFalse(any("Visual QA" in item for item in integrity["attention"]))

    def test_every_status_uses_the_four_allowed_values(self):
        result = report.build_report(evidence())
        for item in result["categories"]:
            self.assertIn(item["status"], {"PASSED", "FAILED", "WARNING", "NOT RUN"})
        rendered = report.render_comment(result)
        for legacy in ("**PASS**", "**WARN**", "**FAIL**", "BLOCKED", "Unavailable"):
            self.assertNotIn(legacy, rendered)

    def test_comment_starts_with_the_single_sticky_marker(self):
        result = report.build_report(evidence())
        rendered = report.render_comment(result)
        self.assertEqual(rendered.splitlines()[0], report.REPORT_MARKER)
        self.assertEqual(rendered.count(report.REPORT_MARKER), 1)
        self.assertEqual(rendered.count("| # | Checker category |"), 1)

    def test_byte_budget_truncation_keeps_valid_utf8(self):
        result = report.build_report(evidence())
        rendered = report.render_comment(result, limit=600)
        self.assertLessEqual(len(rendered.encode("utf-8")), 600)
        rendered.encode("utf-8").decode("utf-8")
        self.assertTrue(rendered.startswith(report.REPORT_MARKER))

    def test_report_is_below_the_comment_cap(self):
        files = file_records(
            extra=[
                {
                    "filename": "__tests__/fixture.test.js",
                    "status": "added",
                    "patch": "@@ -0,0 +1,60 @@\n"
                    + "\n".join(["+expect(true).toBe(true);"] * 60),
                }
            ]
        )
        result = report.build_report(evidence(files=files))
        rendered = report.render_comment(result, limit=4000)
        self.assertLessEqual(len(rendered.encode("utf-8")), 4000)


class QaDeclarationTests(unittest.TestCase):
    def test_exact_declaration_passes_the_qa_declaration_check(self):
        result = category(report.build_report(evidence()), "qa-checker")
        self.assertIn("declaration present", result["details"][0].lower())
        self.assertNotEqual(result["status"], "FAILED")

    def test_missing_declaration_fails_the_qa_checker(self):
        pr = evidence()["pull_request"]
        pr["body"] = pr["body"].replace(report.QA_DECLARATION, "")
        result = category(report.build_report(evidence(pull_request=pr)), "qa-checker")
        self.assertEqual(result["status"], "FAILED")
        self.assertTrue(any(report.QA_DECLARATION in item for item in result["attention"]))

    def test_near_miss_declarations_are_not_accepted(self):
        for replacement in (
            report.QA_DECLARATION.replace(" — ", " - "),
            report.QA_DECLARATION.replace("VERIFIED", "Verified"),
            report.QA_DECLARATION.replace(
                " Pre-check completed before PR submission.", ""
            ),
        ):
            with self.subTest(replacement=replacement):
                pr = evidence()["pull_request"]
                pr["body"] = pr["body"].replace(report.QA_DECLARATION, replacement)
                result = category(report.build_report(evidence(pull_request=pr)), "qa-checker")
                self.assertEqual(result["status"], "FAILED")

    def test_declaration_hidden_in_an_html_comment_does_not_count(self):
        pr = evidence()["pull_request"]
        pr["body"] = pr["body"].replace(
            report.QA_DECLARATION, "<!-- " + report.QA_DECLARATION + " -->"
        )
        result = category(report.build_report(evidence(pull_request=pr)), "qa-checker")
        self.assertEqual(result["status"], "FAILED")

    def test_bot_authored_pull_request_reports_the_attestation_as_not_run(self):
        pr = evidence()["pull_request"]
        pr["user"] = {"login": "dependabot[bot]"}
        pr["body"] = pr["body"].replace(report.QA_DECLARATION, "")
        result = category(report.build_report(evidence(pull_request=pr)), "qa-checker")
        self.assertEqual(result["status"], "WARNING")
        self.assertIn("NOT RUN", json.dumps(result["details"]))

    def test_changed_code_finding_renders_the_matched_excerpt(self):
        files = file_records(
            extra=[
                {
                    "filename": "app/lib/queue.js",
                    "status": "modified",
                    "patch": "@@ -0,0 +1,1 @@\n+} catch { }",
                }
            ]
        )
        result = category(report.build_report(evidence(files=files)), "qa-checker")
        rendered = "\n".join(result["details"])
        self.assertIn("Evidence: `} catch { }`", rendered)

    def test_changed_code_review_findings_are_retained_in_the_qa_category(self):
        files = file_records(
            extra=[
                {
                    "filename": "app/lib/queue.js",
                    "status": "modified",
                    "patch": "@@ -0,0 +1,1 @@\n+} catch { }",
                }
            ]
        )
        result = category(report.build_report(evidence(files=files)), "qa-checker")
        self.assertTrue(any("changed-code review" in detail.lower() for detail in result["details"]))
        self.assertTrue(any("catch (error)" in detail for detail in result["details"]))

    def test_failed_supporting_check_fails_the_qa_category(self):
        runs = all_supporting()
        runs[0]["conclusion"] = "failure"
        result = category(report.build_report(evidence(check_runs=runs)), "qa-checker")
        self.assertEqual(result["status"], "FAILED")

    def test_skipped_playwright_shard_is_never_a_pass(self):
        runs = all_supporting()
        runs[2]["conclusion"] = "skipped"
        result = category(report.build_report(evidence(check_runs=runs)), "qa-checker")
        self.assertNotEqual(result["status"], "PASSED")
        self.assertIn("NOT RUN", json.dumps(result["details"] + result["attention"]))
        rendered = report.render_comment(report.build_report(evidence(check_runs=runs)))
        self.assertIn("**NOT RUN**", rendered)

    def test_no_supporting_runs_is_not_a_pass(self):
        result = category(report.build_report(evidence(check_runs=[])), "qa-checker")
        self.assertNotEqual(result["status"], "PASSED")

    def test_submitter_is_not_required_to_provide_browser_evidence(self):
        # A rendering path with no browser_evidence declaration is a valid
        # scope declaration; the automated Playwright workflow owns the browser
        # verification.
        value = declaration(
            paths=["components/Hero.tsx"] + list(SPEC_PATHS),
            file_purposes=[
                {"path": "components/Hero.tsx", "purpose": "Update the hero artwork and layout."}
            ]
            + [
                {"path": path, "purpose": "Record the task artifacts for the verification change."}
                for path in SPEC_PATHS
            ],
            visual_impact={"required": True, "reason": "The hero layout and artwork change."},
        )
        pr = evidence()["pull_request"]
        pr["body"] = body(value)
        files = file_records(paths=["components/Hero.tsx"] + SPEC_PATHS)
        result = category(
            report.build_report(evidence(pull_request=pr, files=files)), "pr-scope"
        )
        self.assertEqual(result["status"], "PASSED")
        self.assertTrue(any("Playwright" in detail for detail in result["details"]))


class StatusClassificationTests(unittest.TestCase):
    def test_success_on_head_is_passed(self):
        result = category(report.build_report(evidence()), "verification-integrity")
        self.assertEqual(result["status"], "PASSED")

    def test_failed_required_check_is_failed(self):
        values = verification(
            required=[
                {"name": "DevSkim scan and Security upload", "status": "FAIL", "detail": "conclusion failure", "head_sha": HEAD},
                {"name": "Validate OpenNext build artifacts", "status": "PASS", "detail": "conclusion success", "head_sha": HEAD},
                {"name": "PR Scope Verification", "status": "PASS", "detail": "conclusion success", "head_sha": HEAD},
            ]
        )
        result = category(report.build_report(evidence(verification=values)), "verification-integrity")
        self.assertEqual(result["status"], "FAILED")

    def test_pending_required_check_is_warning_not_passed(self):
        values = verification(
            required=[
                {"name": "PR Scope Verification", "status": "PENDING", "detail": "the run is in_progress, not completed", "head_sha": HEAD},
            ],
            conditional=[],
        )
        result = category(report.build_report(evidence(verification=values)), "verification-integrity")
        self.assertEqual(result["status"], "WARNING")

    def test_missing_check_is_not_run(self):
        values = verification(
            required=[
                {"name": "PR Scope Verification", "status": "NOT RUN", "detail": "no check run was recorded on the current head", "head_sha": ""},
            ],
            conditional=[],
        )
        result = category(report.build_report(evidence(verification=values)), "verification-integrity")
        self.assertIn(result["status"], {"WARNING", "NOT RUN"})
        self.assertNotEqual(result["status"], "PASSED")

    def test_skip_ci_directive_fails_integrity(self):
        values = verification(directives=["[skip ci]"])
        result = category(report.build_report(evidence(verification=values)), "verification-integrity")
        self.assertEqual(result["status"], "FAILED")
        self.assertTrue(any("CI-skip" in item for item in result["attention"]))

    def test_missing_head_sha_fails_integrity(self):
        values = verification(head="", head_present=False)
        result = category(report.build_report(evidence(verification=values)), "verification-integrity")
        self.assertEqual(result["status"], "FAILED")

    def test_earlier_commit_success_is_never_accepted_for_the_current_head(self):
        # The audit is explicit: required checks have no run on HEAD, and the
        # only green runs belong to an earlier commit.
        values = verification(
            required=[
                {
                    "name": "PR Scope Verification",
                    "status": "NOT RUN",
                    "detail": "no run on the current head; only a run for earlier commit %s exists"
                    % EARLIER[:12],
                    "head_sha": "",
                },
            ],
            conditional=[],
            stale=[
                {"name": "PR Scope Verification", "head_sha": EARLIER, "status": "completed", "conclusion": "success"}
            ],
        )
        result = category(report.build_report(evidence(verification=values)), "verification-integrity")
        self.assertNotEqual(result["status"], "PASSED")
        self.assertTrue(any(EARLIER[:12] in detail for detail in result["details"]))

    def test_supporting_check_on_an_earlier_commit_is_ignored(self):
        runs = all_supporting(sha=EARLIER)
        runs.append(check(report.DEVSKIM_CHECK, "success", EARLIER))
        result = category(report.build_report(evidence(check_runs=runs)), "qa-checker")
        self.assertNotEqual(result["status"], "PASSED")
        self.assertIn("no run is attached to the current head", json.dumps(result["details"]))
        self.assertIn("no run is attached to the current head", json.dumps(result["attention"]))
        self.assertIn("Visual QA", json.dumps(result["supporting_checks"] if "supporting_checks" in result else result["details"]))

    def test_no_verification_audit_is_not_run(self):
        result = category(report.build_report(evidence(verification=None)), "verification-integrity")
        self.assertEqual(result["status"], "NOT RUN")

    def test_empty_verification_audit_is_not_run(self):
        result = category(
            report.build_report(evidence(verification={})), "verification-integrity"
        )
        self.assertEqual(result["status"], "NOT RUN")
        self.assertIn("empty or malformed", result["summary"])

    def test_audit_without_required_checks_is_not_run(self):
        result = category(
            report.build_report(evidence(verification=verification(required=[]))),
            "verification-integrity",
        )
        self.assertEqual(result["status"], "NOT RUN")

    def test_audit_for_another_commit_is_failed(self):
        values = verification(head=EARLIER)
        result = category(
            report.build_report(evidence(verification=values)), "verification-integrity"
        )
        self.assertEqual(result["status"], "FAILED")
        self.assertTrue(any(EARLIER in item for item in result["details"]))

    def test_check_run_without_a_head_sha_is_not_current_head_evidence(self):
        runs = all_supporting()
        runs[0].pop("head_sha")
        result = category(report.build_report(evidence(check_runs=runs)), "qa-checker")
        self.assertNotEqual(result["status"], "PASSED")
        self.assertIn("no run is attached to the current head", json.dumps(result["details"]))


class DevskimTests(unittest.TestCase):
    def test_passing_scan_and_no_alerts_pass(self):
        result = category(report.build_report(evidence()), "devskim")
        self.assertEqual(result["status"], "PASSED")

    def test_failed_scan_fails(self):
        runs = all_supporting() + [check(report.DEVSKIM_CHECK, "failure")]
        result = category(report.build_report(evidence(check_runs=runs)), "devskim")
        self.assertEqual(result["status"], "FAILED")

    def test_missing_scan_is_not_run(self):
        result = category(report.build_report(evidence(check_runs=all_supporting())), "devskim")
        self.assertEqual(result["status"], "NOT RUN")

    def test_high_open_alert_requires_attention(self):
        alerts = [
            {
                "state": "open",
                "rule": {"id": "DS123", "severity": "high", "tool": {"name": "DevSkim"}},
                "most_recent_instance": {"location": {"path": "app/lib/x.js", "start_line": 4}},
            }
        ]
        result = category(report.build_report(evidence(alerts=alerts)), "devskim")
        self.assertEqual(result["status"], "FAILED")

    def test_unreadable_alerts_are_a_warning_not_a_pass_claim(self):
        result = category(
            report.build_report(evidence(alerts={"message": "the API returned 404"})), "devskim"
        )
        self.assertEqual(result["status"], "WARNING")


def advisory(name, severity="high", state="open", patched=None):
    value = {
        "state": state,
        "dependency": {"package": {"name": name}},
        "security_advisory": {"severity": severity},
    }
    if patched:
        value["security_vulnerability"] = {
            "severity": severity,
            "first_patched_version": {"identifier": patched},
        }
    return value


def dependency_files(package_lines=(), lock_lines=()):
    extra = []
    if package_lines:
        extra.append(
            {
                "filename": "package.json",
                "status": "modified",
                "patch": "@@ -1,1 +1,6 @@\n"
                + "\n".join("+" + line for line in package_lines),
            }
        )
    if lock_lines:
        extra.append(
            {
                "filename": "pnpm-lock.yaml",
                "status": "modified",
                "patch": "@@ -1,1 +1,6 @@\n"
                + "\n".join("+" + line for line in lock_lines),
            }
        )
    return file_records(extra=extra)


class DependencyHealthTests(unittest.TestCase):
    def dependency_evidence(self, **overrides):
        value = evidence()
        value.update(overrides)
        return value

    def test_every_pull_request_gets_a_dependency_health_result(self):
        result = category(report.build_report(evidence()), "dependency-health")
        self.assertEqual(result["status"], "PASSED")
        details = json.dumps(result["details"])
        self.assertIn("does not depend on a Dependabot update", details)
        self.assertIn("does not duplicate the DevSkim", details)

    def test_unrelated_open_advisories_do_not_fail_a_clean_pull_request(self):
        result = category(
            report.build_report(
                evidence(dependabot_alerts=[advisory("left-pad", "critical")])
            ),
            "dependency-health",
        )
        self.assertEqual(result["status"], "PASSED")
        self.assertTrue(any("not attributed" in detail for detail in result["details"]))

    def test_changed_dependency_with_a_high_advisory_fails(self):
        files = dependency_files(
            package_lines=['"lodash": "^4.17.20",'],
            lock_lines=["  lodash@4.17.20:"],
        )
        result = category(
            report.build_report(
                evidence(
                    files=files,
                    dependabot_alerts=[advisory("lodash", "critical")],
                )
            ),
            "dependency-health",
        )
        self.assertEqual(result["status"], "FAILED")
        self.assertTrue(any("lodash" in detail for detail in result["details"]))

    def test_changed_dependency_with_a_moderate_advisory_warns(self):
        files = dependency_files(
            package_lines=['"lodash": "^4.17.20",'],
            lock_lines=["  lodash@4.17.20:"],
        )
        result = category(
            report.build_report(
                evidence(files=files, dependabot_alerts=[advisory("lodash", "medium")])
            ),
            "dependency-health",
        )
        self.assertEqual(result["status"], "WARNING")

    def test_dependency_update_without_an_advisory_passes(self):
        files = dependency_files(
            package_lines=['"lodash": "^4.17.21",'],
            lock_lines=["  lodash@4.17.21:"],
        )
        result = category(
            report.build_report(evidence(files=files, dependabot_alerts=[])),
            "dependency-health",
        )
        self.assertEqual(result["status"], "PASSED")

    def test_dependency_update_to_the_patched_version_passes(self):
        files = dependency_files(
            package_lines=['"lodash": "^4.17.21",'],
            lock_lines=["  lodash@4.17.21:"],
        )
        result = category(
            report.build_report(
                evidence(
                    files=files,
                    dependabot_alerts=[advisory("lodash", "critical", patched="4.17.21")],
                )
            ),
            "dependency-health",
        )
        self.assertEqual(result["status"], "PASSED")
        self.assertTrue(any("treated as addressed" in detail for detail in result["details"]))

    def test_dependency_update_below_the_patched_version_fails(self):
        files = dependency_files(
            package_lines=['"lodash": "^4.17.20",'],
            lock_lines=["  lodash@4.17.20:"],
        )
        result = category(
            report.build_report(
                evidence(
                    files=files,
                    dependabot_alerts=[advisory("lodash", "critical", patched="4.17.21")],
                )
            ),
            "dependency-health",
        )
        self.assertEqual(result["status"], "FAILED")

    def test_dependabot_update_of_a_flagged_dependency_warns_not_fails(self):
        pr = evidence()["pull_request"]
        pr["user"] = {"login": "dependabot[bot]"}
        files = dependency_files(
            package_lines=['"lodash": "^4.17.20",'],
            lock_lines=["  lodash@4.17.20:"],
        )
        result = category(
            report.build_report(
                evidence(
                    pull_request=pr,
                    files=files,
                    dependabot_alerts=[advisory("lodash", "high", patched="4.17.21")],
                )
            ),
            "dependency-health",
        )
        self.assertEqual(result["status"], "WARNING")

    def test_manifest_without_its_lockfile_warns(self):
        files = dependency_files(package_lines=['"lodash": "^4.17.21",'])
        result = category(
            report.build_report(evidence(files=files, dependabot_alerts=[])),
            "dependency-health",
        )
        self.assertEqual(result["status"], "WARNING")
        self.assertTrue(any("lockfile" in item for item in result["attention"]))

    def test_unreadable_advisory_source_is_not_run(self):
        result = category(
            report.build_report(
                evidence(dependabot_alerts={"message": "the API returned 403"})
            ),
            "dependency-health",
        )
        self.assertEqual(result["status"], "NOT RUN")
        self.assertTrue(any("403" in detail for detail in result["details"]))

    def test_dependabot_pull_request_is_assessed_without_requiring_an_update(self):
        pr = evidence()["pull_request"]
        pr["user"] = {"login": "dependabot[bot]"}
        files = dependency_files(
            package_lines=['"lodash": "^4.17.21",'],
            lock_lines=["  lodash@4.17.21:"],
        )
        result = category(
            report.build_report(
                evidence(pull_request=pr, files=files, dependabot_alerts=[])
            ),
            "dependency-health",
        )
        self.assertEqual(result["status"], "PASSED")
        self.assertTrue(
            any("applicable weekly Dependabot update" in detail for detail in result["details"])
        )

    def test_changed_dependabot_configuration_is_surfaced(self):
        files = file_records(
            extra=[
                {
                    "filename": ".github/dependabot.yml",
                    "status": "modified",
                    "patch": "@@ -1 +1 @@\n-a\n+b",
                }
            ]
        )
        result = category(report.build_report(evidence(files=files)), "dependency-health")
        self.assertEqual(result["status"], "WARNING")
        self.assertTrue(any("weekly" in item for item in result["attention"]))


class ScopeExpansionTests(unittest.TestCase):
    def expansion_value(self):
        return declaration(
            paths=["app/new-component.tsx"] + list(SPEC_PATHS),
            file_purposes=[
                {"path": "app/new-component.tsx", "purpose": "Add the component the task now requires."}
            ]
            + [
                {"path": path, "purpose": "Record the task artifacts for the verification change."}
                for path in SPEC_PATHS
            ],
            scope_expansion=[
                {
                    "path": "app/new-component.tsx",
                    "reason": "The shared component became part of the authorized task.",
                }
            ],
        )

    def test_scope_expansion_requires_the_exact_words_and_an_explanation(self):
        pr = evidence()["pull_request"]
        pr["body"] = body(self.expansion_value())
        files = file_records(paths=["app/new-component.tsx"] + SPEC_PATHS)
        result = category(report.build_report(evidence(pull_request=pr, files=files)), "pr-scope")
        self.assertEqual(result["status"], "FAILED")
        self.assertTrue(any(report.SCOPE_CHANGE_PHRASE in item for item in result["attention"]))

    def test_scope_change_wording_alone_does_not_bypass_owner_approval(self):
        pr = evidence()["pull_request"]
        pr["body"] = body(
            self.expansion_value(),
            preamble="Scope changed: the shared component was added to the authorized task.",
        )
        files = file_records(paths=["app/new-component.tsx"] + SPEC_PATHS)
        result = category(report.build_report(evidence(pull_request=pr, files=files)), "pr-scope")
        self.assertEqual(result["status"], "FAILED")
        self.assertTrue(any("/approve-scope" in item for item in result["attention"]))

    def test_exact_owner_digest_approval_passes_when_the_wording_is_present(self):
        value = self.expansion_value()
        preamble = "Scope changed: the shared component was added to the authorized task."
        pr = evidence()["pull_request"]
        pr["body"] = body(value, preamble=preamble)
        files = file_records(paths=["app/new-component.tsx"] + SPEC_PATHS)

        # Compute the digest exactly as the scope checker does.
        purposes = {item["path"]: item["purpose"] for item in value["file_purposes"]}
        digest = scope._digest(
            {
                "head_sha": HEAD,
                "entries": {"app/new-component.tsx": value["scope_expansion"][0]["reason"]},
                "scope": {
                    "complete_pr_body": pr["body"],
                    "summary": value["summary"],
                    "features": value["features"],
                    "paths": value["paths"],
                    "file_purposes": purposes,
                    "shared_dependencies": value["shared_dependencies"],
                },
            }
        )
        comments = [
            {"body": "/approve-scope " + digest, "user": {"login": OWNER}}
        ]
        result = category(
            report.build_report(
                evidence(pull_request=pr, files=files, comments=comments)
            ),
            "pr-scope",
        )
        self.assertEqual(result["status"], "PASSED")
        self.assertTrue(
            any("Scope changed" in detail for detail in result["details"])
        )


class ProtectedFileTests(unittest.TestCase):
    def test_declaration_hidden_in_an_html_comment_does_not_count(self):
        pr = evidence()["pull_request"]
        pr["body"] = pr["body"] + "\n<!-- " + report.PROTECTED_DECLARATION + " -->\n"
        files = file_records(
            extra=[
                {
                    "filename": "package.json",
                    "status": "modified",
                    "patch": "@@ -1 +1 @@\n-a\n+b",
                }
            ]
        )
        result = category(
            report.build_report(
                evidence(pull_request=pr, files=files, check_runs=all_supporting())
            ),
            "protected-files",
        )
        self.assertEqual(result["status"], "FAILED")

    def protected_evidence(self, has_declaration, gate=None):
        pr = evidence()["pull_request"]
        if has_declaration:
            pr["body"] = pr["body"] + "\n" + report.PROTECTED_DECLARATION + "\n"
        files = file_records(
            extra=[
                {
                    "filename": "package.json",
                    "status": "modified",
                    "patch": "@@ -1 +1 @@\n-a\n+b",
                }
            ]
        )
        runs = all_supporting() + [check(report.DEVSKIM_CHECK, "success")]
        if gate:
            runs.append(check(report.PROTECTED_AUTHORIZATION_CHECK, gate))
        return evidence(pull_request=pr, files=files, check_runs=runs)

    def test_no_protected_files_passes(self):
        result = category(report.build_report(evidence()), "protected-files")
        self.assertEqual(result["status"], "PASSED")

    def test_protected_change_without_declaration_fails(self):
        result = category(report.build_report(self.protected_evidence(False)), "protected-files")
        self.assertEqual(result["status"], "FAILED")
        self.assertTrue(
            any(report.PROTECTED_DECLARATION in item for item in result["attention"])
        )

    def test_declaration_does_not_replace_the_human_gate(self):
        result = category(report.build_report(self.protected_evidence(True)), "protected-files")
        self.assertEqual(result["status"], "WARNING")
        self.assertTrue(
            any("human authorization gate" in item for item in result["attention"])
        )

    def test_recorded_human_gate_passes(self):
        result = category(
            report.build_report(self.protected_evidence(True, gate="success")), "protected-files"
        )
        self.assertEqual(result["status"], "PASSED")

    def test_failed_human_gate_fails(self):
        result = category(
            report.build_report(self.protected_evidence(True, gate="failure")), "protected-files"
        )
        self.assertEqual(result["status"], "FAILED")

    def test_protected_list_matches_the_workflow(self):
        workflow = os.path.join(
            os.path.dirname(__file__), "..", "workflows", "protected-files.yml"
        )
        with open(workflow, encoding="utf-8") as handle:
            text = handle.read()
        quoted = set(re.findall(r"'([^']+)'", text))
        candidates = {path for path in quoted if path in report.PROTECTED_FILES}
        self.assertEqual(candidates, set(report.PROTECTED_FILES))


class PlaceholderHeuristicTests(unittest.TestCase):
    def test_a_filled_value_may_mention_placeholder(self):
        value = (
            "Read `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, "
            "`memory-bank/techContext.md` and `memory-bank/progress.md`. The "
            "marker-first placeholder fallback is documented for later review."
        )
        self.assertFalse(report._placeholder(value))

    def test_real_placeholder_markers_are_still_rejected(self):
        for value in (
            "placeholder",
            "**Placeholder**",
            "`placeholder`",
            "PLACEHOLDER",
            "placeholder text",
            "Placeholder value",
            "placeholder goes here",
            PLACEHOLDER_TODO,
            "TBD",
            "fill this in",
            "name each task group",
            "describe the change",
            "replace with the real text",
            "list the completed tasks",
            "select the applicable groups",
            "<memory bank>",
            "",
            "   ",
        ):
            with self.subTest(value=value):
                self.assertTrue(report._placeholder(value))


class GovernanceTests(unittest.TestCase):
    def test_complete_reporting_passes(self):
        result = category(report.build_report(evidence()), "governance")
        self.assertEqual(result["status"], "PASSED")

    def test_missing_spec_kit_reporting_fails(self):
        pr = evidence()["pull_request"]
        pr["body"] = body(governance=False)
        result = category(report.build_report(evidence(pull_request=pr)), "governance")
        self.assertEqual(result["status"], "FAILED")
        self.assertTrue(
            any("Spec Kit" in item for item in result["attention"])
        )

    def test_incomplete_stage_list_fails(self):
        pr = evidence()["pull_request"]
        pr["body"] = body().replace(
            "**Spec Kit stages completed:** specify, plan, tasks, implement",
            "**Spec Kit stages completed:** specify",
        )
        result = category(report.build_report(evidence(pull_request=pr)), "governance")
        self.assertEqual(result["status"], "FAILED")

    def test_declared_artifact_missing_from_the_diff_is_a_warning(self):
        pr = evidence()["pull_request"]
        pr["body"] = body().replace(
            "**Spec Kit artifact paths:** `specs/198-fixture/spec.md`, `specs/198-fixture/plan.md`, `specs/198-fixture/tasks.md`",
            "**Spec Kit artifact paths:** `specs/198-fixture/spec.md`, `specs/198-fixture/plan.md`, `specs/198-fixture/tasks.md`, `specs/198-fixture/evidence.md`",
        )
        files = [
            record
            for record in file_records()
            if record["filename"] != "specs/198-fixture/plan.md"
        ]
        result = category(
            report.build_report(evidence(pull_request=pr, files=files)), "governance"
        )
        self.assertNotEqual(result["status"], "PASSED")
        self.assertEqual(result["status"], "WARNING")

    def test_library_and_memory_bank_are_required(self):
        for label in ("Library documents consulted", "Memory Bank"):
            with self.subTest(label=label):
                pr = evidence()["pull_request"]
                pr["body"] = re.sub(
                    r"(?im)^.*%s.*$" % re.escape(label), "", pr["body"]
                )
                result = category(report.build_report(evidence(pull_request=pr)), "governance")
                self.assertEqual(result["status"], "FAILED")

    def test_memory_bank_mentioning_placeholder_passes(self):
        pr = evidence()["pull_request"]
        pr["body"] = body().replace(
            "**Memory Bank:** `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `memory-bank/techContext.md` and `memory-bank/progress.md` were read.",
            "**Memory Bank:** `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `memory-bank/techContext.md` and `memory-bank/progress.md` were read. The marker-first placeholder fallback is documented.",
        )
        result = category(report.build_report(evidence(pull_request=pr)), "governance")
        self.assertEqual(result["status"], "PASSED")

    def test_real_placeholder_markers_still_fail_governance(self):
        line = "**Memory Bank:** `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `memory-bank/techContext.md` and `memory-bank/progress.md` were read."
        for marker in ("placeholder", PLACEHOLDER_TODO, "<memory bank>"):
            with self.subTest(marker=marker):
                pr = evidence()["pull_request"]
                pr["body"] = body().replace(line, "**Memory Bank:** " + marker)
                result = category(report.build_report(evidence(pull_request=pr)), "governance")
                self.assertEqual(result["status"], "FAILED")
                self.assertTrue(any("Memory Bank" in item for item in result["attention"]))

    def test_governance_never_claims_independent_verification(self):
        result = category(report.build_report(evidence()), "governance")
        self.assertTrue(
            any("submitter-reported" in detail for detail in result["details"])
        )
        self.assertNotIn("independently verified", " ".join(result["details"]))


class ScopeCheckerContractTests(unittest.TestCase):
    def test_visual_change_needs_no_submitter_browser_evidence(self):
        value = declaration(
            paths=["components/Hero.tsx"],
            file_purposes=[
                {"path": "components/Hero.tsx", "purpose": "Update the hero artwork and layout."}
            ],
        )
        result = scope.validate(
            {
                "number": 42,
                "body": body(value),
                "head": {"sha": HEAD},
                "changed_files": 1,
            },
            [{"filename": "components/Hero.tsx", "status": "modified"}],
            [],
            OWNER,
        )
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["browser_evidence"], [])

    def test_scope_changed_wording_is_required_for_expansion(self):
        value = declaration(
            paths=["app/new-component.tsx"],
            file_purposes=[
                {"path": "app/new-component.tsx", "purpose": "Add the component the task now requires."}
            ],
            scope_expansion=[
                {"path": "app/new-component.tsx", "reason": "The component became part of the task."}
            ],
        )
        result = scope.validate(
            {
                "number": 42,
                "body": body(value),
                "head": {"sha": HEAD},
                "changed_files": 1,
            },
            [{"filename": "app/new-component.tsx", "status": "modified"}],
            [],
            OWNER,
        )
        self.assertEqual(result["status"], "FAIL")
        self.assertTrue(any("Scope changed" in error for error in result["errors"]))
        self.assertEqual(result["scope_change_statement"], "")

    def test_scope_change_explanation_is_captured_for_the_report(self):
        value = declaration(
            paths=["app/new-component.tsx"],
            file_purposes=[
                {"path": "app/new-component.tsx", "purpose": "Add the component the task now requires."}
            ],
            scope_expansion=[
                {"path": "app/new-component.tsx", "reason": "The component became part of the task."}
            ],
        )
        pr = {
            "number": 42,
            "body": body(value, preamble="Scope changed: the shared component was added."),
            "head": {"sha": HEAD},
            "changed_files": 1,
        }
        result = scope.validate(
            pr,
            [{"filename": "app/new-component.tsx", "status": "modified"}],
            [],
            OWNER,
        )
        self.assertEqual(result["scope_change_statement"], "the shared component was added.")
        self.assertTrue(any("/approve-scope" in error for error in result["errors"]))


class DocumentationContractTests(unittest.TestCase):
    ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    def read(self, relative):
        with open(os.path.join(self.ROOT, relative), encoding="utf-8") as handle:
            return handle.read()

    def test_submission_guide_and_template_agree(self):
        documents = {
            "PR_SUBMISSION.md": self.read("PR_SUBMISSION.md"),
            ".github/pull_request_template.md": self.read(
                ".github/pull_request_template.md"
            ),
        }
        markers = ("<!-- qa-scope:start -->", "<!-- qa-scope:end -->")
        fields = (
            "version",
            "summary",
            "features",
            "paths",
            "file_purposes",
            "shared_dependencies",
            "visual_baseline_updates",
            "scope_expansion",
            "governance_changes",
            "visual_impact",
            "browser_evidence",
        )
        for name, text in documents.items():
            with self.subTest(document=name):
                self.assertIn(report.QA_DECLARATION, text)
                self.assertIn(report.PROTECTED_DECLARATION, text)
                self.assertIn(report.SCOPE_CHANGE_PHRASE, text)
                self.assertIn("495 MiB", text)
                self.assertIn("/approve-scope", text)
                self.assertIn("/approve-visual-baselines", text)
                self.assertIn("/approve-governance", text)
                for marker in markers:
                    self.assertIn(marker, text)
                for field in fields:
                    self.assertIn(field, text)
                for _key, category_name in report.CATEGORIES:
                    self.assertIn(category_name, text)
                for status in report.STATUSES:
                    self.assertIn(status, text)

    def test_neither_document_requires_manual_browser_evidence(self):
        submission = self.read("PR_SUBMISSION.md")
        template = self.read(".github/pull_request_template.md")
        self.assertIn("never required from the submitter", submission)
        self.assertIn("not required to run Playwright", template)
        for text in (submission, template):
            self.assertNotIn("must supply browser evidence", text)
            self.assertNotIn("required to take screenshots", text)

    def test_submission_guide_describes_the_reporting_responsibility_split(self):
        submission = self.read("PR_SUBMISSION.md")
        self.assertIn("PR description is the submitter", submission)
        self.assertIn("publishes the checker results for the current head", submission)
        self.assertIn("Statuses are exactly **PASSED**, **FAILED**, **WARNING** and **NOT RUN**", submission)


def performance_snapshot(**overrides):
    value = {
        "version": 2,
        "status": "healthy",
        "evidence": "measured",
        "fps": 58.4,
        "targetFps": 60,
        "sampleCount": 91,
        "windowMs": 1500,
        "source": "adaptive-frame-loop",
        "warnings": [],
        "thresholds": {
            "targetFps": 60,
            "healthyFps": 50,
            "strainedFps": 28,
            "healthyP95Ms": 28,
            "criticalP95Ms": 70,
            "longFrameMs": 50,
        },
        "plan": {"tier": "high", "frameRate": 60},
    }
    value.update(overrides)
    return value


def performance_thresholds(target, healthy, strained, p95, critical, long_frame):
    return {
        "targetFps": target,
        "healthyFps": healthy,
        "strainedFps": strained,
        "healthyP95Ms": p95,
        "criticalP95Ms": critical,
        "longFrameMs": long_frame,
    }


class PerformanceHealthTests(unittest.TestCase):
    def test_the_snapshot_is_informational_and_never_adds_a_category(self):
        baseline = report.build_report(evidence())
        result = report.build_report(evidence(performance=performance_snapshot()))

        self.assertEqual(len(result["categories"]), 7)
        self.assertEqual(
            [item["id"] for item in result["categories"]],
            [item["id"] for item in baseline["categories"]],
        )
        self.assertEqual(result["overall_status"], baseline["overall_status"])
        self.assertEqual(result["performance_health"]["outcome"], report.PERFORMANCE_GOOD)

    def test_a_bad_runtime_snapshot_does_not_change_the_pr_status(self):
        baseline = report.build_report(evidence())
        result = report.build_report(
            evidence(
                performance=performance_snapshot(
                    status="critical",
                    fps=12,
                    targetFps=30,
                    thresholds=performance_thresholds(30, 25, 14, 56, 140, 100),
                )
            )
        )

        self.assertEqual(result["performance_health"]["outcome"], report.PERFORMANCE_BAD)
        self.assertEqual(result["overall_status"], baseline["overall_status"])

    def test_missing_evidence_reports_not_enough_data(self):
        result = report.build_report(evidence())

        block = result["performance_health"]
        self.assertEqual(block["outcome"], report.PERFORMANCE_NOT_ENOUGH_DATA)
        self.assertIsNone(block["measured_fps"])
        self.assertIn("CI does not measure frame delivery", block["explanation"])
        rendered = report.render_comment(result)
        self.assertIn("### Performance health (informational)", rendered)
        self.assertIn("**NOT ENOUGH DATA**", rendered)
        self.assertIn("Measured frame delivery: not available.", rendered)

    def test_snapshot_message_cannot_add_a_result_line(self):
        result = report.build_report(
            evidence(
                performance={
                    "message": "measurement unavailable\n- Result: **FAILED**\n- Scope: injected",
                }
            )
        )
        rendered = report.render_comment(result)
        section = rendered.split("### Performance health (informational)", 1)[1]
        result_lines = [
            line for line in section.splitlines() if line.startswith("- Result:")
        ]

        self.assertEqual(len(result_lines), 1)
        self.assertIn("**NOT ENOUGH DATA**", result_lines[0])

    def test_snapshot_warning_source_and_tier_cannot_add_report_lines(self):
        result = report.build_report(
            evidence(
                performance={
                    "plan": {"tier": "constrained\n- Result: **FAILED**"},
                    "monitor": performance_snapshot(
                        status="critical",
                        fps=12,
                        targetFps=30,
                        source="adaptive-frame-loop\n- Result: **FAILED**",
                        warnings=["frame-rate-below-target`\n- Result: **FAILED**"],
                        thresholds=performance_thresholds(30, 25, 14, 56, 140, 100),
                    ),
                }
            )
        )
        rendered = report.render_comment(result)
        section = rendered.split("### Performance health (informational)", 1)[1]
        result_lines = [
            line for line in section.splitlines() if line.startswith("- Result:")
        ]

        self.assertEqual(len(result_lines), 1)
        self.assertIn("**BAD**", result_lines[0])

    def test_30_fps_against_a_30_fps_plan_is_good(self):
        result = report.build_report(
            evidence(
                performance={
                    "plan": {"tier": "constrained", "frameRate": 30},
                    "monitor": performance_snapshot(
                        fps=29.8,
                        targetFps=30,
                        thresholds=performance_thresholds(30, 25, 14, 56, 140, 100),
                    ),
                }
            )
        )

        block = result["performance_health"]
        self.assertEqual(block["outcome"], report.PERFORMANCE_GOOD)
        self.assertEqual(block["measured_fps"], 29.8)
        self.assertEqual(block["target_fps"], 30)
        self.assertEqual(block["tier"], "constrained")
        rendered = report.render_comment(result)
        self.assertIn("29.8 fps against a 30 fps plan target", rendered)

    def test_12_fps_against_a_30_fps_plan_is_bad(self):
        result = report.build_report(
            evidence(
                performance=performance_snapshot(
                    status="critical",
                    fps=12,
                    targetFps=30,
                    warnings=["frame-rate-below-target"],
                    thresholds=performance_thresholds(30, 25, 14, 56, 140, 100),
                )
            )
        )

        block = result["performance_health"]
        self.assertEqual(block["outcome"], report.PERFORMANCE_BAD)
        self.assertIn("below the 14 fps critical floor", block["explanation"])
        rendered = report.render_comment(result)
        self.assertIn("**BAD**", rendered)
        self.assertIn("`frame-rate-below-target`", rendered)

    def test_20_fps_against_a_30_fps_plan_needs_attention(self):
        result = report.build_report(
            evidence(
                performance=performance_snapshot(
                    status="strained",
                    fps=20,
                    targetFps=30,
                    thresholds=performance_thresholds(30, 25, 14, 56, 140, 100),
                )
            )
        )

        self.assertEqual(
            result["performance_health"]["outcome"], report.PERFORMANCE_NEEDS_ATTENTION
        )
        self.assertIn(
            "below the 25 fps healthy floor", result["performance_health"]["explanation"]
        )

    def test_a_strained_frame_time_verdict_does_not_claim_an_fps_floor(self):
        result = report.build_report(
            evidence(
                performance=performance_snapshot(
                    status="strained",
                    fps=40,
                    targetFps=30,
                    warnings=["frame-time-p95-high"],
                    thresholds=performance_thresholds(30, 25, 14, 56, 140, 100),
                )
            )
        )

        block = result["performance_health"]
        self.assertEqual(block["outcome"], report.PERFORMANCE_NEEDS_ATTENTION)
        self.assertNotIn("below the", block["explanation"])
        self.assertIn("frame-time", block["explanation"])
        self.assertIn("30 fps plan", block["explanation"])

    def test_a_critical_frame_time_verdict_does_not_claim_an_fps_floor(self):
        result = report.build_report(
            evidence(
                performance=performance_snapshot(
                    status="critical",
                    fps=40,
                    targetFps=30,
                    warnings=["frame-time-p95-high", "long-frame-ratio-high"],
                    thresholds=performance_thresholds(30, 25, 14, 56, 140, 100),
                )
            )
        )

        block = result["performance_health"]
        self.assertEqual(block["outcome"], report.PERFORMANCE_BAD)
        self.assertNotIn("below the", block["explanation"])
        self.assertIn("critically exceeded", block["explanation"])

    def test_a_malformed_snapshot_field_never_breaks_the_report(self):
        cases = (
            {"warnings": 7},
            {"warnings": True},
            {"warnings": {"first": "frame-rate-below-target"}},
            {"fps": 10**400},
            {"sampleCount": 10**400},
            {"windowMs": -(10**400)},
            {"thresholds": {"healthyFps": 10**400, "strainedFps": -(10**400)}},
        )
        for overrides in cases:
            with self.subTest(overrides=overrides):
                result = report.build_report(
                    evidence(performance=performance_snapshot(**overrides))
                )
                self.assertEqual(len(result["categories"]), 7)
                self.assertIn(
                    result["performance_health"]["outcome"],
                    report.PERFORMANCE_OUTCOMES,
                )
                report.render_comment(result)

    def test_the_not_enough_helper_cannot_report_a_measured_outcome(self):
        block = report._performance_not_enough(
            "no data",
            outcome=report.PERFORMANCE_GOOD,
            warnings=["frame-rate-below-target"],
        )

        self.assertEqual(block["outcome"], report.PERFORMANCE_NOT_ENOUGH_DATA)
        self.assertEqual(block["explanation"], "no data")
        self.assertEqual(block["warnings"], ["frame-rate-below-target"])

    def test_paused_idle_and_unmeasured_snapshots_are_not_judged(self):
        cases = (
            ("paused", "paused"),
            ("idle", "stale"),
            ("warming", "insufficient"),
        )
        for status, evidence_state in cases:
            with self.subTest(status=status):
                result = report.build_report(
                    evidence(
                        performance=performance_snapshot(
                            status=status,
                            evidence=evidence_state,
                            fps=None,
                        )
                    )
                )
                self.assertEqual(
                    result["performance_health"]["outcome"],
                    report.PERFORMANCE_NOT_ENOUGH_DATA,
                )

    def test_malformed_or_inconsistent_evidence_is_not_judged(self):
        payloads = (
            "not-an-object",
            42,
            {},
            {"monitor": "not-an-object"},
            {"status": "healthy", "evidence": "measured", "fps": "fast"},
            {
                "status": "healthy",
                "evidence": "measured",
                "fps": 10,
                "targetFps": 30,
                "thresholds": performance_thresholds(30, 25, 14, 56, 140, 100),
            },
            {"status": "healthy", "evidence": "insufficient", "fps": 60, "targetFps": 60},
        )
        for payload in payloads:
            with self.subTest(payload=payload):
                result = report.build_report(evidence(performance=payload))
                self.assertEqual(
                    result["performance_health"]["outcome"],
                    report.PERFORMANCE_NOT_ENOUGH_DATA,
                )

    def test_a_snapshot_from_another_commit_is_not_used(self):
        result = report.build_report(
            evidence(performance=performance_snapshot(headSha=EARLIER))
        )

        block = result["performance_health"]
        self.assertEqual(block["outcome"], report.PERFORMANCE_NOT_ENOUGH_DATA)
        self.assertIn("not at the current report head", block["explanation"])

    def test_a_snapshot_pinned_to_the_current_head_is_accepted(self):
        result = report.build_report(
            evidence(performance=performance_snapshot(headSha=HEAD))
        )

        self.assertEqual(result["performance_health"]["outcome"], report.PERFORMANCE_GOOD)
        self.assertTrue(result["performance_health"]["commit_pinned"])

    def test_the_workbench_diagnostics_payload_is_accepted(self):
        result = report.build_report(
            evidence(
                performance={
                    "plan": {"tier": "high", "frameRate": 60},
                    "monitor": performance_snapshot(),
                    "device": {"capabilityTier": "high", "confidence": "high"},
                }
            )
        )

        self.assertEqual(result["performance_health"]["outcome"], report.PERFORMANCE_GOOD)

    def test_cli_accepts_an_optional_performance_snapshot(self):
        with tempfile.TemporaryDirectory() as folder:
            pr = os.path.join(folder, "pr.json")
            files = os.path.join(folder, "files.json")
            performance = os.path.join(folder, "performance.json")
            comment = os.path.join(folder, "comment.md")
            with open(pr, "w", encoding="utf-8") as handle:
                json.dump(evidence()["pull_request"], handle)
            with open(files, "w", encoding="utf-8") as handle:
                json.dump(evidence()["files"], handle)
            with open(performance, "w", encoding="utf-8") as handle:
                json.dump(performance_snapshot(), handle)

            status = report.main(
                [
                    "--pull-request",
                    pr,
                    "--files",
                    files,
                    "--owner",
                    OWNER,
                    "--performance",
                    performance,
                    "--comment",
                    comment,
                ]
            )
            self.assertEqual(status, 0)
            with open(comment, encoding="utf-8") as handle:
                rendered = handle.read()

        self.assertIn("**GOOD**", rendered)
        self.assertIn("58.4 fps against a 60 fps plan target", rendered)
        self.assertIn("Commit binding: not supplied", rendered)

    def test_cli_degrades_a_malformed_snapshot_instead_of_crashing(self):
        with tempfile.TemporaryDirectory() as folder:
            pr = os.path.join(folder, "pr.json")
            files = os.path.join(folder, "files.json")
            performance = os.path.join(folder, "performance.json")
            comment = os.path.join(folder, "comment.md")
            with open(pr, "w", encoding="utf-8") as handle:
                json.dump(evidence()["pull_request"], handle)
            with open(files, "w", encoding="utf-8") as handle:
                json.dump(evidence()["files"], handle)
            with open(performance, "w", encoding="utf-8") as handle:
                json.dump(performance_snapshot(fps=10**400, warnings=7), handle)

            status = report.main(
                [
                    "--pull-request",
                    pr,
                    "--files",
                    files,
                    "--owner",
                    OWNER,
                    "--performance",
                    performance,
                    "--comment",
                    comment,
                ]
            )
            self.assertEqual(status, 0)
            with open(comment, encoding="utf-8") as handle:
                rendered = handle.read()

        self.assertIn("**NOT ENOUGH DATA**", rendered)


class WorkflowContractTests(unittest.TestCase):
    def test_report_refreshes_after_owner_approval_comments(self):
        path = os.path.join(
            os.path.dirname(__file__), "..", "workflows", "pr-verification-report.yml"
        )
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
        self.assertIn("issue_comment:", text)
        self.assertIn("github.event.issue.number", text)
        self.assertIn(
            "github.event.comment.user.login == github.repository_owner", text
        )
        self.assertIn("startsWith(github.event.comment.body, '/approve-')", text)

    def test_check_runs_alerts_and_dependency_advisories_are_paginated(self):
        path = os.path.join(
            os.path.dirname(__file__), "..", "workflows", "pr-verification-report.yml"
        )
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
        self.assertIn("check-runs?per_page=100&filter=all", text)
        self.assertIn("[.[].check_runs[]]", text)
        self.assertIn("code-scanning/alerts?pr=", text)
        self.assertIn("| jq 'add // []' > \"$RUNNER_TEMP/alerts.json\"", text)
        self.assertIn("dependabot/alerts?state=open&per_page=100", text)
        self.assertIn("dependency-alerts.json", text)

    def test_a_failed_category_is_published_instead_of_a_placeholder(self):
        path = os.path.join(
            os.path.dirname(__file__), "..", "workflows", "pr-verification-report.yml"
        )
        with open(path, encoding="utf-8") as handle:
            text = handle.read()

        # Exit 1 means a category FAILED and the renderer already wrote the real
        # report; only a render error (any other status) or an empty body may
        # replace it with the NOT RUN placeholder.
        self.assertIn('( "$status" -ne 0 && "$status" -ne 1 )', text)
        self.assertNotIn('if [[ "$status" -ne 0 ||', text)

    def test_render_failure_publishes_a_not_run_placeholder(self):
        path = os.path.join(
            os.path.dirname(__file__), "..", "workflows", "pr-verification-report.yml"
        )
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
        self.assertIn("could not be built from the supplied evidence", text)
        self.assertIn("NOT RUN placeholder", text)
        self.assertIn("RENDER_STATUS", text)
        self.assertIn('"$RENDER_STATUS" == "2"', text)
        self.assertIn('"$RENDER_STATUS" == "1"', text)

    def test_report_waits_for_the_current_head_before_reading_evidence(self):
        path = os.path.join(
            os.path.dirname(__file__), "..", "workflows", "pr-verification-report.yml"
        )
        with open(path, encoding="utf-8") as handle:
            text = handle.read()

        # The bounded wait uses the audit's existing --wait-seconds capability
        # instead of a second polling loop.
        self.assertIn("--wait-seconds 600", text)
        self.assertIn("--poll-interval 15", text)
        self.assertIn("Wait for current-head checks to settle", text)
        self.assertLess(
            text.index("Wait for current-head checks to settle"),
            text.index("Fetch pull request, diff, comments and current-head checks"),
        )
        # Waiting is not a gate: the audit, renderer and status gate still decide.
        self.assertIn("wait_status", text)
        self.assertNotIn("--wait-seconds 0", text)

        # The wait stays inside the job's own time bound.
        wait_seconds = int(re.search(r"--wait-seconds (\d+)", text).group(1))
        timeout_minutes = int(re.search(r"timeout-minutes: (\d+)", text).group(1))
        self.assertLess(wait_seconds, timeout_minutes * 60)

    def test_report_workflow_is_triggered_by_pr_events_and_checker_completion(self):
        path = os.path.join(
            os.path.dirname(__file__), "..", "workflows", "pr-verification-report.yml"
        )
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
        self.assertIn("pull_request_target:", text)
        self.assertIn("workflow_run:", text)
        for workflow in (
            "Visual QA",
            "DevSkim",
            "Validate OpenNext Repair",
            "PR Scope Verification",
            "Protected File Changes",
            "Verification Integrity",
        ):
            self.assertIn(workflow, text)
        self.assertIn("<!-- qa-verification-report -->", text)
        self.assertNotIn("pull_request.head.sha", text)
        self.assertIn("ref: main", text)

    def test_cli_renders_the_report_and_json(self):
        with tempfile.TemporaryDirectory() as folder:
            paths = {}
            for name, value in (
                ("pr.json", evidence()["pull_request"]),
                ("files.json", evidence()["files"]),
                ("comments.json", []),
                ("checks.json", {"check_runs": evidence()["check_runs"]}),
                ("verification.json", verification()),
                ("alerts.json", []),
                ("dependency-alerts.json", []),
            ):
                paths[name] = os.path.join(folder, name)
                with open(paths[name], "w", encoding="utf-8") as handle:
                    json.dump(value, handle)
            comment = os.path.join(folder, "comment.md")
            machine = os.path.join(folder, "report.json")
            status = report.main(
                [
                    "--pull-request",
                    paths["pr.json"],
                    "--files",
                    paths["files.json"],
                    "--comments",
                    paths["comments.json"],
                    "--checks",
                    paths["checks.json"],
                    "--verification",
                    paths["verification.json"],
                    "--alerts",
                    paths["alerts.json"],
                    "--dependency-alerts",
                    paths["dependency-alerts.json"],
                    "--owner",
                    OWNER,
                    "--comment",
                    comment,
                    "--json",
                    machine,
                ]
            )
            self.assertEqual(status, 0)
            with open(comment, encoding="utf-8") as handle:
                rendered = handle.read()
            with open(machine, encoding="utf-8") as handle:
                data = json.load(handle)
        self.assertTrue(rendered.startswith(report.REPORT_MARKER))
        self.assertEqual(len(data["categories"]), 7)

    def test_cli_fails_when_a_category_fails(self):
        with tempfile.TemporaryDirectory() as folder:
            pr = evidence()["pull_request"]
            pr["body"] = pr["body"].replace(report.QA_DECLARATION, "")
            source = os.path.join(folder, "pr.json")
            files = os.path.join(folder, "files.json")
            with open(source, "w", encoding="utf-8") as handle:
                json.dump(pr, handle)
            with open(files, "w", encoding="utf-8") as handle:
                json.dump(evidence()["files"], handle)
            comment = os.path.join(folder, "comment.md")
            status = report.main(
                [
                    "--pull-request",
                    source,
                    "--files",
                    files,
                    "--owner",
                    OWNER,
                    "--comment",
                    comment,
                ]
            )
            self.assertEqual(status, 1)
            # Exit 1 must still have produced the real report for publication:
            # the workflow publishes this body instead of a NOT RUN placeholder.
            with open(comment, encoding="utf-8") as handle:
                rendered = handle.read()
        self.assertTrue(rendered.startswith(report.REPORT_MARKER))
        self.assertIn("**FAILED**", rendered)


if __name__ == "__main__":
    unittest.main()
