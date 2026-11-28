#!/usr/bin/env python3
"""Append previously unseen DevSkim SARIF findings to devskim-alerts.md.

The ledger is append-only: an entry is never edited, reordered or removed here.

A finding's identity is, in order of preference:

* the scanner fingerprint DevSkim emits in ``partialFingerprints`` /
  ``fingerprints`` when it emits one. It already ignores line numbering;
* otherwise the exact source text the result points at, together with the rule,
  file, message, the finding's position within its own line, its length and the
  trimmed text of its own source line. None of those depends on absolute line
  numbers or on how many other findings exist, so renumbering, inserting another
  finding elsewhere, or remediating another finding cannot hand an identity to a
  different finding.

DevSkim reports an absolute ``charOffset`` / ``charLength`` span and the matched
``snippet``; the workflow checks out the same commit the scan ran on, so the span
is validated against the real source text before it is trusted. Reported columns
are used only when that validation is unavailable.

Occurrences of one identity are matched against the entries the ledger already
records for that identity instead of a rank recomputed from the scan. A scan that
holds no more occurrences than the ledger already records appends nothing; a scan
that holds more appends only the surplus, preferring the occurrences whose
``uri:line`` is not recorded yet. This is what keeps an inserted finding recorded
at its own location and an unchanged finding recorded once. See the limitation in
``_content_identity`` for findings that are byte-identical in every observable
way.
"""

import bisect
import hashlib
import json
import os
import re
from collections import Counter, defaultdict
from pathlib import Path

SARIF_PATH = Path("devskim-alerts.sarif")
REPORT_PATH = Path("devskim-alerts.md")
MARKER = "<!-- DevSkim findings are appended below this line. -->"
NO_LOCATION = "Location not provided"
# Content-based identity. Bumped whenever the parts of the identity change.
IDENTITY_VERSION = "v3"
# Fingerprint identity written by the version this one supersedes; kept so an
# entry it wrote is still recognised.
FINGERPRINT_IDENTITY_VERSION = "v2"
# A source file larger than this is not read: no finding needs it to be hashed,
# and skipping it keeps a pathological file out of the report job's memory.
MAX_SOURCE_BYTES = 2 * 1024 * 1024
ROW_LOCATION = re.compile(r"`([^`\n]+)`[^\n]*?<!-- devskim-id:([0-9a-f]{20}) -->")
ID_MARKER = re.compile(r"<!-- devskim-id:([0-9a-f]{20}) -->")


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).replace("|", "\\|").replace("`", "\\`").strip()


def _identity_digest(parts):
    return hashlib.sha256("\0".join(parts).encode("utf-8")).hexdigest()[:20]


def _stable_fingerprint(result):
    fingerprints = result.get("partialFingerprints") or result.get("fingerprints") or {}
    if not isinstance(fingerprints, dict):
        return ""
    return (
        fingerprints.get("primaryLocationLineHash")
        or fingerprints.get("primaryLocationStartColumnFingerprint")
        or ""
    )


def _message_text(result):
    message = result.get("message") or {}
    return str(message.get("text", "")) if isinstance(message, dict) else ""


def _location(result):
    """Return (uri, region) for the first physical location of a result."""
    locations = result.get("locations") or []
    physical = {}
    if locations and isinstance(locations[0], dict):
        physical = locations[0].get("physicalLocation") or {}
    if not isinstance(physical, dict):
        physical = {}
    artifact = physical.get("artifactLocation") or {}
    uri = artifact.get("uri", NO_LOCATION) if isinstance(artifact, dict) else NO_LOCATION
    region = physical.get("region") or {}
    return uri, region if isinstance(region, dict) else {}


def _as_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _reported_position(result):
    """Return the reported position, used only to collapse exact duplicates."""
    region = _location(result)[1]
    return tuple(
        _as_int(region.get(key))
        for key in ("startLine", "startColumn", "endLine", "endColumn")
    )


def _shape_parts(rule_id, uri, message, region):
    """Parts of the occurrence-rank identity this version supersedes (v2)."""
    start_line = region.get("startLine")
    end_line = region.get("endLine")
    span = _as_int(end_line if end_line is not None else start_line) - _as_int(start_line)
    return [
        str(rule_id),
        str(uri),
        message,
        str(region.get("startColumn") or ""),
        str(region.get("endColumn") or ""),
        str(span),
    ]


