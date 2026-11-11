#!/usr/bin/env python3
"""Regression tests for the current-head PR verification auditor.

These tests model the exact false-verification scenario: a head commit that
GitHub skipped because of ``[skip ci]``, while every check of an earlier commit
is green. The auditor must report NOT RUN and must never reuse the earlier
commit's checks.
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))

import verify_pr_verification_status as auditor  # noqa: E402

HEAD = "a" * 40
EARLIER = "b" * 40
REPO_ROOT = Path(__file__).resolve().parents[2]


def pull_request(sha=HEAD, login="davidcollier77-code", actor_type="User"):
    return {
        "number": 42,
        "head": {"sha": sha, "ref": "feature/skip-ci-guard"},
        "user": {"login": login, "type": actor_type},
    }


def commit(sha, message, login="davidcollier77-code", actor_type="User"):
    return {
        "sha": sha,
        "commit": {"message": message},
        "author": {"login": login, "type": actor_type},
    }


def check_run(
    name,
    sha=HEAD,
    status="completed",
    conclusion="success",
    run_id=1,
    completed_at="2026-11-07T12:00:00Z",
):
    return {
        "id": run_id,
        "name": name,
        "head_sha": sha,
        "status": status,
        "conclusion": conclusion,
        "started_at": "2026-11-07T11:55:00Z",
        "completed_at": completed_at,
    }


def green_checks(sha=HEAD):
    return [
        check_run(name, sha=sha, run_id=index)
        for index, name in enumerate(auditor.REQUIRED_CHECKS, start=1)
    ]


def statuses(report):
    return {
        record["name"]: record["status"]
        for record in report["required_checks"] + report["conditional_checks"]
    }


class SkipDirectiveTests(unittest.TestCase):
    def test_detects_every_documented_directive_case_insensitively(self):
        for directive in (
            "[skip ci]",
            "[ci skip]",
            "[no ci]",
            "[skip actions]",
            "[actions skip]",
        ):
            with self.subTest(directive=directive):
                self.assertEqual(
                    auditor.detect_skip_ci_directives("Fix typo %s" % directive.upper()),
                    [directive],
                )

    def test_detects_skip_checks_trailer(self):
        message = "fix: repair finding\n\nskip-checks: true\n"
        self.assertIn(
            "skip-checks: true", auditor.detect_skip_ci_directives(message)
        )

    def test_does_not_flag_unrelated_bracketed_text(self):
        for message in ("[skip city] tour notes", "skip-checks: false", "no ci here"):
            with self.subTest(message=message):
                self.assertEqual(auditor.detect_skip_ci_directives(message), [])


class CurrentHeadAuditTests(unittest.TestCase):
    def test_human_head_skip_cannot_borrow_earlier_green_checks(self):
        report = auditor.audit_verification(
            pull_request(),
            [
                commit(EARLIER, "feat: earlier commit"),
                commit(HEAD, "fix: unverified repair [skip ci]"),
            ],
            green_checks(sha=EARLIER),
        )

        self.assertEqual(report["overall_status"], "NOT VERIFIED")
        self.assertEqual(
            statuses(report),
            {
                **{name: "NOT RUN" for name in auditor.REQUIRED_CHECKS},
                **{name: "NOT RUN" for name in auditor.CONDITIONAL_CHECKS},
            },
        )
        self.assertIn("skip ci", " ".join(report["blocking_reasons"]))
        self.assertEqual(len(report["stale_check_runs"]), len(auditor.REQUIRED_CHECKS))

    def test_automated_head_skip_is_detected_and_not_run(self):
        report = auditor.audit_verification(
            pull_request(login="github-actions[bot]", actor_type="Bot"),
            [
                commit(
                    HEAD,
                    "chore: automated report\n\nskip-checks: true",
                    login="github-actions[bot]",
                    actor_type="Bot",
                )
            ],
            green_checks(sha=EARLIER),
        )

        self.assertEqual(report["overall_status"], "NOT VERIFIED")
        self.assertTrue(report["pr"]["author_is_bot"])
        self.assertTrue(report["skipped_commits"][0]["author_is_bot"])
        self.assertTrue(
            all(
                record["status"] == "NOT RUN"
                for record in report["required_checks"]
            )
        )

    def test_clean_head_with_all_required_green_is_verified(self):
        report = auditor.audit_verification(
            pull_request(),
            [
                commit(EARLIER, "feat: earlier commit [skip ci]"),
                commit(HEAD, "fix: current head"),
            ],
            green_checks(),
        )

        self.assertEqual(report["overall_status"], "VERIFIED")
        self.assertEqual(report["blocking_reasons"], [])
        self.assertEqual(len(report["skipped_commits"]), 1)

    def test_stale_green_check_is_not_run_even_without_a_skip_directive(self):
        report = auditor.audit_verification(
            pull_request(),
            [
                commit(EARLIER, "feat: earlier"),
                commit(HEAD, "fix: current head"),
            ],
            green_checks(sha=EARLIER),
        )

        self.assertEqual(report["overall_status"], "NOT VERIFIED")
        for record in report["required_checks"]:
            self.assertEqual(record["status"], "NOT RUN")
            self.assertIn("earlier commit", record["detail"])

    def test_missing_required_check_is_not_run(self):
        report = auditor.audit_verification(
            pull_request(),
            [commit(HEAD, "fix: current head")],
            [check_run(auditor.REQUIRED_CHECKS[0], run_id=1)],
        )

        self.assertEqual(
            statuses(report)[auditor.REQUIRED_CHECKS[1]], "NOT RUN"
        )
        self.assertEqual(report["overall_status"], "NOT VERIFIED")

    def test_failure_and_pending_are_never_passes(self):
        runs = [
            check_run(auditor.REQUIRED_CHECKS[0], conclusion="failure", run_id=1),
            check_run(
                auditor.REQUIRED_CHECKS[1],
                status="in_progress",
                conclusion=None,
                run_id=2,
            ),
        ]
        report = auditor.audit_verification(
            pull_request(), [commit(HEAD, "fix: current head")], runs
        )

        self.assertEqual(statuses(report)[auditor.REQUIRED_CHECKS[0]], "FAIL")
        self.assertEqual(statuses(report)[auditor.REQUIRED_CHECKS[1]], "PENDING")
        self.assertEqual(report["overall_status"], "NOT VERIFIED")

    def test_skipped_neutral_and_cancelled_conclusions_are_not_run(self):
        for conclusion in ("skipped", "neutral", "cancelled"):
            with self.subTest(conclusion=conclusion):
                runs = [
                    check_run(
                        auditor.REQUIRED_CHECKS[0], conclusion=conclusion, run_id=1
                    )
                ]
                report = auditor.audit_verification(
                    pull_request(), [commit(HEAD, "fix: current head")], runs
                )
                self.assertEqual(
                    statuses(report)[auditor.REQUIRED_CHECKS[0]], "NOT RUN"
                )
                self.assertNotEqual(report["overall_status"], "VERIFIED")

    def test_a_newer_failed_rerun_wins_over_an_older_pass(self):
        runs = [
            check_run(
                auditor.REQUIRED_CHECKS[0],
                run_id=1,
                completed_at="2026-11-07T12:00:00Z",
            ),
            check_run(
                auditor.REQUIRED_CHECKS[0],
                run_id=2,
                conclusion="failure",
                completed_at="2026-11-07T12:30:00Z",
            ),
            check_run(auditor.REQUIRED_CHECKS[1], run_id=3),
        ]
        report = auditor.audit_verification(
            pull_request(), [commit(HEAD, "fix: current head")], runs
        )
        self.assertEqual(statuses(report)[auditor.REQUIRED_CHECKS[0]], "FAIL")

    def test_conditionally_skipped_check_is_not_run_and_not_a_pass(self):
        runs = green_checks() + [
            check_run(auditor.CONDITIONAL_CHECKS[0], conclusion="skipped", run_id=9)
        ]
        report = auditor.audit_verification(
            pull_request(), [commit(HEAD, "docs: non-visual change")], runs
        )

        self.assertEqual(report["overall_status"], "VERIFIED")
        conditional = report["conditional_checks"][0]
        self.assertEqual(conditional["status"], "NOT RUN")
        self.assertIn("NOT RUN", auditor.render_markdown(report))

    def test_parallel_visual_qa_shards_must_all_pass(self):
        runs = green_checks() + [
            check_run("Visual QA (shard 1/2)", run_id=21),
            check_run("Visual QA (shard 2/2)", run_id=22),
        ]
        report = auditor.audit_verification(
            pull_request(), [commit(HEAD, "test: visual change")], runs
        )

        conditional = report["conditional_checks"][0]
        self.assertEqual(conditional["status"], "PASS")
        self.assertEqual(report["other_checks"], [])

    def test_one_failed_visual_qa_shard_cannot_hide_behind_a_green_sibling(self):
        runs = green_checks() + [
            check_run("Visual QA (shard 1/2)", run_id=21),
            check_run(
                "Visual QA (shard 2/2)", conclusion="failure", run_id=22
            ),
        ]
        report = auditor.audit_verification(
            pull_request(), [commit(HEAD, "test: visual change")], runs
        )

        conditional = report["conditional_checks"][0]
        self.assertEqual(conditional["status"], "FAIL")
        self.assertIn("shard 2/2", conditional["detail"])
        self.assertEqual(report["other_checks"], [])

    def test_a_pending_visual_qa_shard_is_not_reported_as_passed(self):
        runs = green_checks() + [
            check_run("Visual QA (shard 1/2)", run_id=21),
            check_run(
                "Visual QA (shard 2/2)", status="in_progress", conclusion="", run_id=22
            ),
        ]
        report = auditor.audit_verification(
            pull_request(), [commit(HEAD, "test: visual change")], runs
        )

        self.assertEqual(report["conditional_checks"][0]["status"], "PENDING")

    def test_head_absent_from_commit_list_fails_closed(self):
        report = auditor.audit_verification(
            pull_request(),
            [commit(EARLIER, "feat: earlier")],
            green_checks(),
        )
        self.assertEqual(report["overall_status"], "NOT VERIFIED")
        self.assertIn("absent", " ".join(report["blocking_reasons"]))

    def test_markdown_reports_the_head_sha_and_no_false_pass(self):
        report = auditor.audit_verification(
            pull_request(),
            [
                commit(EARLIER, "feat: earlier"),
                commit(HEAD, "fix: repair [skip ci]"),
            ],
            green_checks(sha=EARLIER),
        )
        markdown = auditor.render_markdown(report)

        self.assertIn("NOT VERIFIED", markdown)
        self.assertIn(HEAD, markdown)
        self.assertNotIn("| **PASS**", markdown)
        self.assertIn("**NOT RUN**", markdown)


class EmptyHeadShaTests(unittest.TestCase):
    def test_empty_head_sha_never_matches_runs_without_a_sha(self):
        runs = [
            check_run(name, sha="", run_id=index)
            for index, name in enumerate(auditor.REQUIRED_CHECKS, start=1)
        ]
        runs.append(
            check_run(auditor.CONDITIONAL_CHECKS[0], sha=EARLIER, run_id=99)
        )
        report = auditor.audit_verification(
            pull_request(sha=""), [commit(HEAD, "fix: current head")], runs
        )

        self.assertEqual(report["overall_status"], "NOT VERIFIED")
        for record in report["required_checks"]:
            self.assertEqual(record["status"], "NOT RUN")
            self.assertEqual(record["head_sha"], "")
        self.assertIn("no current head SHA", " ".join(report["blocking_reasons"]))

    def test_load_live_refuses_missing_head_sha_before_check_run_request(self):
        requested = []

        def fake_api_get(url, token):
            requested.append(url)
            return {"number": 42, "head": {"sha": ""}}

        def fake_paginate(url, token, key=None, limit=10):
            requested.append(url)
            return []

        with mock.patch.object(auditor, "_api_get", fake_api_get), mock.patch.object(
            auditor, "_paginate", fake_paginate
        ):
            with self.assertRaises(RuntimeError):
                auditor.load_live("owner/repo", 42, "token")

        self.assertFalse(any("/commits//" in url for url in requested))
        self.assertFalse(any("/check-runs" in url for url in requested))


class LiveLoadDeduplicationTests(unittest.TestCase):
    def test_runs_without_ids_are_deduplicated_safely(self):
        pr = pull_request()
        commits = [commit(HEAD, "fix: current head"), commit(EARLIER, "feat: earlier")]
        idless = {
            "name": "Visual QA",
            "head_sha": HEAD,
            "status": "completed",
            "conclusion": "success",
        }
        idless_duplicate = dict(idless)
        identified = check_run(
            "DevSkim scan and Security upload", sha=HEAD, run_id=7
        )
        identified_duplicate = dict(identified)
        runs_by_sha = {
            HEAD: [idless, identified],
            EARLIER: [idless_duplicate, identified_duplicate],
        }

        def fake_api_get(url, token):
            return pr

        def fake_paginate(url, token, key=None, limit=10):
            if "/check-runs" not in url:
                return commits
            sha = url.split("/commits/")[1].split("/check-runs")[0]
            return list(runs_by_sha.get(sha, []))

        with mock.patch.object(auditor, "_api_get", fake_api_get), mock.patch.object(
            auditor, "_paginate", fake_paginate
        ):
            loaded_pr, loaded_commits, loaded_runs = auditor.load_live(
                "owner/repo", 42, "token"
            )

        self.assertEqual(loaded_pr, pr)
        self.assertEqual(len(loaded_commits), 2)
        self.assertEqual(len(loaded_runs), 2)


class PollingDeadlineTests(unittest.TestCase):
    def _settled(self):
        return (pull_request(), [commit(HEAD, "fix: current head")], green_checks())

    def test_transient_error_is_retried_within_the_deadline(self):
        state = {"now": 0.0}
        calls = {"count": 0}
        sleeps = []

        def clock():
            return state["now"]

        def sleep(seconds):
            sleeps.append(seconds)
            state["now"] += seconds

        def loader(repo, pr_number, token):
            calls["count"] += 1
            if calls["count"] == 1:
                raise auditor.TransientApiError("GitHub API returned HTTP 502")
            return self._settled()

        auditor.wait_for_current_head(
            "owner/repo",
            42,
            "token",
            100,
            15,
            loader=loader,
            clock=clock,
            sleep=sleep,
        )

        self.assertEqual(calls["count"], 2)
        self.assertEqual(len(sleeps), 1)

    def test_persistent_errors_raise_after_the_deadline(self):
        state = {"now": 0.0}

        def clock():
            return state["now"]

        def sleep(seconds):
            state["now"] += seconds

        def loader(repo, pr_number, token):
            raise auditor.TransientApiError("GitHub API unavailable")

        with self.assertRaises(auditor.TransientApiError):
            auditor.wait_for_current_head(
                "owner/repo",
                42,
                "token",
                30,
                15,
                loader=loader,
                clock=clock,
                sleep=sleep,
            )

        self.assertLessEqual(state["now"], 30)

    def test_permanent_errors_are_not_retried(self):
        calls = {"count": 0}
        sleeps = []

        def loader(repo, pr_number, token):
            calls["count"] += 1
            raise RuntimeError("GitHub API request failed with HTTP 404")

        with self.assertRaises(RuntimeError):
            auditor.wait_for_current_head(
                "owner/repo",
                42,
                "token",
                100,
                15,
                loader=loader,
                clock=lambda: 0.0,
                sleep=sleeps.append,
            )

        self.assertEqual(calls["count"], 1)
        self.assertEqual(sleeps, [])

    def test_poll_sleep_never_overshoots_the_deadline(self):
        state = {"now": 0.0}
        sleeps = []

        def clock():
            return state["now"]

        def sleep(seconds):
            sleeps.append(seconds)
            state["now"] += seconds

        def loader(repo, pr_number, token):
            return (pull_request(), [commit(HEAD, "fix: current head")], [])

        auditor.wait_for_current_head(
            "owner/repo",
            42,
            "token",
            10,
            60,
            loader=loader,
            clock=clock,
            sleep=sleep,
        )

        self.assertTrue(sleeps)
        self.assertLessEqual(sum(sleeps), 10)
        self.assertLessEqual(max(sleeps), 10)


class CommandLineTests(unittest.TestCase):

    def _fixture(self, pr, commits, check_runs):
        directory = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, directory, ignore_errors=True)
        for name, payload in (
            ("pr.json", pr),
            ("commits.json", commits),
            ("check-runs.json", check_runs),
        ):
            with open(os.path.join(directory, name), "w", encoding="utf-8") as handle:
                json.dump(payload, handle)
        return directory

    def _run(self, fixture_dir, summary_path):
        return subprocess.run(
            [
                sys.executable,
                str(Path(__file__).resolve().parent / "verify_pr_verification_status.py"),
                "--fixture-dir",
                fixture_dir,
                "--summary",
                summary_path,
            ],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_skipped_head_exits_non_zero_and_writes_not_run_summary(self):
        fixture = self._fixture(
            pull_request(),
            [commit(HEAD, "fix: repair [skip ci]")],
            green_checks(sha=EARLIER),
        )
        summary = os.path.join(fixture, "summary.md")
        result = self._run(fixture, summary)

        self.assertEqual(result.returncode, 1, result.stderr)
        with open(summary, encoding="utf-8") as handle:
            self.assertIn("NOT RUN", handle.read())

    def test_verified_head_exits_zero(self):
        fixture = self._fixture(
            pull_request(),
            [commit(HEAD, "fix: verified current head")],
            green_checks(),
        )
        summary = os.path.join(fixture, "summary.md")
        result = self._run(fixture, summary)

        self.assertEqual(result.returncode, 0, result.stderr)
        with open(summary, encoding="utf-8") as handle:
            self.assertIn("VERIFIED", handle.read())

    def test_missing_token_and_repository_fails_closed(self):
        result = subprocess.run(
            [
                sys.executable,
                str(Path(__file__).resolve().parent / "verify_pr_verification_status.py"),
            ],
            capture_output=True,
            text=True,
            check=False,
            env={key: value for key, value in os.environ.items()
                 if key not in ("GH_TOKEN", "GITHUB_TOKEN")},
        )
        self.assertEqual(result.returncode, 2)
        self.assertIn("VERIFICATION AUDIT ERROR", result.stderr)


class WorkflowGuardTests(unittest.TestCase):
    def test_audit_workflow_cannot_be_silenced_by_skip_ci(self):
        workflow = (
            REPO_ROOT / ".github" / "workflows" / "verification-integrity.yml"
        ).read_text(encoding="utf-8")

        self.assertIn("pull_request_target:", workflow)
        self.assertNotIn("paths-ignore:", workflow)
        self.assertIn("--summary", workflow)
        self.assertIn("pull-requests: read", workflow)
        self.assertIn("checks: read", workflow)


if __name__ == "__main__":
    unittest.main()
