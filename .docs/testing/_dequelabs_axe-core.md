### axe.commons.dom.getRootNode

Source: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md

Returns the document or document fragment (open shadow DOM) for a given node.

```APIDOC
## axe.commons.dom.getRootNode

### Description
Return the document or document fragment (open shadow DOM).

### Synopsis
axe.commons.dom.getRootNode(node);

### Parameters
- **element** (HTMLElement) - Required - The element for which you want to find the root node.

### Returns
The top-level document or shadow DOM document fragment.
```

--------------------------------

### Documenting functions with JSDoc

Source: https://github.com/dequelabs/axe-core/blob/develop/CONTRIBUTING.md

Use JSDoc comment blocks before function definitions to describe parameters, return types, and asynchronous behavior.

```js
/**
 * Runs the Audit; which in turn should call `run` on each rule.
 * @async
 * @param  {Context}   context The scope definition/context for analysis (include/exclude)
 * @param  {Object}    options Options object to pass into rules and/or disable rules or checks
 * @param  {Function} fn       Callback function to fire when audit is complete
 */
```

--------------------------------

### Documenting class attributes with JSDoc

Source: https://github.com/dequelabs/axe-core/blob/develop/CONTRIBUTING.md

Include JSDoc comment blocks for class constructors and individual attributes to define their purpose and data types.

```js
/**
 * Constructor for the result of checks
 * @param {Object} check CheckResult specification
 */
function CheckResult(check) {
  /**
   * ID of the check.  Unique in the context of a rule.
   * @type {String}
   */
  this.id = check.id;

  /**
   * Any data passed by Check (by calling `this.data()`)
   * @type {Mixed}
   */
  this.data = null;

  /**
   * Any node that is related to the Check, specified by calling `this.relatedNodes([HTMLElement...])` inside the Check
   * @type {Array}
   */
  this.relatedNodes = [];

  /**
   * The return value of the Check's evaluate function
   * @type {Mixed}
   */
  this.result = null;
}
```

--------------------------------

### axe.run

Source: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md

Runs accessibility rules against the document or a specific node. It accepts an optional configuration object and a callback function to handle results.

```APIDOC
## axe.run(context, options, callback)

### Description
Runs accessibility rules against the provided context. The results are returned via a callback function.

### Parameters
- **context** (Object) - Required - The DOM node or selector to run the audit on.
- **options** (Object) - Optional - Configuration object for rules and settings.
- **callback** (Function) - Required - Function invoked with (err, results) arguments.
```

--------------------------------

### axe.configure

Source: https://github.com/dequelabs/axe-core/blob/develop/doc/check-options.md

Configures check options to modify how specific rules behave during accessibility testing.

```APIDOC
## axe.configure

### Description
Configures the behavior of specific checks by overriding their default options. This allows users to tailor accessibility rules to specific project requirements.

### Parameters
- **checks** (Array) - Required - A list of check configuration objects.
  - **id** (String) - Required - The identifier of the check to configure.
  - **options** (Object) - Required - The specific options to apply to the check.

### Example
```js
axe.configure({
  checks: [
    {
      id: 'has-lang',
      options: {
        attributes: ['lang', 'xml:lang', 'hreflang']
      }
    }
  ]
});
```
```
