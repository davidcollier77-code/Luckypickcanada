#!/usr/bin/env python3
"""Tests for the shared authorized-skip contract.

The contract is deliberately small: one label, three trusted authorities, a
specific reason, and one narrow Dependabot verification. These tests prove that
an authorized skip is never rendered as a pass and that every missing, forged
or malformed input fails closed.
"""

from __future__ import annotations

import unittest

import qa_skip

HEAD = "a" * 40
DEPENDABOT_EMAIL = "49699333+dependabot[bot]@users.noreply.github.com"


def dependabot_pr(login="dependabot[bot]", actor_type="Bot"):
    return {"number": 42, "user": {"login": login, "type": actor_type}}


def dependabot_commit(path_sha=HEAD, author=DEPENDABOT_EMAIL, committer="noreply@github.com"):
    return {
        "sha": path_sha,
        "author": {"login": "dependabot[bot]", "type": "Bot"},
        "commit": {
            "message": "bump the playwright group",
            "author": {"name": "dependabot[bot]", "email": author},
            "committer": {"name": "GitHub", "email": committer},
        },
    }


def files(*paths):
    return [{"filename": path, "status": "modified"} for path in paths]


class LabelTests(unittest.TestCase):
    def test_label_is_exact_and_distinct_from_a_pass(self):
        self.assertEqual(qa_skip.LABEL, "SKIPPED — NOT APPLICABLE")
        self.assertNotEqual(qa_skip.LABEL, "PASSED")
        self.assertNotEqual(qa_skip.LABEL, "PASS")

    def test_display_status_never_turns_a_skip_into_a_pass(self):
        authorized = qa_skip.record(
            qa_skip.TRUSTED_CLASSIFIER, "no changed path can affect rendered output"
        )
        self.assertEqual(qa_skip.display_status("NOT RUN", authorized), qa_skip.LABEL)
        self.assertEqual(qa_skip.display_status("FAILED", authorized), qa_skip.LABEL)
        # Without an authorized record the real status is preserved.
        self.assertEqual(qa_skip.display_status("NOT RUN", None), "NOT RUN")
        self.assertEqual(
            qa_skip.display_status("FAILED", {"authority": "made-up", "reason": "x"}),
            "FAILED",
        )


class AuthorityTests(unittest.TestCase):
    def test_every_documented_authority_is_accepted_with_a_specific_reason(self):
        for authority in qa_skip.AUTHORITIES:
            with self.subTest(authority=authority):
                self.assertTrue(
                    qa_skip.is_authorized(
                        authority, "this check cannot apply to the change set"
                    )
                )

    def test_undocumented_authorities_are_rejected(self):
        for authority in (
            None,
            "",
            "pr-description",
            "owner-waiver",
            "trusted-applicability-classifier ",
            "SKIPPED",
        ):
            with self.subTest(authority=authority):
                self.assertFalse(
                    qa_skip.is_authorized(authority, "a specific enough reason")
                )

    def test_reason_must_be_specific_and_not_placeholder(self):
        for reason in (
            None,
            "",
            "short",
            "todo — prove it later",
            "TBD for this change",
            "fill this in",
            "<reason>",
        ):
            with self.subTest(reason=reason):
                self.assertFalse(qa_skip.is_authorized(qa_skip.TRUSTED_CLASSIFIER, reason))

    def test_record_rejects_anything_untrusted(self):
        with self.assertRaises(qa_skip.SkipError):
            qa_skip.record("owner-waiver", "a specific enough reason")
        with self.assertRaises(qa_skip.SkipError):
            qa_skip.record(qa_skip.TRUSTED_CLASSIFIER, "todo")
        self.assertIsNone(
            qa_skip.record_or_none("owner-waiver", "a specific enough reason")
        )

    def test_record_is_recognised_and_carries_the_exact_label(self):
        value = qa_skip.record(
            qa_skip.ACTOR_INAPPLICABLE,
            "a human attestation cannot be given by an automation author",
        )
        self.assertTrue(qa_skip.is_authorized_record(value))
        self.assertEqual(value["label"], qa_skip.LABEL)
        self.assertFalse(qa_skip.is_authorized_record({"authority": "x", "reason": "y"}))


