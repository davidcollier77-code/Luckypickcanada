# Feature Specification: Linux Environment Reference Routing

**Feature Branch**: `freebuff/linux-reference-routing-20261102`
**Created**: 2026-11-02
**Status**: In progress
**Input**: Add an authoritative Linux environment reference to the same Library groups that already receive the Wrangler documentation.

## User Scenarios & Testing

### User Story 1 — Find Linux guidance in the established groups (Priority: P1)

As a Freebuff coding agent, I need a maintained Linux reference available in Troubleshooting and Deep-dive so I can consult reliable guidance for shell, filesystem, permissions, environment variables, processes, system libraries, and package management when those topics are relevant.

**Independent Test**: Inspect the manifest and both group instructions; confirm one source is routed to exactly the same two groups as Wrangler and each group points to the correct generated snapshot path.

### User Story 2 — Apply distribution-specific guidance safely (Priority: P1)

As a repository owner, I need the reference to be conditional and explicit about distro differences and restricted environments, so Freebuff does not assume every Linux runtime is Debian/Ubuntu or attempt privileged operations.

**Independent Test**: Inspect both group instructions for distro detection, Ubuntu APT cross-reference, conditional loading, and the prohibition on privilege or sandbox bypasses.

## Requirements

- **FR-001**: Register the official Debian Reference plain-text source at `https://www.debian.org/doc/manuals/debian-reference/debian-reference.en.txt` under the manifest ID `/debian/debian-reference`.
- **FR-002**: Route the source to exactly `troubleshooting` and `deep-dive`, matching `/cloudflare/workers-sdk`.
- **FR-003**: Let the existing updater create one canonical snapshot in the first group and a linked copy in the second group; do not manually create or edit generated `.docs/` files.
- **FR-004**: Add a conditional pointer in each selected group instruction to its expected `_debian_debian-reference.md` snapshot.
- **FR-005**: State that the manual is Debian-oriented and require checking the actual distribution and available permissions before applying distribution-specific commands.
- **FR-006**: Link Ubuntu's official package-management guidance for Ubuntu-specific APT behavior.
- **FR-007**: Prohibit attempts to bypass root restrictions, permission controls, or sandbox security settings.
- **FR-008**: Keep the documentation updater implementation, application behavior, dependencies, Wrangler routing, and all unrelated group routing unchanged.

## Success Criteria

- **SC-001**: The manifest contains the source ID exactly once in each of the two intended groups, with one valid source URL and one inventory entry.
- **SC-002**: Both group instructions point to their exact generated snapshot paths and describe conditional use.
- **SC-003**: The existing updater's naming and cross-group canonical/symlink behavior correctly handles the source ID without code changes.
- **SC-004**: No generated `.docs/` snapshot is claimed until the normal documentation updater actually produces it.
- **SC-005**: The PR remains open and unmerged for owner review.
