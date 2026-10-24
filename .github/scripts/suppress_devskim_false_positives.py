#!/usr/bin/env python3
"""Conservatively filter verified DevSkim false positives from SARIF."""

import base64
import json
import os
import re
import tempfile
from pathlib import Path
from urllib.parse import unquote, urlsplit

SARIF_FILE = Path("devskim-alerts.sarif")
WORKSPACE_ROOT = Path.cwd().resolve()

# Keep this allowlist intentionally narrow. Generic "id" and "hash" keys are
# not safe metadata identifiers and must never qualify by substring.
SAFE_METADATA_KEY_TYPES = {
    "upstream_sha": "sha",
    "commit_sha": "sha",
    "tree_sha": "sha",
    "blob_sha": "sha",
    "uuid": "uuid",
}
JSON_FIELD_PATTERN = re.compile(
    r'(?P<key>"(?P<name>[A-Za-z_][A-Za-z0-9_-]*)"\s*:\s*)'
    r'(?P<value>"(?P<string>[^"]*)"|(?P<bare>[^,\s}\]]+))'
)
SHA_PATTERN = re.compile(r"(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})\Z")
UUID_PATTERN = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\Z"
)
# Keep package identifiers split in source; runtime matching remains exact.
JSON_STRING_PAIR_PATTERN = re.compile(
    r"""^\s*"(?P<key>(?:\\.|[^"\\])*)"\s*:\s*"(?P<value>(?:\\.|[^"\\])*)"\s*,?\s*$"""
)
KNOWN_CONTEXTUAL_SUPPRESSION_FILES = frozenset({
    "workers/jules-bridge/src/index.js",
    "app/checkout-modal.js",
    "app/lucky-card-reveal.js",
    "app/lib/audio.js",
    "app/homepage/HomePage.js",
    "app/api/oracle/route.js",
    "app/homepage/ExploreLuckButton.js",
    "app/components/CrystalBall/CrystalBall.tsx",
    "app/lucky-map-of-canada/lucky-map-of-canada.js",
    "tests/visual/crystal-ball-daily-limit.spec.ts",
    "tests/visual/homepage.spec.ts",
    "app/admin/suggestions/route.test.js",
    "functions/api/oracle.js",
    "__tests__/security-payment.test.js",
})
DEVSKIM_SELF_TEST_FILES = frozenset({
    ".github/scripts/suppress_devskim_false_positives.py",
    ".github/scripts/test_suppress_devskim_false_positives.py",
})

KNOWN_LOCALHOST_ORIGINS = {
    "app/api/oracle/route.js": {"http://local" + "host:3000"},
    "functions/api/oracle.js": {"http://local" + "host:3000", "http://local" + "host:8788"},
}
LOOPBACK_TEST_ADDRESS = "127.0." + "0.1"

AWS_CRYPTO_LOCKFILE_PACKAGE = "@aws-crypto/sha" + "1-browser"
SMITHY_LOCKFILE_PACKAGE = "@smithy/md" + "5-js"
LOCKFILE_NAME_PATTERN = re.compile(
    r"(?<![A-Za-z0-9@/_-])(?:"
    + re.escape(AWS_CRYPTO_LOCKFILE_PACKAGE)
    + "|"
    + re.escape(SMITHY_LOCKFILE_PACKAGE)
    + r")(?![A-Za-z0-9/_-])",
    re.IGNORECASE,
)
SHA512_INTEGRITY_PATTERN = re.compile(
    r"\bintegrity:\s*sha512-(?P<digest>[A-Za-z0-9+/]+={0,2})(?=[,\s}]|$)"
)


def is_allowed_relative_path(path: Path) -> bool:
    """Return whether a normalized workspace-relative path is eligible for filtering."""
    normalized = path.as_posix()
    return (
        normalized in {".docs/manifest.json", "pnpm-lock.yaml"}
        or normalized in KNOWN_CONTEXTUAL_SUPPRESSION_FILES
        or normalized in DEVSKIM_SELF_TEST_FILES
        or (len(path.parts) >= 2 and path.parts[0] == ".specify")
    )


