# Gift Delivery Token Security

## Overview
Replace the predictable `Math.random()` call with `crypto.randomUUID()` in the `claimGiftDeliveryLock` function in `app/gift-email.js` to ensure the security of the gift delivery ownership tokens.

## Details
The current implementation of `claimGiftDeliveryLock` uses `Math.random().toString(36).slice(2)` combined with a timestamp and session ID to generate an ownership token. `Math.random()` is not cryptographically secure and produces predictable outputs. If an attacker can guess the ownership token, they could potentially release the lock early, leading to race conditions or duplicate gift email deliveries.

Replacing this with `crypto.randomUUID()` will provide a cryptographically secure, standard, and highly unique token.
