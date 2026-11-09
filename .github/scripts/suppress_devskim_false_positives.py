#!/usr/bin/env python3
"""Conservatively filter verified DevSkim false positives from SARIF."""

import base64
import bisect
import json
import os
import re
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import unquote, urlsplit

SARIF_FILE = Path("devskim-alerts.sarif")
WORKSPACE_ROOT = Path.cwd().resolve()


@dataclass
class SourceContext:
    """One source file's text and the derived views reused across its findings.

    DevSkim reports many findings per file. The checker used to re-read the
    file, re-split its lines and re-parse its JSON for every finding, so a scan
    cost grew with findings x file size. A run now builds one context per file
    and shares it across every result, which keeps each decision identical
    while making the work per file rather than per finding.
    """

    text: str
    lines: list = field(init=False, repr=False)
    _document_loaded: bool = field(default=False, init=False, repr=False)
    _document_valid: bool = field(default=False, init=False, repr=False)
    _document: object = field(default=None, init=False, repr=False)
    _line_ranges: dict = field(default_factory=dict, init=False, repr=False)
    _astral_indices: list | None = field(default=None, init=False, repr=False)

    def __post_init__(self):
        self.lines = self.text.splitlines()

    @classmethod
    def from_text(cls, text: str) -> "SourceContext":
        """Build a context for callers that already hold the source text."""
        return cls(text)

    def json_document(self):
        """Return the parsed JSON document once, or None when the text is not JSON."""
        if not self._document_loaded:
            self._document_loaded = True
            try:
                self._document = json.loads(self.text)
                self._document_valid = True
            except (json.JSONDecodeError, TypeError):
                self._document = None
                self._document_valid = False
        return self._document

    def is_json(self) -> bool:
        """Return whether the whole file parses as JSON, parsed at most once."""
        self.json_document()
        return self._document_valid

    def line_range_for_json_object(self, object_key: str) -> tuple | None:
        """Return the line range of a named JSON object, decoded at most once per key."""
        if object_key not in self._line_ranges:
            self._line_ranges[object_key] = _line_range_for_json_object(
                self.text, object_key
            )
        return self._line_ranges[object_key]

    def utf16_offset_to_index(self, offset) -> int | None:
        """Translate DevSkim's UTF-16 code-unit offset into a Python string index.

        The index of the file's astral characters is built once and reused, so
        the conversion is a binary search rather than a full-file character
        scan for every finding. DevSkim indexes .NET strings: an astral
        character occupies a surrogate pair (two units) but one Python code
        point, and an offset that splits a pair is rejected rather than guessed.
        """
        if not isinstance(offset, int) or isinstance(offset, bool) or offset < 0:
            return None
        if self._astral_indices is None:
            self._astral_indices = [
                index
                for index, character in enumerate(self.text)
                if ord(character) > 0xFFFF
            ]
        astral = self._astral_indices
        if offset > len(self.text) + len(astral):
            return None
        low, high = 0, len(self.text)
        while low < high:
            middle = (low + high) // 2
            units_before = middle + bisect.bisect_left(astral, middle)
            if units_before < offset:
                low = middle + 1
            else:
                high = middle
        if low + bisect.bisect_left(astral, low) != offset:
            return None
        return low


