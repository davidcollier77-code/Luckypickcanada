# Data Model — Crystal Ball Leaf-First Fortune Reveal

No persistent data model changes. The animation uses ephemeral component state only:
- status: loading, pre-reveal pulse, leaf flight, reveal, completion pulse, or error.
- leafFlight: viewport start coordinates plus the measured delta to the fortune panel.
- Existing readings array remains the in-session history; no question-count limit is added.
