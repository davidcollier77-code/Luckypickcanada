# Contract: `GET /api/lucky-reveals-count`

Public read-only endpoint used by the homepage counter. No authentication, no request body, no query
parameters and no customer data.

## Response

`200 OK`

```json
{ "total": 0 }
```

- `total`: non-negative integer. `0` when no paid reveal has been recorded, when the counter store is
  unconfigured, or when reading the store fails.
- Headers: `Cache-Control: no-store, max-age=0` so a cached total cannot outlive a purchase.
- The endpoint never accepts writes. Recording is internal and server-side only.

## Recording contract (internal)

`recordLuckyRevealCreated({ sessionId, revealType })`

- `sessionId`: non-empty paid checkout session id; the idempotency key.
- `revealType`: `"lucky_pick"` or `"gift_package"` only.
- Result: `{ counted: true }` when this call inserted the first row for that session, otherwise
  `{ counted: false, reason }` with `reason` one of `invalid`, `unconfigured` or `error`.
- Never throws; a failure is logged and leaves the total unchanged. Callers must not fail a payment,
  delivery or webhook because of it.
