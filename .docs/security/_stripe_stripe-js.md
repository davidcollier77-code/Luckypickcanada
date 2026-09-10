## PaymentRequestButtonElement

*The payment request button and `stripe.paymentRequest()` are deprecated. [Migrate to the express checkout element](https://docs.stripe.com/elements/express-checkout-element/migration.md).*

Use the `PaymentRequestButtonElement` from `@stripe/react-stripe-js` to display Apple Pay, Google Pay,
Link (also known as Onelink in the UK), and browser-based payment request buttons powered by the Payment Request API.

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating a `paymentRequestButton` element.
    - `classes`
      Set custom class names on the container DOM element when the Stripe element is in a particular state.
      - `base`
        The base class applied to the container.
Defaults to `StripeElement`.
      - `complete`
        The class name to apply when the `Element` is complete.
Defaults to `StripeElement--complete`.
      - `empty`
        The class name to apply when the `Element` is empty.
Defaults to `StripeElement--empty`.
      - `focus`
        The class name to apply when the `Element` is focused.
Defaults to `StripeElement--focus`.
      - `invalid`
        The class name to apply when the `Element` is invalid.
Defaults to `StripeElement--invalid`.
      - `webkitAutofill`
        The class name to apply when the `Element` has its value autofilled by the browser (only on Chrome and Safari).
Defaults to `StripeElement--webkit-autofill`.
    - `style`
      An object used to customize the appearance of the payment request button.
The object must have a single `paymentRequestButton` field, containing any of the following sub-fields:
      - `type`
        Preferred button type to display. Available types, by wallet:


Browser card: `default`, `book`, `buy`, or `donate`.

Google Pay: `default`, `buy`, or `donate`.

Apple Pay: `default`, `book`, `buy`, `donate`, `check-out`, `subscribe`, `reload`, `add-money`, `top-up`, `order`, `rent`, `support`, `contribute`, `tip`


When a wallet does not support the provided value, `default` is used as a fallback.
      - `theme`
        One of `dark`, `light`, or `light-outline`.
The default is `dark`.
      - `height`
        The height of the payment request button. Accepts `px` unit values.
    - `paymentRequest`
      A [PaymentRequest](https://docs.stripe.com/js/payment_request.md) object used to configure the element.

- `onClick`
  Callback called when the customer clicks the Element.
Receives the [click event payload](https://docs.stripe.com/js/element/events/on_click?type=expressCheckoutElement.md#element_on_click-handler).

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

### Example

```title
Render PaymentRequestButtonElement
```