class _SourceFile:
    """One source file, with DevSkim's UTF-16 offsets resolved to code points."""

    def __init__(self, text):
        self.text = text
        self.lines = text.splitlines()
        # Astral characters occupy a surrogate pair in .NET strings (which is how
        # DevSkim counts charOffset) but one Python code point.
        self._astral = [index for index, char in enumerate(text) if ord(char) > 0xFFFF]

    def index_from_utf16(self, units):
        """Return the code-point index for a UTF-16 code-unit offset, or None."""
        if isinstance(units, bool) or not isinstance(units, int) or units < 0:
            return None
        if not self._astral:
            return units if units <= len(self.text) else None

        low, high = 0, len(self.text)
        while low < high:
            middle = (low + high) // 2
            offset = middle + bisect.bisect_left(self._astral, middle)
            if offset < units:
                low = middle + 1
            else:
                high = middle
        offset = low + bisect.bisect_left(self._astral, low)
        # An offset that splits a surrogate pair has no code-point equivalent.
        return low if offset == units else None

    def line_text(self, line_number):
        if not isinstance(line_number, int) or isinstance(line_number, bool):
            return ""
        if 1 <= line_number <= len(self.lines):
            return self.lines[line_number - 1]
        return ""


class _SourceIndex:
    """Read each SARIF target at most once per run, only from the workspace."""

    def __init__(self, root=None):
        self.root = Path(root).resolve() if root is not None else Path.cwd().resolve()
        self._files = {}

    def _path(self, uri):
        if not isinstance(uri, str) or not uri or uri == NO_LOCATION or "://" in uri:
            return None
        try:
            candidate = (self.root / uri).resolve()
            candidate.relative_to(self.root)
        except (OSError, ValueError):
            return None
        return candidate

    def get(self, uri):
        """Return the parsed source file for a SARIF uri, or None when unreadable."""
        path = self._path(uri)
        if path is None:
            return None
        key = str(path)
        if key not in self._files:
            source = None
            try:
                if path.is_file() and path.stat().st_size <= MAX_SOURCE_BYTES:
                    source = _SourceFile(path.read_text(encoding="utf-8"))
            except (OSError, UnicodeDecodeError, ValueError):
                source = None
            self._files[key] = source
        return self._files[key]


def _validated_span(source, region):
    """Return the (start, end) code-point span for a result, or None.

    The absolute span is accepted only when it agrees with the source it claims
    to describe: its start line must match the file and its text must equal the
    scanner's own snippet when one is present.
    """
    start_units = region.get("charOffset")
    length_units = region.get("charLength")
    if (
        isinstance(start_units, bool)
        or not isinstance(start_units, int)
        or start_units < 0
        or isinstance(length_units, bool)
        or not isinstance(length_units, int)
        or length_units <= 0
    ):
        return None
    start = source.index_from_utf16(start_units)
    end = source.index_from_utf16(start_units + length_units)
    if start is None or end is None or end <= start:
        return None

    snippet = region.get("snippet")
    snippet_text = snippet.get("text") if isinstance(snippet, dict) else None
    if isinstance(snippet_text, str) and source.text[start:end] != snippet_text:
        return None

    start_line = region.get("startLine")
    if isinstance(start_line, int) and not isinstance(start_line, bool):
        if source.text.count("\n", 0, start) + 1 != start_line:
            return None
    return start, end


def _source_identity(uri, region, sources):
    """Return (span text, column, length, source line text) for one result.

    The content is the finding's own source, not its position: the span text and
    its line survive unrelated insertions and removals. Values that cannot be
    validated against the checked-out source fall back to the scanner's snippet
    and then to the reported columns, so nothing is invented.
    """
    snippet = region.get("snippet")
    snippet_text = snippet.get("text") if isinstance(snippet, dict) else None
    if not isinstance(snippet_text, str):
        snippet_text = ""
    start_line = _as_int(region.get("startLine"))
    start_column = _as_int(region.get("startColumn"))
    end_column = _as_int(region.get("endColumn"))

    source = sources.get(uri) if sources is not None else None
    if source is not None:
        span = _validated_span(source, region)
        if span is not None:
            start, end = span
            line_start = source.text.rfind("\n", 0, start) + 1
            line_end = source.text.find("\n", start)
            if line_end == -1:
                line_end = len(source.text)
            return (
                source.text[start:end],
                start - line_start + 1,
                end - start,
                source.text[line_start:line_end].strip(),
            )

        line = source.line_text(start_line)
        if line:
            if snippet_text:
                return snippet_text, start_column or 1, len(snippet_text), line.strip()
            if start_column >= 1 and end_column > start_column and end_column - 1 <= len(line):
                return (
                    line[start_column - 1:end_column - 1],
                    start_column,
                    end_column - start_column,
                    line.strip(),
                )
            return snippet_text, start_column, max(end_column - start_column, 0), line.strip()

    if snippet_text:
        return snippet_text, start_column, len(snippet_text), ""
    return "", start_column, max(end_column - start_column, 0), ""


