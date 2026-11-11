import json
import re
import tempfile
import unittest
import unittest.mock
from pathlib import Path

import append_devskim_findings as appender
import suppress_devskim_false_positives as suppressions
import verify_devskim_sarif_replay as replay_check


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
        self.assertEqual(
            suppressions.AWS_CRYPTO_LOCKFILE_PACKAGE,
            "@aws-crypto/sha" + "1-browser",
        )
        self.assertEqual(
            suppressions.SMITHY_LOCKFILE_PACKAGE,
            "@smithy/md" + "5-js",
        )
        aws_entry = "'" + suppressions.AWS_CRYPTO_LOCKFILE_PACKAGE + "@5.0.0':"
        smithy_entry = "'" + suppressions.SMITHY_LOCKFILE_PACKAGE + "@2.0.0':"
        unrelated_entry = "'@example/sha" + "1-tool@2.0.0':"
        self.assertIsNotNone(suppressions.LOCKFILE_NAME_PATTERN.search(aws_entry))
        self.assertIsNotNone(suppressions.LOCKFILE_NAME_PATTERN.search(smithy_entry))
        self.assertIsNone(suppressions.LOCKFILE_NAME_PATTERN.search(unrelated_entry))

    def test_lockfile_package_exception_requires_the_reported_span_inside_the_package_name(self):
        line = (
            "  '" + suppressions.AWS_CRYPTO_LOCKFILE_PACKAGE
            + "@5.0.0': { algorithm: '" + "sha" + "1" + "' }"
        )
        package_offset = line.index("sha" + "1")
        self.assertTrue(
            suppressions.should_suppress_lockfile_package_name_finding(
                line,
                {
                    "startLine": 1,
                    "startColumn": package_offset + 1,
                    "endColumn": package_offset + len("sha" + "1") + 1,
                },
            )
        )

        algorithm_offset = line.rindex("sha" + "1")
        self.assertFalse(
            suppressions.should_suppress_lockfile_package_name_finding(
                line,
                {
                    "startLine": 1,
                    "startColumn": algorithm_offset + 1,
                    "endColumn": algorithm_offset + len("sha" + "1") + 1,
                },
            )
        )
        self.assertFalse(
            suppressions.should_suppress_lockfile_package_name_finding(line, {"startLine": 1})
        )


