# Data Model: Paid Lucky Reveal Counter

## Counted paid reveal (`lucky_reveal_tally`)

| Column | Type | Constraints | Meaning |
|---|---|---|---|
| `id` | `BIGSERIAL` | primary key | Surrogate key; not exposed. |
| `session_id` | `TEXT` | not null, unique | The paid checkout session. The unique constraint is the duplicate-counting guard. |
| `reveal_type` | `TEXT` | not null, `CHECK (reveal_type IN ('lucky_pick', 'gift_package'))` | The paid product: Personal Reveal (CAD $1.00) or Gift Reveal (CAD $1.99). Tips and previews are not representable. |
| `created_at` | `TIMESTAMPTZ` | not null, default `NOW()` | When the purchase was first recorded. |

## Public reveal total

Derived, not stored: `SELECT COUNT(*) FROM lucky_reveal_tally`. An empty table is the requested zero
state. Missing configuration, a malformed value or a database error is reported as 0.

## Relationships

None. The tally deliberately stores no customer name, email, message, location or reveal result, so it
adds no personal data and does not change `lucky_reveals`, `luck_shares` or gift-email records.
