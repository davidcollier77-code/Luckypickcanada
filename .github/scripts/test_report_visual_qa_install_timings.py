#!/usr/bin/env python3
"""Tests for the Visual QA install-timing reporter.

Run from the repository root:

    PYTHONPATH=.github/scripts python3 -m unittest test_report_visual_qa_install_timings -v

The tests are offline: live GitHub access is replaced by fixture directories,
and log parsing is exercised with the exact @actions/cache lines the QA jobs
write.
"""

from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import re
import tempfile
import unittest
import zipfile
from unittest import mock

MODULE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "report_visual_qa_install_timings.py")
SPEC = importlib.util.spec_from_file_location("report_visual_qa_install_timings", MODULE_PATH)
timings = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(timings)


def step(name, started, completed, conclusion="success", number=1):
    return {
        "name": name,
        "number": number,
        "status": "completed",
        "conclusion": conclusion,
        "started_at": started,
        "completed_at": completed,
    }


def job(job_id, name, steps, conclusion="success"):
    return {
        "id": job_id,
        "name": name,
        "status": "completed",
        "conclusion": conclusion,
        "steps": steps,
    }


def install_steps(started, completed, chromium="hit"):
    steps = [step("Install dependencies", started, completed)]
    if chromium is not None:
        steps.append(
            step(
                "Restore cached Playwright Chromium",
                "2026-11-15T16:05:40Z",
                "2026-11-15T16:05:45Z",
                number=2,
            )
        )
        steps.append(
            step(
                "Install Playwright Chromium (cache miss)",
                "2026-11-15T16:05:45Z",
                "2026-11-15T16:05:45Z",
                conclusion="skipped" if chromium == "hit" else "success",
                number=3,
            )
        )
    return steps


def restore_step(conclusion="success", status="completed"):
    completed = status == "completed"
    return {
        "name": "Restore cached Playwright Chromium",
        "number": 2,
        "status": status,
        "conclusion": conclusion if completed else None,
        "started_at": "2026-11-15T16:05:40Z",
        "completed_at": "2026-11-15T16:05:45Z" if completed else None,
    }


def chromium_job(restore=None, miss="missing", job_id="10"):
    steps = [step("Install dependencies", "2026-11-15T16:05:32Z", "2026-11-15T16:05:39Z")]
    if restore is not None:
        steps.append(restore)
    if miss != "missing":
        steps.append(miss)
    return job(job_id, "Visual QA (shard 1/2)", steps)


def miss_step(conclusion="skipped"):
    return step(
        "Install Playwright Chromium (cache miss)",
        "2026-11-15T16:05:45Z",
        "2026-11-15T16:05:45Z",
        conclusion=conclusion,
        number=3,
    )


def page_of_jobs(count, start=0):
    return [
        job(
            "%d" % (start + index),
            "Backend %d" % (start + index),
            [step("Checkout repository", "2026-11-15T15:33:30Z", "2026-11-15T15:33:37Z")],
        )
        for index in range(count)
    ]


def fake_api_json(payloads, requested):
    def call(url, token):
        if "/jobs?" not in url:
            return dict(RUN)
        page = int(re.search(r"[?&]page=(\d+)", url).group(1))
        requested.append(page)
        return payloads[page - 1]

    return call


VERIFY_JOB = job(
    "1",
    "Visual QA",
    install_steps("2026-11-15T15:34:00Z", "2026-11-15T15:34:08Z", chromium=None),
)
SHARD_ONE = job(
    "2",
    "Visual QA (shard 1/2)",
    install_steps("2026-11-15T16:05:32Z", "2026-11-15T16:05:39Z"),
)
SHARD_TWO_MISS = job(
    "3",
    "Visual QA (shard 2/2)",
    install_steps("2026-11-15T15:34:18Z", "2026-11-15T15:34:25Z", chromium="miss"),
)
DETECT_JOB = job(
    "4",
    "Detect visual changes",
    [step("Checkout repository", "2026-11-15T15:33:30Z", "2026-11-15T15:33:37Z")],
)

RUN = {
    "id": 43730539554,
    "run_attempt": 2,
    "status": "completed",
    "conclusion": "success",
    "head_sha": "fixture-head-sha-value",
    "html_url": "https://github.com/example/repo/actions/runs/43730539554",
}