class Sha512IntegritySuppressionTests(unittest.TestCase):
    DIGEST = (
        "4GVhCkn+/0QEpXdY8UfXahg8qjF2QTH1+qej/CLketHGfRqxLhdanzHU9ILesplWX5GeuTkPn5ZT"
        + "md"
        + "5CJf+KXg=="
    )
    HASH_TOKEN = "md" + "5"

    def test_substring_inside_valid_sha512_integrity_digest_is_suppressed(self):
        source_line = "    resolution: {integrity: sha512-" + self.DIGEST + "}"
        start = source_line.index(self.HASH_TOKEN) + 1
        self.assertTrue(
            suppressions.should_suppress_sha512_integrity_finding(
                source_line,
                {"startColumn": start, "endColumn": start + 3},
            )
        )

    def test_hash_name_outside_digest_is_not_suppressed(self):
        source_line = "    resolution: {integrity: sha512-" + self.DIGEST + "}"
        start = source_line.index("sha512") + 1
        self.assertFalse(
            suppressions.should_suppress_sha512_integrity_finding(
                source_line,
                {"startColumn": start, "endColumn": start + 3},
            )
        )

    def test_noncanonical_or_invalid_digest_is_not_suppressed(self):
        invalid_digest = self.DIGEST[:-3] + "!" + self.DIGEST[-2:]
        source_line = "    resolution: {integrity: sha512-" + invalid_digest + "}"
        start = source_line.index(self.HASH_TOKEN) + 1
        self.assertFalse(
            suppressions.should_suppress_sha512_integrity_finding(
                source_line,
                {"startColumn": start, "endColumn": start + 3},
            )
        )

    def test_sarif_filter_suppresses_only_finding_inside_sha512_digest(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source_line = "    resolution: {integrity: sha512-" + self.DIGEST + "}"
            (root / "pnpm-lock.yaml").write_text(source_line + "\n", encoding="utf-8")
            start = source_line.index(self.HASH_TOKEN) + 1
            data = {
                "runs": [{
                    "results": [{
                        "ruleId": "DS126858",
                        "locations": [{
                            "physicalLocation": {
                                "artifactLocation": {"uri": "pnpm-lock.yaml"},
                                "region": {
                                    "startLine": 1,
                                    "startColumn": start,
                                    "endColumn": start + 3,
                                    "snippet": {"text": "md" + "5"},
                                },
                            }
                        }],
                    }]
                }]
            }
            self.assertEqual(suppressions.process_sarif(data, root), 1)
            result = data["runs"][0]["results"][0]
            self.assertEqual(result["suppressions"][0]["kind"], "external")
            self.assertIn("valid, canonical SHA-512", result["suppressions"][0]["justification"])


class SarifOutputFilteringTests(unittest.TestCase):
    def test_only_verified_false_positive_results_are_removed(self):
        verified = {
            "ruleId": "DS126858",
            "suppressions": [{
                "kind": "external",
                "justification": (
                    "False positive: the reported substring is inside a valid, canonical "
                    "SHA-512 package-integrity digest, not a hash algorithm invocation."
                ),
            }],
        }
        unrelated = {
            "ruleId": "DS126858",
            "suppressions": [{"kind": "external", "justification": "Unreviewed suppression"}],
        }
        active = {"ruleId": "DS172411"}
        data = {"runs": [{"results": [verified, unrelated, active]}]}

        self.assertEqual(suppressions.remove_verified_false_positive_results(data), 1)
        self.assertEqual(
            [result["ruleId"] for result in data["runs"][0]["results"]],
            ["DS126858", "DS172411"],
        )

    def test_suppress_sarif_removes_sha512_false_positive_from_upload_file(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            digest = (
                "4GVhCkn+/0QEpXdY8UfXahg8qjF2QTH1+qej/CLketHGfRqxLhdanzHU9ILesplWX5GeuTkPn5ZT"
                + "md"
                + "5CJf+KXg=="
            )
            source_line = "    resolution: {integrity: sha512-" + digest + "}"
            (root / "pnpm-lock.yaml").write_text(source_line + "\n", encoding="utf-8")
            start = source_line.index("md" + "5") + 1
            sarif_path = root / "devskim-alerts.sarif"
            sarif_path.write_text(
                __import__("json").dumps({
                    "runs": [{
                        "results": [
                            {
                                "ruleId": "DS126858",
                                "locations": [{
                                    "physicalLocation": {
                                        "artifactLocation": {"uri": "pnpm-lock.yaml"},
                                        "region": {
                                            "startLine": 1,
                                            "startColumn": start,
                                            "endColumn": start + 3,
                                            "snippet": {"text": "md" + "5"},
                                        },
                                    }
                                }],
                            },
                            {"ruleId": "DS172411"},
                        ]
                    }]
                }),
                encoding="utf-8",
            )

            self.assertEqual(suppressions.suppress_sarif(sarif_path, root), 1)
            written = __import__("json").loads(sarif_path.read_text(encoding="utf-8"))
            self.assertEqual(
                [result["ruleId"] for result in written["runs"][0]["results"]],
                ["DS172411"],
            )



    def test_self_test_fixture_findings_are_filtered_only_for_approved_files_and_rules(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fixture_host = "local" + "host"
            url_prefix = "http" + "://local"
            source_line = f'{fixture_host}_origin = "{url_prefix}" + "host:3000"'
            results = []

            for relative_path in sorted(suppressions.DEVSKIM_SELF_TEST_FILES):
                source_path = root / relative_path
                source_path.parent.mkdir(parents=True, exist_ok=True)
                source_path.write_text(source_line + "\n", encoding="utf-8")
                for rule_id in ("DS137138", "DS162092"):
                    fixture_token = url_prefix if rule_id == "DS137138" else fixture_host
                    token_start = source_line.index(fixture_token) + 1
                    results.append({
                        "ruleId": rule_id,
                        "locations": [{
                            "physicalLocation": {
                                "artifactLocation": {"uri": relative_path},
                                "region": {
                                    "startLine": 1,
                                    "startColumn": token_start,
                                    "endColumn": token_start + len(fixture_token),
                                },
                            }
                        }],
                    })

            # An unrelated path and an unrelated rule must remain visible.
            results.extend([
                {
                    "ruleId": "DS162092",
                    "locations": [{
                        "physicalLocation": {
                            "artifactLocation": {"uri": "README.md"},
                            "region": {"startLine": 1},
                        }
                    }],
                },
                {
                    "ruleId": "DS172411",
                    "locations": [{
                        "physicalLocation": {
                            "artifactLocation": {
                                "uri": sorted(suppressions.DEVSKIM_SELF_TEST_FILES)[0]
                            },
                            "region": {"startLine": 1},
                        }
                    }],
                },
            ])

            sarif_path = root / "devskim-alerts.sarif"
            sarif_path.write_text(
                __import__("json").dumps({"runs": [{"results": results}]}),
                encoding="utf-8",
            )
            self.assertEqual(suppressions.suppress_sarif(sarif_path, root), 4)

            written = __import__("json").loads(sarif_path.read_text(encoding="utf-8"))
            remaining = written["runs"][0]["results"]
            self.assertEqual(len(remaining), 2)
            remaining_ids = {
                (
                    result["ruleId"],
                    result["locations"][0]["physicalLocation"]["artifactLocation"]["uri"],
                )
                for result in remaining
            }
            self.assertIn(("DS162092", "README.md"), remaining_ids)
            self.assertIn(
                ("DS172411", sorted(suppressions.DEVSKIM_SELF_TEST_FILES)[0]),
                remaining_ids,
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
            lockfile_line = (
                "  '" + suppressions.AWS_CRYPTO_LOCKFILE_PACKAGE + "@5.0.0': {}"
            )
            (root / "pnpm-lock.yaml").write_text(lockfile_line + "\n", encoding="utf-8")
            data = {
                "runs": [{
                    "results": [{
                        "ruleId": "DS126858",
                        "locations": [{
                            "physicalLocation": {
                                "artifactLocation": {"uri": "pnpm-lock.yaml"},
                                "region": {
                    "startLine": 1,
                    "startColumn": lockfile_line.index("sha" + "1") + 1,
                    "endColumn": lockfile_line.index("sha" + "1") + len("sha" + "1") + 1,
                    "snippet": {"text": "sha" + "1"},
                },
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





class KnownFalsePositiveRegressionTests(unittest.TestCase):
    def test_sha256_template_checksum_is_suppressed_only_in_exact_file_and_value(self):
        source = '{\n  "sha256": "' + SHA256 + '",\n  "source": "core"\n}\n'
        value_start = source.splitlines()[1].index('"' + SHA256 + '"')
        region = {
            "startLine": 2,
            "startColumn": value_start + 1,
            "endColumn": value_start + len(SHA256) + 3,
        }
        self.assertTrue(
            suppressions.should_suppress_constitution_template_checksum(
                ".specify/memory/.constitution-template.json", source, region
            )
        )
        self.assertFalse(
            suppressions.should_suppress_constitution_template_checksum(
                ".specify/other.json", source, region
            )
        )
        self.assertFalse(
            suppressions.should_suppress_constitution_template_checksum(
                ".specify/memory/.constitution-template.json",
                source.replace('"sha256"', '"api_token"'),
                region,
            )
        )
        self.assertFalse(
            suppressions.should_suppress_constitution_template_checksum(
                ".specify/memory/.constitution-template.json",
                source,
                {"startLine": 2, "startColumn": 4, "endColumn": 4 + len(SHA256)},
            )
        )

    def test_actual_devskim_sarif_checksum_span_is_suppressed_and_removed(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            relative_path = Path(".specify/memory/.constitution-template.json")
            source = '{\n  "sha256": "' + SHA256 + '",\n  "source": "core"\n}\n'
            source_path = root / relative_path
            source_path.parent.mkdir(parents=True)
            source_path.write_text(source, encoding="utf-8")

            quoted_checksum = '"' + SHA256 + '"'
            region = {
                "startLine": 2,
                "startColumn": 12,
                "endLine": 2,
                "endColumn": 78,
                "charOffset": source.index(quoted_checksum),
                "charLength": len(quoted_checksum),
                "snippet": {"text": quoted_checksum},
            }

            # The actual DevSkim columns are one character early. Without the
            # validated absolute source span, this range must not be accepted.
            columns_only = {
                key: value
                for key, value in region.items()
                if key not in {"charOffset", "charLength", "snippet"}
            }
            self.assertFalse(
                suppressions.should_suppress_constitution_template_checksum(
                    relative_path.as_posix(), source, columns_only
                )
            )

            sarif_path = root / "devskim-alerts.sarif"
            sarif = {
                "runs": [{
                    "results": [{
                        "ruleId": "DS173237",
                        "level": "error",
                        "message": {"text": "Do not store tokens or keys in source code."},
                        "locations": [{
                            "physicalLocation": {
                                "artifactLocation": {"uri": relative_path.as_posix()},
                                "region": region,
                            }
                        }],
                    }]
                }]
            }
            sarif_path.write_text(json.dumps(sarif), encoding="utf-8")

            self.assertEqual(suppressions.suppress_sarif(sarif_path, root), 1)
            filtered = json.loads(sarif_path.read_text(encoding="utf-8"))
            self.assertEqual(filtered["runs"][0]["results"], [])

    def test_docs_manifest_pinned_github_revision_is_suppressed(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / ".docs" / "manifest.json"
            path.parent.mkdir()
            source = '{\n  "githubShas": {\n    "/example/project": "' + SHA + '"\n  }\n}\n'
            path.write_text(source, encoding="utf-8")
            value_start = source.splitlines()[2].index('"' + SHA + '"')
            self.assertTrue(
                suppressions.should_suppress_checksum_metadata_finding(
                    ".docs/manifest.json",
                    path,
                    source,
                    {
                        "startLine": 3,
                        "startColumn": value_start + 1,
                        "endColumn": value_start + len(SHA) + 3,
                    },
                )
            )

    def test_docs_manifest_does_not_suppress_hash_outside_revision_map(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / ".docs" / "manifest.json"
            path.parent.mkdir()
            source = '{\n  "sources": {\n    "api_token": "' + SHA + '"\n  },\n  "githubShas": {}\n}\n'
            path.write_text(source, encoding="utf-8")
            self.assertFalse(
                suppressions.should_suppress_checksum_metadata_finding(
                    ".docs/manifest.json",
                    path,
                    source,
                    {"startLine": 3, "startColumn": 19, "endColumn": 19 + len(SHA)},
                )
            )

    def test_speckit_file_checksum_is_suppressed_only_in_manifest_files_map(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / ".specify" / "integrations" / "speckit.manifest.json"
            path.parent.mkdir(parents=True)
            source = '{\n  "files": {\n    ".specify/example.sh": "' + SHA256 + '"\n  }\n}\n'
            path.write_text(source, encoding="utf-8")
            value_start = source.splitlines()[2].index('"' + SHA256 + '"')
            self.assertTrue(
                suppressions.should_suppress_checksum_metadata_finding(
                    ".specify/integrations/speckit.manifest.json",
                    path,
                    source,
                    {
                        "startLine": 3,
                        "startColumn": value_start + 1,
                        "endColumn": value_start + len(SHA256) + 3,
                    },
                )
            )


    def test_speckit_file_checksum_is_suppressed_with_devskim_offset(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / ".specify" / "integrations" / "speckit.manifest.json"
            path.parent.mkdir(parents=True)
            source = '{\n  "files": {\n    ".specify/example.sh": "' + SHA256 + '"\n  }\n}\n'
            path.write_text(source, encoding="utf-8")
            value_start = source.splitlines()[2].index('"' + SHA256 + '"')
            # Simulated DevSkim region including the space before the quote
            self.assertTrue(
                suppressions.should_suppress_checksum_metadata_finding(
                    ".specify/integrations/speckit.manifest.json",
                    path,
                    source,
                    {
                        "startLine": 3,
                        "startColumn": value_start,  # Simulate the historical one-column-early field
                        "endColumn": value_start + len(SHA256) + 3,
                        "charOffset": source.index('"' + SHA256 + '"'),
                        "charLength": len(SHA256) + 2,
                        "snippet": {"text": '"' + SHA256 + '"'},
                    },
                )
            )

    def test_callable_settimeout_callback_is_not_string_code_execution(self):
        line = "const timer = setTimeout(() => updateCanvas(), 200);"
        start_column = line.index("setTimeout") + 1
        region = {
            "startLine": 1,
            "startColumn": start_column,
            "endColumn": start_column + len("setTimeout"),
        }
        self.assertTrue(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411", "app/homepage/HomePage.js", line, region
            )
        )

    def test_safe_timer_elsewhere_on_a_line_cannot_hide_an_unrelated_finding(self):
        line = "const timer = setTimeout(() => updateCanvas(), 200); unrelatedCall(userInput);"
        start_column = line.index("unrelatedCall") + 1
        region = {
            "startLine": 1,
            "startColumn": start_column,
            "endColumn": start_column + len("unrelatedCall"),
        }
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411", "app/homepage/HomePage.js", line, region
            )
        )

    def test_timer_finding_with_truncated_source_range_is_not_suppressed(self):
        line = "setTimeout(() => updateCanvas(), 200);"
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411",
                "app/homepage/HomePage.js",
                line,
                {"startLine": 1, "startColumn": 1, "endColumn": 2},
            )
        )

    def test_contextual_timer_with_out_of_file_end_line_is_not_suppressed(self):
        line = "setTimeout(() => updateCanvas(), 200);"
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411",
                "app/homepage/HomePage.js",
                line,
                {
                    "startLine": 1,
                    "startColumn": 1,
                    "endLine": 2,
                    "endColumn": 1,
                },
            )
        )

    def test_devskim_absolute_source_span_handles_off_by_one_columns(self):
        line = "      setTimeout(() => updateCanvas(), 200);"
        region = {
            "startLine": 1,
            # Historical DevSkim SARIF column fields can be one column early.
            "startColumn": 6,
            "endLine": 1,
            "endColumn": 16,
            "charOffset": line.index("setTimeout"),
            "charLength": len("setTimeout"),
            "snippet": {"text": "setTimeout"},
        }
        self.assertTrue(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411", "app/homepage/HomePage.js", line, region
            )
        )

        wrong_offset_region = dict(region)
        wrong_offset_region["charOffset"] += 1
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411", "app/homepage/HomePage.js", line, wrong_offset_region
            )
        )

    def test_contextual_timer_finding_without_columns_is_not_suppressed(self):
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411",
                "app/homepage/HomePage.js",
                "setTimeout(() => updateCanvas(), 200);",
                {"startLine": 1},
            )
        )

    def test_string_or_opaque_settimeout_callback_is_not_suppressed(self):
        for line in (
            "setTimeout(untrustedCallback, 100);",
            "setTimeout('untrusted code', 100);",
        ):
            with self.subTest(line=line):
                start_column = line.index("setTimeout") + 1
                self.assertFalse(
                    suppressions.should_suppress_safe_contextual_finding(
                        "DS172411",
                        "app/homepage/HomePage.js",
                        line,
                        {
                            "startLine": 1,
                            "startColumn": start_column,
                            "endColumn": start_column + len("setTimeout"),
                        },
                    )
                )

    def test_playwright_test_timeout_configuration_is_suppressed_only_in_tests(self):
        line = "test.setTimeout(120_000);"
        start_column = line.index("setTimeout") + 1
        region = {
            "startLine": 1,
            "startColumn": start_column,
            "endColumn": start_column + len("setTimeout"),
        }
        for path in (
            "tests/visual/homepage.spec.ts",
            "tests/visual/map-marker-interaction.spec.ts",
            "tests/visual/lucky-stories-pagination.spec.ts",
        ):
            with self.subTest(path=path):
                self.assertTrue(
                    suppressions.should_suppress_safe_contextual_finding(
                        "DS172411", path, line, region
                    )
                )
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411", "app/homepage/HomePage.js", line, region
            )
        )
        unsafe_line = "test.setTimeout(request.timeout);"
        unsafe_start = unsafe_line.index("setTimeout") + 1
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411",
                "tests/visual/map-marker-interaction.spec.ts",
                unsafe_line,
                {
                    "startLine": 1,
                    "startColumn": unsafe_start,
                    "endColumn": unsafe_start + len("setTimeout"),
                },
            )
        )

    def test_loopback_test_fixture_is_suppressed_only_in_known_test_file(self):
        loopback_address = "127.0." + "0.1"
        line = f"getClientIp: vi.fn().mockReturnValue('{loopback_address}'),"
        start_column = line.index(loopback_address) + 1
        region = {
            "startLine": 1,
            "startColumn": start_column,
            "endColumn": start_column + len(loopback_address),
        }
        self.assertTrue(
            suppressions.should_suppress_safe_contextual_finding(
                "DS162092", "app/admin/suggestions/route.test.js", line, region
            )
        )

        unrelated_offset = line.index("getClientIp")
        unrelated_region = {
            "startLine": 1,
            "startColumn": unrelated_offset + 1,
            "endColumn": unrelated_offset + len("getClientIp") + 1,
        }
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS162092", "app/admin/suggestions/route.test.js", line, unrelated_region
            )
        )
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS162092",
                "app/api/oracle/route.js",
                f"const ip = '{loopback_address}';",
                region,
            )
        )

    def test_documented_localhost_development_origin_is_suppressed(self):
        localhost_origin = "http://local" + "host:3000"
        source = (
            "const ALLOWED_ORIGINS = [\n"
            "  'https://luckypickcanada.ca',\n"
            "  // DevSkim: ignore DS162092\n"
            f"  '{localhost_origin}',\n"
            "];\n"
        )
        origin_line = source.splitlines()[3]
        start_column = origin_line.index("localhost") + 1
        region = {
            "startLine": 4,
            "startColumn": start_column,
            "endColumn": start_column + len("localhost"),
        }
        self.assertTrue(
            suppressions.should_suppress_safe_contextual_finding(
                "DS162092", "app/api/oracle/route.js", source, region
            )
        )
        wrong_offset = origin_line.index("http")
        wrong_region = {
            "startLine": 4,
            "startColumn": wrong_offset + 1,
            "endColumn": wrong_offset + len("http") + 1,
        }
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS162092", "app/api/oracle/route.js", source, wrong_region
            )
        )

    def test_localhost_origin_without_explicit_context_is_not_suppressed(self):
        localhost_origin = "http://local" + "host:3000"
        source = f"const config = '{localhost_origin}';\n"
        line = source.splitlines()[0]
        start_column = line.index("localhost") + 1
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS162092",
                "app/api/oracle/route.js",
                source,
                {
                    "startLine": 1,
                    "startColumn": start_column,
                    "endColumn": start_column + len("localhost"),
                },
            )
        )

    def test_scanner_self_test_localhost_and_http_warnings_match_exact_fixture_tokens(self):
        localhost_line = 'localhost_origin = "http://local" + "host:3000"; unrelatedCall(userInput)'
        localhost_start = localhost_line.index("localhost") + 1
        self.assertTrue(
            suppressions.should_suppress_safe_contextual_finding(
                "DS162092",
                ".github/scripts/test_suppress_devskim_false_positives.py",
                localhost_line,
                {
                    "startLine": 1,
                    "startColumn": localhost_start,
                    "endColumn": localhost_start + len("localhost"),
                },
            )
        )
        eval_start = localhost_line.index("unrelatedCall") + 1
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS162092",
                ".github/scripts/test_suppress_devskim_false_positives.py",
                localhost_line,
                {
                    "startLine": 1,
                    "startColumn": eval_start,
                    "endColumn": eval_start + len("unrelatedCall"),
                },
            )
        )

        http_line = 'KNOWN_LOCALHOST_ORIGINS = {"test": {"http://local" + "host:3000"}}'
        http_start = http_line.index("http://local") + 1
        self.assertTrue(
            suppressions.should_suppress_safe_contextual_finding(
                "DS137138",
                ".github/scripts/suppress_devskim_false_positives.py",
                http_line,
                {
                    "startLine": 1,
                    "startColumn": http_start,
                    "endColumn": http_start + len("http://local"),
                },
            )
        )
        other_start = http_line.index("KNOWN_LOCALHOST_ORIGINS") + 1
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS137138",
                ".github/scripts/suppress_devskim_false_positives.py",
                http_line,
                {
                    "startLine": 1,
                    "startColumn": other_start,
                    "endColumn": other_start + len("KNOWN_LOCALHOST_ORIGINS"),
                },
            )
        )

    def test_security_test_regex_false_positive_requires_known_test_context(self):
        source = (
            "    // Static source check only: this matches the route email template, not rendered HTML.\n"
            "    // DevSkim: ignore DS610000\n"
            '    const anchor = routeSource.match(/<a href=\"\\$\\{revealUrl\\}\" target=\"_blank\"[^>]*>/);\n'
        )
        regex_line = source.splitlines()[2]
        start_offset = regex_line.index("<a href=")
        end_offset = regex_line.index('target="_blank"', start_offset) + len('target="_blank"')
        region = {
            "startLine": 3,
            "startColumn": start_offset + 1,
            "endColumn": end_offset + 1,
        }
        self.assertTrue(
            suppressions.should_suppress_safe_contextual_finding(
                "DS610000", "__tests__/security-payment.test.js", source, region
            )
        )
        wrong_offset = regex_line.index("routeSource.match")
        wrong_region = {
            "startLine": 3,
            "startColumn": wrong_offset + 1,
            "endColumn": wrong_offset + len("routeSource.match") + 1,
        }
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS610000", "__tests__/security-payment.test.js", source, wrong_region
            )
        )
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS610000", "app/api/send-gift/route.ts", source, region
            )
        )

    def test_new_verified_false_positive_justifications_are_removed_from_sarif(self):
        justifications = [
            "False positive: a complete SHA/UUID/checksum value in an explicitly allowlisted metadata field overlaps the reported finding.",
            "False positive: this exact SHA value is a pinned upstream revision or tracked-file checksum in an allowlisted manifest map.",
            "False positive: this is the checked-in SHA-256 digest of the constitution template, not a credential.",
            "False positive: this is a callable timer callback or a test-runner timeout configuration, not string-based code execution by setTimeout.",
            "False positive: this is an explicitly identified development loopback origin or test-only loopback fixture, not shipped debug code.",
            "False positive: this is an explicitly identified development loopback origin or test-only loopback fixture, not a shipped insecure URL.",
            "False positive: the finding is on a static source-matching regex in a security test; the test verifies the real route has rel protections.",
            "False positive: this finding is in a specifically allowlisted dependency package name, not a weak-hash implementation.",
            "False positive: the reported substring is inside a valid, canonical SHA-512 package-integrity digest, not a hash algorithm invocation.",
            "False positive: this loopback origin appears only in local Playwright server configuration or a committed browser-probe/performance report, not in shipped production code.",
        ]
        data = {
            "runs": [{
                "results": [
                    {"ruleId": "DS173237", "suppressions": [{"kind": "external", "justification": item}]}
                    for item in justifications
                ] + [
                    {"ruleId": "DS172411", "suppressions": [{"kind": "external", "justification": "Unreviewed suppression"}]}
                ]
            }]
        }

        self.assertEqual(suppressions.remove_verified_false_positive_results(data), len(justifications))
        self.assertEqual(
            [result["ruleId"] for result in data["runs"][0]["results"]],
            ["DS172411"],
        )



class DevSkimWorkflowFailureSafetyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workflow_path = Path(__file__).resolve().parents[1] / "workflows" / "devskim.yml"
        cls.workflow_text = cls.workflow_path.read_text(encoding="utf-8")

    def _step_block(self, name):
        marker = f"      - name: {name}"
        start = self.workflow_text.find(marker)
        self.assertGreaterEqual(start, 0, f"Workflow step not found: {name}")
        next_step = self.workflow_text.find("\n      - name: ", start + len(marker))
        return self.workflow_text[start:] if next_step < 0 else self.workflow_text[start:next_step]

    def test_suppression_failures_fail_the_scan_job(self):
        for name in (
            "Test DevSkim suppression filter",
            "Replay real DevSkim SARIF through the suppression filter",
            "Suppress DevSkim false positives in SARIF",
        ):
            with self.subTest(step=name):
                self.assertNotIn("continue-on-error:", self._step_block(name))

    def test_report_update_depends_on_successful_lint_without_always_override(self):
        start = self.workflow_text.index("  update-report:\n")
        end = self.workflow_text.index("    steps:\n", start)
        report_header = self.workflow_text[start:end]
        self.assertIn("needs: lint", report_header)
        self.assertNotIn("always()", report_header)

    def test_real_sarif_replay_runs_before_the_suppression_step(self):
        replay_step = self._step_block(
            "Replay real DevSkim SARIF through the suppression filter"
        )
        self.assertIn(
            "python3 .github/scripts/verify_devskim_sarif_replay.py", replay_step
        )
        self.assertLess(
            self.workflow_text.index(
                "      - name: Replay real DevSkim SARIF through the suppression filter"
            ),
            self.workflow_text.index(
                "      - name: Suppress DevSkim false positives in SARIF"
            ),
        )

    def test_raw_sarif_and_artifact_are_still_uploaded_after_a_suppression_failure(self):
        for name in (
            "Upload DevSkim scan results to GitHub Security tab",
            "Upload DevSkim alerts files",
        ):
            with self.subTest(step=name):
                step = self._step_block(name)
                self.assertIn("if: always() && hashFiles('devskim-alerts.sarif') != ''", step)

