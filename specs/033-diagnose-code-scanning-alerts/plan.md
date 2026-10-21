# Implementation Plan: Diagnose Code Scanning Alerts Access

## Technical Context

- **Goal:** Diagnose 401 Unauthorized errors encountered when accessing the GitHub Code Scanning Alerts API.
- **Environment:** The diagnosis is occurring within the Jules environment, attempting to use available authentication mechanisms to access repository security endpoints.
- **Dependencies:** GitHub REST API documentation for Code Scanning Alerts.

## Phase 0: Research

- **Unknowns:** The precise authentication context Jules is running with natively when interacting with GitHub (e.g., whether it uses a fine-grained PAT, a classic PAT, or a GitHub App installation token).
- **Decision:** I will rely on the official GitHub documentation which outlines the required permissions for Code Scanning alerts (`security_events` for PATs or "Code scanning alerts" repository permissions for Apps) and document this as the required remedy, given that local tests without explicit tokens return 401.

## Phase 1: Applicable Design Artifacts

- Since this is an audit/diagnostic task that requires no codebase changes, design artifacts (`data-model.md`, `contracts/`, `quickstart.md`) are omitted.