class DependabotVerificationTests(unittest.TestCase):
    def test_a_verified_maintenance_update_is_recognised(self):
        verified, reason = qa_skip.dependabot_maintenance(
            dependabot_pr(),
            [dependabot_commit()],
            files(
                "package.json",
                "pnpm-lock.yaml",
                ".github/dependabot.yml",
                ".github/workflows/visual-qa.yml",
            ),
        )
        self.assertTrue(verified, reason)

    def test_every_dependabot_condition_is_required(self):
        cases = {
            "human author": (
                dependabot_pr(login="someone"),
                [dependabot_commit()],
                files("package.json"),
            ),
            "non-bot actor": (
                dependabot_pr(actor_type="User"),
                [dependabot_commit()],
                files("package.json"),
            ),
            "no commits": (dependabot_pr(), [], files("package.json")),
            "missing commits": (dependabot_pr(), None, files("package.json")),
            "foreign commit author": (
                dependabot_pr(),
                [dependabot_commit(author="someone@example.com")],
                files("package.json"),
            ),
            "non-GitHub committer": (
                dependabot_pr(),
                [dependabot_commit(committer="someone@example.com")],
                files("package.json"),
            ),
            "application path": (
                dependabot_pr(),
                [dependabot_commit()],
                files("app/page.js"),
            ),
            "governance path": (
                dependabot_pr(),
                [dependabot_commit()],
                files("AGENTS.md"),
            ),
            "no files": (dependabot_pr(), [dependabot_commit()], []),
            "missing files": (dependabot_pr(), [dependabot_commit()], None),
            "malformed file record": (
                dependabot_pr(),
                [dependabot_commit()],
                [{}],
            ),
            "malformed commit record": (dependabot_pr(), [None], files("package.json")),
            "missing pull request": (None, [dependabot_commit()], files("package.json")),
        }
        for label, (pr, commits, changed) in cases.items():
            with self.subTest(case=label):
                verified, _reason = qa_skip.dependabot_maintenance(pr, commits, changed)
                self.assertFalse(verified)

    def test_a_mixed_dependabot_commit_list_is_not_verified(self):
        human = {
            "sha": "b" * 40,
            "author": {"login": "someone", "type": "User"},
            "commit": {
                "message": "manual fix",
                "author": {"email": "someone@example.com"},
                "committer": {"email": "someone@example.com"},
            },
        }
        verified, _reason = qa_skip.dependabot_maintenance(
            dependabot_pr(), [dependabot_commit(), human], files("package.json")
        )
        self.assertFalse(verified)

    def test_a_nested_workspace_manifest_is_maintenance(self):
        verified, reason = qa_skip.dependabot_maintenance(
            dependabot_pr(),
            [dependabot_commit()],
            files("workers/updater-scheduler/package.json"),
        )
        self.assertTrue(verified, reason)

    def test_workflow_yaml_is_maintenance_but_other_workflow_files_are_not(self):
        for path in (
            ".github/workflows/visual-qa.yml",
            ".github/workflows/updater.yaml",
        ):
            with self.subTest(path=path):
                self.assertTrue(
                    qa_skip.dependabot_maintenance(
                        dependabot_pr(), [dependabot_commit()], files(path)
                    )[0]
                )
        for path in (".github/workflows/scripts/helper.sh", ".github/CODEOWNERS"):
            with self.subTest(path=path):
                self.assertFalse(
                    qa_skip.dependabot_maintenance(
                        dependabot_pr(), [dependabot_commit()], files(path)
                    )[0]
                )


if __name__ == "__main__":
    unittest.main()