class DevSkimUtf16OffsetTests(unittest.TestCase):
    """DevSkim reports charOffset/charLength as UTF-16 code units.

    The two audited Playwright specs are the regression source: the sitewide
    spec contains astral characters, so its UTF-16 offsets diverge from Python
    code-point indices, while the ASCII-only gold CTA spec does not.

    Findings are located by scanning each spec's content for the audited
    timeout call, never by a stored line number. An unrelated copy edit to a
    spec (merging or adding a line) must not break the suppression tests.
    """

    REPO_ROOT = Path(__file__).resolve().parents[2]
    TESTS_DIR = REPO_ROOT / "tests" / "visual"
    SITEWIDE = "tests/visual/sitewide-gold-cta.spec.ts"
    GOLD = "tests/visual/gold-cta.spec.ts"
    AUDITED_SPECS = (SITEWIDE, GOLD)
    # Split in source so the scanner's own fixture text cannot itself be
    # reported as string-based timer code execution.
    CALL_PREFIX = "test." + "setTimeout("
    TIMEOUT_CALL_PATTERN = re.compile(
        r"^[ \t]*" + re.escape(CALL_PREFIX) + r"(?P<millis>[0-9][0-9_]*)\);[ \t]*$"
    )
    TIMEOUT_TOKEN_PATTERN = re.compile(r"setTimeout\([0-9][0-9_]*\)")

    @classmethod
    def _source_text(cls, relative_path):
        return (cls.REPO_ROOT / relative_path).read_text(encoding="utf-8")

    @classmethod
    def _timeout_lines(cls, source_text):
        """Return 1-based line numbers of the audited timeout calls in source."""
        return [
            number
            for number, line in enumerate(source_text.splitlines(), start=1)
            if cls.TIMEOUT_CALL_PATTERN.match(line)
        ]

    @staticmethod
    def _utf16_units(source_text: str, code_point_index: int) -> int:
        return len(source_text[:code_point_index].encode("utf-16-le")) // 2

    def _region_for_line(self, source_text: str, line_number: int) -> dict:
        lines = source_text.splitlines()
        line = lines[line_number - 1]
        token_match = self.TIMEOUT_TOKEN_PATTERN.search(line)
        self.assertIsNotNone(token_match, f"No timeout token on line {line_number}")
        token = token_match.group(0)
        absolute = sum(len(item) + 1 for item in lines[: line_number - 1])
        start = absolute + line.index("setTimeout")
        return {
            "startLine": line_number,
            "startColumn": 9,
            "endLine": line_number,
            "endColumn": 9 + len(token),
            "charOffset": self._utf16_units(source_text, start),
            "charLength": len(token),
            "snippet": {"text": token},
        }

    def _code_point_offset(self, source_text: str, line_number: int) -> int:
        lines = source_text.splitlines()
        return sum(
            len(item) + 1 for item in lines[: line_number - 1]
        ) + lines[line_number - 1].index("setTimeout")

    def _assert_audited_coverage_present(self):
        """The audited fixture must still find timeouts in every listed spec."""
        for relative_path in self.AUDITED_SPECS:
            source_text = self._source_text(relative_path)
            with self.subTest(path=relative_path):
                self.assertTrue(
                    self._timeout_lines(source_text),
                    f"{relative_path} no longer contains the audited "
                    f"{self.CALL_PREFIX}<number>); fixture line",
                )

    def test_audited_playwright_specs_are_the_only_cta_entries_allowlisted(self):
        self.assertTrue(suppressions.is_allowed_relative_path(Path(self.SITEWIDE)))
        self.assertTrue(suppressions.is_allowed_relative_path(Path(self.GOLD)))
        self.assertFalse(
            suppressions.is_allowed_relative_path(
                Path("tests/visual/unreviewed-gold-cta.spec.ts")
            )
        )

    def test_real_playwright_timeout_findings_validate_against_utf16_offsets(self):
        self._assert_audited_coverage_present()
        for relative_path in self.AUDITED_SPECS:
            source_text = self._source_text(relative_path)
            for line_number in self._timeout_lines(source_text):
                with self.subTest(path=relative_path, line=line_number):
                    region = self._region_for_line(source_text, line_number)
                    self.assertIsNotNone(
                        suppressions._absolute_source_span(region, source_text)
                    )
                    self.assertTrue(
                        suppressions.should_suppress_safe_contextual_finding(
                            "DS172411", relative_path, source_text, region
                        )
                    )

    def test_utf16_normalization_is_identity_for_ascii_source(self):
        source_text = "const x = 1;\nsetTimeout(() => updateCanvas(), 200);\n"
        index = source_text.index("setTimeout")
        self.assertEqual(
            suppressions._code_point_offset_from_utf16_offset(source_text, index),
            index,
        )

    def test_audited_specs_still_exercise_utf16_divergence(self):
        """An astral-containing spec must keep diverging UTF-16 and code-point offsets.

        If the astral content is ever removed, the UTF-16 conversion this
        fixture protects would silently stop being exercised.
        """
        diverging_files = []
        for relative_path in self.AUDITED_SPECS:
            source_text = self._source_text(relative_path)
            has_astral = any(ord(character) > 0xFFFF for character in source_text)
            diverges = any(
                self._region_for_line(source_text, line_number)["charOffset"]
                != self._code_point_offset(source_text, line_number)
                for line_number in self._timeout_lines(source_text)
            )
            if diverges:
                diverging_files.append(relative_path)
            if has_astral:
                self.assertTrue(
                    diverges,
                    f"{relative_path} contains astral characters but no audited "
                    "timeout follows them, so UTF-16 divergence is untested",
                )
        self.assertTrue(
            diverging_files,
            "No audited spec still exercises the UTF-16/code-point divergence",
        )

    def test_code_point_offsets_for_astral_source_are_rejected(self):
        relative_path = self.SITEWIDE
        source_text = self._source_text(relative_path)
        for line_number in self._timeout_lines(source_text):
            with self.subTest(line=line_number):
                region = self._region_for_line(source_text, line_number)
                # Treating DevSkim's UTF-16 offset as a code-point index skips
                # characters once astral content precedes the finding.
                code_point_offset = self._code_point_offset(source_text, line_number)
                self.assertNotEqual(region["charOffset"], code_point_offset)
                region["charOffset"] = code_point_offset
                self.assertIsNone(
                    suppressions._absolute_source_span(region, source_text)
                )
                self.assertFalse(
                    suppressions.should_suppress_safe_contextual_finding(
                        "DS172411", relative_path, source_text, region
                    )
                )

    def test_offset_splitting_a_surrogate_pair_fails_closed(self):
        source_text = "// \U0001f340\nsetTimeout(untrustedCallback, 100);\n"
        # "// " is 3 units, so the emoji occupies units 3-4 and the newline is 5.
        inside_pair = 4
        self.assertIsNone(
            suppressions._code_point_offset_from_utf16_offset(
                source_text, inside_pair
            )
        )

    def test_off_by_one_utf16_offset_is_not_suppressed(self):
        relative_path = self.SITEWIDE
        source_text = self._source_text(relative_path)
        region = self._region_for_line(
            source_text, self._timeout_lines(source_text)[0]
        )
        region["charOffset"] += 1
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411", relative_path, source_text, region
            )
        )

    def test_unrelated_path_with_identical_utf16_region_is_not_suppressed(self):
        source_text = self._source_text(self.SITEWIDE)
        region = self._region_for_line(
            source_text, self._timeout_lines(source_text)[0]
        )
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411", "app/homepage/HomePage.js", source_text, region
            )
        )

    def test_unrelated_line_removal_keeps_the_audited_fixture_working(self):
        """Regression: PR #1674 merged two CTA wording lines into one.

        That removed one line above every audited finding. The fixture used to
        store absolute line numbers, so the tests failed with AssertionError and
        "ValueError: substring not found" even though the suppression logic was
        correct. Discovery must follow the content instead.
        """
        source_text = self._source_text(self.SITEWIDE)
        baseline = self._timeout_lines(source_text)
        self.assertTrue(baseline)

        lines = source_text.splitlines()
        del lines[1]
        edited_text = "\n".join(lines) + "\n"
        shifted = self._timeout_lines(edited_text)
        self.assertEqual(shifted, [number - 1 for number in baseline])
        for line_number in shifted:
            region = self._region_for_line(edited_text, line_number)
            self.assertIsNotNone(
                suppressions._absolute_source_span(region, edited_text)
            )
            self.assertTrue(
                suppressions.should_suppress_safe_contextual_finding(
                    "DS172411", self.SITEWIDE, edited_text, region
                )
            )

    def test_unrelated_line_insertion_keeps_the_audited_fixture_working(self):
        source_text = self._source_text(self.GOLD)
        baseline = self._timeout_lines(source_text)
        self.assertTrue(baseline)

        edited_text = "// unrelated inserted line\n" + source_text
        shifted = self._timeout_lines(edited_text)
        self.assertEqual(shifted, [number + 1 for number in baseline])
        for line_number in shifted:
            region = self._region_for_line(edited_text, line_number)
            self.assertIsNotNone(
                suppressions._absolute_source_span(region, edited_text)
            )
            self.assertTrue(
                suppressions.should_suppress_safe_contextual_finding(
                    "DS172411", self.GOLD, edited_text, region
                )
            )

    def test_filtered_sarif_replay_removes_only_the_verified_playwright_results(self):
        source_text = self._source_text(self.SITEWIDE)
        audited_lines = self._timeout_lines(source_text)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / self.SITEWIDE
            target.parent.mkdir(parents=True)
            target.write_text(source_text, encoding="utf-8")

            results = []
            for line_number in audited_lines:
                results.append(
                    {
                        "ruleId": "DS172411",
                        "locations": [
                            {
                                "physicalLocation": {
                                    "artifactLocation": {"uri": self.SITEWIDE},
                                    "region": self._region_for_line(
                                        source_text, line_number
                                    ),
                                }
                            }
                        ],
                    }
                )
            # Genuine findings that must survive: a timer far from the reviewed
            # test-timeout token, and a finding in a non-allowlisted path.
            unrelated_line = next(
                number
                for number in range(1, len(source_text.splitlines()) + 1)
                if number not in audited_lines
            )
            results.append(
                {
                    "ruleId": "DS172411",
                    "locations": [
                        {
                            "physicalLocation": {
                                "artifactLocation": {"uri": self.SITEWIDE},
                                "region": {
                                    "startLine": unrelated_line,
                                    "startColumn": 3,
                                    "endColumn": 12,
                                },
                            }
                        }
                    ],
                }
            )
            results.append(
                {
                    "ruleId": "DS172411",
                    "locations": [
                        {
                            "physicalLocation": {
                                "artifactLocation": {
                                    "uri": "app/homepage/HomePage.js"
                                },
                                "region": {
                                    "startLine": 1,
                                    "startColumn": 1,
                                    "endColumn": 12,
                                },
                            }
                        }
                    ],
                }
            )

            sarif_path = root / "devskim-alerts.sarif"
            sarif_path.write_text(
                json.dumps({"runs": [{"results": results}]}), encoding="utf-8"
            )
            suppressions.suppress_sarif(sarif_path, workspace=root)

            filtered = json.loads(sarif_path.read_text(encoding="utf-8"))
            self.assertEqual(len(filtered["runs"][0]["results"]), 2)
            self.assertEqual(
                [
                    item["locations"][0]["physicalLocation"]["artifactLocation"]["uri"]
                    for item in filtered["runs"][0]["results"]
                ],
                [self.SITEWIDE, "app/homepage/HomePage.js"],
            )