def _content_identity(rule_id, uri, message, region, sources):
    """Return the fingerprint-less identity for one result.

    The identity is the finding's content: rule, file, message, the exact source
    span DevSkim matched, its position inside that line, its length and the
    trimmed text of its line. No absolute line number and no rank among other
    findings participates, so the identity cannot migrate to another finding when
    findings are inserted, removed or renumbered.

    Limitation: two findings that are byte-identical in every one of those fields
    -- same rule and message, same span text, same column/length and same line
    text, with no fingerprint -- are genuinely indistinguishable across scans.
    They share an identity, and the ledger then records their *occurrences*: an
    unchanged scan appends nothing, an extra copy appends one entry, but which
    physical location that entry names cannot be guaranteed when the copies also
    shift. DevSkim supplies no other finding-specific signal for them, and the
    ledger cannot rewrite the entry it already holds.
    """
    span_text, column, length, line_text = _source_identity(uri, region, sources)
    return _identity_digest(
        [
            IDENTITY_VERSION,
            "content",
            str(rule_id),
            str(uri),
            message,
            span_text,
            str(column),
            str(length),
            line_text,
        ]
    )


def _previous_identities(rule_id, uri, line, result, region, occurrence=0):
    """Ids written by earlier versions of this script, in their original order.

    The first entry is the original ``(rule, uri, line)`` id, which is also the
    legacy id this module has always returned as the second element of
    ``finding_identities``. The current primary identity is deliberately not
    included: callers check it separately.
    """
    identities = [_identity_digest([str(rule_id), str(uri), str(line or "")])]
    stable_fingerprint = _stable_fingerprint(result)
    if stable_fingerprint:
        identities.append(_identity_digest([str(rule_id), str(uri), str(stable_fingerprint)]))
    detail = "\0".join(
        [
            _message_text(result),
            str(region.get("startColumn") or ""),
            str(region.get("endColumn") or ""),
            str(region.get("endLine") or ""),
        ]
    )
    identities.append(_identity_digest([str(rule_id), str(uri), str(line or ""), detail]))
    # The occurrence-rank identity of the superseded version, so a ledger it had
    # already appended to is still recognised.
    identities.append(
        _identity_digest(
            [FINGERPRINT_IDENTITY_VERSION, "shape"]
            + _shape_parts(rule_id, uri, clean(_message_text(result)), region)
            + [str(occurrence)]
        )
    )
    return identities


def previous_identities(rule_id, uri, line, result, occurrence=0):
    """Return the legacy ids earlier versions of this script could have written.

    The current primary identity is not part of this list; callers check it and
    these aliases separately.
    """
    return _previous_identities(
        rule_id, uri, line, result, _location(result)[1], occurrence
    )


def _occurrence_indices(data):
    """Map each fingerprint-less result to the occurrence rank the v2 version used.

    Only needed to reproduce the ids that version may already have written.
    """
    positions = {}
    for run_index, run in enumerate(data.get("runs") or []):
        results = run.get("results") or []
        for result_index, result in enumerate(results):
            if not isinstance(result, dict) or _stable_fingerprint(result):
                continue
            uri, region = _location(result)
            shape = tuple(
                _shape_parts(
                    result.get("ruleId", "unknown"),
                    uri,
                    clean(_message_text(result)),
                    region,
                )
            )
            position = _reported_position(result)
            positions[(run_index, result_index)] = (shape, position)

    grouped = {}
    for location, (shape, position) in positions.items():
        grouped.setdefault(shape, []).append((position, location))

    indices = {}
    for items in grouped.values():
        index = 0
        previous = None
        for position, location in sorted(items):
            if previous is not None and position != previous:
                index += 1
            previous = position
            indices[location] = index
    return indices


def finding_identities(rule_id, uri, line, result, occurrence=0, sources=None):
    """Return (identity, legacy_identity) for one SARIF result.

    ``identity`` is the fingerprint when DevSkim supplies one, otherwise the
    finding's own source content. It never depends on the reported line, so a
    renumber cannot re-append a recorded finding, and it never depends on the
    number or order of other findings, so an insertion or a remediation cannot
    transfer it to a different finding.

    ``occurrence`` and ``sources`` are implementation details: the occurrence is
    used only to reproduce the superseded version's alias, and ``sources`` lets a
    caller share one per-run source cache.
    """
    region = _location(result)[1]
    stable_fingerprint = _stable_fingerprint(result)
    if stable_fingerprint:
        identity = _identity_digest(
            [
                FINGERPRINT_IDENTITY_VERSION,
                "fingerprint",
                str(rule_id),
                str(uri),
                str(stable_fingerprint),
            ]
        )
    else:
        identity = _content_identity(rule_id, uri, _message_text(result), region, sources)
    return identity, _previous_identities(rule_id, uri, line, result, region, occurrence)[0]


