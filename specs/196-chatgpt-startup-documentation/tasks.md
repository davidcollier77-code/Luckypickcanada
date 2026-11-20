# Tasks: Add the tested ChatGPT startup script and its README

**Input**: Design documents from `specs/196-chatgpt-startup-documentation/`
**Prerequisites**: `plan.md` and `spec.md`

## Phase 1: Add the documentation pair

- [X] T001 Create the `chatgpt/` directory at the repository root.
- [X] T002 Copy the verified v2.1.0 script bytes to `chatgpt/ChatGPT.md` without editing or reformatting.
- [X] T003 Copy the verified standalone documentation bytes to `chatgpt/README.md` without editing or reformatting.

## Phase 2: Prove exactness

- [X] T004 Compare both destination files with their verified sources using `cmp`.
- [X] T005 Confirm `chatgpt/ChatGPT.md` has 1,815 lines and SHA-256 `811a048470944199131a910a7eb67491709bc267c8ec0a09dc46b35bd5a8377f`.
- [X] T006 Confirm `chatgpt/README.md` has 184 lines and SHA-256 `f907a43c55ae93192567c0607426b041756fe86cbea8b74343db20d573441af3`.
- [X] T007 Run `bash -n chatgpt/ChatGPT.md` and confirm exit 0.

## Phase 3: Repository verification

- [X] T008 Run `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh`; passed with exit 0.
- [X] T009 Measure the production build output; 416,746,194 bytes (397.44 MiB), below the 495 MiB cap.
- [X] T010 Review the complete diff and confirm only `chatgpt/ChatGPT.md`, `chatgpt/README.md` and these Spec Kit records are added, with no existing file modified.

## Phase 4: Submission

- [ ] T011 Commit the changes, push the branch and open a non-draft PR against `main` with the complete QA scope declaration.
- [ ] T012 Stop after PR creation; leave the PR open and unmerged for the owner.
