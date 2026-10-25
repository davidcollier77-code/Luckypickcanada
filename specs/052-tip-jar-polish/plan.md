# Tip Jar Polishing Plan

## Step 1: Update Modal Copy
- In `app/checkout-modal.js`, update the `COPY` object for the `tip` key.
- Change the `description` to be warmer and add a short thank-you message, e.g., "Thank you so much for your support! Your generosity keeps the magic alive. Choose an amount in Canadian dollars to continue to the secure checkout."

## Step 2: Update Modal Styles
- In `public/themes/default/homepage.css` and `themes/default/homepage.css`, update the styles for `.checkout-modal` but *only* for the tip jar context, or apply a specific class for the tip jar.
- Since `.checkout-modal` is shared, I will add a dynamic class in `app/checkout-modal.js`: `<section className={\`checkout-modal checkout-modal-${type}\`}`.
- Then, in the CSS files, I will target `.checkout-modal-tip` to make it "warmer, brighter, more polished, and appreciative."
- I'll add a subtle golden glow or gradient specific to `.checkout-modal-tip`, e.g., `background: linear-gradient(145deg, #2a2010, #141005);` and a warmer box-shadow `box-shadow: 0 26px 80px rgba(250, 204, 21, 0.15);`.

## Step 3: Verify Changes
- Run `./jules-verify.sh`.
- Test the application build (`pnpm run build`).
