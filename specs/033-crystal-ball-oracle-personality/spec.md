# Feature Specification: Crystal Ball Oracle Personality

**Feature Branch**: `polish/crystal-ball-oracle-personality`  
**Created**: 2026-10-18  
**Status**: Implementation prepared; automated verification pending  
**Input**: Improve the Crystal Ball's AI readings so they feel specific, mysterious, and fortune-teller-like rather than generic chatbot replies.

## User Scenarios & Testing

### User Story 1 — Receive a distinctive fortune (Priority: P1)

A visitor asks a playful question about luck, a lucky day, or whether they might win the lottery and receives a direct, memorable reading tailored to that question.

**Why this priority**: The quality of the reading is the central promise of the Crystal Ball experience.

**Independent Test**: Send a valid question through the Oracle route and verify that its system message explicitly instructs the model to answer the exact question, make one concrete choice when asked for one, avoid stock answers, and use a distinctive oracle voice.

**Acceptance Scenarios**:
1. **Given** a visitor asks for a lucky day, **when** the Oracle generates a reading, **then** its instructions require one specific day and an interpretation rather than a generic list or default Friday answer.
2. **Given** a visitor asks whether they will win a lottery, **when** the Oracle responds, **then** it is a playful reading without promising a win or claiming knowledge of winning numbers.
3. **Given** a visitor sends a greeting, **when** the Oracle responds, **then** instructions keep the response in character instead of a generic help-desk greeting.
4. **Given** any fortune request, **when** the response is generated, **then** instructions encourage question-specific imagery and varied language while keeping answers concise.

### User Story 2 — Keep factual answers trustworthy (Priority: P2)

A visitor asks a factual or practical question and receives a direct, accurate answer rather than invented supernatural knowledge.

**Independent Test**: Verify that the system prompt preserves direct factual answering and forbids fabricated personal facts or certainty about unknowable lottery results.

**Acceptance Scenarios**:
1. Factual or practical questions are answered directly and accurately.
2. The Oracle does not claim supernatural certainty, invent private facts, guarantee lottery outcomes, or encourage chasing losses.

## Requirements

- **FR-001**: The active Oracle route MUST use an explicit, focused system prompt for distinctive fortune-style answers.
- **FR-002**: For single-choice luck questions, the prompt MUST instruct the model to give one concrete answer and a question-specific interpretation.
- **FR-003**: The prompt MUST discourage generic platitudes, repetitive openings, and stock lucky-day answers.
- **FR-004**: Lottery readings MUST remain playful and MUST NOT promise wins, imply access to future winning numbers, or encourage additional spending/chasing losses.
- **FR-005**: Factual/practical questions MUST remain subject to direct, accurate answering.
- **FR-006**: Existing API validation, rate limiting, CORS, provider/model settings, response shape, quota handling, fallbacks, visual design, and reveal effects MUST remain unchanged.
- **FR-007**: A regression test MUST inspect the system prompt sent by the active Oracle route.

## Success Criteria

- **SC-001**: The Oracle route's request contains explicit direction for specific, non-generic fortune readings and direct answers.
- **SC-002**: Automated regression coverage fails if key fortune-personality and lottery-safety instructions are removed.
- **SC-003**: The source diff contains no changes to Crystal Ball UI/artwork/animation, API protections, provider settings, dependencies, or deployment configuration.

## Assumptions

- The Next.js App Router endpoint `app/api/oracle/route.js` is the active implementation used by the current Crystal Ball client.
- This work improves the model's instructions and cannot guarantee every live model response will follow them perfectly; real-provider behavioural validation requires a credentialed request and is not performed by the mocked unit test.
