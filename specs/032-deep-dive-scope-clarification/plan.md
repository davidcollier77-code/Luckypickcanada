# Implementation Plan: Deep-Dive Scope Clarification

**Date**: 2026-10-18  
**Branch**: `fix/deep-dive-audit-scope-clarification-20261018`  
**Spec**: [spec.md](spec.md)

## Root Cause

The existing final sentence in `.jules/deep-dive.md` prohibited an audit-only stage that produces a report-only PR. That rule can conflict with explicit owner authorization for a substantive audit that must not delete or implement anything.

## Change

Replace only the closing scope rule with wording that:
- keeps evidence-driven findings and actionable conclusions mandatory;
- makes implementation the default only when it falls within authorized scope;
- explicitly allows owner-authorized audit-only/investigation-only/report-only tasks;
- forbids forced implementation, deletion, or scope expansion; and
- retains substantive evidence, limitations, recommendations, verification, and reporting requirements.

## Safety and Verification

- Preserve the mandatory resources and Context7 approval language above the edited section.
- Do not edit `AGENTS.md` or any `.docs/` snapshot.
- Review the changed-file list and patch.
- Run `./jules-verify.sh` and inspect current-head PR checks; no local shell execution is available in this editing session, so checks must be confirmed from CI before final approval.
