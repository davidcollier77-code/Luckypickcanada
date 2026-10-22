import tempfile
import unittest
from pathlib import Path

import suppress_devskim_false_positives as suppressions


SHA = "a" * 40
SHA256 = "b" * 64
UUID = "123e4567-e89b-12d3-a456-426614174000"


class MetadataSuppressionTests(unittest.TestCase):
    def test_complete_allowlisted_sha_is_suppressed_without_columns(self):
        self.assertTrue(
            suppressions.should_suppress_metadata_finding(
                '{"upstream_sha": "' + SHA + '"}',
                {},
            )
        )

    def test_complete_uuid_is_suppressed_for_uuid_key(self):
        self.assertTrue(
            suppressions.should_suppress_metadata_finding('{"uuid": "' + UUID + '"}', {})
        )

    def test_sha256_is_supported_for_allowlisted_sha_key(self):
        self.assertTrue(
            suppressions.should_suppress_metadata_finding(
                '{"commit_sha": "' + SHA256 + '"}',
                {},
            )
        )

    def test_trailing_non_hex_characters_reject_sha_prefix(self):
        self.assertFalse(
            suppressions.should_suppress_metadata_finding(
                '{"upstream_sha": "' + SHA + 'SECRET"}',
                {},
            )
        )

    def test_incomplete_sha_is_rejected(self):
        self.assertFalse(
            suppressions.should_suppress_metadata_finding(
                '{"upstream_sha": "' + SHA[:-1] + '"}',
                {},
            )
        )

    def test_invalid_uuid_suffix_is_rejected(self):
        self.assertFalse(
            suppressions.should_suppress_metadata_finding(
                '{"uuid": "' + UUID + 'x"}',
                {},
            )
        )

    def test_generic_id_and_hash_keys_are_not_allowlisted(self):
        for key in ("id", "client_id", "stripe_id", "api_id", "hash", "sha"):
            with self.subTest(key=key):
                self.assertFalse(
                    suppressions.should_suppress_metadata_finding(
                        '{"' + key + '": "' + SHA + '"}',
                        {},
                    )
                )

    def test_safe_field_must_overlap_reported_columns(self):
        snippet = '{"upstream_sha":"' + SHA + '","api_token":"deadbeefSECRET"}'
        token_start = snippet.index("deadbeefSECRET") + 1
        token_end = token_start + len("deadbeefSECRET")
        self.assertFalse(
            suppressions.should_suppress_metadata_finding(
                snippet,
                {"startColumn": token_start, "endColumn": token_end},
            )
        )

    def test_suppression_is_allowed_when_columns_overlap_sha_value(self):
        snippet = '{"upstream_sha":"' + SHA + '","api_token":"deadbeefSECRET"}'
        sha_start = snippet.index(SHA) + 1
        sha_end = sha_start + len(SHA)
        self.assertTrue(
            suppressions.should_suppress_metadata_finding(
                snippet,
                {"startColumn": sha_start, "endColumn": sha_end},
            )
        )

    def test_broad_range_spanning_safe_value_and_another_field_is_rejected(self):
        snippet = '{"upstream_sha":"' + SHA + '","api_token":"deadbeefSECRET"}'
        start = snippet.index(SHA) + 1
        end = len(snippet) + 1
        self.assertFalse(
            suppressions.should_suppress_metadata_finding(
                snippet,
                {"startColumn": start, "endColumn": end},
            )
        )

    def test_multiple_fields_are_not_suppressed_without_columns(self):
        snippet = '{"upstream_sha":"' + SHA + '","api_token":"deadbeefSECRET"}'
        self.assertFalse(suppressions.should_suppress_metadata_finding(snippet, {}))

    def test_unrelated_fields_do_not_count_as_a_safe_field(self):
        self.assertFalse(
            suppressions.should_suppress_metadata_finding(
                '{"api_token":"' + SHA + '"}',
                {},
            )
        )


    def test_only_known_lockfile_dependency_names_match(self):
        self.assertIsNotNone(
            suppressions.LOCKFILE_NAME_PATTERN.search("'@aws-crypto/sha1-browser@5.0.0':")
        )
        self.assertIsNotNone(
            suppressions.LOCKFILE_NAME_PATTERN.search("'@smithy/md5-js@2.0.0':")
        )
        self.assertIsNone(
            suppressions.LOCKFILE_NAME_PATTERN.search("'@example/sha1-tool@2.0.0':")
        )