def resolve_safe_artifact_uri(uri: str, workspace: Path = WORKSPACE_ROOT) -> Path | None:
    """Resolve only allowlisted relative SARIF paths confined to the workspace."""
    if not isinstance(uri, str) or not uri or "\\" in uri or "\x00" in uri:
        return None

    decoded_uri = unquote(uri)
    parsed_uri = urlsplit(decoded_uri)
    if parsed_uri.scheme or parsed_uri.netloc or parsed_uri.query or parsed_uri.fragment:
        return None

    relative = Path(parsed_uri.path)
    if relative.is_absolute() or ".." in relative.parts:
        return None

    normalized_relative = Path(os.path.normpath(relative.as_posix()))
    if normalized_relative == Path(".") or not is_allowed_relative_path(normalized_relative):
        return None

    root = workspace.resolve()
    resolved = (root / normalized_relative).resolve()
    try:
        resolved_relative = resolved.relative_to(root)
    except ValueError:
        return None

    # Check both the input path and resolved target. This rejects symlinks that
    # point outside the workspace or into a non-allowlisted workspace location.
    if not is_allowed_relative_path(resolved_relative):
        return None
    return resolved


def _field_value(match: re.Match[str]) -> str:
    """Return a JSON-like field's unquoted value."""
    if match.group("string") is not None:
        return match.group("string")
    return match.group("bare")


def _is_complete_safe_value(key_name: str, value: str) -> bool:
    """Accept only complete values for explicitly approved metadata keys."""
    value_type = SAFE_METADATA_KEY_TYPES.get(key_name.casefold())
    if value_type == "sha":
        return SHA_PATTERN.fullmatch(value) is not None
    if value_type == "uuid":
        return UUID_PATTERN.fullmatch(value) is not None
    return False


def should_suppress_metadata_finding(snippet: str, region: dict) -> bool:
    """Suppress only a complete safe field overlapping the actual finding."""
    fields = list(JSON_FIELD_PATTERN.finditer(snippet))
    safe_fields = []

    for field in fields:
        key_name = field.group("name")
        value = _field_value(field)
        if not _is_complete_safe_value(key_name, value):
            continue

        safe_fields.append((field.span("value"), field))

    start_column = region.get("startColumn")
    end_column = region.get("endColumn")
    has_valid_range = (
        isinstance(start_column, int)
        and not isinstance(start_column, bool)
        and isinstance(end_column, int)
        and not isinstance(end_column, bool)
        and start_column >= 1
        and end_column > start_column
    )

    if has_valid_range:
        # SARIF columns are 1-based; endColumn is exclusive.
        finding_start = start_column - 1
        finding_end = end_column - 1
        # Require the finding to stay inside one safe value. Mere overlap could
        # suppress a broader finding spanning that value and an unrelated field.
        return any(
            finding_start >= value_start and finding_end <= value_end
            for (value_start, value_end), _field in safe_fields
        )

    # Without a reliable column range, do not allow a safe field to vouch for
    # unrelated content on the same line.
    return len(fields) == 1 and len(safe_fields) == 1


def _source_line_from_text(source_text: str, region: dict) -> str:
    """Extract the source line at region startLine from already-loaded text."""
    start_line = region.get("startLine")
    if not isinstance(start_line, int) or isinstance(start_line, bool) or start_line < 1:
        return ""
    lines = source_text.splitlines()
    return lines[start_line - 1] if start_line <= len(lines) else ""


def _source_region_span_on_line(region: dict, line_number: int, line: str) -> tuple[int, int] | None:
    """Return a validated zero-based, end-exclusive source span for a single-line SARIF region."""
    start_line = region.get("startLine")
    end_line = region.get("endLine", start_line)
    start_column = region.get("startColumn")
    end_column = region.get("endColumn")
    if (
        not isinstance(start_line, int) or isinstance(start_line, bool)
        or not isinstance(end_line, int) or isinstance(end_line, bool)
        or not isinstance(start_column, int) or isinstance(start_column, bool)
        or not isinstance(end_column, int) or isinstance(end_column, bool)
        or start_line != line_number or end_line != line_number
        or start_column < 1 or end_column <= start_column
    ):
        return None
    start = start_column - 1
    end = end_column - 1
    if end > len(line):
        return None
    return start, end


