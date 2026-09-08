### PaymentRequestButtonElement Props

Source: https://docs.stripe.com/js/react_stripe_js/elements/other/payment_request_button_element.md

Documentation for the props available on the PaymentRequestButtonElement.

```APIDOC
## PaymentRequestButtonElement

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
      An object used to customize the appearance of the Payment Request Button.
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
        The height of the Payment Request Button. Accepts `px` unit values.
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

```
```

--------------------------------

### CardElement

Source: https://docs.stripe.com/js/custom_checkout/element_events/on_confirm

The CardElement component collects full card details with automatic validation.

```APIDOC
## CardElement

### Description
Use the CardElement to collect card details with automatic validation.

### Props
- **id** (string) - Sets the DOM id attribute on the rendered Element container.
- **className** (string) - Applies custom CSS classes to the Element container.
- **options** (object) - Options for creating a card element.
- **onChange** (function) - Callback called when any value in the change event payload changes.
- **onNetworksChange** (function) - Callback called when the available card networks change.
- **onReady** (function) - Callback called once the Element is fully rendered.
- **onBlur** (function) - Callback called when the Element loses focus.
- **onFocus** (function) - Callback called when the Element receives focus.
- **onEscape** (function) - Callback called when the escape key is pressed within the Element.
- **onLoadError** (function) - Callback called when the Element fails to load.
```

--------------------------------

### stripe.confirmSetupIntent(clientSecret, element, data)

Source: https://docs.stripe.com/js.md

Confirms a SetupIntent using the provided client secret, Stripe Element, and optional data.

```APIDOC
## stripe.confirmSetupIntent(clientSecret, element, data)

### Description
Use this method when the customer submits your save payment method form. It gathers payment information from the provided Element and confirms the SetupIntent.

### Parameters
- **clientSecret** (string) - Required - The client secret of the SetupIntent to confirm.
- **element** (Element) - Required - An Element used to create a payment method.
- **data** (object) - Optional - Data to be sent with the request, including payment_method_data and billing_details.
```

--------------------------------

### Retrieve a SetupIntent

Source: https://docs.stripe.com/js/setup_intents/retrieve_setup_intent.md

Retrieve a SetupIntent using its client secret.

```APIDOC
## Retrieve a SetupIntent

`stripe.retrieveSetupIntent(clientSecret: string)`

Retrieve a [SetupIntent](https://docs.stripe.com/api/setup_intents.md) using its client secret.

### Parameters

* **clientSecret** (string) - Required - The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent` to retrieve.

### Example

```javascript
stripe.retrieveSetupIntent('seti_12345_secret_abcdef')
```
```

### Elements without an intent > options

Source: https://docs.stripe.com/js/elements_object/update_address_element

Advanced configuration options such as setupFutureUsage, captureMethod, and onBehalfOf allow for fine-tuned control over payment behavior. These settings should align with the corresponding values used on the Intent during payment confirmation to ensure consistency.
