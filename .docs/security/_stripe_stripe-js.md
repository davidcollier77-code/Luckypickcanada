# Stripe.js reference

## Stripe.js reference

This reference documents every object and method available in Stripe’s browser-side JavaScript library, Stripe.js.
Use our [React Stripe.js reference](https://docs.stripe.com/stripe-js/react.md) if you want to add Elements to your React based app.

You can use Stripe.js’ APIs to tokenize customer information,
collect sensitive payment details using customizable [Stripe Elements](https://docs.stripe.com/payments/elements.md),
and accept payments with [browser payment APIs](https://docs.stripe.com/stripe-js/elements/payment-request-button.md)
like Apple Pay and the Payment Request API.

## Including Stripe.js

Include the Stripe.js script on each page of your site—it should always be loaded directly from `https://js.stripe.com`, rather than included in a bundle or hosted yourself.

To best leverage Stripe’s advanced fraud functionality, include this script on every page, not just the checkout page.
This [allows Stripe to detect suspicious behavior](https://docs.stripe.com/disputes/prevention/advanced-fraud-detection.md) that may be indicative of fraud as customers browse your website.

**Using Stripe.js as a module**

We also provide an npm package that makes it easier to load and use Stripe.js as a module.
For more information, check out the [project on GitHub](https://github.com/stripe/stripe-js).

**Asynchronous and deferred loading of Stripe.js**

Asynchronous loading of JavaScript is generally recommended, as it can improve the user experience of your site by not blocking DOM rendering during [script loading.](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_is_JavaScript#script_loading_strategies)
The easiest way to asynchronously load Stripe.js is to use the npm module as described above.
It does asynchronous loading by default.

You can also load Stripe.js using the `async` or `defer` attribute on the script tag.
Note, however, that with asynchronous loading any API calls will have to be made only after the script execution has finished.

**Versioning**

The Stripe.js URL is versioned—we recommend keeping up to date with the latest version. For more information, see the [Stripe.js versioning and support policy](https://docs.stripe.com/sdks/stripejs-versioning.md).

## Initializing Stripe.js

`Stripe(publishableKey: string, options?: object)`

Use `Stripe(publishableKey, options?)` to create an instance of the **Stripe object**. The Stripe object is your entrypoint to the rest of the Stripe.js SDK.

Your Stripe publishable [API key](https://docs.stripe.com/keys.md) is required when calling this function, as it identifies your website to Stripe.

We've prefilled the example with a sample [test API key](https://docs.stripe.com/keys.md). Don’t submit any personally identifiable information in requests made with this key.
To create a Stripe object using your account, replace the sample API key with your actual API key or [sign in](https://docs.stripe.com/login.md?redirect=%2Fdocs%2Fjs%2Finitializing).


When you’re ready to accept live payments, replace the test key with your live key in production.
Learn more about how API keys work in [sandboxes and live mode](https://docs.stripe.com/keys.md#test-live-modes).

When you use the same publishable API key and options, create and share a single instance of the Stripe object. Creating multiple instances might lead to performance issues.

- `publishableKey`
  Your publishable key.

- `options`
  Initialization options.
    - `stripeAccount`
      For usage with [Connect](https://docs.stripe.com/connect.md) only.
Specifying a connected account ID (e.g., `acct_24BFMpJ1svR5A89k`) allows you to perform actions on behalf of that account.
    - `apiVersion`
      Override your account's [API version](https://docs.stripe.com/api/versioning.md). **This option is only available on Stripe.js v3.** For versions after `v3` such as `acacia`, the API version is [pinned to the Stripe.js version](https://docs.stripe.com/sdks/stripejs-versioning#compatibility-with-api-versions).
    - `locale`
      A [locale](#supported_locales) used to globally configure localization in Stripe.
Setting the locale here will localize error strings for all Stripe.js methods.
It will also configure the locale for [Elements](#element_mount).
Default is `auto` (Stripe detects the locale of the browser).
    - `developerTools`
      Stripe.js developer tooling options.
      - `assistant`
        [Stripe Elements sandbox assistant](https://docs.stripe.com/sdks/stripejs-testing-assistant.md) options.
        - `enabled`
          Set to `false` to disable the sandbox assistant UI.
Defaults to `true` when using [Elements with the Checkout Sessions API](https://docs.stripe.com/checkout/custom/quickstart.md) or when using [Elements with the Payment Intents API](https://docs.stripe.com/payments/quickstart.md) on version Clover or above.

### Example

```title
Initializing Stripe.js
```

## The Elements object

[Stripe Elements](https://docs.stripe.com/payments/elements.md) are customizable UI components used to collect sensitive information in your payment forms.

Use an `Elements` instance to create and manage a group of individual [Element](https://docs.stripe.com/js/element.md) instances.

## Create an Elements instance

`stripe.elements(options?: object)`

This method creates an `Elements` instance, which manages a group of elements.

For the [Payment Element created without an Intent](https://docs.stripe.com/payments/accept-a-payment-deferred.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), see the [Elements object without an Intent](https://docs.stripe.com/js/elements_object/create_without_intent.md) reference instead.

- `options`
  A set of options to create this `Elements` instance with.
    - `fonts`
      An array of custom fonts, which elements created from the `Elements` object can use. Fonts can be specified as [CssFontSource](#css_font_source_object) or [CustomFontSource](#custom_font_source_object) objects.
    - `locale`
      The [locale](#supported_locales) used to localize all text that Elements displays, including labels, placeholders, buttons, and error messages.
Default is `auto` (Stripe detects the locale of the browser).

This option doesn't affect content that Stripe doesn't render, such as browser and wallet payment sheets (for example, Apple Pay and Google Pay), which use the customer's browser or device language. It also doesn't translate text you provide, such as custom payment method names.

Setting the locale does not affect the behavior of postal code validation—a valid postal code for the billing country of the card is still required.

To indicate the direction of text for *right to left* languages such as Arabic and Hebrew, mount Elements underneath an HTML element that includes the `dir="rtl"` attribute.
    - `clientSecret`
      Required to use with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Contact Details Element](https://docs.stripe.com/payments/link.md).

The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) for a PaymentIntent or SetupIntent.
    - `appearance`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the [Contact Details Element](https://docs.stripe.com/payments/link.md), and the [Address Element](https://docs.stripe.com/elements/address-element/.md).

Match the design of your site with the [appearance option](https://docs.stripe.com/elements/appearance-api.md).
The layout of each Element stays consistent, but you can modify colors, fonts, borders, padding, and more.
    - `loader`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the [Contact Details Element](https://docs.stripe.com/payments/link.md), and the [Address Element](https://docs.stripe.com/elements/address-element/.md).

Display skeleton loader UI while waiting for Elements to be fully loaded, after they are mounted.
Default is `'auto'` (Stripe determines if a loader UI should be shown).
    - `currency`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

Influences available payment methods when creating SetupIntents with [automatic_payment_methods](https://docs.stripe.com/api/setup_intents/create.md#create_setup_intent-automatic_payment_methods).
Payment Element renders the payment methods enabled in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods) that support the provided currency.

Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).
    - `customerSessionClientSecret`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Address Element](https://docs.stripe.com/elements/address-element.md).

The client_secret returned from create a [CustomerSession](https://docs.stripe.com/api/customer_sessions.md) associated with the [Customer ID](https://docs.stripe.com/api/customers/object.md#customer_object-id) for that session.
    - `syncAddressCheckbox`
      Used with the [Address Element](https://docs.stripe.com/elements/address-element.md).

The `syncAddressCheckbox` parameter configures which Address Element to show the checkbox above.

The checkbox allows the customer the option to sync billing and shipping addresses when multiple Address Elements are used, one of each mode, in a single Elements instance.

Default is `'billing'`. `'none'` opts out of showing the checkbox in either Address Element.
    - `paymentMethodCreation`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Allows PaymentMethods to be created from the Elements instance using [stripe.createPaymentMethod](https://docs.stripe.com/js/payment_methods/create_payment_method_elements.md).

**NOTE:** The Express Checkout Element doesn't support [stripe.createPaymentMethod](https://docs.stripe.com/js/payment_methods/create_payment_method_elements.md) with [Amazon Pay](https://docs.stripe.com/payments/amazon-pay.md) or [Klarna](https://docs.stripe.com/payments/klarna.md). Use [stripe.createConfirmationToken](https://docs.stripe.com/js/confirmation_tokens/create_confirmation_token.md) instead. Card installments are also unsupported and either blocks showing the plan selection UI, or raises an error for manual enablement using `paymentMethodOptions`.
    - `customPaymentMethods`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

An array of [custom payment methods](https://docs.stripe.com/payments/payment-element/custom-payment-methods.md) to display in the [Payment Element](https://docs.stripe.com/payments/payment-element.md) or [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).
The custom payment methods must be registered in the [Stripe Dashboard](https://dashboard.stripe.com/settings/custom_payment_methods).
      - `id`
        The ID of the [custom payment method type](https://dashboard.stripe.com/settings/custom_payment_methods), prefixed with `cpmt_`.
      - `options`
        A set of options that configure the custom payment method. `options` and `payment` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.
      - `payment`
        A set of options that configure the custom payment method in the [Payment Element](https://docs.stripe.com/payments/payment-element.md). This is an alias of `options`. `payment` and `options` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.
    - `externalPaymentMethodTypes (deprecated)`
      _This param has been deprecated in favor of [custom payment methods](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-customPaymentMethods), which offers more flexibility._

The [external payment methods](https://docs.stripe.com/payments/external-payment-methods.md) to be displayed in the [Payment Element](https://docs.stripe.com/payments/payment-element.md) that you are already integrated with.
Must be an [available external payment methods](https://docs.stripe.com/payments/external-payment-methods.md#available-external-payment-methods).
    - `disallowedCardBrands`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

By default, the Payment Element supports [multiple card brands](https://docs.stripe.com/payments/cards/supported-card-brands.md) in the card input field, Apple Pay, and Google Pay.

Provide a list of card brands to disallow. Valid values are `visa`, `mastercard`, `american_express`, and `discover_global_network`. The `discover_global_network` value includes Discover, Diners, JCB, UnionPay, and Elo.

You can't disallow every supported card brand.

The Payment Element applies this option as client-side validation. It isn't server-side enforcement of your payment policy. See [Enforce card restrictions](https://docs.stripe.com/payments/customize-payment-methods.md#enforce-card-restrictions) for server-side enforcement options.
    - `disallowedCardFundingTypes`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

Provide a list of card funding types to disallow in the Payment Element. Valid values are `credit`, `debit`, and `prepaid`.

You can't disallow every supported card funding type.

The Payment Element applies this option as client-side validation. It isn't server-side enforcement of your payment policy. See [Enforce card restrictions](https://docs.stripe.com/payments/customize-payment-methods.md#enforce-card-restrictions) for server-side enforcement options.

### Example

```title
Create an Elements instance
```

## Create an Elements instance without an intent

`stripe.elements(options?: object)`

This method creates an `Elements` instance, which manages a group of elements.

This reference applies to the [Payment Element created without an Intent](https://docs.stripe.com/payments/accept-a-payment-deferred.md), [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), and [Card Elements](https://docs.stripe.com/payments/card-element.md). For other elements, see the [Elements object](https://docs.stripe.com/js/elements_object/create.md) reference instead.

- `options`
  A set of options to create this `Elements` instance with.
    - `fonts`
      An array of custom fonts, which elements created from the `Elements` object can use. Fonts can be specified as [CssFontSource](#css_font_source_object) or [CustomFontSource](#custom_font_source_object) objects.
    - `locale`
      The [locale](#supported_locales) used to localize all text that Elements displays, including labels, placeholders, buttons, and error messages.
Default is `auto` (Stripe detects the locale of the browser).

This option doesn't affect content that Stripe doesn't render, such as browser and wallet payment sheets (for example, Apple Pay and Google Pay), which use the customer's browser or device language. It also doesn't translate text you provide, such as custom payment method names.

Setting the locale does not affect the behavior of postal code validation—a valid postal code for the billing country of the card is still required.

To indicate the direction of text for *right to left* languages such as Arabic and Hebrew, mount Elements underneath an HTML element that includes the `dir="rtl"` attribute.
    - `mode`
      Required to use with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Filters out payment methods based on intended use.
    - `currency`
      Required to use with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).
    - `amount`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md). Required when `mode` is `payment` or `subscription`.

Shown in Apple Pay, Google Pay, or Buy now, pay later UIs. The amount intended to be collected from the customer right now. A positive integer representing how much to charge in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge 1.00 USD or 100 to charge 100 JPY, a zero-decimal currency).

The minimum amount is 0.50 USD or [equivalent in charge currency](https://docs.stripe.com/currencies.md#minimum-and-maximum-charge-amounts). If `mode` is `subscription`, the value supports 0 to account for coupons and free trials, but any amount above 0 is subject to the minimum.

The amount value supports up to eight digits (e.g., a value of 99999999 for a 999,999.99 USD charge).
    - `setupFutureUsage`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Indicates that you intend to make future payments with the payment details collected by the Payment Element.

This should match the [setup_future_usage](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-setup_future_usage) provided on the Intent used when confirming payment.
    - `captureMethod`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Influences available payment methods. This should match the [capture_method](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-capture_method) provided on the Intent used when confirming payment.
    - `onBehalfOf`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md), [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), and [Card Elements](https://docs.stripe.com/payments/card-element.md).

The Stripe account ID which is the business of record. See [use cases](https://docs.stripe.com/connect/charges.md) to determine if this option is relevant for your integration. This should match the [on_behalf_of](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-on_behalf_of) provided on the Intent used when confirming payment.
    - `paymentMethodConfiguration`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

The [payment method configuration](https://docs.stripe.com/api/payment_method_configurations.md) to use when managing your payment methods from the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods). If none is specified, your default configuration is used.
    - `paymentMethodOptions`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Additional payment-method-specific options for configuring behavior when initialized without an intent.
      - `acss_debit`
        If this is an `acss_debit` PaymentMethod, this sub-hash contains details about the ACSS Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `affirm`
        If this is an `affirm` PaymentMethod, this sub-hash contains details about the Affirm payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `afterpay_clearpay`
        If this is an `afterpay_clearpay` PaymentMethod, this sub-hash contains details about the Afterpay / Clearpay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `alipay`
        If this is an `alipay` PaymentMethod, this sub-hash contains details about the Alipay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `amazon_pay`
        If this is an `amazon_pay` PaymentMethod, this sub-hash contains details about the Amazon Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `au_becs_debit`
        If this is an `au_becs_debit` PaymentMethod, this sub-hash contains details about the BECS Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `bacs_debit`
        If this is a `bacs_debit` PaymentMethod, this sub-hash contains details about the Bacs Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `bancontact`
        If this is a `bancontact` PaymentMethod, this sub-hash contains details about the Bancontact payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `blik`
        If this is a `blik` PaymentMethod, this sub-hash contains details about the BLIK payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `boleto`
        If this is a `boleto` PaymentMethod, this sub-hash contains details about the Boleto payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `card`
        If this is a `card` PaymentMethod, this sub-hash contains details about the card payment method options.
        - `require_cvc_recollection`
          When enabled, using a card that is attached to a customer will require the CVC to be provided again.
When providing a `customerSessionClientSecret` and using the Payment Element, the Payment Element will prompt for CVC recollection.
        - `installments`
          Installment configuration.
          - `enabled`
            When `true`, shows the card installment plan selection UI (depending on issuer and country support) if you don't manage your payment methods in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods).
 You must set `mode='payment'` _and_ explicitly specify `allowedPaymentMethodTypes` in the Elements `options`. Setting installments to `true` without these settings returns an error.
 Incompatible with `paymentMethodCreation='manual'`.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `cashapp`
        If this is a `cashapp` PaymentMethod, this sub-hash contains details about the Cash App Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `crypto`
        If this is a `crypto` PaymentMethod, this sub-hash contains details about the Crypto payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `customer_balance`
        If this is a `customer_balance` PaymentMethod, this sub-hash contains details about the Customer Balance payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `eps`
        If this is an `eps` PaymentMethod, this sub-hash contains details about the EPS payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `fpx`
        If this is an `fpx` PaymentMethod, this sub-hash contains details about the FPX payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `giropay`
        If this is a `giropay` PaymentMethod, this sub-hash contains details about the giropay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `grabpay`
        If this is a `grabpay` PaymentMethod, this sub-hash contains details about the GrabPay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `ideal`
        If this is an `ideal` PaymentMethod, this sub-hash contains details about the iDEAL payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `kakao_pay`
        If this is a `kakao_pay` PaymentMethod, this sub-hash contains details about the Kakao Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `klarna`
        If this is a `klarna` PaymentMethod, this sub-hash contains details about the Klarna payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `konbini`
        If this is a `konbini` PaymentMethod, this sub-hash contains details about the Konbini payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `kr_card`
        If this is a `kr_card` PaymentMethod, this sub-hash contains details about the Korean card payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `link`
        If this is a `link` PaymentMethod, this sub-hash contains details about the Link payment method options (Link is also known as Onelink in the UK).
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `mb_way`
        If this is a `mb_way` PaymentMethod, this sub-hash contains details about the MB WAY payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `mobilepay`
        If this is a `mobilepay` PaymentMethod, this sub-hash contains details about the MobilePay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `multibanco`
        If this is a `multibanco` PaymentMethod, this sub-hash contains details about the Multibanco payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `naver_pay`
        If this is a `naver_pay` PaymentMethod, this sub-hash contains details about the Naver Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `nz_bank_account`
        If this is a `nz_bank_account` PaymentMethod, this sub-hash contains details about the New Zealand bank account payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `oxxo`
        If this is an `oxxo` PaymentMethod, this sub-hash contains details about the OXXO payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `p24`
        If this is a `p24` PaymentMethod, this sub-hash contains details about the Przelewy24 payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `paynow`
        If this is a `paynow` PaymentMethod, this sub-hash contains details about the PayNow payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `pix`
        If this is a `pix` PaymentMethod, this sub-hash contains details about the Pix payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `paypal`
        If this is a `paypal` PaymentMethod, this sub-hash contains details about the PayPal payment method options.
        - `capture_method`
          Controls when the funds will be captured.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `promptpay`
        If this is a `promptpay` PaymentMethod, this sub-hash contains details about the PromptPay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `revolut_pay`
        If this is a `revolut_pay` PaymentMethod, this sub-hash contains details about the Revolut Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `satispay`
        If this is a `satispay` PaymentMethod, this sub-hash contains details about the Satispay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `sepa_debit`
        If this is a `sepa_debit` PaymentMethod, this sub-hash contains details about the SEPA Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `sequra`
        If this is a `sequra` PaymentMethod, this sub-hash contains details about the SeQura payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `sofort`
        If this is a `sofort` PaymentMethod, this sub-hash contains details about the Sofort payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `sunbit`
        If this is a `sunbit` PaymentMethod, this sub-hash contains details about the Sunbit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `swish`
        If this is a `swish` PaymentMethod, this sub-hash contains details about the Swish payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `twint`
        If this is a `twint` PaymentMethod, this sub-hash contains details about the TWINT payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `upi`
        If this is a `upi` PaymentMethod, this sub-hash contains details about the UPI payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `us_bank_account`
        If this is a `us_bank_account` PaymentMethod, this sub-hash contains details about the US bank account payment method options.
        - `verification_method`
          Verification method for the US bank account collection flow
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
        - `financial_connections`
          Additional fields for Financial Connections session creation
          - `permissions`
            The list of permissions to request. If this parameter is passed, the `payment_method` permission must be included. Valid permissions include: `balances`, `ownership`, `payment_method`, and `transactions`.
          - `prefetch`
            The list of permissions that you would like to retrieve upon creation. Valid permissions include: `balances`, `ownership`, and `transactions`.
      - `wechat_pay`
        If this is a `wechat_pay` PaymentMethod, this sub-hash contains details about the WeChat Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `zip`
        If this is a `zip` PaymentMethod, this sub-hash contains details about the Zip payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
    - `appearance`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the [Contact Details Element](https://docs.stripe.com/payments/link.md), the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), and the [Address Element](https://docs.stripe.com/elements/address-element/.md).

Match the design of your site with the [appearance option](https://docs.stripe.com/elements/appearance-api.md).
The layout of each Element stays consistent, but you can modify colors, fonts, borders, padding, and more.
    - `loader`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the [Contact Details Element](https://docs.stripe.com/payments/link.md), and the [Address Element](https://docs.stripe.com/elements/address-element/.md).

Display skeleton loader UI while waiting for Elements to be fully loaded, after they are mounted.
Default is `'auto'` (Stripe determines if a loader UI should be shown).
    - `customerSessionClientSecret`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Address Element](https://docs.stripe.com/elements/address-element.md).

The client_secret returned from create a [CustomerSession](https://docs.stripe.com/api/customer_sessions.md) associated with the [Customer ID](https://docs.stripe.com/api/customers/object.md#customer_object-id) for that session.
    - `syncAddressCheckbox`
      Used with the [Address Element](https://docs.stripe.com/elements/address-element.md).

The `syncAddressCheckbox` parameter configures which Address Element to show the checkbox above.

The checkbox allows the customer the option to sync billing and shipping addresses when multiple Address Elements are used, one of each mode, in a single Elements instance.

Default is `'billing'`. `'none'` opts out of showing the checkbox in either Address Element.
    - `paymentMethodCreation`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Allows PaymentMethods to be created from the Elements instance using [stripe.createPaymentMethod](https://docs.stripe.com/js/payment_methods/create_payment_method_elements.md).

**NOTE:** The Express Checkout Element doesn't support [stripe.createPaymentMethod](https://docs.stripe.com/js/payment_methods/create_payment_method_elements.md) with [Amazon Pay](https://docs.stripe.com/payments/amazon-pay.md) or [Klarna](https://docs.stripe.com/payments/klarna.md). Use [stripe.createConfirmationToken](https://docs.stripe.com/js/confirmation_tokens/create_confirmation_token.md) instead. Card installments are also unsupported and either blocks showing the plan selection UI, or raises an error for manual enablement using `paymentMethodOptions`.
    - `allowedPaymentMethodTypes`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

The list of payment method types to allow for this payment. From this list, Stripe automatically renders the relevant payment methods. You can omit this attribute to manage your payment methods from the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods).
    - `excludedPaymentMethodTypes`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

The list of payment method types to exclude from use with this payment.
    - `customPaymentMethods`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

An array of [custom payment methods](https://docs.stripe.com/payments/payment-element/custom-payment-methods.md) to display in the [Payment Element](https://docs.stripe.com/payments/payment-element.md) or [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).
The custom payment methods must be registered in the [Stripe Dashboard](https://dashboard.stripe.com/settings/custom_payment_methods).
      - `id`
        The ID of the [custom payment method type](https://dashboard.stripe.com/settings/custom_payment_methods), prefixed with `cpmt_`.
      - `options`
        A set of options that configure the custom payment method. `options` and `payment` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.
      - `payment`
        A set of options that configure the custom payment method in the [Payment Element](https://docs.stripe.com/payments/payment-element.md). This is an alias of `options`. `payment` and `options` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.
    - `disallowedCardBrands`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

By default, the Payment Element supports [multiple card brands](https://docs.stripe.com/payments/cards/supported-card-brands.md) in the card input field, Apple Pay, and Google Pay.

Provide a list of card brands to disallow. Valid values are `visa`, `mastercard`, `american_express`, and `discover_global_network`. The `discover_global_network` value includes Discover, Diners, JCB, UnionPay, and Elo.

You can't disallow every supported card brand.

The Payment Element applies this option as client-side validation. It isn't server-side enforcement of your payment policy. See [Enforce card restrictions](https://docs.stripe.com/payments/customize-payment-methods.md#enforce-card-restrictions) for server-side enforcement options.
    - `disallowedCardFundingTypes`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

Provide a list of card funding types to disallow in the Payment Element. Valid values are `credit`, `debit`, and `prepaid`.

You can't disallow every supported card funding type.

The Payment Element applies this option as client-side validation. It isn't server-side enforcement of your payment policy. See [Enforce card restrictions](https://docs.stripe.com/payments/customize-payment-methods.md#enforce-card-restrictions) for server-side enforcement options.

### Example

```title
Create an Elements instance without an intent
```

## Update Elements Options

`elements.update(options: object)`

This method updates options on an existing instance of `Elements`. Note that not all options are updatable.

**Starting in Stripe.js `dahlia`**, this method returns a `Promise` that resolves when the update has been applied to all rendered Elements.
You can also listen for the `update-end` event as an alternative to awaiting the `Promise`.

- `options`
  A set of options to update this `Elements` instance with.
    - `locale`
      The [locale](#supported_locales) used to localize all text that Elements displays, including labels, placeholders, buttons, and error messages.
Default is `auto` (Stripe detects the locale of the browser).

This option doesn't affect content that Stripe doesn't render, such as browser and wallet payment sheets (for example, Apple Pay and Google Pay), which use the customer's browser or device language. It also doesn't translate text you provide, such as custom payment method names.

Setting the locale does not affect the behavior of postal code validation—a valid postal code for the billing country of the card is still required.

To indicate the direction of text for *right to left* languages such as Arabic and Hebrew, mount Elements underneath an HTML element that includes the `dir="rtl"` attribute.
    - `mode`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

Filters out payment methods based on intended use.
    - `currency`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).
    - `amount`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Shown in Apple Pay, Google Pay, or Buy now pay later UIs. The amount intended to be collected from the customer right now.
A positive integer representing how much to charge in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100
to charge ¥100, a zero-decimal currency). The minimum amount is $0.50 US or [equivalent in charge currency](https://docs.stripe.com/currencies.md#minimum-and-maximum-charge-amounts).
The amount value supports up to eight digits (e.g., a value of 99999999 for a USD charge of $999,999.99).
    - `setupFutureUsage`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Influences available payment methods and the [terms](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-terms) shown by the Payment Element.

This should match the [setup_future_usage](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-setup_future_usage) provided on the Intent used when confirming payment.
    - `captureMethod`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Influences available payment methods. This should match the [capture method](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-capture_method) provided on the PaymentIntent or SetupIntent used when confirming payment.
    - `onBehalfOf`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md). This property can't be updated when used with the [Card Element](https://docs.stripe.com/payments/card-element.md).

The Stripe account ID, which is the business of record. Review the [use cases](https://docs.stripe.com/connect/charges.md) to determine if this option is relevant for your integration. Make sure this matches the [on_behalf_of](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-on_behalf_of) provided on the Intent used when confirming payment.
    - `paymentMethodConfiguration`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

The [payment method configuration](https://docs.stripe.com/api/payment_method_configurations.md) to use when managing your payment methods from the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods). If none is specified, your default configuration is used.
    - `paymentMethodOptions`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Additional payment-method-specific options for configuring behavior when initialized without an intent.
      - `acss_debit`
        If this is an `acss_debit` PaymentMethod, this sub-hash contains details about the ACSS Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `affirm`
        If this is an `affirm` PaymentMethod, this sub-hash contains details about the Affirm payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `afterpay_clearpay`
        If this is an `afterpay_clearpay` PaymentMethod, this sub-hash contains details about the Afterpay / Clearpay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `alipay`
        If this is an `alipay` PaymentMethod, this sub-hash contains details about the Alipay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `alma`
        If this is an `alma` PaymentMethod, this sub-hash contains details about the Alma payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `amazon_pay`
        If this is an `amazon_pay` PaymentMethod, this sub-hash contains details about the Amazon Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `au_becs_debit`
        If this is an `au_becs_debit` PaymentMethod, this sub-hash contains details about the BECS Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `bacs_debit`
        If this is a `bacs_debit` PaymentMethod, this sub-hash contains details about the Bacs Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `bancontact`
        If this is a `bancontact` PaymentMethod, this sub-hash contains details about the Bancontact payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `billie`
        If this is a `billie` PaymentMethod, this sub-hash contains details about the Billie payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `blik`
        If this is a `blik` PaymentMethod, this sub-hash contains details about the BLIK payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `boleto`
        If this is a `boleto` PaymentMethod, this sub-hash contains details about the Boleto payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `card`
        If this is a `card` PaymentMethod, this sub-hash contains details about the card payment method options.
        - `require_cvc_recollection`
          When enabled, using a card that is attached to a customer will require the CVC to be provided again.
When providing a `customerSessionClientSecret` and using the Payment Element, the Payment Element will prompt for CVC recollection.
        - `installments`
          Installment configuration.
          - `enabled`
            When `true`, shows the card installment plan selection UI (depending on issuer and country support) if you don't manage your payment methods in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods).
You must set `mode='payment'` _and_ explicitly specify `allowedPaymentMethodTypes` in the Elements `options`. Setting installments to `true` without these settings returns an error.
Incompatible with `paymentMethodCreation='manual'`.
      - `cashapp`
        If this is a `cashapp` PaymentMethod, this sub-hash contains details about the Cash App Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `crypto`
        If this is a `crypto` PaymentMethod, this sub-hash contains details about the Crypto payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `eps`
        If this is an `eps` PaymentMethod, this sub-hash contains details about the EPS payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `fpx`
        If this is an `fpx` PaymentMethod, this sub-hash contains details about the FPX payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `giropay`
        If this is a `giropay` PaymentMethod, this sub-hash contains details about the giropay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `grabpay`
        If this is a `grabpay` PaymentMethod, this sub-hash contains details about the GrabPay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `ideal`
        If this is an `ideal` PaymentMethod, this sub-hash contains details about the iDEAL payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `klarna`
        If this is a `klarna` PaymentMethod, this sub-hash contains details about the Klarna payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `konbini`
        If this is a `konbini` PaymentMethod, this sub-hash contains details about the Konbini payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `link`
        If this is a `link` PaymentMethod, this sub-hash contains details about the Link payment method options (Link is also known as Onelink in the UK).
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `mobilepay`
        If this is a `mobilepay` PaymentMethod, this sub-hash contains details about the MobilePay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `multibanco`
        If this is a `multibanco` PaymentMethod, this sub-hash contains details about the Multibanco payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `netbanking`
        If this is a `netbanking` PaymentMethod, this sub-hash contains details about the NetBanking payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `oxxo`
        If this is an `oxxo` PaymentMethod, this sub-hash contains details about the OXXO payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `p24`
        If this is a `p24` PaymentMethod, this sub-hash contains details about the Przelewy24 payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `paynow`
        If this is a `paynow` PaymentMethod, this sub-hash contains details about the PayNow payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `paypal`
        If this is a `paypal` PaymentMethod, this sub-hash contains details about the PayPal payment method options.
        - `capture_method`
          Controls when the funds will be captured.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `promptpay`
        If this is a `promptpay` PaymentMethod, this sub-hash contains details about the PromptPay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `revolut_pay`
        If this is a `revolut_pay` PaymentMethod, this sub-hash contains details about the Revolut Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `satispay`
        If this is a `satispay` PaymentMethod, this sub-hash contains details about the Satispay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `sepa_debit`
        If this is a `sepa_debit` PaymentMethod, this sub-hash contains details about the SEPA Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `sequra`
        If this is a `sequra` PaymentMethod, this sub-hash contains details about the SeQura payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `sofort`
        If this is a `sofort` PaymentMethod, this sub-hash contains details about the Sofort payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `sunbit`
        If this is a `sunbit` PaymentMethod, this sub-hash contains details about the Sunbit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `swish`
        If this is a `swish` PaymentMethod, this sub-hash contains details about the Swish payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `twint`
        If this is a `twint` PaymentMethod, this sub-hash contains details about the TWINT payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `upi`
        If this is a `upi` PaymentMethod, this sub-hash contains details about the UPI payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `us_bank_account`
        If this is a `us_bank_account` PaymentMethod, this sub-hash contains details about the US bank account payment method options.
        - `verification_method`
          Verification method for the US bank account collection flow
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
        - `financial_connections`
          Additional fields for Financial Connections session creation
          - `permissions`
            The list of permissions to request. If this parameter is passed, the `payment_method` permission must be included. Valid permissions include: `balances`, `ownership`, `payment_method`, and `transactions`.
          - `prefetch`
            The list of permissions that you would like to retrieve upon creation. Valid permissions include: `balances`, `ownership`, and `transactions`.
      - `wechat_pay`
        If this is a `wechat_pay` PaymentMethod, this sub-hash contains details about the WeChat Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `zip`
        If this is a `zip` PaymentMethod, this sub-hash contains details about the Zip payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
    - `appearance`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Match the design of your site with the [appearance option](https://docs.stripe.com/elements/appearance-api.md).
The layout of each Element stays consistent, but you can modify colors, fonts, borders, padding, and more.
    - `fonts`
      An array of custom fonts, which elements created from the `Elements` object can use. Fonts can be specified as [CssFontSource](#css_font_source_object) or [CustomFontSource](#custom_font_source_object) objects.

Any fonts that have already been loaded during creation or previous updates will be ignored.
    - `customerSessionClientSecret`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Address Element](https://docs.stripe.com/elements/address-element.md).

The client_secret returned from create a [CustomerSession](https://docs.stripe.com/api/customer_sessions.md) associated with the [Customer ID](https://docs.stripe.com/api/customers/object.md#customer_object-id). When the `customerSessionClientSecret` is used with `element.update()`, saved payment methods associated with the previous session are cleared, and the payment element is re-rendered with any saved payment methods associated with the updated secret.
    - `allowedPaymentMethodTypes`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

The list of payment method types to allow for this payment. From this list, Stripe automatically renders the relevant payment methods. You can omit this attribute to manage your payment methods from the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods).
    - `excludedPaymentMethodTypes`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

The list of payment method types to exclude from use with this payment.
    - `customPaymentMethods`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

An array of [custom payment methods](https://docs.stripe.com/payments/payment-element/custom-payment-methods.md) to display in the [Payment Element](https://docs.stripe.com/payments/payment-element.md) or [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).
The custom payment methods must be registered in the [Stripe Dashboard](https://dashboard.stripe.com/settings/custom_payment_methods).
      - `id`
        The ID of the [custom payment method type](https://dashboard.stripe.com/settings/custom_payment_methods), prefixed with `cpmt_`.
      - `options`
        A set of options that configure the custom payment method. `options` and `payment` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.
      - `payment`
        A set of options that configure the custom payment method in the [Payment Element](https://docs.stripe.com/payments/payment-element.md). This is an alias of `options`. `payment` and `options` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.

### Example

```title
Update Elements
```

## Update-end event

`elements.on(event: 'update-end', handler: function)`

Triggered when the call to `elements.update()` is complete.

- `event`
  The name of the event.
In this case, `update-end`.

- `handler`
  `handler() => void` is a **callback function** that you provide that will be called when the event is fired.

### Example

```title
Handle an Elements update-end event
```

## Submit 

`elements.submit()`

Use `elements.submit()` when creating the [Elements object without an Intent](#stripe_elements_no_intent).

Before confirming a payment, call `elements.submit()` to validate the form fields and collect any data required for [wallets](#payment_element_create-options-wallets). You must wait for this function's promise to resolve (using `async` or `.then`) before performing any other operations.

### Example

```title
Submit Elements
```

## The Element

Use `Element` instances to collect sensitive information in your checkout flow.

## The Payment Element

The [Payment Element](https://docs.stripe.com/payments/payment-element.md) is
an embeddable component for securely collecting payment details.
The Payment Element supports dozens of payment methods with a single integration.

## Create the Payment Element

`elements.create(type: 'payment', options?: object)`

This method creates an instance of the Payment Element.

- `type`
  The type of Element being created, which is `payment` in this case.

- `options`
  Options for creating the Payment Element.
    - `layout`
      Specify the layout for the Payment Element: `'auto'`, `'accordion'`, or `'tabs'`. With `'auto'`, Stripe selects the layout automatically. If you only pass a layout type without any additional parameters, the Payment Element renders using that layout and the default values associated with it.

An object can also be passed to specify the layout with additional configuration.
      - `type`
        Defines the layout to render the Payment Element.
      - `defaultCollapsed`
        Controls if the Payment Element renders in a collapsed state (where no payment method is selected by default). When you leave this `undefined`, Stripe renders the experience that it determines will have the best conversion.
      - `radios`
        Controls when to render each Payment Method with a radio input next to its logo. The radios visually indicate the current selection of the Payment Element. Defaults to `'auto'`.

- `'always'` — Always show radio inputs.
- `'never'` — Never show radio inputs.
- `'if_multiple'` — Show radio inputs only when there are multiple payment methods available. When there is only one payment method, no radio input is displayed.
- `'auto'` — Stripe determines the best experience to optimize conversion.

_This property is only applicable to the `accordion` layout._
      - `spacedAccordionItems`
        When `true`, the Payment Methods render as standalone buttons with space in between them.

_This property is only applicable to the `accordion` layout._
      - `visibleAccordionItemsCount`
        Sets the max number of Payment Methods visible before using the "More" button to hide additional Payment Methods. Set this value to `0` to disable the "More" button and render all available Payment Methods. Default is `5`.

_This property is only applicable to the `accordion` layout._
      - `paymentMethodLogoPosition`
        Sets the position of the payment method logo in each accordion item. Default is `start`.

_This property is only applicable to the `accordion` layout._
    - `defaultValues`
      Provide initial customer information that will be displayed in the Payment Element.
The form will render with empty fields if not provided.
      - `billingDetails`
        Specify customer's billing details, which lets you pre-fill a customer’s name, email,
phone number and address if required by payment method. Pre-filling as much information
as possible streamlines the checkout process.
        - `name`
        - `email`
        - `phone`
        - `address`
          - `line1`
          - `line2`
          - `city`
            The name of a city, town, village, etc.
          - `state`
            The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
          - `country`
            Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
          - `postal_code`
            The postal code or ZIP code, also known as PIN code in India.
      - `paymentMethods`
        Specify customer's default information for different payment methods. Pre-filling as much information
as possible streamlines the checkout process.
        - `ideal`
          - `bank`
            A pre-filled iDEAL bank value for the Payment Element. Can only be one of the banks listed in the [iDEAL guide](https://docs.stripe.com/payments/ideal/accept-a-payment?ui=element.md#bank-reference) (e.g., `abn_amro`).
        - `payto`
          - `usePayId`
            When `true`, the PayTo payment method will default to showing the PayID input instead of BSB/account number fields. Customers can still switch between PayID and BSB/account number using the toggle link.
      - `card`
        Specify default settings for card payments.
        - `network`
          Specifies a network preference for [Card Brand Choice](https://docs.stripe.com/card-brand-choice.md). The first network in the array that matches a network on the entered co-branded card will be selected by default in the Card Brand Choice dropdown. See the [supported networks](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-card-networks-preferred) for valid values.
    - `business`
      Provide information about your business that will be displayed in the Payment Element.
This information will be retrieved from your Stripe account if not provided.
      - `name`
        The name of your business. Your business name will be used to render mandate text for some payment methods.
    - `paymentMethodOrder`
      By default, the Payment Element will use a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods are displayed in the Payment Element with a list of payment method types.

If the associated PaymentIntent has payment method types not specified in `paymentMethodOrder`, they will be displayed
after the payment methods you specify. If you specify payment method types not on the associated PaymentIntent, they will be ignored.
    - `fields`
      By default, the Payment Element collects all necessary details to complete a payment.

For some payment methods, the Payment Element collects details such as name or email
that you might have already collected from the customer. If this is the case, you can prevent the Payment Element
from collecting these details by using the `fields` option.

If you disable collecting certain fields
with the `fields` option, you must pass that same data to [stripe.confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment.md)
or we'll reject the payment.

You can set `billingDetails` at the top level to apply the same field collection settings to all payment methods,
or set `billingDetails` under a supported payment method type to override the top-level setting for that payment method.

Learn how to [customize the billing details to collect](https://docs.stripe.com/payments/payment-element/control-billing-details-collection.md) and
the [customized fields](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-customized_fields).
      - `billingDetails`
        Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
        - `name`
          Specify `always` to require the Payment Element to collect the customer's billing name.
        - `email`
          Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
        - `phone`
          Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
        - `address`
          Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
          - `line1`
          - `line2`
          - `city`
            The name of a city, town, village, etc.
          - `state`
            The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
          - `country`
            Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
          - `postalCode`
            The postal code or ZIP code, also known as PIN code in India.
      - `[paymentMethodType]`
        Optionally specify the billing detail collection settings for any Payment Element payment method type. Examples of valid values are `card`, `klarna`, or `us_bank_account`. You can include one or more payment method type keys.
        - `billingDetails`
          Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
          - `name`
            Specify `always` to require the Payment Element to collect the customer's billing name.
          - `email`
            Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
          - `phone`
            Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
          - `address`
            Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
            - `line1`
            - `line2`
            - `city`
              The name of a city, town, village, etc.
            - `state`
              The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
            - `country`
              Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
            - `postalCode`
              The postal code or ZIP code, also known as PIN code in India.
    - `readOnly`
      Applies a read-only state to the Payment Element so that payment details can’t be changed. Default is false.

Enabling the `readOnly` option doesn't change the Payment Element's visual appearance. If you want to adjust the way the Payment Element looks, use the [Appearance API](https://docs.stripe.com/elements/appearance-api.md).
    - `terms`
      Control how mandates or other legal agreements are displayed in the Payment Element.
Use `never` to never display legal agreements. The default setting is `auto`, which causes
legal agreements to only be shown when necessary.

Consult your legal and compliance advisors before making any changes to the text of mandates or legal agreements. You can't use the `terms` option to violate obligations under your Stripe agreement, Stripe policies, applicable laws or scheme rules.
      - `applePay`
      - `auBecsDebit`
      - `bancontact`
      - `card`
      - `cashapp`
      - `googlePay`
      - `ideal`
      - `paypal`
      - `sepaDebit`
      - `sofort`
      - `usBankAccount`
    - `wallets`
      By default, the Payment Element will display all the payment
methods that the underlying Payment Intent was created with.

However, wallets like Apple Pay and Google Pay are not payment
methods per the Payment Intent API. They will show when the
Payment Intent has the `card` payment method and the customer is
using a supported platform and have an active card in their
account.  This is the `auto` behavior, and it is the default for
choice for all wallets.

If you do not want to show a given wallet as a payment option, you
can set its property in `wallets` to `never`.
      - `applePay`
      - `googlePay`
      - `link`
    - `walletOptions`
      Options to control the information collected from the customer when
paying with a wallet payment method.
      - `emailRequired`
        Collect the customer's email from wallet payment methods by setting this option to true.
      - `phoneNumberRequired`
        Collect the customer's phone number from wallet payment methods by setting this option to true.

PayPal doesn't provide a phone number, even when this option is set to true.

Google Pay makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.

Link makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.
    - `applePay`
      Specify Apple Pay specific options. These are passed through to the Apple Pay API.
      - `recurringPaymentRequest`
        Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `regularBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `trialBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `billingAgreement`
      - `deferredPaymentRequest`
        Specify a request to set up a deferred payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepaydeferredpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `deferredBilling`
          - `amount`
          - `amountType`
            Indicates whether the billing amount is known at request time. When set to 'final', the Apple Pay payment sheet shows the configured amount.
          - `label`
          - `deferredPaymentDate`
        - `billingAgreement`
        - `freeCancellationDate`
          If set, you must also supply a freeCancellationDateTimeZone.,
        - `freeCancellationDateTimeZone`
          "If set, you must also supply a freeCancellationDate.,
      - `automaticReloadPaymentRequest`
        Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `automaticReloadBilling`
          - `amount`
          - `label`
          - `automaticReloadPaymentThresholdAmount`
        - `billingAgreement`

### with customized fields

### Option parameter

- `fields`
  Pass an object to specify payment `fields` you don't want to collect with the Payment Element.
    - `billingDetails`
      Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
      - `name`
        Specify `always` to require the Payment Element to collect the customer's billing name.
      - `email`
        Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
      - `phone`
        Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
      - `address`
        Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
        - `line1`
        - `line2`
        - `city`
          The name of a city, town, village, etc.
        - `state`
          The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
        - `country`
          Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
        - `postalCode`
          The postal code or ZIP code, also known as PIN code in India.
    - `[paymentMethodType]`
      Optionally specify the billing detail collection settings for any Payment Element payment method type. Examples of valid values are `card`, `klarna`, or `us_bank_account`. You can include one or more payment method type keys.
      - `billingDetails`
        Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
        - `name`
          Specify `always` to require the Payment Element to collect the customer's billing name.
        - `email`
          Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
        - `phone`
          Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
        - `address`
          Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
          - `line1`
          - `line2`
          - `city`
            The name of a city, town, village, etc.
          - `state`
            The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
          - `country`
            Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
          - `postalCode`
            The postal code or ZIP code, also known as PIN code in India.

### Example

```title
Create a Payment Element with customized fields
```

### Example

```title
Create a Payment Element
```

## Get a Payment Element

`elements.getElement(type: 'payment')`

This method retrieves a previously created Payment Element.

- `type`
  The type of Element being retrieved, which is `payment` in this case.

### Example

```title
Get a Payment Element
```

## Update a Payment Element

`element.update(options: object)`

Updates the options the [Payment Element](https://docs.stripe.com/js/element/payment_element.md)
was initialized with. Updates are merged into the existing configuration
with a shallow merge.

**NOTE**: Don't use `element.update()` to fetch updates from a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) or [SetupIntent](https://docs.stripe.com/api/setup_intents.md).
Use [elements.fetchUpdates()](https://docs.stripe.com/js/elements_object/fetch_updates.md) instead.

- `options`
  Options for updating the Payment Element.
    - `layout`
      Specify the layout for the Payment Element: `'auto'`, `'accordion'`, or `'tabs'`. With `'auto'`, Stripe selects the layout automatically. If you only pass a layout type without any additional parameters, the Payment Element renders using that layout and the default values associated with it.

An object can also be passed to specify the layout with additional configuration.
      - `type`
        Defines the layout to render the Payment Element.
      - `radios`
        Controls when to render each Payment Method with a radio input next to its logo. The radios visually indicate the current selection of the Payment Element. Defaults to `'auto'`.

- `'always'` — Always show radio inputs.
- `'never'` — Never show radio inputs.
- `'if_multiple'` — Show radio inputs only when there are multiple payment methods available. When there is only one payment method, no radio input is displayed.
- `'auto'` — Stripe determines the best experience to optimize conversion.

_This property is only applicable to the `accordion` layout._
      - `spacedAccordionItems`
        When `true`, the Payment Methods render as standalone buttons with space in between them.

_This property is only applicable to the `accordion` layout._
      - `visibleAccordionItemsCount`
        Sets the max number of Payment Methods visible before using the "More" button to hide additional Payment Methods. Set this value to `0` to disable the "More" button and render all available Payment Methods. Default is `5`.

_This property is only applicable to the `accordion` layout._
    - `defaultValues`
      Provide initial customer information that will be displayed in the Payment Element.
The form will render with empty fields if not provided.
      - `billingDetails`
        Specify customer's billing details, which lets you pre-fill a customer’s name, email,
phone number and address if required by payment method. Pre-filling as much information
as possible streamlines the checkout process.
        - `name`
        - `email`
        - `phone`
        - `address`
          - `line1`
          - `line2`
          - `city`
            The name of a city, town, village, etc.
          - `state`
            The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
          - `country`
            Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
          - `postal_code`
            The postal code or ZIP code, also known as PIN code in India.
      - `paymentMethods`
        Specify customer's default information for different payment methods. Pre-filling as much information
as possible streamlines the checkout process.
        - `ideal`
          - `bank`
            A pre-filled iDEAL bank value for the Payment Element. Can only be one of the banks listed in the [iDEAL guide](https://docs.stripe.com/payments/ideal/accept-a-payment?ui=element.md#bank-reference) (e.g., `abn_amro`).
        - `payto`
          - `usePayId`
            When `true`, the PayTo payment method will default to showing the PayID input instead of BSB/account number fields. Customers can still switch between PayID and BSB/account number using the toggle link.
      - `card`
        Specify default settings for card payments.
        - `network`
          Specifies a network preference for [Card Brand Choice](https://docs.stripe.com/card-brand-choice.md). The first network in the array that matches a network on the entered co-branded card will be selected by default in the Card Brand Choice dropdown. See the [supported networks](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-card-networks-preferred) for valid values.
    - `business`
      Provide information about your business that will be displayed in the Payment Element.
This information will be retrieved from your Stripe account if not provided.
      - `name`
        The name of your business. Your business name will be used to render mandate text for some payment methods.
    - `paymentMethodOrder`
      By default, the Payment Element will use a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods are displayed in the Payment Element with a list of payment method types.

If the associated PaymentIntent has payment method types not specified in `paymentMethodOrder`, they will be displayed
after the payment methods you specify. If you specify payment method types not on the associated PaymentIntent, they will be ignored.
    - `fields`
      By default, the Payment Element collects all necessary details to complete a payment.

For some payment methods, the Payment Element collects details such as name or email
that you might have already collected from the customer. If this is the case, you can prevent the Payment Element
from collecting these details by using the `fields` option.

If you disable collecting certain fields
with the `fields` option, you must pass that same data to [stripe.confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment.md)
or we'll reject the payment.

You can set `billingDetails` at the top level to apply the same field collection settings to all payment methods,
or set `billingDetails` under a supported payment method type to override the top-level setting for that payment method.

Learn how to [customize the billing details to collect](https://docs.stripe.com/payments/payment-element/control-billing-details-collection.md) and
the [customized fields](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-customized_fields).
      - `billingDetails`
        Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
        - `name`
          Specify `always` to require the Payment Element to collect the customer's billing name.
        - `email`
          Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
        - `phone`
          Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
        - `address`
          Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
          - `line1`
          - `line2`
          - `city`
            The name of a city, town, village, etc.
          - `state`
            The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
          - `country`
            Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
          - `postalCode`
            The postal code or ZIP code, also known as PIN code in India.
      - `[paymentMethodType]`
        Optionally specify the billing detail collection settings for any Payment Element payment method type. Examples of valid values are `card`, `klarna`, or `us_bank_account`. You can include one or more payment method type keys.
        - `billingDetails`
          Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
          - `name`
            Specify `always` to require the Payment Element to collect the customer's billing name.
          - `email`
            Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
          - `phone`
            Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
          - `address`
            Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
            - `line1`
            - `line2`
            - `city`
              The name of a city, town, village, etc.
            - `state`
              The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
            - `country`
              Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
            - `postalCode`
              The postal code or ZIP code, also known as PIN code in India.
    - `readOnly`
      Applies a read-only state to the Payment Element so that payment details can’t be changed. Default is false.

Enabling the `readOnly` option doesn't change the Payment Element's visual appearance. If you want to adjust the way the Payment Element looks, use the [Appearance API](https://docs.stripe.com/elements/appearance-api.md).
    - `terms`
      Control how mandates or other legal agreements are displayed in the Payment Element.
Use `never` to never display legal agreements. The default setting is `auto`, which causes
legal agreements to only be shown when necessary.

Consult your legal and compliance advisors before making any changes to the text of mandates or legal agreements. You can't use the `terms` option to violate obligations under your Stripe agreement, Stripe policies, applicable laws or scheme rules.
      - `applePay`
      - `auBecsDebit`
      - `bancontact`
      - `card`
      - `cashapp`
      - `googlePay`
      - `ideal`
      - `paypal`
      - `sepaDebit`
      - `sofort`
      - `usBankAccount`
    - `walletOptions`
      Options to control the information collected from the customer when
paying with a wallet payment method.
      - `emailRequired`
        Collect the customer's email from wallet payment methods by setting this option to true.
      - `phoneNumberRequired`
        Collect the customer's phone number from wallet payment methods by setting this option to true.

PayPal doesn't provide a phone number, even when this option is set to true.

Google Pay makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.

Link makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.
    - `applePay`
      Specify Apple Pay specific options. These are passed through to the Apple Pay API.
      - `recurringPaymentRequest`
        Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `regularBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `trialBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `billingAgreement`
      - `deferredPaymentRequest`
        Specify a request to set up a deferred payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepaydeferredpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `deferredBilling`
          - `amount`
          - `amountType`
            Indicates whether the billing amount is known at request time. When set to 'final', the Apple Pay payment sheet shows the configured amount.
          - `label`
          - `deferredPaymentDate`
        - `billingAgreement`
        - `freeCancellationDate`
          If set, you must also supply a freeCancellationDateTimeZone.
        - `freeCancellationDateTimeZone`
          If set, you must also supply a freeCancellationDate.

These are [tz](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) timezones such as `America/Los_Angeles`, `Europe/Dublin`, and `Asia/Singapore`.
      - `automaticReloadPaymentRequest`
        Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `automaticReloadBilling`
          - `amount`
          - `label`
          - `automaticReloadPaymentThresholdAmount`
        - `billingAgreement`

### Example

```title
Update a Payment Element
```

## Fetch Server Updates

`elements.fetchUpdates()`

Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

This method fetches updates from the associated [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) or [SetupIntent](https://docs.stripe.com/api/setup_intents.md) on an existing instance of `Elements`, and reflects these updates in the Payment Element.

### Example

```title
Fetch Server Updates
```

## Collapse a Payment Element

`element.collapse()`

This method collapses the Payment Element into a row of payment method tabs.

### Example

```title
Collapse a Payment Element
```

## Available payment methods change event

`element.on(event: 'availablepaymentmethodschange', handler: function)`

Triggered when there is a change to which payment methods are available in the Payment Element. Also fires on initial render.

- `event`
  The name of the event. In this case, `availablepaymentmethodschange`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired. When called it will be passed an event object with the following properties:
    - `elementType`
      The type of element the event is fired from.
    - `paymentMethods`
      Describes which payment methods are available in the Payment Element. Returns `undefined` when no payment methods are available. Payment methods are returned in alphabetical order.
      - `<paymentMethodName>`
        An object for each camelCase payment method name that may be available based on your configuration.
        - `available`

### Example

```title
Handle an availablepaymentmethodschange event
```

## The Express Checkout Element

The Express Checkout Element is
an embeddable component for accepting payments through one-click payment buttons.

## Create the Express Checkout Element

`elements.create(type: 'expressCheckout', options?: object)`

This method creates an instance of the Express Checkout Element.

- `type`
  The type of Element being created, which is `expressCheckout` in this case.

- `options`
  Options for creating the Express Checkout Element.
    - `allowedShippingCountries`
      By default, the Express Checkout Element allows all countries for shipping.

You can specify which countries are allowed for shipping in the Express Checkout Element with a list of two-letter country codes.
    - `applePay`
      Specify Apple Pay specific options. These are passed through to the Apple Pay API.
      - `recurringPaymentRequest`
        Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `regularBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `trialBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `billingAgreement`
      - `deferredPaymentRequest`
        Specify a request to set up a deferred payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepaydeferredpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `deferredBilling`
          - `amount`
          - `amountType`
            Indicates whether the billing amount is known at request time. When set to 'final', the Apple Pay payment sheet shows the configured amount.
          - `label`
          - `deferredPaymentDate`
        - `billingAgreement`
        - `freeCancellationDate`
          If set, you must also supply a freeCancellationDateTimeZone.
        - `freeCancellationDateTimeZone`
          If set, you must also supply a freeCancellationDate.

These are [tz](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) timezones such as `America/Los_Angeles`, `Europe/Dublin`, and `Asia/Singapore`.
      - `automaticReloadPaymentRequest`
        Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `automaticReloadBilling`
          - `amount`
          - `label`
          - `automaticReloadPaymentThresholdAmount`
        - `billingAgreement`
    - `billingAddressRequired`
      Controls whether the Express Checkout Element collects the billing address. The default value depends on your integration:

- If you pass `allowedShippingCountries`, `phoneNumberRequired`, `shippingAddressRequired`, `emailRequired`, `applePay`, `lineItems`, or `business` when creating the Express Checkout Element, `billingAddressRequired` defaults to false.
- Otherwise, `billingAddressRequired` defaults to true.

You can explicitly set `billingAddressRequired` to true or false to override the default behavior.

We highly recommend that you collect the billing address because it can be used to perform address verifications and block fraudulent payments.
    - `business`
      Provide information about your business that's displayed in the Express Checkout Element.
This information will be retrieved from your Stripe account if it's not provided.
      - `name`
        The name of your business. Your business name is used to signal to the customer who they're paying.

Klarna always retrieves the business name from your Stripe account, even when this option is set.
    - `buttonHeight`
      By default, the height of the buttons are 44px.

You can override this to specify a custom button height in the range of 40px-55px.
    - `buttonTheme`
      Specify the preferred button theme to use. By default, Elements determines the themes based on the specified [appearance option](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-appearance).
      - `applePay`
      - `googlePay`
      - `paypal`
      - `klarna`
    - `buttonType`
      Specify the preferred button type to display.
      - `applePay`
        Default is `plain`.
      - `googlePay`
        Default is `buy`.
      - `paypal`
        Default is `paypal`.
      - `klarna`
        Default is `pay`.
    - `emailRequired`
      Collect the customer's email by setting this option to `true`.
    - `layout`
      Specify how the buttons are arranged in a grid-like layout in the Express Checkout Element.
Elements determines the layout by using certain factors, such as available space, number of buttons, and the defined `layout` object.
      - `maxColumns`
        Defines the maximum number of columns the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `maxRows`
        Defines the maximum number of rows the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `overflow`
        Specify whether or not to always hide the overflow menu or allow Elements to determine when to show the overflow menu. Default is `auto`.
You can't specify both `overflow: 'never'` and set `maxRows` to a number greater than 0.
    - `lineItems`
      An array of LineItem objects. These LineItems are shown as line items in the payment interface, if line items are supported.
You can represent discounts as negative amount LineItems.
      - `name`
        The name of the line item surfaced to the customer in the payment interface.
      - `amount`
        The amount in the currency's subunit (for example, cents, yen, etc.).
    - `paymentMethods`
      By default, the Express Checkout Element displays all payment
methods possible as a result of your Dashboard configuration. This is the `auto` behavior.

If you don't want to show a given payment method as a payment option, set its
property in `paymentMethods` to `never`.
      - `amazonPay`
      - `applePay`
        Apple Pay has additional configurations
that determine when Stripe can show it. By default, Apple Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.

If you want to always show Apple Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`. This causes Apple Pay to be shown in supported browsers even when the customer
isn't logged in to Apple Pay, resulting in a sign-in flow.

Apple Pay on non-Safari desktop browsers is only supported when its property in `paymentMethods` is set to `always`.
      - `googlePay`
        Google Pay has additional configurations
that determine when Stripe can show it. By default, Google Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.

If you want to always show Google Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`. This causes Google Pay to be shown in supported browsers even when the customer
isn't logged in to Google Pay, resulting in a sign-in flow.
      - `link`
      - `paypal`
      - `klarna`
    - `paymentMethodOrder`
      By default, the Express Checkout Element uses a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods display in the Express Checkout Element with a list of payment method types.

If there are payment methods that will show that are not specified in `paymentMethodOrder`, they display after the payment methods you specify. If you specify payment methods that will not show, they are ignored.
    - `phoneNumberRequired`
      Collect the customer's phone number by setting this option to `true`.

PayPal doesn't provide a phone number, even when this option is set to `true`.

Google Pay makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.
    - `shippingAddressRequired`
      Collect the customer's shipping address by setting this option to `true`.

If `true`, you must also supply a valid `shippingRates` option in either the `create`, `click`, or `shippingaddresschange` events.
    - `shippingRates`
      An array of ShippingRate objects. The first shipping rate listed appears in the payment interface as the default option.

PayPal will display only the first 10 shipping rates provided.
      - `id`
        Unique identifier for the object.
      - `amount`
        The amount to charge for shipping.
      - `displayName`
        The name of the shipping rate, displayed to the customer in the payment interface.
      - `deliveryEstimate`
        The estimated range for how long shipping takes, displayed to the customer in the payment interface.
We recommended using the object format, but you can use a string instead.
        - `maximum`
          The upper bound of the estimated range. If empty, it represents no upper bound (for example, infinite).
          - `unit`
            A unit of time.
          - `value`
            Must be greater than 0.
        - `minimum`
          The lower bound of the estimated range. If empty, it represents no lower bound.
          - `unit`
            A unit of time.
          - `value`
            Must be greater than 0.

### Example

```title
Create an Express Checkout Element
```

## Get an Express Checkout Element

`elements.getElement(type: 'expressCheckout')`

This method retrieves a previously created Express Checkout Element.

- `type`
  The type of Element being retrieved, which is `expressCheckout` in this case.

### Example

```title
Get an Express Checkout Element
```

## Update an Express Checkout Element

`element.update(options: object)`

Updates the options the [Express Checkout Element](https://docs.stripe.com/js/element/express_checkout_element.md)
was initialized with. Updates merge into the existing configuration.

- `options`
  Options for updating the Express Checkout Element.
    - `allowedShippingCountries`
      By default, the Express Checkout Element allows all countries for shipping.

You can specify which countries are allowed for shipping in the Express Checkout Element with a list of two-letter country codes.
    - `billingAddressRequired`
      Controls whether the Express Checkout Element collects the billing address. The default value depends on your integration:

- If you pass `allowedShippingCountries`, `phoneNumberRequired`, `shippingAddressRequired`, `emailRequired`, `applePay`, `lineItems`, or `business` when creating the Express Checkout Element, `billingAddressRequired` defaults to false.
- Otherwise, `billingAddressRequired` defaults to true.

You can explicitly set `billingAddressRequired` to true or false to override the default behavior.

We highly recommend that you collect the billing address because it can be used to perform address verifications and block fraudulent payments.
    - `emailRequired`
      Collect the customer's email by setting this option to `true`.
    - `layout`
      Specify how the buttons are arranged in a grid-like layout in the Express Checkout Element.
Elements determines the layout by using certain factors, such as available space, number of buttons, and the defined `layout` object.
      - `maxColumns`
        Defines the maximum number of columns the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `maxRows`
        Defines the maximum number of rows the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `overflow`
        Specify whether or not to always hide the overflow menu or allow Elements to determine when to show the overflow menu. Default is `auto`.
You can't specify both `overflow: 'never'` and set `maxRows` to a number greater than 0.
    - `paymentMethodOrder`
      By default, the Express Checkout Element uses a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods display in the Express Checkout Element with a list of payment method types.

If there are payment methods that will show that are not specified in `paymentMethodOrder`, they display after the payment methods you specify. If you specify payment methods that will not show, they are ignored.
    - `phoneNumberRequired`
      Collect the customer's phone number by setting this option to `true`.

PayPal doesn't provide a phone number, even when this option is set to `true`.

Google Pay makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.
    - `shippingAddressRequired`
      Collect the customer's shipping address by setting this option to `true`.

If `true`, you must also supply a valid `shippingRates` option in either the `create`, `click`, or `shippingaddresschange` events.

### Example

```title
Update an Express Checkout Element
```

## Click event

`expressCheckoutElement.on(event: 'click', handler: function)`

The `click` event is triggered from an Express Checkout Element when the customer
clicks a payment button. Use this event to configure the payment interface.

- `event`
  The name of the event.
In this case, `click`.

- `handler`
  `handler(event) => void` is a **callback function** you provide that's called after the event is fired.

After it's called, it passes an event object with the following properties:
    - `elementType`
      The type of element the event is fired from, which is `expressCheckout` in this case.
    - `expressPaymentType`
      The payment method the customer checks out with.
    - `resolve`
      A function `resolve(payload) => void` that's called to show the payment interface. You must call this function within 1 second if you handle the `click` event.
      - `allowedShippingCountries (deprecated)`
        _This parameter has been deprecated in favor of the `allowedShippingCountries` param on the [create](https://docs.stripe.com/js/elements_object/create_express_checkout_element.md#express_checkout_element_create-options-allowedShippingCountries) function._

By default, the Express Checkout Element allows all countries for shipping.

You can specify which countries are allowed for shipping in the Express Checkout Element with a list of two-letter country codes.
      - `applePay`
        Specify Apple Pay specific options. These are passed through to the Apple Pay API.
        - `recurringPaymentRequest`
          Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
          - `paymentDescription`
          - `managementURL`
          - `regularBilling`
            - `amount`
            - `label`
            - `recurringPaymentStartDate`
            - `recurringPaymentEndDate`
            - `recurringPaymentIntervalUnit`
            - `recurringPaymentIntervalCount`
          - `trialBilling`
            - `amount`
            - `label`
            - `recurringPaymentStartDate`
            - `recurringPaymentEndDate`
            - `recurringPaymentIntervalUnit`
            - `recurringPaymentIntervalCount`
          - `billingAgreement`
        - `deferredPaymentRequest`
          Specify a request to set up a deferred payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepaydeferredpaymentrequest) for more details.
          - `paymentDescription`
          - `managementURL`
          - `deferredBilling`
            - `amount`
            - `amountType`
              Indicates whether the billing amount is known at request time. When set to 'final', the Apple Pay payment sheet shows the configured amount.
            - `label`
            - `deferredPaymentDate`
          - `billingAgreement`
          - `freeCancellationDate`
            If set, you must also supply a freeCancellationDateTimeZone.
          - `freeCancellationDateTimeZone`
            If set, you must also supply a freeCancellationDate.

These are [tz](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) timezones such as `America/Los_Angeles`, `Europe/Dublin`, and `Asia/Singapore`.
        - `automaticReloadPaymentRequest`
          Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
          - `paymentDescription`
          - `managementURL`
          - `automaticReloadBilling`
            - `amount`
            - `label`
            - `automaticReloadPaymentThresholdAmount`
          - `billingAgreement`
      - `billingAddressRequired (deprecated)`
        _This parameter has been deprecated in favor of the `billingAddressRequired` param on the [create](https://docs.stripe.com/js/elements_object/create_express_checkout_element.md#express_checkout_element_create-options-billingAddressRequired) function._

By default, the Express Checkout Element collects the billing address. You can disable this by setting `billingAddressRequired` to `false`.

We highly recommend that you collect the billing address because it can be used to perform address verifications and block fraudulent payments.
      - `business (deprecated)`
        _This parameter has been deprecated in favor of the `business` param on the [create](https://docs.stripe.com/js/elements_object/create_express_checkout_element.md#express_checkout_element_create-options-business) function._

Provide information about your business that's displayed in the Express Checkout Element.
This information will be retrieved from your Stripe account if it's not provided.
        - `name`
          The name of your business. Your business name is used to signal to the customer who they're paying.

Klarna always retrieves the business name from your Stripe account, even when this option is set.
      - `emailRequired (deprecated)`
        _This parameter has been deprecated in favor of the `emailRequired` param on the [create](https://docs.stripe.com/js/elements_object/create_express_checkout_element.md#express_checkout_element_create-options-emailRequired) function._

Collect the customer's email by setting this option to `true`.
      - `lineItems`
        An array of LineItem objects. These LineItems are shown as line items in the payment interface, if line items are supported.
You can represent discounts as negative amount LineItems.
        - `name`
          The name of the line item surfaced to the customer in the payment interface.
        - `amount`
          The amount in the currency's subunit (for example, cents, yen, etc.).
      - `phoneNumberRequired (deprecated)`
        _This parameter has been deprecated in favor of the `phoneNumberRequired` param on the [create](https://docs.stripe.com/js/elements_object/create_express_checkout_element.md#express_checkout_element_create-options-phoneNumberRequired) function._

Collect the customer's phone number by setting this option to `true`.

PayPal doesn't provide a phone number, even when this option is set to `true`.
      - `shippingAddressRequired (deprecated)`
        _This parameter has been deprecated in favor of the `shippingAddressRequired` param on the [create](https://docs.stripe.com/js/elements_object/create_express_checkout_element.md#express_checkout_element_create-options-shippingAddressRequired) function._

Collect the customer's shipping address by setting this option to `true`.

If `true`, you must also supply a valid `shippingRates` option in either the `create`, `click`, or `shippingaddresschange` events.
      - `shippingRates`
        An array of ShippingRate objects. The first shipping rate listed appears in the payment interface as the default option.

PayPal will display only the first 10 shipping rates provided.
        - `id`
          Unique identifier for the object.
        - `amount`
          The amount to charge for shipping.
        - `displayName`
          The name of the shipping rate, displayed to the customer in the payment interface.
        - `deliveryEstimate`
          The estimated range for how long shipping takes, displayed to the customer in the payment interface.
We recommended using the object format, but you can use a string instead.
          - `maximum`
            The upper bound of the estimated range. If empty, it represents no upper bound (for example, infinite).
            - `unit`
              A unit of time.
            - `value`
              Must be greater than 0.
          - `minimum`
            The lower bound of the estimated range. If empty, it represents no lower bound.
            - `unit`
              A unit of time.
            - `value`
              Must be greater than 0.
    - `reject`
      A function `reject() => void` that's called to cancel the payment interface. You must call this function within 1 second if you handle the `click` event.

### Example

```title
Handle an express checkout element click event
```

## Confirm event

`expressCheckoutElement.on(event: string, handler: function)`

The `confirm` event is triggered from an Express Checkout Element when the customer
finalizes their payment. Use this event to trigger payment confirmation.

- `event`
  The name of the event.
In this case, `confirm`.

- `handler`
  A callback function `handler(event) => void` you provide that's
called after the event is fired. When called, it passes an event object
with the following properties:
    - `elementType`
      The type of element the event fires from, which is `expressCheckout` in this case.
    - `expressPaymentType`
      The payment method the customer checks out with.
    - `paymentFailed`
      A function `paymentFailed(payload) => void` that's called if you're unable
to process the customer's payment.
      - `reason`
        Default is `'fail'`. The payment interface might surface the reason
to provide a hint to the customer on why their payment failed.
      - `message`
        A short, concise, localized error message to display on the payment sheet.
If none is provided, the payment sheet will display a generic error message for the given reason.

**Wallet compatibility:** Apple Pay displays custom error messages for `'invalid_shipping_address'`, `'invalid_billing_address'`, and `'invalid_payment_data'`, but not for `'fail'` or `'address_unserviceable'`. Other wallets may not support custom messages or may truncate them.
    - `billingDetails`
      Object containing information about the customer's billing details.
      - `name`
        The name of the customer.
      - `email`
        The email address of the customer.
      - `phone`
        The phone number of the customer.
      - `address`
        The billing address of the customer.
        - `line1`
        - `line2`
        - `city`
        - `state`
        - `postal_code`
        - `country`
    - `shippingAddress`
      Object containing information about the customer's shipping address.
      - `name`
        The name of the recipient.
      - `address`
        The shipping address of the customer.
        - `line1`
        - `line2`
        - `city`
        - `state`
        - `postal_code`
        - `country`
    - `shippingRate`
      Object containing information about the selected shipping rate.
      - `id`
        Unique identifier for the object.
      - `amount`
        The amount to charge for shipping.
      - `displayName`
        The name of the shipping rate, displayed to the customer in the payment interface.
      - `deliveryEstimate`
        The estimated range for how long shipping takes, displayed to the customer in the payment interface.
We recommended using the object format, but you can use a string instead.
        - `maximum`
          The upper bound of the estimated range. If empty, it represents no upper bound (for example, infinite).
          - `unit`
            A unit of time.
          - `value`
            Must be greater than 0.
        - `minimum`
          The lower bound of the estimated range. If empty, it represents no lower bound.
          - `unit`
            A unit of time.
          - `value`
            Must be greater than 0.

### Example

```title
Handle 'confirm' event
```

## Cancel event

`expressCheckoutElement.on(event: string, handler: function)`

The `cancel` event is triggered from an Express Checkout Element when the payment interface is dismissed.

Note that in some browsers, the payment interface might be dismissed by the customer even after they authorize the payment.
This means that you might receive a `cancel` event after receiving a `confirm` event.
If you're using the `cancel` event as a hook for canceling the customer's order, make sure you also refund the payment that you just created.

- `event`
  The name of the event.
In this case, `cancel`.

- `handler`
  A callback function that you provide that's called after the event is fired.

### Example

```title
Handle 'cancel' event
```

## Available payment methods change event

`expressCheckoutElement.on(event: 'availablepaymentmethodschange', handler: function)`

Triggered when there is a change to which buttons are available in the Express Checkout Element. Also fires on initial render.

- `event`
  The name of the event. In this case, `availablepaymentmethodschange`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired. When called it will be passed an event object with the following properties:
    - `elementType`
      The type of element the event is fired from.
    - `paymentMethods`
      Describes which buttons render in the Element. Returns `undefined` if no buttons will render. Payment methods are returned in alphabetical order. Each value is an object with an `available` boolean field.

If you configured [custom payment methods](https://docs.stripe.com/payments/payment-element/custom-payment-methods.md) with an `expressCheckout` object, their IDs (prefixed with `cpmt_`) also appear as keys in this object.
      - `amazonPay`
        - `available`
      - `applePay`
        - `available`
      - `googlePay`
        - `available`
      - `klarna`
        - `available`
      - `link`
        - `available`
      - `paypal`
        - `available`

### Example

```title
Handle an availablepaymentmethodschange event
```

## Shippingaddresschange event

`expressCheckoutElement.on(event: string, handler: function)`

The `shippingaddresschange` event is triggered from an Express Checkout Element whenever the customer selects a new address in the payment interface.

This event is not available for Elements with Checkout Sessions (EwCS integrations). When using an Express Checkout Element with a Checkout Session, shipping address changes are managed through the Checkout Session itself. You can update the session on your server after the customer completes their payment rather than responding to this event during the payment flow.

- `event`
  The name of the event.
In this case, `shippingaddresschange`.

- `handler`
  A callback function `handler(event) => void` you provide that's
called after the event is fired. After it's called, it passes an event object
with the following properties:
    - `elementType`
      The type of element the event is fired from, which is `expressCheckout` in this case.
    - `resolve`
      A function `resolve(payload) => void` that's called if the recipient's shipping address is valid.
      - `applePay`
        Specify Apple Pay specific options. These are passed through to the Apple Pay API.
        - `recurringPaymentRequest`
          Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
          - `paymentDescription`
          - `managementURL`
          - `regularBilling`
            - `amount`
            - `label`
            - `recurringPaymentStartDate`
            - `recurringPaymentEndDate`
            - `recurringPaymentIntervalUnit`
            - `recurringPaymentIntervalCount`
          - `trialBilling`
            - `amount`
            - `label`
            - `recurringPaymentStartDate`
            - `recurringPaymentEndDate`
            - `recurringPaymentIntervalUnit`
            - `recurringPaymentIntervalCount`
        - `automaticReloadPaymentRequest`
          Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
          - `paymentDescription`
          - `managementURL`
          - `automaticReloadBilling`
            - `amount`
            - `label`
            - `automaticReloadPaymentThresholdAmount`
      - `lineItems`
        An array of LineItem objects. These LineItems are shown as line items in the payment interface, if line items are supported.
        - `name`
          The name of the line item surfaced to the customer in the payment interface.
        - `amount`
          The amount in the currency's subunit (for example, cents, yen, etc.).
      - `shippingRates`
        An array of ShippingRate objects. The first shipping rate listed appears in the payment interface as the default option.

PayPal will display only the first 10 shipping rates provided.
        - `id`
          Unique identifier for the object.
        - `amount`
          The amount to charge for shipping.
        - `displayName`
          The name of the shipping rate, displayed to the customer in the payment interface.
        - `deliveryEstimate`
          The estimated range for how long shipping takes, displayed to the customer in the payment interface.
We recommended using the object format, but you can use a string instead.
          - `maximum`
            The upper bound of the estimated range. If empty, it represents no upper bound (for example, infinite).
            - `unit`
              A unit of time.
            - `value`
              Must be greater than 0.
          - `minimum`
            The lower bound of the estimated range. If empty, it represents no lower bound.
            - `unit`
              A unit of time.
            - `value`
              Must be greater than 0.
    - `reject`
      A function `reject() => void` that's called if the recipient's shipping address is invalid.
    - `name`
      The name of the recipient.
    - `address`
      The shipping address of the recipient.

To maintain privacy, browsers might anonymize the shipping address by removing sensitive information that isn't necessary to calculate shipping costs.
Depending on the country, some fields can be missing or partially redacted.
For example, the shipping address in the US can only contain a city, state, and ZIP code.
The full shipping address appears in the [confirm event](https://docs.stripe.com/js/elements_object/express_checkout_element_confirm_event.md#express_checkout_element_on_confirm-handler-shippingAddress) object after the purchase is confirmed in the browser’s payment interface.
      - `city`
      - `state`
      - `postal_code`
      - `country`

### Example

```title
Handle 'shippingaddresschange' event
```

## Shippingratechange event

`expressCheckoutElement.on(event: string, handler: function)`

The `shippingratechange` event is triggered from an Express Checkout Element whenever the customer selects a new shipping rate in the payment interface.

This event is not available for Elements with Checkout Sessions (EwCS integrations). When using an Express Checkout Element with a Checkout Session, shipping rate changes are managed through the Checkout Session itself. You can update the session on your server after the customer completes their payment rather than responding to this event during the payment flow.

- `event`
  The name of the event.
In this case, `shippingratechange`.

- `handler`
  A callback function `handler(event) => void` you provide that's
called after the event is fired. After it's called, it passes an event object
with the following properties:
    - `elementType`
      The type of element the event is fired from, which is `expressCheckout` in this case.
    - `resolve`
      A function `resolve(payload) => void` that's called if the customer's shipping rate is valid.
      - `applePay`
        Specify Apple Pay specific options. These are passed through to the Apple Pay API.
        - `recurringPaymentRequest`
          Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
          - `paymentDescription`
          - `managementURL`
          - `regularBilling`
            - `amount`
            - `label`
            - `recurringPaymentStartDate`
            - `recurringPaymentEndDate`
            - `recurringPaymentIntervalUnit`
            - `recurringPaymentIntervalCount`
          - `trialBilling`
            - `amount`
            - `label`
            - `recurringPaymentStartDate`
            - `recurringPaymentEndDate`
            - `recurringPaymentIntervalUnit`
            - `recurringPaymentIntervalCount`
        - `automaticReloadPaymentRequest`
          Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
          - `paymentDescription`
          - `managementURL`
          - `automaticReloadBilling`
            - `amount`
            - `label`
            - `automaticReloadPaymentThresholdAmount`
      - `lineItems`
        An array of LineItem objects. These LineItems are shown as line items in the payment interface, if line items are supported.
        - `name`
          The name of the line item surfaced to the customer in the payment interface.
        - `amount`
          The amount in the currency's subunit (for example, cents, yen, etc.).
      - `shippingRates`
        An array of ShippingRate objects. The first shipping rate listed appears in the payment interface as the default option.

PayPal will display only the first 10 shipping rates provided.
        - `id`
          Unique identifier for the object.
        - `amount`
          The amount to charge for shipping.
        - `displayName`
          The name of the shipping rate, displayed to the customer in the payment interface.
        - `deliveryEstimate`
          The estimated range for how long shipping takes, displayed to the customer in the payment interface.
We recommended using the object format, but you can use a string instead.
          - `maximum`
            The upper bound of the estimated range. If empty, it represents no upper bound (for example, infinite).
            - `unit`
              A unit of time.
            - `value`
              Must be greater than 0.
          - `minimum`
            The lower bound of the estimated range. If empty, it represents no lower bound.
            - `unit`
              A unit of time.
            - `value`
              Must be greater than 0.
    - `reject`
      A function `reject() => void` that's called if the customer's shipping rate is invalid.
    - `shippingRate`
      The shipping rate selected by the customer.
      - `id`
        Unique identifier for the object.
      - `amount`
        The amount to charge for shipping.
      - `displayName`
        The name of the shipping rate, displayed to the customer in the payment interface.
      - `deliveryEstimate`
        The estimated range for how long shipping takes, displayed to the customer in the payment interface.
We recommended using the object format, but you can use a string instead.
        - `maximum`
          The upper bound of the estimated range. If empty, it represents no upper bound (for example, infinite).
          - `unit`
            A unit of time.
          - `value`
            Must be greater than 0.
        - `minimum`
          The lower bound of the estimated range. If empty, it represents no lower bound.
          - `unit`
            A unit of time.
          - `value`
            Must be greater than 0.

### Example

```title
Handle 'shippingratechange' event
```

## The Contact Details Element

The [Contact Details Element](https://docs.stripe.com/payments/link/accept-a-payment.md) is
an embeddable component for collecting email addresses and allow users to
log into Link on your checkout page. This element was previously known as
the Link Authentication Element.

## Create the Contact Details Element

`elements.create(type: 'contactDetails', options?: object)`

This method creates an instance of the Contact Details Element.

- `type`
  The type of Element being created, which is `contactDetails` in this case.

- `options`
  Options for creating the Contact Details Element.
    - `defaultValues`
      Provide the initial contact information that will be displayed in the Contact Details Element.
The form will render with empty fields if not provided.
      - `email`

### Example

```title
Create a Contact Details Element
```

## Get a Contact Details Element

`elements.getElement(type: 'contactDetails')`

This method retrieves a previously created Contact Details Element.

- `type`
  The type of Element being retrieved, which is `contactDetails` in this case.

### Example

```title
Get a Contact Details Element
```

## The Address Element

The Address Element is
an embeddable component for collecting local and international billing and shipping addresses.

## Create the Address Element

`elements.create(type: 'address', options: object)`

This method creates an instance of the Address Element.

**NOTE**: If you are creating multiple instances of the Address Element, configuration of the checkbox to sync shipping and billing addresses exists in the creation of the [Elements](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-syncAddressCheckbox) instance.

- `type`
  The type of Element being created, which is `address` in this case.

You can create multiple Address Elements, one of each mode, in a single Elements instance.

- `options`
  Options for creating the Address Element.
    - `mode`
      Specify which mode you would like to use Address Element for.

When `shipping` mode is used with the Payment Element and Contact Details Element, it will automatically pass shipping information when confirming Payment Intent or Setup Intent.

When `billing` mode is used with the Payment Element, it will automatically pass the billing information when confirming Payment Intent or Setup Intent.
    - `autocomplete`
      By default, the Address Element will have autocomplete enabled with Stripe provided Google Maps API key for certain countries if any of the following condition is met:
* If Payment Element is mounted in the same elements group as Address Element in a single page application.
* If the Address Element is used in an active Link session (Link is also known as Onelink in the UK).

[Contact Legal before editing or deleting the Google Maps autocomplete callout]: #

By using autocomplete, you agree to comply with the [Google Maps Platform Acceptable Use Policy](https://cloud.google.com/maps-platform/terms/aup). If you violate this policy, we might disable autocomplete, or take any other action as necessary.

You can customize the autocomplete setting with this option.
      - `mode`
        Specify `disabled` to disable autocomplete in the Address Element.

Specify `google_maps_api` to enable [Google Maps API](https://developers.google.com/maps/documentation/javascript/places) with your own key. It will only be used when Stripe provided Google Maps API key is not available.

The default setting is `automatic`, where we’ll support autocomplete when possible.
      - `apiKey`
        Specify your own [Google Maps API key](https://developers.google.com/maps/documentation/javascript/places#add-places-api-to-the-api-keys-api-restrictions-list) with it.

**Only needs to be passed in when `autocomplete.mode` is set to `google_maps_api`.**
    - `allowedCountries`
      By default, the Address Element will display all countries for selection.

You can specify which countries are displayed in the Address Element with a list of two-letter country codes.
If only one country is specified, the country field will not display.
    - `blockPoBox`
      By default, PO boxes are considered a valid address type.

You can override this to invalidate PO Boxes.
    - `contacts`
      An array of objects that can be displayed as saved addresses
in the Address Element. The first contact will be automatically selected.

If using a [CustomerSession](https://docs.stripe.com/api/customer_sessions.md), Address Element will ignore contacts
and render saved billing addresses instead.
      - `name`
        The name of the contact. This might be a person, or a business name.
      - `address`
        The address of the contact.
        - `line1`
        - `line2`
        - `city`
          The name of a city, town, village, etc.
        - `state`
          The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
        - `postal_code`
          The postal code or ZIP code, also known as PIN code in India.
        - `country`
          Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
      - `phone`
        The phone number of the contact.

The [fields.phone](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-fields-phone) option must be set to `always` if this property is specified.
    - `defaultValues`
      Provide the initial information that will be displayed in the Address Element.
The form will render with empty fields if not provided.
      - `name`
        Provide the initial full name or organization name.
      - `firstName`
        Provide the initial first name.
The [display.name](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-display-name) option must be set to `split` if this property is specified.
      - `lastName`
        Provide the initial last name.
The [display.name](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-display-name) option must be set to `split` if this property is specified.
      - `phone`
        Provide the initial phone number value.
The [fields.phone](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-fields-phone) option must be set to `always` if this property is specified.
      - `address`
        Provide the initial address details.
        - `line1`
        - `line2`
        - `city`
        - `state`
        - `postal_code`
        - `country`
    - `fields`
      By default, the Address Element will collect all the necessary information needed for an address.
In some cases, it might be necessary to collect other types of information. You can specify other types of fields to render
in the form with this option.
      - `phone`
        Specify `always` to enable phone number collection in the Address Element.
Only collect phone numbers if you need them for the transaction. Default is `auto`.
    - `validation`
      By default, the Address Element will enforce preset validation for each field.
You can customize the settings by using this option.
      - `phone`
        - `required`
          Specify `always` to make phone number a required field.
The [fields.phone](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-fields-phone) option must be set to `always` if this property is specified.
Default is `auto`.
    - `display`
      You can customize how certain fields are displayed.
      - `name`
        By default, the Address Element will display a full name field.
Specify 'split' to display a first name field and a last name field.
Specify 'organization' to display an organization field.

### Example

```title
Create an Address Element
```

## Get an Address Element

`elements.getElement(type: 'address', options?: object)`

This method retrieves a previously created Address Element.

- `type`
  The type of Element being retrieved, which is `address` in this case.

- `options`
  Options for retrieving the Address Element.
    - `mode`
      Required when using multiple Address Elements.

Specify which mode of the Address Element you would like to retrieve.

### Example

```title
Get an Address Element
```

## Update an Address Element

`element.update(options: object)`

Updates the options the [Address Element](https://docs.stripe.com/js/element/address_element.md)
was initialized with. Updates are merged into the existing configuration.

- `options`
  Options for updating the Address Element.
    - `fields`
      By default, the Address Element will collect all the necessary information needed for an address.
In some cases, it might be necessary to collect other types of information. You can specify other types of fields to render
in the form with this option.
      - `phone`
        Specify `always` to enable phone number collection in the Address Element.
Only collect phone numbers if you need them for the transaction. Default is `auto`.
    - `validation`
      By default, the Address Element will enforce preset validation for each field.
You can customize the settings by using this option.
      - `phone`
        - `required`
          Specify `always` to make phone number a required field.
The [fields.phone](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-fields-phone) option must be set to `always` if this property is specified.
Default is `auto`.

### Example

```title
Update an Address Element
```

## Get value from an Address Element

`element.getValue(options?: object)`

Validates and retrieves form values from an Address Element. If there are any input validation errors,
the errors will display by their respective fields.

- `options`
  An optional options object to control the format of the returned values.
    - `format`
      Controls the format of the `state` field in the returned address value.

* `latin`: Return the state in Latin characters (for example, "Tokyo").
* `localized`: Return the state in the locale's native script (for example, "東京").

If unspecified in Stripe.js Clover and below, format is determined by a heuristic based on the customer's browser language. If unspecified in Stripe.js Dahlia and above, defaults to `latin`.

### Example

```title
Get value from an Address Element
```

## The Tax ID Element

The [Tax ID Element](https://docs.stripe.com/elements/tax-id-element.md) is
an embeddable component for collecting customer tax ID information
for tax reporting and compliance purposes.

## Create a Tax ID Element

`elements.create(type: 'taxId', options?: object)`

This method creates an instance of the Tax ID Element.

- `type`
  The type of Element being created, which is `taxId` in this case.

- `options`
  Tax ID Element initialization options.
    - `visibility`
      By default, the Tax ID Element displays when the user is in a country that supports tax ID collection.
Specify `always` to display the element regardless of the user's country.
Specify `never` to hide the element completely.
    - `fields`
      By default, the Tax ID Element collects all tax ID information.

If it's not necessary for you to collect all fields, you can disable Tax ID Element collection of certain fields with the `fields` option.
      - `businessName`
        Specify `always` to collect the business name.
Specify `never` to not collect the business name.
Default is `auto`.
    - `validation`
      By default, the Tax ID Element will enforce preset validation for each field. You can customize the settings by using this option.
      - `businessName`
        - `required`
          Specify `always` to make business name a required field.
Specify `never` to make business name an optional field.
Default is `auto`.
      - `taxId`
        - `required`
          Specify `always` to make tax ID a required field.
Specify `never` to make tax ID an optional field.
Default is `auto`.
    - `verification`
      Configure real-time tax ID verification.
Requires a [Tax Complete subscription or Tax Custom pricing](https://stripe.com/tax/pricing).
If your account isn't eligible, the Tax ID Element emits a [loaderror](https://docs.stripe.com/js/element/events/on_loaderror.md) event.
      - `taxId`
        - `mode`
          Specify `if_supported` to enable real-time tax ID verification for supported tax ID types.
Specify `never` to disable verification.
Default is `never`.

### Example

```title
Create a Tax ID Element
```

## Retrieve a Tax ID Element

`elements.getElement(type: 'taxId')`

This method retrieves a previously created Tax ID Element.

- `type`
  The type of Element being retrieved, which is `taxId` in this case.

### Example

```title
Retrieve a Tax ID Element
```

## Get value from a Tax ID Element

`element.getValue()`

Validates and retrieves form values from a Tax ID Element. If there are any input validation errors,
the errors are displayed by their associated fields.

### Example

```title
Get value from a Tax ID Element
```

## Issuing Elements

[Issuing Elements](https://docs.stripe.com/issuing/elements.md) allows you to display
the sensitive data of your Issuing cards in a PCI-compliant manner.

## Create an Element

`elements.create(type: string, options: object)`

This method creates an instance of an individual Issuing Element.

It takes the `type` of Element to create as well as an `options` object.

## Other Elements

Stripe also offers a [set of Elements for individual payment methods](https://docs.stripe.com/payments/elements.md) that you can use in your payment flows.

## Create an Element

`elements.create(type: string, options?: object)`

This method creates an instance of an individual `Element`.

It takes the `type` of `Element` to create as well as an `options` object.

## Get an Element

`elements.getElement(type: string)`

This method looks up a previously created [Element](https://docs.stripe.com/js/element.md) by its type.

- `type`
  The type of [Element](https://docs.stripe.com/js/elements_object/create_element.md) to lookup.

### Example

```title
Get an Element
```

## Update an Element

`element.update(options: object)`

Updates the options the [Element](https://docs.stripe.com/js/element.md)
was initialized with. Updates are merged into the existing configuration.

If you collect certain information in a different part of your interface
(e.g., ZIP or postal code), use `element.update` with the appropriate information.

The styles of an `Element` can be dynamically changed using `element.update`.
This method can be used to simulate CSS media queries that automatically adjust
the size of elements when viewed on different devices.

## Style the Element container

Style the container you mount an [Element](https://docs.stripe.com/js/element.md) to as if it were an `<input>` on your page.
For example, to control `padding` and `border` on an `Element`, set these properties on the container.
This is usually done by re-using the classes that you have applied to your DOM `<input>` elements.
After the `Element` is mounted, the `.StripeElement` class is added to the container.
Additionally, the following classes are automatically added to the container when the `Element` is complete, empty, focused, invalid, or autofilled by the browser:

* `.StripeElement--complete`
* `.StripeElement--empty`
* `.StripeElement--focus`
* `.StripeElement--invalid`
* `.StripeElement--webkit-autofill` (Chrome and Safari only)

These class names can be customized using the `classes` [option](https://docs.stripe.com/js/elements_object/create_element.md#elements_create-options-classes) when you [create an Element](#elements_create).

## Input validation

Stripe elements validate customer input as it is typed.
To help your customers catch mistakes, listen to `change` events on an `Element` and display any errors.

## Postal code formatting

The `card` element automatically determines your customer’s billing address country based on their card number.
Using this information, the postal code field validation reflects whether that country uses numeric or alphanumeric-formatted postal codes, or if the country uses postal codes at all.
For instance, if a U.S. card is entered, the postal code field only accepts a five-digit numeric value.
If it’s a UK card, an alphanumeric value can be provided instead.

Many of our test cards have a U.S. billing address country.
When using these to test your payment form, you must also use a five-digit U.S. ZIP code (e.g., 12345).
To test elements with other postal code formats, use our [international test card numbers](https://docs.stripe.com/testing.md#international-cards).

## Mount an Element

`element.mount(domElement: string | DOM element)`

The `element.mount` method attaches your [Element](https://docs.stripe.com/js/element.md) to the DOM.
`element.mount` accepts either a CSS Selector (e.g., `'#payment-element'`) or a DOM element.

You need to create a container DOM element to mount an `Element`.
Add an empty placeholder `div` to your payment form for each Element that you'll mount.
Stripe inserts an iframe into each `div` to securely collect payment information.

- `domElement`
  The CSS selector or DOM element where your [Element](https://docs.stripe.com/js/element.md) will be mounted.

### Example

```title
Mount an Element
```

## Element methods

Below are a number of methods that are in common between all [Element](https://docs.stripe.com/js/element.md) UIs. Wait until the [ready event](https://docs.stripe.com/js/element/events/on_ready.md) is triggered before calling these methods.

## Blur an Element

`element.blur()`

Blurs the [Element](https://docs.stripe.com/js/element.md).

### Example

```title
Blur an Element
```

## Clear an Element's values

`element.clear()`

Clears the value(s) of the [Element](https://docs.stripe.com/js/element.md).

### Example

```title
Clear an Element
```

## Destroy an Element

`element.destroy()`

Removes the [Element](https://docs.stripe.com/js/element.md) from the DOM and destroys it.
A destroyed `Element` can not be re-activated or re-mounted to the DOM.

### Example

```title
Destroy an Element
```

## Focus an Element

`element.focus()`

Focuses the [Element](https://docs.stripe.com/js/element.md).

> This method will currently not work on iOS 13+ due to a system limitation.

### Example

```title
Focus an Element
```

## Unmount an Element

`element.unmount()`

Unmounts the [Element](https://docs.stripe.com/js/element.md) from the DOM.
Call [`element.mount`](https://docs.stripe.com/js/element/mount.md) to re-attach it to the DOM.

### Example

```title
Unmount an Element
```

## Element events

Communicate with your [Element](https://docs.stripe.com/js/element.md) by listening to an event.
An Element might emit any of the events below.
All events have a payload object that has an `elementType` property with the type of the `Element` that emitted the event.

## Change event

`element.on(event: 'change', handler: function)`

The change event is triggered when any value in the change event payload changes.
The event payload always contains certain keys, in addition to some `Element`-specific keys.

> Consult with your legal counsel regarding your requirements and obligations about how you collect, use, and store customers' personal data

## Ready event

`element.on(event: 'ready', handler: function)`

Triggered when the `Element` is fully rendered and methods on the instance, like `element.focus()` and `element.update()`, can be called.

- `event`
  The name of the event.
In this case, `ready`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

After it's called, it passes an event object with the following properties:
    - `elementType`
      The type of element the event is fired from.
    - `availablePaymentMethods (deprecated)`
      _This field has been deprecated in favor of the `paymentMethods` field on the [`availablepaymentmethodschange`](https://docs.stripe.com/js/elements_object/express_checkout_element_availablepaymentmethodschange_event.md) event, which also fires when available payment methods change after load._

This field is **only** present on the `expressCheckout` Element. Describes which buttons render in the Element. Returns undefined if no buttons will render.
      - `link`
      - `applePay`
      - `googlePay`
      - `paypal`
      - `amazonPay`
      - `klarna`

### Example

```title
Handle an Element ready event
```

## Focus event

`element.on(event: 'focus', handler: function)`

Triggered when the `Element` gains focus.

- `event`
  The name of the event.
In this case, `focus`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

### Example

```title
Handle an Element focus event
```

## Blur event

`element.on(event: 'blur', handler: function)`

Triggered when the `Element` loses focus.

- `event`
  The name of the event.
In this case, `blur`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

### Example

```title
Handle an Element blur event
```

## Escape event

`element.on(event: 'escape', handler: function)`

Triggered when the escape key is pressed within an Element.

- `event`
  The name of the event.
In this case, `escape`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

### Example

```title
Handle an Element escape event
```

## Click event

`element.on(event: 'click', handler: function)`

## LoadError event

`element.on(event: 'loaderror', handler: function)`

Triggered when the `Element` fails to load.

**This event is only emitted from the `payment`, `linkAuthentication`, `address`, `expressCheckout`, `currencySelector`, `taxId`, `card`, and `cardNumber` Elements.**

- `event`
  The name of the event.
In this case, `loaderror`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

When called it will be passed an event object with the following properties:
    - `elementType`
      The type of element that emitted this event.
    - `error`
      An `error` object that describes the failure.

### Example

```title
Handle an Element loaderror event
```

## LoadStart event

`element.on(event: 'loaderstart', handler: function)`

Triggered when the [loader](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-loader) UI is mounted to the DOM and ready to be displayed.

**This event is only emitted from the `payment`, `paymentForm`, `linkAuthentication`, and `address` Elements.**

- `event`
  The name of the event.
In this case, `loaderstart`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

When called it will be passed an event object with the following properties:
    - `elementType`
      The type of element that emitted this event.

### Example

```title
Handle an Element loaderstart event
```

## NetworksChange event

`element.on(event: 'networkschange', handler: function)`

Triggered when there is a change to the available networks the provided card can run on.
If the list of available networks is still loading, an event with `networks: null` and `loading: true` is triggered.
When the list of available networks loads, Stripe triggers an additional event that contains the list of these networks and shows `loading: false`.
Refer to our [card brand choice guide](https://docs.stripe.com/card-brand-choice.md#identifying-the-available-card-networks) for further details.

## Checkout

[Checkout](https://docs.stripe.com/payments/checkout.md) is a low-code payment integration
that creates a customizable payment form so you can quickly collect
payments on desktop and mobile devices.

## Create an embedded Checkout instance

`stripe.createEmbeddedCheckoutPage(options: object)`

This method creates an embedded Checkout instance.

- `options`
  Embedded Checkout create options.
    - `fetchClientSecret`
      A callback function `fetchClientSecret() => Promise<string>` that resolves with the [client secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) for the [Checkout Session](docs/api/checkout/sessions/object).
    - `clientSecret (deprecated)`
      _This param has been deprecated in favor of the `fetchClientSecret` param, which offers a faster loading experience._

The [client secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) for the [Checkout Session](docs/api/checkout/sessions/object).
    - `onComplete`
      An optional callback function `onComplete() => void` that is called on completion for Checkout Sessions with `redirect_on_completion: if_required`.

### Example

```title
Create embedded Checkout instance
```

## Mount embedded Checkout

`checkout.mount(domElement: string | DOM element)`

The `checkout.mount` method attaches Checkout to the DOM.
`checkout.mount` accepts either a CSS Selector (e.g., `'#checkout'`) or a DOM element.

You need to create a container DOM element to mount Checkout.

- `domElement`
  The CSS selector or DOM element where Checkout will be mounted.

### Example

```title
Mount embedded Checkout
```

## Unmount embedded Checkout

`checkout.unmount()`

Unmounts Checkout from the DOM. Call `checkout.mount` to reattach it to the DOM.

### Example

```title
Unmount embedded Checkout
```

## Destroy embedded Checkout

`checkout.destroy()`

Removes Checkout from the DOM and destroys it. Once destroyed, an embedded
Checkout instance cannot be reattached to the DOM.

Call `checkout.createEmbeddedCheckoutPage` to create a new embedded Checkout instance
after unmounting the previous instance from the DOM.

### Example

```title
Destroy embedded Checkout
```

## Elements with the Checkout Sessions API

Build an online checkout page using React, Stripe Elements, and the Checkout Sessions API.

See [build a checkout page](https://docs.stripe.com/checkout/custom/quickstart.md) for steps on using Elements with the Checkout Sessions API.

The following Stripe.js methods are available to use as part of your integration.

## Initialize the Checkout Elements SDK

`stripe.initCheckoutElementsSdk(options?: object)`

This method initializes Checkout for [Checkout elements](https://docs.stripe.com/payments/quickstart-checkout-sessions.md) integrations, where you compose individual Elements on your checkout page.

- `options`
  Checkout initialization options.
    - `clientSecret`
      The Checkout Session [client secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) or a promise that resolves to the client secret.
    - `elementsOptions`
      A set of options to configure Elements created with Checkout.
      - `appearance`
        Match the design of your site with the [appearance option](https://docs.stripe.com/payments/checkout/customization/appearance.md?ui=elements).
The layout of each Element stays consistent, but you can modify colors, fonts, borders, padding, and more.
      - `loader`
        Display skeleton loader UI while waiting for Elements to fully load after they're mounted.
Default is `'auto'` (Stripe determines whether or not to show a loader UI).
      - `fonts`
        An array of custom fonts that elements created from the `Elements` object can use. You can specify fonts as [CssFontSource](#css_font_source_object) or [CustomFontSource](#custom_font_source_object) objects.
      - `savedPaymentMethod`
        Options to configure what Elements displays when used to [Save payment details during payment](https://docs.stripe.com/payments/checkout/save-during-payment.md).
        - `enableRedisplay`
          Toggle if Elements redisplays Customer saved Payment Methods. Default is `'auto'`. Prior to Clover, this defaulted to `'never'`.
        - `enableSave`
          Toggle if the Payment Element collects consent to save a Customer's Payment Methods. Default is `'auto'`. Prior to Clover, this defaulted to `'never'`.
      - `syncAddressCheckbox`
        Used with the [Address Element](https://docs.stripe.com/elements/address-element.md).

The `syncAddressCheckbox` parameter configures which Address Element to show the checkbox.

The checkbox allows the customer the option to sync billing and shipping addresses when both Billing and Shipping Address Elements are used in a single Elements instance.

The default value is `'billing'`.
    - `adaptivePricing`
      Options for [Adaptive Pricing](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing.md?payment-ui=embedded-components).
      - `allowed`
        Whether Adaptive Pricing can be used with this integration. Default is `false`.
[Additional setup](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing.md?payment-ui=embedded-components) is required before you can use Adaptive Pricing with Checkout elements.
    - `defaultValues`
      If customer details are already known, this option may be passed to prefill the Checkout Session and related elements. For example, use `billingAddress: {name: 'Jenny Rosen'}` to prefill only the billing name.
      - `billingAddress`
        The Customer's billing address.
        - `name`
          Full name.
        - `address`
          Address.
          - `country`
            Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
          - `line1`
            Address line 1 (e.g., street, PO Box, or company name).
          - `line2`
            Address line 2 (e.g., apartment, suite, unit, or building).
          - `city`
            City, district, suburb, town, or village.
          - `postal_code`
            ZIP or postal code.
          - `state`
            State, county, province, or region.
      - `shippingAddress`
        The Customer's shipping address.
        - `name`
          Full name.
        - `address`
          Address.
          - `country`
            Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
          - `line1`
            Address line 1 (e.g., street, PO Box, or company name).
          - `line2`
            Address line 2 (e.g., apartment, suite, unit, or building).
          - `city`
            City, district, suburb, town, or village.
          - `postal_code`
            ZIP or postal code.
          - `state`
            State, county, province, or region.
      - `email`
        The Customer's email address.
      - `phoneNumber`
        The Customer's phone number.

### Example

```title
Initialize the Checkout Elements SDK
```

## Initialize the Embedded form SDK

`stripe.initCheckoutFormSdk(options?: object)`

This method initializes Checkout for [embedded form](https://docs.stripe.com/elements/embeddable-payment-form.md) integrations, where a single form handles payment, address, and other elements.

- `options`
  Embedded form SDK initialization options.
    - `clientSecret`
      The Checkout Session [client secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) or a promise that resolves to the client secret.
    - `appearance`
      Match the design of your site with the [appearance option](https://docs.stripe.com/payments/checkout/customization/appearance.md?ui=checkout-form).
The layout stays consistent, but you can modify colors, fonts, borders, padding, and more.
Note: `rules` are not supported in the embedded form.
    - `loader`
      Display skeleton loader UI while waiting for the embedded form to fully load after it's mounted.
Default is `'auto'` (Stripe determines whether or not to show a loader UI).
    - `fonts`
      An array of custom fonts that the embedded form can use. You can specify fonts as [CssFontSource](#css_font_source_object) or [CustomFontSource](#custom_font_source_object) objects.
    - `savedPaymentMethod`
      Options to configure what the embedded form displays when used to [save payment details during payment](https://docs.stripe.com/payments/checkout/save-during-payment.md).
      - `enableRedisplay`
        Toggle if the embedded form redisplays Customer saved Payment Methods. Default is `'auto'`.
      - `enableSave`
        Toggle if the embedded form collects consent to save a customer's payment methods. Default is `'auto'`.
    - `defaultValues`
      If customer details are already known, you can pass this option to prefill the Checkout Session and the embedded form.
      - `billingAddress`
        The Customer's billing address.
        - `name`
          Full name.
        - `address`
          Address.
          - `country`
            Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
          - `line1`
            Address line 1 (e.g., street, PO Box, or company name).
          - `line2`
            Address line 2 (e.g., apartment, suite, unit, or building).
          - `city`
            City, district, suburb, town, or village.
          - `postal_code`
            ZIP or postal code.
          - `state`
            State, county, province, or region.
      - `shippingAddress`
        The Customer's shipping address.
        - `name`
          Full name.
        - `address`
          Address.
          - `country`
            Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
          - `line1`
            Address line 1 (e.g., street, PO Box, or company name).
          - `line2`
            Address line 2 (e.g., apartment, suite, unit, or building).
          - `city`
            City, district, suburb, town, or village.
          - `postal_code`
            ZIP or postal code.
          - `state`
            State, county, province, or region.
      - `email`
        The Customer's email address.
      - `phoneNumber`
        The Customer's phone number.

### Example

```title
Initialize the Embedded form SDK
```

## Checkout actions

`checkout.loadActions()`

After calling [initCheckoutElementsSdk](https://docs.stripe.com/js/custom_checkout/init.md), use `loadActions()` to access methods for reading and manipulating [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions.md).

### Example

```title
Checkout actions
```

## Read session data

`actions.getSession()`

This method returns an object that contains data about the Checkout Session.

### Example

```title
Read session data
```

## Apply a promotion code

`actions.applyPromotionCode(promotionCode: string)`

Use this method to apply a promotion code that your customer enters.

- `promotionCode`
  The promotion code to apply to the Checkout Session.

### Example

```title
Apply a promotion code
```

## Remove a promotion code

`actions.removePromotionCode()`

Use this method to remove the currently applied promotion code, if applicable.

### Example

```title
Remove a promotion code
```

## Update the Customer's shipping address

`actions.updateShippingAddress(shippingAddress: nullable object)`

Use this method to update the Customer's shipping address. If your integration uses the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), the shipping address is collected directly from the wallet and the value set by `updateShippingAddress` is not used for express checkout payments.

- `shippingAddress`
  New shipping address for the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

### Example

```title
Update the Customer's shipping address
```

## Update the Customer's billing address

`actions.updateBillingAddress(billingAddress: nullable object)`

Use this method to update the Customer's billing address. If your integration uses the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), the billing address is collected directly from the wallet and the value set by `updateBillingAddress` is not used for express checkout payments.

- `billingAddress`
  New billing information for the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

### Example

```title
Update the Customer's billing address
```

## Update the Customer's email address

`actions.updateEmail(email: nullable string)`

Use this method to update the Customer's email address. If your integration uses [Link](https://docs.stripe.com/payments/link.md) and you do not provide an email during Checkout Session creation, you must call `updateEmail` for Link to appear as a payment option for returning users (Link is also known as Onelink in the UK). If your integration uses the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), the email address is collected directly from the wallet and the value set by `updateEmail` is not used for express checkout payments.

- `email`
  The Customer's email address.

### Example

```title
Update the Customer's email address
```

## Update the Customer's phone number

`actions.updatePhoneNumber(phoneNumber: nullable string)`

Updates the customer's phone number. Requires `phone_number_collection.enabled` to be `true` on the Checkout Session.

If your integration uses the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), the phone number is collected directly from the wallet and the value set by `updatePhoneNumber` isn't used for express checkout payments.

- `phoneNumber`
  The Customer's phone number.

### Example

```title
Update the Customer's phone number
```

## Update the Customer's business name

`actions.updateBusinessName(businessName: nullable string)`

Use this method to update the Customer's business name when `name_collection.business.enabled` is `true` on the Checkout Session. If the [Tax ID Element](https://docs.stripe.com/js/custom_checkout/create_tax_id_element.md) is mounted with the business name field shown, calling `confirm()` throws an `IntegrationError` because the Tax ID Element collects the business name directly. To use `updateBusinessName()` instead, set `fields.businessName: "never"` when creating the Tax ID Element.

- `businessName`
  The Customer's business name.

### Example

```title
Update the Customer's business name
```

## Update the Customer's individual name

`actions.updateIndividualName(individualName: nullable string)`

Use this method to update the Customer's individual name when `name_collection.individual.enabled` is `true` on the Checkout Session.

- `individualName`
  The Customer's individual name.

### Example

```title
Update the Customer's individual name
```

## Update the Customer's business name and tax ID

`actions.updateTaxIdInfo(taxIdInfo?: )`

Use this method to update the Customer's business name and tax ID.

- `taxIdInfo`
  The Customer's tax ID information including the business name and tax ID.
    - `businessName`
      The Customer's business name.
    - `taxId`
      The Customer's tax ID.
      - `type`
        One of [the supported tax ID types](https://docs.stripe.com/tax/checkout/tax-ids?payment-ui=embedded-components.md#supported-types)
      - `value`
        The value of the tax ID.

### Example

```title
Update the Customer's business name and tax ID
```

## Update line item quantities

`actions.updateLineItemQuantity(options: object)`

Use this method to change the quantity of a line item.

- `options`
  Options for `updateLineItemQuantity`.
    - `lineItem`
      The [ID](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-lineItems-id) of the line item to update.
    - `quantity`
      The new quantity of the line item.

### Example

```title
Update line item quantities
```

## Update the selected shipping option

`actions.updateShippingOption(shippingOption?: string)`

Use this method to update the selected shipping option. See [shippingOptions](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-shippingOptions) for a list of the available shipping options.

- `shippingOption`
  The [ID](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-shippingOptions-id) of the shipping option to select.

### Example

```title
Update the selected shipping option
```

## Validate Elements

`actions.validateElements()`

Use this method to validate all mounted Elements without confirming the Checkout Session. This is useful for multi-step checkout flows where you want to validate user input before advancing to the next step.

This method doesn't verify that the Checkout Session can be confirmed.
To check whether all required fields are present, use the
[Session's `canConfirm` field](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-canConfirm).

### Example

```title
Validate Elements
```

## Confirm the Checkout Session

`actions.confirm(options?: object)`

Use this method to confirm the Checkout Session.

You must either read [total.total.amount](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-total-total-amount) or each of [total.total.minorUnitsAmount](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-total-total-minorUnitsAmount) and [currency](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-currency) and [minorUnitsAmountDivisor](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-minorUnitsAmountDivisor) from the checkout object and display in your UI, otherwise an error will be thrown. This helps keep your checkout page in sync as the Checkout Session updates, including adding future Stripe features, with minimal UI code changes.

- `options`
  Options for `confirm`.
    - `returnUrl`
      The URL to redirect your customer to after they authenticate or cancel their payment on the payment method’s app or site. This parameter is only required if you didn't specify the  `return_url` when creating the Checkout Session.
    - `paymentMethod`
      The ID of a previously collected [PaymentMethod](https://docs.stripe.com/api/payment_methods/object.md) to use for confirmation.

When this option is provided, Custom Checkout will ignore the payment method collected by the PaymentElement and attempt confirmation using the provided PaymentMethod.
    - `savePaymentMethod`
      Whether your Customer has provided consent to save the payment method for future purchases.

Learn how to [save payment methods](https://docs.stripe.com/checkout/custom-checkout/save-payment-methods-checkout.md).
    - `redirect`
      By default, `confirm` will always redirect to your `returnUrl` after a successful confirmation.  If you set `redirect: "if_required"`, then `confirm` will only redirect if your user chooses a redirect-based payment method.
    - `email`
      The Customer's email address.

If provided, this value overrides any values previously set using [updateEmail](https://docs.stripe.com/js/custom_checkout/update_email.md).
    - `phoneNumber`
      The Customer's phone number.

Requires `phone_number_collection.enabled` to be `true` on the Checkout Session.

If provided, this value overrides any values previously set using [updatePhoneNumber](https://docs.stripe.com/js/custom_checkout/update_phone_number.md).
    - `billingAddress`
      The Customer's billing address.

If provided, this value overrides any values previously set using [updateBillingAddress](https://docs.stripe.com/js/custom_checkout/update_billing_address.md).
      - `name`
        Full name.
      - `address`
        Address.
        - `country`
          Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
        - `line1`
          Address line 1 (e.g., street, PO Box, or company name).
        - `line2`
          Address line 2 (e.g., apartment, suite, unit, or building).
        - `city`
          City, district, suburb, town, or village.
        - `postal_code`
          ZIP or postal code.
        - `state`
          State, county, province, or region.
    - `shippingAddress`
      The Customer's shipping address.

If provided, this value overrides any values previously set using [updateShippingAddress](https://docs.stripe.com/js/custom_checkout/update_shipping_address.md).
      - `name`
        Full name.
      - `address`
        Address.
        - `country`
          Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
        - `line1`
          Address line 1 (e.g., street, PO Box, or company name).
        - `line2`
          Address line 2 (e.g., apartment, suite, unit, or building).
        - `city`
          City, district, suburb, town, or village.
        - `postal_code`
          ZIP or postal code.
        - `state`
          State, county, province, or region.
    - `expressCheckoutConfirmEvent`
      The [event object](https://docs.stripe.com/js/elements_object/express_checkout_element_confirm_event.md#express_checkout_element_on_confirm-handler) passed to your Express Checkout Element `confirm` handler.
    - `formConfirmEvent`
      The [event object](https://docs.stripe.com/js/custom_checkout/element_events/on_confirm.md?type=checkoutForm) passed to your Embedded form `confirm` handler.

### Example

```title
Confirm the Checkout Session
```

## Run server update

`actions.runServerUpdate(userFunction: function)`

Use this method to wrap an async function that makes a request to your server to update the Checkout Session.

> `runServerUpdate` enforces a 20-second timeout for your update function. If your function doesn't resolve within 20 seconds, `runServerUpdate` returns an error. Wrap `runServerUpdate` calls in `try`/`catch` blocks to handle any errors.

- `userFunction`
  An async function to make a request to your server to update the Checkout Session.

### Example

```title
Run server update
```

## The Session object

The Session object is a view of the [Checkout Session](https://docs.stripe.com/api/checkout/sessions/object.md)
API object and represents your customer's session on your checkout page.

Because data can change over the lifecycle of a session, avoid storing
a reference to the Session object. Instead, call [getSession](https://docs.stripe.com/js/custom_checkout/session.md) to
retrieve the current value, or listen to the [change event](https://docs.stripe.com/js/custom_checkout/change_event.md)
to subscribe to updates.

- `id`
  The ID of the Checkout Session.

- `billingAddress`
  Billing details of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `businessName`
  The business name as configured in the Business Public Details settings of your Stripe account.

- `canConfirm`
  Whether the Checkout Session is ready to confirm. This value is `false` while data that Checkout or mounted Elements must collect is missing or invalid. In Stripe.js `endive` or later, it's also `false` when a confirmation is in progress, or an asynchronous update is pending. Use this field to indicate to your customer if they can proceed, such as disabling the pay button.

- `currency`
  Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in
lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).

- `currencyOptions`
  The currency options available on the Checkout Session when using [Adaptive Pricing](https://docs.stripe.com/checkout/custom-checkout/adaptive-pricing.md).
    - `amount`
      A formatted string representing the total amount in the source currency, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the total amount in the source currency in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `currencyConversion`
      Currency conversion details. This is only present for the customer currency.
      - `fxRate`
        The exchange rate used to convert source currency amounts to customer currency amounts.
      - `sourceCurrency`
        The creation currency of the Checkout Session before localization.

- `discountAmounts`
  The aggregate amounts calculated per discount for all line items.
    - `amount`
      A formatted string representing the discount amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `displayName`
      A user-facing description of the discount.
    - `promotionCode`
      The customer-facing promotion code that was used to apply this discount, if any.
    - `recurring`
      Details of how the discount applies to recurring payments.
      - `type`
        One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
      - `durationInMonths`
        If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
    - `percentOff`
      An integer representing the discount amount as a percentage.
    - `amountOff`
      The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.

- `email`
  The Customer's email address.

- `lastPaymentError`
  The error encountered the last time the Checkout Session was confirmed.
    - `message`
      An error message to be displayed to the customer.

- `lineItems`
  A list of items the customer is purchasing.
    - `id`
      Unique identifier for the object.
    - `priceId`
      The ID of the Price or Plan backing the line item.
    - `subtotal`
      Total before any discounts or exclusive taxes are applied.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      Total discount amount. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      Total amount of exclusive tax (tax that is collected in addition to the subtotal).
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      Total amount of inclusive tax (tax that is already included in the subtotal).
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total amount for this line item, including discounts and tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmount`
      The amount representing the cost of a single unit of the item.
      - `amount`
        A formatted string representing the unit amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmountDecimal`
      The unit amount of the line item in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), with sub-cent precision. Use this field instead of `unitAmount` when dealing with sub-cent pricing (for example, usage-based billing). For sub-cent prices, `unitAmount.minorUnitsAmount` rounds to `0`, so `unitAmountDecimal` preserves the exact decimal value (for example, `0.005` for a price of 0.00005 USD).
      - `amount`
        A formatted string representing the unit amount with sub-cent precision, including currency symbols.
      - `minorUnitsAmount`
        A number representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) with sub-cent precision (for example, `0.5` for half a cent). Unlike `unitAmount.minorUnitsAmount`, this value can be a decimal.
    - `unitLabel`
      A label that represents the unit of this line item. Specify `unitLabel` in
[productData.unit_label](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-unit_label)
when creating the Checkout Session or when creating the Product's
[unit_label](https://docs.stripe.com/api/products/object.md#product_object-unit_label) field.
    - `description`
      An arbitrary string attached to the object. Often useful for displaying to users.
    - `name`
      The item's name, meant to be displayable to users.
    - `images`
      An array of image URLs for the line item. Specify [images](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-images) on the Product when creating the Checkout Session.
    - `quantity`
      The quantity of products being purchased.
    - `isRemovable`
      Whether the customer can remove the line item.
    - `discountAmounts`
      The amount of discount calculated per discount for this line item.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `displayName`
        A user-facing description of the discount.
      - `promotionCode`
        The customer-facing promotion code that was used to apply this discount, if any.
      - `recurring`
        Details of how the discount applies to recurring payments.
        - `type`
          One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
        - `durationInMonths`
          If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
      - `percentOff`
        An integer representing the discount amount as a percentage.
      - `amountOff`
        The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.
    - `taxAmounts`
      The amount of tax calculated per tax rate for this line item.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.
    - `recurring`
      The recurring components of a price such as `interval` and `intervalCount`.
      - `interval`
        Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
      - `intervalCount`
        The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills
every 3 months.
      - `usageType`
        One of `licensed` or `metered`. `licensed` automatically
bills the quantity set when adding it to a subscription.
`metered` aggregates the total usage based on usage records.
    - `adjustableQuantity`
      Configuration for this item's quantity to be adjusted by the
customer during checkout.
      - `maximum`
        The maximum quantity the customer can purchase for the Checkout Session.
      - `minimum`
        The minimum quantity the customer can purchase for the Checkout Session.

- `livemode`
  Has the value `true` if the object exists in live mode or the value `false` if the object exists in a sandbox.

- `minorUnitsAmountDivisor`
  The factor used to convert between minor and major currency units.

This value represents the number of minor currency units per one major unit. For example, in USD, where cents are the minor unit, the divisor is 100.  In JPY, which has no minor units, the divisor is 1.

- `nameCollection`
  Names collected from the customer. This value is `null` if [name_collection](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-name_collection) is not configured on the Checkout Session.
    - `individualName`
      The customer's individual name.
    - `businessName`
      The customer's business name.

- `phoneNumber`
  The Customer's phone number.

- `recurring`
  Details about recurring payments set up by the Checkout Session.
    - `interval`
      Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
    - `intervalCount`
      The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills every 3
months.
    - `dueNext`
      Details about the next scheduled recurring payment.
      - `subtotal`
        Total before any discounts or exclusive taxes are applied.
        - `amount`
          A formatted string representing the subtotal amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `discount`
        Total discount amount. A positive number reduces the amount to be paid.
        - `amount`
          A formatted string representing the discount amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxExclusive`
        Total amount of exclusive tax (tax that is collected in addition to the subtotal).
        - `amount`
          A formatted string representing the exclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxInclusive`
        Total amount of inclusive tax (tax that is already included in the subtotal).
        - `amount`
          A formatted string representing the inclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `total`
        Total computed amount, including discounts and tax.
        - `amount`
          A formatted string representing the total amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `billingCycleAnchor`
        A future Unix timestamp to anchor the subscription's billing
cycle. The anchor is the reference point that aligns future
billing cycle dates. If not present, the subscription starts immediately.
    - `trial`
      Details about a free trial, if there is one.
      - `trialEnd`
        Unix timestamp representing the end of the trial period the
customer will get before being charged for the first time.
      - `trialPeriodDays`
        Integer representing the number of trial period days before the customer is charged for the first time.
    - `isProrated`
      When true, the amount to be collected today is a prorated
amount for a partial billing period, such as when using
[billing_cycle_anchor](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-subscription_data-billing_cycle_anchor).

- `savedPaymentMethods`
  An array of payment methods attached to the Customer.
    - `id`
      ID of the PaymentMethod object
    - `type`
      The [type](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-type) of the PaymentMethod
    - `billingDetails`
      Billing information associated with the PaymentMethod that may be used or required by particular types of payment methods.
      - `email`
        Email address.
      - `phone`
        Billing phone number (including extension).
      - `name`
        Full name.
      - `address`
        Address.
        - `country`
          Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
        - `line1`
          Address line 1 (e.g., street, PO Box, or company name).
        - `line2`
          Address line 2 (e.g., apartment, suite, unit, or building).
        - `city`
          City, district, suburb, town, or village.
        - `postal_code`
          ZIP or postal code.
        - `state`
          State, county, province, or region.
    - `card`
      If this is a `card` PaymentMethod, this hash contains the user's card details.
      - `brand`
        The brand to use when displaying the card, this accounts for customer's brand choice on dual-branded cards.
Can be american_express, cartes_bancaires, diners_club, discover, eftpos_australia, interac, jcb, mastercard, union_pay, visa,
or other and may contain more values in the future.
      - `expMonth`
        Two-digit number representing the card's expiration month.
      - `expYear`
        Four-digit number representing the card's expiration year.
      - `last4`
        The last four digits of the card.
    - `usBankAccount`
      US bank account details. Present only when `type` is `us_bank_account`; otherwise, this field is omitted.
      - `accountHolderType`
        The type of account holder. One of `individual` or `company`.
      - `accountType`
        The type of bank account. One of `checking` or `savings`.
      - `bankName`
        The name of the bank.
      - `last4`
        The last four digits of the bank account number.
    - `sepaDebit`
      SEPA Direct Debit details. Present only when `type` is `sepa_debit`; otherwise, this field is omitted.
      - `bankCode`
        The bank code of the bank account.
      - `branchCode`
        The branch code of the bank account.
      - `country`
        The two-letter country code of the bank account ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `last4`
        The last four digits of the bank account number.
    - `bacsDebit`
      Bacs Direct Debit details. Present only when `type` is `bacs_debit`; otherwise, this field is omitted.
      - `last4`
        The last four digits of the bank account number.
      - `sortCode`
        The sort code of the bank account.
    - `auBecsDebit`
      BECS Direct Debit details. Present only when `type` is `au_becs_debit`; otherwise, this field is omitted.
      - `bsbNumber`
        The Bank State Branch (BSB) number of the bank account.
      - `last4`
        The last four digits of the bank account number.
    - `nzBankAccount`
      New Zealand bank account details. Present only when `type` is `nz_bank_account`; otherwise, this field is omitted.
      - `accountHolderName`
        The name of the account holder.
      - `bankCode`
        The bank code of the bank account.
      - `bankName`
        The name of the bank.
      - `branchCode`
        The branch code of the bank account.
      - `last4`
        The last four digits of the bank account number.
      - `suffix`
        The suffix of the bank account number.
    - `cardArt`
      Card art details. Present only when `type` is `card` and card art is available; otherwise, this field is omitted.
      - `cardArtUrl`
        The URL of the card art image.
      - `programName`
        The name of the card program associated with the card art.

- `shipping`
  The selected shipping option, if any.
    - `shippingOption`
      Details of the selected shipping option.
      - `id`
        Unique identifier for the object.
      - `amount`
        A formatted string representing the shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `currency`
        Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
      - `displayName`
        A user-facing description of the shipping option.
      - `deliveryEstimate`
        The estimated range for how long shipping will take.
        - `maximum`
          The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
        - `minimum`
          The lower bound of the estimated range. If empty, represents no lower bound.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
    - `taxAmounts`
      The amount of tax calculated per tax rate for shipping costs.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.

- `shippingAddress`
  Shipping address of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `shippingOptions`
  The list of shipping options that can be selected.
    - `id`
      Unique identifier for the object.
    - `amount`
      A formatted string representing the shipping amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `displayName`
      A user-facing description of the shipping option.
    - `deliveryEstimate`
      The estimated range for how long shipping will take.
      - `maximum`
        The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.
      - `minimum`
        The lower bound of the estimated range. If empty, represents no lower bound.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.

- `status`
  Status of the Checkout Session.
    - `type`
      One of `open`, `expired`, or `complete`.
* `open`: The Checkout Session is still in progress.
* `expired`: The Checkout Session has expired. No further processing will occur.
* `complete`: The Checkout Session is complete. Payment processing may still be in progress.
    - `paymentStatus`
      One of `paid`, `unpaid`, or `no_payment_required`. Only present when `type=complete`.
* `paid`: The payment funds are available in your account.
* `unpaid`: The payment funds are not yet available in your account.
* `no_payment_required`: The payment is delayed to a future date, or the Checkout Session is in setup mode and doesn't require a payment at this time.

- `tax`
  Details about the tax computation status.
    - `status`
      One of `ready`, `requires_shipping_address`, or `requires_billing_address`.
* `ready`: The final tax amount is computed, and the session is ready for confirmation.
* `requires_shipping_address`: A shipping address must be provided to calculate tax.
* `requires_billing_address`: A billing address must be provided to calculate tax.
    - `automaticTax`
      Details about the automatic tax settings of the Checkout Session.
      - `enabled`
        Whether automatic tax is enabled on the Checkout Session. The
other fields in this hash are `null` when automatic tax is
disabled.
      - `exempt`
        One of `none`, `exempt`, or `reverse`. This value is `null` if
automatic tax is disabled, or if the Customer hasn't provided
enough address information to determine their tax exemption.
* `none`: The Customer isn't exempt from tax.
* `exempt`: The Customer is exempt from tax.
* `reverse`: The Customer is subject to the [reverse charge mechanism](https://docs.stripe.com/tax/zero-tax.md#reverse-charges), so tax is accounted for by the Customer.
      - `addressSource`
        One of `billing`, `shipping`, or `customer`, indicating which
address is used to calculate tax. This value is `null` if
automatic tax is disabled.
* `billing`: Tax is calculated from the billing address collected during this Checkout Session.
* `shipping`: Tax is calculated from the shipping address collected during this Checkout Session.
* `customer`: Tax is calculated from the address saved on the Customer.

- `taxAmounts`
  The aggregate amounts calculated per tax rate for all line
items. This value is `null` if tax has not yet been computed,
i.e. the Customer's address has not been collected yet.
    - `amount`
      A formatted string representing the tax amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `inclusive`
      Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
    - `displayName`
      A user-facing description of the tax.
    - `percentage`
      The tax rate percentage. This value is absent for flat-amount tax rates.

- `taxIdInfo`
  The Customer's tax ID collection information. This value is `null` if no tax ID information is available.
    - `businessName`
      The Customer's business name associated with tax ID collection.
    - `taxId`
      The Customer's tax ID.
      - `type`
        One of [the supported tax ID types](https://docs.stripe.com/tax/checkout/tax-ids?payment-ui=embedded-components.md#supported-types).
      - `value`
        The value of the tax ID.

- `total`
  Tax and discount details for the computed total amount. Use this
field to render an amount breakdown to your customer, such as in an
order summary.
    - `subtotal`
      The total amount of line items, excluding tax, discounts, and shipping.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      The sum of all [exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      The sum of all [inclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `shippingRate`
      The sum of all shipping amounts.
      - `amount`
        A formatted string representing the total shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      The sum of all the discounts. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total computed amount, including discounts, tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `appliedBalance`
      Total amount of [customer credit balance](https://docs.stripe.com/billing/customer/balance.md) to be applied to the payment. A positive number increases the amount to be paid, and a negative number decreases the amount to be paid.
      - `amount`
        A formatted string representing the applied customer balance amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the applied customer balance amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `balanceAppliedToNextInvoice`
      When true, no payment will be collected immediately. Instead, the amount due will be added to the Customer's next invoice. This can happen when the amount due today is less than the [minimum chargeable amount](https://docs.stripe.com/currencies.md#minimum-and-maximum-charge-amounts).

## Checkout events

Listen to Checkout events to respond to changes caused by customer actions on your checkout page.

## Change event

`checkout.on(event: 'change', handler: function)`

The change event is triggered when [Checkout Session](https://docs.stripe.com/js/custom_checkout/session_object.md)
data changes, such as when the customer changes their shipping
address.  The event payload is always a [Checkout Session](https://docs.stripe.com/js/custom_checkout/session_object.md)
object.

- `event`
  The name of the event. In this case, `change`.

- `handler`
  `handler(session) => void` is a **callback function** that
you provide that will be called when the event is fired. When called
it will be passed a [Checkout Session](https://docs.stripe.com/js/custom_checkout/session_object.md) object.

### Example

```title
Listen to change events
```

## Use Elements with the Checkout Sessions API

[Stripe Elements](https://docs.stripe.com/payments/elements.md) are customizable UI
components you can use to build your checkout page.

Use the [Checkout Elements SDK](https://docs.stripe.com/js/custom_checkout/init.md)
instance to create and manage Elements.

## Create a Payment Element

`checkout.createPaymentElement(options?: object)`

This method creates an instance of a Payment Element.

- `options`
  Payment Element initialization options.
    - `fields`
      By default, the Payment Element collects only the necessary billing details to complete a payment.

To collect billing details outside of the Payment Element, use the `fields` option to disable Payment Element collection of certain fields.

If you set a field to `never`, you're responsible for providing it with the corresponding Checkout update method or when calling [confirm](https://docs.stripe.com/js/custom_checkout/confirm.md) if it's required for any payment methods.

You can set `billingDetails` at the top level to apply the same field collection settings to all payment methods,
or set `billingDetails` under a supported payment method type to override the top-level setting for that payment method.
      - `billingDetails`
        Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
        - `name`
          Specify `always` to require the Payment Element to collect the customer's billing name.
        - `email`
          Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
        - `phone`
          Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
        - `address`
          Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
          - `line1`
          - `line2`
          - `city`
            The name of a city, town, village, etc.
          - `state`
            The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
          - `country`
            Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
          - `postalCode`
            The postal code or ZIP code, also known as PIN code in India.
      - `[paymentMethodType]`
        Optionally specify the billing detail collection settings for any Payment Element payment method type. Examples of valid values are `card`, `klarna`, or `us_bank_account`. You can include one or more payment method type keys.
        - `billingDetails`
          Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
          - `name`
            Specify `always` to require the Payment Element to collect the customer's billing name.
          - `email`
            Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
          - `phone`
            Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
          - `address`
            Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
            - `line1`
            - `line2`
            - `city`
              The name of a city, town, village, etc.
            - `state`
              The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
            - `country`
              Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
            - `postalCode`
              The postal code or ZIP code, also known as PIN code in India.
    - `layout`
      Specify the layout for the Payment Element: `'auto'`, `'accordion'`, or `'tabs'`. With `'auto'`, Stripe selects the layout automatically. If you only pass a layout type without any additional parameters, the Payment Element renders using that layout and the default values associated with it.

An object can also be passed to specify the layout with additional configuration.
      - `type`
        Defines the layout to render the Payment Element.
      - `defaultCollapsed`
        Controls if the Payment Element renders in a collapsed state (where no payment method is selected by default). When you leave this `undefined`, Stripe renders the experience that it determines will have the best conversion.
      - `radios`
        Controls when to render each Payment Method with a radio input next to its logo. The radios visually indicate the current selection of the Payment Element. Defaults to `'auto'`.

- `'always'` — Always show radio inputs.
- `'never'` — Never show radio inputs.
- `'if_multiple'` — Show radio inputs only when there are multiple payment methods available. When there is only one payment method, no radio input is displayed.
- `'auto'` — Stripe determines the best experience to optimize conversion.

_This property is only applicable to the `accordion` layout._
      - `spacedAccordionItems`
        When `true`, the Payment Methods render as standalone buttons with space in between them.

_This property is only applicable to the `accordion` layout._
      - `visibleAccordionItemsCount`
        Sets the max number of Payment Methods visible before using the "More" button to hide additional Payment Methods. Set this value to `0` to disable the "More" button and render all available Payment Methods. Default is `5`.

_This property is only applicable to the `accordion` layout._
      - `paymentMethodLogoPosition`
        Sets the position of the payment method logo in each accordion item. Default is `start`.

_This property is only applicable to the `accordion` layout._
    - `paymentMethodOrder`
      By default, the Payment Element will use a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods are displayed in the Payment Element with a list of payment method types.

If the associated Checkout Session has payment method types not specified in `paymentMethodOrder`, they will be displayed
after the payment methods you specify. If you specify payment method types not on the associated PaymentIntent, they will be ignored.
    - `readOnly`
      Applies a read-only state to the Payment Element so that payment details can’t be changed. Default is false.

Enabling the `readOnly` option doesn't change the Payment Element's visual appearance. If you want to adjust the way the Payment Element looks, use the [Appearance API](https://docs.stripe.com/elements/appearance-api.md).
    - `terms`
      Control how mandates or other legal agreements are displayed in the Payment Element.
Use `never` to never display legal agreements. The default setting is `auto`, which causes
legal agreements to only be shown when necessary.

Consult your legal and compliance advisors before making any changes to the text of mandates or legal agreements. You can't use the `terms` option to violate obligations under your Stripe agreement, Stripe policies, applicable laws or scheme rules.
      - `applePay`
      - `auBecsDebit`
      - `bancontact`
      - `card`
      - `cashapp`
      - `googlePay`
      - `ideal`
      - `paypal`
      - `sepaDebit`
      - `sofort`
      - `usBankAccount`
    - `wallets`
      By default, the Payment Element will display all the payment
methods that the underlying Checkout Session was created with.

However, wallets like Apple Pay and Google Pay are not payment
methods per the Checkout Session API. They will show when the
Checkout Session has the `card` payment method and the customer is
using a supported platform and have an active card in their
account.  This is the `auto` behavior, and it is the default for
choice for all wallets.

If you do not want to show a given wallet as a payment option, you
can set its property in `wallets` to `never`.
      - `applePay`
      - `googlePay`
      - `link`
    - `walletOptions`
      Options to control the information collected from the customer when
paying with a wallet payment method.
      - `emailRequired`
        Collect the customer's email from wallet payment methods by setting this option to true.
      - `phoneNumberRequired`
        Collect the customer's phone number from wallet payment methods by setting this option to true.

PayPal doesn't provide a phone number, even when this option is set to true.

Google Pay makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.

Link makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.

### Example

```title
Create a Payment Element
```

## Create a Billing Address Element

`checkout.createBillingAddressElement(options?: object)`

This method creates an instance of a Billing Address Element.

- `options`
  Billing Address Element initialization options.
    - `contacts`
      An array of objects that can be displayed as saved addresses in the Billing Address Element. The first contact is automatically selected.
      - `name`
        The name of the contact. This might be a person, or a business name.
      - `address`
        The address of the contact.
        - `line1`
        - `line2`
        - `city`
          The name of a city, town, village, etc.
        - `state`
          The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
        - `postal_code`
          The postal code or ZIP code, also known as PIN code in India.
        - `country`
          Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
      - `phone`
        The phone number of the contact.
    - `display`
      You can customize how certain fields are displayed.
      - `name`
        By default, the Billing Address Element displays a full name field.
Specify 'split' to display a first name field and a last name field.
Specify 'organization' to display an organization field.
    - `autocomplete`
      By default, the Address Element will have autocomplete enabled with Stripe provided Google Maps API key for certain countries if any of the following condition is met:
* If Payment Element is mounted in the same elements group as Address Element in a single page application.
* If the Address Element is used in an active Link session (Link is also known as Onelink in the UK).

[Contact Legal before editing or deleting the Google Maps autocomplete callout]: #

By using autocomplete, you agree to comply with the [Google Maps Platform Acceptable Use Policy](https://cloud.google.com/maps-platform/terms/aup). If you violate this policy, we might disable autocomplete, or take any other action as necessary.

You can customize the autocomplete setting with this option.
      - `mode`
        Specify `disabled` to disable autocomplete in the Address Element.

Specify `google_maps_api` to enable [Google Maps API](https://developers.google.com/maps/documentation/javascript/places) with your own key. It will only be used when Stripe provided Google Maps API key is not available.

The default setting is `automatic`, where we'll support autocomplete when possible.
      - `apiKey`
        Specify your own [Google Maps API key](https://developers.google.com/maps/documentation/javascript/places#add-places-api-to-the-api-keys-api-restrictions-list) with it.

**Only needs to be passed in when `autocomplete.mode` is set to `google_maps_api`.**

### Example

```title
Create a Billing Address Element
```

## Create a Shipping Address Element

`checkout.createShippingAddressElement(options?: object)`

This method creates an instance of a Shipping Address Element.

- `options`
  Shipping Address Element initialization options.
    - `contacts`
      An array of objects that can be displayed as saved addresses in the Shipping Address Element. The first contact is automatically selected.
      - `name`
        The name of the contact. This might be a person, or a business name.
      - `address`
        The address of the contact.
        - `line1`
        - `line2`
        - `city`
          The name of a city, town, village, etc.
        - `state`
          The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
        - `postal_code`
          The postal code or ZIP code, also known as PIN code in India.
        - `country`
          Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
      - `phone`
        The phone number of the contact.
    - `display`
      You can customize how certain fields are displayed.
      - `name`
        By default, the Shipping Address Element displays a full name field.
Specify 'split' to display a first name field and a last name field.
Specify 'organization' to display an organization field.
    - `autocomplete`
      By default, the Address Element will have autocomplete enabled with Stripe provided Google Maps API key for certain countries if any of the following condition is met:
* If Payment Element is mounted in the same elements group as Address Element in a single page application.
* If the Address Element is used in an active Link session (Link is also known as Onelink in the UK).

[Contact Legal before editing or deleting the Google Maps autocomplete callout]: #

By using autocomplete, you agree to comply with the [Google Maps Platform Acceptable Use Policy](https://cloud.google.com/maps-platform/terms/aup). If you violate this policy, we might disable autocomplete, or take any other action as necessary.

You can customize the autocomplete setting with this option.
      - `mode`
        Specify `disabled` to disable autocomplete in the Address Element.

Specify `google_maps_api` to enable [Google Maps API](https://developers.google.com/maps/documentation/javascript/places) with your own key. It will only be used when Stripe provided Google Maps API key is not available.

The default setting is `automatic`, where we'll support autocomplete when possible.
      - `apiKey`
        Specify your own [Google Maps API key](https://developers.google.com/maps/documentation/javascript/places#add-places-api-to-the-api-keys-api-restrictions-list) with it.

**Only needs to be passed in when `autocomplete.mode` is set to `google_maps_api`.**

### Example

```title
Create a Shipping Address Element
```

## Create an Express Checkout Element

`checkout.createExpressCheckoutElement(options?: object)`

This method creates an instance of an Express Checkout Element.

- `options`
  Express Checkout Element initialization options.
    - `buttonHeight`
      By default, the height of the buttons are 44px.

You can override this to specify a custom button height in the range of 40px-55px.
    - `buttonTheme`
      Specify the preferred button theme to use. By default, Elements determines the themes based on the specified [appearance option](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-appearance).
      - `applePay`
      - `googlePay`
      - `paypal`
      - `klarna`
    - `buttonType`
      Specify the preferred button type to display.
      - `applePay`
        Default is `plain`.
      - `googlePay`
        Default is `buy`.
      - `paypal`
        Default is `paypal`.
      - `klarna`
        Default is `pay`.
    - `layout`
      Specify how the buttons are arranged in a grid-like layout in the Express Checkout Element.
Elements determines the layout by using certain factors, such as available space, number of buttons, and the defined `layout` object.
      - `maxColumns`
        Defines the maximum number of columns the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `maxRows`
        Defines the maximum number of rows the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `overflow`
        Specify whether or not to always hide the overflow menu or allow Elements to determine when to show the overflow menu. Default is `auto`.
You can't specify both `overflow: 'never'` and set `maxRows` to a number greater than 0.
    - `paymentMethodOrder`
      By default, the Express Checkout Element uses a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods display in the Express Checkout Element with a list of payment method types.

If there are payment methods that will show that are not specified in `paymentMethodOrder`, they display after the payment methods you specify. If you specify payment methods that will not show, they are ignored.
    - `paymentMethods`
      In addition to your Dashboard configuration, the CheckoutSession configuration also influences the availability of payment methods in the Express Checkout Element. By default, it displays all available payment methods based on both configurations. When setting the paymentMethods option, the Express Checkout Element merges your specified options with the default logic to determine the final set of payment methods displayed.
      - `amazonPay`
      - `applePay`
        Apple Pay has additional configurations
that determine when Stripe can show it. By default, Apple Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.

If you want to always show Apple Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`.

Apple Pay on non-Safari desktop browsers is only supported when its property in `paymentMethods` is set to `always`.
      - `googlePay`
        Google Pay has additional configurations
that determine when Stripe can show it. By default, Google Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.
If you want to always show Google Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`.
      - `klarna`
      - `link`
      - `paypal`

### Example

```title
Create an Express Checkout Element
```

## Create a Currency Selector Element

`checkout.createCurrencySelectorElement()`

This method creates an instance of a Currency Selector Element.

### Example

```title
Create a Currency Selector Element
```

## Create a Tax ID Element

`checkout.createTaxIdElement(options?: object)`

This method creates an instance of a Tax ID Element.

- `options`
  Tax ID Element initialization options.
    - `visibility`
      By default, the Tax ID Element displays when the user is in a country that supports tax ID collection.
Specify `always` to display the element regardless of the user's country.
Specify `never` to hide the element completely.

When `name_collection.business.enabled` is `true` on the Checkout Session and `visibility` is `auto`, the element displays regardless of the user's country. In countries that do not support tax ID collection, only the business name field shows.
    - `fields`
      By default, the Tax ID Element collects all tax ID information.

If it's not necessary for you to collect all fields, you can disable Tax ID Element collection of certain fields with the `fields` option.
      - `businessName`
        Specify `always` to collect the business name.
Specify `never` to not collect the business name.
Default is `auto`.

When `name_collection.business.enabled` is `true` on the Checkout Session, setting this to `never` signals that you are collecting the business name through your own input via `updateBusinessName()` instead.
    - `validation`
      By default, the Tax ID Element will enforce preset validation for each field. You can customize the settings by using this option.
      - `businessName`
        - `required`
          Specify `always` to make business name a required field.
Specify `never` to make business name an optional field.
Default is `auto`.

When `name_collection.business.enabled` is `true` on the Checkout Session and `name_collection.business.optional` is `false`, the SDK overrides this to `always` regardless of what you set here.
      - `taxId`
        - `required`
          Specify `always` to make tax ID a required field.
Specify `never` to make tax ID an optional field.
Default is `auto`.
    - `verification`
      Configure real-time tax ID verification.
Requires a [Tax Complete subscription or Tax Custom pricing](https://stripe.com/tax/pricing).
If your account isn't eligible, the Tax ID Element emits a [loaderror](https://docs.stripe.com/js/custom_checkout/element_events/on_loaderror.md) event.
      - `taxId`
        - `mode`
          Specify `if_supported` to enable real-time tax ID verification for supported tax ID types.
Specify `never` to disable verification.
Default is `never`.

### Example

```title
Create a Tax ID Element
```

## Create a Contact Details Element

`checkout.createContactDetailsElement()`

This method creates an instance of a Contact Details Element, which collects your customer's email address and helps them sign in to Link.

### Example

```title
Create a Contact Details Element
```

## Get the Payment Element

`checkout.getPaymentElement()`

This method gets the previously created Payment Element instance, if it exists.

### Example

```title
Get the Payment Element
```

## Get the Contact Details Element

`checkout.getContactDetailsElement()`

This method gets the previously created Contact Details Element instance, if it exists.

### Example

```title
Get the Contact Details Element
```

## Get the Billing Address Element

`checkout.getBillingAddressElement()`

This method gets the previously created Billing Address Element instance, if it exists.

### Example

```title
Get the Billing Address Element
```

## Get value from a Billing Address Element

`element.getValue(options?: object)`

Validates and retrieves form values from a Billing Address Element. If there are any input validation errors,
the errors will display by their respective fields.

- `options`
  An optional options object to control the format of the returned values.
    - `format`
      Controls the format of the `state` field in the returned address value.

* `latin`: Return the state in Latin characters (for example, "Tokyo").
* `localized`: Return the state in the locale's native script (for example, "東京").

If unspecified in Stripe.js Clover and below, format is determined by a heuristic based on the customer's browser language. If unspecified in Stripe.js Dahlia and above, defaults to `latin`.

### Example

```title
Get value from a Billing Address Element
```

## Get the Shipping Address Element

`checkout.getShippingAddressElement()`

This method gets the previously created Shipping Address Element instance, if it exists.

### Example

```title
Get the Shipping Address Element
```

## Get value from a Shipping Address Element

`element.getValue(options?: object)`

Validates and retrieves form values from a Shipping Address Element. If there are any input validation errors,
the errors will display by their respective fields.

- `options`
  An optional options object to control the format of the returned values.
    - `format`
      Controls the format of the `state` field in the returned address value.

* `latin`: Return the state in Latin characters (for example, "Tokyo").
* `localized`: Return the state in the locale's native script (for example, "東京").

If unspecified in Stripe.js Clover and below, format is determined by a heuristic based on the customer's browser language. If unspecified in Stripe.js Dahlia and above, defaults to `latin`.

### Example

```title
Get value from a Shipping Address Element
```

## Get the Express Checkout Element

`checkout.getExpressCheckoutElement()`

This method gets the previously created Express Checkout Element instance, if it exists.

### Example

```title
Get the Express Checkout Address Element
```

## Get the Currency Selector Element

`checkout.getCurrencySelectorElement()`

This method gets the previously created Currency Selector Element instance, if it exists.

### Example

```title
Get the Currency Selector Address Element
```

## Get the Tax ID Element

`checkout.getTaxIdElement()`

This method gets the previously created Tax ID Element instance, if it exists.

### Example

```title
Get the Tax ID Element
```

## Change the visual customization of Elements using the Appearance API

`checkout.changeAppearance(appearance: object)`

Change the visual customization of Elements created with Custom
Checkout using the [Appearance API](https://docs.stripe.com/payments/checkout/customization/appearance.md?ui=elements)

- `appearance`
  Match the design of your site with the [appearance option](https://docs.stripe.com/payments/checkout/customization/appearance.md?ui=elements).
The layout of each Element stays consistent, but you can modify colors, fonts, borders, padding, and more.

### Example

```title
Change the visual customization of Elements
```

## Load additional custom fonts into Elements

`checkout.loadFonts(fonts: array)`

Load an additional array of custom fonts into Elements after it loads.

- `fonts`
  An array of custom fonts.

Specify fonts as [CssFontSource](#css_font_source_object)
or [CustomFontSource](#custom_font_source_object) objects.

### Example

```title
Load additional custom fonts
```

## Embedded form methods

Use the [Embedded form SDK](https://docs.stripe.com/js/custom_checkout/form_init.md)
instance to create and manage the embedded form.

## Create an embedded form

`checkoutFormSdk.createForm(options?: object)`

This method creates an instance of an embedded form. Call [initCheckoutFormSdk](https://docs.stripe.com/js/custom_checkout/form_init.md) first to obtain the `checkoutFormSdk` object.

- `options`
  Embedded form initialization options.
    - `layout`
      The layout of the embedded form. The `'expanded'` layout is a single-step embedded form, while the `'compact'` layout is a multi-step embedded form. When you leave this undefined, Stripe renders the layout it determines has the best conversion.

The `'compact'` layout is in private preview. [Request access](https://docs.stripe.com/checkout/form/quickstart.md#request-access-to-the-compact-layout).
    - `contacts`
      An array of objects that you can use to display saved addresses in the embedded form. The first contact is automatically selected.
      - `name`
        The name of the contact. This might be a person, or a business name.
      - `address`
        The address of the contact.
        - `line1`
        - `line2`
        - `city`
          The name of a city, town, village, etc.
        - `state`
          The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
        - `postal_code`
          The postal code or ZIP code, also known as PIN code in India.
        - `country`
          Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
      - `phone`
        The phone number of the contact.
    - `features`
      Configuration for client-side features of the embedded form, such as amount summary expansion and promotion code collection.
      - `amountSummary`
        Configuration for the amount summary in the embedded form.
        - `expanded`
          Controls whether the amount summary can be collapsed in the embedded form.

By default (`'auto'`), the amount summary starts collapsed when it has expandable content, and the customer can expand or collapse it.

Set to `'always'` to keep the amount summary expanded and prevent it from being collapsed.

If there are no additional details to display, the summary shows only the total and doesn't expand, regardless of this setting.
      - `promotionCodeCollection`
        Controls whether to show promotion code input in the embedded form. Defaults to `'auto'`.

- `'auto'`: Shows the promotion code input if the Checkout Session enables [allow_promotion_codes](https://docs.stripe.com/api/checkout/sessions/create#create_checkout_session-allow_promotion_codes).
- `'never'`: Never shows the promotion code input in the embedded form. Use this if you build your own promotion code input outside of the form.
    - `expressCheckout`
      Express checkout configuration options.
      - `buttonHeight`
        By default, the height of the buttons are 44px.

You can override this to specify a custom button height in the range of 40px-55px.
      - `buttonTheme`
        Specify the preferred button theme to use. By default, Elements determines the themes based on the specified [appearance option](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-appearance).
        - `applePay`
        - `googlePay`
        - `paypal`
        - `klarna`
      - `paymentMethods`
        In addition to your Dashboard configuration, the CheckoutSession configuration also influences the availability of payment methods in the Embedded form. By default, it displays all available payment methods based on both configurations. When setting the paymentMethods option, the Embedded form merges your specified options with the default logic to determine the final set of payment methods displayed.
        - `amazonPay`
        - `applePay`
          Apple Pay has additional configurations
that determine when Stripe can show it. By default, Apple Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.

If you want to always show Apple Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`.

Apple Pay on non-Safari desktop browsers is only supported when its property in `paymentMethods` is set to `always`.
        - `googlePay`
          Google Pay has additional configurations
that determine when Stripe can show it. By default, Google Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.
If you want to always show Google Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`.
        - `klarna`
        - `link`
        - `paypal`

### Example

```title
Create an embedded form
```

## Create a Currency Selector Element

`checkoutFormSdk.createCurrencySelectorElement()`

This method creates an instance of a Currency Selector Element. The `checkoutFormSdk` object is obtained by calling [initCheckoutFormSdk](https://docs.stripe.com/js/custom_checkout/form_init.md).

### Example

```title
Create a Currency Selector Element
```

## Get the embedded form

`checkoutFormSdk.getForm()`

This method gets the previously created embedded form instance, if it exists. You can obtain the `checkoutFormSdk` by calling [initCheckoutFormSdk](https://docs.stripe.com/js/custom_checkout/form_init.md).

### Example

```title
Get the embedded form
```

## Get values from the embedded form

`checkoutForm.getValue(options?: object)`

Validates and retrieves the current values from the embedded form. If there are any input validation errors,
the errors display by their respective fields. Call this method after [mounting the embedded form](https://docs.stripe.com/js/custom_checkout/create_form.md).

- `options`
  An optional object to control the format of the returned values.
    - `address`
      Options for the returned billing and shipping addresses.
      - `format`
        Controls the format of the `state` field in the returned billing and shipping addresses.

* `latin`: Return the state in Latin characters (for example, "Tokyo").
* `localized`: Return the state in the locale's native script (for example, "東京").

If unspecified in Stripe.js Clover and below, format is determined by a heuristic based on the customer's browser language. If unspecified in Stripe.js Dahlia and above, defaults to `latin`.

### Example

```title
Get values from the embedded form
```

## Get the Currency Selector Element

`checkoutFormSdk.getCurrencySelectorElement()`

This method gets the previously created Currency Selector Element instance, if it exists. The `checkoutFormSdk` object is obtained by calling [initCheckoutFormSdk](https://docs.stripe.com/js/custom_checkout/form_init.md).

### Example

```title
Get the Currency Selector Element
```

## Set the view on the embedded form

`checkoutForm.setView(viewIndex: number)`

Programmatically sets the active view on the embedded form. This method is only available when `options[layout]` is `'compact'`.
The compact layout is in private preview. [Request access](https://docs.stripe.com/checkout/form/quickstart.md#request-access-to-the-compact-layout).

The `viewIndex` parameter is a positive integer that corresponds to an index from the `views` array provided on the embedded form's [change event](https://docs.stripe.com/js/custom_checkout/element_events/on_change.md?type=checkoutForm). You can only set a view where `enabled` is `true`.

- `viewIndex`
  A positive integer index corresponding to an entry in the `views` array provided on the embedded form's [change event](https://docs.stripe.com/js/custom_checkout/element_events/on_change.md?type=checkoutForm). The view at the specified index must have `enabled: true`.

### Example

```title
Set the view on the embedded form
```

## Listen to Elements events

Communicate with your [Element](https://docs.stripe.com/js/custom_checkout/custom_checkout_elements.md) by listening to an event.
An Element might emit any of the events below.
All events have a payload object that has an `elementType` property with the type of the `Element` that emitted the event.

Use the `.on` method on the Element instance to listen to events.

See also: [Elements methods](https://docs.stripe.com/js/custom_checkout/custom_checkout_elements.md) | [Listen to Checkout events](https://docs.stripe.com/js/custom_checkout/events.md)

## Change event

`element.on(event: 'change', handler: function)`

The change event is triggered when any value in the change event payload changes.
The event payload always contains certain keys, in addition to some `Element`-specific keys.

The following Checkout Elements support the `change` event:
`paymentElement`, `billingAddressElement`, `shippingAddressElement`, `taxIdElement`, and `checkoutForm`.

> Consult with your legal counsel regarding your requirements and obligations about how you collect, use, and store customers' personal data

## Ready event

`element.on(event: 'ready', handler: function)`

Triggered when the `Element` is fully rendered and methods on the instance, like `element.focus()` and `element.update()`, can be called.

- `event`
  The name of the event.
In this case, `ready`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

After it's called, it passes an event object with the following properties:
    - `elementType`
      The type of element the event is fired from.

### Example

```title
Handle an Element ready event
```

## Focus event

`element.on(event: 'focus', handler: function)`

Triggered when the `Element` gains focus.

- `event`
  The name of the event.
In this case, `focus`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

### Example

```title
Handle an Element focus event
```

## Blur event

`element.on(event: 'blur', handler: function)`

Triggered when the `Element` loses focus.

- `event`
  The name of the event.
In this case, `blur`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

### Example

```title
Handle an Element blur event
```

## Escape event

`element.on(event: 'escape', handler: function)`

Triggered when the escape key is pressed within an `Element`.

- `event`
  The name of the event.
In this case, `escape`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

### Example

```title
Handle an Element escape event
```

## LoadError event

`element.on(event: 'loaderror', handler: function)`

Triggered when the `Element` fails to load.

- `event`
  The name of the event.
In this case, `loaderror`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

When called it will be passed an event object with the following properties:
    - `elementType`
      The type of element that emitted this event.
    - `error`
      An `error` object that describes the failure.

### Example

```title
Handle an Element loaderror event
```

## LoaderStart event

`element.on(event: 'loaderstart', handler: function)`

Triggered when the loader UI is mounted to the DOM and ready to be displayed.

See also: [Elements methods](https://docs.stripe.com/js/custom_checkout/custom_checkout_elements.md) | [Listen to Elements events](https://docs.stripe.com/js/custom_checkout/element_events.md)

- `event`
  The name of the event.
In this case, `loaderstart`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

When called it will be passed an event object with the following properties:
    - `elementType`
      The type of element that emitted this event.

### Example

```title
Handle a Checkout Element loaderstart event
```

## Available payment methods change event

`element.on(event: 'availablepaymentmethodschange', handler: function)`

Triggered when the set of available payment methods changes. Also fires on initial render.
Supported by `paymentElement` and `expressCheckoutElement`.

## Confirm event

`element.on(event: string, handler: function)`

The `confirm` event is triggered when the customer finalizes their payment.
Use this event to trigger payment confirmation.

The following Checkout Elements support the `confirm` event:
`expressCheckoutElement` and `checkoutForm`.

## Cancel event

`element.on(event: string, handler: function)`

The `cancel` event is triggered when the payment interface is dismissed (e.g. the customer closes it).

Note that in some browsers, the payment interface might be dismissed by the customer even after they authorize the payment.
This means that you might receive a `cancel` event after receiving a `confirm` event.
If you're using the `cancel` event as a hook for canceling the customer's order, make sure you also refund the payment that you just created.

The following Checkout Elements support the `cancel` event:
`expressCheckoutElement` and `checkoutForm`.

## React Stripe.js reference

The React bindings for Stripe.js provide context providers, hooks, and Element components for both
[Checkout Sessions](https://docs.stripe.com/api/checkout/sessions.md) and direct [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) or
[SetupIntent](https://docs.stripe.com/api/setup_intents.md) integrations.

The sections below document the APIs exported from `@stripe/react-stripe-js`
and `@stripe/react-stripe-js/checkout`,
grouped by the provider you render (`CheckoutElementsProvider` or `Elements`).

## Using the Checkout provider

Build your Stripe integration using React, Stripe Elements, and the [Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions.md).

See [build a checkout page](https://docs.stripe.com/docs/payments/quickstart-checkout-sessions.md) for steps on using Elements with the Checkout Sessions API.

The following React components and hooks are available to use as part of your integration.

## CheckoutElementsProvider

The `CheckoutElementsProvider` component allows you to use Element components and access data from your [Checkout Session](https://docs.stripe.com/api/checkout/sessions/object.md) in any nested component.
Wrap the portion of your React tree that renders individual Element components to make the Checkout instance available via React context.

To use `CheckoutElementsProvider`, call `loadStripe` from `@stripe/stripe-js` with your publishable key. The `loadStripe` function asynchronously loads the Stripe.js script and initializes a Stripe object. Pass the returned `Promise` to `CheckoutElementsProvider` along with the [client secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) of your Checkout Session.

### Props

- `stripe`
  A [Stripe object](https://docs.stripe.com/js/initializing.md) or a `Promise` resolving to a Stripe object. The easiest way to initialize a Stripe object is with the [Stripe.js wrapper module](https://github.com/stripe/stripe-js/blob/master/README.md#readme). After this prop has been set, it can not be changed.

- `options`
  Options for `CheckoutElementsProvider`.
    - `clientSecret`
      The Checkout Session [client secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) or a promise that resolves to the client secret.
    - `elementsOptions`
      A set of options to configure Elements created with [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions.md).
      - `appearance`
        Match the design of your site with the [appearance option](https://docs.stripe.com/payments/checkout/customization/appearance.md?ui=elements).
The layout of each Element stays consistent, but you can modify colors, fonts, borders, padding, and more.
      - `loader`
        Display skeleton loader UI while waiting for Elements to fully load after they're mounted.
Default is `'auto'` (Stripe determines whether or not to show a loader UI).
      - `fonts`
        An array of custom fonts that elements created from the `Elements` object can use. You can specify fonts as [CssFontSource](#css_font_source_object) or [CustomFontSource](#custom_font_source_object) objects.
      - `savedPaymentMethod`
        Options to configure what Elements displays when used to [Save payment details during payment](https://docs.stripe.com/payments/checkout/save-during-payment.md).
        - `enableRedisplay`
          Toggle if Elements redisplays Customer saved Payment Methods. Default is `'auto'`. Prior to Clover, this defaulted to `'never'`.
        - `enableSave`
          Toggle if the Payment Element collects consent to save a Customer's Payment Methods. Default is `'auto'`. Prior to Clover, this defaulted to `'never'`.
      - `syncAddressCheckbox`
        Used with the [Address Element](https://docs.stripe.com/elements/address-element.md).

The `syncAddressCheckbox` parameter configures which Address Element to show the checkbox.

The checkbox allows the customer the option to sync billing and shipping addresses when both Billing and Shipping Address Elements are used in a single Elements instance.

The default value is `'billing'`.
    - `adaptivePricing`
      Options for [Adaptive Pricing](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing.md?payment-ui=embedded-components).
      - `allowed`
        Whether Adaptive Pricing can be used with this integration. Default is `false`.
[Additional setup](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing.md?payment-ui=embedded-components) is required before you can use Adaptive Pricing with Checkout elements.

### Example

```title
Mount CheckoutElementsProvider
```

## useCheckoutElements

The `useCheckoutElements` hook returns a disjoint union describing the loading state:

* `{type: "loading"}`
* `{type: "error", error: { message: string }}`
* `{type: "success", checkout: object }`.

Upon success, it returns a [Session object](https://docs.stripe.com/js/custom_checkout/session_object.md) as well as actions to update the Checkout Session.

Use `useCheckoutElements` inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md). For [CheckoutFormProvider](https://docs.stripe.com/js/react_stripe_js/checkout_form/checkout_form_provider.md) integrations, use [useCheckoutForm](https://docs.stripe.com/js/react_stripe_js/checkout_form/use_checkout_form.md) instead.

### Object properties

- `id`
  The ID of the Checkout Session.

- `billingAddress`
  Billing details of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `businessName`
  The business name as configured in the Business Public Details settings of your Stripe account.

- `canConfirm`
  Whether the Checkout Session is ready to confirm. This value is `false` while data that Checkout or mounted Elements must collect is missing or invalid. In Stripe.js `endive` or later, it's also `false` when a confirmation is in progress, or an asynchronous update is pending. Use this field to indicate to your customer if they can proceed, such as disabling the pay button.

- `currency`
  Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in
lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).

- `currencyOptions`
  The currency options available on the Checkout Session when using [Adaptive Pricing](https://docs.stripe.com/checkout/custom-checkout/adaptive-pricing.md).
    - `amount`
      A formatted string representing the total amount in the source currency, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the total amount in the source currency in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `currencyConversion`
      Currency conversion details. This is only present for the customer currency.
      - `fxRate`
        The exchange rate used to convert source currency amounts to customer currency amounts.
      - `sourceCurrency`
        The creation currency of the Checkout Session before localization.

- `discountAmounts`
  The aggregate amounts calculated per discount for all line items.
    - `amount`
      A formatted string representing the discount amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `displayName`
      A user-facing description of the discount.
    - `promotionCode`
      The customer-facing promotion code that was used to apply this discount, if any.
    - `recurring`
      Details of how the discount applies to recurring payments.
      - `type`
        One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
      - `durationInMonths`
        If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
    - `percentOff`
      An integer representing the discount amount as a percentage.
    - `amountOff`
      The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.

- `email`
  The Customer's email address.

- `lastPaymentError`
  The error encountered the last time the Checkout Session was confirmed.
    - `message`
      An error message to be displayed to the customer.

- `lineItems`
  A list of items the customer is purchasing.
    - `id`
      Unique identifier for the object.
    - `priceId`
      The ID of the Price or Plan backing the line item.
    - `subtotal`
      Total before any discounts or exclusive taxes are applied.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      Total discount amount. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      Total amount of exclusive tax (tax that is collected in addition to the subtotal).
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      Total amount of inclusive tax (tax that is already included in the subtotal).
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total amount for this line item, including discounts and tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmount`
      The amount representing the cost of a single unit of the item.
      - `amount`
        A formatted string representing the unit amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmountDecimal`
      The unit amount of the line item in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), with sub-cent precision. Use this field instead of `unitAmount` when dealing with sub-cent pricing (for example, usage-based billing). For sub-cent prices, `unitAmount.minorUnitsAmount` rounds to `0`, so `unitAmountDecimal` preserves the exact decimal value (for example, `0.005` for a price of 0.00005 USD).
      - `amount`
        A formatted string representing the unit amount with sub-cent precision, including currency symbols.
      - `minorUnitsAmount`
        A number representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) with sub-cent precision (for example, `0.5` for half a cent). Unlike `unitAmount.minorUnitsAmount`, this value can be a decimal.
    - `unitLabel`
      A label that represents the unit of this line item. Specify `unitLabel` in
[productData.unit_label](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-unit_label)
when creating the Checkout Session or when creating the Product's
[unit_label](https://docs.stripe.com/api/products/object.md#product_object-unit_label) field.
    - `description`
      An arbitrary string attached to the object. Often useful for displaying to users.
    - `name`
      The item's name, meant to be displayable to users.
    - `images`
      An array of image URLs for the line item. Specify [images](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-images) on the Product when creating the Checkout Session.
    - `quantity`
      The quantity of products being purchased.
    - `isRemovable`
      Whether the customer can remove the line item.
    - `discountAmounts`
      The amount of discount calculated per discount for this line item.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `displayName`
        A user-facing description of the discount.
      - `promotionCode`
        The customer-facing promotion code that was used to apply this discount, if any.
      - `recurring`
        Details of how the discount applies to recurring payments.
        - `type`
          One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
        - `durationInMonths`
          If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
      - `percentOff`
        An integer representing the discount amount as a percentage.
      - `amountOff`
        The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.
    - `taxAmounts`
      The amount of tax calculated per tax rate for this line item.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.
    - `recurring`
      The recurring components of a price such as `interval` and `intervalCount`.
      - `interval`
        Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
      - `intervalCount`
        The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills
every 3 months.
      - `usageType`
        One of `licensed` or `metered`. `licensed` automatically
bills the quantity set when adding it to a subscription.
`metered` aggregates the total usage based on usage records.
    - `adjustableQuantity`
      Configuration for this item's quantity to be adjusted by the
customer during checkout.
      - `maximum`
        The maximum quantity the customer can purchase for the Checkout Session.
      - `minimum`
        The minimum quantity the customer can purchase for the Checkout Session.

- `livemode`
  Has the value `true` if the object exists in live mode or the value `false` if the object exists in a sandbox.

- `minorUnitsAmountDivisor`
  The factor used to convert between minor and major currency units.

This value represents the number of minor currency units per one major unit. For example, in USD, where cents are the minor unit, the divisor is 100.  In JPY, which has no minor units, the divisor is 1.

- `nameCollection`
  Names collected from the customer. This value is `null` if [name_collection](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-name_collection) is not configured on the Checkout Session.
    - `individualName`
      The customer's individual name.
    - `businessName`
      The customer's business name.

- `phoneNumber`
  The Customer's phone number.

- `recurring`
  Details about recurring payments set up by the Checkout Session.
    - `interval`
      Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
    - `intervalCount`
      The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills every 3
months.
    - `dueNext`
      Details about the next scheduled recurring payment.
      - `subtotal`
        Total before any discounts or exclusive taxes are applied.
        - `amount`
          A formatted string representing the subtotal amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `discount`
        Total discount amount. A positive number reduces the amount to be paid.
        - `amount`
          A formatted string representing the discount amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxExclusive`
        Total amount of exclusive tax (tax that is collected in addition to the subtotal).
        - `amount`
          A formatted string representing the exclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxInclusive`
        Total amount of inclusive tax (tax that is already included in the subtotal).
        - `amount`
          A formatted string representing the inclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `total`
        Total computed amount, including discounts and tax.
        - `amount`
          A formatted string representing the total amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `billingCycleAnchor`
        A future Unix timestamp to anchor the subscription's billing
cycle. The anchor is the reference point that aligns future
billing cycle dates. If not present, the subscription starts immediately.
    - `trial`
      Details about a free trial, if there is one.
      - `trialEnd`
        Unix timestamp representing the end of the trial period the
customer will get before being charged for the first time.
      - `trialPeriodDays`
        Integer representing the number of trial period days before the customer is charged for the first time.
    - `isProrated`
      When true, the amount to be collected today is a prorated
amount for a partial billing period, such as when using
[billing_cycle_anchor](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-subscription_data-billing_cycle_anchor).

- `savedPaymentMethods`
  An array of payment methods attached to the Customer.
    - `id`
      ID of the PaymentMethod object
    - `type`
      The [type](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-type) of the PaymentMethod
    - `billingDetails`
      Billing information associated with the PaymentMethod that may be used or required by particular types of payment methods.
      - `email`
        Email address.
      - `phone`
        Billing phone number (including extension).
      - `name`
        Full name.
      - `address`
        Address.
        - `country`
          Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
        - `line1`
          Address line 1 (e.g., street, PO Box, or company name).
        - `line2`
          Address line 2 (e.g., apartment, suite, unit, or building).
        - `city`
          City, district, suburb, town, or village.
        - `postal_code`
          ZIP or postal code.
        - `state`
          State, county, province, or region.
    - `card`
      If this is a `card` PaymentMethod, this hash contains the user's card details.
      - `brand`
        The brand to use when displaying the card, this accounts for customer's brand choice on dual-branded cards.
Can be american_express, cartes_bancaires, diners_club, discover, eftpos_australia, interac, jcb, mastercard, union_pay, visa,
or other and may contain more values in the future.
      - `expMonth`
        Two-digit number representing the card's expiration month.
      - `expYear`
        Four-digit number representing the card's expiration year.
      - `last4`
        The last four digits of the card.
    - `usBankAccount`
      US bank account details. Present only when `type` is `us_bank_account`; otherwise, this field is omitted.
      - `accountHolderType`
        The type of account holder. One of `individual` or `company`.
      - `accountType`
        The type of bank account. One of `checking` or `savings`.
      - `bankName`
        The name of the bank.
      - `last4`
        The last four digits of the bank account number.
    - `sepaDebit`
      SEPA Direct Debit details. Present only when `type` is `sepa_debit`; otherwise, this field is omitted.
      - `bankCode`
        The bank code of the bank account.
      - `branchCode`
        The branch code of the bank account.
      - `country`
        The two-letter country code of the bank account ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `last4`
        The last four digits of the bank account number.
    - `bacsDebit`
      Bacs Direct Debit details. Present only when `type` is `bacs_debit`; otherwise, this field is omitted.
      - `last4`
        The last four digits of the bank account number.
      - `sortCode`
        The sort code of the bank account.
    - `auBecsDebit`
      BECS Direct Debit details. Present only when `type` is `au_becs_debit`; otherwise, this field is omitted.
      - `bsbNumber`
        The Bank State Branch (BSB) number of the bank account.
      - `last4`
        The last four digits of the bank account number.
    - `nzBankAccount`
      New Zealand bank account details. Present only when `type` is `nz_bank_account`; otherwise, this field is omitted.
      - `accountHolderName`
        The name of the account holder.
      - `bankCode`
        The bank code of the bank account.
      - `bankName`
        The name of the bank.
      - `branchCode`
        The branch code of the bank account.
      - `last4`
        The last four digits of the bank account number.
      - `suffix`
        The suffix of the bank account number.
    - `cardArt`
      Card art details. Present only when `type` is `card` and card art is available; otherwise, this field is omitted.
      - `cardArtUrl`
        The URL of the card art image.
      - `programName`
        The name of the card program associated with the card art.

- `shipping`
  The selected shipping option, if any.
    - `shippingOption`
      Details of the selected shipping option.
      - `id`
        Unique identifier for the object.
      - `amount`
        A formatted string representing the shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `currency`
        Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
      - `displayName`
        A user-facing description of the shipping option.
      - `deliveryEstimate`
        The estimated range for how long shipping will take.
        - `maximum`
          The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
        - `minimum`
          The lower bound of the estimated range. If empty, represents no lower bound.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
    - `taxAmounts`
      The amount of tax calculated per tax rate for shipping costs.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.

- `shippingAddress`
  Shipping address of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `shippingOptions`
  The list of shipping options that can be selected.
    - `id`
      Unique identifier for the object.
    - `amount`
      A formatted string representing the shipping amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `displayName`
      A user-facing description of the shipping option.
    - `deliveryEstimate`
      The estimated range for how long shipping will take.
      - `maximum`
        The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.
      - `minimum`
        The lower bound of the estimated range. If empty, represents no lower bound.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.

- `status`
  Status of the Checkout Session.
    - `type`
      One of `open`, `expired`, or `complete`.
* `open`: The Checkout Session is still in progress.
* `expired`: The Checkout Session has expired. No further processing will occur.
* `complete`: The Checkout Session is complete. Payment processing may still be in progress.
    - `paymentStatus`
      One of `paid`, `unpaid`, or `no_payment_required`. Only present when `type=complete`.
* `paid`: The payment funds are available in your account.
* `unpaid`: The payment funds are not yet available in your account.
* `no_payment_required`: The payment is delayed to a future date, or the Checkout Session is in setup mode and doesn't require a payment at this time.

- `tax`
  Details about the tax computation status.
    - `status`
      One of `ready`, `requires_shipping_address`, or `requires_billing_address`.
* `ready`: The final tax amount is computed, and the session is ready for confirmation.
* `requires_shipping_address`: A shipping address must be provided to calculate tax.
* `requires_billing_address`: A billing address must be provided to calculate tax.
    - `automaticTax`
      Details about the automatic tax settings of the Checkout Session.
      - `enabled`
        Whether automatic tax is enabled on the Checkout Session. The
other fields in this hash are `null` when automatic tax is
disabled.
      - `exempt`
        One of `none`, `exempt`, or `reverse`. This value is `null` if
automatic tax is disabled, or if the Customer hasn't provided
enough address information to determine their tax exemption.
* `none`: The Customer isn't exempt from tax.
* `exempt`: The Customer is exempt from tax.
* `reverse`: The Customer is subject to the [reverse charge mechanism](https://docs.stripe.com/tax/zero-tax.md#reverse-charges), so tax is accounted for by the Customer.
      - `addressSource`
        One of `billing`, `shipping`, or `customer`, indicating which
address is used to calculate tax. This value is `null` if
automatic tax is disabled.
* `billing`: Tax is calculated from the billing address collected during this Checkout Session.
* `shipping`: Tax is calculated from the shipping address collected during this Checkout Session.
* `customer`: Tax is calculated from the address saved on the Customer.

- `taxAmounts`
  The aggregate amounts calculated per tax rate for all line
items. This value is `null` if tax has not yet been computed,
i.e. the Customer's address has not been collected yet.
    - `amount`
      A formatted string representing the tax amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `inclusive`
      Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
    - `displayName`
      A user-facing description of the tax.
    - `percentage`
      The tax rate percentage. This value is absent for flat-amount tax rates.

- `taxIdInfo`
  The Customer's tax ID collection information. This value is `null` if no tax ID information is available.
    - `businessName`
      The Customer's business name associated with tax ID collection.
    - `taxId`
      The Customer's tax ID.
      - `type`
        One of [the supported tax ID types](https://docs.stripe.com/tax/checkout/tax-ids?payment-ui=embedded-components.md#supported-types).
      - `value`
        The value of the tax ID.

- `total`
  Tax and discount details for the computed total amount. Use this
field to render an amount breakdown to your customer, such as in an
order summary.
    - `subtotal`
      The total amount of line items, excluding tax, discounts, and shipping.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      The sum of all [exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      The sum of all [inclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `shippingRate`
      The sum of all shipping amounts.
      - `amount`
        A formatted string representing the total shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      The sum of all the discounts. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total computed amount, including discounts, tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `appliedBalance`
      Total amount of [customer credit balance](https://docs.stripe.com/billing/customer/balance.md) to be applied to the payment. A positive number increases the amount to be paid, and a negative number decreases the amount to be paid.
      - `amount`
        A formatted string representing the applied customer balance amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the applied customer balance amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `balanceAppliedToNextInvoice`
      When true, no payment will be collected immediately. Instead, the amount due will be added to the Customer's next invoice. This can happen when the amount due today is less than the [minimum chargeable amount](https://docs.stripe.com/currencies.md#minimum-and-maximum-charge-amounts).

### Example

```title
Call useCheckoutElements hook
```

## useCheckout

*`useCheckout` is deprecated. Use [useCheckoutElements](https://docs.stripe.com/js/react_stripe_js/checkout/use_checkout_elements.md) inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md), or [useCheckoutForm](https://docs.stripe.com/js/react_stripe_js/checkout_form/use_checkout_form.md) inside a [CheckoutFormProvider](https://docs.stripe.com/js/react_stripe_js/checkout_form/checkout_form_provider.md). The new hooks provide compile-time type safety for the actions available under each provider.*

The `useCheckout` hook returns a disjoint union describing the loading state:

* `{type: "loading"}`
* `{type: "error", error: { message: string }}`
* `{type: "success", checkout: object }`.

Upon success, it returns a [Session object](https://docs.stripe.com/js/custom_checkout/session_object.md) as well as actions to update the Checkout Session.

### Object properties

- `id`
  The ID of the Checkout Session.

- `billingAddress`
  Billing details of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `businessName`
  The business name as configured in the Business Public Details settings of your Stripe account.

- `canConfirm`
  Whether the Checkout Session is ready to confirm. This value is `false` while data that Checkout or mounted Elements must collect is missing or invalid. In Stripe.js `endive` or later, it's also `false` when a confirmation is in progress, or an asynchronous update is pending. Use this field to indicate to your customer if they can proceed, such as disabling the pay button.

- `currency`
  Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in
lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).

- `currencyOptions`
  The currency options available on the Checkout Session when using [Adaptive Pricing](https://docs.stripe.com/checkout/custom-checkout/adaptive-pricing.md).
    - `amount`
      A formatted string representing the total amount in the source currency, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the total amount in the source currency in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `currencyConversion`
      Currency conversion details. This is only present for the customer currency.
      - `fxRate`
        The exchange rate used to convert source currency amounts to customer currency amounts.
      - `sourceCurrency`
        The creation currency of the Checkout Session before localization.

- `discountAmounts`
  The aggregate amounts calculated per discount for all line items.
    - `amount`
      A formatted string representing the discount amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `displayName`
      A user-facing description of the discount.
    - `promotionCode`
      The customer-facing promotion code that was used to apply this discount, if any.
    - `recurring`
      Details of how the discount applies to recurring payments.
      - `type`
        One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
      - `durationInMonths`
        If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
    - `percentOff`
      An integer representing the discount amount as a percentage.
    - `amountOff`
      The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.

- `email`
  The Customer's email address.

- `lastPaymentError`
  The error encountered the last time the Checkout Session was confirmed.
    - `message`
      An error message to be displayed to the customer.

- `lineItems`
  A list of items the customer is purchasing.
    - `id`
      Unique identifier for the object.
    - `priceId`
      The ID of the Price or Plan backing the line item.
    - `subtotal`
      Total before any discounts or exclusive taxes are applied.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      Total discount amount. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      Total amount of exclusive tax (tax that is collected in addition to the subtotal).
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      Total amount of inclusive tax (tax that is already included in the subtotal).
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total amount for this line item, including discounts and tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmount`
      The amount representing the cost of a single unit of the item.
      - `amount`
        A formatted string representing the unit amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmountDecimal`
      The unit amount of the line item in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), with sub-cent precision. Use this field instead of `unitAmount` when dealing with sub-cent pricing (for example, usage-based billing). For sub-cent prices, `unitAmount.minorUnitsAmount` rounds to `0`, so `unitAmountDecimal` preserves the exact decimal value (for example, `0.005` for a price of 0.00005 USD).
      - `amount`
        A formatted string representing the unit amount with sub-cent precision, including currency symbols.
      - `minorUnitsAmount`
        A number representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) with sub-cent precision (for example, `0.5` for half a cent). Unlike `unitAmount.minorUnitsAmount`, this value can be a decimal.
    - `unitLabel`
      A label that represents the unit of this line item. Specify `unitLabel` in
[productData.unit_label](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-unit_label)
when creating the Checkout Session or when creating the Product's
[unit_label](https://docs.stripe.com/api/products/object.md#product_object-unit_label) field.
    - `description`
      An arbitrary string attached to the object. Often useful for displaying to users.
    - `name`
      The item's name, meant to be displayable to users.
    - `images`
      An array of image URLs for the line item. Specify [images](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-images) on the Product when creating the Checkout Session.
    - `quantity`
      The quantity of products being purchased.
    - `isRemovable`
      Whether the customer can remove the line item.
    - `discountAmounts`
      The amount of discount calculated per discount for this line item.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `displayName`
        A user-facing description of the discount.
      - `promotionCode`
        The customer-facing promotion code that was used to apply this discount, if any.
      - `recurring`
        Details of how the discount applies to recurring payments.
        - `type`
          One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
        - `durationInMonths`
          If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
      - `percentOff`
        An integer representing the discount amount as a percentage.
      - `amountOff`
        The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.
    - `taxAmounts`
      The amount of tax calculated per tax rate for this line item.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.
    - `recurring`
      The recurring components of a price such as `interval` and `intervalCount`.
      - `interval`
        Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
      - `intervalCount`
        The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills
every 3 months.
      - `usageType`
        One of `licensed` or `metered`. `licensed` automatically
bills the quantity set when adding it to a subscription.
`metered` aggregates the total usage based on usage records.
    - `adjustableQuantity`
      Configuration for this item's quantity to be adjusted by the
customer during checkout.
      - `maximum`
        The maximum quantity the customer can purchase for the Checkout Session.
      - `minimum`
        The minimum quantity the customer can purchase for the Checkout Session.

- `livemode`
  Has the value `true` if the object exists in live mode or the value `false` if the object exists in a sandbox.

- `minorUnitsAmountDivisor`
  The factor used to convert between minor and major currency units.

This value represents the number of minor currency units per one major unit. For example, in USD, where cents are the minor unit, the divisor is 100.  In JPY, which has no minor units, the divisor is 1.

- `nameCollection`
  Names collected from the customer. This value is `null` if [name_collection](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-name_collection) is not configured on the Checkout Session.
    - `individualName`
      The customer's individual name.
    - `businessName`
      The customer's business name.

- `phoneNumber`
  The Customer's phone number.

- `recurring`
  Details about recurring payments set up by the Checkout Session.
    - `interval`
      Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
    - `intervalCount`
      The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills every 3
months.
    - `dueNext`
      Details about the next scheduled recurring payment.
      - `subtotal`
        Total before any discounts or exclusive taxes are applied.
        - `amount`
          A formatted string representing the subtotal amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `discount`
        Total discount amount. A positive number reduces the amount to be paid.
        - `amount`
          A formatted string representing the discount amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxExclusive`
        Total amount of exclusive tax (tax that is collected in addition to the subtotal).
        - `amount`
          A formatted string representing the exclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxInclusive`
        Total amount of inclusive tax (tax that is already included in the subtotal).
        - `amount`
          A formatted string representing the inclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `total`
        Total computed amount, including discounts and tax.
        - `amount`
          A formatted string representing the total amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `billingCycleAnchor`
        A future Unix timestamp to anchor the subscription's billing
cycle. The anchor is the reference point that aligns future
billing cycle dates. If not present, the subscription starts immediately.
    - `trial`
      Details about a free trial, if there is one.
      - `trialEnd`
        Unix timestamp representing the end of the trial period the
customer will get before being charged for the first time.
      - `trialPeriodDays`
        Integer representing the number of trial period days before the customer is charged for the first time.
    - `isProrated`
      When true, the amount to be collected today is a prorated
amount for a partial billing period, such as when using
[billing_cycle_anchor](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-subscription_data-billing_cycle_anchor).

- `savedPaymentMethods`
  An array of payment methods attached to the Customer.
    - `id`
      ID of the PaymentMethod object
    - `type`
      The [type](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-type) of the PaymentMethod
    - `billingDetails`
      Billing information associated with the PaymentMethod that may be used or required by particular types of payment methods.
      - `email`
        Email address.
      - `phone`
        Billing phone number (including extension).
      - `name`
        Full name.
      - `address`
        Address.
        - `country`
          Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
        - `line1`
          Address line 1 (e.g., street, PO Box, or company name).
        - `line2`
          Address line 2 (e.g., apartment, suite, unit, or building).
        - `city`
          City, district, suburb, town, or village.
        - `postal_code`
          ZIP or postal code.
        - `state`
          State, county, province, or region.
    - `card`
      If this is a `card` PaymentMethod, this hash contains the user's card details.
      - `brand`
        The brand to use when displaying the card, this accounts for customer's brand choice on dual-branded cards.
Can be american_express, cartes_bancaires, diners_club, discover, eftpos_australia, interac, jcb, mastercard, union_pay, visa,
or other and may contain more values in the future.
      - `expMonth`
        Two-digit number representing the card's expiration month.
      - `expYear`
        Four-digit number representing the card's expiration year.
      - `last4`
        The last four digits of the card.
    - `usBankAccount`
      US bank account details. Present only when `type` is `us_bank_account`; otherwise, this field is omitted.
      - `accountHolderType`
        The type of account holder. One of `individual` or `company`.
      - `accountType`
        The type of bank account. One of `checking` or `savings`.
      - `bankName`
        The name of the bank.
      - `last4`
        The last four digits of the bank account number.
    - `sepaDebit`
      SEPA Direct Debit details. Present only when `type` is `sepa_debit`; otherwise, this field is omitted.
      - `bankCode`
        The bank code of the bank account.
      - `branchCode`
        The branch code of the bank account.
      - `country`
        The two-letter country code of the bank account ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `last4`
        The last four digits of the bank account number.
    - `bacsDebit`
      Bacs Direct Debit details. Present only when `type` is `bacs_debit`; otherwise, this field is omitted.
      - `last4`
        The last four digits of the bank account number.
      - `sortCode`
        The sort code of the bank account.
    - `auBecsDebit`
      BECS Direct Debit details. Present only when `type` is `au_becs_debit`; otherwise, this field is omitted.
      - `bsbNumber`
        The Bank State Branch (BSB) number of the bank account.
      - `last4`
        The last four digits of the bank account number.
    - `nzBankAccount`
      New Zealand bank account details. Present only when `type` is `nz_bank_account`; otherwise, this field is omitted.
      - `accountHolderName`
        The name of the account holder.
      - `bankCode`
        The bank code of the bank account.
      - `bankName`
        The name of the bank.
      - `branchCode`
        The branch code of the bank account.
      - `last4`
        The last four digits of the bank account number.
      - `suffix`
        The suffix of the bank account number.
    - `cardArt`
      Card art details. Present only when `type` is `card` and card art is available; otherwise, this field is omitted.
      - `cardArtUrl`
        The URL of the card art image.
      - `programName`
        The name of the card program associated with the card art.

- `shipping`
  The selected shipping option, if any.
    - `shippingOption`
      Details of the selected shipping option.
      - `id`
        Unique identifier for the object.
      - `amount`
        A formatted string representing the shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `currency`
        Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
      - `displayName`
        A user-facing description of the shipping option.
      - `deliveryEstimate`
        The estimated range for how long shipping will take.
        - `maximum`
          The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
        - `minimum`
          The lower bound of the estimated range. If empty, represents no lower bound.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
    - `taxAmounts`
      The amount of tax calculated per tax rate for shipping costs.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.

- `shippingAddress`
  Shipping address of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `shippingOptions`
  The list of shipping options that can be selected.
    - `id`
      Unique identifier for the object.
    - `amount`
      A formatted string representing the shipping amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `displayName`
      A user-facing description of the shipping option.
    - `deliveryEstimate`
      The estimated range for how long shipping will take.
      - `maximum`
        The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.
      - `minimum`
        The lower bound of the estimated range. If empty, represents no lower bound.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.

- `status`
  Status of the Checkout Session.
    - `type`
      One of `open`, `expired`, or `complete`.
* `open`: The Checkout Session is still in progress.
* `expired`: The Checkout Session has expired. No further processing will occur.
* `complete`: The Checkout Session is complete. Payment processing may still be in progress.
    - `paymentStatus`
      One of `paid`, `unpaid`, or `no_payment_required`. Only present when `type=complete`.
* `paid`: The payment funds are available in your account.
* `unpaid`: The payment funds are not yet available in your account.
* `no_payment_required`: The payment is delayed to a future date, or the Checkout Session is in setup mode and doesn't require a payment at this time.

- `tax`
  Details about the tax computation status.
    - `status`
      One of `ready`, `requires_shipping_address`, or `requires_billing_address`.
* `ready`: The final tax amount is computed, and the session is ready for confirmation.
* `requires_shipping_address`: A shipping address must be provided to calculate tax.
* `requires_billing_address`: A billing address must be provided to calculate tax.
    - `automaticTax`
      Details about the automatic tax settings of the Checkout Session.
      - `enabled`
        Whether automatic tax is enabled on the Checkout Session. The
other fields in this hash are `null` when automatic tax is
disabled.
      - `exempt`
        One of `none`, `exempt`, or `reverse`. This value is `null` if
automatic tax is disabled, or if the Customer hasn't provided
enough address information to determine their tax exemption.
* `none`: The Customer isn't exempt from tax.
* `exempt`: The Customer is exempt from tax.
* `reverse`: The Customer is subject to the [reverse charge mechanism](https://docs.stripe.com/tax/zero-tax.md#reverse-charges), so tax is accounted for by the Customer.
      - `addressSource`
        One of `billing`, `shipping`, or `customer`, indicating which
address is used to calculate tax. This value is `null` if
automatic tax is disabled.
* `billing`: Tax is calculated from the billing address collected during this Checkout Session.
* `shipping`: Tax is calculated from the shipping address collected during this Checkout Session.
* `customer`: Tax is calculated from the address saved on the Customer.

- `taxAmounts`
  The aggregate amounts calculated per tax rate for all line
items. This value is `null` if tax has not yet been computed,
i.e. the Customer's address has not been collected yet.
    - `amount`
      A formatted string representing the tax amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `inclusive`
      Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
    - `displayName`
      A user-facing description of the tax.
    - `percentage`
      The tax rate percentage. This value is absent for flat-amount tax rates.

- `taxIdInfo`
  The Customer's tax ID collection information. This value is `null` if no tax ID information is available.
    - `businessName`
      The Customer's business name associated with tax ID collection.
    - `taxId`
      The Customer's tax ID.
      - `type`
        One of [the supported tax ID types](https://docs.stripe.com/tax/checkout/tax-ids?payment-ui=embedded-components.md#supported-types).
      - `value`
        The value of the tax ID.

- `total`
  Tax and discount details for the computed total amount. Use this
field to render an amount breakdown to your customer, such as in an
order summary.
    - `subtotal`
      The total amount of line items, excluding tax, discounts, and shipping.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      The sum of all [exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      The sum of all [inclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `shippingRate`
      The sum of all shipping amounts.
      - `amount`
        A formatted string representing the total shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      The sum of all the discounts. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total computed amount, including discounts, tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `appliedBalance`
      Total amount of [customer credit balance](https://docs.stripe.com/billing/customer/balance.md) to be applied to the payment. A positive number increases the amount to be paid, and a negative number decreases the amount to be paid.
      - `amount`
        A formatted string representing the applied customer balance amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the applied customer balance amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `balanceAppliedToNextInvoice`
      When true, no payment will be collected immediately. Instead, the amount due will be added to the Customer's next invoice. This can happen when the amount due today is less than the [minimum chargeable amount](https://docs.stripe.com/currencies.md#minimum-and-maximum-charge-amounts).

### Example

```title
Call useCheckout hook
```

## Apply a promotion code

`applyPromotionCode(promotionCode: string)`

Use this method to apply a promotion code that your customer enters.

- `promotionCode`
  The promotion code to apply to the Checkout Session.

### Example

```title
Apply a promotion code
```

## Remove a promotion code

`removePromotionCode()`

Use this method to remove the currently applied promotion code, if applicable.

### Example

```title
Remove a promotion code
```

## Update the Customer's shipping address

`updateShippingAddress(shippingAddress: nullable object)`

Use this method to update the Customer's shipping address. If your integration uses the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), the shipping address is collected directly from the wallet and the value set by `updateShippingAddress` is not used for express checkout payments.

- `shippingAddress`
  New shipping address for the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

### Example

```title
Update the Customer's shipping address
```

## Update the Customer's billing address

`updateBillingAddress(billingAddress: nullable object)`

Use this method to update the Customer's billing address. If your integration uses the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), the billing address is collected directly from the wallet and the value set by `updateBillingAddress` is not used for express checkout payments.

- `billingAddress`
  New billing information for the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

### Example

```title
Update the Customer's billing address
```

## Update the Customer's email address

`updateEmail(email: nullable string)`

Use this method to update the Customer's email address. If your integration uses [Link](https://docs.stripe.com/payments/link.md) and you do not provide an email during Checkout Session creation, you must call `updateEmail` for Link to appear as a payment option for returning users (Link is also known as Onelink in the UK). If your integration uses the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), the email address is collected directly from the wallet and the value set by `updateEmail` is not used for express checkout payments.

- `email`
  The Customer's email address.

### Example

```title
Update the Customer's email address
```

## Update the Customer's phone number

`updatePhoneNumber(phoneNumber: nullable string)`

Updates the customer's phone number. Requires `phone_number_collection.enabled` to be `true` on the Checkout Session.

If your integration uses the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), the phone number is collected directly from the wallet and the value set by `updatePhoneNumber` isn't used for express checkout payments.

- `phoneNumber`
  The Customer's phone number.

### Example

```title
Update the Customer's phone number
```

## Update the Customer's business name

`updateBusinessName(businessName: nullable string)`

Use this method to update the Customer's business name when `name_collection.business.enabled` is `true` on the Checkout Session. If the [Tax ID Element](https://docs.stripe.com/js/custom_checkout/create_tax_id_element.md) is mounted with the business name field shown, calling `confirm()` throws an `IntegrationError` because the Tax ID Element collects the business name directly. To use `updateBusinessName()` instead, set `fields.businessName: "never"` when creating the Tax ID Element.

- `businessName`
  The Customer's business name.

### Example

```title
Update the Customer's business name
```

## Update the Customer's individual name

`updateIndividualName(individualName: nullable string)`

Use this method to update the Customer's individual name when `name_collection.individual.enabled` is `true` on the Checkout Session.

- `individualName`
  The Customer's individual name.

### Example

```title
Update the Customer's individual name
```

## Update the Customer's business name and tax ID

`updateTaxIdInfo(taxIdInfo?: )`

Use this method to update the Customer's business name and tax ID.

- `taxIdInfo`
  The Customer's tax ID information including the business name and tax ID.
    - `businessName`
      The Customer's business name.
    - `taxId`
      The Customer's tax ID.
      - `type`
        One of [the supported tax ID types](https://docs.stripe.com/tax/checkout/tax-ids?payment-ui=embedded-components.md#supported-types)
      - `value`
        The value of the tax ID.

### Example

```title
Update the Customer's business name and tax ID
```

## Update line item quantities

`updateLineItemQuantity(options: object)`

Use this method to change the quantity of a line item.

- `options`
  Options for `updateLineItemQuantity`.
    - `lineItem`
      The [ID](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-lineItems-id) of the line item to update.
    - `quantity`
      The new quantity of the line item.

### Example

```title
Update line item quantities
```

## Update the selected shipping option

`updateShippingOption(shippingOption?: string)`

Use this method to update the selected shipping option. See [shippingOptions](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-shippingOptions) for a list of the available shipping options.

- `shippingOption`
  The [ID](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-shippingOptions-id) of the shipping option to select.

### Example

```title
Update the selected shipping option
```

## Confirm the Checkout Session

`confirm(options?: object)`

Use this method to confirm the Checkout Session.

You must either read [total.total.amount](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-total-total-amount) or each of [total.total.minorUnitsAmount](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-total-total-minorUnitsAmount) and [currency](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-currency) and [minorUnitsAmountDivisor](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-minorUnitsAmountDivisor) from the checkout object and display in your UI, otherwise an error will be thrown. This helps keep your checkout page in sync as the Checkout Session updates, including adding future Stripe features, with minimal UI code changes.

- `options`
  Options for `confirm`.
    - `returnUrl`
      The URL to redirect your customer to after they authenticate or cancel their payment on the payment method’s app or site. This parameter is only required if you didn't specify the  `return_url` when creating the Checkout Session.
    - `paymentMethod`
      The ID of a previously collected [PaymentMethod](https://docs.stripe.com/api/payment_methods/object.md) to use for confirmation.

When this option is provided, Custom Checkout will ignore the payment method collected by the PaymentElement and attempt confirmation using the provided PaymentMethod.
    - `savePaymentMethod`
      Whether your Customer has provided consent to save the payment method for future purchases.

Learn how to [save payment methods](https://docs.stripe.com/checkout/custom-checkout/save-payment-methods-checkout.md).
    - `redirect`
      By default, `confirm` will always redirect to your `returnUrl` after a successful confirmation.  If you set `redirect: "if_required"`, then `confirm` will only redirect if your user chooses a redirect-based payment method.
    - `email`
      The Customer's email address.

If provided, this value overrides any values previously set using [updateEmail](https://docs.stripe.com/js/custom_checkout/update_email.md).
    - `phoneNumber`
      The Customer's phone number.

Requires `phone_number_collection.enabled` to be `true` on the Checkout Session.

If provided, this value overrides any values previously set using [updatePhoneNumber](https://docs.stripe.com/js/custom_checkout/update_phone_number.md).
    - `billingAddress`
      The Customer's billing address.

If provided, this value overrides any values previously set using [updateBillingAddress](https://docs.stripe.com/js/custom_checkout/update_billing_address.md).
      - `name`
        Full name.
      - `address`
        Address.
        - `country`
          Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
        - `line1`
          Address line 1 (e.g., street, PO Box, or company name).
        - `line2`
          Address line 2 (e.g., apartment, suite, unit, or building).
        - `city`
          City, district, suburb, town, or village.
        - `postal_code`
          ZIP or postal code.
        - `state`
          State, county, province, or region.
    - `shippingAddress`
      The Customer's shipping address.

If provided, this value overrides any values previously set using [updateShippingAddress](https://docs.stripe.com/js/custom_checkout/update_shipping_address.md).
      - `name`
        Full name.
      - `address`
        Address.
        - `country`
          Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
        - `line1`
          Address line 1 (e.g., street, PO Box, or company name).
        - `line2`
          Address line 2 (e.g., apartment, suite, unit, or building).
        - `city`
          City, district, suburb, town, or village.
        - `postal_code`
          ZIP or postal code.
        - `state`
          State, county, province, or region.
    - `expressCheckoutConfirmEvent`
      The [event object](https://docs.stripe.com/js/elements_object/express_checkout_element_confirm_event.md#express_checkout_element_on_confirm-handler) passed to your Express Checkout Element `confirm` handler.
    - `formConfirmEvent`
      The [event object](https://docs.stripe.com/js/custom_checkout/element_events/on_confirm.md?type=checkoutForm) passed to your Embedded form `confirm` handler.

### Example

```title
Confirm the Checkout Session
```

## Validate Elements

`validateElements()`

Use this method to validate all mounted Elements without confirming the Checkout Session. This is useful for multi-step checkout flows where you want to validate user input before advancing to the next step.

This method doesn't verify that the Checkout Session can be confirmed.
To check whether all required fields are present, use the
[Session's `canConfirm` field](https://docs.stripe.com/js/custom_checkout/session_object.md#custom_checkout_session_object-canConfirm).

### Example

```title
Validate Elements
```

## Run server update

`runServerUpdate(userFunction: function)`

Use this method to wrap an async function that makes a request to your server to update the Checkout Session.

> `runServerUpdate` enforces a 20-second timeout for your update function. If your function doesn't resolve within 20 seconds, `runServerUpdate` returns an error. Wrap `runServerUpdate` calls in `try`/`catch` blocks to handle any errors.

- `userFunction`
  An async function to make a request to your server to update the Checkout Session.

### Example

```title
Run server update
```

## PaymentElement

Use the `PaymentElement` from `@stripe/react-stripe-js/checkout`
to collect payment details for more than [40 payment methods](https://docs.stripe.com/docs/payments/payment-methods/integration-options.md) from around the globe.

The component must be rendered inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Payment Element initialization options.
    - `fields`
      By default, the Payment Element collects only the necessary billing details to complete a payment.

To collect billing details outside of the Payment Element, use the `fields` option to disable Payment Element collection of certain fields.

If you set a field to `never`, you're responsible for providing it with the corresponding Checkout update method or when calling [confirm](https://docs.stripe.com/js/custom_checkout/confirm.md) if it's required for any payment methods.

You can set `billingDetails` at the top level to apply the same field collection settings to all payment methods,
or set `billingDetails` under a supported payment method type to override the top-level setting for that payment method.
      - `billingDetails`
        Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
        - `name`
          Specify `always` to require the Payment Element to collect the customer's billing name.
        - `email`
          Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
        - `phone`
          Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
        - `address`
          Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
          - `line1`
          - `line2`
          - `city`
            The name of a city, town, village, etc.
          - `state`
            The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
          - `country`
            Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
          - `postalCode`
            The postal code or ZIP code, also known as PIN code in India.
      - `[paymentMethodType]`
        Optionally specify the billing detail collection settings for any Payment Element payment method type. Examples of valid values are `card`, `klarna`, or `us_bank_account`. You can include one or more payment method type keys.
        - `billingDetails`
          Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
          - `name`
            Specify `always` to require the Payment Element to collect the customer's billing name.
          - `email`
            Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
          - `phone`
            Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
          - `address`
            Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
            - `line1`
            - `line2`
            - `city`
              The name of a city, town, village, etc.
            - `state`
              The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
            - `country`
              Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
            - `postalCode`
              The postal code or ZIP code, also known as PIN code in India.
    - `layout`
      Specify the layout for the Payment Element: `'auto'`, `'accordion'`, or `'tabs'`. With `'auto'`, Stripe selects the layout automatically. If you only pass a layout type without any additional parameters, the Payment Element renders using that layout and the default values associated with it.

An object can also be passed to specify the layout with additional configuration.
      - `type`
        Defines the layout to render the Payment Element.
      - `defaultCollapsed`
        Controls if the Payment Element renders in a collapsed state (where no payment method is selected by default). When you leave this `undefined`, Stripe renders the experience that it determines will have the best conversion.
      - `radios`
        Controls when to render each Payment Method with a radio input next to its logo. The radios visually indicate the current selection of the Payment Element. Defaults to `'auto'`.

- `'always'` — Always show radio inputs.
- `'never'` — Never show radio inputs.
- `'if_multiple'` — Show radio inputs only when there are multiple payment methods available. When there is only one payment method, no radio input is displayed.
- `'auto'` — Stripe determines the best experience to optimize conversion.

_This property is only applicable to the `accordion` layout._
      - `spacedAccordionItems`
        When `true`, the Payment Methods render as standalone buttons with space in between them.

_This property is only applicable to the `accordion` layout._
      - `visibleAccordionItemsCount`
        Sets the max number of Payment Methods visible before using the "More" button to hide additional Payment Methods. Set this value to `0` to disable the "More" button and render all available Payment Methods. Default is `5`.

_This property is only applicable to the `accordion` layout._
      - `paymentMethodLogoPosition`
        Sets the position of the payment method logo in each accordion item. Default is `start`.

_This property is only applicable to the `accordion` layout._
    - `paymentMethodOrder`
      By default, the Payment Element will use a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods are displayed in the Payment Element with a list of payment method types.

If the associated Checkout Session has payment method types not specified in `paymentMethodOrder`, they will be displayed
after the payment methods you specify. If you specify payment method types not on the associated PaymentIntent, they will be ignored.
    - `readOnly`
      Applies a read-only state to the Payment Element so that payment details can’t be changed. Default is false.

Enabling the `readOnly` option doesn't change the Payment Element's visual appearance. If you want to adjust the way the Payment Element looks, use the [Appearance API](https://docs.stripe.com/elements/appearance-api.md).
    - `terms`
      Control how mandates or other legal agreements are displayed in the Payment Element.
Use `never` to never display legal agreements. The default setting is `auto`, which causes
legal agreements to only be shown when necessary.

Consult your legal and compliance advisors before making any changes to the text of mandates or legal agreements. You can't use the `terms` option to violate obligations under your Stripe agreement, Stripe policies, applicable laws or scheme rules.
      - `applePay`
      - `auBecsDebit`
      - `bancontact`
      - `card`
      - `cashapp`
      - `googlePay`
      - `ideal`
      - `paypal`
      - `sepaDebit`
      - `sofort`
      - `usBankAccount`
    - `wallets`
      By default, the Payment Element will display all the payment
methods that the underlying Checkout Session was created with.

However, wallets like Apple Pay and Google Pay are not payment
methods per the Checkout Session API. They will show when the
Checkout Session has the `card` payment method and the customer is
using a supported platform and have an active card in their
account.  This is the `auto` behavior, and it is the default for
choice for all wallets.

If you do not want to show a given wallet as a payment option, you
can set its property in `wallets` to `never`.
      - `applePay`
      - `googlePay`
      - `link`
    - `walletOptions`
      Options to control the information collected from the customer when
paying with a wallet payment method.
      - `emailRequired`
        Collect the customer's email from wallet payment methods by setting this option to true.
      - `phoneNumberRequired`
        Collect the customer's phone number from wallet payment methods by setting this option to true.

PayPal doesn't provide a phone number, even when this option is set to true.

Google Pay makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.

Link makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change?type=paymentElement.md#element_on_change-handler) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render PaymentElement
```

## ExpressCheckoutElement

Use the `ExpressCheckoutElement` from `@stripe/react-stripe-js/checkout` to accept payments through one-click payment buttons.

The component must be rendered inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Express Checkout Element initialization options.
    - `buttonHeight`
      By default, the height of the buttons are 44px.

You can override this to specify a custom button height in the range of 40px-55px.
    - `buttonTheme`
      Specify the preferred button theme to use. By default, Elements determines the themes based on the specified [appearance option](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-appearance).
      - `applePay`
      - `googlePay`
      - `paypal`
      - `klarna`
    - `buttonType`
      Specify the preferred button type to display.
      - `applePay`
        Default is `plain`.
      - `googlePay`
        Default is `buy`.
      - `paypal`
        Default is `paypal`.
      - `klarna`
        Default is `pay`.
    - `layout`
      Specify how the buttons are arranged in a grid-like layout in the Express Checkout Element.
Elements determines the layout by using certain factors, such as available space, number of buttons, and the defined `layout` object.
      - `maxColumns`
        Defines the maximum number of columns the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `maxRows`
        Defines the maximum number of rows the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `overflow`
        Specify whether or not to always hide the overflow menu or allow Elements to determine when to show the overflow menu. Default is `auto`.
You can't specify both `overflow: 'never'` and set `maxRows` to a number greater than 0.
    - `paymentMethodOrder`
      By default, the Express Checkout Element uses a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods display in the Express Checkout Element with a list of payment method types.

If there are payment methods that will show that are not specified in `paymentMethodOrder`, they display after the payment methods you specify. If you specify payment methods that will not show, they are ignored.
    - `paymentMethods`
      In addition to your Dashboard configuration, the CheckoutSession configuration also influences the availability of payment methods in the Express Checkout Element. By default, it displays all available payment methods based on both configurations. When setting the paymentMethods option, the Express Checkout Element merges your specified options with the default logic to determine the final set of payment methods displayed.
      - `amazonPay`
      - `applePay`
        Apple Pay has additional configurations
that determine when Stripe can show it. By default, Apple Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.

If you want to always show Apple Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`.

Apple Pay on non-Safari desktop browsers is only supported when its property in `paymentMethods` is set to `always`.
      - `googlePay`
        Google Pay has additional configurations
that determine when Stripe can show it. By default, Google Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.
If you want to always show Google Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`.
      - `klarna`
      - `link`
      - `paypal`

- `onConfirm`
  Triggered when the Element fires a confirm event. Use this to handle payment confirmation.

- `onCancel`
  The `cancel` event is triggered when the payment interface is dismissed (e.g. the customer closes it).

Note that in some browsers, the payment interface might be dismissed by the customer even after they authorize the payment.
This means that you might receive a `cancel` event after receiving a `confirm` event.
If you're using the `cancel` event as a hook for canceling the customer's order, make sure you also refund the payment that you just created.

The following Checkout Elements support the `cancel` event:
`expressCheckoutElement` and `checkoutForm`.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render ExpressCheckoutElement
```

## ContactDetailsElement

Use the `ContactDetailsElement` from `@stripe/react-stripe-js/checkout`
to collect your customer's email address and help them sign in to Link.

The component must be rendered inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change?type=paymentElement.md#element_on_change-handler) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render ContactDetailsElement
```

## BillingAddressElement

Use the `BillingAddressElement` from `@stripe/react-stripe-js/checkout` to render and update the
billing address on the current [Checkout Session](https://docs.stripe.com/api/checkout/sessions/object.md).

The component must be rendered inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Billing Address Element initialization options.
    - `contacts`
      An array of objects that can be displayed as saved addresses in the Billing Address Element. The first contact is automatically selected.
      - `name`
        The name of the contact. This might be a person, or a business name.
      - `address`
        The address of the contact.
        - `line1`
        - `line2`
        - `city`
          The name of a city, town, village, etc.
        - `state`
          The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
        - `postal_code`
          The postal code or ZIP code, also known as PIN code in India.
        - `country`
          Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
      - `phone`
        The phone number of the contact.
    - `display`
      You can customize how certain fields are displayed.
      - `name`
        By default, the Billing Address Element displays a full name field.
Specify 'split' to display a first name field and a last name field.
Specify 'organization' to display an organization field.
    - `autocomplete`
      By default, the Address Element will have autocomplete enabled with Stripe provided Google Maps API key for certain countries if any of the following condition is met:
* If Payment Element is mounted in the same elements group as Address Element in a single page application.
* If the Address Element is used in an active Link session (Link is also known as Onelink in the UK).

[Contact Legal before editing or deleting the Google Maps autocomplete callout]: #

By using autocomplete, you agree to comply with the [Google Maps Platform Acceptable Use Policy](https://cloud.google.com/maps-platform/terms/aup). If you violate this policy, we might disable autocomplete, or take any other action as necessary.

You can customize the autocomplete setting with this option.
      - `mode`
        Specify `disabled` to disable autocomplete in the Address Element.

Specify `google_maps_api` to enable [Google Maps API](https://developers.google.com/maps/documentation/javascript/places) with your own key. It will only be used when Stripe provided Google Maps API key is not available.

The default setting is `automatic`, where we'll support autocomplete when possible.
      - `apiKey`
        Specify your own [Google Maps API key](https://developers.google.com/maps/documentation/javascript/places#add-places-api-to-the-api-keys-api-restrictions-list) with it.

**Only needs to be passed in when `autocomplete.mode` is set to `google_maps_api`.**

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change?type=addressElement.md#element_on_change-handler) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render BillingAddressElement
```

## ShippingAddressElement

Use the `ShippingAddressElement` from `@stripe/react-stripe-js/checkout` to render and update the
shipping address on the current [Checkout Session](https://docs.stripe.com/api/checkout/sessions/object.md).

The component must be rendered inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Shipping Address Element initialization options.
    - `contacts`
      An array of objects that can be displayed as saved addresses in the Shipping Address Element. The first contact is automatically selected.
      - `name`
        The name of the contact. This might be a person, or a business name.
      - `address`
        The address of the contact.
        - `line1`
        - `line2`
        - `city`
          The name of a city, town, village, etc.
        - `state`
          The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
        - `postal_code`
          The postal code or ZIP code, also known as PIN code in India.
        - `country`
          Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
      - `phone`
        The phone number of the contact.
    - `display`
      You can customize how certain fields are displayed.
      - `name`
        By default, the Shipping Address Element displays a full name field.
Specify 'split' to display a first name field and a last name field.
Specify 'organization' to display an organization field.
    - `autocomplete`
      By default, the Address Element will have autocomplete enabled with Stripe provided Google Maps API key for certain countries if any of the following condition is met:
* If Payment Element is mounted in the same elements group as Address Element in a single page application.
* If the Address Element is used in an active Link session (Link is also known as Onelink in the UK).

[Contact Legal before editing or deleting the Google Maps autocomplete callout]: #

By using autocomplete, you agree to comply with the [Google Maps Platform Acceptable Use Policy](https://cloud.google.com/maps-platform/terms/aup). If you violate this policy, we might disable autocomplete, or take any other action as necessary.

You can customize the autocomplete setting with this option.
      - `mode`
        Specify `disabled` to disable autocomplete in the Address Element.

Specify `google_maps_api` to enable [Google Maps API](https://developers.google.com/maps/documentation/javascript/places) with your own key. It will only be used when Stripe provided Google Maps API key is not available.

The default setting is `automatic`, where we'll support autocomplete when possible.
      - `apiKey`
        Specify your own [Google Maps API key](https://developers.google.com/maps/documentation/javascript/places#add-places-api-to-the-api-keys-api-restrictions-list) with it.

**Only needs to be passed in when `autocomplete.mode` is set to `google_maps_api`.**

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change?type=addressElement.md#element_on_change-handler) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render ShippingAddressElement
```

## CurrencySelectorElement

Use the `CurrencySelectorElement` from `@stripe/react-stripe-js/checkout` to allow customers to select
the currency for their payment.

The component must be rendered inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render CurrencySelectorElement
```

## TaxIdElement

Use the `TaxIdElement` from `@stripe/react-stripe-js/checkout` to collect tax ID information
from your customers, including business name and tax identification number.

The component must be rendered inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Tax ID Element initialization options.
    - `visibility`
      By default, the Tax ID Element displays when the user is in a country that supports tax ID collection.
Specify `always` to display the element regardless of the user's country.
Specify `never` to hide the element completely.

When `name_collection.business.enabled` is `true` on the Checkout Session and `visibility` is `auto`, the element displays regardless of the user's country. In countries that do not support tax ID collection, only the business name field shows.
    - `fields`
      By default, the Tax ID Element collects all tax ID information.

If it's not necessary for you to collect all fields, you can disable Tax ID Element collection of certain fields with the `fields` option.
      - `businessName`
        Specify `always` to collect the business name.
Specify `never` to not collect the business name.
Default is `auto`.

When `name_collection.business.enabled` is `true` on the Checkout Session, setting this to `never` signals that you are collecting the business name through your own input via `updateBusinessName()` instead.
    - `validation`
      By default, the Tax ID Element will enforce preset validation for each field. You can customize the settings by using this option.
      - `businessName`
        - `required`
          Specify `always` to make business name a required field.
Specify `never` to make business name an optional field.
Default is `auto`.

When `name_collection.business.enabled` is `true` on the Checkout Session and `name_collection.business.optional` is `false`, the SDK overrides this to `always` regardless of what you set here.
      - `taxId`
        - `required`
          Specify `always` to make tax ID a required field.
Specify `never` to make tax ID an optional field.
Default is `auto`.
    - `verification`
      Configure real-time tax ID verification.
Requires a [Tax Complete subscription or Tax Custom pricing](https://stripe.com/tax/pricing).
If your account isn't eligible, the Tax ID Element emits a [loaderror](https://docs.stripe.com/js/custom_checkout/element_events/on_loaderror.md) event.
      - `taxId`
        - `mode`
          Specify `if_supported` to enable real-time tax ID verification for supported tax ID types.
Specify `never` to disable verification.
Default is `never`.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change?type=taxIdElement.md#element_on_change-handler) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render TaxIdElement
```

## Using the Embedded form provider

Build your Stripe integration using React and the [embedded form](https://docs.stripe.com/payments/checkout/how-checkout-works.md?payment-ui=checkout-form), a single unified form that bundles payment, address, and other elements.

See [build an integration with an embedded form](https://docs.stripe.com/checkout/form/quickstart.md) for steps on using the embedded form with the Checkout Sessions API.

The following React components and hooks are available to use as part of your integration.

## CheckoutFormProvider

The `CheckoutFormProvider` component wraps your React tree for the [embedded form integration](https://docs.stripe.com/elements/embeddable-payment-form.md).
It initializes the Embedded form SDK and provides it in a context so nested components can render the `CheckoutForm` component and access session data.

To use `CheckoutFormProvider`, call `loadStripe` from `@stripe/stripe-js` with your publishable key. The `loadStripe` function asynchronously loads the Stripe.js script and initializes a Stripe object. Pass the returned `Promise` to `CheckoutFormProvider` along with the [client secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) of your Checkout Session.

### Props

- `stripe`
  A [Stripe object](https://docs.stripe.com/js/initializing.md) or a `Promise` resolving to a Stripe object. The easiest way to initialize a Stripe object is with the [Stripe.js wrapper module](https://github.com/stripe/stripe-js/blob/master/README.md#readme). After this prop has been set, it can not be changed.

- `options`
  Options for `CheckoutFormProvider`.
    - `clientSecret`
      The Checkout Session [client secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) or a promise that resolves to the client secret.
    - `appearance`
      Match the design of your site with the [appearance option](https://docs.stripe.com/payments/checkout/customization/appearance.md?ui=checkout-form).
The layout stays consistent, but you can modify colors, fonts, borders, padding, and more.
Note: the embedded form doesn't support `rules`.
    - `loader`
      Display skeleton loader UI while waiting for the embedded form to fully load after it's mounted.
Default is `'auto'` (Stripe determines whether or not to show a loader UI).
    - `fonts`
      An array of custom fonts that the embedded form can use. You can specify fonts as [CssFontSource](#css_font_source_object) or [CustomFontSource](#custom_font_source_object) objects.
    - `savedPaymentMethod`
      Options to configure what the embedded form displays when used to [save payment details during payment](https://docs.stripe.com/payments/checkout/save-during-payment.md).
      - `enableRedisplay`
        Toggle if the embedded form redisplays Customer saved Payment Methods. Default is `'auto'`.
      - `enableSave`
        Toggle if the embedded form collects consent to save a customer's payment methods. Default is `'auto'`.

### Example

```title
Mount CheckoutFormProvider
```

## useCheckoutForm

The `useCheckoutForm` hook returns a disjoint union describing the loading state:

* `{type: "loading"}`
* `{type: "error", error: { message: string }}`
* `{type: "success", checkout: object }`.

Upon success, it returns a [Session object](https://docs.stripe.com/js/custom_checkout/session_object.md) as well as actions to update the Checkout Session.

Use `useCheckoutForm` inside a [CheckoutFormProvider](https://docs.stripe.com/js/react_stripe_js/checkout_form/checkout_form_provider.md). For [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md) integrations, use [useCheckoutElements](https://docs.stripe.com/js/react_stripe_js/checkout/use_checkout_elements.md) instead.

### Object properties

- `id`
  The ID of the Checkout Session.

- `billingAddress`
  Billing details of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `businessName`
  The business name as configured in the Business Public Details settings of your Stripe account.

- `canConfirm`
  Whether the Checkout Session is ready to confirm. This value is `false` while data that Checkout or mounted Elements must collect is missing or invalid. In Stripe.js `endive` or later, it's also `false` when a confirmation is in progress, or an asynchronous update is pending. Use this field to indicate to your customer if they can proceed, such as disabling the pay button.

- `currency`
  Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in
lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).

- `currencyOptions`
  The currency options available on the Checkout Session when using [Adaptive Pricing](https://docs.stripe.com/checkout/custom-checkout/adaptive-pricing.md).
    - `amount`
      A formatted string representing the total amount in the source currency, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the total amount in the source currency in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `currencyConversion`
      Currency conversion details. This is only present for the customer currency.
      - `fxRate`
        The exchange rate used to convert source currency amounts to customer currency amounts.
      - `sourceCurrency`
        The creation currency of the Checkout Session before localization.

- `discountAmounts`
  The aggregate amounts calculated per discount for all line items.
    - `amount`
      A formatted string representing the discount amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `displayName`
      A user-facing description of the discount.
    - `promotionCode`
      The customer-facing promotion code that was used to apply this discount, if any.
    - `recurring`
      Details of how the discount applies to recurring payments.
      - `type`
        One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
      - `durationInMonths`
        If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
    - `percentOff`
      An integer representing the discount amount as a percentage.
    - `amountOff`
      The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.

- `email`
  The Customer's email address.

- `lastPaymentError`
  The error encountered the last time the Checkout Session was confirmed.
    - `message`
      An error message to be displayed to the customer.

- `lineItems`
  A list of items the customer is purchasing.
    - `id`
      Unique identifier for the object.
    - `priceId`
      The ID of the Price or Plan backing the line item.
    - `subtotal`
      Total before any discounts or exclusive taxes are applied.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      Total discount amount. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      Total amount of exclusive tax (tax that is collected in addition to the subtotal).
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      Total amount of inclusive tax (tax that is already included in the subtotal).
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total amount for this line item, including discounts and tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmount`
      The amount representing the cost of a single unit of the item.
      - `amount`
        A formatted string representing the unit amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmountDecimal`
      The unit amount of the line item in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), with sub-cent precision. Use this field instead of `unitAmount` when dealing with sub-cent pricing (for example, usage-based billing). For sub-cent prices, `unitAmount.minorUnitsAmount` rounds to `0`, so `unitAmountDecimal` preserves the exact decimal value (for example, `0.005` for a price of 0.00005 USD).
      - `amount`
        A formatted string representing the unit amount with sub-cent precision, including currency symbols.
      - `minorUnitsAmount`
        A number representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) with sub-cent precision (for example, `0.5` for half a cent). Unlike `unitAmount.minorUnitsAmount`, this value can be a decimal.
    - `unitLabel`
      A label that represents the unit of this line item. Specify `unitLabel` in
[productData.unit_label](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-unit_label)
when creating the Checkout Session or when creating the Product's
[unit_label](https://docs.stripe.com/api/products/object.md#product_object-unit_label) field.
    - `description`
      An arbitrary string attached to the object. Often useful for displaying to users.
    - `name`
      The item's name, meant to be displayable to users.
    - `images`
      An array of image URLs for the line item. Specify [images](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-images) on the Product when creating the Checkout Session.
    - `quantity`
      The quantity of products being purchased.
    - `isRemovable`
      Whether the customer can remove the line item.
    - `discountAmounts`
      The amount of discount calculated per discount for this line item.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `displayName`
        A user-facing description of the discount.
      - `promotionCode`
        The customer-facing promotion code that was used to apply this discount, if any.
      - `recurring`
        Details of how the discount applies to recurring payments.
        - `type`
          One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
        - `durationInMonths`
          If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
      - `percentOff`
        An integer representing the discount amount as a percentage.
      - `amountOff`
        The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.
    - `taxAmounts`
      The amount of tax calculated per tax rate for this line item.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.
    - `recurring`
      The recurring components of a price such as `interval` and `intervalCount`.
      - `interval`
        Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
      - `intervalCount`
        The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills
every 3 months.
      - `usageType`
        One of `licensed` or `metered`. `licensed` automatically
bills the quantity set when adding it to a subscription.
`metered` aggregates the total usage based on usage records.
    - `adjustableQuantity`
      Configuration for this item's quantity to be adjusted by the
customer during checkout.
      - `maximum`
        The maximum quantity the customer can purchase for the Checkout Session.
      - `minimum`
        The minimum quantity the customer can purchase for the Checkout Session.

- `livemode`
  Has the value `true` if the object exists in live mode or the value `false` if the object exists in a sandbox.

- `minorUnitsAmountDivisor`
  The factor used to convert between minor and major currency units.

This value represents the number of minor currency units per one major unit. For example, in USD, where cents are the minor unit, the divisor is 100.  In JPY, which has no minor units, the divisor is 1.

- `nameCollection`
  Names collected from the customer. This value is `null` if [name_collection](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-name_collection) is not configured on the Checkout Session.
    - `individualName`
      The customer's individual name.
    - `businessName`
      The customer's business name.

- `phoneNumber`
  The Customer's phone number.

- `recurring`
  Details about recurring payments set up by the Checkout Session.
    - `interval`
      Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
    - `intervalCount`
      The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills every 3
months.
    - `dueNext`
      Details about the next scheduled recurring payment.
      - `subtotal`
        Total before any discounts or exclusive taxes are applied.
        - `amount`
          A formatted string representing the subtotal amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `discount`
        Total discount amount. A positive number reduces the amount to be paid.
        - `amount`
          A formatted string representing the discount amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxExclusive`
        Total amount of exclusive tax (tax that is collected in addition to the subtotal).
        - `amount`
          A formatted string representing the exclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxInclusive`
        Total amount of inclusive tax (tax that is already included in the subtotal).
        - `amount`
          A formatted string representing the inclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `total`
        Total computed amount, including discounts and tax.
        - `amount`
          A formatted string representing the total amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `billingCycleAnchor`
        A future Unix timestamp to anchor the subscription's billing
cycle. The anchor is the reference point that aligns future
billing cycle dates. If not present, the subscription starts immediately.
    - `trial`
      Details about a free trial, if there is one.
      - `trialEnd`
        Unix timestamp representing the end of the trial period the
customer will get before being charged for the first time.
      - `trialPeriodDays`
        Integer representing the number of trial period days before the customer is charged for the first time.
    - `isProrated`
      When true, the amount to be collected today is a prorated
amount for a partial billing period, such as when using
[billing_cycle_anchor](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-subscription_data-billing_cycle_anchor).

- `savedPaymentMethods`
  An array of payment methods attached to the Customer.
    - `id`
      ID of the PaymentMethod object
    - `type`
      The [type](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-type) of the PaymentMethod
    - `billingDetails`
      Billing information associated with the PaymentMethod that may be used or required by particular types of payment methods.
      - `email`
        Email address.
      - `phone`
        Billing phone number (including extension).
      - `name`
        Full name.
      - `address`
        Address.
        - `country`
          Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
        - `line1`
          Address line 1 (e.g., street, PO Box, or company name).
        - `line2`
          Address line 2 (e.g., apartment, suite, unit, or building).
        - `city`
          City, district, suburb, town, or village.
        - `postal_code`
          ZIP or postal code.
        - `state`
          State, county, province, or region.
    - `card`
      If this is a `card` PaymentMethod, this hash contains the user's card details.
      - `brand`
        The brand to use when displaying the card, this accounts for customer's brand choice on dual-branded cards.
Can be american_express, cartes_bancaires, diners_club, discover, eftpos_australia, interac, jcb, mastercard, union_pay, visa,
or other and may contain more values in the future.
      - `expMonth`
        Two-digit number representing the card's expiration month.
      - `expYear`
        Four-digit number representing the card's expiration year.
      - `last4`
        The last four digits of the card.
    - `usBankAccount`
      US bank account details. Present only when `type` is `us_bank_account`; otherwise, this field is omitted.
      - `accountHolderType`
        The type of account holder. One of `individual` or `company`.
      - `accountType`
        The type of bank account. One of `checking` or `savings`.
      - `bankName`
        The name of the bank.
      - `last4`
        The last four digits of the bank account number.
    - `sepaDebit`
      SEPA Direct Debit details. Present only when `type` is `sepa_debit`; otherwise, this field is omitted.
      - `bankCode`
        The bank code of the bank account.
      - `branchCode`
        The branch code of the bank account.
      - `country`
        The two-letter country code of the bank account ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `last4`
        The last four digits of the bank account number.
    - `bacsDebit`
      Bacs Direct Debit details. Present only when `type` is `bacs_debit`; otherwise, this field is omitted.
      - `last4`
        The last four digits of the bank account number.
      - `sortCode`
        The sort code of the bank account.
    - `auBecsDebit`
      BECS Direct Debit details. Present only when `type` is `au_becs_debit`; otherwise, this field is omitted.
      - `bsbNumber`
        The Bank State Branch (BSB) number of the bank account.
      - `last4`
        The last four digits of the bank account number.
    - `nzBankAccount`
      New Zealand bank account details. Present only when `type` is `nz_bank_account`; otherwise, this field is omitted.
      - `accountHolderName`
        The name of the account holder.
      - `bankCode`
        The bank code of the bank account.
      - `bankName`
        The name of the bank.
      - `branchCode`
        The branch code of the bank account.
      - `last4`
        The last four digits of the bank account number.
      - `suffix`
        The suffix of the bank account number.
    - `cardArt`
      Card art details. Present only when `type` is `card` and card art is available; otherwise, this field is omitted.
      - `cardArtUrl`
        The URL of the card art image.
      - `programName`
        The name of the card program associated with the card art.

- `shipping`
  The selected shipping option, if any.
    - `shippingOption`
      Details of the selected shipping option.
      - `id`
        Unique identifier for the object.
      - `amount`
        A formatted string representing the shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `currency`
        Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
      - `displayName`
        A user-facing description of the shipping option.
      - `deliveryEstimate`
        The estimated range for how long shipping will take.
        - `maximum`
          The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
        - `minimum`
          The lower bound of the estimated range. If empty, represents no lower bound.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
    - `taxAmounts`
      The amount of tax calculated per tax rate for shipping costs.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.

- `shippingAddress`
  Shipping address of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `shippingOptions`
  The list of shipping options that can be selected.
    - `id`
      Unique identifier for the object.
    - `amount`
      A formatted string representing the shipping amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `displayName`
      A user-facing description of the shipping option.
    - `deliveryEstimate`
      The estimated range for how long shipping will take.
      - `maximum`
        The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.
      - `minimum`
        The lower bound of the estimated range. If empty, represents no lower bound.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.

- `status`
  Status of the Checkout Session.
    - `type`
      One of `open`, `expired`, or `complete`.
* `open`: The Checkout Session is still in progress.
* `expired`: The Checkout Session has expired. No further processing will occur.
* `complete`: The Checkout Session is complete. Payment processing may still be in progress.
    - `paymentStatus`
      One of `paid`, `unpaid`, or `no_payment_required`. Only present when `type=complete`.
* `paid`: The payment funds are available in your account.
* `unpaid`: The payment funds are not yet available in your account.
* `no_payment_required`: The payment is delayed to a future date, or the Checkout Session is in setup mode and doesn't require a payment at this time.

- `tax`
  Details about the tax computation status.
    - `status`
      One of `ready`, `requires_shipping_address`, or `requires_billing_address`.
* `ready`: The final tax amount is computed, and the session is ready for confirmation.
* `requires_shipping_address`: A shipping address must be provided to calculate tax.
* `requires_billing_address`: A billing address must be provided to calculate tax.
    - `automaticTax`
      Details about the automatic tax settings of the Checkout Session.
      - `enabled`
        Whether automatic tax is enabled on the Checkout Session. The
other fields in this hash are `null` when automatic tax is
disabled.
      - `exempt`
        One of `none`, `exempt`, or `reverse`. This value is `null` if
automatic tax is disabled, or if the Customer hasn't provided
enough address information to determine their tax exemption.
* `none`: The Customer isn't exempt from tax.
* `exempt`: The Customer is exempt from tax.
* `reverse`: The Customer is subject to the [reverse charge mechanism](https://docs.stripe.com/tax/zero-tax.md#reverse-charges), so tax is accounted for by the Customer.
      - `addressSource`
        One of `billing`, `shipping`, or `customer`, indicating which
address is used to calculate tax. This value is `null` if
automatic tax is disabled.
* `billing`: Tax is calculated from the billing address collected during this Checkout Session.
* `shipping`: Tax is calculated from the shipping address collected during this Checkout Session.
* `customer`: Tax is calculated from the address saved on the Customer.

- `taxAmounts`
  The aggregate amounts calculated per tax rate for all line
items. This value is `null` if tax has not yet been computed,
i.e. the Customer's address has not been collected yet.
    - `amount`
      A formatted string representing the tax amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `inclusive`
      Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
    - `displayName`
      A user-facing description of the tax.
    - `percentage`
      The tax rate percentage. This value is absent for flat-amount tax rates.

- `taxIdInfo`
  The Customer's tax ID collection information. This value is `null` if no tax ID information is available.
    - `businessName`
      The Customer's business name associated with tax ID collection.
    - `taxId`
      The Customer's tax ID.
      - `type`
        One of [the supported tax ID types](https://docs.stripe.com/tax/checkout/tax-ids?payment-ui=embedded-components.md#supported-types).
      - `value`
        The value of the tax ID.

- `total`
  Tax and discount details for the computed total amount. Use this
field to render an amount breakdown to your customer, such as in an
order summary.
    - `subtotal`
      The total amount of line items, excluding tax, discounts, and shipping.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      The sum of all [exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      The sum of all [inclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `shippingRate`
      The sum of all shipping amounts.
      - `amount`
        A formatted string representing the total shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      The sum of all the discounts. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total computed amount, including discounts, tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `appliedBalance`
      Total amount of [customer credit balance](https://docs.stripe.com/billing/customer/balance.md) to be applied to the payment. A positive number increases the amount to be paid, and a negative number decreases the amount to be paid.
      - `amount`
        A formatted string representing the applied customer balance amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the applied customer balance amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `balanceAppliedToNextInvoice`
      When true, no payment will be collected immediately. Instead, the amount due will be added to the Customer's next invoice. This can happen when the amount due today is less than the [minimum chargeable amount](https://docs.stripe.com/currencies.md#minimum-and-maximum-charge-amounts).

### Example

```title
Call useCheckoutForm hook
```

## useCheckout

*`useCheckout` is deprecated. Use [useCheckoutElements](https://docs.stripe.com/js/react_stripe_js/checkout/use_checkout_elements.md) inside a [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider.md), or [useCheckoutForm](https://docs.stripe.com/js/react_stripe_js/checkout_form/use_checkout_form.md) inside a [CheckoutFormProvider](https://docs.stripe.com/js/react_stripe_js/checkout_form/checkout_form_provider.md). The new hooks provide compile-time type safety for the actions available under each provider.*

The `useCheckout` hook returns a disjoint union describing the loading state:

* `{type: "loading"}`
* `{type: "error", error: { message: string }}`
* `{type: "success", checkout: object }`.

Upon success, it returns a [Session object](https://docs.stripe.com/js/custom_checkout/session_object.md) as well as actions to update the Checkout Session.

### Object properties

- `id`
  The ID of the Checkout Session.

- `billingAddress`
  Billing details of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `businessName`
  The business name as configured in the Business Public Details settings of your Stripe account.

- `canConfirm`
  Whether the Checkout Session is ready to confirm. This value is `false` while data that Checkout or mounted Elements must collect is missing or invalid. In Stripe.js `endive` or later, it's also `false` when a confirmation is in progress, or an asynchronous update is pending. Use this field to indicate to your customer if they can proceed, such as disabling the pay button.

- `currency`
  Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in
lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).

- `currencyOptions`
  The currency options available on the Checkout Session when using [Adaptive Pricing](https://docs.stripe.com/checkout/custom-checkout/adaptive-pricing.md).
    - `amount`
      A formatted string representing the total amount in the source currency, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the total amount in the source currency in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `currencyConversion`
      Currency conversion details. This is only present for the customer currency.
      - `fxRate`
        The exchange rate used to convert source currency amounts to customer currency amounts.
      - `sourceCurrency`
        The creation currency of the Checkout Session before localization.

- `discountAmounts`
  The aggregate amounts calculated per discount for all line items.
    - `amount`
      A formatted string representing the discount amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `displayName`
      A user-facing description of the discount.
    - `promotionCode`
      The customer-facing promotion code that was used to apply this discount, if any.
    - `recurring`
      Details of how the discount applies to recurring payments.
      - `type`
        One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
      - `durationInMonths`
        If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
    - `percentOff`
      An integer representing the discount amount as a percentage.
    - `amountOff`
      The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.

- `email`
  The Customer's email address.

- `lastPaymentError`
  The error encountered the last time the Checkout Session was confirmed.
    - `message`
      An error message to be displayed to the customer.

- `lineItems`
  A list of items the customer is purchasing.
    - `id`
      Unique identifier for the object.
    - `priceId`
      The ID of the Price or Plan backing the line item.
    - `subtotal`
      Total before any discounts or exclusive taxes are applied.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      Total discount amount. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      Total amount of exclusive tax (tax that is collected in addition to the subtotal).
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      Total amount of inclusive tax (tax that is already included in the subtotal).
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total amount for this line item, including discounts and tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmount`
      The amount representing the cost of a single unit of the item.
      - `amount`
        A formatted string representing the unit amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `unitAmountDecimal`
      The unit amount of the line item in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), with sub-cent precision. Use this field instead of `unitAmount` when dealing with sub-cent pricing (for example, usage-based billing). For sub-cent prices, `unitAmount.minorUnitsAmount` rounds to `0`, so `unitAmountDecimal` preserves the exact decimal value (for example, `0.005` for a price of 0.00005 USD).
      - `amount`
        A formatted string representing the unit amount with sub-cent precision, including currency symbols.
      - `minorUnitsAmount`
        A number representing the unit amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) with sub-cent precision (for example, `0.5` for half a cent). Unlike `unitAmount.minorUnitsAmount`, this value can be a decimal.
    - `unitLabel`
      A label that represents the unit of this line item. Specify `unitLabel` in
[productData.unit_label](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-unit_label)
when creating the Checkout Session or when creating the Product's
[unit_label](https://docs.stripe.com/api/products/object.md#product_object-unit_label) field.
    - `description`
      An arbitrary string attached to the object. Often useful for displaying to users.
    - `name`
      The item's name, meant to be displayable to users.
    - `images`
      An array of image URLs for the line item. Specify [images](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data-images) on the Product when creating the Checkout Session.
    - `quantity`
      The quantity of products being purchased.
    - `isRemovable`
      Whether the customer can remove the line item.
    - `discountAmounts`
      The amount of discount calculated per discount for this line item.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `displayName`
        A user-facing description of the discount.
      - `promotionCode`
        The customer-facing promotion code that was used to apply this discount, if any.
      - `recurring`
        Details of how the discount applies to recurring payments.
        - `type`
          One of `forever` or `repeating`.
* `forever`: Applies to all charges from a subscription with this coupon applied.
* `repeating`: Applies to charges in the first `durationInMonths` months from a subscription with this coupon applied.
        - `durationInMonths`
          If `duration` is `repeating`, the number of months the coupon applies. Null otherwise.
      - `percentOff`
        An integer representing the discount amount as a percentage.
      - `amountOff`
        The configured fixed discount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal), in the active currency when a corresponding configured amount is available. This differs from `amount` and `minorUnitsAmount`, which describe the discount actually applied to the current total. For example, a fixed coupon can retain `amountOff` while the applied discount is zero during a free trial. This field is omitted when no configured fixed amount is available.
    - `taxAmounts`
      The amount of tax calculated per tax rate for this line item.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.
    - `recurring`
      The recurring components of a price such as `interval` and `intervalCount`.
      - `interval`
        Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
      - `intervalCount`
        The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills
every 3 months.
      - `usageType`
        One of `licensed` or `metered`. `licensed` automatically
bills the quantity set when adding it to a subscription.
`metered` aggregates the total usage based on usage records.
    - `adjustableQuantity`
      Configuration for this item's quantity to be adjusted by the
customer during checkout.
      - `maximum`
        The maximum quantity the customer can purchase for the Checkout Session.
      - `minimum`
        The minimum quantity the customer can purchase for the Checkout Session.

- `livemode`
  Has the value `true` if the object exists in live mode or the value `false` if the object exists in a sandbox.

- `minorUnitsAmountDivisor`
  The factor used to convert between minor and major currency units.

This value represents the number of minor currency units per one major unit. For example, in USD, where cents are the minor unit, the divisor is 100.  In JPY, which has no minor units, the divisor is 1.

- `nameCollection`
  Names collected from the customer. This value is `null` if [name_collection](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-name_collection) is not configured on the Checkout Session.
    - `individualName`
      The customer's individual name.
    - `businessName`
      The customer's business name.

- `phoneNumber`
  The Customer's phone number.

- `recurring`
  Details about recurring payments set up by the Checkout Session.
    - `interval`
      Specifies billing frequency. Either `day`, `week`, `month`, or `year`.
    - `intervalCount`
      The number of intervals between subscription billings. For
example, `interval=month` and `intervalCount=3` bills every 3
months.
    - `dueNext`
      Details about the next scheduled recurring payment.
      - `subtotal`
        Total before any discounts or exclusive taxes are applied.
        - `amount`
          A formatted string representing the subtotal amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `discount`
        Total discount amount. A positive number reduces the amount to be paid.
        - `amount`
          A formatted string representing the discount amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxExclusive`
        Total amount of exclusive tax (tax that is collected in addition to the subtotal).
        - `amount`
          A formatted string representing the exclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `taxInclusive`
        Total amount of inclusive tax (tax that is already included in the subtotal).
        - `amount`
          A formatted string representing the inclusive tax amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `total`
        Total computed amount, including discounts and tax.
        - `amount`
          A formatted string representing the total amount, including currency symbols.
        - `minorUnitsAmount`
          An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `billingCycleAnchor`
        A future Unix timestamp to anchor the subscription's billing
cycle. The anchor is the reference point that aligns future
billing cycle dates. If not present, the subscription starts immediately.
    - `trial`
      Details about a free trial, if there is one.
      - `trialEnd`
        Unix timestamp representing the end of the trial period the
customer will get before being charged for the first time.
      - `trialPeriodDays`
        Integer representing the number of trial period days before the customer is charged for the first time.
    - `isProrated`
      When true, the amount to be collected today is a prorated
amount for a partial billing period, such as when using
[billing_cycle_anchor](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-subscription_data-billing_cycle_anchor).

- `savedPaymentMethods`
  An array of payment methods attached to the Customer.
    - `id`
      ID of the PaymentMethod object
    - `type`
      The [type](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-type) of the PaymentMethod
    - `billingDetails`
      Billing information associated with the PaymentMethod that may be used or required by particular types of payment methods.
      - `email`
        Email address.
      - `phone`
        Billing phone number (including extension).
      - `name`
        Full name.
      - `address`
        Address.
        - `country`
          Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
        - `line1`
          Address line 1 (e.g., street, PO Box, or company name).
        - `line2`
          Address line 2 (e.g., apartment, suite, unit, or building).
        - `city`
          City, district, suburb, town, or village.
        - `postal_code`
          ZIP or postal code.
        - `state`
          State, county, province, or region.
    - `card`
      If this is a `card` PaymentMethod, this hash contains the user's card details.
      - `brand`
        The brand to use when displaying the card, this accounts for customer's brand choice on dual-branded cards.
Can be american_express, cartes_bancaires, diners_club, discover, eftpos_australia, interac, jcb, mastercard, union_pay, visa,
or other and may contain more values in the future.
      - `expMonth`
        Two-digit number representing the card's expiration month.
      - `expYear`
        Four-digit number representing the card's expiration year.
      - `last4`
        The last four digits of the card.
    - `usBankAccount`
      US bank account details. Present only when `type` is `us_bank_account`; otherwise, this field is omitted.
      - `accountHolderType`
        The type of account holder. One of `individual` or `company`.
      - `accountType`
        The type of bank account. One of `checking` or `savings`.
      - `bankName`
        The name of the bank.
      - `last4`
        The last four digits of the bank account number.
    - `sepaDebit`
      SEPA Direct Debit details. Present only when `type` is `sepa_debit`; otherwise, this field is omitted.
      - `bankCode`
        The bank code of the bank account.
      - `branchCode`
        The branch code of the bank account.
      - `country`
        The two-letter country code of the bank account ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `last4`
        The last four digits of the bank account number.
    - `bacsDebit`
      Bacs Direct Debit details. Present only when `type` is `bacs_debit`; otherwise, this field is omitted.
      - `last4`
        The last four digits of the bank account number.
      - `sortCode`
        The sort code of the bank account.
    - `auBecsDebit`
      BECS Direct Debit details. Present only when `type` is `au_becs_debit`; otherwise, this field is omitted.
      - `bsbNumber`
        The Bank State Branch (BSB) number of the bank account.
      - `last4`
        The last four digits of the bank account number.
    - `nzBankAccount`
      New Zealand bank account details. Present only when `type` is `nz_bank_account`; otherwise, this field is omitted.
      - `accountHolderName`
        The name of the account holder.
      - `bankCode`
        The bank code of the bank account.
      - `bankName`
        The name of the bank.
      - `branchCode`
        The branch code of the bank account.
      - `last4`
        The last four digits of the bank account number.
      - `suffix`
        The suffix of the bank account number.
    - `cardArt`
      Card art details. Present only when `type` is `card` and card art is available; otherwise, this field is omitted.
      - `cardArtUrl`
        The URL of the card art image.
      - `programName`
        The name of the card program associated with the card art.

- `shipping`
  The selected shipping option, if any.
    - `shippingOption`
      Details of the selected shipping option.
      - `id`
        Unique identifier for the object.
      - `amount`
        A formatted string representing the shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `currency`
        Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
      - `displayName`
        A user-facing description of the shipping option.
      - `deliveryEstimate`
        The estimated range for how long shipping will take.
        - `maximum`
          The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
        - `minimum`
          The lower bound of the estimated range. If empty, represents no lower bound.
          - `unit`
            A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
          - `value`
            Must be greater than 0.
    - `taxAmounts`
      The amount of tax calculated per tax rate for shipping costs.
      - `amount`
        A formatted string representing the tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
      - `inclusive`
        Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
      - `displayName`
        A user-facing description of the tax.
      - `percentage`
        The tax rate percentage. This value is absent for flat-amount tax rates.

- `shippingAddress`
  Shipping address of the Customer.
    - `name`
      Full name.
    - `address`
      Address.
      - `country`
        Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
      - `line1`
        Address line 1 (e.g., street, PO Box, or company name).
      - `line2`
        Address line 2 (e.g., apartment, suite, unit, or building).
      - `city`
        City, district, suburb, town, or village.
      - `postal_code`
        ZIP or postal code.
      - `state`
        State, county, province, or region.

- `shippingOptions`
  The list of shipping options that can be selected.
    - `id`
      Unique identifier for the object.
    - `amount`
      A formatted string representing the shipping amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `currency`
      Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase.
    - `displayName`
      A user-facing description of the shipping option.
    - `deliveryEstimate`
      The estimated range for how long shipping will take.
      - `maximum`
        The upper bound of the estimated range. If empty, represents no upper bound i.e., infinite.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.
      - `minimum`
        The lower bound of the estimated range. If empty, represents no lower bound.
        - `unit`
          A unit of time. Either `business_day`, `day`, `hour`, `week`, or `month`.
        - `value`
          Must be greater than 0.

- `status`
  Status of the Checkout Session.
    - `type`
      One of `open`, `expired`, or `complete`.
* `open`: The Checkout Session is still in progress.
* `expired`: The Checkout Session has expired. No further processing will occur.
* `complete`: The Checkout Session is complete. Payment processing may still be in progress.
    - `paymentStatus`
      One of `paid`, `unpaid`, or `no_payment_required`. Only present when `type=complete`.
* `paid`: The payment funds are available in your account.
* `unpaid`: The payment funds are not yet available in your account.
* `no_payment_required`: The payment is delayed to a future date, or the Checkout Session is in setup mode and doesn't require a payment at this time.

- `tax`
  Details about the tax computation status.
    - `status`
      One of `ready`, `requires_shipping_address`, or `requires_billing_address`.
* `ready`: The final tax amount is computed, and the session is ready for confirmation.
* `requires_shipping_address`: A shipping address must be provided to calculate tax.
* `requires_billing_address`: A billing address must be provided to calculate tax.
    - `automaticTax`
      Details about the automatic tax settings of the Checkout Session.
      - `enabled`
        Whether automatic tax is enabled on the Checkout Session. The
other fields in this hash are `null` when automatic tax is
disabled.
      - `exempt`
        One of `none`, `exempt`, or `reverse`. This value is `null` if
automatic tax is disabled, or if the Customer hasn't provided
enough address information to determine their tax exemption.
* `none`: The Customer isn't exempt from tax.
* `exempt`: The Customer is exempt from tax.
* `reverse`: The Customer is subject to the [reverse charge mechanism](https://docs.stripe.com/tax/zero-tax.md#reverse-charges), so tax is accounted for by the Customer.
      - `addressSource`
        One of `billing`, `shipping`, or `customer`, indicating which
address is used to calculate tax. This value is `null` if
automatic tax is disabled.
* `billing`: Tax is calculated from the billing address collected during this Checkout Session.
* `shipping`: Tax is calculated from the shipping address collected during this Checkout Session.
* `customer`: Tax is calculated from the address saved on the Customer.

- `taxAmounts`
  The aggregate amounts calculated per tax rate for all line
items. This value is `null` if tax has not yet been computed,
i.e. the Customer's address has not been collected yet.
    - `amount`
      A formatted string representing the tax amount, including currency symbols.
    - `minorUnitsAmount`
      An integer representing the tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `inclusive`
      Whether this tax amount is [inclusive or exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax).
    - `displayName`
      A user-facing description of the tax.
    - `percentage`
      The tax rate percentage. This value is absent for flat-amount tax rates.

- `taxIdInfo`
  The Customer's tax ID collection information. This value is `null` if no tax ID information is available.
    - `businessName`
      The Customer's business name associated with tax ID collection.
    - `taxId`
      The Customer's tax ID.
      - `type`
        One of [the supported tax ID types](https://docs.stripe.com/tax/checkout/tax-ids?payment-ui=embedded-components.md#supported-types).
      - `value`
        The value of the tax ID.

- `total`
  Tax and discount details for the computed total amount. Use this
field to render an amount breakdown to your customer, such as in an
order summary.
    - `subtotal`
      The total amount of line items, excluding tax, discounts, and shipping.
      - `amount`
        A formatted string representing the subtotal amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the subtotal amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxExclusive`
      The sum of all [exclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the exclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the exclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `taxInclusive`
      The sum of all [inclusive](https://docs.stripe.com/tax/faq.md#what-is-the-difference-between-inclusive-and-exclusive-tax) tax amounts
      - `amount`
        A formatted string representing the inclusive tax amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the inclusive tax amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `shippingRate`
      The sum of all shipping amounts.
      - `amount`
        A formatted string representing the total shipping amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total shipping amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `discount`
      The sum of all the discounts. A positive number reduces the amount to be paid.
      - `amount`
        A formatted string representing the discount amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the discount amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `total`
      Total computed amount, including discounts, tax.
      - `amount`
        A formatted string representing the total amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `appliedBalance`
      Total amount of [customer credit balance](https://docs.stripe.com/billing/customer/balance.md) to be applied to the payment. A positive number increases the amount to be paid, and a negative number decreases the amount to be paid.
      - `amount`
        A formatted string representing the applied customer balance amount, including currency symbols.
      - `minorUnitsAmount`
        An integer representing the applied customer balance amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge $1.00 or 100 to charge ¥100, a zero-decimal currency).
    - `balanceAppliedToNextInvoice`
      When true, no payment will be collected immediately. Instead, the amount due will be added to the Customer's next invoice. This can happen when the amount due today is less than the [minimum chargeable amount](https://docs.stripe.com/currencies.md#minimum-and-maximum-charge-amounts).

### Example

```title
Call useCheckout hook
```

## CheckoutForm

Use the `CheckoutForm` from `@stripe/react-stripe-js/checkout` to render the embedded form; a single form that handles payment, address, and other elements.

The component must be rendered inside a [CheckoutFormProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_form_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Embedded form initialization options.
    - `layout`
      The layout of the embedded form. The `'expanded'` layout is a single-step embedded form, while the `'compact'` layout is a multi-step embedded form. When you leave this undefined, Stripe renders the layout it determines has the best conversion.

The `'compact'` layout is in private preview. [Request access](https://docs.stripe.com/checkout/form/quickstart.md#request-access-to-the-compact-layout).
    - `contacts`
      An array of objects that you can use to display saved addresses in the embedded form. The first contact is automatically selected.
      - `name`
        The name of the contact. This might be a person, or a business name.
      - `address`
        The address of the contact.
        - `line1`
        - `line2`
        - `city`
          The name of a city, town, village, etc.
        - `state`
          The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
        - `postal_code`
          The postal code or ZIP code, also known as PIN code in India.
        - `country`
          Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
      - `phone`
        The phone number of the contact.
    - `features`
      Configuration for client-side features of the embedded form, such as amount summary expansion and promotion code collection.
      - `amountSummary`
        Configuration for the amount summary in the embedded form.
        - `expanded`
          Controls whether the amount summary can be collapsed in the embedded form.

By default (`'auto'`), the amount summary starts collapsed when it has expandable content, and the customer can expand or collapse it.

Set to `'always'` to keep the amount summary expanded and prevent it from being collapsed.

If there are no additional details to display, the summary shows only the total and doesn't expand, regardless of this setting.
      - `promotionCodeCollection`
        Controls whether to show promotion code input in the embedded form. Defaults to `'auto'`.

- `'auto'`: Shows the promotion code input if the Checkout Session enables [allow_promotion_codes](https://docs.stripe.com/api/checkout/sessions/create#create_checkout_session-allow_promotion_codes).
- `'never'`: Never shows the promotion code input in the embedded form. Use this if you build your own promotion code input outside of the form.
    - `expressCheckout`
      Express checkout configuration options.
      - `buttonHeight`
        By default, the height of the buttons are 44px.

You can override this to specify a custom button height in the range of 40px-55px.
      - `buttonTheme`
        Specify the preferred button theme to use. By default, Elements determines the themes based on the specified [appearance option](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-appearance).
        - `applePay`
        - `googlePay`
        - `paypal`
        - `klarna`
      - `paymentMethods`
        In addition to your Dashboard configuration, the CheckoutSession configuration also influences the availability of payment methods in the Embedded form. By default, it displays all available payment methods based on both configurations. When setting the paymentMethods option, the Embedded form merges your specified options with the default logic to determine the final set of payment methods displayed.
        - `amazonPay`
        - `applePay`
          Apple Pay has additional configurations
that determine when Stripe can show it. By default, Apple Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.

If you want to always show Apple Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`.

Apple Pay on non-Safari desktop browsers is only supported when its property in `paymentMethods` is set to `always`.
        - `googlePay`
          Google Pay has additional configurations
that determine when Stripe can show it. By default, Google Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.
If you want to always show Google Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`.
        - `klarna`
        - `link`
        - `paypal`

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/custom_checkout/element_events/on_change.md?type=checkoutForm) changes.

- `onConfirm`
  Triggered when the embedded form sends a [confirm event](https://docs.stripe.com/js/custom_checkout/element_events/on_confirm.md?type=checkoutForm). Use this to handle payment confirmation.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render CheckoutForm
```

## Using the Elements provider

Build your Stripe integration using React and Stripe Elements.

See [build a checkout page](https://docs.stripe.com/docs/payments/quickstart.md) for steps on using Elements with the [Payment Intents API](https://docs.stripe.com/api/payment_intents.md).

The following React components and hooks are available to use as part of your integration.

## Elements

`Elements` mounts the Stripe Elements context for `@stripe/react-stripe-js`. Wrap the portion
of your React tree that renders individual Element components to make the Stripe object, Elements
instance, and related helpers available via React context.

For the [Payment Element created without an Intent](https://docs.stripe.com/payments/accept-a-payment-deferred.md),
see the [ElementsProvider without an intent](https://docs.stripe.com/js/react_stripe_js/elements/elements_provider_without_intent.md) reference instead.

### Props

- `stripe`
  A [Stripe object](https://docs.stripe.com/js/initializing.md) or a `Promise` that resolves to one. The value returned from
`loadStripe` is the recommended way to initialize this prop.

- `options`
  A set of options to create this `Elements` instance with.
    - `fonts`
      An array of custom fonts, which elements created from the `Elements` object can use. Fonts can be specified as [CssFontSource](#css_font_source_object) or [CustomFontSource](#custom_font_source_object) objects.
    - `locale`
      The [locale](#supported_locales) used to localize all text that Elements displays, including labels, placeholders, buttons, and error messages.
Default is `auto` (Stripe detects the locale of the browser).

This option doesn't affect content that Stripe doesn't render, such as browser and wallet payment sheets (for example, Apple Pay and Google Pay), which use the customer's browser or device language. It also doesn't translate text you provide, such as custom payment method names.

Setting the locale does not affect the behavior of postal code validation—a valid postal code for the billing country of the card is still required.

To indicate the direction of text for *right to left* languages such as Arabic and Hebrew, mount Elements underneath an HTML element that includes the `dir="rtl"` attribute.
    - `clientSecret`
      Required to use with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and the [Contact Details Element](https://docs.stripe.com/payments/link.md).

The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) for a PaymentIntent or SetupIntent.
    - `appearance`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the [Contact Details Element](https://docs.stripe.com/payments/link.md), and the [Address Element](https://docs.stripe.com/elements/address-element/.md).

Match the design of your site with the [appearance option](https://docs.stripe.com/elements/appearance-api.md).
The layout of each Element stays consistent, but you can modify colors, fonts, borders, padding, and more.
    - `loader`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the [Contact Details Element](https://docs.stripe.com/payments/link.md), and the [Address Element](https://docs.stripe.com/elements/address-element/.md).

Display skeleton loader UI while waiting for Elements to be fully loaded, after they are mounted.
Default is `'auto'` (Stripe determines if a loader UI should be shown).
    - `currency`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

Influences available payment methods when creating SetupIntents with [automatic_payment_methods](https://docs.stripe.com/api/setup_intents/create.md#create_setup_intent-automatic_payment_methods).
Payment Element renders the payment methods enabled in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods) that support the provided currency.

Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).
    - `customerSessionClientSecret`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Address Element](https://docs.stripe.com/elements/address-element.md).

The client_secret returned from create a [CustomerSession](https://docs.stripe.com/api/customer_sessions.md) associated with the [Customer ID](https://docs.stripe.com/api/customers/object.md#customer_object-id) for that session.
    - `syncAddressCheckbox`
      Used with the [Address Element](https://docs.stripe.com/elements/address-element.md).

The `syncAddressCheckbox` parameter configures which Address Element to show the checkbox above.

The checkbox allows the customer the option to sync billing and shipping addresses when multiple Address Elements are used, one of each mode, in a single Elements instance.

Default is `'billing'`. `'none'` opts out of showing the checkbox in either Address Element.
    - `paymentMethodCreation`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Allows PaymentMethods to be created from the Elements instance using [stripe.createPaymentMethod](https://docs.stripe.com/js/payment_methods/create_payment_method_elements.md).

**NOTE:** The Express Checkout Element doesn't support [stripe.createPaymentMethod](https://docs.stripe.com/js/payment_methods/create_payment_method_elements.md) with [Amazon Pay](https://docs.stripe.com/payments/amazon-pay.md) or [Klarna](https://docs.stripe.com/payments/klarna.md). Use [stripe.createConfirmationToken](https://docs.stripe.com/js/confirmation_tokens/create_confirmation_token.md) instead. Card installments are also unsupported and either blocks showing the plan selection UI, or raises an error for manual enablement using `paymentMethodOptions`.
    - `customPaymentMethods`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

An array of [custom payment methods](https://docs.stripe.com/payments/payment-element/custom-payment-methods.md) to display in the [Payment Element](https://docs.stripe.com/payments/payment-element.md) or [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).
The custom payment methods must be registered in the [Stripe Dashboard](https://dashboard.stripe.com/settings/custom_payment_methods).
      - `id`
        The ID of the [custom payment method type](https://dashboard.stripe.com/settings/custom_payment_methods), prefixed with `cpmt_`.
      - `options`
        A set of options that configure the custom payment method. `options` and `payment` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.
      - `payment`
        A set of options that configure the custom payment method in the [Payment Element](https://docs.stripe.com/payments/payment-element.md). This is an alias of `options`. `payment` and `options` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.
    - `externalPaymentMethodTypes (deprecated)`
      _This param has been deprecated in favor of [custom payment methods](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-customPaymentMethods), which offers more flexibility._

The [external payment methods](https://docs.stripe.com/payments/external-payment-methods.md) to be displayed in the [Payment Element](https://docs.stripe.com/payments/payment-element.md) that you are already integrated with.
Must be an [available external payment methods](https://docs.stripe.com/payments/external-payment-methods.md#available-external-payment-methods).
    - `disallowedCardBrands`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

By default, the Payment Element supports [multiple card brands](https://docs.stripe.com/payments/cards/supported-card-brands.md) in the card input field, Apple Pay, and Google Pay.

Provide a list of card brands to disallow. Valid values are `visa`, `mastercard`, `american_express`, and `discover_global_network`. The `discover_global_network` value includes Discover, Diners, JCB, UnionPay, and Elo.

You can't disallow every supported card brand.

The Payment Element applies this option as client-side validation. It isn't server-side enforcement of your payment policy. See [Enforce card restrictions](https://docs.stripe.com/payments/customize-payment-methods.md#enforce-card-restrictions) for server-side enforcement options.
    - `disallowedCardFundingTypes`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

Provide a list of card funding types to disallow in the Payment Element. Valid values are `credit`, `debit`, and `prepaid`.

You can't disallow every supported card funding type.

The Payment Element applies this option as client-side validation. It isn't server-side enforcement of your payment policy. See [Enforce card restrictions](https://docs.stripe.com/payments/customize-payment-methods.md#enforce-card-restrictions) for server-side enforcement options.

- `children`
  `Elements` renders its children once the Stripe object and Elements instance are ready.

### Example

```title
Mount Elements
```

## Elements without an intent

`Elements` mounts the Stripe Elements context for `@stripe/react-stripe-js`. Wrap the portion
of your React tree that renders individual Element components to make the Stripe object, Elements
instance, and related helpers available via React context.

This reference applies to the [Payment Element created without an Intent](https://docs.stripe.com/payments/accept-a-payment-deferred.md), and [Card Elements](https://docs.stripe.com/payments/card-element.md).
For other elements, see the [ElementsProvider](https://docs.stripe.com/js/react_stripe_js/elements/elements_provider.md) reference instead.

### Props

- `stripe`
  A [Stripe object](https://docs.stripe.com/js/initializing.md) or a `Promise` that resolves to one. The value returned from
`loadStripe` is the recommended way to initialize this prop.

- `options`
  A set of options to create this `Elements` instance with.
    - `fonts`
      An array of custom fonts, which elements created from the `Elements` object can use. Fonts can be specified as [CssFontSource](#css_font_source_object) or [CustomFontSource](#custom_font_source_object) objects.
    - `locale`
      The [locale](#supported_locales) used to localize all text that Elements displays, including labels, placeholders, buttons, and error messages.
Default is `auto` (Stripe detects the locale of the browser).

This option doesn't affect content that Stripe doesn't render, such as browser and wallet payment sheets (for example, Apple Pay and Google Pay), which use the customer's browser or device language. It also doesn't translate text you provide, such as custom payment method names.

Setting the locale does not affect the behavior of postal code validation—a valid postal code for the billing country of the card is still required.

To indicate the direction of text for *right to left* languages such as Arabic and Hebrew, mount Elements underneath an HTML element that includes the `dir="rtl"` attribute.
    - `mode`
      Required to use with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Filters out payment methods based on intended use.
    - `currency`
      Required to use with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Three-letter [ISO currency code](https://www.iso.org/iso-4217-currency-codes.html), in lowercase. Must be a [supported currency](https://docs.stripe.com/currencies.md).
    - `amount`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md). Required when `mode` is `payment` or `subscription`.

Shown in Apple Pay, Google Pay, or Buy now, pay later UIs. The amount intended to be collected from the customer right now. A positive integer representing how much to charge in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal) (e.g., 100 cents to charge 1.00 USD or 100 to charge 100 JPY, a zero-decimal currency).

The minimum amount is 0.50 USD or [equivalent in charge currency](https://docs.stripe.com/currencies.md#minimum-and-maximum-charge-amounts). If `mode` is `subscription`, the value supports 0 to account for coupons and free trials, but any amount above 0 is subject to the minimum.

The amount value supports up to eight digits (e.g., a value of 99999999 for a 999,999.99 USD charge).
    - `setupFutureUsage`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Indicates that you intend to make future payments with the payment details collected by the Payment Element.

This should match the [setup_future_usage](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-setup_future_usage) provided on the Intent used when confirming payment.
    - `captureMethod`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Influences available payment methods. This should match the [capture_method](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-capture_method) provided on the Intent used when confirming payment.
    - `onBehalfOf`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md), [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), and [Card Elements](https://docs.stripe.com/payments/card-element.md).

The Stripe account ID which is the business of record. See [use cases](https://docs.stripe.com/connect/charges.md) to determine if this option is relevant for your integration. This should match the [on_behalf_of](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-on_behalf_of) provided on the Intent used when confirming payment.
    - `paymentMethodConfiguration`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

The [payment method configuration](https://docs.stripe.com/api/payment_method_configurations.md) to use when managing your payment methods from the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods). If none is specified, your default configuration is used.
    - `paymentMethodOptions`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Additional payment-method-specific options for configuring behavior when initialized without an intent.
      - `acss_debit`
        If this is an `acss_debit` PaymentMethod, this sub-hash contains details about the ACSS Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `affirm`
        If this is an `affirm` PaymentMethod, this sub-hash contains details about the Affirm payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `afterpay_clearpay`
        If this is an `afterpay_clearpay` PaymentMethod, this sub-hash contains details about the Afterpay / Clearpay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `alipay`
        If this is an `alipay` PaymentMethod, this sub-hash contains details about the Alipay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `amazon_pay`
        If this is an `amazon_pay` PaymentMethod, this sub-hash contains details about the Amazon Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `au_becs_debit`
        If this is an `au_becs_debit` PaymentMethod, this sub-hash contains details about the BECS Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `bacs_debit`
        If this is a `bacs_debit` PaymentMethod, this sub-hash contains details about the Bacs Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `bancontact`
        If this is a `bancontact` PaymentMethod, this sub-hash contains details about the Bancontact payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `blik`
        If this is a `blik` PaymentMethod, this sub-hash contains details about the BLIK payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `boleto`
        If this is a `boleto` PaymentMethod, this sub-hash contains details about the Boleto payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `card`
        If this is a `card` PaymentMethod, this sub-hash contains details about the card payment method options.
        - `require_cvc_recollection`
          When enabled, using a card that is attached to a customer will require the CVC to be provided again.
When providing a `customerSessionClientSecret` and using the Payment Element, the Payment Element will prompt for CVC recollection.
        - `installments`
          Installment configuration.
          - `enabled`
            When `true`, shows the card installment plan selection UI (depending on issuer and country support) if you don't manage your payment methods in the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods).
 You must set `mode='payment'` _and_ explicitly specify `allowedPaymentMethodTypes` in the Elements `options`. Setting installments to `true` without these settings returns an error.
 Incompatible with `paymentMethodCreation='manual'`.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `cashapp`
        If this is a `cashapp` PaymentMethod, this sub-hash contains details about the Cash App Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `crypto`
        If this is a `crypto` PaymentMethod, this sub-hash contains details about the Crypto payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `customer_balance`
        If this is a `customer_balance` PaymentMethod, this sub-hash contains details about the Customer Balance payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `eps`
        If this is an `eps` PaymentMethod, this sub-hash contains details about the EPS payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `fpx`
        If this is an `fpx` PaymentMethod, this sub-hash contains details about the FPX payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `giropay`
        If this is a `giropay` PaymentMethod, this sub-hash contains details about the giropay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `grabpay`
        If this is a `grabpay` PaymentMethod, this sub-hash contains details about the GrabPay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `ideal`
        If this is an `ideal` PaymentMethod, this sub-hash contains details about the iDEAL payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `kakao_pay`
        If this is a `kakao_pay` PaymentMethod, this sub-hash contains details about the Kakao Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `klarna`
        If this is a `klarna` PaymentMethod, this sub-hash contains details about the Klarna payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `konbini`
        If this is a `konbini` PaymentMethod, this sub-hash contains details about the Konbini payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `kr_card`
        If this is a `kr_card` PaymentMethod, this sub-hash contains details about the Korean card payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `link`
        If this is a `link` PaymentMethod, this sub-hash contains details about the Link payment method options (Link is also known as Onelink in the UK).
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `mb_way`
        If this is a `mb_way` PaymentMethod, this sub-hash contains details about the MB WAY payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `mobilepay`
        If this is a `mobilepay` PaymentMethod, this sub-hash contains details about the MobilePay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `multibanco`
        If this is a `multibanco` PaymentMethod, this sub-hash contains details about the Multibanco payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `naver_pay`
        If this is a `naver_pay` PaymentMethod, this sub-hash contains details about the Naver Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `nz_bank_account`
        If this is a `nz_bank_account` PaymentMethod, this sub-hash contains details about the New Zealand bank account payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `oxxo`
        If this is an `oxxo` PaymentMethod, this sub-hash contains details about the OXXO payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `p24`
        If this is a `p24` PaymentMethod, this sub-hash contains details about the Przelewy24 payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `paynow`
        If this is a `paynow` PaymentMethod, this sub-hash contains details about the PayNow payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `pix`
        If this is a `pix` PaymentMethod, this sub-hash contains details about the Pix payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `paypal`
        If this is a `paypal` PaymentMethod, this sub-hash contains details about the PayPal payment method options.
        - `capture_method`
          Controls when the funds will be captured.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `promptpay`
        If this is a `promptpay` PaymentMethod, this sub-hash contains details about the PromptPay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `revolut_pay`
        If this is a `revolut_pay` PaymentMethod, this sub-hash contains details about the Revolut Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `satispay`
        If this is a `satispay` PaymentMethod, this sub-hash contains details about the Satispay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `sepa_debit`
        If this is a `sepa_debit` PaymentMethod, this sub-hash contains details about the SEPA Debit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `sequra`
        If this is a `sequra` PaymentMethod, this sub-hash contains details about the SeQura payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `sofort`
        If this is a `sofort` PaymentMethod, this sub-hash contains details about the Sofort payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `sunbit`
        If this is a `sunbit` PaymentMethod, this sub-hash contains details about the Sunbit payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `swish`
        If this is a `swish` PaymentMethod, this sub-hash contains details about the Swish payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `twint`
        If this is a `twint` PaymentMethod, this sub-hash contains details about the TWINT payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
      - `upi`
        If this is a `upi` PaymentMethod, this sub-hash contains details about the UPI payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
      - `us_bank_account`
        If this is a `us_bank_account` PaymentMethod, this sub-hash contains details about the US bank account payment method options.
        - `verification_method`
          Verification method for the US bank account collection flow
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
          - `off_session`
            Use `off_session` if your customer may or may not be present in your checkout flow.
          - `on_session`
            Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
        - `financial_connections`
          Additional fields for Financial Connections session creation
          - `permissions`
            The list of permissions to request. If this parameter is passed, the `payment_method` permission must be included. Valid permissions include: `balances`, `ownership`, `payment_method`, and `transactions`.
          - `prefetch`
            The list of permissions that you would like to retrieve upon creation. Valid permissions include: `balances`, `ownership`, and `transactions`.
      - `wechat_pay`
        If this is a `wechat_pay` PaymentMethod, this sub-hash contains details about the WeChat Pay payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
      - `zip`
        If this is a `zip` PaymentMethod, this sub-hash contains details about the Zip payment method options.
        - `setup_future_usage`
          Indicates that you intend to make future payments with the payment details collected by the Payment Element.
          - `none`
            Use `none` if you do not intend to reuse this payment method and want to override the top-level setup_future_usage value for this payment method.
    - `appearance`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the [Contact Details Element](https://docs.stripe.com/payments/link.md), the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md), and the [Address Element](https://docs.stripe.com/elements/address-element/.md).

Match the design of your site with the [appearance option](https://docs.stripe.com/elements/appearance-api.md).
The layout of each Element stays consistent, but you can modify colors, fonts, borders, padding, and more.
    - `loader`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the [Contact Details Element](https://docs.stripe.com/payments/link.md), and the [Address Element](https://docs.stripe.com/elements/address-element/.md).

Display skeleton loader UI while waiting for Elements to be fully loaded, after they are mounted.
Default is `'auto'` (Stripe determines if a loader UI should be shown).
    - `customerSessionClientSecret`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Address Element](https://docs.stripe.com/elements/address-element.md).

The client_secret returned from create a [CustomerSession](https://docs.stripe.com/api/customer_sessions.md) associated with the [Customer ID](https://docs.stripe.com/api/customers/object.md#customer_object-id) for that session.
    - `syncAddressCheckbox`
      Used with the [Address Element](https://docs.stripe.com/elements/address-element.md).

The `syncAddressCheckbox` parameter configures which Address Element to show the checkbox above.

The checkbox allows the customer the option to sync billing and shipping addresses when multiple Address Elements are used, one of each mode, in a single Elements instance.

Default is `'billing'`. `'none'` opts out of showing the checkbox in either Address Element.
    - `paymentMethodCreation`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

Allows PaymentMethods to be created from the Elements instance using [stripe.createPaymentMethod](https://docs.stripe.com/js/payment_methods/create_payment_method_elements.md).

**NOTE:** The Express Checkout Element doesn't support [stripe.createPaymentMethod](https://docs.stripe.com/js/payment_methods/create_payment_method_elements.md) with [Amazon Pay](https://docs.stripe.com/payments/amazon-pay.md) or [Klarna](https://docs.stripe.com/payments/klarna.md). Use [stripe.createConfirmationToken](https://docs.stripe.com/js/confirmation_tokens/create_confirmation_token.md) instead. Card installments are also unsupported and either blocks showing the plan selection UI, or raises an error for manual enablement using `paymentMethodOptions`.
    - `allowedPaymentMethodTypes`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

The list of payment method types to allow for this payment. From this list, Stripe automatically renders the relevant payment methods. You can omit this attribute to manage your payment methods from the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods).
    - `excludedPaymentMethodTypes`
      Used with the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

The list of payment method types to exclude from use with this payment.
    - `customPaymentMethods`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md) and [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).

An array of [custom payment methods](https://docs.stripe.com/payments/payment-element/custom-payment-methods.md) to display in the [Payment Element](https://docs.stripe.com/payments/payment-element.md) or [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md).
The custom payment methods must be registered in the [Stripe Dashboard](https://dashboard.stripe.com/settings/custom_payment_methods).
      - `id`
        The ID of the [custom payment method type](https://dashboard.stripe.com/settings/custom_payment_methods), prefixed with `cpmt_`.
      - `options`
        A set of options that configure the custom payment method. `options` and `payment` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.
      - `payment`
        A set of options that configure the custom payment method in the [Payment Element](https://docs.stripe.com/payments/payment-element.md). This is an alias of `options`. `payment` and `options` are mutually exclusive.
        - `type`
          The form type of the custom payment method.
        - `subtitle`
          A subtitle contains additional information about the custom payment method.
    - `disallowedCardBrands`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

By default, the Payment Element supports [multiple card brands](https://docs.stripe.com/payments/cards/supported-card-brands.md) in the card input field, Apple Pay, and Google Pay.

Provide a list of card brands to disallow. Valid values are `visa`, `mastercard`, `american_express`, and `discover_global_network`. The `discover_global_network` value includes Discover, Diners, JCB, UnionPay, and Elo.

You can't disallow every supported card brand.

The Payment Element applies this option as client-side validation. It isn't server-side enforcement of your payment policy. See [Enforce card restrictions](https://docs.stripe.com/payments/customize-payment-methods.md#enforce-card-restrictions) for server-side enforcement options.
    - `disallowedCardFundingTypes`
      Supported for the [Payment Element](https://docs.stripe.com/payments/payment-element.md).

Provide a list of card funding types to disallow in the Payment Element. Valid values are `credit`, `debit`, and `prepaid`.

You can't disallow every supported card funding type.

The Payment Element applies this option as client-side validation. It isn't server-side enforcement of your payment policy. See [Enforce card restrictions](https://docs.stripe.com/payments/customize-payment-methods.md#enforce-card-restrictions) for server-side enforcement options.

- `children`
  `Elements` renders its children once the Stripe object and Elements instance are ready.

### Example

```title
Mount Elements
```

## useStripe hook

The `useStripe` hook returns the initialized [Stripe.js](https://docs.stripe.com/js/initializing.md) instance from the `Elements` provider.
Use it to [confirm payments](https://docs.stripe.com/js/payment_intents/confirm_payment.md) and call other Stripe.js methods from inside
your React components.

If you need to access the Stripe object from a class component, use [ElementsConsumer](https://docs.stripe.com/react_stripe_js/elements/elements_consumer.md) instead.

### Return value

- `result`
  Returns the `Stripe` instance configured on the [provider](https://docs.stripe.com/js/elements/elements_provider.md), or `null` while it is still loading.

### Example

```title
Call useStripe
```

## useElements

To safely pass the payment information collected by the Payment Element to the Stripe API,
access the `Elements` instance so that you can use it with `stripe.confirmPayment`.

If you need to access an Element from a class component, use [ElementsConsumer](https://docs.stripe.com/react_stripe_js/elements/elements_consumer.md) instead.

### Return value

- `result`
  Returns the current `Elements` instance or `null` while the provider is still loading.

### Example

```title
Call useElements
```

## ElementsConsumer

`ElementsConsumer` exposes the same `Stripe` and `Elements` instances as the [hooks](https://docs.stripe.com/js/elements/use_stripe.md), but uses a render
prop instead of React hooks. This is useful when building class components or when you prefer the
render-prop pattern.

### Props

- `children`
  A render prop that receives `{stripe, elements}`. Render your UI using these instances.

### Example

```title
Render ElementsConsumer
```

## PaymentElement

Use the `PaymentElement` from `@stripe/react-stripe-js` to collect payment details for more
 than [40 payment methods](https://docs.stripe.com/docs/payments/payment-methods/integration-options.md) from around the globe.

The component must be rendered inside an [Elements Provider](https://docs.stripe.com/js/react_stripe_js/elements/elements_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating the Payment Element.
    - `layout`
      Specify the layout for the Payment Element: `'auto'`, `'accordion'`, or `'tabs'`. With `'auto'`, Stripe selects the layout automatically. If you only pass a layout type without any additional parameters, the Payment Element renders using that layout and the default values associated with it.

An object can also be passed to specify the layout with additional configuration.
      - `type`
        Defines the layout to render the Payment Element.
      - `defaultCollapsed`
        Controls if the Payment Element renders in a collapsed state (where no payment method is selected by default). When you leave this `undefined`, Stripe renders the experience that it determines will have the best conversion.
      - `radios`
        Controls when to render each Payment Method with a radio input next to its logo. The radios visually indicate the current selection of the Payment Element. Defaults to `'auto'`.

- `'always'` — Always show radio inputs.
- `'never'` — Never show radio inputs.
- `'if_multiple'` — Show radio inputs only when there are multiple payment methods available. When there is only one payment method, no radio input is displayed.
- `'auto'` — Stripe determines the best experience to optimize conversion.

_This property is only applicable to the `accordion` layout._
      - `spacedAccordionItems`
        When `true`, the Payment Methods render as standalone buttons with space in between them.

_This property is only applicable to the `accordion` layout._
      - `visibleAccordionItemsCount`
        Sets the max number of Payment Methods visible before using the "More" button to hide additional Payment Methods. Set this value to `0` to disable the "More" button and render all available Payment Methods. Default is `5`.

_This property is only applicable to the `accordion` layout._
      - `paymentMethodLogoPosition`
        Sets the position of the payment method logo in each accordion item. Default is `start`.

_This property is only applicable to the `accordion` layout._
    - `defaultValues`
      Provide initial customer information that will be displayed in the Payment Element.
The form will render with empty fields if not provided.
      - `billingDetails`
        Specify customer's billing details, which lets you pre-fill a customer’s name, email,
phone number and address if required by payment method. Pre-filling as much information
as possible streamlines the checkout process.
        - `name`
        - `email`
        - `phone`
        - `address`
          - `line1`
          - `line2`
          - `city`
            The name of a city, town, village, etc.
          - `state`
            The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
          - `country`
            Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
          - `postal_code`
            The postal code or ZIP code, also known as PIN code in India.
      - `paymentMethods`
        Specify customer's default information for different payment methods. Pre-filling as much information
as possible streamlines the checkout process.
        - `ideal`
          - `bank`
            A pre-filled iDEAL bank value for the Payment Element. Can only be one of the banks listed in the [iDEAL guide](https://docs.stripe.com/payments/ideal/accept-a-payment?ui=element.md#bank-reference) (e.g., `abn_amro`).
        - `payto`
          - `usePayId`
            When `true`, the PayTo payment method will default to showing the PayID input instead of BSB/account number fields. Customers can still switch between PayID and BSB/account number using the toggle link.
      - `card`
        Specify default settings for card payments.
        - `network`
          Specifies a network preference for [Card Brand Choice](https://docs.stripe.com/card-brand-choice.md). The first network in the array that matches a network on the entered co-branded card will be selected by default in the Card Brand Choice dropdown. See the [supported networks](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-card-networks-preferred) for valid values.
    - `business`
      Provide information about your business that will be displayed in the Payment Element.
This information will be retrieved from your Stripe account if not provided.
      - `name`
        The name of your business. Your business name will be used to render mandate text for some payment methods.
    - `paymentMethodOrder`
      By default, the Payment Element will use a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods are displayed in the Payment Element with a list of payment method types.

If the associated PaymentIntent has payment method types not specified in `paymentMethodOrder`, they will be displayed
after the payment methods you specify. If you specify payment method types not on the associated PaymentIntent, they will be ignored.
    - `fields`
      By default, the Payment Element collects all necessary details to complete a payment.

For some payment methods, the Payment Element collects details such as name or email
that you might have already collected from the customer. If this is the case, you can prevent the Payment Element
from collecting these details by using the `fields` option.

If you disable collecting certain fields
with the `fields` option, you must pass that same data to [stripe.confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment.md)
or we'll reject the payment.

You can set `billingDetails` at the top level to apply the same field collection settings to all payment methods,
or set `billingDetails` under a supported payment method type to override the top-level setting for that payment method.

Learn how to [customize the billing details to collect](https://docs.stripe.com/payments/payment-element/control-billing-details-collection.md) and
the [customized fields](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-customized_fields).
      - `billingDetails`
        Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
        - `name`
          Specify `always` to require the Payment Element to collect the customer's billing name.
        - `email`
          Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
        - `phone`
          Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
        - `address`
          Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
          - `line1`
          - `line2`
          - `city`
            The name of a city, town, village, etc.
          - `state`
            The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
          - `country`
            Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
          - `postalCode`
            The postal code or ZIP code, also known as PIN code in India.
      - `[paymentMethodType]`
        Optionally specify the billing detail collection settings for any Payment Element payment method type. Examples of valid values are `card`, `klarna`, or `us_bank_account`. You can include one or more payment method type keys.
        - `billingDetails`
          Specify `never` to avoid collecting all [billing details](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-billing_details)
in the Payment Element. If you would like to disable only certain billing details,
pass an object specifying which fields you would like to disable collection for.
The default setting for each field or object is `auto`.
          - `name`
            Specify `always` to require the Payment Element to collect the customer's billing name.
          - `email`
            Specify `never` to avoid collecting email in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.email=never` and `walletOptions.emailRequired=true`, email is still collected from wallets.
          - `phone`
            Specify `never` to avoid collecting phone in the Payment Element.

Note that this parameter is independent of [walletOptions](https://docs.stripe.com/js/elements_object/create_payment_element.md#payment_element_create-options-walletOptions), so if you set `fields.billingDetails.phone=never` and `walletOptions.phoneNumberRequired=true`, phone is still collected from wallets.
          - `address`
            Specify `if_required` to only collect the minimum billing address fields required to complete the payment.
You can omit and hide optional address fields in the card form, such as country and postal code.
Unlike the `never` option, you don't need to include fields omitted in the Payment Element when confirming the payment.
This can reduce the amount of information required to complete the form.

Disabling address collection can negatively impact authorization rates and network fees for users on a network cost plus pricing plan.
            - `line1`
            - `line2`
            - `city`
              The name of a city, town, village, etc.
            - `state`
              The most coarse subdivision of a country.
Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
            - `country`
              Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
            - `postalCode`
              The postal code or ZIP code, also known as PIN code in India.
    - `readOnly`
      Applies a read-only state to the Payment Element so that payment details can’t be changed. Default is false.

Enabling the `readOnly` option doesn't change the Payment Element's visual appearance. If you want to adjust the way the Payment Element looks, use the [Appearance API](https://docs.stripe.com/elements/appearance-api.md).
    - `terms`
      Control how mandates or other legal agreements are displayed in the Payment Element.
Use `never` to never display legal agreements. The default setting is `auto`, which causes
legal agreements to only be shown when necessary.

Consult your legal and compliance advisors before making any changes to the text of mandates or legal agreements. You can't use the `terms` option to violate obligations under your Stripe agreement, Stripe policies, applicable laws or scheme rules.
      - `applePay`
      - `auBecsDebit`
      - `bancontact`
      - `card`
      - `cashapp`
      - `googlePay`
      - `ideal`
      - `paypal`
      - `sepaDebit`
      - `sofort`
      - `usBankAccount`
    - `wallets`
      By default, the Payment Element will display all the payment
methods that the underlying Payment Intent was created with.

However, wallets like Apple Pay and Google Pay are not payment
methods per the Payment Intent API. They will show when the
Payment Intent has the `card` payment method and the customer is
using a supported platform and have an active card in their
account.  This is the `auto` behavior, and it is the default for
choice for all wallets.

If you do not want to show a given wallet as a payment option, you
can set its property in `wallets` to `never`.
      - `applePay`
      - `googlePay`
      - `link`
    - `walletOptions`
      Options to control the information collected from the customer when
paying with a wallet payment method.
      - `emailRequired`
        Collect the customer's email from wallet payment methods by setting this option to true.
      - `phoneNumberRequired`
        Collect the customer's phone number from wallet payment methods by setting this option to true.

PayPal doesn't provide a phone number, even when this option is set to true.

Google Pay makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.

Link makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.
    - `applePay`
      Specify Apple Pay specific options. These are passed through to the Apple Pay API.
      - `recurringPaymentRequest`
        Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `regularBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `trialBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `billingAgreement`
      - `deferredPaymentRequest`
        Specify a request to set up a deferred payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepaydeferredpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `deferredBilling`
          - `amount`
          - `amountType`
            Indicates whether the billing amount is known at request time. When set to 'final', the Apple Pay payment sheet shows the configured amount.
          - `label`
          - `deferredPaymentDate`
        - `billingAgreement`
        - `freeCancellationDate`
          If set, you must also supply a freeCancellationDateTimeZone.,
        - `freeCancellationDateTimeZone`
          "If set, you must also supply a freeCancellationDate.,
      - `automaticReloadPaymentRequest`
        Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `automaticReloadBilling`
          - `amount`
          - `label`
          - `automaticReloadPaymentThresholdAmount`
        - `billingAgreement`

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change?type=paymentElement.md#element_on_change-handler) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render PaymentElement
```

## ExpressCheckoutElement

Use the `ExpressCheckoutElement` from `@stripe/react-stripe-js` to accept payments through one-click payment buttons.

The component must be rendered inside an [Elements Provider](https://docs.stripe.com/js/react_stripe_js/elements/elements_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating the Express Checkout Element.
    - `allowedShippingCountries`
      By default, the Express Checkout Element allows all countries for shipping.

You can specify which countries are allowed for shipping in the Express Checkout Element with a list of two-letter country codes.
    - `applePay`
      Specify Apple Pay specific options. These are passed through to the Apple Pay API.
      - `recurringPaymentRequest`
        Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `regularBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `trialBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `billingAgreement`
      - `deferredPaymentRequest`
        Specify a request to set up a deferred payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepaydeferredpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `deferredBilling`
          - `amount`
          - `amountType`
            Indicates whether the billing amount is known at request time. When set to 'final', the Apple Pay payment sheet shows the configured amount.
          - `label`
          - `deferredPaymentDate`
        - `billingAgreement`
        - `freeCancellationDate`
          If set, you must also supply a freeCancellationDateTimeZone.
        - `freeCancellationDateTimeZone`
          If set, you must also supply a freeCancellationDate.

These are [tz](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) timezones such as `America/Los_Angeles`, `Europe/Dublin`, and `Asia/Singapore`.
      - `automaticReloadPaymentRequest`
        Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `automaticReloadBilling`
          - `amount`
          - `label`
          - `automaticReloadPaymentThresholdAmount`
        - `billingAgreement`
    - `billingAddressRequired`
      Controls whether the Express Checkout Element collects the billing address. The default value depends on your integration:

- If you pass `allowedShippingCountries`, `phoneNumberRequired`, `shippingAddressRequired`, `emailRequired`, `applePay`, `lineItems`, or `business` when creating the Express Checkout Element, `billingAddressRequired` defaults to false.
- Otherwise, `billingAddressRequired` defaults to true.

You can explicitly set `billingAddressRequired` to true or false to override the default behavior.

We highly recommend that you collect the billing address because it can be used to perform address verifications and block fraudulent payments.
    - `business`
      Provide information about your business that's displayed in the Express Checkout Element.
This information will be retrieved from your Stripe account if it's not provided.
      - `name`
        The name of your business. Your business name is used to signal to the customer who they're paying.

Klarna always retrieves the business name from your Stripe account, even when this option is set.
    - `buttonHeight`
      By default, the height of the buttons are 44px.

You can override this to specify a custom button height in the range of 40px-55px.
    - `buttonTheme`
      Specify the preferred button theme to use. By default, Elements determines the themes based on the specified [appearance option](https://docs.stripe.com/js/elements_object/create.md#stripe_elements-options-appearance).
      - `applePay`
      - `googlePay`
      - `paypal`
      - `klarna`
    - `buttonType`
      Specify the preferred button type to display.
      - `applePay`
        Default is `plain`.
      - `googlePay`
        Default is `buy`.
      - `paypal`
        Default is `paypal`.
      - `klarna`
        Default is `pay`.
    - `emailRequired`
      Collect the customer's email by setting this option to `true`.
    - `layout`
      Specify how the buttons are arranged in a grid-like layout in the Express Checkout Element.
Elements determines the layout by using certain factors, such as available space, number of buttons, and the defined `layout` object.
      - `maxColumns`
        Defines the maximum number of columns the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `maxRows`
        Defines the maximum number of rows the Express Checkout Element can use to render. Default is `0`, meaning unlimited.
      - `overflow`
        Specify whether or not to always hide the overflow menu or allow Elements to determine when to show the overflow menu. Default is `auto`.
You can't specify both `overflow: 'never'` and set `maxRows` to a number greater than 0.
    - `lineItems`
      An array of LineItem objects. These LineItems are shown as line items in the payment interface, if line items are supported.
You can represent discounts as negative amount LineItems.
      - `name`
        The name of the line item surfaced to the customer in the payment interface.
      - `amount`
        The amount in the currency's subunit (for example, cents, yen, etc.).
    - `paymentMethods`
      By default, the Express Checkout Element displays all payment
methods possible as a result of your Dashboard configuration. This is the `auto` behavior.

If you don't want to show a given payment method as a payment option, set its
property in `paymentMethods` to `never`.
      - `amazonPay`
      - `applePay`
        Apple Pay has additional configurations
that determine when Stripe can show it. By default, Apple Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.

If you want to always show Apple Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`. This causes Apple Pay to be shown in supported browsers even when the customer
isn't logged in to Apple Pay, resulting in a sign-in flow.

Apple Pay on non-Safari desktop browsers is only supported when its property in `paymentMethods` is set to `always`.
      - `googlePay`
        Google Pay has additional configurations
that determine when Stripe can show it. By default, Google Pay shows when the customer
is using a supported platform and when we determine it's advantageous for your conversion.
This is the `auto` behavior.

If you want to always show Google Pay when the customer is using a supported platform,
you can set its property in `paymentMethods` to `always`. This causes Google Pay to be shown in supported browsers even when the customer
isn't logged in to Google Pay, resulting in a sign-in flow.
      - `link`
      - `paypal`
      - `klarna`
    - `paymentMethodOrder`
      By default, the Express Checkout Element uses a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods display in the Express Checkout Element with a list of payment method types.

If there are payment methods that will show that are not specified in `paymentMethodOrder`, they display after the payment methods you specify. If you specify payment methods that will not show, they are ignored.
    - `phoneNumberRequired`
      Collect the customer's phone number by setting this option to `true`.

PayPal doesn't provide a phone number, even when this option is set to `true`.

Google Pay makes a best effort to return the phone number registered to the wallet, but doesn't guarantee it will be provided in all cases.
    - `shippingAddressRequired`
      Collect the customer's shipping address by setting this option to `true`.

If `true`, you must also supply a valid `shippingRates` option in either the `create`, `click`, or `shippingaddresschange` events.
    - `shippingRates`
      An array of ShippingRate objects. The first shipping rate listed appears in the payment interface as the default option.

PayPal will display only the first 10 shipping rates provided.
      - `id`
        Unique identifier for the object.
      - `amount`
        The amount to charge for shipping.
      - `displayName`
        The name of the shipping rate, displayed to the customer in the payment interface.
      - `deliveryEstimate`
        The estimated range for how long shipping takes, displayed to the customer in the payment interface.
We recommended using the object format, but you can use a string instead.
        - `maximum`
          The upper bound of the estimated range. If empty, it represents no upper bound (for example, infinite).
          - `unit`
            A unit of time.
          - `value`
            Must be greater than 0.
        - `minimum`
          The lower bound of the estimated range. If empty, it represents no lower bound.
          - `unit`
            A unit of time.
          - `value`
            Must be greater than 0.

- `onConfirm`
  The [confirm](https://docs.stripe.com/js/elements_object/express_checkout_element_confirm_event.md) event is triggered from an Express Checkout Element when the customer finalizes their payment.

- `onClick`
  The [click](https://docs.stripe.com/js/elements_object/express_checkout_element_click_event.md) event is triggered from an Express Checkout Element when the customer clicks a payment button.

- `onCancel`
  The `cancel` event is triggered from an Express Checkout Element when the payment interface is dismissed.

Note that in some browsers, the payment interface might be dismissed by the customer even after they authorize the payment.
This means that you might receive a `cancel` event after receiving a `confirm` event.
If you're using the `cancel` event as a hook for canceling the customer's order, make sure you also refund the payment that you just created.

- `onShippingAddressChange`
  Triggered when a customer changes their shipping address.

- `onShippingRateChange`
  Triggered when a customer changes their shipping rate.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render ExpressCheckoutElement
```

## AddressElement

Use the `AddressElement` from `@stripe/react-stripe-js` to collect local and international billing and shipping addresses.

The component must be rendered inside an [Elements Provider](https://docs.stripe.com/js/react_stripe_js/elements/elements_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating the Address Element.
    - `mode`
      Specify which mode you would like to use Address Element for.

When `shipping` mode is used with the Payment Element and Contact Details Element, it will automatically pass shipping information when confirming Payment Intent or Setup Intent.

When `billing` mode is used with the Payment Element, it will automatically pass the billing information when confirming Payment Intent or Setup Intent.
    - `autocomplete`
      By default, the Address Element will have autocomplete enabled with Stripe provided Google Maps API key for certain countries if any of the following condition is met:
* If Payment Element is mounted in the same elements group as Address Element in a single page application.
* If the Address Element is used in an active Link session (Link is also known as Onelink in the UK).

[Contact Legal before editing or deleting the Google Maps autocomplete callout]: #

By using autocomplete, you agree to comply with the [Google Maps Platform Acceptable Use Policy](https://cloud.google.com/maps-platform/terms/aup). If you violate this policy, we might disable autocomplete, or take any other action as necessary.

You can customize the autocomplete setting with this option.
      - `mode`
        Specify `disabled` to disable autocomplete in the Address Element.

Specify `google_maps_api` to enable [Google Maps API](https://developers.google.com/maps/documentation/javascript/places) with your own key. It will only be used when Stripe provided Google Maps API key is not available.

The default setting is `automatic`, where we’ll support autocomplete when possible.
      - `apiKey`
        Specify your own [Google Maps API key](https://developers.google.com/maps/documentation/javascript/places#add-places-api-to-the-api-keys-api-restrictions-list) with it.

**Only needs to be passed in when `autocomplete.mode` is set to `google_maps_api`.**
    - `allowedCountries`
      By default, the Address Element will display all countries for selection.

You can specify which countries are displayed in the Address Element with a list of two-letter country codes.
If only one country is specified, the country field will not display.
    - `blockPoBox`
      By default, PO boxes are considered a valid address type.

You can override this to invalidate PO Boxes.
    - `contacts`
      An array of objects that can be displayed as saved addresses
in the Address Element. The first contact will be automatically selected.

If using a [CustomerSession](https://docs.stripe.com/api/customer_sessions.md), Address Element will ignore contacts
and render saved billing addresses instead.
      - `name`
        The name of the contact. This might be a person, or a business name.
      - `address`
        The address of the contact.
        - `line1`
        - `line2`
        - `city`
          The name of a city, town, village, etc.
        - `state`
          The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
        - `postal_code`
          The postal code or ZIP code, also known as PIN code in India.
        - `country`
          Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
      - `phone`
        The phone number of the contact.

The [fields.phone](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-fields-phone) option must be set to `always` if this property is specified.
    - `defaultValues`
      Provide the initial information that will be displayed in the Address Element.
The form will render with empty fields if not provided.
      - `name`
        Provide the initial full name or organization name.
      - `firstName`
        Provide the initial first name.
The [display.name](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-display-name) option must be set to `split` if this property is specified.
      - `lastName`
        Provide the initial last name.
The [display.name](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-display-name) option must be set to `split` if this property is specified.
      - `phone`
        Provide the initial phone number value.
The [fields.phone](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-fields-phone) option must be set to `always` if this property is specified.
      - `address`
        Provide the initial address details.
        - `line1`
        - `line2`
        - `city`
        - `state`
        - `postal_code`
        - `country`
    - `fields`
      By default, the Address Element will collect all the necessary information needed for an address.
In some cases, it might be necessary to collect other types of information. You can specify other types of fields to render
in the form with this option.
      - `phone`
        Specify `always` to enable phone number collection in the Address Element.
Only collect phone numbers if you need them for the transaction. Default is `auto`.
    - `validation`
      By default, the Address Element will enforce preset validation for each field.
You can customize the settings by using this option.
      - `phone`
        - `required`
          Specify `always` to make phone number a required field.
The [fields.phone](https://docs.stripe.com/js/elements_object/create_address_element.md#address_element_create-options-fields-phone) option must be set to `always` if this property is specified.
Default is `auto`.
    - `display`
      You can customize how certain fields are displayed.
      - `name`
        By default, the Address Element will display a full name field.
Specify 'split' to display a first name field and a last name field.
Specify 'organization' to display an organization field.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change?type=addressElement.md#element_on_change-handler) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render AddressElement
```

## ContactDetailsElement

Use the `ContactDetailsElement` from `@stripe/react-stripe-js` to collect email addresses
and allow users to log into Link on your checkout page. This element was previously known
as the Link Authentication Element.

The component must be rendered inside an [Elements Provider](https://docs.stripe.com/js/react_stripe_js/elements/elements_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating the Contact Details Element.
    - `defaultValues`
      Provide the initial contact information that will be displayed in the Contact Details Element.
The form will render with empty fields if not provided.
      - `email`

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change?type=contactDetailsElement.md#element_on_change-handler) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render ContactDetailsElement
```

## TaxIdElement

Use the `TaxIdElement` from `@stripe/react-stripe-js` to collect tax ID information
from your customers, including business name and tax identification number.

The component must be rendered inside an [Elements Provider](https://docs.stripe.com/js/react_stripe_js/elements/elements_provider.md).

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Tax ID Element initialization options.
    - `visibility`
      By default, the Tax ID Element displays when the user is in a country that supports tax ID collection.
Specify `always` to display the element regardless of the user's country.
Specify `never` to hide the element completely.
    - `fields`
      By default, the Tax ID Element collects all tax ID information.

If it's not necessary for you to collect all fields, you can disable Tax ID Element collection of certain fields with the `fields` option.
      - `businessName`
        Specify `always` to collect the business name.
Specify `never` to not collect the business name.
Default is `auto`.
    - `validation`
      By default, the Tax ID Element will enforce preset validation for each field. You can customize the settings by using this option.
      - `businessName`
        - `required`
          Specify `always` to make business name a required field.
Specify `never` to make business name an optional field.
Default is `auto`.
      - `taxId`
        - `required`
          Specify `always` to make tax ID a required field.
Specify `never` to make tax ID an optional field.
Default is `auto`.
    - `verification`
      Configure real-time tax ID verification.
Requires a [Tax Complete subscription or Tax Custom pricing](https://stripe.com/tax/pricing).
If your account isn't eligible, the Tax ID Element emits a [loaderror](https://docs.stripe.com/js/element/events/on_loaderror.md) event.
      - `taxId`
        - `mode`
          Specify `if_supported` to enable real-time tax ID verification for supported tax ID types.
Specify `never` to disable verification.
Default is `never`.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change?type=taxIdElement.md#element_on_change-handler) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoaderStart`
  Callback called right before Stripe displays the Element skeleton loader.
Receives the Element instance as its only argument.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render TaxIdElement
```

## Other Element Components

Additional Element wrappers from `@stripe/react-stripe-js` provide specialized payment methods and
input fields. Use these components inside an [Elements Provider](https://docs.stripe.com/js/react_stripe_js/elements/elements_provider.md) alongside the standard Element set when
you need to support specific payment experiences.

## AuBankAccountElement

Use the `AuBankAccountElement` from `@stripe/react-stripe-js` to collect Australian bank account information (BSB and account number) for use with BECS Direct Debit payments.

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating an `auBankAccount` element.
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
      Customize the appearance of this element using CSS properties passed in a [Style](https://docs.stripe.com/js/appendix/style.md) object.
    - `iconStyle`
      Appearance of the icon in the Element.
Either `solid` or `default`.
    - `hideIcon`
      Hides the icon in the Element.
Default is `false`.
    - `disabled`
      Applies a disabled state to the Element such that user input is not accepted.
Default is `false`.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change.md?type=auBankAccountElement) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

### Example

```title
Render AuBankAccountElement
```

## CardElement

Use the `CardElement` from `@stripe/react-stripe-js` to collect card details with automatic validation.

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating a `card` element.
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
      Customize the appearance of this element using CSS properties passed in a [Style](https://docs.stripe.com/js/appendix/style.md) object.
    - `value`
      A pre-filled set of values to include in the input.
Note that sensitive card information (card number, CVC, and expiration date) cannot be pre-filled.
      - `postalCode`
    - `hidePostalCode`
      Hide the postal code field.
Default is `false`.
If you are already collecting a full billing address or postal code elsewhere, set this to `true`.
    - `iconStyle`
      Appearance of the icon in the Element.
Either `solid` or `default`.
    - `hideIcon`
      Hides the icon in the Element.
Default is `false`.
    - `disabled`
      Applies a disabled state to the Element such that user input is not accepted.
Default is `false`.
    - `disableLink`
      Disables and hides the Link button in the Element.
Default is `false`.
You can also disable Link across all instances of `card` and `cardNumber` elements in your [payment method settings](https://dashboard.stripe.com/settings/payment_methods).
    - `preferredNetwork`
      Specifies a network preference for [Card Brand Choice](https://docs.stripe.com/card-brand-choice.md). The first network in the array that matches a
network on the entered co-branded card will be selected by default in the Card Brand Choice dropdown. See the
[supported networks](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-card-networks-preferred) for valid values.

If you specify a value for `preferredNetwork` at create time, [hideIcon](#elements_create-options-hideIcon) must not be true
(so that the Card Brand Choice dropdown can appear) and you cannot specify
[payment_method_options.card.network](https://docs.stripe.com/js/payment_intents/confirm_card_payment.md#stripe_confirm_card_payment-data-payment_method_options-card-network)
at confirm time.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change.md?type=cardElement) changes.

- `onNetworksChange`
  Callback called when the available card networks change.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render CardElement
```

## CardCvcElement

Use the `CardCvcElement` from `@stripe/react-stripe-js` to collect the card's expiration date
independently from other card fields.

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating a `cardCvc` element.
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
      Customize the appearance of this element using CSS properties passed in a [Style](https://docs.stripe.com/js/appendix/style.md) object.
    - `placeholder`
      Customize the placeholder text.
    - `disabled`
      Applies a disabled state to the Element such that user input is not accepted.
Default is `false`.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change.md?type=cardCvcElement) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

### Example

```title
Render CardCvcElement
```

## CardExpiryElement

Use the `CardExpiryElement` from `@stripe/react-stripe-js` to collect the card's expiration date
independently from other card fields.

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating a `cardExpiry` element.
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
      Customize the appearance of this element using CSS properties passed in a [Style](https://docs.stripe.com/js/appendix/style.md) object.
    - `placeholder`
      Customize the placeholder text.
    - `disabled`
      Applies a disabled state to the Element such that user input is not accepted.
Default is `false`.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change.md?type=cardExpiryElement) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render CardExpiryElement
```

## CardNumberElement

Use the `CardNumberElement` from `@stripe/react-stripe-js` to collect the PAN (primary account number) independently
while rendering Card CVC and expiration in separate Elements.

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating a `cardNumber` element.
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
      Customize the appearance of this element using CSS properties passed in a [Style](https://docs.stripe.com/js/appendix/style.md) object.
    - `placeholder`
      Customize the placeholder text.
    - `disabled`
      Applies a disabled state to the Element such that user input is not accepted.
Default is `false`.
    - `showIcon`
      Show a card brand icon in the Element.
Default is `false`.
    - `iconStyle`
      Appearance of the icon in the Element.
Either `solid` or `default`.
    - `disableLink`
      Disables and hides the Link button in the Element.
Default is `false`.
You can also disable Link across all instances of `card` and `cardNumber` elements in your [payment method settings](https://dashboard.stripe.com/settings/payment_methods).
    - `preferredNetwork`
      Specifies a network preference for [Card Brand Choice](https://docs.stripe.com/card-brand-choice.md). The first network in the array that matches a
network on the entered co-branded card will be selected by default in the Card Brand Choice dropdown. See the
[supported networks](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-card-networks-preferred) for valid values.

If you specify a value for `preferredNetwork` at create time, [showIcon](#elements_create-options-showIcon) must be true
(so that the Card Brand Choice dropdown can appear) and you cannot specify
[payment_method_options.card.network](https://docs.stripe.com/js/payment_intents/confirm_card_payment.md#stripe_confirm_card_payment-data-payment_method_options-card-network)
at confirm time.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change.md?type=cardNumberElement) changes.

- `onNetworksChange`
  Callback called when the available card networks change.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

- `onLoadError`
  Callback called when the Element fails to load.

### Example

```title
Render CardNumberElement
```

## IbanElement

Use the `IbanElement` from `@stripe/react-stripe-js` to collect International Bank Account Numbers
(IBANs) for SEPA Direct Debit and similar payment methods.

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for creating an `iban` element.
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
      Customize the appearance of this element using CSS properties passed in a [Style](https://docs.stripe.com/js/appendix/style.md) object.
    - `supportedCountries`
      Specify the list of countries or country-groups whose IBANs you want to allow.
Must be `['SEPA']`.
    - `placeholderCountry`
      Customize the country and format of the placeholder IBAN.
Default is `DE`.
    - `iconStyle`
      Appearance of the icon in the Element.
Either `solid` or `default`.
    - `hideIcon`
      Hides the icon in the Element.
Default is `false`.
    - `disabled`
      Applies a disabled state to the Element such that user input is not accepted.
Default is `false`.

- `onChange`
  Callback called when any value in the [change event payload](https://docs.stripe.com/js/element/events/on_change.md?type=ibanElement) changes.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

- `onEscape`
  Callback called when the escape key is pressed within the Element.

### Example

```title
Render IbanElement
```

## PaymentMethodMessagingElement

Use the `PaymentMethodMessagingElement` from `@stripe/react-stripe-js` to inform a customer about available buy-now-pay-later plans.

### Props

- `id`
  Sets the DOM `id` attribute on the rendered Element container. Use this to
target the Element for styling or testing.

- `className`
  Applies custom CSS classes to the Element container.

- `options`
  Options for displaying a `paymentMethodMessaging` element. [See visual examples in the docs.](https://docs.stripe.com/payments/payment-method-messaging.md)
    - `amount`
      The total amount in the [smallest currency unit](https://docs.stripe.com/currencies.md#zero-decimal).
    - `currency`
      The currency. One of `AUD`, `CAD`, `CHF`, `CZK`, `DKK`, `EUR`, `GBP`, `NOK`, `NZD`, `PLN`, `RON`, `SEK`, `USD`.
    - `countryCode`
      The end-buyer country. One of `AT`, `AU`, `BE`, `CA`, `CH`, `CZ`, `DE`, `DK`, `ES`, `FI`,
`FR`, `GB`, `GR`, `IE`, `IT`, `NL`, `NO`, `NZ`, `PL`, `PT`, `RO`, `SE`, `US`.

If not set, the buyer's country will be inferred from the request.
    - `paymentMethodTypes`
      A list of payment method types to render. You can omit this attribute to manage your payment methods from the [Stripe Dashboard](https://dashboard.stripe.com/settings/payment_methods). Any combination of `affirm`, `afterpay_clearpay`, `klarna`.
    - `paymentMethodOrder`
      By default, the Payment Method Messaging Element uses a dynamic ordering that optimizes payment method display for each user.

You can override the default order in which payment methods display in the Payment Method Messaging Element with a list of payment method types.

If there are payment methods that will show that aren't specified in `paymentMethodOrder`, they display after the payment methods you specify. If you specify payment methods that won't show, they are ignored.

- `onReady`
  Callback called once the Element is fully rendered.
Recieves the [ready event payload](https://docs.stripe.com/js/element/events/on_ready.md#element_on_ready-handler).

- `onBlur`
  Callback called when the Element loses focus.

- `onFocus`
  Callback called when the Element receives focus.

### Example

```title
Render PaymentMethodMessagingElement
```

## Payment Intents

Accept global payments online with the [Payment Intents APIs](https://docs.stripe.com/payments/payment-intents.md).
For step-by-step instructions on using the Payment Intents APIs, see the [accept a payment guide](https://docs.stripe.com/payments/accept-a-payment.md).

The following Stripe.js methods are available to use as part of your integration.

## Confirm a payment

`stripe.confirmPayment(options: object)`

Use `stripe.confirmPayment` to confirm a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) using data collected
by the [Payment Element](https://docs.stripe.com/js/element/payment_element.md), or with manually provided data via `confirmParams`.
When called, `stripe.confirmPayment` will attempt to complete any [required actions](https://docs.stripe.com/payments/intents.md),
such as authenticating your user by displaying a 3DS dialog or redirecting them to a bank authorization page.
Your user will be redirected to the `return_url` you pass once the confirmation is complete.

> The `stripe.confirmPayment` might take several seconds to complete.
> During that time, disable your form from being resubmitted and show a waiting indicator, such as a spinner. If you receive an error result, show this error to the user, re-enable the form, and hide the waiting indicator.

- `options`
    - `elements`
      The [Elements](#payment_element_create) instance used to create the Payment Element.

Required if you [collect payment details before creating an Intent](https://docs.stripe.com/payments/accept-a-payment-deferred.md?platform=web&type=payment). It's always required if you don't provide a `clientSecret`.
    - `clientSecret`
      The PaymentIntent's client secret.

Required if you [collect payment details before creating an Intent](https://docs.stripe.com/payments/accept-a-payment-deferred.md?platform=web&type=payment). It's always required if you don't provide an `elements` instance containing a [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret).
    - `confirmParams`
      Parameters that will be passed on to the Stripe API. You can also use the parameters from the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md), except for setup_future_usage.
      - `return_url`
        The URL that Stripe redirects your customer to after they complete the payment.

You can use the following query parameters, `payment_intent` (the PaymentIntent's ID) or `payment_intent_client_secret` (the PaymentIntent's client secret), to retrieve the PaymentIntent's [status](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-status). When Stripe redirects your customer, the resulting URL has these query parameters appended. You can also append your own query parameters to the `return_url`, which persist through the redirect process.

If you don't want to redirect for card payments after payment completion, set [redirect](https://docs.stripe.com/js/payment_intents/confirm_payment.md#confirm_payment_intent-options-redirect) to `if_required`.
      - `shipping`
        The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment, if collected.

**Note**: When the [Address Element](https://docs.stripe.com/js/element/address_element.md) in shipping mode is being used, shipping address details are collected from the Address Element and passed
to the PaymentIntents [confirm endpoint](https://docs.stripe.com/api/payment_intents/confirm.md) as the [shipping](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping)
parameter.
You can also include additional `shipping` fields, which will be merged with the data collected from the Element.
Values passed here will override details collected by Elements.
      - `confirmation_token`
        If collected previously, the ID of the ConfirmationToken to use to confirm this PaymentIntent. This is mutually exclusive with the `elements` parameter.
      - `payment_method`
        If collected previously, the ID of the payment method to attach to this PaymentIntent. This is mutually exclusive with the `elements` parameter.
      - `payment_method_data`
        When you call `stripe.confirmPayment`, payment details are collected from the Element and passed to the PaymentIntents
[confirm endpoint](https://docs.stripe.com/api/payment_intents/confirm.md) as the [payment_method_data](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-payment_method_data)
parameter. You can also include additional `payment_method_data` fields, which will be merged with the data collected from the Element.
        - `billing_details`
          The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
Details collected by Elements will override values passed here.
If you set any billing fields to `never` in the Payment Element's `fields` option, you must pass those values here.

**Note**: When the [Address Element](https://docs.stripe.com/js/element/address_element.md) in billing mode is being used, billing address details are collected from the Address Element and passed
to the PaymentIntents [confirm endpoint](https://docs.stripe.com/api/payment_intents/confirm.md) as the [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details)
parameter. The values collected from the Address Element will take precedence.
        - `allow_redisplay`
          Indicates whether the payment method can be displayed to the customer in subsequent checkout flows. The value passed here will override the [allow_redisplay](docs/api/payment_methods/object#payment_method_object-allow_redisplay) determined by the provided `elements` parameter.
      - `expand`
        An array of pass through [PaymentIntent](https://docs.stripe.com/api/payment_intents/object.md) expansion parameters ([learn more](https://docs.stripe.com/api/expanding_objects.md)).
    - `redirect`
      By default, `stripe.confirmPayment` will always redirect to your `return_url` after a successful confirmation.
If you set `redirect: "if_required"`, then `stripe.confirmPayment` will only redirect if your user chooses a redirect-based payment method.

**Note**: Setting `if_required` requires that you handle successful confirmations for redirect-based and non-redirect based payment methods separately.
When a non-redirect based payment method is successfully confirmed, `stripe.confirmPayment` will resolve with a `{paymentIntent}` object.

### Example

```title
Confirm a payment intent
```

## Confirm a PaymentIntent by payment method

Below are a number of methods used to confirm a PaymentIntent for a specific payment method type.

## Confirm a card payment

`stripe.confirmCardPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmCardPayment` when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide and carry out 3DS or other next actions if they are required.

If you are using [Dynamic 3D Secure](https://docs.stripe.com/payments/3d-secure.md#three-ds-radar), `stripe.confirmCardPayment` will trigger your Radar rules to execute and may open a dialog for your customer to authenticate their payment.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
It can also be called with an existing `PaymentMethod`, or if you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmCardPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.confirmCardPayment` may trigger a [3D Secure](https://docs.stripe.com/payments/3d-secure.md) authentication challenge.
> This will be shown in a modal dialog and may be confusing for customers using assistive technologies like screen readers.
> You should make your form accessible by ensuring that success or error messages are clearly read out after this method completes.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `shipping`
      The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment, if collected.
    - `return_url`
      If you are [handling next actions yourself](https://docs.stripe.com/payments/payment-intents/verifying-status.md#next-actions), pass in a `return_url`.
If the subsequent action is `redirect_to_url`, this URL will be used on the return path for the redirect.
    - `receipt_email`
      Email address that the receipt for the resulting payment will be sent to.
    - `setup_future_usage`
      Indicates that you intend to make future payments with this PaymentIntent's payment method.

If present, the payment method used with this PaymentIntent can be [attached to a Customer](https://docs.stripe.com/api/payment_methods/attach.md), even after the transaction completes.

Use `on_session` if you intend to only reuse the payment method when your customer is present in your checkout flow.
Use `off_session` if your customer may or may not be in your checkout flow.
See [saving card details during payment](https://docs.stripe.com/payments/advanced/save-during-payment.md) to learn more.

Stripe uses `setup_future_usage` to dynamically optimize your payment flow and comply with regional legislation and network rules.
For example, if your customer is impacted by [SCA](https://docs.stripe.com/strong-customer-authentication.md), using `off_session` will ensure that they are authenticated while processing this PaymentIntent.
You will then be able to collect [off-session payments](https://docs.stripe.com/payments/cards/charging-saved-cards.md#off-session-payments-with-saved-cards) for this customer.
    - `payment_method_options`
      An object containing payment-method-specific configuration to confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with.
      - `card`
        Configuration for this card payment.
        - `cvc`
          Use the provided `cardCvc` [Element](https://docs.stripe.com/js/element.md) when confirming the PaymentIntent with an existing PaymentMethod.
        - `network`
          Selected network to process this PaymentIntent on. Depends on the [available networks](https://docs.stripe.com/card-brand-choice.md#identifying-the-available-card-networks) of the card attached to the PaymentIntent. Can only be set at confirm-time.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [handle next actions yourself](https://docs.stripe.com/payments/payment-intents/verifying-status.md#next-actions), or if you want to defer next action handling until later (e.g. for use in the [PaymentRequest API](https://docs.stripe.com/stripe-js/elements/payment-request-button.md#complete-payment-intents)).
Default is `true`.

### with payment data from an Element

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected by a `card` or `cardNumber` [Element](https://docs.stripe.com/js/element.md).
    - `card`
      Uses the provided `card` or `cardNumber` [Element](https://docs.stripe.com/js/element.md) for confirmation.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.

### Example

```title
Confirm with an Element
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with existing payment method
```

### with an existing token

### Data argument properties

- `payment_method`
  Pass an object to confirm using an existing token.
    - `card`
      An object of card data.
      - `token`
        Converts the provided token into a `PaymentMethod` to use for confirmation.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.

### Example

```title
Confirm with existing token
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a card payment
```

## Confirm an ACH Direct Debit payment

`stripe.confirmUsBankAccountPayment(clientSecret: string, data?: object)`

Use `stripe.confirmUsBankAccountPayment` in the [Accept a payment flow](https://docs.stripe.com/payments/ach-direct-debit/accept-a-payment.md) for the [ACH Direct Debit](https://docs.stripe.com/payments/ach-direct-debit.md) payment method to record the customer’s authorization for payment.

When you confirm a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md), it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
We suggest using `stripe.collectBankAccountForPayment`, which automatically collects bank account details and attaches a `PaymentMethod`. You may also choose to reuse an existing `PaymentMethod` or manually collect bank account details  using the `data` parameter. These use cases are detailed in the sections that follow.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

### with an existing PaymentMethod

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with an existing PaymentMethod
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### with self collected bank account information

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` is required. Providing `email` allows your customer to receive [ACH Direct Debit mandate and microdeposit emails](https://docs.stripe.com/payments/ach-direct-debit.md#mandate-and-microdeposit-emails).
      - `name`
        The customer's name. The first and last name must be at minimum 2 characters each.
      - `email`
        The customer's email.
    - `us_bank_account`
      The customer's [bank account information](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-us_bank_account).
      - `account_number`
        The customer’s bank account number.
      - `routing_number`
        The routing number of the customer’s bank.
      - `account_holder_type`
        Account holder type: individual or company.
      - `account_type`
        Account type: checkings or savings. Defaults to checking if omitted.

### Example

```title
Confirm with bank account information
```

### Example

```title
Confirm an ACH Direct Debit payment
```

## Confirm a Canadian pre-authorized debit payment

`stripe.confirmAcssDebitPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmAcssDebitPayment` in the [Accept a payment](https://docs.stripe.com/payments/accept-a-payment.md) flow for the [Canadian pre-authorized debit](https://docs.stripe.com/payments/acss-debit.md) payment method when the customer submits your payment form.
When called, it will automatically load an on-page modal UI to collect bank account details and verification, accept a hosted mandate agreement, and confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) when the user submits the form.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/acss-debit/accept-a-payment.md) for more details.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
`stripe.confirmAcssDebitPayment` automatically creates a new `PaymentMethod` for you when your customer completes the modal UI.
It can also be called with an existing `PaymentMethod`, which will load the modal UI to collect a new mandate agreement.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmAcssDebitPayment` may take several seconds to complete.
> During that time, disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, show it to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

- `options`
  An options object to control the behavior of this method.
    - `skipMandate`
      Set this to `true` if you want to skip displaying the mandate confirmation.

### with a new PaymentMethod

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name. The first and last name must be at minimum 2 characters each.
      - `email`
        The customer's email.

### Example

```title
Confirm with a new PaymentMethod
```

### with an existing PaymentMethod

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with an existing PaymentMethod
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### with self collected bank account information

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name. The first and last name must be at minimum 2 characters each.
      - `email`
        The customer's email.
    - `acss_debit`
      The customer's [bank account information](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-acss_debit).
      - `account_number`
        The customer’s bank account number.
      - `institution_number`
        The institution number of the customer’s bank.
      - `transit_number`
        The transit number of the customer’s bank.

### Example

```title
Confirm with bank account information
```

### with an existing PaymentMethod but skip mandate display

### Data and options argument paramters

- `data`
  Data to be sent with the request.
    - `payment_method`
      The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

- `options`
  An options object to control the behavior of this method.
    - `skipMandate`
      Set to `true` to skip the on-page modal UI.

### Example

```title
Confirm with an existing PaymentMethod but skip mandate display
```

### Example

```title
Confirm Canadian pre-authorized debit payment
```

## Confirm an Affirm payment

`stripe.confirmAffirmPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmAffirmPayment` in the Affirm payment method creation flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmAffirmPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `shipping`
      The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment.
      - `name`
      - `address`
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/affirm/accept-a-payment.md#handle-redirect).
Default is `true`.

### without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment.
      - `email`
      - `name`
      - `address`

- `shipping`
  The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment.
    - `name`
    - `address`

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm without existing payment method
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `shipping`
  The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment.
    - `name`
    - `address`

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm an Affirm payment
```

## Confirm an Afterpay Clearpay payment

`stripe.confirmAfterpayClearpayPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmAfterpayClearpayPayment` in the Afterpay Clearpay payment method creation flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmAfterpayClearpayPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/afterpay-clearpay/accept-a-payment.md#handle-redirect).
Default is `true`.

### without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment.
      - `email`
      - `name`
      - `address`

- `shipping`
  The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment.
    - `name`
    - `address`

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm without existing payment method
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm an Afterpay Clearpay payment
```

## Confirm an Alipay payment

`stripe.confirmAlipayPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmAlipayPayment` in the Alipay payment method creation flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmAlipayPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/ideal.md#handle-redirect).
Default is `true`.

### Without an existing payment method

### Data argument properties

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm without existing payment method
```

### With an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### With an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm an Alipay payment
```

## Confirm a BECS Debit payment

`stripe.confirmAuBecsDebitPayment(clientSecret: string, data?: object)`

Use `stripe.confirmAuBecsDebitPayment` in the [BECS Direct Debit Payments](https://docs.stripe.com/payments/au-becs-debit.md) with Payment Methods flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/au-becs-debit.md) for more details.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new PaymentMethod for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmAuBecsDebitPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.
    - `setup_future_usage`
      To set up the BECS Direct Debit account for reuse, set this
parameter to `off_session`. BECS Direct Debit only accepts an
`off_session` value for this parameter. If a `customer` is
provided on this [PaymentIntent](https://docs.stripe.com/api/payment_intents.md),
the [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) will be attached
to the customer when the PaymentIntent transitions to
`processing`.

### with payment data from an Element

### Data argument properties

- `payment_method`
  Pass an `object` to confirm the payment using data collected by an `auBankAccount` [Element](https://docs.stripe.com/js/element.md).
    - `au_becs_debit`
      An `auBankAccount` Element.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The account holder's name.
      - `email`
        The customer's email.

### Example

```title
Confirm with an Element
```

### with self collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected without an `Element`.
    - `au_becs_debit`
      - `bsb_number`
        A Bank State Branch (BSB) number.
      - `account_number`
        A bank account number.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The account holder's name.
      - `email`
        The customer's email.

### Example

```title
Confirm with self collected data
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a BECS Debit payment
```

## Confirm a Bancontact payment

`stripe.confirmBancontactPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmBancontactPayment` in the [Bancontact Payments with Payment Methods](https://docs.stripe.com/payments/bancontact/accept-a-payment.md) flow when the customer submits your payment form.
When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmBancontactPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/bancontact/accept-a-payment?platform=web.md#handle-redirect).
Default is `true`.

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm with the customer's name.
    - `billing_details`
      An object detailing billing information.
      - `name`
        The customer's name.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with self collected data
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Bancontact payment
```

## Confirm a BLIK payment

`stripe.confirmBlikPayment(clientSecret: string, data: object, options?: object)`

Use `stripe.confirmBlikPayment` in the [BLIK Payments with Payment Methods](https://docs.stripe.com/payments/blik.md) flow when the customer submits your payment form.
When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically prompt the customer to authorize the transaction.

> Note that `stripe.confirmBlikPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method_options`
      An object that contains transaction specific data.
      - `code`
        Your customer's 6-digit BLIK code.
    - `payment_method`
      Use this parameter to supply additional data relevant to the transaction, such as billing details.
      - `billing_details`
        The [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the transaction.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to manually determine if the confirmation has succeeded or failed.

### Example

```title
Confirm a BLIK payment
```

## Confirm a Boleto payment

`stripe.confirmBoletoPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmBoletoPayment` in the [Boleto Payment](https://docs.stripe.com/payments/boleto.md) with Payment Methods flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/boleto.md) for more details.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new PaymentMethod for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmBoletoPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set to `false`.
The Boleto private beta does not handle the next actions for you automatically (e.g. display Boleto details). Please refer to our [Stripe Boleto integration guide](https://docs.stripe.com/payments/boleto.md) for more info.

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `boleto`
      - `tax_id`
        The customer's Brazilian tax id (CPF/CNPJ).
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name`, `email` and `address`.
      - `name`
        The customer's name. The first and last name must be at minimum 2 characters each.
      - `email`
        The customer's email.
      - `address`
        The customer's address: street name, city, state and postal code
        - `line1`
          The customer's address line 1 (e.g. street or company name).
        - `line2`
          The customer's address line 2 (e.g. apartment, suite, unit, or building).
        - `city`
          The customer's address city (e.g. Sao Paulo).
        - `state`
          The customer's address state (e.g. SP).
        - `postal_code`
          The customer's CEP (i.e. Brazilian postal code). Must be 8 digits long.
        - `country`
          Must be BR.

### Example

```title
Confirm with collected data
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Boleto payment
```

## Confirm a Customer Balance payment

`stripe.confirmCustomerBalancePayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmCustomerBalancePayment` in the [Customer Balance](https://docs.stripe.com/payments/customer-balance.md) payment flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide.
Refer to our [integration guide](https://docs.stripe.com/payments/bank-transfers/accept-a-payment.md) for more details.

Since the [Customer Balance](https://docs.stripe.com/payments/customer-balance.md) payment method draws from a balance, the attempt will succeed or fail depending on the current balance amount.
To collect more funds from the customer when the cash balance is insufficient, use the customer balance with [bank transfer funding](https://docs.stripe.com/payments/bank-transfers/accept-a-payment.md) parameters.

The confirmation attempt will finish in one of the following result states:
1. If the customer balance is greater than or equal to the amount, the PaymentIntent response will have a `status` of `succeeded`. The `funding_type` will be ignored.
2. If the customer balance is less than the amount, and you do not set the `funding_type`, the PaymentIntent response will have a `status` of `requires_payment_method`.
3. If the customer balance is less than the amount, and you set the `funding_type`, the PaymentIntent response will have a `status` of `requires_action`. The `paymentIntent.next_action.display_bank_transfer_instructions` hash will contain bank transfer details for funding the [Customer Balance](https://docs.stripe.com/payments/customer-balance.md).

> Note that `stripe.confirmCustomerBalancePayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      An object specifying the `customer_balance` type.
      - `customer_balance`
        Set to `{}`.
    - `payment_method_options`
      Additional payment specific configuration options. See the [with collected data](#stripe_confirm_customer_balance_payment-collected) use case below.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set to `false`.
The [Customer Balance](https://docs.stripe.com/payments/customer-balance.md) does not handle the next actions for you automatically (e.g. displaying bank transfer details). To make future upgrades easier, this option is required to always be sent. Please refer to our [Stripe Customer Balance integration guide](https://docs.stripe.com/payments/bank-transfers.md) for more info.

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `customer_balance`
      Set to `{}`.

- `payment_method_options`
  Additional payment-specific configuration options.
    - `funding_type`
      The funding method type to be used when there are not enough funds in the [Customer Balance](https://docs.stripe.com/payments/customer-balance.md). Permitted values include: `bank_transfer`.
    - `bank_transfer`
      The customer's chosen bank transfer method.
      - `type`
        The list of bank transfer types allowed to use for funding. Permitted values include: `us_bank_account`, `eu_bank_account`, `id_bank_account`, `gb_bank_account`, `jp_bank_account`, or `mx_bank_account`.
      - `eu_bank_account`
        Details for the customer's EU bank account transfer.
Required if the type is `eu_bank_account`.
        - `country`
          The desired country code of the bank account information. Permitted values include: `DE`, `ES`, `FR`, `IE`, `NL`.
      - `id_bank_account`
        Details for the customer's Indonesian bank account transfer.
Required if the type is `id_bank_account`.
        - `bank`
          Bank where the account is held. One of `bca`, `bni`.
      - `requested_address_types`
        List of address types that should be returned in the financial_addresses response. If not specified, all valid types will be returned. Permitted values include: `aba`, `swift`, `sort_code`, `zengin`, `iban`, `spei`, `id_bban`, or `sepa`.

### Example

```title
Confirm with collected data
```

### Example

```title
Confirm a Customer Balance payment
```

## Confirm a Cash App Pay payment

`stripe.confirmCashappPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmCashappPayment` in the Cash App Pay payment method creation flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide and handle the [NextAction](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-next_action) for the customer to authorize the payment.

When you confirm a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md), it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmCashappPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you would like to [handle displaying the Cash App Pay QR code or handle the authorization redirect](https://docs.stripe.com/payments/cash-app-pay/accept-a-payment?platform=web&ui=API.md#handle-redirect) yourself.

### Without an existing payment method

### Data argument properties

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm without existing payment method
```

### With an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### With an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Cash App Pay payment
```

## Confirm an EPS payment

`stripe.confirmEpsPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmEpsPayment` in the [EPS Payments with Payment Methods](https://docs.stripe.com/payments/eps/accept-a-payment.md) flow when the customer submits your payment form.
When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmEpsPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/eps/accept-a-payment?platform=web.md#handle-redirect).
Default is `true`.

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm with the customer's name.
    - `billing_details`
      An object detailing billing information.
      - `name`
        The customer's name.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with self collected data
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm an EPS payment
```

## Confirm an FPX payment

`stripe.confirmFpxPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmFpxPayment` in the [FPX payment method creation](https://docs.stripe.com/stripe-js/elements/fpx-bank.md) flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmFpxPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/fpx/accept-a-payment.md#handle-redirect).
Default is `true`.

### with payment data from an Element

### Data argument properties

- `payment_method`
  Pass an `object` to confirm using data collected by an `fpxBank` [Element](https://docs.stripe.com/js/element.md).
    - `fpx`
      An `fpxBank` [Element](https://docs.stripe.com/js/element.md).

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with an Element
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with self collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected by an `fpxBank` [Element](https://docs.stripe.com/js/element.md).
    - `fpx`
      An object detailing the customer's FPX bank.
      - `bank`
        The customer's [bank](https://docs.stripe.com/payments/fpx/accept-a-payment.md#bank-reference).

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with self collected data
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm an FPX payment
```

## Confirm a giropay payment

`stripe.confirmGiropayPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmGiropayPayment` in the [giropay Payments with Payment Methods](https://docs.stripe.com/payments/giropay/accept-a-payment.md) flow when the customer submits your payment form.
When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmGiropayPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/fpx/accept-a-payment.md#handle-redirect).
Default is `true`.

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm with the customer's name.
    - `billing_details`
      An object detailing billing information.
      - `name`
        The customer's name.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with self collected data
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a giropay payment
```

## Confirm a GrabPay payment

`stripe.confirmGrabPayPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmGrabPayPayment` in the [GrabPay payments with Payment Methods](https://docs.stripe.com/payments/grabpay.md)
flow when the customer submits your payment form. When called, it will confirm the
[PaymentIntent](https://docs.stripe.com/api/payment_intents.md), and automatically redirect the customer to
authorize the transaction. Once authorization is complete, the customer will be redirected
back to your specified `return_url`.

> Note that `stripe.confirmGrabPayPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting
> indicator like a spinner. If you receive an error result, you should be sure to show that
> error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret)
of the `PaymentIntent`.

- `data`
  Data to be sent with the request. Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md)
for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an
object containing data to create a `PaymentMethod` with. See the use case sections
below for details.
    - `return_url`
      The URL your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/grabpay.md#handle-redirect).
Default is `true`.

### with a new PaymentMethod

### Data argument properties

- `return_url`
  The URL your customer will be directed to after they complete authentication.

### Example

```title
Confirm with a new PaymentMethod
```

### with an existing PaymentMethod

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The URL your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Data argument properties

- `return_url`
  The URL your customer will be directed to after they complete authentication.

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a GrabPay payment
```

## Confirm an iDEAL payment

`stripe.confirmIdealPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmIdealPayment` in the [iDEAL Payments with Payment Methods](https://docs.stripe.com/payments/ideal.md) flow when the customer submits your payment form.
When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmIdealPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.
    - `setup_future_usage`
      To set up a SEPA Direct Debit payment method using the bank details from this iDEAL payment,
set this parameter to `off_session`. When using this parameter, a `customer` will need
to be set on the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). The newly created SEPA Direct Debit
[PaymentMethod](https://docs.stripe.com/api/payment_methods.md) will be attached to this customer.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/ideal/accept-a-payment?platform=web.md#web-handle-redirect).
Default is `true`.

### with payment data from an Element

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected by an `idealBank` [Element](https://docs.stripe.com/js/element.md).
    - `ideal`
      An `idealBank` [Element](https://docs.stripe.com/js/element.md).
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
Required when `setup_future_usage` is set to `off_session`.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

- `return_url`
  The url your customer will be directed to after they complete authentication.

- `setup_future_usage`
  To set up a SEPA Direct Debit payment method using the bank details from this iDEAL payment,
set this parameter to `off_session`. When using this parameter, a `customer` will need
to be set on the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). The newly created SEPA Direct Debit
[PaymentMethod](https://docs.stripe.com/api/payment_methods.md) will be attached to this customer.

### Example

```title
Confirm with an Element
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

- `setup_future_usage`
  To set up a SEPA Direct Debit payment method using the bank details from this iDEAL payment,
set this parameter to `off_session`. When using this parameter, a `customer` will need
to be set on the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). The newly created SEPA Direct Debit
[PaymentMethod](https://docs.stripe.com/api/payment_methods.md) will be attached to this customer.

### Example

```title
Confirm with existing payment method
```

### with self collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected by an `idealBank` [Element](https://docs.stripe.com/js/element.md).
    - `ideal`
      An object detailing the customer's iDEAL bank.
      - `bank`
        The customer's [bank](https://docs.stripe.com/payments/ideal/accept-a-payment?platform=web&ui=element.md#bank-reference).
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
Required when `setup_future_usage` is set to `off_session`.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

- `return_url`
  The url your customer will be directed to after they complete authentication.

- `setup_future_usage`
  To set up a SEPA Direct Debit payment method using the bank details from this iDEAL payment,
set this parameter to `off_session`. When using this parameter, a `customer` will need
to be set on the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). The newly created SEPA Direct Debit
[PaymentMethod](https://docs.stripe.com/api/payment_methods.md) will be attached to this customer.

### Example

```title
Confirm with self collected data
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm an iDEAL payment
```

## Confirm a Klarna payment

`stripe.confirmKlarnaPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmKlarnaPayment` in the Klarna payment method creation flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmKlarnaPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/klarna/accept-a-payment.md#handle-redirect).
Default is `true`.

### Without an existing payment method

### Data argument properties

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm without existing payment method
```

### With an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### With an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Klarna payment
```

## Confirm a Konbini payment

`stripe.confirmKonbiniPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmKonbiniPayment` in the [Konbini](https://docs.stripe.com/payments/konbini.md) payment flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/konbini/accept-a-payment.md) for more details.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new PaymentMethod for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmKonbiniPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `payment_method_options`
      An object containing payment-method-specific configuration to confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with.
      - `konbini`
        Configuration for this Konbini payment.
        - `confirmation_number`
          An optional 10 to 11 digit numeric-only string determining the confirmation code at applicable convenience stores.
May not be all 0 and could be rejected in case of insufficient uniqueness. We recommend to use the customer’s phone number.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to handle next actions yourself. Please refer to our [integration guide](https://docs.stripe.com/payments/konbini/accept-a-payment.md) for more info. Default is `true`.

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
      - `name`
        The customer's full name.
      - `email`
        The customer's email address.

- `payment_method_options`
  An object containing payment-method-specific configuration to confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with.
    - `konbini`
      Configuration for this Konbini payment.
      - `confirmation_number`
        An optional 10 to 11 digit numeric-only string determining the confirmation code at applicable convenience stores.
May not be all 0 and could be rejected in case of insufficient uniqueness. We recommend to use the customer’s phone number.

### Example

```title
Confirm with collected data
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

- `payment_method_options`
  An object containing payment-method-specific configuration to confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with.
    - `konbini`
      Configuration for this Konbini payment.
      - `confirmation_number`
        An optional 10 to 11 digit numeric-only string determining the confirmation code at applicable convenience stores.
May not be all 0 and could be rejected in case of insufficient uniqueness. We recommend to use the customer’s phone number.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Data argument properties

- `payment_method_options`
  An object containing payment-method-specific configuration to confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with.
    - `konbini`
      Configuration for this Konbini payment.
      - `confirmation_number`
        An optional 10 to 11 digit numeric-only string determining the confirmation code at applicable convenience stores.
May not be all 0 and could be rejected in case of insufficient uniqueness. We recommend to use the customer’s phone number.

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Konbini payment
```

## Confirm a MB WAY payment

`stripe.confirmMbWayPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmMbWayPayment` in the MB WAY payment method creation flow when the customer submits your payment form.
When you call the method, it confirms the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with the `data` you provide, and sends a request to the customer to authorize the transaction.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you've already attached a `PaymentMethod`, you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmMbWayPayment` might take some time to complete while waiting for customers to authorize the payment.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to manually handle polling for PaymentIntent updates.
Default is `true`.

### without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment. A phone number is required for all MB WAY payments.
      - `phone`

### Example

```title
Confirm without existing payment method
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a MB WAY payment
```

## Confirm a MobilePay payment

`stripe.confirmMobilepayPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmMobilepayPayment` in the [MobilePay Payments with Payment Methods](https://docs.stripe.com/payments/mobilepay.md) flow when the customer submits your payment form.
When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmMobilepayPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/ideal/accept-a-payment?platform=web.md#web-handle-redirect).
Default is `true`.

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a MobilePay payment
```

## Confirm a Multibanco payment

`stripe.confirmMultibancoPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmMultibancoPayment` in the [Multibanco Payment](https://docs.stripe.com/payments/multibanco.md) with Payment Methods flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/multibanco/accept-a-payment.md) for more details.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new PaymentMethod for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> `stripe.confirmMultibancoPayment` might take several seconds to complete. During that time, disable your form from being resubmitted and show a
> waiting indicator, such as a spinner. If you receive an error, display it to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.confirmMultibancoPayment` will pop up a modal with the voucher. This modal contains all the information required
> to pay the voucher through online banking or from an ATM, such as the Multibanco entity and reference numbers, and amount.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to handle next actions yourself. Please refer to our [Stripe Multibanco integration guide](https://docs.stripe.com/payments/multibanco/accept-a-payment.md) for more info. Default is `true`.

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`email` is required.
      - `email`
        The customer's email.

### Example

```title
Confirm with collected data
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Multibanco payment
```

## Confirm an Oxxo payment

`stripe.confirmOxxoPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmOxxoPayment` in the [OXXO Payment](https://docs.stripe.com/payments/oxxo.md) with Payment Methods flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/oxxo.md) for more details.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new PaymentMethod for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmOxxoPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.confirmOxxoPayment` will pop up a modal with the voucher. This modal contains all the information required
> to pay the voucher at OXXO stores, such as the amount, a reference number and corresponding barcode.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to handle next actions yourself. Please refer to our [Stripe OXXO integration guide](https://docs.stripe.com/payments/oxxo.md) for more info. Default is `true`.

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name. The first and last name must be at minimum 2 characters each.
      - `email`
        The customer's email.

### Example

```title
Confirm with collected data
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm an Oxxo payment
```

## Confirm a Przelewy24 payment

`stripe.confirmP24Payment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmP24Payment` in the [Przelewy24 Payments with Payment Methods](https://docs.stripe.com/payments/p24/accept-a-payment.md) flow when the customer submits your payment form.
When called, it will confirm the `PaymentIntent` with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmP24Payment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/p24/accept-a-payment?platform=web.md#handle-redirect).
Default is `true`.

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm with the customer's email address.
    - `billing_details`
      An object detailing billing information.
      - `email`
        The customer's email address.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with self collected data
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a P24 payment
```

## Confirm a Pay by Bank payment

`stripe.confirmPayByBankPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmPayByBankPayment` in the [Pay by Bank Payments with Payment Methods](https://docs.stripe.com/payments/pay-by-bank.md) flow when the customer submits your payment form.
When called, it confirms the `PaymentIntent` with `data` you provide. It then automatically redirects the customer to authorize the transaction.
After authorization is complete, the customer is redirected back to your specified `return_url`.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without providing any additional data.
These use cases are detailed in the sections that follow.

> Be aware that `stripe.confirmPayByBankPayment` might take several seconds to complete.
> During that time, disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/pay-by-bank/accept-a-payment?platform=web.md#handle-redirect).
Default is `true`.

### with an existing PaymentMethod

### Example

```title
Confirm with an existing PaymentMethod
```

### Example

```title
Confirm a Pay by Bank payment
```

## Confirm a PayNow payment

`stripe.confirmPayNowPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmPayNowPayment` in the PayNow payment method creation flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide and handle the [NextAction](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-next_action) for the customer to authorize the payment.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmPayNowPayment` may take several seconds to complete and display the QR code.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Default is `true`. Set this to `false` if you would like to [handle displaying the PayNow QR code yourself](https://docs.stripe.com/payments/paynow.md#confirm-payment-intent).

### Without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment method.

### Example

```title
Confirm without existing payment method
```

### With an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

### Example

```title
Confirm with existing payment method
```

### With an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a PayNow payment
```

## Confirm a PayPal payment

`stripe.confirmPayPalPayment(clientSecret: string, data?: object)`

Use `stripe.confirmPayPalPayment` in the [PayPal Payments with Payment Methods](https://docs.stripe.com/payments/paypal/accept-a-payment.md) flow when the customer submits your payment form.
When called, it will confirm the `PaymentIntent`, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

> Note that `stripe.confirmPayPalPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.
Required for new PayPal payment methods, but not required when using a previously set up PayPal payment method (via SetupIntent or a PaymentIntent with `setup_future_usage`).

### with a new PaymentMethod

### Data argument properties

- `return_url`
  The url your customer will be directed to after they complete authentication.
Required for new PayPal payment methods, but not required when using a previously set up PayPal payment method (via SetupIntent or a PaymentIntent with `setup_future_usage`).

### Example

```title
Confirm with a new PaymentMethod
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.
Required for new PayPal payment methods, but not required when using a previously set up PayPal payment method (via SetupIntent or a PaymentIntent with `setup_future_usage`).

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a PayPal payment
```

## Confirm a PayTo payment

`stripe.confirmPayToPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmPayToPayment` in the PayTo payment method creation flow when the customer submits your payment form.
When you call the method, it confirms the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with the `data` you provide, and sends a request to the customer to authorize the transaction.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you've already attached a `PaymentMethod`, you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmPayToPayment` might take some time to complete while waiting for customers to authorize the PayTo agreement, and while waiting for funds to transfer.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to manually handle polling for PaymentIntent updates.
Default is `true`.

### without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment. The email is required if the customer is paying with PayID.
      - `email`
      - `name`
    - `payto`
      The [PayTo payment method details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-payto) associated with the customer's bank account. Either `pay_id` or `account_number` and `bsb_number` must be provided.
      - `pay_id`
      - `account_number`
      - `bsb_number`

### Example

```title
Confirm without existing payment method
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a PayTo payment
```

## Confirm a Pix payment

`stripe.confirmPixPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmPixPayment` in the [Pix Payment](https://docs.stripe.com/payments/pix.md) with Payment Methods flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/pix.md) for more details.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new PaymentMethod for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmPixPayment` may take several seconds to complete and display the QR code.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Default to be `true`. Set this to `false` if you would like to [handle displaying the Pix QR code yourself](https://docs.stripe.com/payments/pix/accept-a-payment.md#confirm-payment-intent).

### without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method paramters or and empty payment method object.

### Example

```title
Confirm without existing payment method
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Pix payment
```

## Confirm a PromptPay payment

`stripe.confirmPromptPayPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmPromptPayPayment` in the PromptPay payment method creation flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide and handle the [NextAction](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-next_action) for the customer to authorize the payment.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmPromptPayPayment` may take several seconds to complete and display the QR code.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Default to be `true`. Set this to `false` if you would like to [handle displaying the PromptPay QR code yourself](https://docs.stripe.com/payments/promptpay/accept-a-payment.md#confirm-payment-intent).

### Without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment method.

### Example

```title
Confirm without existing payment method
```

### With an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

### Example

```title
Confirm with existing payment method
```

### With an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a PromptPay payment
```

## Confirm a SEPA Debit payment

`stripe.confirmSepaDebitPayment(clientSecret: string, data?: object)`

Use `stripe.confirmSepaDebitPayment` in the [SEPA Direct Debit Payments](https://docs.stripe.com/payments/sepa-debit.md) with Payment Methods flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/sepa-debit.md) for more details.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new PaymentMethod for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmSepaDebitPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.
    - `setup_future_usage`
      To set up the SEPA Direct Debit account for reuse, set
this parameter to `off_session`. SEPA Direct Debit only
accepts an `off_session` value for this parameter. If a
`customer` is provided on this
[PaymentIntent](https://docs.stripe.com/api/payment_intents.md), the
[PaymentMethod](https://docs.stripe.com/api/payment_methods.md) will be attached to
the customer when the PaymentIntent transitions to
`processing`.

### with payment data from an Element

### Data argument properties

- `payment_method`
  Pass an `object` to confirm the payment using data collected by an `iban` [Element](https://docs.stripe.com/js/element.md).
    - `sepa_debit`
      An `iban` Element.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

### Example

```title
Confirm with an Element
```

### with self collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected without an `Element`.
    - `sepa_debit`
      - `iban`
        An IBAN account number.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

### Example

```title
Confirm with self collected data
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a SEPA Debit payment
```

## Confirm a Sofort payment

`stripe.confirmSofortPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmSofortPayment` in the [Sofort Payments with Payment Methods](https://docs.stripe.com/payments/sofort.md) flow when the customer submits your payment form.
When called, it will confirm the `PaymentIntent` with `data` you provide. It will then automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmSofortPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.
    - `setup_future_usage`
      To set up a SEPA Direct Debit payment method using the bank details from this SOFORT payment,
set this parameter to `off_session`. When using this parameter, a `customer` will need
to be set on the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). The newly created SEPA Direct Debit
[PaymentMethod](https://docs.stripe.com/api/payment_methods.md) will be attached to this customer.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/sofort/accept-a-payment?platform=web.md#handle-redirect).
Default is `true`.

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

- `setup_future_usage`
  To set up a SEPA Direct Debit payment method using the bank details from this SOFORT payment,
set this parameter to `off_session`. When using this parameter, a `customer` will need
to be set on the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). The newly created SEPA Direct Debit
[PaymentMethod](https://docs.stripe.com/api/payment_methods.md) will be attached to this customer.

### Example

```title
Confirm with existing payment method
```

### with collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm with the customer's name.
    - `sofort`
      An object detailing SOFORT specific parameters.
      - `country`
        The country code where customer's bank is located.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
Required when `setup_future_usage` is set to `off_session`.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

- `return_url`
  The url your customer will be directed to after they complete authentication.

- `setup_future_usage`
  To set up a SEPA Direct Debit payment method using the bank details from this SOFORT payment,
set this parameter to `off_session`. When using this parameter, a `customer` will need
to be set on the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md). The newly created SEPA Direct Debit
[PaymentMethod](https://docs.stripe.com/api/payment_methods.md) will be attached to this customer.

### Example

```title
Confirm with self collected data
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Sofort payment
```

## Confirm a Sunbit payment

`stripe.confirmSunbitPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmSunbitPayment` in the [Sunbit Payments](https://docs.stripe.com/payments/sunbit/accept-a-payment.md) flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmSunbitPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/sunbit/accept-a-payment.md#handle-redirect).
Default is `true`.

### without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment.
      - `name`
      - `email`
      - `address`

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm without existing payment method
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Sunbit payment
```

## Confirm a TWINT payment

`stripe.confirmTwintPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmTwintPayment` in the TWINT payment method creation flow when the customer submits your payment form.
When you call the method, it confirms the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with the `data` you provide, and automatically redirects the customer to authorize the transaction.
Once authorization is complete, the customer is redirected back to your specified `return_url`.

When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you've already attached a `return_url` and a `PaymentMethod`, you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmTwintPayment` might take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/twint/accept-a-payment.md#handle-redirect).
Default is `true`.

### without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment.
      - `email`
      - `name`
      - `address`

- `shipping`
  The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment.
    - `name`
    - `address`

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm without existing payment method
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm an TWINT payment
```

## Confirm a UPI payment

`stripe.confirmUpiPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmUpiPayment` when customer submits your payment form. When called, it will confirm the
[PaymentIntent](https://docs.stripe.com/api/payment_intents.md), and return a `Promise` which resolves with
the PaymentIntent having its final payment status.

Since the authentication for UPI payments happen on customer's mobile device, and the timeout for
such authentication is 5 minutes, the `Promise` returned by `stripe.confirmUpiPayment` can take upto
5 minutes to resolve. We recommend showing an appropriate message to the customer indicating their
payment is being processed.

> Note that `stripe.confirmUpiPayment` may take several minutes to complete.
> During that time, you should disable your form from being resubmitted and show a waiting
> indicator like a spinner. If you receive an error result, you should be sure to show that
> error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret)
of the `PaymentIntent`.

- `data`
  Data to be sent with the request. Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md)
for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an
object containing data to create a `PaymentMethod` with. See the use case sections
below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to manually poll for the [PaymentIntent status](https://docs.stripe.com/api/payment_intents/retrieve.md).
Default is `true`.

### with an existing PaymentMethod

### Example

```title
Confirm with an existing PaymentMethod
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a UPI payment
```

## Confirm a WeChat Pay payment

`stripe.confirmWechatPayPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmWechatPayPayment` in the WeChat Pay payment method creation flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide and handle the [NextAction](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-next_action) for the customer to authorize the payment.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmWechatPayPayment` may take several seconds to complete and display the QR code.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you would like to [handle displaying the WeChat Pay QR code yourself](https://docs.stripe.com/payments/wechat-pay/accept-a-payment?platform=web.md#submit-payment).

### Without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment method.

### Example

```title
Confirm without existing payment method
```

### With an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

### Example

```title
Confirm with existing payment method
```

### With an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a WeChat Pay payment
```

## Confirm an Zip payment

`stripe.confirmZipPayment(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmZipPayment` in the Zip payment method creation flow when the customer submits your payment form.
When called, it will confirm the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with `data` you provide, and it will automatically redirect the customer to authorize the transaction.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.
When you confirm a `PaymentIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `PaymentIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `return_url` and a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmZipPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Payment Intents API](https://docs.stripe.com/api/payment_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/zip/accept-a-payment.md#handle-redirect).
Default is `true`.

### without an existing payment method

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment.
      - `email`
      - `name`
      - `address`

- `shipping`
  The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment.
    - `name`
    - `address`

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm without existing payment method
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm an Zip payment
```

## Retrieve a PaymentIntent

`stripe.retrievePaymentIntent(clientSecret: string)`

Retrieve a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) using its [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret).

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) to retrieve.

### Example

```title
Retrieve a PaymentIntent
```

## Verify with micro-deposits for payment

`stripe.verifyMicrodepositsForPayment(clientSecret: string, data?: object)`

Use `stripe.verifyMicrodepositsForPayment` in the [Accept a Canadian pre-authorized debit payment](https://docs.stripe.com/payments/acss-debit/accept-a-payment.md) or [Accept an ACH Direct Debit payment](https://docs.stripe.com/payments/ach-direct-debit/accept-a-payment.md) flow to verify a customer's bank account with micro-deposits.

It should be only called when [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) is in the `requires_action` state, and contains a `next_action` field that has a `type` equal to `verify_with_microdeposits`.
Refer to our [integration guide](https://docs.stripe.com/payments/acss-debit/accept-a-payment.md) for more details.

> Verification can fail for several reasons. The failure may happen synchronously as a direct error response, or asynchronously through a `payment_intent.payment_failed` webhook event.
> Refer to our [integration guide](https://docs.stripe.com/payments/acss-debit/accept-a-payment.md) for more details.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
    - `amounts`
      An array of two positive integers, in *cents*, equal to the values of the micro-deposits sent to the bank account.
    - `descriptor_code`
      A six-character code starting with SM present in the microdeposit sent to the bank account.

### Example

```title
Verify with micro-deposits for payment
```

## Create a Radar session

`stripe.createRadarSession()`

Use `stripe.createRadarSession()` to associate client browser information with a Radar Session ID. This ID can then be passed to Stripe when [creating charges and payment methods](https://docs.stripe.com/radar/radar-session.md) to associate client browser information with those charges and improve Radar's ability to identify fraud.

We've prefilled the example with a sample [test API key](https://docs.stripe.com/keys.md). Don’t submit any personally identifiable information in requests made with this key.
To create a Stripe object using your account, replace the sample API key with your actual API key or [sign in](https://docs.stripe.com/login.md?redirect=%2Fdocs%2Fjs%2Finitializing).

> Note that `stripe.createRadarSession` should be non-blocking. If you receive an error from this function, continue on with completing charges without passing through a Radar Session ID.

### Example

```title
Create a Radar Session
```

## Handle a next action

`stripe.handleNextAction(options: object)`

Use `stripe.handleNextAction` in the [finalizing payments on the server](https://docs.stripe.com/payments/finalize-payments-on-the-server.md#next-actions)
flow to finish confirmation of a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with the `requires_action` status.
It will throw an error if the PaymentIntent has a different status.

Depending on the payment method and required action, the customer may be temporarily redirected from your site
and brought back to the `return_url` [parameter](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-return_url) provided when the PaymentIntent is confirmed.

> Note that `stripe.handleNextAction` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.handleNextAction` may trigger a [3D Secure](https://docs.stripe.com/payments/3d-secure.md) authentication challenge.
> The authentication challenge requires a context switch that can be hard to follow on a screen-reader.
> Ensure that your form is accessible by ensuring that success or error messages are clearly read out.

- `options`
    - `clientSecret`
      The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

### Example

```title
Handle a next action
```

## Handle a card action

`stripe.handleCardAction(clientSecret: string)`

Use `stripe.handleCardAction` in the Payment Intents API [manual confirmation](https://docs.stripe.com/payments/payment-intents/web-manual.md) flow to handle a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) with the `requires_action` status.
It will throw an error if the `PaymentIntent` has a different status.

> Note that `stripe.handleCardAction` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.handleCardAction` may trigger a [3D Secure](https://docs.stripe.com/payments/3d-secure.md) authentication challenge.
> The authentication challenge requires a context switch that can be hard to follow on a screen-reader.
> Ensure that your form is accessible by ensuring that success or error messages are clearly read out.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent` to handle.

### Example

```title
Handle a card action
```

## Collect bank account details for payment

`stripe.collectBankAccountForPayment(options: object)`

Use `stripe.collectBankAccountForPayment` in the [Accept a payment](https://docs.stripe.com/payments/ach-direct-debit/accept-a-payment.md) flow for the [ACH Direct Debit](https://docs.stripe.com/payments/ach-direct-debit.md) payment method to collect the customer’s bank account in your payment form.
When called, it will automatically load an on-page modal UI to collect bank account details and verification, and attach the [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) to the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md).

- `options`
  Data to be sent with the request.
    - `clientSecret`
      The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.
    - `params`
      - `payment_method_type`
        The payment method type for the bank account details (e.g. `us_bank_account`)
      - `payment_method_data`
        Payment method specific data to be sent with the request
        - `billing_details`
          The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` is required. Providing `email` allows your customer to receive [ACH Direct Debit mandate and microdeposit emails](https://docs.stripe.com/payments/ach-direct-debit.md#mandate-and-microdeposit-emails).
          - `name`
            The customer's name. The first and last name must be at minimum 2 characters each.
          - `email`
            The customer's email.
          - `address`
            The customer's billing address.
            - `city`
              City, district, suburb, town, or village.
            - `country`
              Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
            - `line1`
              Address line 1 (e.g., street, PO Box, or company name).
            - `line2`
              Address line 2 (e.g., apartment, suite, unit, or building).
            - `postal_code`
              ZIP or postal code.
            - `state`
              State, county, province, or region.

### Example

```title
Collect bank account details for payment
```

## Setup Intents

Use the [Setup Intents APIs](https://docs.stripe.com/payments/setup-intents.md) to save a card and charge it later.
For step-by-step instructions on using the Setup Intents APIs, see the [set up recurring payments guide](https://docs.stripe.com/payments/save-and-reuse.md).

The following Stripe.js methods are available for working with Setup Intents.

## Confirm a setup

`stripe.confirmSetup(options: object)`

Use `stripe.confirmSetup` to confirm a [SetupIntent](https://docs.stripe.com/api/setup_intents.md) using data collected
by the [Payment Element](https://docs.stripe.com/js/element/payment_element.md), or with manually provided data via `confirmParams`.
When called, `stripe.confirmSetup` will attempt to complete any [required actions](https://docs.stripe.com/payments/intents.md),
such as authenticating your user by displaying a 3DS dialog or redirecting them to a bank authorization page.
Your user will be redirected to the `return_url` you pass once the authorization is complete.

> The `stripe.confirmSetup` might take several seconds to complete.
> During that time, disable your form from being resubmitted and show a waiting indicator, such as a spinner. If you receive an error result, show this error to the user, re-enable the form, and hide the waiting indicator.

- `options`
    - `elements`
      The [Elements](#payment_element_create) instance used to create the Payment Element.

Required if you [collect payment details before creating an Intent](https://docs.stripe.com/payments/accept-a-payment-deferred.md?platform=web&type=setup). It's always required if you don't provide a `clientSecret`.
    - `clientSecret`
      The SetupIntent's client secret.

Required if you [collect payment details before creating an Intent](https://docs.stripe.com/payments/accept-a-payment-deferred.md?platform=web&type=setup). It's always required if you don't provide an `elements` instance containing a [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret).
    - `confirmParams`
      Parameters that will be passed on to the Stripe API. Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
      - `return_url`
        The URL that Stripe redirects your customer to after they complete authentication.
      - `confirmation_token`
        If collected previously, the ID of the ConfirmationToken to use to confirm this SetupIntent. This is mutually exclusive with the `elements` parameter.
      - `payment_method_data`
        When you call `stripe.confirmSetup`, payment details are collected from the Element and passed to the SetupIntents
[confirm endpoint](https://docs.stripe.com/api/setup_intents/confirm.md) as the [payment_method_data](https://docs.stripe.com/api/setup_intents/confirm.md#confirm_setup_intent-payment_method)
parameter. You can also include additional `payment_method_data` fields, which will be merged with the data collected from the Element.
        - `billing_details`
          The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
Details collected by Elements will override values passed here.
If you set any billing fields to `never` in the Payment Element's `fields` option, you must pass those values here.
        - `allow_redisplay`
          Indicates whether the payment method can be displayed to the customer in subsequent checkout flows. The value passed here will override the [allow_redisplay](docs/api/payment_methods/object#payment_method_object-allow_redisplay) determined by the provided `elements` parameter.
      - `expand`
        An array of pass through [SetupIntent](https://docs.stripe.com/api/setup_intents/object.md) expansion parameters ([learn more](https://docs.stripe.com/api/expanding_objects.md)).
    - `redirect`
      By default, `stripe.confirmSetup` will always redirect to your `return_url` after a successful confirmation.
If you set `redirect: "if_required"`, then `stripe.confirmSetup` will only redirect if your user chooses a redirect-based payment method.

**Note**: Setting `if_required` requires that you handle successful confirmations for redirect-based and non-redirect based payment methods separately.
When a non-redirect based payment method is successfully confirmed, `stripe.confirmSetup` will resolve with a `{setupIntent}` object.

### Example

```title
Confirm a setup intent
```

## Confirm a SetupIntent by payment method

Below are a number of methods used to confirm a SetupIntent for a specific payment method type.

## Confirm card setup

`stripe.confirmCardSetup(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmCardSetup` in the [Setup Intents API flow](https://docs.stripe.com/payments/save-and-reuse.md) when the customer submits your payment form.
When called, it will confirm the [SetupIntent](https://docs.stripe.com/api/setup_intents.md) with `data` you provide and carry out 3DS or other next actions if they are required.

When you confirm a `SetupIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `SetupIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
It can also be called with an existing `PaymentMethod`, or if you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmCardSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.confirmCardSetup` may trigger a [3D Secure](https://docs.stripe.com/payments/3d-secure.md) authentication challenge.
> This will be shown in a modal dialog and may be confusing for customers using assistive technologies like screen readers.
> You should make your form accessible by ensuring that success or error messages are clearly read out after this method completes.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.
    - `return_url`
      If you are [handling next actions yourself](https://docs.stripe.com/payments/payment-intents/verifying-status.md#next-actions), pass in a `return_url`.
If the subsequent action is `redirect_to_url`, this URL will be used on the return path for the redirect.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [handle next actions yourself](https://docs.stripe.com/payments/payment-intents/verifying-status.md#next-actions), or if you want to defer next action handling until later (e.g. for use in the [PaymentRequest API](https://docs.stripe.com/stripe-js/elements/payment-request-button.md#complete-payment-intents)).
Default is `true`.

### with payment data from an Element

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected by a `card` or `cardNumber` [Element](https://docs.stripe.com/js/element.md).
    - `card`
      Uses the provided `card` or `cardNumber` [Element](https://docs.stripe.com/js/element.md) for confirmation.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.

### Example

```title
Confirm with an Element
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with existing payment method
```

### with an existing token

### Data argument properties

- `payment_method`
  Pass an object to confirm using an existing token.
    - `card`
      An object of card data.
      - `token`
        Converts the provided token into a `PaymentMethod` to use for confirmation.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.

### Example

```title
Confirm with existing token
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm card setup
```

## Confirm an ACH Direct Debit setup

`stripe.confirmUsBankAccountSetup(clientSecret: string, data?: object)`

Use `stripe.confirmUsBankAccountSetup` in the [Save bank details](https://docs.stripe.com/payments/ach-direct-debit/set-up-payment.md) flow for the [ACH Direct Debit](https://docs.stripe.com/payments/ach-direct-debit.md) payment method to record the customer’s authorization for future payments.

When you confirm a [SetupIntent](https://docs.stripe.com/api/setup_intents.md), it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
We suggest using `stripe.collectBankAccountForSetup`, which automatically collects bank account details and attaches a [PaymentMethod](https://docs.stripe.com/api/payment_methods.md). You may also choose to reuse an existing `PaymentMethod` or manually collect bank account details  using the `data` parameter. These use cases are detailed in the sections that follow.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

### with an existing PaymentMethod

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with an existing PaymentMethod
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### with self collected bank account information

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` is required. Providing `email` allows your customer to receive [ACH Direct Debit mandate and microdeposit emails](https://docs.stripe.com/payments/ach-direct-debit.md#mandate-and-microdeposit-emails).
      - `name`
        The customer's name. The first and last name must be at minimum 2 characters each.
      - `email`
        The customer's email.
    - `us_bank_account`
      The customer's [bank account information](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-us_bank_account).
      - `account_number`
        The customer’s bank account number.
      - `routing_number`
        The routing number of the customer’s bank.
      - `account_holder_type`
        Account holder type: individual or company.
      - `account_type`
        Account type: checkings or savings. Defaults to checking if omitted.

### Example

```title
Confirm with bank account information
```

### Example

```title
Confirm an ACH Direct Debit setup
```

## Confirm a Canadian pre-authorized debit setup

`stripe.confirmAcssDebitSetup(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmAcssDebitSetup` in the [Save bank details](https://docs.stripe.com/payments/acss-debit/set-up-payment.md) flow to set up a [Canadian pre-authorized debit](https://docs.stripe.com/payments/acss-debit.md) payment method for future payments.
When called, it will automatically pop up a modal to collect bank account details and verification, accept the mandate, and confirm the [SetupIntent](https://docs.stripe.com/api/setup_intents.md) when the user submits the form.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/acss-debit/set-up-payment.md) for more details.

When you confirm a `SetupIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
`stripe.confirmAcssDebitSetup` automatically creates a new `PaymentMethod` for you when your customer completes the modal UI.
It can also be called with an existing `PaymentMethod`, which will load the modal UI to collect a new mandate agreement.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmAcssDebitSetup` may take several seconds to complete.
> During that time, disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, show it to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

- `options`
  An options object to control the behavior of this method.
    - `skipMandate`
      Set this to `true` if you want to skip displaying the mandate confirmation.

### with a new PaymentMethod

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name. The first and last name must be at minimum 2 characters each.
      - `email`
        The customer's email.

### Example

```title
Confirm with a new PaymentMethod
```

### with an existing PaymentMethod

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

### Example

```title
Confirm with an existing PaymentMethod
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### with self collected bank account information

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name. The first and last name must be at minimum 2 characters each.
      - `email`
        The customer's email.
    - `acss_debit`
      The customer's [bank account information](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-acss_debit).
      - `account_number`
        The customer’s bank account number.
      - `institution_number`
        The institution number of the customer’s bank.
      - `transit_number`
        The transit number of the customer’s bank.

### Example

```title
Confirm with bank account information
```

### with an existing PaymentMethod but skip mandate display

### Data and options argument paramters

- `data`
  Data to be sent with the request.
    - `payment_method`
      The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

- `options`
  An options object to control the behavior of this method.
    - `skipMandate`
      Set to `true` to skip the on-page modal UI.

### Example

```title
Confirm with an existing PaymentMethod but skip mandate display
```

### Example

```title
Confirm Canadian pre-authorized debit setup
```

## Confirm BECS Debit setup

`stripe.confirmAuBecsDebitSetup(clientSecret: string, data?: object)`

Use `stripe.confirmAuBecsDebitSetup` in the [BECS Direct Debit Payments](https://docs.stripe.com/payments/au-becs-debit.md) flow when the customer submits your payment form.
When called, it will confirm the [SetupIntent](https://docs.stripe.com/api/setup_intents.md) with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/au-becs-debit.md) for more details.

When you confirm a `SetupIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `SetupIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
It can also be called with an existing `PaymentMethod`, or if you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmAuBecsDebitSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

### with payment data from an Element

### Data argument properties

- `payment_method`
  Pass an `object` to confirm using data collected by an `auBankAccount`
Element.
    - `au_becs_debit`
      An `auBankAccount` [Element](https://docs.stripe.com/js/element.md).
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

### Example

```title
Confirm with an Element
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

### Example

```title
Confirm with existing payment method
```

### with self collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected without an `Element`.
    - `au_becs_debit`
      An object of self-collected bank account data.
      - `bsb_number`
        A Bank State Branch (BSB) number.
      - `account_number`
        A bank account number.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The account holder's name.
      - `email`
        The customer's email.

### Example

```title
Confirm with self collected data
```

### Example

```title
Confirm BECS Debit setup
```

## Confirm Bacs Debit setup

`stripe.confirmBacsDebitSetup(clientSecret: string, data?: object)`

Use `stripe.confirmBacsDebitSetup` in the [Bacs Direct Debit Payments](https://docs.stripe.com/payments/payment-methods/bacs-debit.md) flow when the customer submits your payment form.
When called, it will confirm the [SetupIntent](https://docs.stripe.com/api/setup_intents.md) with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/payment-methods/bacs-debit.md) for more details.

When you confirm a `SetupIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `SetupIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
It can also be called with an existing `PaymentMethod`, or if you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmBacsDebitSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

### with self collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using payment method data.
    - `bacs_debit`
      An object of self-collected bank account data.
      - `account_number`
        A bank account number.
      - `sort_code`
        A sort code.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `address`
        The account holder's address.
        - `line1`
          Line 1 of the account holder's address.
        - `city`
          The account holder's city.
        - `country`
          The account holder's country.
        - `postal_code`
          The account holder's postal code.
      - `name`
        The account holder's name.
      - `email`
        The customer's email.

### Example

```title
Confirm with self collected data
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

### Example

```title
Confirm with existing payment method
```

### Example

```title
Confirm Bacs Debit setup
```

## Confirm BLIK setup

`stripe.confirmBlikSetup(clientSecret: string, data: object, options?: object)`

Use `stripe.confirmBlikSetup` in the [Set up future BLIK recurring payments](https://docs.stripe.com/payments/blik/set-up-payment.md) flow when the customer submits your setup form.
Pass the customer's BLIK code in `payment_method_options.blik.code` to confirm the `SetupIntent`.
By default, this method handles the next action while the customer authorizes the setup in their banking app.
Refer to the [integration guide](https://docs.stripe.com/payments/blik/set-up-payment.md) for prerequisites and the full integration flow.

> BLIK authorization can take several seconds. Disable your form while confirmation is in progress and show a waiting indicator.
> If the result contains an error, display it to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to send with the request. Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Data used to create the BLIK PaymentMethod.
      - `blik`
        An empty object identifying BLIK as the payment method.
      - `billing_details`
        The customer's [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
    - `payment_method_options`
      An object containing options specific to the payment method.
      - `blik`
        Options specific to BLIK.
        - `code`
          Your customer's 6-digit BLIK code.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` to handle any required customer actions yourself.

### Example

```title
Confirm BLIK setup
```

## Confirm an Cash App Pay setup

`stripe.confirmCashappSetup(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmCashappSetup` in the [Save payment details](https://docs.stripe.com/payments/cash-app-pay/set-up-payment.md) flow for the [Cash App Pay](https://docs.stripe.com/payments/cash-app-pay.md) payment method to record the customer’s authorization for future payments.

When you confirm a [SetupIntent](https://docs.stripe.com/api/setup_intents.md), it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

In addition to confirming the `SetupIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmCashappSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you would like to [handle displaying the Cash App Pay QR code or handle the authorization redirect](docs/payments/cash-app-pay/set-up-payment?platform=web&ui=API#web-create-setup-intent) yourself.

### Without an existing payment method

### Data argument properties

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with bank account information
```

### with an existing PaymentMethod

### Data argument properties

- `payment_method`
  The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with an existing PaymentMethod
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a Cash App Pay setup
```

## Confirm iDEAL setup

`stripe.confirmIdealSetup(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmIdealSetup` in the [Set up future payments](https://docs.stripe.com/payments/ideal/set-up-payment.md) flow to use iDEAL bank details to set up a
SEPA Direct Debit payment method for future payments. When called, it will confirm a `SetupIntent` with `data` you provide, and it will
automatically redirect the customer to authorize the transaction. Once authorization is complete, the customer will be redirected back to your specified `return_url`.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/ideal/set-up-payment.md) for more details.

When you confirm a `SetupIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `SetupIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
It can also be called with an existing `PaymentMethod`, or if you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmIdealSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/ideal/accept-a-payment?platform=web.md#web-handle-redirect).
Default is `true`.

### with payment data from an Element

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected by an `idealBank`
Element.
    - `ideal`
      An `idealBank` [Element](https://docs.stripe.com/js/element.md).
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with an Element
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with self collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm using data collected by an `idealBank`
Element.
    - `ideal`
      An object detailing the customer's iDEAL bank.
      - `bank`
        The customer's [bank](https://docs.stripe.com/payments/ideal/accept-a-payment?platform=web&ui=element.md#bank-reference).
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with self collected data
```

### Example

```title
Confirm iDEAL setup
```

## Confirm a Klarna setup

`stripe.confirmKlarnaSetup(clientSecret: string, data?: object)`

Use `stripe.confirmKlarnaSetup` in the [Klarna Payments with Setup Intents](https://docs.stripe.com/payments/klarna/set-up-payment.md) flow when the customer submits your setup form.
When called, it will confirm the `SetupIntent` with `data` you provide, and it will automatically redirect the customer to authorize the setup.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

> Note that `stripe.confirmKlarnaSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### with self collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm with the customer's email and billing country.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`email` and `address.country` are required.
      - `email`
        The customer's email.
      - `address`
        The customer's billing address.
        - `country`
          The customer's billing country.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with self collected data
```

### Example

```title
Confirm a Klarna setup
```

## Confirm a PayPal setup

`stripe.confirmPayPalSetup(clientSecret: string, data?: object)`

Use `stripe.confirmPayPalSetup` in the [PayPal Payments with Setup Intents](https://docs.stripe.com/payments/paypal/set-up-payment.md) flow when the customer submits your setup form.
When called, it will confirm the `SetupIntent`, and it will automatically redirect the customer to authorize the setup.
Once authorization is complete, the customer will be redirected back to your specified `return_url`.

> Note that `stripe.confirmPayPalSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
See the use case sections below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

### with a new PaymentMethod

### Data argument properties

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with a new PaymentMethod
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a PayPal setup
```

## Confirm a PayTo setup

`stripe.confirmPayToSetup(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmPayToSetup` in the [PayTo Payments with Setup Intents](https://docs.stripe.com/payments/payto/set-up-payment.md) flow when the customer submits your setup form.
When called, it will confirm the `SetupIntent`, and send a request for authorization to the customer.

When you confirm a `SetupIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `SetupIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
If you've already attached a `PaymentMethod`, you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmPayToSetup` might take some time to complete while waiting for customers to authorize the PayTo agreement.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      Either the `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md), or an object containing data to create a `PaymentMethod` with.
See the use case sections below for details.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to manually handle polling for SetupIntent updates.
Default is `true`.

### with a new PaymentMethod

### Data argument properties

- `payment_method`
  Pass payment method billing details.
    - `billing_details`
      The [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the payment. The email is required if the customer is paying with PayID.
      - `email`
      - `name`
    - `payto`
      The [PayTo payment method details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-payto) associated with the customer's bank account. Either `pay_id` or `account_number` and `bsb_number` must be provided.
      - `pay_id`
      - `account_number`
      - `bsb_number`

### Example

```title
Confirm with a new PaymentMethod
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm a PayTo setup
```

## Confirm SEPA Debit setup

`stripe.confirmSepaDebitSetup(clientSecret: string, data?: object)`

Use `stripe.confirmSepaDebitSetup` in the [SEPA Direct Debit with Setup Intents](https://docs.stripe.com/payments/sepa-debit-setup-intents.md) flow when the customer submits your payment form.
When called, it will confirm the `SetupIntent` with `data` you provide.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/sepa-debit-setup-intents.md) for more details.

When you confirm a `SetupIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `SetupIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
It can also be called with an existing `PaymentMethod`, or if you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmSepaDebitSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.

### with payment data from an Element

### Data argument properties

- `payment_method`
  Pass an `object` to confirm using data collected by an `iban`
Element.
    - `sepa_debit`
      An `iban` [Element](https://docs.stripe.com/js/element.md).
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

### Example

```title
Confirm with an Element
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

### Example

```title
Confirm with existing payment method
```

### with self collected data

### Data argument properties

- `payment_method`
  Pass an `object` to confirm using data collected by an `iban`
Element.
    - `sepa_debit`
      An object of self-collected IBAN data.
      - `iban`
        An IBAN account number.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

### Example

```title
Confirm with self collected data
```

### Example

```title
Confirm SEPA Debit setup
```

## Confirm Sofort setup

`stripe.confirmSofortSetup(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmSofortSetup` in the [Set up future payments](https://docs.stripe.com/payments/sofort/set-up-payment.md) flow to use SOFORT bank details to set up a
SEPA Direct Debit payment method for future payments. When called, it will confirm a `SetupIntent` with `data` you provide, and it will
automatically redirect the customer to authorize the transaction. Once authorization is complete, the customer will be redirected back to your specified `return_url`.
Note that there are some additional requirements to this flow that are not covered in this reference.
Refer to our [integration guide](https://docs.stripe.com/payments/sofort/set-up-payment.md) for more details.

When you confirm a `SetupIntent`, it needs to have an attached [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
In addition to confirming the `SetupIntent`, this method can automatically create and attach a new `PaymentMethod` for you.
It can also be called with an existing `PaymentMethod`, or if you have already attached a `PaymentMethod` you can call this method without needing to provide any additional data.
These use cases are detailed in the sections that follow.

> Note that `stripe.confirmSofortSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      The `id` of an existing PaymentMethod or an object of collected data.
See use cases below for details.
    - `return_url`
      The url your customer will be directed to after they complete authentication.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to [manually handle the authorization redirect](https://docs.stripe.com/payments/sofort/accept-a-payment?platform=web.md#handle-redirect).
Default is `true`.

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with existing payment method
```

### with self collected data

### Data argument properties

- `payment_method`
  Pass an object to confirm with the customer's name and email.
    - `country`
      The country code where customer's bank is located.
    - `billing_details`
      The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` and `email` are required.
      - `name`
        The customer's name.
      - `email`
        The customer's email.

- `return_url`
  The url your customer will be directed to after they complete authentication.

### Example

```title
Confirm with self collected data
```

### Example

```title
Confirm SOFORT setup
```

## Confirm TWINT setup

`stripe.confirmTwintSetup(clientSecret: string, data?: object, options?: object)`

Use `stripe.confirmTwintSetup` in the [TWINT Payments with Setup Intents](https://docs.stripe.com/payments/twint/set-up-future-payments.md) flow when the customer submits your setup form.
When called, it confirms the `SetupIntent`, and automatically redirects the customer to authorize the setup.
After authorization is complete, the customer is redirected back to your specified `return_url`.

> Note that `stripe.confirmTwintSetup` might take some time to complete while waiting for customers to authorize the setup.
> During that time, disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, make sure to show the error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
Refer to the [Setup Intents API](https://docs.stripe.com/api/setup_intents/confirm.md) for a full list of parameters.
    - `payment_method`
      An object of collected data or an `id` of an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md).
See the use cases below for details.
    - `return_url`
      The URL your customer is redirected to after they complete authorization.

- `options`
  An options object to control the behavior of this method.
    - `handleActions`
      Set this to `false` if you want to manually handle the authorization redirect.
Default is `true`.

### with a new PaymentMethod

### Data argument properties

- `payment_method`
  Pass an object to confirm using collected data.
    - `type`
      A `twint` type.

- `return_url`
  The URL your customer is redirected to after they complete authorization.

### Example

```title
Confirm with a new PaymentMethod
```

### with an existing payment method

### Data argument properties

- `payment_method`
  The `id` of an existing `PaymentMethod`.

- `return_url`
  The URL your customer is redirected to after they complete authorization.

### Example

```title
Confirm with existing payment method
```

### with an attached PaymentMethod

### Data argument properties

- `return_url`
  The URL your customer is redirected to after they complete authorization.

### Example

```title
Confirm with an attached PaymentMethod
```

### Example

```title
Confirm TWINT setup
```

## Retrieve a SetupIntent

`stripe.retrieveSetupIntent(clientSecret: string)`

Retrieve a [SetupIntent](https://docs.stripe.com/api/setup_intents.md) using its client secret.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent` to retrieve.

### Example

```title
Retrieve a SetupIntent
```

## Verify with micro-deposits for setup

`stripe.verifyMicrodepositsForSetup(clientSecret: string, data?: object)`

Use `stripe.verifyMicrodepositsForSetup` in the [Save details for future payments with pre-authorized debit in Canada](https://docs.stripe.com/payments/acss-debit/set-up-payment.md) or [Save details for future payments with ACH Direct Debit](https://docs.stripe.com/payments/ach-direct-debit/set-up-payment.md) flow to verify a customer's bank account with micro-deposits.

It should be only called when [SetupIntent](https://docs.stripe.com/api/setup_intents.md) is in the `requires_action` state, and contains a `next_action` field that has a `type` equal to `verify_with_microdeposits`.
Refer to our [integration guide](https://docs.stripe.com/payments/acss-debit/set-up-payment.md) for more details.

> Verification can fail for several reasons. The failure may happen synchronously as a direct error response, or asynchronously through a `payment_intent.payment_failed` webhook event.
> Refer to our [integration guide](https://docs.stripe.com/payments/acss-debit/accept-a-payment.md) for more details.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
    - `amounts`
      An array of two positive integers, in *cents*, equal to the values of the micro-deposits sent to the bank account.
    - `descriptor_code`
      A six-character code starting with SM present in the microdeposit sent to the bank account.

### Example

```title
Verify with micro-deposits for setup
```

## Handle a next action

`stripe.handleNextAction(options: object)`

Use `stripe.handleNextAction` in the [finalizing payments on the server](https://docs.stripe.com/payments/finalize-payments-on-the-server.md#next-actions)
flow to finish confirmation of a [SetupIntent](https://docs.stripe.com/api/setup_intents.md) with the `requires_action` status.
It will throw an error if the SetupIntent has a different status.

Depending on the payment method and required action, the customer may be temporarily redirected from your site
and brought back to the `return_url` [parameter](https://docs.stripe.com/api/setup_intents/confirm.md#confirm_setup_intent-return_url) provided when the SetupIntent is confirmed.

> Note that `stripe.handleNextAction` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.handleNextAction` may trigger a [3D Secure](https://docs.stripe.com/payments/3d-secure.md) authentication challenge.
> The authentication challenge requires a context switch that can be hard to follow on a screen-reader.
> Ensure that your form is accessible by ensuring that success or error messages are clearly read out.

- `options`
    - `clientSecret`
      The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

### Example

```title
Handle a next action
```

## Collect bank account details for setup

`stripe.collectBankAccountForSetup(options: object)`

Use `stripe.collectBankAccountForSetup` in the [Save bank details](https://docs.stripe.com/payments/ach-direct-debit/set-up-payment.md) flow for the [ACH Direct Debit](https://docs.stripe.com/payments/ach-direct-debit.md) payment method to collect the customer’s bank account in your payment form.
When called, it will automatically load an on-page modal UI to collect bank account details and verification, and attach the [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) to the [SetupIntent](https://docs.stripe.com/api/setup_intents.md).

- `options`
  Data to be sent with the request.
    - `clientSecret`
      The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.
    - `params`
      - `payment_method_type`
        The payment method type for the bank account details (e.g. `us_bank_account`)
      - `payment_method_data`
        Payment method specific data to be sent with the request
        - `billing_details`
          The customer's [billing_details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details).
`name` is required. Providing `email` allows your customer to receive [ACH Direct Debit mandate and microdeposit emails](https://docs.stripe.com/payments/ach-direct-debit.md#mandate-and-microdeposit-emails).
          - `name`
            The customer's name. The first and last name must be at minimum 2 characters each.
          - `email`
            The customer's email.
          - `address`
            The customer's billing address.
            - `city`
              City, district, suburb, town, or village.
            - `country`
              Two-letter country code ([ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)).
            - `line1`
              Address line 1 (e.g., street, PO Box, or company name).
            - `line2`
              Address line 2 (e.g., apartment, suite, unit, or building).
            - `postal_code`
              ZIP or postal code.
            - `state`
              State, county, province, or region.

### Example

```title
Collect bank account details for setup
```

## The Payment Request object

A `PaymentRequest` object is used to collect payment information through an interface controlled and styled by the browser itself (i.e., not by you or your page).

## Create a PaymentRequestObject

`stripe.paymentRequest(options: object)`

Use `stripe.paymentRequest` to create a `PaymentRequest` object.
Creating a `PaymentRequest` requires that you configure it with an `options` object.

In Safari, `stripe.paymentRequest` uses Apple Pay, and in other browsers it uses the [Payment Request API standard](https://www.w3.org/TR/payment-request/).

> `stripe.paymentRequest` abstracts over a number of implementation
> details to work uniformly across Apple Pay and the Payment Request
> browser standard. In particular, under the hood we set `supportedNetworks`
> to its most permissive setting, dynamically accounting for country
> and platform. It is currently not possible to override this and make
> `supportedNetworks` be more restrictive.

- `options`
  A set of options to create this `PaymentRequest` instance with.
These options can be updated using [`paymentRequest.update`](https://docs.stripe.com/js/payment_request/update.md).
    - `country`
      The two-letter country code of your Stripe account (e.g., `US`).
    - `currency`
      Three character currency code (e.g., `usd`).
    - `total`
      A [PaymentItem](#payment_item_object) object.
This `PaymentItem` is shown to the customer in the browser’s payment interface.
    - `displayItems`
      An array of [PaymentItem](#payment_item_object) objects.
These objects are shown as line items in the browser’s payment interface.
Note that the sum of the line item amounts does not need to add up to the `total` amount above.
    - `requestPayerName`
      By default, the browser‘s payment interface only asks the customer for actual payment information.
A customer name can be collected by setting this option to `true`.
This collected name will appears in the [PaymentResponse](https://docs.stripe.com/js/appendix/payment_response.md) object.

We highly recommend you collect name as this also results in collection of billing address for Apple Pay.
The billing address can be used to perform address verification and block fraudulent payments.
For all other payment methods, the billing address is automatically collected when available.
    - `requestPayerEmail`
      See the [`requestPayerName`](#stripe_payment_request-options-requestPayerName) option.
    - `requestPayerPhone`
      See the [`requestPayerName`](#stripe_payment_request-options-requestPayerName) option.
    - `requestShipping`
      Collect shipping address by setting this option to `true`.
The address appears in the [PaymentResponse](https://docs.stripe.com/js/appendix/payment_response.md).

You must also supply a valid [ShippingOptions] to the `shippingOptions` property.
This can be up front at the time `stripe.paymentRequest` is called, or in response to a `shippingaddresschange` event using the `updateWith` callback.
    - `shippingOptions`
      An array of [ShippingOption](https://docs.stripe.com/js/appendix/shipping_option.md) objects.
The first shipping option listed appears in the browser payment interface as the default option.
    - `disableWallets`
      An array of wallet strings.
Can be one or more of `applePay`, `googlePay`, `link`, and `browserCard`.
Use this option to disable Apple Pay, Google Pay, Link (also known as Onelink in the UK), and/or browser-saved cards.
    - `applePay`
      Specify Apple Pay specific options. These are passed through to the Apple Pay API.
      - `recurringPaymentRequest`
        Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `regularBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `trialBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `billingAgreement`
      - `deferredPaymentRequest`
        Specify a request to set up a deferred payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepaydeferredpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `deferredBilling`
          - `amount`
          - `amountType`
            Indicates whether the billing amount is known at request time. When set to 'final', the Apple Pay payment sheet shows the configured amount.
          - `label`
          - `deferredPaymentDate`
        - `billingAgreement`
        - `freeCancellationDate`
          If set, you must also supply a freeCancellationDateTimeZone.
        - `freeCancellationDateTimeZone`
          If set, you must also supply a freeCancellationDate.

These are [tz](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) timezones such as `America/Los_Angeles`, `Europe/Dublin`, and `Asia/Singapore`.
      - `automaticReloadPaymentRequest`
        Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `automaticReloadBilling`
          - `amount`
          - `label`
          - `automaticReloadPaymentThresholdAmount`
        - `billingAgreement`
      - `cardFunding`
        By default, Apple Pay allows both credit and debit cards.

You can specify if you only want to support one type of card with either 'supportsDebit' or 'supportsCredit'.
    - `onBehalfOf`
      The Stripe account ID which is the business of record. See [use cases](https://docs.stripe.com/connect/charges.md) to determine if this option is relevant for your integration. This should match the [on_behalf_of](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-on_behalf_of) provided on the Intent used when confirming payment.

### Example

```title
Create a PaymentRequestObject
```

## Check if a payment can be made

`paymentRequest.canMakePayment()`

Returns a `Promise` that resolves with an object detailing if an
enabled wallet is ready to pay. If no wallet is available, it
resolves with `null`. The resolution object has the properties
in the table below.

When using a custom button, inspect the return object's properties to determine which wallet branding to display.

> `canMakePayment` resolves to `null` outside the following supported cases:
> 
> * Safari 10.1+ (desktop and mobile)
>   * with a saved Apple Pay card
>   * or when in a Private Browsing window
>   * or when the “Allow websites to check if Apple Pay is set up” preference is disabled
> * Chrome 61+ (desktop and mobile)
>   * with a saved Google Pay card
>   * or when the browser has a saved card (i.e. autofill)

### Return object properties

- `applePay`
  `true` if Apple Pay wallet is ready to pay.
Use a custom button that conforms to the Apple Pay [Human Interface Guidelines](https://developer.apple.com/apple-pay/web-human-interface-guidelines/).

- `googlePay`
  `true` if Google Pay wallet is ready to pay.
Use a custom button that conforms to the Google Pay [Brand Guidelines](https://developers.google.com/pay/api/web/guides/brand-guidelines).

- `link`
  `true` if Link wallet is ready to pay (Link is also known as Onelink in the UK).
Link is not supported in custom button configurations.

### Example

```title
paymentRequest.canMakePayment
```

## Show the payment request interface

`paymentRequest.show()`

Shows the browser’s payment interface.
This method must be called as the result of a user interaction (for example, in a click handler).

### Example

```title
Show the payment request interface
```

## Update a PaymentRequest object

`paymentRequest.update(options: object)`

`PaymentRequest` instances can be updated with an options object.
Available options are documented below.

`paymentRequest.update` can only be called when the browser payment interface is not showing.
To update the `PaymentRequest` right before the payment interface is initiated, call `paymentRequest.update` in your click event handler before calling [`paymentRequest.show`](https://docs.stripe.com/js/payment_request/show.md).

- `options`
  A set of options to update this PaymentRequest instance with.
    - `currency`
      Three character currency code (e.g., `usd`).
    - `total`
      A [PaymentItem](#payment_item_object) object.
This `PaymentItem` is shown to the customer in the browser’s payment interface.
    - `displayItems`
      An array of [PaymentItem](#payment_item_object) objects.
These payment items are shown as line items in the browser’s payment interface.
Note that the sum of the line item amounts does not need to add up to the `total` amount above.
    - `shippingOptions`
      An array of [ShippingOption](https://docs.stripe.com/js/appendix/shipping_option.md) objects.
The first shipping option listed appears in the browser payment interface as the default option.
    - `applePay`
      Specify Apple Pay specific options. These are passed through to the Apple Pay API.
      - `recurringPaymentRequest`
        Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `regularBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `trialBilling`
          - `amount`
          - `label`
          - `recurringPaymentStartDate`
          - `recurringPaymentEndDate`
          - `recurringPaymentIntervalUnit`
          - `recurringPaymentIntervalCount`
        - `billingAgreement`
      - `deferredPaymentRequest`
        Specify a request to set up a deferred payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepaydeferredpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `deferredBilling`
          - `amount`
          - `amountType`
            Indicates whether the billing amount is known at request time. When set to 'final', the Apple Pay payment sheet shows the configured amount.
          - `label`
          - `deferredPaymentDate`
        - `billingAgreement`
        - `freeCancellationDate`
          If set, you must also supply a freeCancellationDateTimeZone.
        - `freeCancellationDateTimeZone`
          If set, you must also supply a freeCancellationDate.

These are [tz](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) timezones such as `America/Los_Angeles`, `Europe/Dublin`, and `Asia/Singapore`.
      - `automaticReloadPaymentRequest`
        Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
        - `paymentDescription`
        - `managementURL`
        - `automaticReloadBilling`
          - `amount`
          - `label`
          - `automaticReloadPaymentThresholdAmount`
        - `billingAgreement`
      - `cardFunding`
        By default, Apple Pay allows both credit and debit cards.

You can specify if you only want to support one type of card with either 'supportsDebit' or 'supportsCredit'.

### Example

```title
Update a PaymentRequest
```

## PaymentRequest events

`PaymentRequest` instances emit several different types of events.

## Token event

`paymentRequest.on(event: string, handler: function)`

Stripe.js automatically creates a [Token](https://docs.stripe.com/api/tokens.md) after the customer is done interacting with the browser’s payment interface.
To access the created `Token`, listen for this event.

- `event`
  The name of the event. In this case, `token`.

- `handler`
  A callback function that will be called with a [PaymentResponse](https://docs.stripe.com/js/appendix/payment_response.md) object when the event is fired.
The `PaymentResponse` object will contain a `token` field.

### Example

```title
Handle 'token' event
```

## PaymentMethod event

`paymentRequest.on(event: string, handler: function)`

Stripe.js automatically creates a [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) after the customer is done interacting with the browser’s payment interface.
To access the created `PaymentMethod`, listen for this event.

- `event`
  The name of the event. In this case, `paymentmethod`.

- `handler`
  A callback function that will be called with a [PaymentResponse](https://docs.stripe.com/js/appendix/payment_response.md) object when the event is fired.
The `PaymentResponse` object will contain a `paymentMethod` field.

### Example

```title
Handle 'paymentmethod' event
```

## Source event

`paymentRequest.on(event: string, handler: function)`

Stripe.js automatically creates a [Source](https://docs.stripe.com/api/sources.md) after the customer is done interacting with the browser’s payment interface.
To access the created source, listen for this event.

- `event`
  The name of the event. In this case, `source`.

- `handler`
  A callback function that will be called with a [PaymentResponse](https://docs.stripe.com/js/appendix/payment_response.md) object when the event is fired.
The `PaymentResponse` object will contain a `source` field.

### Example

```title
Handle 'source' event
```

## Cancel event

`paymentRequest.on(event: string, handler: function)`

The `cancel` event is emitted from a [PaymentRequest](https://docs.stripe.com/js/payment_request.md) when the browser‘s payment interface is dismissed.

Note that in some browsers, the payment interface may be dismissed by the customer even after they authorize the payment.
This means that you may receive a `cancel` event on your PaymentRequest object after receiving a `token`, `paymentmethod`, or `source` event.
If you’re using the `cancel` event as a hook for canceling the customer’s order, make sure you also refund the payment that you just created.

- `event`
  The name of the event.
In this case, `cancel`.

- `handler`
  A callback function that you will provide that will be called when the event is fired.

### Example

```title
Handle 'cancel' event
```

## Shipping address change event

`paymentRequest.on(event: string, handler: function)`

The `shippingaddresschange` event is emitted from a [PaymentRequest](https://docs.stripe.com/js/payment_request.md) whenever the customer selects a new address in the browser's payment interface.

- `event`
  The name of the event. In this case, `shippingaddresschange`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

When called it will be passed an event object with the following properties:
    - `updateWith`
      `updateWith(updateDetails) => void` is a Stripe.js provided function that is called with an [UpdateDetails](https://docs.stripe.com/js/appendix/update_details.md) object to merge your updates into the current `PaymentRequest` object.
Note that if you subscribe to `shippingaddresschange` events, then you must call `updateWith` within 30 seconds.
    - `shippingAddress`
      The customer's selected shipping address.

To maintain privacy, browsers may anonymize the shipping address by removing sensitive information that is not necessary to calculate shipping costs.
Depending on the country, some fields can be missing or partially redacted.
For example, the shipping address in the U.S. may only contain a city, state, and ZIP code.
The full shipping address appears in the [PaymentResponse](https://docs.stripe.com/js/appendix/payment_response.md) object after the purchase is confirmed in the browser’s payment interface
      - `country`
        Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
      - `addressLine`
        An array of address line items. For example, `185 Berry St.`, `Suite 500`, `P.O. Box 12345`, etc.
      - `region`
        The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
      - `city`
        The name of a city, town, village, etc.
      - `postalCode`
        The postal code or ZIP code, also known as PIN code in India.
      - `recipient`
        The name of the recipient. This might be a person, a business name, or contain "care of" (c/o) instructions.
      - `phone`
        The phone number of the recipient. Note that this might be different from any phone number you collect with [`requestPayerPhone`](https://docs.stripe.com/js/payment_request/create.md#stripe_payment_request-options-requestPayerPhone).
      - `sortingCode`
        The sorting code as used in, for example, France. Not present on Apple platforms.
      - `dependentLocality`
        A logical subdivision of a city. Can be used for things like neighborhoods, boroughs, districts, or UK dependent localities. Not present on Apple platforms.

### Example

```title
Handle 'shippingaddresschange' event
```

## Shipping option change event

`paymentRequest.on(event: string, handler: function)`

The `shippingoptionchange` event is emitted from a [PaymentRequest](https://docs.stripe.com/js/payment_request.md) whenever the customer selects a new shipping option in the browser's payment interface.

- `event`
  The name of the event. In this case, `shippingoptionchange`.

- `handler`
  `handler(event) => void` is a **callback function** that you provide that will be called when the event is fired.

When called it will be passed an event object with the following properties:
    - `updateWith`
      `updateWith(updateDetails) => void` is a Stripe.js provided function that is called with an [UpdateDetails](https://docs.stripe.com/js/appendix/update_details.md) object to merge your updates into the current `PaymentRequest` object.
Note that if you subscribe to `shippingoptionchange` events, then you must call `updateWith` within 30 seconds.
    - `shippingOption`
      The customer's selected [ShippingOption](https://docs.stripe.com/js/appendix/shipping_option.md).

### Example

```title
Handle 'shippingoptionchange' event
```

## Confirmation Tokens

ConfirmationTokens transport client-side data collected by Stripe.js to your server. You can use them to confirm a PaymentIntent or SetupIntent on your server.

## Create a ConfirmationToken with Elements

`stripe.createConfirmationToken(options: object)`

Convert payment information collected by Elements into a [ConfirmationToken](https://docs.stripe.com/api/confirmation_tokens.md) object.

Use this method if you want to [confirm payment on your server](https://docs.stripe.com/payments/finalize-payments-on-the-server.md) or [confirm payment on a subsequent page](https://docs.stripe.com/payments/build-a-two-step-confirmation.md).

- `options`
    - `elements`
      The [Elements](#payment_element_create) instance that was used to create the Express Checkout Element or Payment Element. Calling `stripe.createConfirmationToken` pulls payment method, billing address, and shipping address data from the Elements instance.
    - `params`
      Parameters that will be passed on to the Stripe API.
      - `payment_method_data`
        When you call `stripe.createConfirmationToken`, payment details are collected from Elements.
You can include additional `payment_method_data` fields, which will be merged with the data collected from Elements.
Refer to the [PaymentMethod API](https://docs.stripe.com/api/payment_methods/create.md) for a full list of parameters.
        - `billing_details`
          [Billing information](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the PaymentMethod that may be used or required by particular types of payment methods.
        - `allow_redisplay`
          Indicates whether the payment method can be displayed to the customer in subsequent checkout flows. The value passed here will override the [allow_redisplay](docs/api/payment_methods/object#payment_method_object-allow_redisplay) determined by the provided `elements` parameter.
      - `shipping`
        The [shipping details](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-shipping) for the payment, if collected. You can't specify `shipping` if `mode: 'setup'` is specified on the `elements` object.

**Note**: When the [Address Element](https://docs.stripe.com/js/element/address_element.md) in shipping mode is being used, shipping address details are collected from the Address Element. You can also include additional `shipping` fields, which will be merged with the data collected from the Element, overriding any fields that were also collected by the Address Element.
      - `return_url`
        The URL to redirect your customer back to after they authenticate or cancel their payment on the payment method's app or site.
If you'd prefer to redirect to a mobile application, you can alternatively supply an application URI scheme.
This parameter is only used for cards and other redirect-based payment methods.
      - `metadata`
        Set of [key-value pairs](https://docs.stripe.com/api/metadata.md) that you can attach to the ConfirmationToken. This can be useful for storing additional information about the object in a structured format.

Note that the metadata is saved on the Confirmation Token object but isn't returned in the [frontend response](https://docs.stripe.com/metadata.md#requests). You can retrieve the metadata on the server with a [retrieve confirmation token request](https://docs.stripe.com/api/confirmation_tokens/retrieve.md).

### Example

```title
Create a ConfirmationToken
```

## Payment Methods

PaymentMethod objects represent your customer's payment instruments. They can be used with PaymentIntents to collect payments or saved to Customer objects to store instrument details for future payments.

Related guides: [Payment Methods](https://docs.stripe.com/payments/payment-methods.md) and [More Payment Scenarios](https://docs.stripe.com/payments/more-payment-scenarios.md).

## Create a PaymentMethod

`stripe.createPaymentMethod(paymentMethodData: object)`

Use `stripe.createPaymentMethod` to convert payment information collected by elements into a [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) object that you safely pass to your server to use in an API call.

**NOTE:** In most integrations, you will not need to use this method. Instead, use methods like [stripe.confirmCardPayment](https://docs.stripe.com/js/payment_intents/confirm_card_payment.md), which will automatically create a PaymentMethod when you confirm a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md).

- `paymentMethodData`
  Refer to the [PaymentMethod API](https://docs.stripe.com/api/payment_methods/create.md) for a full list of parameters.
    - `type`
      The type of the [PaymentMethod](https://docs.stripe.com/api/payment_methods/create.md) to create.
Refer to the [PaymentMethod API](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-type) for all possible values.
    - `card`
      A `card` or `cardNumber` Element.
    - `au_becs_debit`
      An `auBankAccount` Element.
    - `fpx`
      An `fpx` Element.
    - `fpx[bank]`
      The customer's [bank](https://docs.stripe.com/payments/fpx/accept-a-payment.md#bank-reference).
    - `netbanking[bank]`
      The customer's bank.
    - `ideal`
      An `idealBank` Element.
    - `ideal[bank]`
      The customer's [bank](https://docs.stripe.com/sources/ideal.md#specifying-customer-bank).
    - `sepa_debit`
      An `iban` Element.
    - `sepa_debit[iban]`
      An IBAN account number.
    - `upi[vpa]`
      The customer's VPA.
    - `billing_details`
      [Billing information](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the PaymentMethod that may be used or required by particular types of payment methods.

### Example

```title
Create a PaymentMethod
```

## Create a PaymentMethod with Elements

`stripe.createPaymentMethod(options: object)`

Use `stripe.createPaymentMethod` to convert payment information collected by elements into a [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) object that you safely pass to your server to use in an API call.

**NOTE:** In most integrations, you will not need to use this method. Instead, use methods like [stripe.confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment.md), which will automatically create a PaymentMethod when you confirm a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md).

- `options`
    - `elements`
      The [Elements](#payment_element_create) instance that was used to create the Payment Element. It will be used to pull payment method and billing address data from.
    - `params`
      Parameters that will be passed on to the Stripe API. Refer to the [PaymentMethod API](https://docs.stripe.com/api/payment_methods/create.md) for a full list of parameters.
      - `billing_details`
        [Billing information](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the PaymentMethod that may be used or required by particular types of payment methods.

### Example

```title
Create a PaymentMethod
```

## Tokens

Stripe uses tokens to collect sensitive client information without exposing it. When you use the [Payment Intents API](https://docs.stripe.com/js/payment_intents.md), the client handles tokenization and you don't have to create tokens yourself.

Stripe.js provides the following method to create [Tokens](https://docs.stripe.com/api/tokens.md).

## Create a Token

`stripe.createToken(tokenType: string, data?: object)`

## Show verification modal

`stripe.verifyIdentity(clientSecret: string)`

Use `stripe.verifyIdentity` to display an [Identity](https://docs.stripe.com/identity.md) modal that securely collects verification information.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/identity/verification_sessions/object.md#identity_verification_session_object-client_secret) of the `VerificationSession`.

### Example

```title
Show verification modal
```

## Create an ephemeral key nonce

`stripe.createEphemeralKeyNonce(options: object)`

Use `stripe.createEphemeralKeyNonce` in the [Issuing Elements](https://docs.stripe.com/issuing/elements.md) flow to create an ephemeral key nonce. Refer to our [integration guide](https://docs.stripe.com/issuing/elements.md#web-api-integration) for more details.

- `options`
  Data to be sent with the request.
    - `issuingCard`
      The `id` of an existing [Issuing card](https://docs.stripe.com/api/issuing/cards/object.md). The nonce returned by this method can only be used to retrieve this Issuing card.

### Example

```title
Create ephemeral key nonce
```

## Retrieve an Issuing card

`stripe.retrieveIssuingCard(issuingCard: string, options: object)`

Use `stripe.retrieveIssuingCard` in the [Issuing Elements](https://docs.stripe.com/issuing/elements.md) flow to retrieve an Issuing card.
Note that once you retrieve the card, you still need to display the card details in Elements.
You need to pass in the `issuing_elements_2` beta to the Stripe instance to access this method.
Refer to our [integration guide](https://docs.stripe.com/issuing/elements.md#web-api-integration) for more details.

- `issuingCard`
  The `id` of an existing [Issuing card](https://docs.stripe.com/api/issuing/cards/object.md).

- `options`
  An options object to configure the Issuing card retrieved from this method.
    - `ephemeralKeySecret`
      The ephemeral key secret retrieved from the API.
The card `id` used to retrieve the ephemeral key must match the card `id` passed into this method.
See the [integration guide](https://docs.stripe.com/issuing/elements.md#create-secure-endpoint) for more details.
    - `nonce`
      The ephemeral key nonce returned by [stripe.createEphemeralKeyNonce](https://docs.stripe.com/js/issuing/create_ephemeral_key_nonce.md).
The card `id` used to create the nonce must match the card `id` passed into this method.
    - `expand`
      An array of Card fields to expand in the response from the Stripe API. Can be one or more of `number`, `cvc`, and `pin.number`. Expand fields as required to display Issuing Elements for those fields.

### Example

```title
Retrieve an Issuing card
```

## Financial Connections

[Stripe Financial Connections](https://docs.stripe.com/financial-connections.md) enables your users to
securely share their financial data by linking their external financial accounts to your
business.

## Collect Financial Connections Accounts

`stripe.collectFinancialConnectionsAccounts(options: object)`

Use `stripe.collectFinancialConnectionsAccounts` in the [Add a Financial Connections
Account to retrieve data](https://docs.stripe.com/financial-connections/other-data-powered-products.md) flow.
When called, it will load the [Authentication Flow](https://docs.stripe.com/financial-connections/fundamentals.md#authentication-flow),
an on-page modal UI which allows your user to securely link their external financial
account(s).

- `options`
    - `clientSecret`
      The `client_secret` of the [Financial Connections Session](https://docs.stripe.com/api/financial_connections/session.md).

### Example

```title
Collect Financial Connections Accounts
```

## Use Financial Connections to collect a bank account Token for payouts

`stripe.collectBankAccountToken(options: object)`

Use `stripe.collectBankAccountToken` in the [Add a Financial Connections Account to a
US Custom Connect account](https://docs.stripe.com/financial-connections/connect-payouts.md) flow. When
called, it will load the [Authentication Flow](https://docs.stripe.com/financial-connections/fundamentals.md#authentication-flow),
an on-page modal UI which allows your user to securely link their external financial
account for payouts.

- `options`
    - `clientSecret`
      The `client_secret` of the [Financial Connections Session](https://docs.stripe.com/api/financial_connections/session.md).

### Example

```title
Use Financial Connections to collect a bank account Token for payouts
```

## Retrieve card networks

In order to comply with [co-badged cards compliance](https://docs.stripe.com/co-badged-cards-compliance), eligible businesses must honor customers’ card brand choice for co-badged cards.

Stripe-hosted UIs, such as [Checkout](https://docs.stripe.com/payments/checkout), [Payment Links](https://docs.stripe.com/payment-links), and [Elements](https://docs.stripe.com/payments/elements), can automatically display a network selector when you meet the elgibility criteria. You can migrate to a Stripe-hosted UI to use these features.

If you instead maintain a [custom checkout integration](https://docs.stripe.com/co-badged-cards-compliance?type=custom-integration#integration-guides) and [have access to raw card data APIs](https://support.stripe.com/questions/enabling-access-to-raw-card-data-apis), Stripe provides the following method to identify available networks for customer card numbers.

## Retrieve card networks

`stripe.retrieveCardNetworks(rawCardNumber: string)`

Used in [custom integrations](https://docs.stripe.com/co-badged-cards-compliance?type=custom-integration) to support co-badged card compliance.

Stripe-hosted UIs, such as [Checkout](https://docs.stripe.com/payments/checkout), [Payment Links](https://docs.stripe.com/payment-links), and [Elements](https://docs.stripe.com/payments/elements), will automatically display a network selector when you meet the [applicability criteria](https://docs.stripe.com/co-badged-cards-compliance?type=custom-integration#when-regulation-applies), if configured properly. You can migrate to a Stripe-hosted UI to use these features.

- `rawCardNumber`
  The card number entered in your card collection form. When passed 8 or more digits of the card number, the method starts returning available networks for the card.

In order to pass these card details to Stripe, you must [have access to raw card data APIs](https://support.stripe.com/questions/enabling-access-to-raw-card-data-apis).

### Example

```title
Retrieve card networks
```

## The CssFontSource object

This object is used to pass custom fonts via a stylesheet URL when creating an [Elements](https://docs.stripe.com/js/elements_object/create.md) object.

- `cssSrc`
  A relative or absolute URL pointing to a CSS file with [@font-face](https://developer.mozilla.org/en/docs/Web/CSS/@font-face) definitions. The file must be hosted on https. For example:

```
https://fonts.googleapis.com/css?family=Open+Sans
```

If you use a [content security policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) (CSP), the file might require [additional directives](https://docs.stripe.com/security/guide.md#content-security-policy).

## The CustomFontSource object

This object is used to pass custom fonts when creating an [Elements](https://docs.stripe.com/js/elements_object/create.md) object.

- `family`
  The name to give the font.

- `src`
  A valid [src](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src) value pointing to your custom font file.
This is usually (though not always) a link to a file with a `.woff` , `.otf`, or `.svg` suffix. The file must be hosted on https.

- `display`
  A valid [font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) value.

- `style`
  One of `normal`, `italic`, `oblique`.
Defaults to `normal`.

- `unicodeRange`
  A valid [unicode-range](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/unicode-range) value.

- `weight`
  A valid [font-weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight).
Note that this is a string, not a number.

## The PaymentItem object

The `PaymentItem` object is used to configure a [PaymentRequest](https://docs.stripe.com/js/payment_request/create.md).

- `amount`
  The amount in the currency's subunit (e.g. cents, yen, etc.)

- `label`
  A name that the browser shows the customer in the payment interface.

- `pending`
  If you might change this amount later (for example, after you have calcluated shipping costs), set this to `true`.
Note that browsers treat this as a hint for how to display things, and not necessarily as something that will prevent submission.

## The PaymentResponse object

This object is returned as the payload of the `PaymentRequest` object's [`token`](https://docs.stripe.com/js/payment_request/events/on_token.md), [`paymentmethod`](https://docs.stripe.com/js/payment_request/events/on_payment_method.md), or [`source`](https://docs.stripe.com/js/payment_request/events/on_source.md) event handlers.

- `token`
  A [Token](https://docs.stripe.com/api/tokens.md) object.
Present if this was the result of a `token` event listener.

- `paymentMethod`
  A [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) object.
Present if this was the result of a `paymentmethod` event listener.

- `source`
  A [Source](https://docs.stripe.com/api/sources.md) object.
Present if this was the result of a `source` event listener.

- `complete`
  `complete(status) => void` is a Stripe.js provided function.
Call this when you have processed the token data provided by the API.
Note that you must must call `complete` within 30 seconds.

Accepts one of the following values:
    - `'success'`
      Report to the browser that the payment was successful, and that it can close any active payment interface.
    - `'fail'`
      Report to the browser that you were unable to process the customer‘s payment.
Browsers may re-show the payment interface, or simply show a message and close.
    - `'invalid_payer_name'`
      Equivalent to `fail`, except that the browser can choose to show a more-specific error message.
    - `'invalid_payer_phone'`
      Equivalent to `fail`, except that the browser can choose to show a more-specific error message.
    - `'invalid_payer_email'`
      Equivalent to `fail`, except that the browser can choose to show a more-specific error message.
    - `'invalid_shipping_address'`
      Equivalent to `fail`, except that the browser can choose to show a more-specific error message.

- `payerName`
  The customer's name.
Only present if it was explicitly [asked for](https://docs.stripe.com/js/payment_request/create.md#stripe_payment_request-options-requestPayerName) when [creating the PaymentRequest object](https://docs.stripe.com/js/payment_request/create.md).

- `payerEmail`
  The customer's email.
Only present if it was explicitly [asked for](https://docs.stripe.com/js/payment_request/create.md#stripe_payment_request-options-requestPayerEmail) when [creating the PaymentRequest object](https://docs.stripe.com/js/payment_request/create.md).

- `payerPhone`
  The customer's phone.
Only present if it was explicitly [asked for](https://docs.stripe.com/js/payment_request/create.md#stripe_payment_request-options-requestPayerPhone) when [creating the PaymentRequest object](https://docs.stripe.com/js/payment_request/create.md).

- `shippingAddress`
  The final shipping address the customer selected.

Only populated when `requestShipping` is `true` when [creating the PaymentRequest object](https://docs.stripe.com/js/payment_request/create.md), and you've supplied at least one `ShippingOption`.
    - `country`
      Two-letter country code, capitalized. Valid two-letter country codes are specified by ISO3166 alpha-2.
    - `addressLine`
      An array of address line items. For example, `185 Berry St.`, `Suite 500`, `P.O. Box 12345`, etc.
    - `region`
      The most coarse subdivision of a country. Depending on the country, this might correspond to a state, a province, an oblast, a prefecture, or something else along these lines.
    - `city`
      The name of a city, town, village, etc.
    - `postalCode`
      The postal code or ZIP code, also known as PIN code in India.
    - `recipient`
      The name of the recipient. This might be a person, a business name, or contain "care of" (c/o) instructions.
    - `phone`
      The phone number of the recipient. Note that this might be different from any phone number you collect with [`requestPayerPhone`](https://docs.stripe.com/js/payment_request/create.md#stripe_payment_request-options-requestPayerPhone).
    - `sortingCode`
      The sorting code as used in, for example, France. Not present on Apple platforms.
    - `dependentLocality`
      A logical subdivision of a city. Can be used for things like neighborhoods, boroughs, districts, or UK dependent localities. Not present on Apple platforms.

- `shippingOption`
  The final [ShippingOption](https://docs.stripe.com/js/appendix/shipping_option.md) the customer selected.

Only present when `requestShipping` is `true` when [creating the PaymentRequest object](https://docs.stripe.com/js/payment_request/create.md), and you've supplied at least one `ShippingOption`.

- `walletName`
  The unique name of the wallet the customer chose to authorize payment.
For example, `browserCard`.

## The ShippingOption object

The `ShippingOption` object describes a shipping method used with a [PaymentRequest](https://docs.stripe.com/js/payment_request/create.md).

- `id`
  A unique ID you create to keep track of this shipping option.
You’ll be told the ID of the selected option on changes and on completion.

- `label`
  A short label for this shipping option.

- `detail`
  A longer description of this shipping option.

- `amount`
  The amount to show for this shipping option.
If the cost of this shipping option depends on the shipping address the customer enters, listen for the `shippingaddresschange` event.

## The Style object

Elements are styled using a `Style` object, which consists of CSS properties nested under objects for any of the following variants:

* `base`, base variant—all other variants inherit from these styles
* `complete`, applied when the Element has valid input
* `empty`, applied when the Element has no customer input
* `invalid`, applied when the Element has invalid input

The following pseudo-classes and pseudo-elements can also be styled using a nested object inside of a variant:

* `:hover`
* `:focus`
* `::placeholder`
* `::selection`
* `:-webkit-autofill`
* `:disabled`, available for all Elements except the `paymentRequestButton` Element.
* `::-ms-clear`, available for the `cardNumber`, `cardExpiry`, and `cardCvc` Elements.
  Inside the `::-ms-clear` selector, the display property can be customized.

The following CSS properties are supported:

### Supported CSS properties

- `backgroundColor`
  The [background-color](https://developer.mozilla.org/en-US/docs/Web/CSS/background-color) CSS property.

This property works best with the `::selection` pseudo-class.
In other cases, consider setting the background color on the Element's container instead.

- `color`
  The [color](https://developer.mozilla.org/en-US/docs/Web/CSS/color) CSS property.

- `fontFamily`
  The [font-family](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family) CSS property.

- `fontSize`
  The [font-size](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size) CSS property.

- `fontSmoothing`
  The [font-smoothing](https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth) CSS property.

- `fontStyle`
  The [font-style](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style) CSS property.

- `fontVariant`
  The [font-variant](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant) CSS property.

- `fontWeight`
  The [font-weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight) CSS property.

- `iconColor`
  A custom property, used to set the color of the icons that are rendered in an Element.

- `lineHeight`
  The [line-height](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height) CSS property.

To avoid cursors being rendered inconsistently across browsers, consider using a padding on the Element's container instead.

- `letterSpacing`
  The [letter-spacing](https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing) CSS property.

- `textAlign`
  The [text-align](https://developer.mozilla.org/en-US/docs/Web/CSS/text-align) CSS property.

Available for the `cardNumber`, `cardExpiry`, `cardCvc` and `iban` Elements.

- `padding`
  The [padding](https://developer.mozilla.org/en-US/docs/Web/CSS/padding) CSS property.

Available for the `idealBank` Element.
Accepts integer length with `px` unit as values.

- `textDecoration`
  The [text-decoration](https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration) CSS property.

- `textShadow`
  The [text-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/text-shadow) CSS property.

- `textTransform`
  The [text-transform](https://developer.mozilla.org/en-US/docs/Web/CSS/text-transform) CSS property.

### Example

```title
Creating a styled element
```

## The UpdateDetails object


This object is passed to the `updateWith` callback on a [PaymentRequest's](https://docs.stripe.com/js/payment_request/create.md) `shippingaddresschange` and `shippingoptionchange` events.

- `status`
  The browser uses this value to show an error message to the customer if they‘ve taken an action that invalidates the payment request.
The value must be one of the following:
    - `'success'`
      Let the customer proceed.
    - `'fail'`
      Prevent the customer from making the change they just made.
    - `'invalid_shipping_address'`
      Equivalent to `fail`, except we show a more specific error message.
Can only be used in a [`shippingaddresschange`](https://docs.stripe.com/js/payment_request/events/on_shipping_address_change.md) handler.

- `total`
  The new total amount, if applicable, as a [PaymentItem](#payment_item_object) object.

- `displayItems`
  An array of [PaymentItem](#payment_item_object) objects.
These PaymentItems are shown as line items in the browser‘s payment interface.
Note that the sum of the line item amounts does not need to add up to the total amount above.

- `shippingOptions`
  An array of [ShippingOption](https://docs.stripe.com/js/appendix/shipping_option.md) objects.
The first shipping option listed appears in the browser payment interface as the default option.

- `applePay`
  Specify Apple Pay specific options. These are passed through to the Apple Pay API.
    - `recurringPaymentRequest`
      Specify a request to set up a recurring payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayrecurringpaymentrequest) for more details.
      - `paymentDescription`
      - `managementURL`
      - `regularBilling`
        - `amount`
        - `label`
        - `recurringPaymentStartDate`
        - `recurringPaymentEndDate`
        - `recurringPaymentIntervalUnit`
        - `recurringPaymentIntervalCount`
      - `trialBilling`
        - `amount`
        - `label`
        - `recurringPaymentStartDate`
        - `recurringPaymentEndDate`
        - `recurringPaymentIntervalUnit`
        - `recurringPaymentIntervalCount`
    - `automaticReloadPaymentRequest`
      Specify a request to set up an automatic reload payment. See the [Apple Pay documentation](https://developer.apple.com/documentation/applepayontheweb/applepayautomaticreloadpaymentrequest) for more details.
      - `paymentDescription`
      - `managementURL`
      - `automaticReloadBilling`
        - `amount`
        - `label`
        - `automaticReloadPaymentThresholdAmount`

## Supported browsers


Stripe.js strives to support all recent versions of major browsers. For the sake of security and providing the best experience to the majority of customers, we do not support browsers that are no longer receiving security updates and represent a small minority of traffic. We support some older versions of evergreen browsers but recommend merchants keep their systems up to date for the best support.
We support the following desktop browser versions:

* Chrome 38+
* Safari 10.1+
* Firefox 29+
* Edge 15+
* Opera 25+

We support the following mobile browsers:
* iOS Safari 9+ and other browsers and web views which use the system-provided WebKit engine
* Android Chrome 38+
* Samsung Browser 7.1+

For browsers not explicitly supported, we limit support as follows:
* We require TLS 1.2 to be supported by the browser.
* We require browsers that are sufficiently modern enough that they support [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) in the JavaScript programming language.
* We respond to bug reports but do not proactively test other browsers.

If you have an issue with Stripe.js on a specific browser, please [contact us](https://support.stripe.com/contact) so we can improve its support.

## Cross-Origin Isolation


Currently, Stripe.js doesn't support [Cross-origin isolated sites](https://web.dev/articles/cross-origin-isolation-guide)

Cross-origin isolation requires support by all dependencies, and several key dependencies that enable our payment offerings don't yet provide support for this feature.

## Supported locales

The following subset of [IETF language tags](https://en.wikipedia.org/wiki/IETF_language_tag) can be used to configure localization in Stripe.js.

Value   | Locale                                   | Elements | Checkout
--------|------------------------------------------|----------|----------
`auto`  | Stripe detects the locale of the browser | ✔        | ✔
`ar`    | Arabic                                   | ✔        | ✔
`bg`    | Bulgarian (Bulgaria)                     | ✔        | ✔
`cs`    | Czech (Czech Republic)                   | ✔        | ✔
`da`    | Danish (Denmark)                         | ✔        | ✔
`de`    | German (Germany)                         | ✔        | ✔
`el`    | Greek (Greece)                           | ✔        | ✔
`en`    | English                                  | ✔        | ✔
`en-GB` | English (United Kingdom)                 | ✔        | ✔
`es`    | Spanish (Spain)                          | ✔        | ✔
`es-419`| Spanish (Latin America)                  | ✔        | ✔
`et`    | Estonian (Estonia)                       | ✔        | ✔
`fi`    | Finnish (Finland)                        | ✔        | ✔
`fil`   | Filipino (Philipines)                    | ✔        | ✔
`fr`    | French (France)                          | ✔        | ✔
`fr-CA` | French (Canada)                          | ✔        | ✔
`he`    | Hebrew (Israel)                          | ✔        | ✔
`hr`    | Croatian (Croatia)                       | ✔        | ✔
`hu`    | Hungarian (Hungary)                      | ✔        | ✔
`id`    | Indonesian (Indonesia)                   | ✔        | ✔
`it`    | Italian (Italy)                          | ✔        | ✔
`ja`    | Japanese (Japan)                         | ✔        | ✔
`ko`    | Korean (Korea)                           | ✔        | ✔
`lt`    | Lithuanian (Lithuania)                   | ✔        | ✔
`lv`    | Latvian (Latvia)                         | ✔        | ✔
`ms`    | Malay (Malaysia)                         | ✔        | ✔
`mt`    | Maltese (Malta)                          | ✔        | ✔
`nb`    | Norwegian Bokmål                         | ✔        | ✔
`nl`    | Dutch (Netherlands)                      | ✔        | ✔
`pl`    | Polish (Poland)                          | ✔        | ✔
`pt-BR` | Portuguese (Brazil)                      | ✔        | ✔
`pt`    | Portuguese (Brazil)                      | ✔        | ✔
`ro`    | Romanian (Romania)                       | ✔        | ✔
`ru`    | Russian (Russia)                         | ✔        | ✔
`sk`    | Slovak (Slovakia)                        | ✔        | ✔
`sl`    | Slovenian (Slovenia)                     | ✔        | ✔
`sv`    | Swedish (Sweden)                         | ✔        | ✔
`th`    | Thai (Thailand)                          | ✔        | ✔
`tr`    | Turkish (Turkey)                         | ✔        | ✔
`vi`    | Vietnamese (Vietnam)                     | ✔        | ✔
`zh`    | Chinese Simplified (China)               | ✔        | ✔
`zh-HK` | Chinese Traditional (Hong Kong)          | ✔        | ✔
`zh-TW` | Chinese Traditional (Taiwan)             | ✔        | ✔

## Cookies


There are some cookies that are essential for Stripe to function properly. These Necessary Cookies
provide secure access to the site and enable page navigation. Stripe.js only uses essential cookies
to ensure the site works properly, detect and prevent fraud, and understand how people interact with Stripe.

You can find more information in the [Stripe Cookies Policy](https://stripe.com/cookies-policy/legal).

## Viewport meta tag requirements

In order to provide a great user experience for 3D Secure on all devices,
you should set your page's viewport `width` to `device-width` with the
[viewport meta tag](https://developer.mozilla.org/en-US/docs/Mozilla/Mobile/Viewport_meta_tag).

There are several other viewport settings, and you can configure those
based on your needs. Just make sure you include `width=device-width`
somewhere in your configuration.

## Handle card payment with an Element

`stripe.handleCardPayment(clientSecret: string, element: Element, data?: object)`

*`handleCardPayment` has been renamed to [confirmCardPayment](#stripe_confirm_card_payment).
In addition to the rename, we have slightly modified the arguments.
These changes do not affect the behavior of the method.
While we have no plans to ever remove support for `handleCardPayment`, we think the new name and arguments are easier to understand and better convey what the method is doing.*

Use `stripe.handleCardPayment(clientSecret, element, data?)` when the customer submits your payment form.
It will gather payment information from the element, which can be a `card` or `cardNumber` element, along with any other data you provide.
It will then confirm the `PaymentIntent` and carry out 3DS or other `next_action`s if they are required.

If you are using [Dynamic 3D Secure](https://docs.stripe.com/payments/3d-secure.md#three-ds-radar), `handleCardPayment` will trigger your Radar rules to execute and may open a dialog for your customer to authenticate their payment.

> Note that `stripe.handleCardPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.handleCardPayment` may trigger a [3D Secure](https://docs.stripe.com/payments/3d-secure.md) authentication challenge.
> This will be shown in a modal dialog and may be confusing for customers using assistive technologies like screen readers.
> You should make your form accessible by ensuring that success or error messages are clearly read out after this method completes.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `element`
  A `card` or `cardNumber` [Element](https://docs.stripe.com/js/element.md) that will be used to create a payment method.

- `data`
  Data to be sent with the request.
    - `payment_method_data`
      Use this parameter to supply additional data relevant to the payment method, such as billing details.
      - `billing_details`
        The [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.
    - `shipping`
      The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment, if collected.
    - `receipt_email`
      Email address that the receipt for the resulting payment will be sent to.
    - `setup_future_usage`
      Indicates that you intend to make future payments with this [PaymentIntent](https://docs.stripe.com/api/payment_intents.md)'s payment method.

If present, the `PaymentMethod` used with this PaymentIntent can be [attached to a Customer](https://docs.stripe.com/api/payment_methods/attach.md), even after the transaction completes.

Use `on_session` if you intend to only reuse the `PaymentMethod` when your customer is present in your checkout flow.
Use `off_session` if your customer may or may not be in your checkout flow.
See [saving card details during payment](https://docs.stripe.com/payments/cards/saving-cards-after-payment.md) to learn more.

Stripe uses `setup_future_usage` to dynamically optimize your payment flow and comply with regional legislation and network rules.
For example, if your customer is impacted by SCA, using `off_session` will ensure that they are authenticated while processing this PaymentIntent.
You will then be able to collect [off-session payments](https://docs.stripe.com/payments/cards/charging-saved-cards.md#off-session-payments-with-saved-cards) for this customer.

### Example

```title
Handle a card payment
```

## Handle card payment

`stripe.handleCardPayment(clientSecret: string, data?: object)`

*`handleCardPayment` has been renamed to [confirmCardPayment](#stripe_confirm_card_payment). In addition to the rename, we have slightly modified the arguments. These changes do not affect the behavior of the method. While we have no plans to ever remove support for `handleCardPayment`, we think the new name and arguments are easier to understand and better convey what the method is doing.*

Use `stripe.handleCardPayment(clientSecret, data?)` to advance the [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) towards completion when you are not gathering payment method information from an [Element](https://docs.stripe.com/js/elements_object/create_element.md).

Call this variation when you have already attached a card to this `PaymentIntent` or if you want to attach an existing card to it.

> Note that `stripe.handleCardPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.handleCardPayment` may trigger a [3D Secure](https://docs.stripe.com/payments/3d-secure.md) authentication challenge.
> This will be shown in a modal dialog and may be confusing for customers using assistive technologies like screen readers.
> You should make your form accessible by ensuring that success or error messages are clearly read out after this method completes.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `data`
  Data to be sent with the request.
    - `payment_method`
      Use `payment_method` to specify an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) to use for this payment.

Only one of `payment_method_data` and `payment_method` is required.
    - `payment_method_data`
      Use this parameter to supply additional data relevant to the payment method, such as billing details.
      - `billing_details`
        The [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.
      - `card[token]`
        Converts the provided token into a `PaymentMethod` to use for the payment.
    - `shipping`
      The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment, if collected.
    - `receipt_email`
      Email address that the receipt for the resulting payment will be sent to.
    - `setup_future_usage`
      Indicates that you intend to make future payments with this [PaymentIntent](https://docs.stripe.com/api/payment_intents.md)'s payment method.

If present, the `PaymentMethod` used with this PaymentIntent can be [attached to a Customer](https://docs.stripe.com/api/payment_methods/attach.md), even after the transaction completes.

Use `on_session` if you intend to only reuse the `PaymentMethod` when your customer is present in your checkout flow.
Use `off_session` if your customer may or may not be in your checkout flow.
See [saving card details after a payment](https://docs.stripe.com/payments/cards/saving-cards-after-payment.md) to learn more.

Stripe uses `setup_future_usage` to dynamically optimize your payment flow and comply with regional legislation and network rules.
For example, if your customer is impacted by SCA, using `off_session` will ensure that they are authenticated while processing this PaymentIntent.
You will then be able to collect [off-session payments](https://docs.stripe.com/payments/cards/charging-saved-cards.md#off-session-payments-with-saved-cards) for this customer.

### Example

```title
Handle a card payment
```

## Confirm a Payment Intent with an Element

`stripe.confirmPaymentIntent(clientSecret: string, element: Element, data?: object)`

*`confirmPaymentIntent` has been deprecated. Going forward, if you wish to confirm on the client without handling next actions, simply pass `{handleActions: false}` as a third argument to [confirmCardPayment](#stripe_confirm_card_payment). While we have no plans to ever remove support for `confirmPaymentIntent`, we think that explicitly opting out of next action handling is easier to understand and will better convey what the method is doing.*

Use `stripe.confirmPaymentIntent(clientSecret, element, data)` when the customer submits your payment form. It will gather payment information from element, along with any other data you provide, and confirm the `PaymentIntent`.

Only use this method if you want to [handle next actions yourself](https://docs.stripe.com/payments/payment-intents/verifying-status.md#next-actions). Otherwise, use [stripe.handleCardPayment](#stripe_handle_card_payment).

> Note that `stripe.confirmPaymentIntent` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent` to confirm.

- `element`
  An [Element](https://docs.stripe.com/js/element.md) that will be used to create a payment method.

- `data`
  Data to be sent with the request. It can contain the following parameters
    - `return_url`
      If you are [handling next actions yourself](https://docs.stripe.com/payments/payment-intents/verifying-status.md#next-actions), pass in a `return_url`.
If the subsequent action is `redirect_to_url`, this URL will be used on the return path for the redirect.
    - `payment_method_data`
      Use this parameter to supply additional data relevant to the payment method, such as billing details.
      - `billing_details`
        The [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.
    - `shipping`
      The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment, if collected.
    - `receipt_email`
      Email address that the receipt for the resulting payment will be sent to.
    - `setup_future_usage`
      Indicates that you intend to make future payments with this [PaymentIntent](https://docs.stripe.com/api/payment_intents.md)'s payment method.

If present, the `PaymentMethod` used with this PaymentIntent can be [attached to a Customer](https://docs.stripe.com/api/payment_methods/attach.md), even after the transaction completes.

Use `on_session` if you intend to only reuse the `PaymentMethod` when your customer is present in your checkout flow.
Use `off_session` if your customer may or may not be in your checkout flow.
See [saving card details after a payment](https://docs.stripe.com/payments/cards/saving-cards-after-payment.md) to learn more.

Stripe uses `setup_future_usage` to dynamically optimize your payment flow and comply with regional legislation and network rules.
For example, if your customer is impacted by SCA, using `off_session` will ensure that they are authenticated while processing this PaymentIntent.
You will then be able to collect [off-session payments](https://docs.stripe.com/payments/cards/charging-saved-cards.md#off-session-payments-with-saved-cards) for this customer.

### Example

```title
Confirm a PaymentIntent
```

## Confirm a Payment Intent

`stripe.confirmPaymentIntent(clientSecret: string, data?: object)`

*`confirmPaymentIntent` has been deprecated.
Going forward, if you wish to confirm on the client without handling next actions, simply pass `{handleActions: false}` as a third argument to [confirmCardPayment](#stripe_confirm_card_payment).
While we have no plans to ever remove support for `confirmPaymentIntent`, we think that explicitly opting out of next action handling is easier to understand and will better convey what the method is doing.*

Use `stripe.confirmPaymentIntent(clientSecret, data)` to confirm the `PaymentIntent` when you are not gathering payment information from an `Element`.
Call this variation when you have already attached a payment method to this `PaymentIntent`, or if you want to attach an existing card, token, or `PaymentMethod` to it.

Only use this method if you want to handle next actions yourself.
Otherwise, use `stripe.handleCardPayment`.

> Note that `stripe.confirmPaymentIntent` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent` to confirm.

- `data`
  Data to be sent with the request. It can contain the following parameters
    - `return_url`
      If you are [handling next actions yourself](https://docs.stripe.com/payments/payment-intents/verifying-status.md#next-actions), pass in a `return_url`.
If the subsequent action is `redirect_to_url`, this URL will be used on the return path for the redirect.
    - `payment_method`
      Use `payment_method` to specify an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) to use for this payment.

Only one of `payment_method_data` and `payment_method` is required.
    - `payment_method_data`
      Use this parameter to supply additional data relevant to the payment method, such as billing details.
      - `billing_details`
        The [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.
      - `card[token]`
        Converts the provided token into a `PaymentMethod` to use for the payment.
    - `shipping`
      The [shipping details](https://docs.stripe.com/api/payment_intents/confirm.md#confirm_payment_intent-shipping) for the payment, if collected.
    - `receipt_email`
      Email address that the receipt for the resulting payment will be sent to.
    - `setup_future_usage`
      Indicates that you intend to make future payments with this [PaymentIntent](https://docs.stripe.com/api/payment_intents.md)'s payment method.

If present, the `PaymentMethod` used with this PaymentIntent can be [attached to a Customer](https://docs.stripe.com/api/payment_methods/attach.md), even after the transaction completes.

Use `on_session` if you intend to only reuse the `PaymentMethod` when your customer is present in your checkout flow.
Use `off_session` if your customer may or may not be in your checkout flow.
See [saving card details after a payment](https://docs.stripe.com/payments/cards/saving-cards-after-payment.md) to learn more.

Stripe uses `setup_future_usage` to dynamically optimize your payment flow and comply with regional legislation and network rules.
For example, if your customer is impacted by SCA, using `off_session` will ensure that they are authenticated while processing this PaymentIntent.
You will then be able to collect [off-session payments](https://docs.stripe.com/payments/cards/charging-saved-cards.md#off-session-payments-with-saved-cards) for this customer.

### Example

```title
Confirm a PaymentIntent
```

## Handle card setup with an Element

`stripe.handleCardSetup(clientSecret: string, element: Element, data?: object)`

*`handleCardSetup` has been renamed to [confirmCardSetup](#stripe_confirm_card_setup). In addition to the rename, we have slightly modified the arguments. These changes do not affect the behavior of the method. While we have no plans to ever remove support for `handleCardSetup`, we think the new name and arguments are easier to understand and better convey what the method is doing.*

Use `stripe.handleCardSetup(clientSecret, element, data?)` in the [Setup Intents API flow](https://docs.stripe.com/payments/save-and-reuse.md) when the customer submits your payment form.
It will gather payment information from the `element`, which can be a `card` or `cardNumber` element, along with any other data you provide.
It will then confirm the `SetupIntent` and carry out 3DS or other `next_action`s if they are required.

> Note that `stripe.handleCardSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.handleCardSetup` may trigger a [3D Secure](https://docs.stripe.com/payments/3d-secure.md) authentication challenge.
> This will be shown in a modal dialog and may be confusing for customers using assistive technologies like screen readers.
> You should make your form accessible by ensuring that success or error messages are clearly read out after this method completes.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `element`
  A `card` or `cardNumber` Element that will be used to create a payment method.

- `data`
  Data to be sent with the request.
    - `payment_method_data`
      Use this parameter to supply additional data relevant to the payment method, such as billing details.
      - `billing_details`
        The [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.

### Example

```title
Handle card setup
```

## Handle card setup

`stripe.handleCardSetup(clientSecret: string, data?: object)`

*`handleCardSetup` has been renamed to [confirmCardSetup](#stripe_confirm_card_setup). In addition to the rename, we have slightly modified the arguments. These changes do not affect the behavior of the method. While we have no plans to ever remove support for `handleCardSetup`, we think the new name and arguments are easier to understand and better convey what the method is doing.*

Use `stripe.handleCardSetup(clientSecret, data)` to advance the `SetupIntent` towards completion when you are not gathering payment method information from an `Element`.

Call this variation when you have already attached a card to this `SetupIntent` or if you want to attach an existing card to it.

> Note that `stripe.handleCardSetup` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.
> 
> Additionally, `stripe.handleCardSetup` may trigger a [3D Secure](https://docs.stripe.com/payments/3d-secure.md) authentication challenge.
> This will be shown in a modal dialog and may be confusing for customers using assistive technologies like screen readers.
> You should make your form accessible by ensuring that success or error messages are clearly read out after this method completes.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent`.

- `data`
  Data to be sent with the request.
    - `payment_method`
      Use `payment_method` to specify an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) to use for this payment.

Only one of `payment_method_data` and `payment_method` is required.
    - `payment_method_data`
      Use this parameter to supply additional data relevant to the payment method, such as billing details.
      - `billing_details`
        The [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.
      - `card[token]`
        Converts the provided token into a `PaymentMethod` to use for the payment.

### Example

```title
Handle card setup
```

## Confirm a Setup Intent with an Element

`stripe.confirmSetupIntent(clientSecret: string, element: Element, data?: object)`

*`confirmSetupIntent` has been deprecated. Going forward, if you wish to confirm on the client without handling next actions, simply pass `{handleActions: false}` as a third argument to [confirmCardSetup](#stripe_confirm_card_setup). While we have no plans to ever remove support for `confirmSetupIntent`, we think that explicitly opting out of next action handling is easier to understand and will better convey what the method is doing.*

Use `stripe.confirmSetupIntent(clientSecret, element, data)` when the customer submits your save payment method form. It will gather payment information from `element`, along with any other `data` you provide, and confirm the `SetupIntent`.

Only use this method if you want to [handle next actions yourself](https://docs.stripe.com/payments/payment-intents/verifying-status.md#next-actions). Otherwise, use [stripe.handleCardSetup](#stripe_handle_card_payment).

> Note that `stripe.confirmSetupIntent` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent` to confirm.

- `element`
  An [Element](https://docs.stripe.com/js/element.md) that will be used to create a payment method.

- `data`
  Data to be sent with the request. It can contain the following parameters
    - `payment_method_data`
      Use this parameter to supply additional data relevant to the payment method, such as billing details.
      - `billing_details`
        The [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.

### Example

```title
Confirm a SetupIntent
```

## Confirm a Setup Intent

`stripe.confirmSetupIntent(clientSecret: string, data?: object)`

*`confirmSetupIntent` has been deprecated.
Going forward, if you wish to confirm on the client without handling next actions, simply pass `{handleActions: false}` as a third argument to [confirmCardSetup](#stripe_confirm_card_setup).
While we have no plans to ever remove support for `confirmSetupIntent`, we think that explicitly opting out of next action handling is easier to understand and will better convey what the method is doing.*

Use `stripe.confirmSetupIntent(clientSecret, data)` to confirm the `SetupIntent` when you are not gathering payment information from an `Element`.
Call this variation when you have already attached a payment method to this `SetupIntent`, or if you want to attach an existing card, token, or `PaymentMethod` to it.

Only use this method if you want to handle next actions yourself.
Otherwise, use `stripe.handleCardSetup`.

> Note that `stripe.confirmSetupIntent` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/setup_intents/object.md#setup_intent_object-client_secret) of the `SetupIntent` to confirm.

- `data`
  Data to be sent with the request. It can contain the following parameters
    - `return_url`
      If you are [handling next actions yourself](https://docs.stripe.com/payments/payment-intents/verifying-status.md#next-actions), pass in a `return_url`.
If the subsequent action is `redirect_to_url`, this URL will be used on the return path for the redirect.
    - `payment_method`
      Use `payment_method` to specify an existing [PaymentMethod](https://docs.stripe.com/api/payment_methods.md) to use for this payment.

Only one of `payment_method_data` and `payment_method` is required.
    - `payment_method_data`
      Use this parameter to supply additional data relevant to the payment method, such as billing details.
      - `billing_details`
        The [billing details](https://docs.stripe.com/api/payment_methods/create.md#create_payment_method-billing_details) associated with the card.
      - `card[token]`
        Converts the provided token into a `PaymentMethod` to use for the payment.

### Example

```title
Confirm a SetupIntent
```

## Handle an FPX payment

`stripe.handleFpxPayment(clientSecret: string, element: Element, data?: object)`

*`handleFpxPayment` has been renamed to [confirmFpxPayment](#stripe_confirm_fpx_payment). In addition to the rename, we have slightly modified the arguments. These changes do not affect the behavior of the method. While we will continue to support `handleFpxPayment` for the duration of the beta, we think the new name and arguments are easier to understand and better convey what the method is doing.*

Use `stripe.handleFpxPayment` in the [FPX payment method creation](https://docs.stripe.com/stripe-js/elements/fpx-bank.md) flow when the customer selects a bank from the dropdown. It will gather the [bank code](https://docs.stripe.com/payments/fpx/accept-a-payment.md#bank-reference) from the element, along with any other `PaymentIntent` `data` you provide. It will then create an FPX payment method and confirm the `PaymentIntent`.

> Note that `stripe.handleFpxPayment` may take several seconds to complete.
> During that time, you should disable your form from being resubmitted and show a waiting indicator like a spinner.
> If you receive an error result, you should be sure to show that error to the customer, re-enable the form, and hide the waiting indicator.

- `clientSecret`
  The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent`.

- `element`
  An `fpxBank` [Element](https://docs.stripe.com/payments/elements.md) that will be used to create a payment method.

- `data`
  A data object to be sent with the request.
    - `return_url`
      The url your customer will be directed to after they complete authentication. Be sure to review the [payment confirmation page requirements](https://docs.stripe.com/payments/fpx/accept-a-payment.md#payment-confirmation-page).

### Example

```title
Handle a FPX payment
```

## PaymentRequestButtonElement

*The `PaymentRequestButtonElement` is deprecated. [Migrate to the Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element/migration.md).*

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

## Sources

The Sources API has been deprecated and replaced by the [Payment Intents API](https://docs.stripe.com/js/payment_intents.md).

Stripe.js provides the following methods to create and retrieve [Sources](https://docs.stripe.com/api/sources.md), which are part of the Charges API.

## Create a Source

`stripe.createSource(element: object, sourceData: object)`

Use `stripe.createSource` to convert payment information collected by elements into a [Source](https://docs.stripe.com/api.md#sources) object that you safely pass to your server to use in an API call.
See the [Sources documentation](https://docs.stripe.com/sources.md) for more information about sources.

- `element`
  The [Element](https://docs.stripe.com/js/element.md) containing payment information.
If applicable, the `Element` pulls data from other elements you’ve created on the same [Elements](#elements_create) instance.

- `sourceData`
  A required object containing the `type` of `Source` you want to create, and any additional payment information that you have collected.
See the [Sources API](https://docs.stripe.com/api.md#create_source) reference for details.

### Example

```title
Create a Source
```

## Create source

`stripe.createSource(sourceData: object)`

Use `stripe.createSource` to convert raw payment information into a [Source](https://docs.stripe.com/api.md#sources) object that you can safely pass to your server for use in an API call.
See the [Sources documentation](https://docs.stripe.com/sources.md) for more information about sources.

> You cannot pass raw card information to `stripe.createSource(sourceData)`.
> Instead, you must gather card information in an Element and use [`stripe.createSource(element, sourceData)`](#stripe_create_source).
> You can also pass an existing card token to convert it into a `Source` object.

- `sourceData`
  A required object containing the `type` of `Source` you want to create, and any additional payment information that you have collected.
See the [Sources API](https://docs.stripe.com/api.md#create_source) reference for details.

### Example

```title
Create a Source
```

## Retrieve a Source

`stripe.retrieveSource(source: object)`

Retrieve a [Source](https://docs.stripe.com/api.md#sources) using its unique ID and client secret.

- `source`
  An object containing the unique ID and client secret for a `Source`.

You can use a `Source` object created with `stripe.createSource` as the argument to `stripe.retrieveSource`, as every `Source` object has both `id` and `client_secret` keys.
    - `id`
      Unique identifier of the `Source`.
    - `client_secret`
      A secret available to the web client that created the `Source`, for purposes of retrieving the `Source` later from that same client.

### Example

```title
Retrieve a Source
```