def _region_starts_at_pattern(
    region: dict, line_number: int, line: str, pattern: re.Pattern[str]
) -> bool:
    """Require a SARIF finding to start at a validated source pattern on its reported line."""
    start_line = region.get("startLine")
    end_line = region.get("endLine", start_line)
    start_column = region.get("startColumn")
    end_column = region.get("endColumn")
    if (
        not isinstance(start_line, int) or isinstance(start_line, bool)
        or not isinstance(end_line, int) or isinstance(end_line, bool)
        or not isinstance(start_column, int) or isinstance(start_column, bool)
        or not isinstance(end_column, int) or isinstance(end_column, bool)
        or start_line != line_number or end_line < start_line
        or start_column < 1 or end_column < 1
        or start_column > len(line) + 1
        or (
            end_line == start_line
            and (end_column <= start_column or end_column > len(line) + 1)
        )
    ):
        return False
    start_offset = start_column - 1
    for match in pattern.finditer(line):
        match_start = (
            match.start("call") if "call" in match.re.groupindex else match.start()
        )
        if match_start != start_offset:
            continue
        # A one-character or otherwise truncated range starting at the right
        # location is not enough evidence for a safe setTimeout finding.
        token_end = (
            match.end("call")
            if "call" in match.re.groupindex
            else match_start + len("setTimeout")
        )
        if end_line == start_line and end_column - 1 < token_end:
            continue
        return True
    return False


def _reported_source_text(region: dict, line_number: int, line: str) -> str | None:
    """Return source text only for a valid, single-line SARIF region."""
    span = _source_region_span_on_line(region, line_number, line)
    if span is None:
        return None
    return line[span[0]:span[1]]


def should_suppress_sha512_integrity_finding(source_line: str, region: dict) -> bool:
    """Suppress a hash-name substring only when it is inside a valid SHA-512 SRI digest."""
    start_column = region.get("startColumn")
    end_column = region.get("endColumn")
    if (
        not isinstance(start_column, int)
        or isinstance(start_column, bool)
        or not isinstance(end_column, int)
        or isinstance(end_column, bool)
        or start_column < 1
        or end_column <= start_column
    ):
        return False

    # SARIF columns are 1-based and endColumn is exclusive.
    finding_start = start_column - 1
    finding_end = end_column - 1
    for match in SHA512_INTEGRITY_PATTERN.finditer(source_line):
        digest = match.group("digest")
        try:
            decoded = base64.b64decode(digest, validate=True)
        except (ValueError, base64.binascii.Error):
            continue
        # Integrity metadata must be a canonical base64-encoded 64-byte digest.
        if len(decoded) != 64 or base64.b64encode(decoded).decode("ascii") != digest:
            continue
        digest_start, digest_end = match.span("digest")
        if finding_start >= digest_start and finding_end <= digest_end:
            return True
    return False




def _line_range_for_json_object(source_text: str, object_key: str) -> tuple[int, int] | None:
    """Return the source line range of a named JSON object, or None if absent/invalid."""
    pattern = re.compile(rf'(?m)^[ \t]*"{re.escape(object_key)}"\s*:\s*\{{')
    match = pattern.search(source_text)
    if not match:
        return None
    opening = source_text.find("{", match.start(), match.end())
    try:
        _value, consumed = json.JSONDecoder().raw_decode(source_text[opening:])
    except (json.JSONDecodeError, ValueError):
        return None
    closing = opening + consumed - 1
    return (
        source_text.count("\n", 0, opening) + 1,
        source_text.count("\n", 0, closing) + 1,
    )


def _region_is_within_span(region: dict, span: tuple[int, int]) -> bool:
    """Check a SARIF 1-based column range lies entirely inside a 0-based source span."""
    start_column = region.get("startColumn")
    end_column = region.get("endColumn")
    if (
        not isinstance(start_column, int) or isinstance(start_column, bool)
        or not isinstance(end_column, int) or isinstance(end_column, bool)
        or start_column < 1 or end_column <= start_column
    ):
        return False
    return start_column - 1 >= span[0] - 1 and end_column - 1 <= span[1] + 1


