# Tasks

- [x] T001 Setup Robin configuration `.github/robin.yml`
- [x] T002 Implement Robin GitHub Action `.github/workflows/robin.yml` with OpenRouter
- [x] T003 Remove Inori Action `.github/workflows/inori-review.yml`
- [x] T004 Make Robin endpoint/model configurable through optional repository variables, retaining `openrouter/free` and the official OpenRouter endpoint as defaults.
- [x] T005 Remove caller-level concurrency so unrelated `issue_comment` events cannot cancel an active Robin review; rely on the reusable workflow's job-level filter and concurrency.
