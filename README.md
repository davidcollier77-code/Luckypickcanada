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

Set these Vercel environment variables before using the payment buttons, gift email delivery, Little Luck Map, and suggestion box:

- `STRIPE_SECRET_KEY`: your Stripe secret key
- `RESEND_API_KEY`: Resend API key used to send $4.99 gift emails and suggestion notifications
- `GIFT_FROM_EMAIL`: verified sender email address for gift delivery; also used for suggestion notifications unless `SUGGESTIONS_FROM_EMAIL` is set
- `SUGGESTIONS_FROM_EMAIL`: optional verified sender email address for suggestion notifications
- `SUGGESTIONS_TO_EMAIL`: optional destination for suggestion notifications; defaults to `davidcollier77@gmail.com`
- `POSTGRES_URL` or `DATABASE_URL`: database connection string used to save Little Luck Map submissions and suggestions
- `ADMIN_PASSWORD`: password for `/admin/suggestions`, where saved suggestions can be reviewed

The homepage posts to `/api/checkout`, which creates Stripe Checkout Sessions for the $1.00 Lucky Pick, $4.99 gift email package, and a custom tip jar amount. Lucky Pick includes either 6 unique numbers from 1 to 49 or 7 unique numbers from 1 to 50, plus a slow reveal with stars and Aurora, a lucky color, and a lucky day of the week. The gift package sends the selected lucky pick, lucky color, lucky day, and personal greeting to the recipient by email after payment.

After completing the $1.00 Lucky Pick checkout, visitors can add their name and province or territory to the Little Luck Map. Submissions are verified against the paid Stripe Checkout Session, saved in the `luck_shares` database table, and shown as province counts plus recent shares.

Suggestions are saved in the `suggestions` database table and can be reviewed at `/admin/suggestions` with `ADMIN_PASSWORD`.

Disclaimer: Lucky Pick Canada is not affiliated with, endorsed by, or connected to any lottery organization. Picks are for fun and entertainment only.
