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

### Run accessibility tests with default options

Source: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md

Executes accessibility rules on the document and logs the results via a callback function.

```js
axe.run(document, function (err, results) {
  if (err) throw err;
  console.log(results);
});
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

### axe.getRules

Source: https://github.com/dequelabs/axe-core/blob/develop/doc/API.md

Retrieves a list of all accessibility rules in the system, optionally filtered by tags.

```APIDOC
## axe.getRules

### Description
Returns a list of all rules with their ID and description. Users can optionally filter the returned rules by providing an array of tags.

### Synopsis
`axe.getRules([Tag Name 1, Tag Name 2...]);`

### Parameters
- **tags** (Array) - Optional - Array of tags used to filter returned rules.

### Returns
Array of rule objects containing: ruleId, description, helpUrl, help, tags, and enabled status.
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