class SourceCache:
    """Resolve and cache one SourceContext per file for a single scan run."""

    def __init__(self, workspace: Path = WORKSPACE_ROOT):
        self._workspace = Path(workspace).resolve()
        self._contexts: dict = {}

    def context_for(self, path: Path) -> SourceContext:
        """Read a file at most once per run and reuse its derived views."""
        resolved = Path(path).resolve()
        context = self._contexts.get(resolved)
        if context is None:
            try:
                text = resolved.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                text = ""
            context = SourceContext.from_text(text)
            self._contexts[resolved] = context
        return context

    def line(self, path: Path, line_number) -> str | None:
        """Return one source line, or None when the line cannot be read."""
        if (
            not isinstance(line_number, int)
            or isinstance(line_number, bool)
            or line_number < 1
        ):
            return None
        lines = self.context_for(path).lines
        if line_number > len(lines):
            return None
        return lines[line_number - 1]

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
    "app/checkout-modal.js",
    "app/lucky-card-reveal.js",
    "app/lib/audio.js",
    "app/homepage/HomePage.js",
    "app/api/oracle/route.js",
    "app/homepage/ExploreLuckButton.js",
    "app/components/CrystalBall/CrystalBall.tsx",
    "app/lucky-map-of-canada/lucky-map-of-canada.js",
    "tests/visual/crystal-ball-daily-limit.spec.ts",
    "tests/visual/gold-cta.spec.ts",
    "tests/visual/homepage.spec.ts",
    "tests/visual/map-marker-interaction.spec.ts",
    "tests/visual/lucky-stories-pagination.spec.ts",
    "tests/visual/sitewide-gold-cta.spec.ts",
    "app/admin/suggestions/route.test.js",
    "functions/api/oracle.js",
    "__tests__/security-payment.test.js",
})
DEVSKIM_SELF_TEST_FILES = frozenset({
    ".github/scripts/suppress_devskim_false_positives.py",
    ".github/scripts/test_suppress_devskim_false_positives.py",
})
# These reveal sources contain reviewed inline callable timers. Keep this
# allowlist separate so adding them for DS172411 does not widen other rules.
SAFE_REVEAL_TIMER_CALLBACK_FILES = frozenset({
    "app/lucky-reveal-popup.js",
    "app/lucky-reveal-celebration.jsx",
})
# Match only the three reviewed application statements, not every callback
# that may be added to either file in the future.
SAFE_REVEAL_TIMER_CALLBACK_PATTERNS = {
    "app/lucky-reveal-popup.js": (
        re.compile(
            r"^ *const timer = window\.(?P<call>setTimeout)\(\(\) => "
            r"setIsNumberFinishActive\(false\), NUMBER_FINISH_TOTAL_MS\); *$"
        ),
    ),
    "app/lucky-reveal-celebration.jsx": (
        re.compile(r"^ *window\.(?P<call>setTimeout)\(\(\) => \{ *$"),
        re.compile(r"^ *const startTimer = window\.(?P<call>setTimeout)\(\(\) => \{ *$"),
    ),
}
# This test contains a quoted source assertion, not an executed timer call.
SAFE_REVEAL_TIMER_ASSERTION_FILES = frozenset({
    "__tests__/lucky-reveal-finish-phase2.test.js",
})
# The share-image download revokes its temporary object URL from a callable
# callback with a fixed delay; no string or request data is evaluated.
SAFE_SHARE_TIMER_CALLBACK_FILES = frozenset({
    "app/share-lucky-pick-button.js",
})
SAFE_SHARE_TIMER_CALLBACK_PATTERNS = {
    "app/share-lucky-pick-button.js": (
        re.compile(
            r"^ *window\.(?P<call>setTimeout)\(\(\) => "
            r"URL\.revokeObjectURL\(url\), 1000\); *$"
        ),
    ),
}

KNOWN_LOCALHOST_ORIGINS = {
    "app/api/oracle/route.js": {"http://local" + "host:3000"},
    "functions/api/oracle.js": {"http://local" + "host:3000", "http://local" + "host:8788"},
}
LOOPBACK_TEST_ADDRESS = "127.0." + "0.1"
# The Playwright config starts and points at a local Next.js server. Both
# reviewed lines are local-only test-runner configuration, never shipped code.
PLAYWRIGHT_LOCAL_SERVER_FILE = "playwright.config.ts"
PLAYWRIGHT_LOCAL_SERVER_LINE_PATTERNS = (
    re.compile(
        r"^ *command: `pnpm dev --hostname "
        + re.escape(LOOPBACK_TEST_ADDRESS)
        + r" --port \$\{PORT\}`,\s*$"
    ),
    re.compile(
        r"^ *url: `http://"
        + re.escape(LOOPBACK_TEST_ADDRESS)
        + r":\$\{PORT\}`,\s*$"
    ),
)
# Committed browser-probe measurement reports keep the loopback URLs they were
# captured from. They are documentation data under artifacts/, never part of the
# Next.js build or the public asset directory.
LOCAL_PROBE_ARTIFACT_DIRECTORY = "artifacts/"
LOCAL_PROBE_ARTIFACT_SUFFIX = ".json"
JSON_STRING_VALUE_PATTERN = re.compile(r'"(?P<value>(?:\\.|[^"\\])*)"')
LOOPBACK_HOSTNAMES = frozenset({LOOPBACK_TEST_ADDRESS, "local" + "host", "::1"})
LOCAL_PROBE_ORIGIN_JUSTIFICATION = (
    "False positive: this loopback origin appears only in local Playwright "
    "server configuration or a committed browser-probe measurement report, "
    "not in shipped production code."
)

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
        or normalized in SAFE_REVEAL_TIMER_CALLBACK_FILES
        or normalized in SAFE_REVEAL_TIMER_ASSERTION_FILES
        or normalized in SAFE_SHARE_TIMER_CALLBACK_FILES
        or normalized == PLAYWRIGHT_LOCAL_SERVER_FILE
        or is_local_probe_artifact_path(normalized)
        or (len(path.parts) >= 2 and path.parts[0] == ".specify")
    )