SHARD_ONE_LOG = "\n".join(
    [
        "2026-11-15T16:05:20.1234567Z Cache restored from key: node-cache-Linux-pnpm-abc123",
        "2026-11-15T16:05:40.1234567Z Cache restored from key: playwright-chromium-Linux-1.64.1",
        "2026-11-15T16:05:39.7654321Z Done in 7.5s using pnpm v10.30.3",
    ]
)

SHARD_TWO_LOG = "\n".join(
    [
        "2026-11-15T15:34:05.1234567Z Cache not found for input keys: "
        "node-cache-Linux-pnpm-missing, node-cache-Linux-pnpm",
        "2026-11-15T15:34:26.1234567Z Cache not found for input keys: "
        "playwright-chromium-Linux-1.64.1",
    ]
)


class CacheParsingTests(unittest.TestCase):
    def test_reads_hit_keys_for_both_caches(self):
        states = timings.parse_cache_states(SHARD_ONE_LOG)
        self.assertEqual(
            states["pnpm"], {"state": "hit", "key": "node-cache-Linux-pnpm-abc123"}
        )
        self.assertEqual(
            states["chromium"],
            {"state": "hit", "key": "playwright-chromium-Linux-1.64.1"},
        )

    def test_reads_miss_keys_for_both_caches(self):
        states = timings.parse_cache_states(SHARD_TWO_LOG)
        self.assertEqual(
            states["pnpm"],
            {"state": "miss", "key": "node-cache-Linux-pnpm-missing"},
        )
        self.assertEqual(
            states["chromium"],
            {"state": "miss", "key": "playwright-chromium-Linux-1.64.1"},
        )

    def test_unknown_when_the_log_has_no_cache_lines(self):
        states = timings.parse_cache_states("Done in 7.5s using pnpm v10.30.3")
        self.assertEqual(states["pnpm"]["state"], "unknown")
        self.assertEqual(states["chromium"]["state"], "unknown")

    def test_hit_wins_over_a_later_save_or_restore_line(self):
        log = "\n".join(
            [
                "Cache restored from key: node-cache-Linux-pnpm-abc123",
                "Cache not found for input keys: node-cache-Linux-pnpm-abc123",
            ]
        )
        self.assertEqual(timings.parse_cache_states(log)["pnpm"]["state"], "hit")

    def test_first_hit_key_is_not_overwritten_by_a_later_duplicate_hit(self):
        log = "\n".join(
            [
                "Cache restored from key: playwright-chromium-Linux-1.64.1",
                "Cache restored from key: playwright-chromium-Linux-9.99.9",
            ]
        )
        self.assertEqual(
            timings.parse_cache_states(log)["chromium"],
            {"state": "hit", "key": "playwright-chromium-Linux-1.64.1"},
        )

    def test_classifies_only_known_cache_families(self):
        self.assertEqual(
            timings.classify_cache_key("playwright-chromium-Linux-1.64.1"), "chromium"
        )
        self.assertEqual(timings.classify_cache_key("node-cache-Linux-pnpm-abc"), "pnpm")
        self.assertIsNone(timings.classify_cache_key("some-other-cache-key"))


class LogDecodingTests(unittest.TestCase):
    def test_decodes_plain_text_logs(self):
        self.assertIn("Cache restored", timings.decode_log(b"Cache restored from key: x"))

    def test_decodes_a_one_entry_zip_log(self):
        payload = io.BytesIO()
        with zipfile.ZipFile(payload, "w") as archive:
            archive.writestr("Visual QA.txt", SHARD_ONE_LOG)
        decoded = timings.decode_log(payload.getvalue())
        self.assertIn("playwright-chromium-Linux-1.64.1", decoded)

    def test_rejects_a_corrupt_zip(self):
        with self.assertRaises(timings.ReportError):
            timings.decode_log(b"PK\x03\x04not-a-real-zip")


