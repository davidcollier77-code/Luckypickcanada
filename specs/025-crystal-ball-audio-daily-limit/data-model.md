# Historical Data Model: Server-Side Daily Oracle Usage (Superseded)

> This data model belongs to the original audio-and-quota feature implementation. Its persistent per-IP quota has been removed. The current visitor-local data model is documented in `specs/028-crystal-ball-browser-daily-limit/data-model.md`.

# Data Model: Daily Oracle Usage

## Daily Usage

- **Key**: UTC date plus a truncated SHA-256 digest of the normalized client IP.
- **used**: Completed AI-backed answers for the key.
- **pending**: In-flight provider reservations, counted against the limit.
- **limit**: Constant value 3.
- **expiry**: Storage TTL of 48 hours to retain the prior UTC-day key briefly after reset.

## Quota Summary

- **limit**: 3.
- **used**: Completed AI-backed answers.
- **remaining**: Limit minus used and pending reservations, clamped to zero.
- **resetAt**: Next 00:00 UTC boundary as ISO-8601.

## Lifecycle

A request reserves one pending slot before the provider call. Non-empty successful AI content commits the reservation by incrementing used and decrementing pending. Network, timeout, provider-status, and empty-content failures release pending without increasing used. A new UTC date creates a new key.

## Privacy and Scope

Raw IP addresses are not stored in quota keys. The hash remains an IP-derived identifier and is retained only for the quota window. No account system or application database schema is added.
