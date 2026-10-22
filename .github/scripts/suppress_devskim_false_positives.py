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


def _source_line_for_region(region: dict, safe_path: Path) -> str:
    """Read the actual source line; SARIF snippets may contain only a matched slice."""
    start_line = region.get("startLine")
    if not isinstance(start_line, int) or isinstance(start_line, bool) or start_line < 1:
        return ""

    if not safe_path.is_file():
        return ""

    try:
        with safe_path.open("r", encoding="utf-8") as source_file:
            for line_number, line in enumerate(source_file, start=1):
                if line_number == start_line:
                    return line.rstrip("\r\n")
    except (OSError, UnicodeDecodeError):
        # No trusted source line means no suppression, not a fallback to SARIF text.
        return ""
    return ""


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
                ):
                    continue
            elif rule_id == "DS126858":
                if relative_path != "pnpm-lock.yaml":
                    continue
            else:
                continue

            snippet = _source_line_for_region(region, safe_path)

            justification = None
            if rule_id == "DS173237" and should_suppress_metadata_finding(snippet, region):
                justification = (
                    "False positive: a complete SHA/UUID value in an explicitly "
                    "allowlisted metadata field overlaps the reported finding."
                )
            elif rule_id == "DS126858" and LOCKFILE_NAME_PATTERN.search(snippet):
                justification = (
                    "False positive: this finding is in a specifically allowlisted "
                    "dependency package name, not a weak-hash implementation."
                )
            elif rule_id == "DS126858" and should_suppress_sha512_integrity_finding(snippet, region):
                justification = (
                    "False positive: the reported substring is inside a valid, canonical "
                    "SHA-512 package-integrity digest, not a hash algorithm invocation."
                )

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
    _atomic_write_json(sarif_path, data)
    return suppression_count


if __name__ == "__main__":
    count = suppress_sarif()
    print(f"Suppressed {count} verified false positives in SARIF.")
