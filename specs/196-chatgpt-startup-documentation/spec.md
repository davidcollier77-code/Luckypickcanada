# Feature Specification: Add the tested ChatGPT startup script and its README

**Feature Branch**: `docs/chatgpt-startup-v2.1.0`
**Created**: 2026-11-20
**Status**: Ready for implementation
**Input**: Add the verified v2.1.0 ChatGPT startup script as `chatgpt/ChatGPT.md` and its standalone documentation as `chatgpt/README.md`, byte-for-byte, without changing the site README or any application behaviour.

## User Scenarios & Testing

### User Story 1 - Retrieve the exact tested startup script (Priority: P1)

A repository contributor can open `chatgpt/ChatGPT.md` and obtain the same 1,815-line script that passed the 33-case regression suite, with no reformatting or content edits.

**Why this priority**: The value of the file is that it is the already-tested artifact; any edit would invalidate that verification.

**Independent Test**: Hash `chatgpt/ChatGPT.md` and compare it with the known v2.1.0 checksum.

**Acceptance Scenarios**:

1. Given the repository checkout, when `chatgpt/ChatGPT.md` is hashed, then the SHA-256 is `811a048470944199131a910a7eb67491709bc267c8ec0a09dc46b35bd5a8377f`.
2. Given the copied file, when its line count and syntax are checked, then it has 1,815 lines and `bash -n` exits 0.

### User Story 2 - Read the accompanying operating documentation (Priority: P1)

A contributor can read `chatgpt/README.md` beside the script and understand its capabilities, usage and limitations.

**Why this priority**: The script is only usable with its tested documentation; the pair must be delivered together.

**Independent Test**: Hash `chatgpt/README.md` and confirm the documented scope matches the script.

**Acceptance Scenarios**:

1. Given the repository checkout, when `chatgpt/README.md` is hashed, then the SHA-256 is `f907a43c55ae93192567c0607426b041756fe86cbea8b74343db20d573441af3`.
2. Given both files, when the pair is inspected, then each is byte-identical to its verified source copy.

### Edge Cases

- The existing root `README.md` describes the website and must not be replaced or modified.
- The script contains 198-character lines and no tabs; the copied bytes must preserve both properties.
- The files are documentation artifacts and must not become application routes, build inputs or executable startup steps.

## Requirements

- **FR-001**: Add `chatgpt/ChatGPT.md` containing the exact bytes of the tested v2.1.0 startup script.
- **FR-002**: Add `chatgpt/README.md` containing the exact bytes of the accompanying verified README.
- **FR-003**: Do not modify, rename or replace the repository's existing root `README.md`.
- **FR-004**: Do not change application code, dependencies, configuration, workflows or production behaviour.
- **FR-005**: Record the verification evidence, including both SHA-256 checksums and the script syntax check, in the task artifacts.

## Success Criteria

- **SC-001**: `chatgpt/ChatGPT.md` is byte-identical to the tested source and matches its SHA-256 checksum.
- **SC-002**: `chatgpt/README.md` is byte-identical to the tested source and matches its SHA-256 checksum.
- **SC-003**: The repository diff contains only the two requested documentation files and this task's Spec Kit records; no existing file is modified.
- **SC-004**: Application type checking, the production build and applicable repository checks pass, with the build remaining below the 495 MiB cap.