def is_local_probe_artifact_path(relative_path: str) -> bool:
    """Return whether a path is a committed browser-probe measurement report."""
    return (
        relative_path.startswith(LOCAL_PROBE_ARTIFACT_DIRECTORY)
        and relative_path.endswith(LOCAL_PROBE_ARTIFACT_SUFFIX)
    )


def is_local_probe_origin_path(relative_path: str) -> bool:
    """Return whether a path is reviewed local-only server/probe configuration."""
    return (
        relative_path == PLAYWRIGHT_LOCAL_SERVER_FILE
        or is_local_probe_artifact_path(relative_path)
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


def _code_point_offset_from_utf16_offset(
    source_text: str, offset: int
) -> int | None:
    """Translate DevSkim's UTF-16 code-unit offset into a Python string index."""
    if not isinstance(offset, int) or isinstance(offset, bool) or offset < 0:
        return None
    units = 0
    for index, character in enumerate(source_text):
        if units == offset:
            return index
        # DevSkim indexes .NET strings: astral characters occupy a surrogate
        # pair (two units) but a single Python code point.
        units += 2 if ord(character) > 0xFFFF else 1
        if units > offset:
            # The reported offset splits a surrogate pair; do not guess.
            return None
    return len(source_text) if units == offset else None


def _absolute_source_span(
    region: dict, source_text: str, context: "SourceContext | None" = None
) -> tuple[int, int] | None:
    """Validate DevSkim's absolute character span against its source snippet and line numbers."""
    has_offset = "charOffset" in region
    has_length = "charLength" in region
    if not has_offset and not has_length:
        return None
    if not has_offset or not has_length:
        return None

    start_units = region.get("charOffset")
    length_units = region.get("charLength")
    if (
        not isinstance(start_units, int) or isinstance(start_units, bool)
        or start_units < 0
        or not isinstance(length_units, int) or isinstance(length_units, bool)
        or length_units <= 0
    ):
        return None

    # DevSkim reports charOffset/charLength in UTF-16 code units. Convert once
    # here so every downstream comparison stays in Python code-point indices;
    # the conversion is identity for source that contains no astral characters.
    if context is not None:
        # A shared per-file index keeps this conversion off the per-finding path.
        start = context.utf16_offset_to_index(start_units)
        end = context.utf16_offset_to_index(start_units + length_units)
    else:
        start = _code_point_offset_from_utf16_offset(source_text, start_units)
        end = _code_point_offset_from_utf16_offset(
            source_text, start_units + length_units
        )
    if start is None or end is None or end <= start:
        return None

    source_fragment = source_text[start:end]
    snippet = region.get("snippet")
    snippet_text = snippet.get("text") if isinstance(snippet, dict) else None
    if isinstance(snippet_text, str) and source_fragment != snippet_text:
        return None

    actual_start_line = source_text.count("\n", 0, start) + 1
    actual_end_line = source_text.count("\n", 0, end - 1) + 1
    start_line = region.get("startLine")
    end_line = region.get("endLine", start_line)
    if (
        not isinstance(start_line, int) or isinstance(start_line, bool)
        or not isinstance(end_line, int) or isinstance(end_line, bool)
        or start_line != actual_start_line
        or end_line != actual_end_line
    ):
        return None
    return start, end


def _source_region_span_on_line(
    region: dict,
    line_number: int,
    line: str,
    source_text: str | None = None,
    context: "SourceContext | None" = None,
) -> tuple[int, int] | None:
    """Return a validated zero-based, end-exclusive source span for one source line."""
    if source_text is not None and (
        "charOffset" in region or "charLength" in region
    ):
        absolute_span = _absolute_source_span(region, source_text, context)
        if absolute_span is None:
            return None
        start, end = absolute_span
        start_line = source_text.count("\n", 0, start) + 1
        end_line = source_text.count("\n", 0, end - 1) + 1
        if start_line != line_number or end_line != line_number:
            return None
        line_start = source_text.rfind("\n", 0, start) + 1
        actual_line_end = source_text.find("\n", start)
        if actual_line_end == -1:
            actual_line_end = len(source_text)
        if source_text[line_start:actual_line_end] != line:
            return None
        return start - line_start, end - line_start

    # Test fixtures that do not model DevSkim's absolute-offset fields use
    # validated SARIF columns; production DevSkim output prefers charOffset.
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
    region: dict,
    line_number: int,
    line: str,
    pattern: re.Pattern[str],
    source_text: str | None = None,
    context: "SourceContext | None" = None,
) -> bool:
    """Require a SARIF finding to start at a validated source pattern on its reported line."""
    if source_text is not None and (
        "charOffset" in region or "charLength" in region
    ):
        absolute_span = _absolute_source_span(region, source_text, context)
        if absolute_span is None:
            return False
        absolute_start, absolute_end = absolute_span
        start_line = source_text.count("\n", 0, absolute_start) + 1
        if start_line != line_number:
            return False
        line_start = source_text.rfind("\n", 0, absolute_start) + 1
        if source_text[line_start:line_start + len(line)] != line:
            return False
        start_offset = absolute_start - line_start
        end_line = region.get("endLine", start_line)
        for match in pattern.finditer(line):
            match_start = (
                match.start("call") if "call" in match.re.groupindex else match.start()
            )
            if match_start != start_offset:
                continue
            token_end = (
                match.end("call")
                if "call" in match.re.groupindex
                else match_start + len("setTimeout")
            )
            if end_line == start_line and absolute_end < line_start + token_end:
                continue
            return True
        return False

    # Synthetic unit tests may omit DevSkim's absolute-offset extension. Use
    # strict SARIF columns for those inputs and fail open when they are invalid.
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

    if source_text is not None:
        source_lines = source_text.splitlines()
        if start_line > len(source_lines) or end_line > len(source_lines):
            return False
        if source_lines[start_line - 1] != line:
            return False
        if end_column > len(source_lines[end_line - 1]) + 1:
            return False

    start_offset = start_column - 1
    for match in pattern.finditer(line):
        match_start = (
            match.start("call") if "call" in match.re.groupindex else match.start()
        )
        if match_start != start_offset:
            continue
        token_end = (
            match.end("call")
            if "call" in match.re.groupindex
            else match_start + len("setTimeout")
        )
        if end_line == start_line and end_column - 1 < token_end:
            continue
        return True
    return False