class DevSkimSarifReplayVerificationTests(unittest.TestCase):
    """The CI replay must fail on a real survivor, not merely print counts."""

    SITEWIDE = DevSkimUtf16OffsetTests.SITEWIDE

    @staticmethod
    def _offset_fixture():
        return DevSkimUtf16OffsetTests(
            "test_utf16_normalization_is_identity_for_ascii_source"
        )

    def _write_audited_workspace(self, root):
        """Copy the real audited spec into a scratch workspace."""
        source_text = (DevSkimUtf16OffsetTests.REPO_ROOT / self.SITEWIDE).read_text(
            encoding="utf-8"
        )
        target = root / self.SITEWIDE
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(source_text, encoding="utf-8")
        line_number = DevSkimUtf16OffsetTests._timeout_lines(source_text)[0]
        region = self._offset_fixture()._region_for_line(source_text, line_number)
        return line_number, region

    @staticmethod
    def _result(uri, region, rule_id="DS172411"):
        return {
            "ruleId": rule_id,
            "locations": [
                {
                    "physicalLocation": {
                        "artifactLocation": {"uri": uri},
                        "region": region,
                    }
                }
            ],
        }

    def _write_sarif(self, root, results):
        sarif_path = root / "devskim-alerts.sarif"
        sarif_path.write_text(
            json.dumps({"runs": [{"results": results}]}), encoding="utf-8"
        )
        return sarif_path

    def test_replay_removes_the_audited_timeout_and_preserves_the_raw_sarif(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _line_number, region = self._write_audited_workspace(root)
            sarif_path = self._write_sarif(
                root,
                [
                    self._result(self.SITEWIDE, region),
                    # A genuine finding outside the allowlist must survive.
                    self._result(
                        "app/api/checkout/route.js",
                        {"startLine": 1, "startColumn": 1, "endColumn": 12},
                    ),
                ],
            )
            raw_before = sarif_path.read_bytes()

            report = replay_check.replay(sarif_path, root)

            self.assertEqual(report.raw_results, 2)
            self.assertEqual(report.suppressed, 1)
            self.assertEqual(report.removed_results, 1)
            self.assertEqual(report.filtered_results, 1)
            self.assertEqual(
                report.audited_removed,
                ["Playwright test timeout configuration (1)"],
            )
            self.assertEqual(sarif_path.read_bytes(), raw_before)

    def test_replay_fails_when_the_audited_finding_survives_the_filter(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            line_number, _region = self._write_audited_workspace(root)
            # A scanner region the predicate cannot validate (for example a
            # changed offset convention) leaves the audited finding in the
            # upload. That is exactly the regression this gate must catch.
            region = {"startLine": line_number, "startColumn": 1, "endColumn": 2}
            sarif_path = self._write_sarif(
                root, [self._result(self.SITEWIDE, region)]
            )

            with self.assertRaises(replay_check.ReplayViolation) as raised:
                replay_check.replay(sarif_path, root)
            self.assertIn("survived", str(raised.exception))

    def test_replay_fails_when_a_finding_outside_the_allowlist_is_filtered(self):
        approved_justification = next(
            item
            for item in suppressions.VERIFIED_FALSE_POSITIVE_JUSTIFICATIONS
            if "timer callback" in item
        )
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            result = self._result(
                "app/api/checkout/route.js",
                {"startLine": 1, "startColumn": 1, "endColumn": 12},
            )
            result["suppressions"] = (
                [{"kind": "external", "justification": approved_justification}]
            )
            sarif_path = self._write_sarif(root, [result])

            with self.assertRaises(replay_check.ReplayViolation) as raised:
                replay_check.replay(sarif_path, root)
            self.assertIn("outside the verified allowlist", str(raised.exception))

    def test_replay_fails_when_the_scanner_sarif_is_missing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaises(replay_check.ReplayViolation):
                replay_check.replay(root / "devskim-alerts.sarif", root)




class LuckyRevealTimerSuppressionTests(unittest.TestCase):
    """Guard only the four reviewed reveal-related DS172411 false positives."""

    CASES = (
        (
            "app/lucky-reveal-popup.js",
            "    const timer = window.setTimeout(() => setIsNumberFinishActive(false), NUMBER_FINISH_TOTAL_MS);",
        ),
        (
            "app/lucky-reveal-celebration.jsx",
            "            window.setTimeout(() => {",
        ),
        (
            "app/lucky-reveal-celebration.jsx",
            "    const startTimer = window.setTimeout(() => {",
        ),
        (
            "__tests__/lucky-reveal-finish-phase2.test.js",
            "      'window.setTimeout(() => setIsNumberFinishActive(false), NUMBER_FINISH_TOTAL_MS)',",
        ),
    )

    @staticmethod
    def _result(relative_path, line, result_id, line_number, char_offset, rule_id="DS172411"):
        offset_in_line = line.index("setTimeout")
        return {
            "ruleId": rule_id,
            "message": {"text": "Review setTimeout for untrusted data"},
            "properties": {"testId": result_id},
            "locations": [{
                "physicalLocation": {
                    "artifactLocation": {"uri": relative_path},
                    "region": {
                        "startLine": line_number,
                        "endLine": line_number,
                        "startColumn": offset_in_line + 1,
                        "endColumn": offset_in_line + len("setTimeout") + 1,
                        # Real DevSkim uses UTF-16 char offsets. These fixtures
                        # are intentionally ASCII, so the code-point index is equal.
                        "charOffset": char_offset + offset_in_line,
                        "charLength": len("setTimeout"),
                        "snippet": {"text": "setTimeout"},
                    },
                }
            }],
        }

    def test_only_the_four_exact_reveal_findings_are_removed_from_sarif(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source_lines = {}
            results = []

            def add_case(relative_path, line, result_id, rule_id="DS172411"):
                lines = source_lines.setdefault(relative_path, [])
                char_offset = sum(len(existing) + 1 for existing in lines)
                lines.append(line)
                results.append(
                    self._result(
                        relative_path, line, result_id, len(lines), char_offset, rule_id
                    )
                )

            for index, (relative_path, line) in enumerate(self.CASES):
                add_case(relative_path, line, f"reviewed-{index}")

            # Negative controls: an opaque callback, an altered test string,
            # an unreviewed path, an unreviewed callback in an admitted file,
            # and a different rule in an otherwise admitted file.
            negative_cases = (
                (
                    "app/lucky-reveal-popup.js",
                    "window.setTimeout(untrustedCallback, 100);",
                    "opaque-callback",
                    "DS172411",
                ),
                (
                    "__tests__/lucky-reveal-finish-phase2.test.js",
                    "      'window.setTimeout(() => attackerControlled(), 100)',",
                    "different-test-literal",
                    "DS172411",
                ),
                (
                    "app/unreviewed-timer.js",
                    "window.setTimeout(() => refresh(), 100);",
                    "unreviewed-path",
                    "DS172411",
                ),
                (
                    "app/lucky-reveal-celebration.jsx",
                    "window.setTimeout(() => refresh(), 100);",
                    "unreviewed-callback-in-allowed-file",
                    "DS172411",
                ),
                (
                    "app/lucky-reveal-popup.js",
                    "window.setTimeout(() => refresh(), 100);",
                    "different-rule",
                    "DS162092",
                ),
            )
            for relative_path, line, result_id, rule_id in negative_cases:
                add_case(relative_path, line, result_id, rule_id)

            # Write each repository-relative file once so its line numbers and
            # absolute offsets remain consistent for every SARIF result.
            for relative_path, lines in source_lines.items():
                source = root / relative_path
                source.parent.mkdir(parents=True, exist_ok=True)
                source.write_text("\n".join(lines) + "\n", encoding="utf-8")

            for result in results:
                result_id = result["properties"]["testId"]
                if not result_id.startswith("reviewed-"):
                    continue
                physical = result["locations"][0]["physicalLocation"]
                relative_path = physical["artifactLocation"]["uri"]
                source_text = (root / relative_path).read_text(encoding="utf-8")
                self.assertIsNotNone(
                    suppressions.resolve_safe_artifact_uri(relative_path, root),
                    f"reviewed path was not admitted: {relative_path}",
                )
                self.assertTrue(
                    suppressions.should_suppress_safe_contextual_finding(
                        "DS172411", relative_path, source_text, physical["region"]
                    ),
                    f"reviewed source span was not matched: {relative_path}:"
                    f"{physical['region']['startLine']}",
                )

            sarif = {"runs": [{"results": results}]}
            self.assertEqual(suppressions.process_sarif(sarif, root), 4)
            self.assertEqual(suppressions.remove_verified_false_positive_results(sarif), 4)
            remaining = sarif["runs"][0]["results"]
            self.assertEqual(
                [result["properties"]["testId"] for result in remaining],
                [
                    "opaque-callback",
                    "different-test-literal",
                    "unreviewed-path",
                    "unreviewed-callback-in-allowed-file",
                    "different-rule",
                ],
            )

    def test_reveal_timeout_rules_do_not_suppress_opaque_function_references(self):
        for relative_path, line in (
            (
                "app/lucky-reveal-celebration.jsx",
                "    const timeoutTimer = window.setTimeout(settle, CONFETTI_WATCH_TIMEOUT_MS);",
            ),
            (
                "app/lucky-reveal-celebration.jsx",
                "    const timer = window.setTimeout(launch, Math.max(0, startDelayMs));",
            ),
        ):
            with self.subTest(line=line):
                with tempfile.TemporaryDirectory() as directory:
                    root = Path(directory)
                    source = root / relative_path
                    source.parent.mkdir(parents=True, exist_ok=True)
                    source.write_text(line + "\n", encoding="utf-8")
                    result = self._result(relative_path, line, "opaque", 1, 0)
                    sarif = {"runs": [{"results": [result]}]}
                    self.assertEqual(suppressions.process_sarif(sarif, root), 0)
                    self.assertNotIn("suppressions", sarif["runs"][0]["results"][0])


class LocalProbeOriginSuppressionTests(unittest.TestCase):
    """Guard local Playwright/probe loopback origins and the share revoke timer."""

    LOOPBACK = "127.0." + "0.1"
    PLAYWRIGHT = "playwright.config.ts"
    SHARE = "app/share-lucky-pick-button.js"

    @staticmethod
    def _write(root, relative_path, source_text):
        path = root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(source_text, encoding="utf-8")
        return path

    @staticmethod
    def _region(source_text, line_number, token, token_index):
        lines = source_text.splitlines()
        absolute = sum(len(line) + 1 for line in lines[: line_number - 1]) + token_index
        return {
            "startLine": line_number,
            "endLine": line_number,
            "startColumn": token_index + 1,
            "endColumn": token_index + len(token) + 1,
            # ASCII fixtures, so the UTF-16 offset equals the code-point index.
            "charOffset": absolute,
            "charLength": len(token),
            "snippet": {"text": token},
        }

    @classmethod
    def _result(cls, relative_path, region, rule_id="DS162092"):
        return {
            "ruleId": rule_id,
            "message": {"text": "Do not leave debug code in production"},
            "locations": [{
                "physicalLocation": {
                    "artifactLocation": {"uri": relative_path},
                    "region": region,
                }
            }],
        }

    def _loopback_url(self, port):
        # Split in source so this fixture file does not itself add an insecure-URL finding.
        return "http" + "://" + self.LOOPBACK + f":{port}/"

    def _playwright_source(self):
        return (
            "import { defineConfig } from '@playwright/test';\n"
            "\n"
            "export default defineConfig({\n"
            "  webServer: {\n"
            f"    command: `pnpm dev --hostname {self.LOOPBACK} --port ${{PORT}}`,\n"
            # Split in source so this fixture file adds no insecure-URL finding.
            f"    url: `http{'://'}{self.LOOPBACK}:${{PORT}}`,\n"
            "  },\n"
            "});\n"
        )

    def test_playwright_local_dev_server_origin_is_suppressed(self):
        source_text = self._playwright_source()
        line_number = 5
        line = source_text.splitlines()[line_number - 1]
        token_index = line.index(self.LOOPBACK)
        region = self._region(source_text, line_number, self.LOOPBACK, token_index)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._write(root, self.PLAYWRIGHT, source_text)
            sarif = {"runs": [{"results": [self._result(self.PLAYWRIGHT, region)]}]}
            self.assertEqual(suppressions.process_sarif(sarif, root), 1)
            self.assertEqual(
                suppressions.remove_verified_false_positive_results(sarif), 1
            )
            self.assertEqual(sarif["runs"][0]["results"], [])

    def test_playwright_unreviewed_loopback_line_is_not_suppressed(self):
        source_text = (
            "// Use http://" + self.LOOPBACK + ":3000 during local debugging.\n"
            "export default {};\n"
        )
        line = source_text.splitlines()[0]
        token_index = line.index(self.LOOPBACK)
        region = self._region(source_text, 1, self.LOOPBACK, token_index)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._write(root, self.PLAYWRIGHT, source_text)
            sarif = {"runs": [{"results": [self._result(self.PLAYWRIGHT, region)]}]}
            self.assertEqual(suppressions.process_sarif(sarif, root), 0)
            self.assertNotIn("suppressions", sarif["runs"][0]["results"][0])

    def test_probe_artifact_loopback_url_is_suppressed(self):
        relative_path = "artifacts/probe/report.json"
        source_text = (
            "{\n"
            f'  "baseUrl": "{self._loopback_url(3011)}",\n'
            '  "ranAt": "2026-11-03T09:01:38.742Z"\n'
            "}\n"
        )
        line = source_text.splitlines()[1]
        token_index = line.index(self.LOOPBACK)
        region = self._region(source_text, 2, self.LOOPBACK, token_index)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._write(root, relative_path, source_text)
            sarif = {"runs": [{"results": [self._result(relative_path, region)]}]}
            self.assertEqual(suppressions.process_sarif(sarif, root), 1)

    def test_probe_artifact_loopback_value_that_is_not_a_url_is_not_suppressed(self):
        relative_path = "artifacts/probe/report.json"
        source_text = "{\n  \"measuredIp\": \"" + self.LOOPBACK + "\"\n}\n"
        line = source_text.splitlines()[1]
        token_index = line.index(self.LOOPBACK)
        region = self._region(source_text, 2, self.LOOPBACK, token_index)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._write(root, relative_path, source_text)
            sarif = {"runs": [{"results": [self._result(relative_path, region)]}]}
            self.assertEqual(suppressions.process_sarif(sarif, root), 0)

    def test_malformed_probe_artifact_is_not_suppressed(self):
        relative_path = "artifacts/probe/report.json"
        source_text = '{\n  "baseUrl": "' + self._loopback_url(3011) + '"\n'
        line = source_text.splitlines()[1]
        token_index = line.index(self.LOOPBACK)
        region = self._region(source_text, 2, self.LOOPBACK, token_index)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._write(root, relative_path, source_text)
            sarif = {"runs": [{"results": [self._result(relative_path, region)]}]}
            self.assertEqual(suppressions.process_sarif(sarif, root), 0)

    def test_loopback_url_outside_the_probe_artifacts_directory_is_not_suppressed(self):
        relative_path = "app/data/report.json"
        source_text = "{\n  \"baseUrl\": \"" + self._loopback_url(3011) + "\"\n}\n"
        line = source_text.splitlines()[1]
        token_index = line.index(self.LOOPBACK)
        region = self._region(source_text, 2, self.LOOPBACK, token_index)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._write(root, relative_path, source_text)
            self.assertIsNone(suppressions.resolve_safe_artifact_uri(relative_path, root))
            sarif = {"runs": [{"results": [self._result(relative_path, region)]}]}
            self.assertEqual(suppressions.process_sarif(sarif, root), 0)

    def test_specs_performance_benchmark_path_allowlist_is_exact(self):
        accepted = (
            "specs/134-crystal-ball-experience-improvements/perf-baseline.json",
            "specs/134-crystal-ball-experience-improvements/perf-after.json",
        )
        rejected = (
            "specs/134-crystal-ball-experience-improvements/other.json",
            "specs/134-crystal-ball-experience-improvements/perf-current.json",
            "specs/134-crystal-ball-experience-improvements/nested/perf-after.json",
            "specs/experimental-feature/perf-after.json",
            "specs/perf-after.json",
            "specs/134-crystal-ball-experience-improvements/perf-after.json.bak",
        )

        for relative_path in accepted:
            with self.subTest(relative_path=relative_path):
                self.assertTrue(suppressions.is_local_specs_benchmark_path(relative_path))
                self.assertTrue(suppressions.is_local_probe_origin_path(relative_path))
                self.assertTrue(suppressions.is_allowed_relative_path(Path(relative_path)))

        for relative_path in rejected:
            with self.subTest(relative_path=relative_path):
                self.assertFalse(suppressions.is_local_specs_benchmark_path(relative_path))
                self.assertFalse(suppressions.is_local_probe_origin_path(relative_path))
                self.assertFalse(suppressions.is_allowed_relative_path(Path(relative_path)))

    def test_specs_performance_benchmark_loopback_urls_are_suppressed(self):
        for filename in ("perf-baseline.json", "perf-after.json"):
            relative_path = (
                "specs/134-crystal-ball-experience-improvements/" + filename
            )
            source_text = (
                "{\n"
                f'  "base": "{self._loopback_url(3007)}",\n'
                '  "label": "measurement"\n'
                "}\n"
            )
            line = source_text.splitlines()[1]
            token_index = line.index(self.LOOPBACK)
            region = self._region(source_text, 2, self.LOOPBACK, token_index)

            with self.subTest(relative_path=relative_path):
                with tempfile.TemporaryDirectory() as directory:
                    root = Path(directory)
                    self._write(root, relative_path, source_text)
                    self.assertEqual(
                        suppressions.resolve_safe_artifact_uri(relative_path, root),
                        (root / relative_path).resolve(),
                    )
                    sarif = {
                        "runs": [{
                            "results": [self._result(relative_path, region)]
                        }]
                    }
                    self.assertEqual(suppressions.process_sarif(sarif, root), 1)
                    self.assertEqual(
                        sarif["runs"][0]["results"][0]["suppressions"][0]["kind"],
                        "external",
                    )
                    self.assertEqual(
                        suppressions.remove_verified_false_positive_results(sarif),
                        1,
                    )
                    self.assertEqual(sarif["runs"][0]["results"], [])

    def test_specs_performance_benchmark_rejects_unreviewed_content_and_paths(self):
        cases = (
            (
                "specs/134-crystal-ball-experience-improvements/perf-after.json",
                '{\n  "measuredIp": "' + self.LOOPBACK + '"\n}\n',
            ),
            (
                "specs/134-crystal-ball-experience-improvements/other.json",
                '{\n  "base": "' + self._loopback_url(3007) + '"\n}\n',
            ),
            (
                "specs/134-crystal-ball-experience-improvements/perf-baseline.json",
                '{\n  "base": "' + self._loopback_url(3007) + '"\n',
            ),
        )
        for relative_path, source_text in cases:
            line_number = 2
            line = source_text.splitlines()[line_number - 1]
            token_index = line.index(self.LOOPBACK)
            region = self._region(source_text, line_number, self.LOOPBACK, token_index)

            with self.subTest(relative_path=relative_path, source_text=source_text):
                with tempfile.TemporaryDirectory() as directory:
                    root = Path(directory)
                    self._write(root, relative_path, source_text)
                    sarif = {
                        "runs": [{
                            "results": [self._result(relative_path, region)]
                        }]
                    }
                    self.assertEqual(suppressions.process_sarif(sarif, root), 0)
                    self.assertNotIn(
                        "suppressions", sarif["runs"][0]["results"][0]
                    )

    def test_share_image_revoke_timer_is_suppressed_only_for_the_exact_statement(self):
        positive_line = "    window.setTimeout(() => URL.revokeObjectURL(url), 1000);"
        negative_line = "    window.setTimeout(() => refresh(), 100);"
        source_text = positive_line + "\n" + negative_line + "\n"
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._write(root, self.SHARE, source_text)
            positive_index = positive_line.index("setTimeout")
            negative_index = negative_line.index("setTimeout")
            results = [
                self._result(
                    self.SHARE,
                    self._region(source_text, 1, "setTimeout", positive_index),
                    rule_id="DS172411",
                ),
                self._result(
                    self.SHARE,
                    self._region(source_text, 2, "setTimeout", negative_index),
                    rule_id="DS172411",
                ),
            ]
            sarif = {"runs": [{"results": results}]}
            self.assertEqual(suppressions.process_sarif(sarif, root), 1)
            remaining = sarif["runs"][0]["results"]
            self.assertEqual(len(remaining), 2)
            self.assertNotIn("suppressions", remaining[1])

    def test_share_revoke_statement_in_an_unreviewed_file_is_not_suppressed(self):
        line = "    window.setTimeout(() => URL.revokeObjectURL(url), 1000);"
        region = self._region(line + "\n", 1, "setTimeout", line.index("setTimeout"))
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.assertFalse(
                suppressions.is_local_probe_artifact_path(
                    "artifacts/reveal-phase2/report.json.bak"
                )
            )
            self._write(root, "app/share-image.js", line + "\n")
            self.assertIsNone(
                suppressions.resolve_safe_artifact_uri("app/share-image.js", root)
            )
            sarif = {
                "runs": [{
                    "results": [
                        self._result("app/share-image.js", region, rule_id="DS172411")
                    ]
                }]
            }
            self.assertEqual(suppressions.process_sarif(sarif, root), 0)
            self.assertNotIn("suppressions", sarif["runs"][0]["results"][0])


if __name__ == "__main__":
    unittest.main()


class Utf16IndexCacheTests(unittest.TestCase):
    """The cached index must translate every offset exactly like the reference scan."""

    def test_cached_conversion_matches_reference_for_every_offset(self):
        for text in ("", "abc", "a\U0001F600b", "\U0001F600\U0001F600x"):
            context = suppressions.SourceContext.from_text(text)
            total_units = len(text) + sum(
                1 for character in text if ord(character) > 0xFFFF
            )
            for offset in range(-2, total_units + 3):
                self.assertEqual(
                    suppressions._code_point_offset_from_utf16_offset(text, offset),
                    context.utf16_offset_to_index(offset),
                    f"{text!r} at offset {offset}",
                )

    def test_astral_character_index_is_built_once(self):
        context = suppressions.SourceContext.from_text("a\U0001F600b")
        context.utf16_offset_to_index(1)
        built = context._astral_indices
        context.utf16_offset_to_index(3)
        self.assertIs(context._astral_indices, built)


class SourceCacheEfficiencyTests(unittest.TestCase):
    """A scan must read and parse each allowlisted source once, not once per finding."""

    DIGEST = "a" * 40

    def build_workspace(self, directory):
        root = Path(directory)
        (root / ".docs").mkdir(parents=True)
        manifest = (
            '{\n  "githubShas": {\n    "/github/docs": "' + self.DIGEST + '"\n  }\n}\n'
        )
        manifest_path = root / ".docs" / "manifest.json"
        manifest_path.write_text(manifest, encoding="utf-8")
        return root, manifest_path, manifest

    def build_result(self, manifest):
        lines = manifest.splitlines()
        line_number = next(
            index
            for index, line in enumerate(lines, start=1)
            if self.DIGEST in line
        )
        line = lines[line_number - 1]
        column = line.index(self.DIGEST)
        absolute = sum(len(item) + 1 for item in lines[: line_number - 1]) + column
        return {
            "ruleId": "DS173237",
            "message": {"text": "Potential credential: " + self.DIGEST},
            "level": "warning",
            "locations": [
                {
                    "physicalLocation": {
                        "artifactLocation": {"uri": ".docs/manifest.json"},
                        "region": {
                            "startLine": line_number,
                            "endLine": line_number,
                            "startColumn": column + 1,
                            "endColumn": column + 1 + len(self.DIGEST),
                            "charOffset": absolute,
                            "charLength": len(self.DIGEST),
                            "snippet": {"text": self.DIGEST},
                        },
                    }
                }
            ],
        }

    def test_process_sarif_reads_each_allowlisted_source_once(self):
        with tempfile.TemporaryDirectory() as directory:
            root, manifest_path, manifest = self.build_workspace(directory)
            results = [self.build_result(manifest) for _ in range(5)]
            document = {"version": "2.1.0", "runs": [{"results": results}]}
            resolved = manifest_path.resolve()
            counter = {"reads": 0}
            original = Path.read_text

            def counting_read_text(path, *args, **kwargs):
                if path.resolve() == resolved:
                    counter["reads"] += 1
                return original(path, *args, **kwargs)

            with unittest.mock.patch.object(Path, "read_text", counting_read_text):
                suppressed = suppressions.process_sarif(document, root)

        self.assertEqual(suppressed, 5)
        self.assertEqual(counter["reads"], 1)

    def test_json_document_is_parsed_once_per_file(self):
        context = suppressions.SourceContext.from_text('{"a": 1}')
        with unittest.mock.patch("json.loads", wraps=json.loads) as loader:
            self.assertEqual(context.json_document(), {"a": 1})
            self.assertEqual(context.json_document(), {"a": 1})
            self.assertTrue(context.is_json())
        self.assertEqual(loader.call_count, 1)

    def test_json_object_line_range_is_decoded_once_per_key(self):
        manifest = '{\n  "githubShas": {\n    "/github/docs": "' + self.DIGEST + '"\n  }\n}\n'
        context = suppressions.SourceContext.from_text(manifest)
        with unittest.mock.patch.object(
            suppressions,
            "_line_range_for_json_object",
            wraps=suppressions._line_range_for_json_object,
        ) as decoder:
            first = context.line_range_for_json_object("githubShas")
            second = context.line_range_for_json_object("githubShas")
        self.assertEqual(first, second)
        self.assertEqual(first, (2, 4))
        self.assertEqual(decoder.call_count, 1)

    def test_cached_and_uncached_checksum_decisions_match(self):
        manifest = '{\n  "githubShas": {\n    "/github/docs": "' + self.DIGEST + '"\n  }\n}\n'
        result = self.build_result(manifest)
        region = result["locations"][0]["physicalLocation"]["region"]
        context = suppressions.SourceContext.from_text(manifest)
        self.assertTrue(
            suppressions.should_suppress_checksum_metadata_finding(
                ".docs/manifest.json", Path(".docs/manifest.json"), manifest, region
            )
        )
        self.assertTrue(
            suppressions.should_suppress_checksum_metadata_finding(
                ".docs/manifest.json",
                Path(".docs/manifest.json"),
                manifest,
                region,
                context=context,
            )
        )


class DevSkimReportIdentityTests(unittest.TestCase):
    """The shared report must keep distinct findings and never duplicate an entry."""

    def write_sarif(self, directory, results):
        path = Path(directory) / "devskim-alerts.sarif"
        path.write_text(
            json.dumps({"version": "2.1.0", "runs": [{"results": results}]}),
            encoding="utf-8",
        )
        return path

    def write_report(self, directory, entries=""):
        path = Path(directory) / "devskim-alerts.md"
        path.write_text(
            "# DevSkim alerts\n\n" + appender.MARKER + "\n" + entries,
            encoding="utf-8",
        )
        return path

    def test_distinct_findings_without_source_locations_are_both_recorded(self):
        with tempfile.TemporaryDirectory() as directory:
            sarif = self.write_sarif(
                directory,
                [
                    {
                        "ruleId": "DS000001",
                        "message": {"text": "First finding"},
                        "level": "warning",
                    },
                    {
                        "ruleId": "DS000001",
                        "message": {"text": "Second finding"},
                        "level": "warning",
                    },
                ],
            )
            report = self.write_report(directory)
            self.assertEqual(appender.append_findings(sarif, report), 2)
            contents = report.read_text(encoding="utf-8")
            self.assertIn("First finding", contents)
            self.assertIn("Second finding", contents)

    def test_identical_duplicate_results_are_recorded_once(self):
        with tempfile.TemporaryDirectory() as directory:
            result = {
                "ruleId": "DS000001",
                "message": {"text": "Same finding"},
                "level": "warning",
            }
            sarif = self.write_sarif(directory, [result, dict(result)])
            report = self.write_report(directory)
            self.assertEqual(appender.append_findings(sarif, report), 1)

    def test_existing_report_entry_is_not_duplicated_after_identity_refinement(self):
        with tempfile.TemporaryDirectory() as directory:
            result = {
                "ruleId": "DS000001",
                "message": {"text": "Recorded finding"},
                "level": "warning",
            }
            legacy_id = appender.finding_identities(
                "DS000001", appender.__dict__.get("NO_LOCATION", "Location not provided"), None, result
            )[1]
            sarif = self.write_sarif(directory, [result])
            entry = (
                "- **WARNING — DS000001** — `Location not provided` — Recorded finding "
                f"<!-- devskim-id:{legacy_id} -->\n"
            )
            report = self.write_report(directory, entry)
            before = report.read_text(encoding="utf-8")
            self.assertEqual(appender.append_findings(sarif, report), 0)
            self.assertEqual(report.read_text(encoding="utf-8"), before)


class ReviewedAlertBatchSuppressionTests(unittest.TestCase):
    """Guards the reviewed 2026-11-10 alert batch.

    Covers Playwright timeout configuration, the test-only documentation-refresh
    mock transport timer, the placeholder-text assertion, public identifiers, and
    loopback text that only appears inside committed probe-report strings.
    """

    ACCOUNT = "dbd3120f6fa0104b5fe" + "66c201ea4251b"
    REVISION = "0a808078d96496cf2a8fa725143c" + "870354f63cda"

    @staticmethod
    def _write(root, relative_path, text):
        path = root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    @staticmethod
    def _region(source_text, line_number, token):
        lines = source_text.splitlines()
        line = lines[line_number - 1]
        token_index = line.index(token)
        absolute = sum(len(item) + 1 for item in lines[: line_number - 1]) + token_index
        return {
            "startLine": line_number,
            "endLine": line_number,
            "startColumn": token_index + 1,
            "endColumn": token_index + len(token) + 1,
            # ASCII fixtures, so the UTF-16 offset equals the code-point index.
            "charOffset": absolute,
            "charLength": len(token),
            "snippet": {"text": token},
        }

    @staticmethod
    def _result(relative_path, region, rule_id, message):
        return {
            "ruleId": rule_id,
            "message": {"text": message},
            "locations": [{
                "physicalLocation": {
                    "artifactLocation": {"uri": relative_path},
                    "region": region,
                }
            }],
        }

    def _process(self, relative_path, source_text, line_number, token, rule_id, message="Finding"):
        region = self._region(source_text, line_number, token)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._write(root, relative_path, source_text)
            sarif = {
                "runs": [{
                    "results": [self._result(relative_path, region, rule_id, message)]
                }]
            }
            return suppressions.process_sarif(sarif, root)

    def test_playwright_timeout_in_reviewed_specs_is_suppressed(self):
        source = "test('x', async () => {\n    test.setTimeout(120_000);\n});\n"
        for relative_path in (
            "tests/visual/homepage-content-refresh.spec.ts",
            "tests/visual/mobile-accessibility.spec.ts",
        ):
            with self.subTest(relative_path=relative_path):
                self.assertEqual(
                    self._process(
                        relative_path,
                        source,
                        2,
                        "setTimeout",
                        "DS172411",
                        "Review setTimeout for untrusted data",
                    ),
                    1,
                )

    def test_playwright_timeout_in_an_unreviewed_spec_is_not_suppressed(self):
        source = "test('x', async () => {\n    test.setTimeout(120_000);\n});\n"
        self.assertEqual(
            self._process(
                "tests/visual/other.spec.ts", source, 2, "setTimeout", "DS172411"
            ),
            0,
        )

    def test_test_support_callable_timer_is_suppressed(self):
        source = "https.get = function () {\n  setTimeout(() => {\n    done();\n  }, 0);\n};\n"
        self.assertEqual(
            self._process(
                "scripts/test-support/mock-refresh-https.js",
                source,
                2,
                "setTimeout",
                "DS172411",
            ),
            1,
        )

    def test_test_support_string_timer_is_not_suppressed(self):
        source = "https.get = function () {\n  setTimeout('alert(1)', 0);\n};\n"
        self.assertEqual(
            self._process(
                "scripts/test-support/mock-refresh-https.js",
                source,
                2,
                "setTimeout",
                "DS172411",
            ),
            0,
        )

    def test_placeholder_assertion_is_suppressed(self):
        placeholder = "TO" + "DO"
        source = (
            "  it('keeps answers complete', () => {\n"
            "    for (const item of faqItems) {\n"
            f"      expect(item.answer).not.toMatch(/lorem|{placeholder}|coming soon/i);\n"
            "    }\n"
            "  });\n"
        )
        self.assertEqual(
            self._process(
                "__tests__/homepage-content-refresh.test.js",
                source,
                3,
                placeholder,
                "DS176209",
                "Suspicious comment",
            ),
            1,
        )

    def test_placeholder_comment_on_another_line_is_not_suppressed(self):
        placeholder = "TO" + "DO"
        source = f"// {placeholder}: finish this assertion\nconst value = 1;\n"
        self.assertEqual(
            self._process(
                "__tests__/homepage-content-refresh.test.js",
                source,
                1,
                placeholder,
                "DS176209",
            ),
            0,
        )

    def test_public_cloudflare_account_identifier_is_suppressed(self):
        sources = {
            "app/lib/cloudflare-observability-issues.ts": (
                f"export const DEFAULT_CLOUDFLARE_ACCOUNT_ID = '{self.ACCOUNT}';\n",
                1,
            ),
            "scripts/cloudflare/workers-issues-to-github-setup.sh": (
                f'ACCOUNT_ID="{self.ACCOUNT}"\n',
                1,
            ),
        }
        for relative_path, (source_text, line_number) in sources.items():
            with self.subTest(relative_path=relative_path):
                self.assertEqual(
                    self._process(
                        relative_path,
                        source_text,
                        line_number,
                        self.ACCOUNT,
                        "DS173237",
                        "Do not store tokens or keys in source code.",
                    ),
                    1,
                )

    def test_unreviewed_identifier_in_the_same_file_is_not_suppressed(self):
        other = "c" * 32
        source = f"export const DEFAULT_CLOUDFLARE_ACCOUNT_ID = '{other}';\n"
        self.assertEqual(
            self._process(
                "app/lib/cloudflare-observability-issues.ts",
                source,
                1,
                other,
                "DS173237",
            ),
            0,
        )

    def test_pinned_upstream_revision_is_suppressed(self):
        source = f"    expect(upstream).toContain('{self.REVISION}');\n"
        self.assertEqual(
            self._process(
                "__tests__/playwright-agent-toolkit.test.js",
                source,
                1,
                self.REVISION,
                "DS173237",
            ),
            1,
        )

    def test_loopback_text_inside_probe_report_value_is_suppressed(self):
        loopback = "127.0." + "0.1"
        # Built from fragments so the fixture does not add a plaintext-URL finding.
        scheme = "ht" + "tp://"
        source = (
            "{\n"
            '  "console": [\n'
            f'    "warning: The resource {scheme}{loopback}:3000/app.js was preloaded."\n'
            "  ]\n"
            "}\n"
        )
        self.assertEqual(
            self._process(
                "artifacts/map-marker-fix/after-wide.json",
                source,
                3,
                loopback,
                "DS162092",
                "Do not leave debug code in production",
            ),
            1,
        )

    def test_loopback_key_in_a_probe_report_is_not_suppressed(self):
        loopback = "127.0." + "0.1"
        source = "{\n  \"" + loopback + "\": \"captured\"\n}\n"
        self.assertEqual(
            self._process(
                "artifacts/map-marker-fix/after-wide.json",
                source,
                2,
                loopback,
                "DS162092",
            ),
            0,
        )
