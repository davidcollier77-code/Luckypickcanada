### Bootstrap CSS link example

Source: https://developer.chrome.com/docs/devtools/coverage

Example of including a full Bootstrap stylesheet in an HTML document, which often results in unused CSS.

```html
...
<head>
  ...
  <link rel="stylesheet"
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
        integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
        crossorigin="anonymous">
  ...
</head>
...
```

### Documentation

Source: https://developer.chrome.com/docs/extensions

Comprehensive documentation is available to support developers through every stage, including getting started guides, development fundamentals, specific how-to solutions for common use cases, and technical references for APIs, manifest keys, and permissions.

--------------------------------

### Document Picture-in-Picture > Use cases

Source: https://developer.chrome.com/docs/web-platform/document-picture-in-picture

The Document Picture-in-Picture API allows websites to provide richer experiences than the standard video-only Picture-in-Picture API. By enabling a full document in the PiP window, developers can implement custom controls, styling, and complex layouts that were previously limited or required workarounds.

--------------------------------

### July 2024 > What's new

Source: https://developer.chrome.com/docs/crux/release-notes

The CrUX API documentation has been updated to include the CrUX API Explorer, allowing users to quickly check API responses directly within the documentation. This tool provides support for generating curl, HTTP, and JavaScript snippets when viewed in full screen.

--------------------------------

### Move DOM and window calls to an offscreen document

Source: https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers

Extensions requiring access to DOM or window objects without opening visible tabs can use the Offscreen API. This allows for the creation of undisplayed documents that function as full web pages. These documents do not share APIs with other extension contexts, except for message passing, which is used to communicate with the extension service worker.
