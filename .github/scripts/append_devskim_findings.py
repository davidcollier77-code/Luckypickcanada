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


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).replace("|", "\\|").replace("`", "\\`").strip()


def finding_identity(rule_id, uri, line, result):
    fingerprints = result.get("partialFingerprints") or result.get("fingerprints") or {}
    stable_fingerprint = (
        fingerprints.get("primaryLocationLineHash")
        or fingerprints.get("primaryLocationStartColumnFingerprint")
        or ""
    )
    if stable_fingerprint:
        identity = "\0".join([str(rule_id), str(uri), str(stable_fingerprint)])
    else:
        identity = "\0".join([str(rule_id), str(uri), str(line or "")])
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()[:20]


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
    additions = []

    for run in data.get("runs", []):
        for result in run.get("results", []):
            rule_id = result.get("ruleId", "unknown")
            message = clean(result.get("message", {}).get("text", "No message provided"))
            level = clean(result.get("level", "unspecified"))
            locations = result.get("locations", [])
            location = locations[0] if locations else {}
            physical = location.get("physicalLocation", {})
            uri = physical.get("artifactLocation", {}).get("uri", "Location not provided")
            region = physical.get("region", {})
            line = region.get("startLine")
            where = f"{uri}:{line}" if line else uri
            finding_id = finding_identity(rule_id, uri, line, result)

            if finding_id in known:
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