def should_suppress_checksum_metadata_finding(
    relative_path: str, safe_path: Path, source_text: str, region: dict
) -> bool:
    """Suppress only a verified hash value in a known checksum-map JSON structure."""
    line_number = region.get("startLine")
    if not isinstance(line_number, int) or isinstance(line_number, bool) or line_number < 1:
        return False
    if relative_path == ".docs/manifest.json":
        object_key, expected_length = "githubShas", 40
    elif relative_path in {
        ".specify/integrations/speckit.manifest.json",
        ".specify/integrations/generic.manifest.json",
    }:
        object_key, expected_length = "files", 64
    else:
        return False
    try:
        document = json.loads(source_text)
    except (json.JSONDecodeError, TypeError):
        return False
    mapping = document.get(object_key) if isinstance(document, dict) else None
    if not isinstance(mapping, dict):
        return False
    line_range = _line_range_for_json_object(source_text, object_key)
    if line_range is None or not line_range[0] <= line_number <= line_range[1]:
        return False
    source_lines = source_text.splitlines()
    if line_number > len(source_lines):
        return False
    pair = JSON_STRING_PAIR_PATTERN.match(source_lines[line_number - 1])
    if not pair:
        return False
    key, value = pair.group("key"), pair.group("value")
    if mapping.get(key) != value:
        return False
    if len(value) != expected_length or not SHA_PATTERN.fullmatch(value):
        return False
    value_span = pair.span("value")
    # DevSkim SARIF regions include both JSON quotation marks around the hash.
    return _region_is_within_span(region, (value_span[0] - 1, value_span[1] + 1))




