# Luckypickcanada

A tiny, local utility to generate random Canadian lottery number sets (example project / demo for the repository).

## Usage

Run the included script with Python 3:

```bash
python3 luckypick.py
# or
chmod +x luckypick.py && ./luckypick.py
```

Presets:
- Six pick: six numbers from 1–49
- Seven pick: seven numbers from 1–50

Examples:

```bash
# Default (six pick)
python3 luckypick.py

# Seven pick preset
python3 luckypick.py --game seven-pick

# Custom count and max
python3 luckypick.py --count 5 --max 40 --sets 3
```

## Tests

Install the test dependencies and run pytest:

```bash
python3 -m pip install -r requirements.txt
python3 -m pytest -q
```

## CI

A GitHub Actions workflow runs the test suite on push and pull requests.

## License

This project is licensed under the MIT License — see LICENSE for details.

## Stripe Checkout

Set this Vercel environment variable before using the payment buttons:

- `STRIPE_SECRET_KEY`: your Stripe secret key

The homepage posts to `/api/checkout`, which creates Stripe Checkout Sessions for the $1.00 Lucky Pick and a custom tip jar amount. Lucky Pick includes either 6 unique numbers from 1 to 49 or 7 unique numbers from 1 to 50, plus a slow reveal with stars and Aurora, a lucky color, and a lucky day of the week.
