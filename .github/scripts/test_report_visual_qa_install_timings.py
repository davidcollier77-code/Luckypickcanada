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
import tempfile
import unittest
import zipfile

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
    "head_sha": "6027091ad6c3171ff7329c82a3aa623e17822726",
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

    def test_report_notes_when_no_browser_shard_ran(self):
        report = timings.render_report(RUN, [timings.build_row(VERIFY_JOB, "")], "example/repo")
        self.assertIn("No Chromium browser shard ran", report)

    def test_report_notes_unreadable_cache_state(self):
        report = timings.render_report(RUN, [timings.build_row(SHARD_ONE, "")], "example/repo")
        self.assertIn("could not be read from the job log", report)


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
