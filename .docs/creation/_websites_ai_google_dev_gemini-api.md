### GET fileSearchStores.documents.list

Source: https://ai.google.dev/api/file-search/documents

Lists all Documents in a File Search Store.

```APIDOC
## GET https://generativelanguage.googleapis.com/v1beta/{parent=fileSearchStores/*}/documents

### Description
Lists all Documents in a Corpus, sorted by ascending create_time.

### Method
GET

### Endpoint
https://generativelanguage.googleapis.com/v1beta/{parent=fileSearchStores/*}/documents

### Parameters
#### Path Parameters
- **parent** (string) - Required - The name of the FileSearchStore containing Documents (e.g., fileSearchStores/my-file-search-store-123).

#### Query Parameters
- **pageSize** (integer) - Optional - The maximum number of Documents to return (default 10, max 20).
- **pageToken** (string) - Optional - A page token received from a previous call to retrieve the next page.

### Response
#### Success Response (200)
- **documents** (array) - The returned Documents.
- **nextPageToken** (string) - A token to retrieve the next page, if available.
```

--------------------------------

### POST /v1beta/models/{model}:generateContent

Source: https://ai.google.dev/api

Processes a request and returns the model's full response in a single package. This is the standard endpoint for non-interactive content generation tasks.

```APIDOC
## POST /v1beta/models/{model}:generateContent

### Description
Processes a request and returns the model's full response in a single package. This is best for non-interactive tasks where you can wait for the entire result.

### Method
POST

### Endpoint
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

### Parameters
#### Path Parameters
- **model** (string) - Required - The name of the model to use (e.g., gemini-3.5-flash).

#### Request Body
- **contents** (array) - Required - The input content for the model.

### Request Example
{
  "contents": [
    {
      "parts": [
        {
          "text": "Explain how AI works in a few words"
        }
      ]
    }
  ]
}
```

--------------------------------

### JSON Representation of a Document Resource

Source: https://ai.google.dev/api/file-search/documents

The standard JSON structure for a Document object, detailing all available fields and their types.

```json
{
  "name": string,
  "displayName": string,
  "customMetadata": [
    {
      object (CustomMetadata)
    }
  ],
  "updateTime": string,
  "createTime": string,
  "state": enum (State),
  "sizeBytes": string,
  "mimeType": string
}
```

--------------------------------

### GET https://generativelanguage.googleapis.com/v1beta/{name=files/*}

Source: https://ai.google.dev/api/files

Retrieves the metadata for a specified file.

```APIDOC
## GET https://generativelanguage.googleapis.com/v1beta/{name=files/*}

### Description
Gets the metadata for the given File.

### Method
GET

### Endpoint
https://generativelanguage.googleapis.com/v1beta/{name=files/*}

### Parameters
#### Path Parameters
- **name** (string) - Required - The name of the File to get. It takes the form files/{file}.

### Response
#### Success Response (200)
- **File** (object) - The metadata for the requested file.
```

### REST Resource: fileSearchStores.documents > Resource: Document > displayName/customMetadata

Source: https://ai.google.dev/api/file-search/documents

The displayName field allows for a human-readable name for the Document, with a maximum length of 512 characters. Users can also attach custom metadata to a Document using key-value pairs, with a limit of 20 entries per Document.
