### Retrieve document source in Swift

Source: https://developer.apple.com/documentation/webkit/webdocumentrepresentation/documentsource%28%29

Returns the document source as a string or nil if unavailable.

```swift
func documentSource() -> String!
```

--------------------------------

### Accessing the doctype property

Source: https://developer.apple.com/documentation/webkit/domdocument/doctype

Retrieves the document type declaration for the DOM document.

```swift
var doctype: DOMDocumentType! { get }
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

--------------------------------

### Get the document title

Source: https://developer.apple.com/documentation/webkit/webdocumentrepresentation/title%28%29

Returns the title associated with the receiving document object.

```swift
func title() -> String!
```