class StepAndJobTests(unittest.TestCase):
    def test_install_duration_is_whole_seconds(self):
        self.assertEqual(timings.step_duration_seconds(timings.install_step(VERIFY_JOB)), 8)
        self.assertEqual(timings.step_duration_seconds(timings.install_step(SHARD_ONE)), 7)

    def test_missing_timestamps_have_no_duration(self):
        self.assertIsNone(timings.step_duration_seconds({"name": "Install dependencies"}))

    def test_selects_visual_jobs_and_orders_verify_before_shards(self):
        jobs = [DETECT_JOB, SHARD_TWO_MISS, VERIFY_JOB, SHARD_ONE]
        names = [item["name"] for item in timings.select_visual_jobs(jobs)]
        self.assertEqual(
            names,
            ["Visual QA", "Visual QA (shard 1/2)", "Visual QA (shard 2/2)"],
        )

    def test_chromium_state_comes_from_the_cache_miss_step(self):
        self.assertEqual(timings.chromium_state_from_steps(SHARD_ONE), "hit")
        self.assertEqual(timings.chromium_state_from_steps(SHARD_TWO_MISS), "miss")
        self.assertEqual(timings.chromium_state_from_steps(VERIFY_JOB), "n/a")

    def test_chromium_state_is_unknown_when_the_step_did_not_complete(self):
        broken = job(
            "9",
            "Visual QA (shard 1/2)",
            [
                step("Install dependencies", "2026-11-15T16:05:32Z", "2026-11-15T16:05:39Z"),
                step(
                    "Restore cached Playwright Chromium",
                    "2026-11-15T16:05:40Z",
                    None,
                ),
                step(
                    "Install Playwright Chromium (cache miss)",
                    "2026-11-15T16:05:45Z",
                    None,
                ),
            ],
        )
        broken["steps"][2]["status"] = "in_progress"
        broken["steps"][2]["conclusion"] = None
        self.assertEqual(timings.chromium_state_from_steps(broken), "unknown")

    def test_skipped_miss_after_a_successful_restore_is_a_hit(self):
        candidate = chromium_job(restore=restore_step(), miss=miss_step("skipped"))
        self.assertEqual(timings.chromium_state_from_steps(candidate), "hit")

    def test_executed_miss_after_a_successful_restore_stays_a_miss(self):
        candidate = chromium_job(restore=restore_step(), miss=miss_step("success"))
        self.assertEqual(timings.chromium_state_from_steps(candidate), "miss")

    def test_skipped_miss_cannot_be_a_hit_without_a_successful_restore(self):
        cases = {
            "failed": restore_step(conclusion="failure"),
            "cancelled": restore_step(conclusion="cancelled"),
            "skipped": restore_step(conclusion="skipped"),
            "no conclusion": restore_step(conclusion=None),
            "incomplete": restore_step(status="in_progress"),
        }
        for label, restore in cases.items():
            with self.subTest(restore=label):
                candidate = chromium_job(restore=restore, miss=miss_step("skipped"))
                self.assertEqual(timings.chromium_state_from_steps(candidate), "unknown")

    def test_missing_miss_only_step_is_unknown_and_the_log_supplies_the_key(self):
        candidate = chromium_job(restore=restore_step(), miss="missing")
        self.assertEqual(timings.chromium_state_from_steps(candidate), "unknown")
        row = timings.build_row(
            candidate, "Cache restored from key: playwright-chromium-Linux-1.64.1"
        )
        self.assertEqual(
            row["chromium_cache"],
            {"state": "hit", "key": "playwright-chromium-Linux-1.64.1"},
        )


