#!/usr/bin/env python3
"""Summarize raw and filtered DevSkim SARIF without classifying findings by guesswork."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


class SarifSummaryError(ValueError):
    """The scanner output cannot be summarized reliably."""


def load_results(path: str | Path) -> list[dict]:
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SarifSummaryError(f"cannot read valid SARIF from {path}: {error}") from error
    if not isinstance(data, dict) or not isinstance(data.get("runs"), list):
        raise SarifSummaryError(f"{path} is not a SARIF document with runs")
    results = []
    for run in data["runs"]:
        if not isinstance(run, dict) or not isinstance(run.get("results", []), list):
            raise SarifSummaryError(f"{path} contains a malformed SARIF run")
        for result in run.get("results", []):
            if not isinstance(result, dict):
                raise SarifSummaryError(f"{path} contains a malformed SARIF result")
            results.append(result)
    return results


def _finding(result: dict) -> dict:
    locations = result.get("locations") or []
    physical = locations[0].get("physicalLocation", {}) if locations and isinstance(locations[0], dict) else {}
    artifact = physical.get("artifactLocation", {}) if isinstance(physical, dict) else {}
    region = physical.get("region", {}) if isinstance(physical, dict) else {}
    properties = result.get("properties") or {}
    message = result.get("message") or {}
    return {
        "rule": str(result.get("ruleId") or "unknown"),
        "level": str(result.get("level") or "unspecified"),
        "severity": str(properties.get("DevSkimSeverity") or "unspecified"),
        "confidence": str(properties.get("DevSkimConfidence") or "unspecified"),
        "path": str(artifact.get("uri") or "location-not-provided"),
        "line": region.get("startLine"),
        "message": str(message.get("text") or "No message provided").replace("\n", " ").strip(),
    }


def build_report(raw_path: str | Path, filtered_path: str | Path) -> dict:
    raw = load_results(raw_path)
    filtered = load_results(filtered_path)
    if len(filtered) > len(raw):
        raise SarifSummaryError(
            f"filtered SARIF has {len(filtered)} findings, more than raw SARIF ({len(raw)})"
        )
    findings = [_finding(result) for result in filtered]
    return {
        "raw_count": len(raw),
        "filtered_count": len(filtered),
        "suppressed_count": len(raw) - len(filtered),
        "remaining": findings,
    }


def render_markdown(report: dict) -> str:
    lines = [
        "## DevSkim scan findings",
        "",
        f"- Raw scanner results: {report['raw_count']}",
        f"- Results removed by the audited suppression filter: {report['suppressed_count']}",
        f"- Results remaining for review: {report['filtered_count']}",
        "",
    ]
    if report["remaining"]:
        lines.extend(["### Remaining findings requiring review", ""])
        for item in report["remaining"]:
            where = item["path"]
            if item["line"] is not None:
                where += f":{item['line']}"
            lines.append(
                f"- **{item['rule']}** — {item['level']} / {item['severity']} "
                f"(confidence: {item['confidence']}) — {where} — {item['message']}"
            )
    else:
        lines.append("No findings remain in the filtered SARIF for this run.")
    lines.extend([
        "",
        "A scanner finding is evidence to review, not by itself proof of a vulnerability. "
        "A remaining result is not automatically a false positive either. Review the exact "
        "source, data flow, rule and SARIF location. Suppression counts do not replace that review.",
        "",
    ])
    return "\n".join(lines)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw", default="devskim-alerts.raw.sarif")
    parser.add_argument("--filtered", default="devskim-alerts.sarif")
    parser.add_argument("--summary", default=None)
    args = parser.parse_args(argv)
    try:
        report = build_report(args.raw, args.filtered)
    except SarifSummaryError as error:
        print(f"DevSkim summary BLOCKED: {error}", file=sys.stderr)
        return 2
    markdown = render_markdown(report)
    if args.summary:
        with open(args.summary, "a", encoding="utf-8") as handle:
            handle.write(markdown)
    print(markdown)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
