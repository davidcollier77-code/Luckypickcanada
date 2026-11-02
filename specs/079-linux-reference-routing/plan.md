# Implementation Plan: Linux Environment Reference Routing

**Branch**: `freebuff/linux-reference-routing-20261102` | **Date**: 2026-11-02 | **Spec**: `specs/079-linux-reference-routing/spec.md`

## Summary

Register the official Debian Reference manual as one manifest source, route it to the same Troubleshooting and Deep-dive groups as Wrangler, and add concise optional pointers to those two group instructions.

## Technical Context

- **Format**: Markdown and JSON; no application code.
- **Source**: Official Debian Reference plain-text edition at `https://www.debian.org/doc/manuals/debian-reference/debian-reference.en.txt`.
- **Supporting Ubuntu guidance**: https://ubuntu.com/server/docs/package-management/.
- **Updater**: Existing `scripts/refresh-docs.js`; do not modify it.
- **Testing**: Parse the manifest; assert exact source/group/inventory membership; verify the source ID sanitizes to `_debian_debian-reference.md`; inspect updater's canonical-first-group and cross-group link/fallback logic; run existing refresh-docs tests and repository verification when a repo shell is available.
- **Constraints**: `.docs/` remains generated/read-only. Do not commit duplicate group copies. Do not assume Debian/Ubuntu commands apply to every Linux distribution. No privilege escalation or sandbox weakening.

## Constitution Check

- **Single source of truth**: PASS — one upstream source ID, one configured URL.
- **Verify before acting**: PASS — Wrangler routing, manifest schema and updater logic inspected.
- **Protected systems**: PASS — no deployment, secrets, payment, database or application changes.
- **Resource and refresh control**: PASS — manifest routing only; updater implementation unchanged. Actual refresh remains pending until this PR is merged and the default-branch updater runs.

## Design

1. Add `/debian/debian-reference` to `troubleshooting` and `deep-dive`, matching the Wrangler source's group placement.
2. Add one URL source and one inventory entry; do not add a GitHub SHA because the source is hosted on Debian's official website.
3. Add a conditional local-snapshot pointer to each group's specialist instructions. Each pointer emphasizes distro detection, Ubuntu package-manager guidance, and sandbox/privilege safety.
4. Leave generated files under `.docs/` to `scripts/refresh-docs.js`. The updater's existing source-ID sanitizer yields `_debian_debian-reference.md`; it writes the canonical copy to Troubleshooting and links Deep-dive to it.
5. Do not change updater code, group order, or the Wrangler source.

## Source Notes

The Debian Reference is a broad, Debian-maintained guide to Linux system administration and command-line use. Because it is Debian-specific in some operational details, group guidance explicitly requires identifying the target distribution before applying package or service commands. Ubuntu's official APT guide is linked for Ubuntu-specific package-management details.