class RowAndReportTests(unittest.TestCase):
    def test_row_compares_with_the_pr_1914_baseline(self):
        row = timings.build_row(SHARD_ONE, SHARD_ONE_LOG)
        self.assertEqual(row["install_seconds"], 7)
        self.assertEqual(row["baseline_seconds"], 7)
        self.assertEqual(row["delta_seconds"], 0)
        self.assertEqual(row["pnpm_cache"]["state"], "hit")
        self.assertEqual(row["chromium_cache"]["state"], "hit")

    def test_report_shows_the_table_and_a_cold_store_warning(self):
        rows = [
            timings.build_row(VERIFY_JOB, ""),
            timings.build_row(SHARD_ONE, SHARD_ONE_LOG),
            timings.build_row(SHARD_TWO_MISS, SHARD_TWO_LOG),
        ]
        report = timings.render_report(RUN, rows, "example/repo")
        self.assertIn("Visual QA (shard 1/2)", report)
        self.assertIn("playwright-chromium-Linux-1.64.1", report)
        self.assertRegex(report, r"7s\s+7s\s+0s")
        self.assertIn("Cold pnpm store on Visual QA (shard 2/2)", report)
        self.assertIn("PR #1914", report)
        # The head identifier is still shortened to eight characters.
        self.assertIn("Head: fixture-", report)

    def test_report_notes_when_no_browser_shard_ran(self):
        report = timings.render_report(RUN, [timings.build_row(VERIFY_JOB, "")], "example/repo")
        self.assertIn("No Chromium browser shard ran", report)

    def test_report_notes_unreadable_cache_state(self):
        report = timings.render_report(RUN, [timings.build_row(SHARD_ONE, "")], "example/repo")
        self.assertIn("could not be read from the job log", report)


class LiveLoadingTests(unittest.TestCase):
    def test_pagination_continues_past_a_full_page_without_a_total(self):
        requested = []
        payloads = [{"jobs": page_of_jobs(100)}, {"jobs": page_of_jobs(3, 100)}]
        with mock.patch.object(timings, "api_json", fake_api_json(payloads, requested)):
            _run, jobs, logs = timings.load_live("owner/repo", 1, None)
        self.assertEqual(requested, [1, 2])
        self.assertEqual(len(jobs), 103)
        self.assertEqual(logs, {})

    def test_pagination_continues_past_full_pages_when_the_total_is_zero(self):
        requested = []
        payloads = [
            {"jobs": page_of_jobs(100), "total_count": 0},
            {"jobs": page_of_jobs(100, 100), "total_count": 0},
            {"jobs": page_of_jobs(5, 200), "total_count": 0},
        ]
        with mock.patch.object(timings, "api_json", fake_api_json(payloads, requested)):
            _run, jobs, _logs = timings.load_live("owner/repo", 1, None)
        self.assertEqual(requested, [1, 2, 3])
        self.assertEqual(len(jobs), 205)

    def test_pagination_stops_when_a_positive_total_is_reached(self):
        requested = []
        payloads = [
            {"jobs": page_of_jobs(100), "total_count": 150},
            {"jobs": page_of_jobs(50, 100), "total_count": 150},
        ]
        with mock.patch.object(timings, "api_json", fake_api_json(payloads, requested)):
            _run, jobs, _logs = timings.load_live("owner/repo", 1, None)
        self.assertEqual(requested, [1, 2])
        self.assertEqual(len(jobs), 150)

    def test_pagination_stops_on_a_short_page_even_with_a_larger_total(self):
        requested = []
        payloads = [{"jobs": page_of_jobs(2), "total_count": 900}]
        with mock.patch.object(timings, "api_json", fake_api_json(payloads, requested)):
            _run, jobs, _logs = timings.load_live("owner/repo", 1, None)
        self.assertEqual(requested, [1])
        self.assertEqual(len(jobs), 2)

    def _single_visual_payload(self, chromium=None):
        visual = job(
            "2",
            "Visual QA (shard 1/2)",
            install_steps("2026-11-15T16:05:32Z", "2026-11-15T16:05:39Z", chromium=chromium),
        )
        return {"jobs": [visual], "total_count": 1}

    def test_unavailable_log_leaves_cache_details_unknown(self):
        payloads = [self._single_visual_payload(chromium=None)]

        def unavailable(_url, _token):
            raise timings.ReportError("GitHub API request failed with HTTP 404 for /logs")

        with mock.patch.object(timings, "api_json", fake_api_json(payloads, [])):
            with mock.patch.object(timings, "api_bytes", unavailable):
                _run, jobs, logs = timings.load_live("owner/repo", 1, None)
        self.assertEqual(logs, {})
        row = timings.build_rows(jobs, logs)[0]
        self.assertEqual(row["pnpm_cache"]["state"], "unknown")
        self.assertEqual(row["chromium_cache"]["state"], "n/a")

    def test_corrupt_zip_log_raises_a_clear_report_error(self):
        payloads = [self._single_visual_payload()]
        with mock.patch.object(timings, "api_json", fake_api_json(payloads, [])):
            with mock.patch.object(timings, "api_bytes", lambda _url, _token: b"PK\x03\x04broken"):
                with self.assertRaises(timings.ReportError) as caught:
                    timings.load_live("owner/repo", 1, None)
        self.assertIn("not a valid zip", str(caught.exception))

    def test_corrupt_logs_make_the_report_exit_non_zero(self):
        payloads = [self._single_visual_payload()]
        error = io.StringIO()
        with mock.patch.object(timings, "resolve_repository", lambda _explicit: "owner/repo"):
            with mock.patch.object(timings, "resolve_token", lambda: None):
                with mock.patch.object(timings, "api_json", fake_api_json(payloads, [])):
                    with mock.patch.object(
                        timings, "api_bytes", lambda _url, _token: b"PK\x03\x04broken"
                    ):
                        with contextlib.redirect_stderr(error):
                            status = timings.main(["43730539554"])
        self.assertEqual(status, 2)
        self.assertIn("not a valid zip", error.getvalue())


