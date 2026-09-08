### POST /v1beta/interactions

Source: https://ai.google.dev/gemini-api/docs/deep-research

Starts a research task with document understanding by passing text and document inputs to a research agent in the background.

```APIDOC
## POST /v1beta/interactions

### Description
Starts a research task with multimodal input such as documents and text prompts, allowing the agent to analyze documents and conduct research grounded in their content.

### Method
POST

### Endpoint
https://generativelanguage.googleapis.com/v1beta/interactions

### Parameters
#### Request Body
- **agent** (string) - Name or ID of the research agent (e.g., `deep-research-preview-04-2026`).
- **input** (array) - List of input items provided to the agent.
  - **type** (string) - The type of input (`text` or `document`).
  - **text** (string) - Text query or prompt (when type is `text`).
  - **uri** (string) - URI of the document (when type is `document`).
  - **mime_type** (string) - MIME type of the document (when type is `document`).
- **background** (boolean) - Whether to run the interaction task in the background.

### Request Example
```json
{
  "agent": "deep-research-preview-04-2026",
  "input": [
    {"type": "text", "text": "What is this document about?"},
    {"type": "document", "uri": "https://arxiv.org/pdf/1706.03762", "mime_type": "application/pdf"}
  ],
  "background": true
}
```
```

--------------------------------

### Manage File Search Documents

Source: https://ai.google.dev/gemini-api/docs/file-search

List, retrieve, and delete individual documents within a specific file search store. Use the force deletion flag to remove a document and its associated data.

```python
for document_in_store in client.file_search_stores.documents.list(parent='fileSearchStores/myfilesearchstore123'):
  print(document_in_store)

file_search_document = client.file_search_stores.documents.get(name='fileSearchStores/myfilesearchstore123/documents/sampletxt123')
print(file_search_document)

client.file_search_stores.documents.delete(name='fileSearchStores/myfilesearchstore123/documents/sampletxt123', config={'force': True})
```

```javascript
const documents = await ai.fileSearchStores.documents.list({
  parent: 'fileSearchStores/myfilesearchstore123'
});
for await (const doc of documents) {
  console.log(doc);
}

const fileSearchDocument = await ai.fileSearchStores.documents.get({
  name: 'fileSearchStores/myfilesearchstore123/documents/sampletxt123'
});

await ai.fileSearchStores.documents.delete({
  name: 'fileSearchStores/myfilesearchstore123/documents/sampletxt123',
  config: { force: true }
});
```

```java
import com.google.genai.Client;
import com.google.genai.gaos.models.interactions.Content;
import com.google.genai.gaos.models.interactions.CreateModelInteraction;
import com.google.genai.gaos.models.interactions.DocumentContent;
import com.google.genai.gaos.models.interactions.DocumentContentMimeType;
import com.google.genai.gaos.models.interactions.Interaction;
import com.google.genai.gaos.models.interactions.InteractionsInput;
import com.google.genai.gaos.models.interactions.Model;
import com.google.genai.gaos.models.interactions.TextContent;
import com.google.genai.gaos.models.operations.CreateInteractionRequestBody;
import java.util.Arrays;
import java.util.List;

Client client = new Client();

Content textContent = TextContent.builder().text("Summarize this document.").build();
Content docContent =
    DocumentContent.builder()
        .uri("gs://cloud-samples-data/generative-ai/pdf/sample.pdf")
        .mimeType(DocumentContentMimeType.APPLICATION_PDF)
        .build();

List<Content> contents = Arrays.asList(textContent, docContent);

CreateModelInteraction params =
    CreateModelInteraction.builder()
        .model(Model.of("gemini-3.8-flash"))
        .input(InteractionsInput.ofContent(contents))
        .build();

Interaction interaction =
    client.interactions.create(CreateInteractionRequestBody.of(params)).interaction().get();

System.out.println(interaction.outputText().orElse(""));
```

```bash
curl "https://generativelanguage.googleapis.com/v1beta/fileSearchStores/myfilesearchstore123/documents?key=${GEMINI_API_KEY}"

curl "https://generativelanguage.googleapis.com/v1beta/fileSearchStores/myfilesearchstore123/documents/sampletxt123?key=${GEMINI_API_KEY}"

curl -X DELETE "https://generativelanguage.googleapis.com/v1beta/fileSearchStores/myfilesearchstore123/documents/sampletxt123?key=${GEMINI_API_KEY}&force=true"
```

--------------------------------

### GET https://generativelanguage.googleapis.com/v1beta/{name}

Source: https://ai.google.dev/gemini-api/docs/prompting_with_media?lang=python

Verify that the API successfully stored the uploaded file and retrieve its metadata. This can be called via the REST endpoint or the client.files.get method across SDKs.

```APIDOC
## GET https://generativelanguage.googleapis.com/v1beta/{name}

### Description
Verify that the API successfully stored the uploaded file and get its metadata by calling `files.get` or the REST endpoint.

### Method
GET

### Endpoint
`https://generativelanguage.googleapis.com/v1beta/{name}`

### Parameters
#### Path Parameters
- **name** (string) - Required - The resource name of the uploaded file.

#### Headers
- **x-goog-api-key** (string) - Required - API key for authentication.

### Request Example
```bash
curl https://generativelanguage.googleapis.com/v1beta/$name \
-H "x-goog-api-key: $GEMINI_API_KEY"
```

### SDK Examples
#### Python
```python
from google import genai

client = genai.Client()
myfile = client.files.get(name=file_name)
print(myfile)
```

#### JavaScript
```javascript
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({});
const fetchedFile = await client.files.get({ name: fileName });
console.log(fetchedFile);
```

#### Go
```go
gotFile, err := client.Files.Get(ctx, file.Name)
```
```

### Document understanding

Source: https://ai.google.dev/gemini-api/docs/generate-content/document-processing

Gemini models use native vision to process PDF documents and understand their full context beyond simple text extraction. They can analyze text, images, diagrams, charts, and tables across documents up to 1,000 pages, extract information into structured formats, answer questions based on visual and textual elements, and transcribe content while preserving formatting. Non-PDF documents can also be processed, though Gemini treats them as standard text without preserving visual context or formatting.

--------------------------------

### Document understanding

Source: https://ai.google.dev/gemini-api/docs/deep-research

Document understanding allows passing documents directly as multimodal input. The agent analyzes the provided documents and conducts research grounded in their content.
