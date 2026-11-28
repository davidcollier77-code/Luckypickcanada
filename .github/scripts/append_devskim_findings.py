#!/usr/bin/env python3
"""Append previously unseen DevSkim SARIF findings to devskim-alerts.md."""

import hashlib
import json
import os
import re
from pathlib import Path

SARIF_PATH = Path("devskim-alerts.sarif")
REPORT_PATH = Path("devskim-alerts.md")
MARKER = "<!-- DevSkim findings are appended below this line. -->"
IDENTITY_VERSION = "v2"


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
    uri = artifact.get("uri", "Location not provided") if isinstance(artifact, dict) else "Location not provided"
    region = physical.get("region") or {}
    return uri, region if isinstance(region, dict) else {}


def _as_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _shape_parts(rule_id, uri, message, region):
    """Identity parts that describe a finding without depending on its line."""
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


def _previous_identities(rule_id, uri, line, result, region):
    """Ids written by earlier versions of this script, in their original order.

    The first entry is the original (rule, uri, line) id, which is also the
    legacy id callers have always received.
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
    return identities


def previous_identities(rule_id, uri, line, result):
    """Return every id an earlier version of this script could have written."""
    return _previous_identities(rule_id, uri, line, result, _location(result)[1])


def _occurrence_indices(data):
    """Map each fingerprint-less result to its index among its identical shapes.

    Results are ordered by their reported position, so a line shift keeps the
    order (and therefore the indices) intact. Two results with the same shape
    and the same position are exact duplicates and share one index, so they are
    still recorded once; two distinct findings that happen to share a shape keep
    separate indices and stay separate entries.
    """
    positions = {}
    for run_index, run in enumerate(data.get("runs") or []):
        for result_index, result in enumerate(run.get("results") or []):
            if not isinstance(result, dict) or _stable_fingerprint(result):
                continue
            uri, region = _location(result)
            shape = tuple(
                _shape_parts(result.get("ruleId", "unknown"), uri, clean(_message_text(result)), region)
            )
            position = tuple(
                _as_int(region.get(key))
                for key in ("startLine", "startColumn", "endLine", "endColumn")
            )
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


def finding_identities(rule_id, uri, line, result, occurrence=0):
    """Return (identity, legacy_identity) for one SARIF result.

    The identity is independent of the reported line, so renumbering a file
    cannot re-append a finding that is already recorded:

    * a stable scanner fingerprint identifies a finding across scans on its own;
    * without one, the finding's rule, file, message and reported columns/span
      identify it, combined with its occurrence index among identical shapes in
      the same scan.

    The occurrence index keeps genuinely distinct identical findings apart and
    keeps exact duplicate results collapsed, while a pure line shift changes
    neither the shape nor the index. The legacy id is still returned so an entry
    already in the append-only report is recognised and never re-appended.
    """
    region = _location(result)[1]
    stable_fingerprint = _stable_fingerprint(result)
    if stable_fingerprint:
        identity = _identity_digest(
            [IDENTITY_VERSION, "fingerprint", str(rule_id), str(uri), str(stable_fingerprint)]
        )
    else:
        identity = _identity_digest(
            [IDENTITY_VERSION, "shape"]
            + _shape_parts(rule_id, uri, clean(_message_text(result)), region)
            + [str(occurrence)]
        )
    return identity, _previous_identities(rule_id, uri, line, result, region)[0]


def finding_identity(rule_id, uri, line, result, occurrence=0):
    """Return the identity used to record one SARIF result."""
    return finding_identities(rule_id, uri, line, result, occurrence)[0]


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

    known = set(re.findall(r"<!-- devskim-id:([0-9a-f]{20}) -->", report))
    data = json.loads(Path(sarif_path).read_text(encoding="utf-8"))
    occurrences = _occurrence_indices(data)
    additions = []

    for run_index, run in enumerate(data.get("runs", [])):
        for result_index, result in enumerate(run.get("results", [])):
            rule_id = result.get("ruleId", "unknown")
            message = clean(result.get("message", {}).get("text", "No message provided"))
            level = clean(result.get("level", "unspecified"))
            uri, region = _location(result)
            line = region.get("startLine")
            where = f"{uri}:{line}" if line else uri
            finding_id = finding_identity(
                rule_id,
                uri,
                line,
                result,
                occurrences.get((run_index, result_index), 0),
            )

            if finding_id in known or any(
                identity in known for identity in previous_identities(rule_id, uri, line, result)
            ):
                continue
            known.add(finding_id)
            additions.append(
                f"- **{level.upper()} — {clean(rule_id)}** — "
                f"`{clean(where)}` — {message} "
                f"<!-- devskim-id:{finding_id} -->"
            )

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