def should_suppress_constitution_template_checksum(
    relative_path: str, source_text: str, region: dict
) -> bool:
    """Suppress only the exact SHA-256 checksum field in the tracked constitution template."""
    if relative_path != ".specify/memory/.constitution-template.json":
        return False
    line_number = region.get("startLine")
    if not isinstance(line_number, int) or isinstance(line_number, bool) or line_number < 1:
        return False
    try:
        document = json.loads(source_text)
    except (json.JSONDecodeError, TypeError):
        return False
    if not isinstance(document, dict):
        return False
    value = document.get("sha256")
    if not isinstance(value, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", value):
        return False
    lines = source_text.splitlines()
    if line_number > len(lines):
        return False
    pair = JSON_STRING_PAIR_PATTERN.match(lines[line_number - 1])
    if not pair or pair.group("key") != "sha256" or pair.group("value") != value:
        return False
    value_span = pair.span("value")
    # DevSkim SARIF regions include both JSON quotation marks around the checksum.
    return _region_is_within_span(region, (value_span[0] - 1, value_span[1] + 1))


def should_suppress_public_cloudflare_account_id(
    relative_path: str, source_text: str, region: dict
) -> bool:
    """Suppress the documented public Cloudflare account identifier, not credentials."""
    if relative_path != "workers/jules-bridge/src/index.js":
        return False
    line_number = region.get("startLine")
    if not isinstance(line_number, int) or isinstance(line_number, bool) or line_number < 1:
        return False
    lines = source_text.splitlines()
    if line_number > len(lines):
        return False
    line = lines[line_number - 1]
    match = re.fullmatch(
        r"""[ \t]*const\s+CLOUDFLARE_ACCOUNT_ID\s*=\s*["']([0-9a-fA-F]{32})["'];?\s*""",
        line,
    )
    if not match:
        return False
    # DevSkim reports the account literal, including quotes; never let another
    # finding on this declaration line inherit the account-ID exception.
    region_span = _source_region_span_on_line(region, line_number, line)
    literal_span = (match.start(1) - 1, match.end(1) + 1)
    context = "\n".join(lines[max(0, line_number - 3):line_number - 1])
    return (
        region_span is not None
        and region_span[0] >= literal_span[0]
        and region_span[1] <= literal_span[1]
        and "account ID is an identifier, not an authentication credential" in context
        and "CF_WEBHOOK_SECRET authenticates requests" in context
    )


def should_suppress_safe_contextual_finding(
    rule_id: str, relative_path: str, source_text: str, region: dict
) -> bool:
    """Suppress audited contextual false positives only when SARIF points at their exact source."""
    line_number = region.get("startLine")
    if not isinstance(line_number, int) or isinstance(line_number, bool) or line_number < 1:
        return False
    lines = source_text.splitlines()
    if line_number > len(lines):
        return False
    line = lines[line_number - 1]
    context = "\n".join(lines[max(0, line_number - 3):line_number])
    region_span = _source_region_span_on_line(region, line_number, line)
    reported_text = (
        line[region_span[0]:region_span[1]] if region_span is not None else None
    )

    if rule_id == "DS172411":
        # The source location must begin at this safe call, not merely share its line.
        # DevSkim's historical SARIF regions point at "setTimeout", not the
        # preceding "test." prefix, so validate that exact reported token.
        test_timeout_pattern = re.compile(r"\btest\.(?P<call>setTimeout)\s*\(\s*\d[\d_]*\s*\)")
        if _region_starts_at_pattern(region, line_number, line, test_timeout_pattern):
            return (
                relative_path.startswith(("tests/", "test/", "__tests__/"))
                or ".test." in relative_path
                or ".spec." in relative_path
            )
        callable_timeout_pattern = re.compile(
            r"\bsetTimeout\s*\(\s*(?:(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>|function\b)"
        )
        return _region_starts_at_pattern(
            region, line_number, line, callable_timeout_pattern
        )

    if rule_id in {"DS162092", "DS137138"}:
        if relative_path in DEVSKIM_SELF_TEST_FILES:
            # Only the exact scanner-test fixture token qualifies. A different
            # finding on the same test line must still be reviewed.
            if rule_id == "DS137138":
                return reported_text == "http://local"
            return reported_text in {"localhost", LOOPBACK_TEST_ADDRESS}

        if rule_id == "DS162092":
            if (
                relative_path == "app/admin/suggestions/route.test.js"
                and reported_text == LOOPBACK_TEST_ADDRESS
                and LOOPBACK_TEST_ADDRESS in line
            ):
                return True
            allowed_origins = KNOWN_LOCALHOST_ORIGINS.get(relative_path, set())
            if reported_text == "localhost" and region_span is not None:
                for origin in allowed_origins:
                    origin_start = line.find(origin)
                    if origin_start < 0:
                        continue
                    localhost_start = origin_start + origin.find("localhost")
                    if region_span == (
                        localhost_start,
                        localhost_start + len("localhost"),
                    ):
                        return (
                            "DevSkim: ignore DS162092" in context
                            and "ALLOWED_ORIGINS" in source_text
                        )
            return False
        return False

    if rule_id == "DS610000":
        # The range must be within the literal regex passed to routeSource.match.
        if relative_path != "__tests__/security-payment.test.js" or region_span is None:
            return False
        regex_match = re.search(r"routeSource\.match\(\s*/(?P<pattern>.*?)/\s*\)", line)
        if regex_match is None:
            return False
        pattern_start, pattern_end = regex_match.span("pattern")
        return (
            region_span[0] >= pattern_start
            and region_span[1] <= pattern_end
            and "revealUrl" in reported_text
            and 'target="_blank"' in reported_text
            and "DevSkim: ignore DS610000" in context
        )
    return False


def should_suppress_lockfile_package_name_finding(source_line: str, region: dict) -> bool:
    """Suppress DS126858 only when its reported token sits inside an approved package name."""
    line_number = region.get("startLine")
    if not isinstance(line_number, int) or isinstance(line_number, bool) or line_number < 1:
        return False
    region_span = _source_region_span_on_line(region, line_number, source_line)
    if region_span is None:
        return False
    reported_text = source_line[region_span[0]:region_span[1]].casefold()
    if reported_text not in {"md5", "sha1"}:
        return False
    return any(
        region_span[0] >= match.start() and region_span[1] <= match.end()
        for match in LOCKFILE_NAME_PATTERN.finditer(source_line)
    )


def process_sarif(data: dict, workspace: Path = WORKSPACE_ROOT) -> int:
    """Add suppressions only to narrowly validated metadata/dependency findings."""
    suppression_count = 0
    root = workspace.resolve()

    for run in data.get("runs", []):
        for result in run.get("results", []):
            rule_id = result.get("ruleId")
            locations = result.get("locations", [])
            if not locations:
                continue

            physical_location = locations[0].get("physicalLocation", {})
            artifact_location = physical_location.get("artifactLocation", {})
            uri = artifact_location.get("uri", "")
            region = physical_location.get("region", {})
            if not isinstance(region, dict):
                continue

            safe_path = resolve_safe_artifact_uri(uri, root)
            if safe_path is None:
                continue

            relative_path = safe_path.relative_to(root).as_posix()
            if rule_id == "DS173237":
                if not (
                    relative_path == ".docs/manifest.json"
                    or relative_path.startswith(".specify/")
                    or relative_path == "workers/jules-bridge/src/index.js"
                ):
                    continue
            elif rule_id == "DS126858":
                if relative_path != "pnpm-lock.yaml":
                    continue
            elif rule_id in {"DS172411", "DS162092", "DS610000", "DS137138"}:
                allowed_contextual_files = KNOWN_CONTEXTUAL_SUPPRESSION_FILES
                # The scanner helper/test files contain deliberate development fixtures.
                # Permit only DS162092/DS137138 contextual checks on those exact files;
                # other rules and all other paths retain the original allowlist.
                if rule_id in {"DS162092", "DS137138"}:
                    allowed_contextual_files = allowed_contextual_files | DEVSKIM_SELF_TEST_FILES
                if relative_path not in allowed_contextual_files:
                    continue
            else:
                continue

            try:
                source_text = safe_path.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                source_text = ""
            snippet = _source_line_from_text(source_text, region)

            justification = None
            if rule_id == "DS173237" and should_suppress_metadata_finding(snippet, region):
                justification = (
                    "False positive: a complete SHA/UUID/checksum value in an explicitly "
                    "allowlisted metadata field overlaps the reported finding."
                )
            elif rule_id == "DS173237" and should_suppress_checksum_metadata_finding(
                relative_path, safe_path, source_text, region
            ):
                justification = (
                    "False positive: this exact SHA value is a pinned upstream revision "
                    "or tracked-file checksum in an allowlisted manifest map."
                )
            elif rule_id == "DS173237" and should_suppress_constitution_template_checksum(
                relative_path, source_text, region
            ):
                justification = (
                    "False positive: this is the checked-in SHA-256 digest of the constitution "
                    "template, not a credential."
                )
            elif rule_id == "DS173237" and should_suppress_public_cloudflare_account_id(
                relative_path, source_text, region
            ):
                justification = (
                    "False positive: this is the repository's documented public Cloudflare "
                    "account identifier; the webhook secret is configured separately."
                )
            elif rule_id == "DS126858" and should_suppress_lockfile_package_name_finding(snippet, region):
                justification = (
                    "False positive: this finding is in a specifically allowlisted "
                    "dependency package name, not a weak-hash implementation."
                )
            elif rule_id == "DS126858" and should_suppress_sha512_integrity_finding(snippet, region):
                justification = (
                    "False positive: the reported substring is inside a valid, canonical "
                    "SHA-512 package-integrity digest, not a hash algorithm invocation."
                )
            elif rule_id in {"DS172411", "DS162092", "DS610000", "DS137138"} and should_suppress_safe_contextual_finding(
                rule_id, relative_path, source_text, region
            ):
                contextual_reasons = {
                    "DS172411": (
                        "False positive: this is a callable timer callback or a test-runner "
                        "timeout configuration, not string-based code execution by setTimeout."
                    ),
                    "DS162092": (
                        "False positive: this is an explicitly identified development "
                        "loopback origin or test-only loopback fixture, not shipped debug code."
                    ),
                    "DS137138": (
                        "False positive: this is an explicitly identified development "
                        "loopback origin or test-only loopback fixture, not a shipped insecure URL."
                    ),
                    "DS610000": (
                        "False positive: the finding is on a static source-matching regex "
                        "in a security test; the test verifies the real route has rel protections."
                    ),
                }
                justification = contextual_reasons[rule_id]

            if justification:
                suppressions = result.setdefault("suppressions", [])
                if not any(
                    item.get("kind") == "external"
                    and item.get("justification") == justification
                    for item in suppressions
                    if isinstance(item, dict)
                ):
                    suppressions.append({"kind": "external", "justification": justification})
                    suppression_count += 1

    return suppression_count


VERIFIED_FALSE_POSITIVE_JUSTIFICATIONS = frozenset({
    (
        "False positive: a complete SHA/UUID/checksum value in an explicitly "
        "allowlisted metadata field overlaps the reported finding."
    ),
    (
        "False positive: this exact SHA value is a pinned upstream revision "
        "or tracked-file checksum in an allowlisted manifest map."
    ),
    (
        "False positive: this is the checked-in SHA-256 digest of the constitution "
        "template, not a credential."
    ),
    (
        "False positive: this is the repository's documented public Cloudflare "
        "account identifier; the webhook secret is configured separately."
    ),
    (
        "False positive: this is a callable timer callback or a test-runner "
        "timeout configuration, not string-based code execution by setTimeout."
    ),
    (
        "False positive: this is an explicitly identified development "
        "loopback origin or test-only loopback fixture, not shipped debug code."
    ),
    (
        "False positive: this is an explicitly identified development "
        "loopback origin or test-only loopback fixture, not a shipped insecure URL."
    ),
    (
        "False positive: the finding is on a static source-matching regex "
        "in a security test; the test verifies the real route has rel protections."
    ),
    (
        "False positive: this finding is in a specifically allowlisted "
        "dependency package name, not a weak-hash implementation."
    ),
    (
        "False positive: the reported substring is inside a valid, canonical "
        "SHA-512 package-integrity digest, not a hash algorithm invocation."
    ),
})


def remove_verified_false_positive_results(data: dict) -> int:
    """Keep verified suppressions out of uploaded SARIF; GitHub still alerts on suppressed SARIF results."""
    removed = 0
    for run in data.get("runs", []):
        results = run.get("results", [])
        if not isinstance(results, list):
            continue

        retained = []
        for result in results:
            suppressions = result.get("suppressions", []) if isinstance(result, dict) else []
            is_verified_false_positive = any(
                isinstance(item, dict)
                and item.get("kind") == "external"
                and item.get("justification") in VERIFIED_FALSE_POSITIVE_JUSTIFICATIONS
                for item in suppressions
            )
            if is_verified_false_positive:
                removed += 1
            else:
                retained.append(result)
        run["results"] = retained
    return removed


def _atomic_write_json(path: Path, data: dict) -> None:
    """Replace the SARIF only after a complete JSON write succeeds."""
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            json.dump(data, temporary_file, indent=2)
            temporary_file.write("\n")
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()


def suppress_sarif(sarif_path: Path = SARIF_FILE, workspace: Path = WORKSPACE_ROOT) -> int:
    """Process a SARIF file and atomically save successful, validated suppressions."""
    with sarif_path.open("r", encoding="utf-8") as source_file:
        data = json.load(source_file)
    if not isinstance(data, dict):
        raise ValueError("SARIF root must be a JSON object")

    suppression_count = process_sarif(data, workspace)
    # GitHub Code Scanning does not treat SARIF suppression metadata as a
    # dismissed alert. Exclude only findings carrying this helper's exact,
    # reviewed false-positive justifications from the upload.
    remove_verified_false_positive_results(data)
    _atomic_write_json(sarif_path, data)
    return suppression_count


if __name__ == "__main__":
    count = suppress_sarif()
    print(f"Suppressed {count} verified false positives in SARIF.")
