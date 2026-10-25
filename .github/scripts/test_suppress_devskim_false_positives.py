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
                        "startColumn": value_start,  # One char before the quote
                        "endColumn": value_start + len(SHA256) + 3,
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
        line = "test.setTimeout(90_000);"
        start_column = line.index("setTimeout") + 1
        region = {
            "startLine": 1,
            "startColumn": start_column,
            "endColumn": start_column + len("setTimeout"),
        }
        self.assertTrue(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411", "tests/visual/homepage.spec.ts", line, region
            )
        )
        self.assertFalse(
            suppressions.should_suppress_safe_contextual_finding(
                "DS172411", "app/homepage/HomePage.js", line, region
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

    def test_documented_cloudflare_account_id_is_not_treated_as_a_secret(self):
        account_id = "dbd3120f6fa0104b5fe66c201ea" + "4251b"
        source = (
            "const JULES_SOURCE = 'sources/github/example/repo';\n"
            "// DevSkim: ignore DS173237\n"
            "// This account ID is an identifier, not an authentication credential; CF_WEBHOOK_SECRET authenticates requests.\n"
            'const CLOUDFLARE_ACCOUNT_ID = "' + account_id + '";\n'
        )
        id_line = source.splitlines()[3]
        id_literal = '"' + account_id + '"'
        start_column = id_line.index(id_literal) + 1
        region = {
            "startLine": 4,
            "startColumn": start_column,
            "endColumn": start_column + len(id_literal),
        }
        self.assertTrue(
            suppressions.should_suppress_public_cloudflare_account_id(
                "workers/jules-bridge/src/index.js", source, region
            )
        )
        unrelated_offset = id_line.index("CLOUDFLARE_ACCOUNT_ID")
        unrelated_region = {
            "startLine": 4,
            "startColumn": unrelated_offset + 1,
            "endColumn": unrelated_offset + len("CLOUDFLARE_ACCOUNT_ID") + 1,
        }
        self.assertFalse(
            suppressions.should_suppress_public_cloudflare_account_id(
                "workers/jules-bridge/src/index.js", source, unrelated_region
            )
        )
        self.assertFalse(
            suppressions.should_suppress_public_cloudflare_account_id(
                "workers/jules-bridge/src/index.js",
                source.replace("CLOUDFLARE_ACCOUNT_ID", "API_SECRET"),
                {"startLine": 4},
            )
        )


    def test_new_verified_false_positive_justifications_are_removed_from_sarif(self):
        justifications = [
            "False positive: a complete SHA/UUID/checksum value in an explicitly allowlisted metadata field overlaps the reported finding.",
            "False positive: this exact SHA value is a pinned upstream revision or tracked-file checksum in an allowlisted manifest map.",
            "False positive: this is the checked-in SHA-256 digest of the constitution template, not a credential.",
            "False positive: this is the repository's documented public Cloudflare account identifier; the webhook secret is configured separately.",
            "False positive: this is a callable timer callback or a test-runner timeout configuration, not string-based code execution by setTimeout.",
            "False positive: this is an explicitly identified development loopback origin or test-only loopback fixture, not shipped debug code.",
            "False positive: this is an explicitly identified development loopback origin or test-only loopback fixture, not a shipped insecure URL.",
            "False positive: the finding is on a static source-matching regex in a security test; the test verifies the real route has rel protections.",
            "False positive: this finding is in a specifically allowlisted dependency package name, not a weak-hash implementation.",
            "False positive: the reported substring is inside a valid, canonical SHA-512 package-integrity digest, not a hash algorithm invocation.",
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

    def test_raw_sarif_and_artifact_are_still_uploaded_after_a_suppression_failure(self):
        for name in (
            "Upload DevSkim scan results to GitHub Security tab",
            "Upload DevSkim alerts files",
        ):
            with self.subTest(step=name):
                step = self._step_block(name)
                self.assertIn("if: always() && hashFiles('devskim-alerts.sarif') != ''", step)

if __name__ == "__main__":
    unittest.main()