class ApiJsonReportingTests(unittest.TestCase):
    def test_invalid_json_error_keeps_the_decoder_detail(self):
        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *_exc):
                return False

            def read(self):
                return b'{"jobs": '

        with mock.patch.object(timings, "_github_request", lambda _url, _token: Response()):
            with self.assertRaises(timings.ReportError) as caught:
                timings.api_json("https://api.github.com/repos/owner/repo/actions/runs/1", None)
        message = str(caught.exception)
        self.assertIn("/repos/owner/repo/actions/runs/1", message)
        self.assertIn("invalid JSON", message)
        self.assertIn("Expecting value", message)
        self.assertIn("line 1 column", message)


class FixtureModeTests(unittest.TestCase):
    def make_fixture(self, directory):
        with open(os.path.join(directory, "run.json"), "w", encoding="utf-8") as handle:
            json.dump(RUN, handle)
        with open(os.path.join(directory, "jobs.json"), "w", encoding="utf-8") as handle:
            json.dump(
                {"total_count": 4, "jobs": [DETECT_JOB, SHARD_TWO_MISS, VERIFY_JOB, SHARD_ONE]},
                handle,
            )
        logs = os.path.join(directory, "logs")
        os.makedirs(logs)
        for job_id, text in (("2", SHARD_ONE_LOG), ("3", SHARD_TWO_LOG)):
            with open(os.path.join(logs, "%s.txt" % job_id), "w", encoding="utf-8") as handle:
                handle.write(text)

    def test_fixture_mode_prints_the_comparison(self):
        with tempfile.TemporaryDirectory() as directory:
            self.make_fixture(directory)
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                status = timings.main(["--fixture-dir", directory, "43730539554"])
        self.assertEqual(status, 0)
        text = output.getvalue()
        self.assertIn("Visual QA (shard 1/2)", text)
        self.assertIn("hit (playwright-chromium-Linux-1.64.1)", text)
        self.assertIn("Cold pnpm store", text)

    def test_fixture_mode_json_is_machine_readable(self):
        with tempfile.TemporaryDirectory() as directory:
            self.make_fixture(directory)
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                status = timings.main(["--fixture-dir", directory, "--json", "43730539554"])
        self.assertEqual(status, 0)
        payload = json.loads(output.getvalue())
        self.assertEqual(payload["baseline"]["run_id"], 43730539554)
        self.assertEqual(len(payload["jobs"]), 3)
        self.assertEqual(payload["jobs"][1]["pnpm_cache"]["state"], "hit")

    def test_missing_fixture_fails_cleanly(self):
        with tempfile.TemporaryDirectory() as directory:
            error = io.StringIO()
            with contextlib.redirect_stderr(error):
                status = timings.main(["--fixture-dir", directory, "123"])
        self.assertEqual(status, 2)
        self.assertIn("fixture file is missing", error.getvalue())

    def test_repository_must_be_owner_name(self):
        with self.assertRaises(timings.ReportError):
            timings.resolve_repository("not a repo")


if __name__ == "__main__":
    unittest.main()