class ArtifactPathTests(unittest.TestCase):
    def test_workspace_relative_allowlisted_path_is_accepted(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.assertEqual(
                suppressions.resolve_safe_artifact_uri(".specify/feature.json", root),
                (root / ".specify/feature.json").resolve(),
            )

    def test_path_traversal_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for uri in ("../../.env", ".specify/../../.env", "../pnpm-lock.yaml"):
                with self.subTest(uri=uri):
                    self.assertIsNone(suppressions.resolve_safe_artifact_uri(uri, root))

    def test_absolute_uri_and_non_allowlisted_path_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.assertIsNone(
                suppressions.resolve_safe_artifact_uri(str(root / ".specify/feature.json"), root)
            )
            self.assertIsNone(suppressions.resolve_safe_artifact_uri("README.md", root))
            self.assertIsNone(suppressions.resolve_safe_artifact_uri("file:///etc/passwd", root))

    def test_symlink_outside_workspace_is_rejected(self):
        with tempfile.TemporaryDirectory() as workspace_dir, tempfile.TemporaryDirectory() as outside_dir:
            root = Path(workspace_dir)
            outside_file = Path(outside_dir) / "private.json"
            outside_file.write_text('{"upstream_sha": "' + SHA + '"}', encoding="utf-8")
            (root / ".specify").mkdir()
            (root / ".specify/private.json").symlink_to(outside_file)
            self.assertIsNone(
                suppressions.resolve_safe_artifact_uri(".specify/private.json", root)
            )

    def test_sarif_snippet_slice_cannot_override_trusted_source_line(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            metadata_dir = root / ".specify"
            metadata_dir.mkdir()
            source_line = '{"api_token":"' + SHA + '","upstream_sha":"' + SHA + '"}'
            (metadata_dir / "manifest.json").write_text(source_line + "\n", encoding="utf-8")
            token_start = source_line.index(SHA) + 1
            token_end = token_start + len(SHA)
            data = {
                "runs": [{
                    "results": [{
                        "ruleId": "DS173237",
                        "locations": [{
                            "physicalLocation": {
                                "artifactLocation": {"uri": ".specify/manifest.json"},
                                "region": {
                                    "startLine": 1,
                                    "startColumn": token_start,
                                    "endColumn": token_end,
                                    "snippet": {"text": '{"upstream_sha":"' + SHA + '"}'},
                                },
                            }
                        }],
                    }]
                }]
            }
            self.assertEqual(suppressions.process_sarif(data, root), 0)
            self.assertNotIn("suppressions", data["runs"][0]["results"][0])

    def test_lockfile_package_is_matched_from_source_line_not_sarif_slice(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lockfile_line = "  '@aws-crypto/sha1-browser@5.0.0': {}"
            (root / "pnpm-lock.yaml").write_text(lockfile_line + "\n", encoding="utf-8")
            data = {
                "runs": [{
                    "results": [{
                        "ruleId": "DS126858",
                        "locations": [{
                            "physicalLocation": {
                                "artifactLocation": {"uri": "pnpm-lock.yaml"},
                                "region": {"startLine": 1, "snippet": {"text": "sha1"}},
                            }
                        }],
                    }]
                }]
            }
            self.assertEqual(suppressions.process_sarif(data, root), 1)
            self.assertIn("suppressions", data["runs"][0]["results"][0])

    def test_unsafe_uri_never_suppresses_sarif_finding(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            private_file = root / ".env"
            private_file.write_text('{"upstream_sha": "' + SHA + '"}', encoding="utf-8")
            data = {
                "runs": [{
                    "results": [{
                        "ruleId": "DS173237",
                        "locations": [{
                            "physicalLocation": {
                                "artifactLocation": {"uri": "../../.env"},
                                "region": {"startLine": 1},
                            }
                        }],
                    }]
                }]
            }
            self.assertEqual(suppressions.process_sarif(data, root), 0)
            self.assertNotIn("suppressions", data["runs"][0]["results"][0])


if __name__ == "__main__":
    unittest.main()