def finding_identity(rule_id, uri, line, result, occurrence=0, sources=None):
    """Return the identity used to record one SARIF result."""
    return finding_identities(rule_id, uri, line, result, occurrence, sources)[0]


def _recorded_entries(report):
    """Return how many entries the ledger records per identity, and where."""
    counts = Counter()
    locations = defaultdict(set)
    for match in ID_MARKER.finditer(report):
        counts[match.group(1)] += 1
    for match in ROW_LOCATION.finditer(report):
        where, identity = match.group(1), match.group(2)
        locations[identity].add(where)
    return counts, locations


def append_findings(sarif_path=SARIF_PATH, report_path=REPORT_PATH):
    if report_path.exists():
        report = report_path.read_text(encoding="utf-8")
    else:
        report = (
            "# DevSkim alerts\n\n"
            "This is the running list of distinct findings detected by DevSkim. "
            "New findings are appended once; entries are not removed automatically. "
            "Remove an entry only after remediation has been verified.\n\n"
            + MARKER + "\n"
        )

    counts, recorded_locations = _recorded_entries(report)
    data = json.loads(Path(sarif_path).read_text(encoding="utf-8"))
    sources = _SourceIndex()
    legacy_occurrences = _occurrence_indices(data)

    # One candidate per distinct reported occurrence: an exact duplicate result
    # (same identity at the same position) is recorded once.
    candidates = []
    seen = set()
    for run_index, run in enumerate(data.get("runs") or []):
        if not isinstance(run, dict):
            continue
        for result_index, result in enumerate(run.get("results") or []):
            if not isinstance(result, dict):
                continue
            rule_id = result.get("ruleId", "unknown")
            uri, region = _location(result)
            line = region.get("startLine")
            where = f"{uri}:{line}" if line else uri
            message = clean(_message_text(result) or "No message provided")
            level = clean(result.get("level", "unspecified"))
            identity = finding_identity(
                rule_id,
                uri,
                line,
                result,
                legacy_occurrences.get((run_index, result_index), 0),
                sources,
            )
            key = (identity, _reported_position(result))
            if key in seen:
                continue
            seen.add(key)
            candidates.append(
                {
                    "identity": identity,
                    "where": where,
                    "row": (
                        f"- **{level.upper()} — {clean(rule_id)}** — "
                        f"`{clean(where)}` — {message} "
                        f"<!-- devskim-id:{identity} -->"
                    ),
                    "aliases": previous_identities(
                        rule_id,
                        uri,
                        line,
                        result,
                        legacy_occurrences.get((run_index, result_index), 0),
                    ),
                }
            )

    # Match the scan's occurrences against the entries the ledger already holds
    # for the same identity.
    remaining = Counter(counts)
    matched = [False] * len(candidates)

    # 1. Same identity at the location it was recorded at: that entry is this
    #    occurrence, whatever else was inserted or removed around it.
    for index, candidate in enumerate(candidates):
        identity = candidate["identity"]
        if remaining[identity] > 0 and candidate["where"] in recorded_locations.get(identity, ()):
            remaining[identity] -= 1
            matched[index] = True

    # 2. Remaining recorded occurrences of the same identity cover the rest of
    #    this scan's occurrences (a pure renumber, or a copy that moved).
    for index, candidate in enumerate(candidates):
        if not matched[index] and remaining[candidate["identity"]] > 0:
            remaining[candidate["identity"]] -= 1
            matched[index] = True

    # 3. An entry written by an earlier version of this script still covers the
    #    finding it named, so upgrading never duplicates history. Each such entry
    #    covers one occurrence only: an earlier id is line-based, so letting it
    #    cover every candidate on that line could hide a genuinely new finding.
    for index, candidate in enumerate(candidates):
        if matched[index]:
            continue
        for alias in candidate["aliases"]:
            if remaining[alias] > 0:
                remaining[alias] -= 1
                matched[index] = True
                break

    additions = [
        candidate["row"]
        for index, candidate in enumerate(candidates)
        if not matched[index]
    ]

    if additions:
        report = report.rstrip() + "\n\n" + "\n".join(additions) + "\n"
        report_path.write_text(report, encoding="utf-8")

    output_path = os.environ.get("GITHUB_OUTPUT")
    if output_path:
        with open(output_path, "a", encoding="utf-8") as output:
            output.write(f"new_count={len(additions)}\n")
    print(f"Appended {len(additions)} new DevSkim finding(s).")
    return len(additions)


if __name__ == "__main__":
    append_findings()
