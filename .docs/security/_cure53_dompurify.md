### DOMPurify Configuration Options Checklist

Source: https://github.com/cure53/dompurify/wiki/Attack-Classes-&-Bypass-History

Lists common DOMPurify configuration options that require careful consideration before deviating from defaults. Review each flag to understand its security implications.

```javascript
SAFE_FOR_XML: false
SAFE_FOR_TEMPLATES: true
ALLOW_UNKNOWN_PROTOCOLS: true
ADD_URI_SAFE_ATTR: [...]
ADD_DATA_URI_TAGS: [...]
ALLOWED_URI_REGEXP: /.../
ADD_TAGS: [...]            // or ()
=> ...
ADD_ATTR: [...]            // or ()
=> ...
CUSTOM_ELEMENT_HANDLING: {...}
SANITIZE_DOM: false
SANITIZE_NAMED_PROPS: false
WHOLE_DOCUMENT: true
RETURN_DOM: true
RETURN_DOM_FRAGMENT: true
IN_PLACE: true
NAMESPACE: '...'
PARSER_MEDIA_TYPE: '...'
```

--------------------------------

### DOMPurify.setConfig(config)

Source: https://github.com/cure53/dompurify/blob/main/README.md

Sets a persistent configuration for all subsequent sanitize calls until cleared or updated.

```APIDOC
## DOMPurify.setConfig(config)

### Description
Sets a persistent configuration that will be used for all future calls to DOMPurify.sanitize until cleared or replaced.

### Parameters
- **config** (Object) - Required - The configuration object to apply.
```

--------------------------------

### DOMPurify.clearConfig()

Source: https://github.com/cure53/dompurify/blob/main/README.md

Resets the persistent configuration to default settings.

```APIDOC
## DOMPurify.clearConfig()

### Description
Clears the currently active persistent configuration, reverting to default behavior.
```

--------------------------------

### DOMPurify: Everyday Rich Text Sanitization

Source: https://github.com/cure53/dompurify/wiki/Security-Goals-&-Threat-Model

Use this default configuration for common rich text content from users. It removes scripts and event handlers while preserving basic formatting.

```javascript
const clean = DOMPurify.sanitize(dirty);
element.innerHTML = clean;        // HTML sink - matches what we sanitized for
```

### Can I configure DOMPurify?

Source: https://github.com/cure53/dompurify/blob/main/README.md

DOMPurify provides default configuration values that are secure for most use cases, but users can override these settings to meet specific requirements. Before expanding allow-lists or relaxing default security settings, it is recommended to review documentation regarding dangerous tags and attributes to avoid potential security risks.