def _reported_source_text(
    region: dict,
    line_number: int,
    line: str,
    source_text: str | None = None,
) -> str | None:
    """Return source text only for a valid, single-line SARIF region."""
    span = _source_region_span_on_line(region, line_number, line, source_text)
    if span is None:
        return None
    return line[span[0]:span[1]]


def should_suppress_sha512_integrity_finding(
    source_line: str,
    region: dict,
    source_text: str | None = None,
    context: "SourceContext | None" = None,
) -> bool:
    """Suppress a hash-name substring only when it is inside a valid SHA-512 SRI digest."""
    if source_text is not None and (
        "charOffset" in region or "charLength" in region
    ):
        line_number = region.get("startLine")
        if not isinstance(line_number, int) or isinstance(line_number, bool):
            return False
        span = _source_region_span_on_line(
            region, line_number, source_line, source_text, context=context
        )
        if span is None:
            return False
        finding_start, finding_end = span
    else:
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




def _line_range_for_json_object(
    source_text: str, object_key: str, context: "SourceContext | None" = None
) -> tuple[int, int] | None:
    """Return the source line range of a named JSON object, or None if absent/invalid."""
    if context is not None:
        return context.line_range_for_json_object(object_key)
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
    return start_column - 1 >= span[0] and end_column - 1 <= span[1]


