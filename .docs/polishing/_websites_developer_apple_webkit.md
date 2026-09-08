### Retrieve document source in Swift

Source: https://developer.apple.com/documentation/webkit/webdocumentrepresentation/documentsource%28%29

Returns the document source as a string or nil if unavailable.

```swift
func documentSource() -> String!
```

--------------------------------

### Access the document property

Source: https://developer.apple.com/documentation/webkitjs/domwindow/1633427-document

The document property is a read-only attribute that returns the Document object for the current window.

```WebIDL
readonly attribute Document document;
```

--------------------------------

### readyState

Source: https://developer.apple.com/documentation/webkit/domdocument/readystate

An instance property that returns the current state of the document as a string.

```APIDOC
## readyState

### Description
Returns the current loading state of the DOMDocument instance.

### Signature
`var readyState: String! { get }`
```

### WebDocumentRepresentation > Getting document source

Source: https://developer.apple.com/documentation/webkit/webdocumentrepresentation

Implementations of this protocol can provide access to the underlying document source as text and retrieve the document title, provided the class supports source retrieval.

--------------------------------

### WebDocumentText > Topics

Source: https://developer.apple.com/documentation/webkit/webdocumenttext

The protocol provides functionality to retrieve the entire document content or only the currently selected text, both as plain strings and as attributed strings. Additionally, it includes methods to select or deselect all text within the document.