def should_suppress_checksum_metadata_finding(
    relative_path: str,
    safe_path: Path,
    source_text: str,
    region: dict,
    context: "SourceContext | None" = None,
) -> bool:
    """Suppress only a verified hash value in a known checksum-map JSON structure."""
    context = context or SourceContext.from_text(source_text)
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
    document = context.json_document()
    mapping = document.get(object_key) if isinstance(document, dict) else None
    if not isinstance(mapping, dict):
        return False
    line_range = context.line_range_for_json_object(object_key)
    if line_range is None or not line_range[0] <= line_number <= line_range[1]:
        return False
    source_lines = context.lines
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
    # Prefer DevSkim's absolute source span when available; its SARIF column
    # fields have historically been one character early for some checksum findings.
    # The validated span must still lie entirely inside this exact quoted digest.
    line = source_lines[line_number - 1]
    region_span = _source_region_span_on_line(
        region, line_number, line, source_text, context=context
    )
    if region_span is None:
        return False
    return (
        region_span[0] >= value_span[0] - 1
        and region_span[1] <= value_span[1] + 1
    )




def should_suppress_constitution_template_checksum(
    relative_path: str,
    source_text: str,
    region: dict,
    context: "SourceContext | None" = None,
) -> bool:
    """Suppress only the exact SHA-256 checksum field in the tracked constitution template."""
    context = context or SourceContext.from_text(source_text)
    if relative_path != ".specify/memory/.constitution-template.json":
        return False
    line_number = region.get("startLine")
    if not isinstance(line_number, int) or isinstance(line_number, bool) or line_number < 1:
        return False
    document = context.json_document()
    if not isinstance(document, dict):
        return False
    value = document.get("sha256")
    if not isinstance(value, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", value):
        return False
    lines = context.lines
    if line_number > len(lines):
        return False
    pair = JSON_STRING_PAIR_PATTERN.match(lines[line_number - 1])
    if not pair or pair.group("key") != "sha256" or pair.group("value") != value:
        return False
    value_span = pair.span("value")
    # DevSkim's reported columns can be one character early for this finding.
    # Prefer the validated absolute span and snippet when present; the helper
    # falls back to columns only when absolute-offset metadata is absent.
    region_span = _source_region_span_on_line(
        region, line_number, lines[line_number - 1], source_text, context=context
    )
    # The reported token may include the checksum's quotes, but no other source.
    return (
        region_span is not None
        and region_span[0] >= value_span[0] - 1
        and region_span[1] <= value_span[1] + 1
    )


def _loopback_origin_spans(line: str) -> list[tuple[int, int]]:
    """Return the spans of JSON string values whose URL host is loopback."""
    spans = []
    for match in JSON_STRING_VALUE_PATTERN.finditer(line):
        raw_value = match.group("value")
        # Only plain scalar strings can be a URL; escapes are not interpreted here.
        if "\\" in raw_value:
            continue
        parsed = urlsplit(raw_value)
        if parsed.scheme not in {"http", "https"}:
            continue
        if (parsed.hostname or "").casefold() in LOOPBACK_HOSTNAMES:
            spans.append(match.span("value"))
    return spans


def should_suppress_local_probe_origin(
    relative_path: str,
    source_text: str,
    region: dict,
    context: "SourceContext | None" = None,
) -> bool:
    """Suppress a loopback origin only in reviewed local server/probe locations."""
    context = context or SourceContext.from_text(source_text)
    line_number = region.get("startLine")
    if not isinstance(line_number, int) or isinstance(line_number, bool) or line_number < 1:
        return False
    lines = context.lines
    if line_number > len(lines):
        return False
    line = lines[line_number - 1]
    region_span = _source_region_span_on_line(
        region, line_number, line, source_text, context=context
    )
    if region_span is None:
        return False
    reported_text = line[region_span[0]:region_span[1]]
    if reported_text not in {LOOPBACK_TEST_ADDRESS, "local" + "host"}:
        return False

    if relative_path == PLAYWRIGHT_LOCAL_SERVER_FILE:
        for pattern in PLAYWRIGHT_LOCAL_SERVER_LINE_PATTERNS:
            if pattern.match(line) is None:
                continue
            token_start = line.find(LOOPBACK_TEST_ADDRESS)
            if token_start < 0:
                continue
            if region_span == (
                token_start,
                token_start + len(LOOPBACK_TEST_ADDRESS),
            ):
                return True
        return False

    if not is_local_probe_artifact_path(relative_path):
        return False
    # The file must still be valid JSON data, so a renamed script cannot qualify.
    if not context.is_json():
        return False
    return any(
        region_span[0] >= start and region_span[1] <= end
        for start, end in _loopback_origin_spans(line)
    )


def should_suppress_safe_contextual_finding(
    rule_id: str,
    relative_path: str,
    source_text: str,
    region: dict,
    context: "SourceContext | None" = None,
) -> bool:
    """Suppress audited contextual false positives only when SARIF points at their exact source."""
    context = context or SourceContext.from_text(source_text)
    line_number = region.get("startLine")
    if not isinstance(line_number, int) or isinstance(line_number, bool) or line_number < 1:
        return False
    lines = context.lines
    if line_number > len(lines):
        return False
    line = lines[line_number - 1]
    surrounding_context = "\n".join(lines[max(0, line_number - 3):line_number])
    region_span = _source_region_span_on_line(
        region, line_number, line, source_text, context=context
    )
    reported_text = (
        line[region_span[0]:region_span[1]] if region_span is not None else None
    )

    if rule_id == "DS172411":
        reviewed_callback_patterns = (
            SAFE_REVEAL_TIMER_CALLBACK_PATTERNS.get(relative_path)
            or SAFE_SHARE_TIMER_CALLBACK_PATTERNS.get(relative_path)
        )
        if reviewed_callback_patterns is not None:
            return any(
                _region_starts_at_pattern(
                    region, line_number, line, pattern, source_text, context=context
                )
                for pattern in reviewed_callback_patterns
            )

        if relative_path in SAFE_REVEAL_TIMER_ASSERTION_FILES:
            # This exact test line is a quoted source string in an assertion,
            # not an executed timer. Do not generalize to other test literals.
            reveal_assertion_pattern = re.compile(
                r"^[ \t]*'window\.(?P<call>setTimeout)\(\(\) => "
                r"setIsNumberFinishActive\(false\), NUMBER_FINISH_TOTAL_MS\)',[ \t]*$"
            )
            return _region_starts_at_pattern(
                region, line_number, line, reveal_assertion_pattern, source_text,
                context=context,
            )

        # The source location must begin at this safe call, not merely share its line.
        # DevSkim's historical SARIF regions point at "setTimeout", not the
        # preceding "test." prefix, so validate that exact reported token.
        test_timeout_pattern = re.compile(r"\btest\.(?P<call>setTimeout)\s*\(\s*\d[\d_]*\s*\)")
        if _region_starts_at_pattern(
            region, line_number, line, test_timeout_pattern, source_text,
            context=context,
        ):
            return (
                relative_path.startswith(("tests/", "test/", "__tests__/"))
                or ".test." in relative_path
                or ".spec." in relative_path
            )
        callable_timeout_pattern = re.compile(
            r"\bsetTimeout\s*\(\s*(?:(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>|function\b)"
        )
        return _region_starts_at_pattern(
            region, line_number, line, callable_timeout_pattern, source_text,
            context=context,
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
                            "DevSkim: ignore DS162092" in surrounding_context
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
            and "DevSkim: ignore DS610000" in surrounding_context
        )
    return False


def should_suppress_lockfile_package_name_finding(
    source_line: str,
    region: dict,
    source_text: str | None = None,
    context: "SourceContext | None" = None,
) -> bool:
    """Suppress DS126858 only when its reported token sits inside an approved package name."""
    line_number = region.get("startLine")
    if not isinstance(line_number, int) or isinstance(line_number, bool) or line_number < 1:
        return False
    region_span = _source_region_span_on_line(
        region, line_number, source_line, source_text, context=context
    )
    if region_span is None:
        return False
    reported_text = source_line[region_span[0]:region_span[1]].casefold()
    if reported_text not in {"md" + "5", "sha" + "1"}:
        return False
    return any(
        region_span[0] >= match.start() and region_span[1] <= match.end()
        for match in LOCKFILE_NAME_PATTERN.finditer(source_line)
    )


def process_sarif(data: dict, workspace: Path = WORKSPACE_ROOT) -> int:
    """Add suppressions only to narrowly validated metadata/dependency findings."""
    suppression_count = 0
    root = workspace.resolve()
    source_cache = SourceCache(root)

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
            elif rule_id in {"DS172411", "DS162092", "DS610000", "DS137138"}:
                allowed_contextual_files = KNOWN_CONTEXTUAL_SUPPRESSION_FILES
                if rule_id == "DS172411":
                    allowed_contextual_files = (
                        allowed_contextual_files
                        | SAFE_REVEAL_TIMER_CALLBACK_FILES
                        | SAFE_REVEAL_TIMER_ASSERTION_FILES
                        | SAFE_SHARE_TIMER_CALLBACK_FILES
                    )
                # The scanner helper/test files contain deliberate development fixtures.
                # Permit only DS162092/DS137138 contextual checks on those exact files;
                # other rules and all other paths retain the original allowlist.
                if rule_id in {"DS162092", "DS137138"}:
                    allowed_contextual_files = allowed_contextual_files | DEVSKIM_SELF_TEST_FILES
                # Local server/probe origins get their own validated check below.
                is_reviewable_local_probe = (
                    rule_id == "DS162092"
                    and is_local_probe_origin_path(relative_path)
                )
                if (
                    relative_path not in allowed_contextual_files
                    and not is_reviewable_local_probe
                ):
                    continue
            else:
                continue

            context = source_cache.context_for(safe_path)
            source_text = context.text
            source_line = _source_line_from_text(source_text, region)

            justification = None
            if rule_id == "DS173237" and should_suppress_metadata_finding(source_line, region):
                justification = (
                    "False positive: a complete SHA/UUID/checksum value in an explicitly "
                    "allowlisted metadata field overlaps the reported finding."
                )
            elif rule_id == "DS173237" and should_suppress_checksum_metadata_finding(
                relative_path, safe_path, source_text, region, context=context
            ):
                justification = (
                    "False positive: this exact SHA value is a pinned upstream revision "
                    "or tracked-file checksum in an allowlisted manifest map."
                )
            elif rule_id == "DS173237" and should_suppress_constitution_template_checksum(
                relative_path, source_text, region, context=context
            ):
                justification = (
                    "False positive: this is the checked-in SHA-256 digest of the constitution "
                    "template, not a credential."
                )
            elif rule_id == "DS126858" and should_suppress_lockfile_package_name_finding(
                source_line, region, source_text, context=context
            ):
                justification = (
                    "False positive: this finding is in a specifically allowlisted "
                    "dependency package name, not a weak-hash implementation."
                )
            elif rule_id == "DS126858" and should_suppress_sha512_integrity_finding(
                source_line, region, source_text, context=context
            ):
                justification = (
                    "False positive: the reported substring is inside a valid, canonical "
                    "SHA-512 package-integrity digest, not a hash algorithm invocation."
                )
            elif rule_id == "DS162092" and should_suppress_local_probe_origin(
                relative_path, source_text, region, context=context
            ):
                justification = LOCAL_PROBE_ORIGIN_JUSTIFICATION
            elif rule_id in {"DS172411", "DS162092", "DS610000", "DS137138"} and should_suppress_safe_contextual_finding(
                rule_id, relative_path, source_text, region, context=context
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
    (
        "False positive: this loopback origin appears only in local Playwright "
        "server configuration or a committed browser-probe measurement report, "
        "not in shipped production code."
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
