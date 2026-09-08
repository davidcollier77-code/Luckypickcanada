### Content Management API

Source: https://github.com/coreyhaines31/marketingskills/blob/main/tools/integrations/strapi.md

Standard CRUD operations for managing content documents in Strapi.

```APIDOC
## GET /api/articles

### Description
Retrieves a list of articles with optional filtering, sorting, and population.

### Method
GET

### Endpoint
/api/articles

### Query Parameters
- **populate** (string) - Optional - Relations to include (e.g., *)
- **filters** (object) - Optional - Filter criteria
- **sort** (string) - Optional - Sorting field and order
- **pagination** (object) - Optional - Page and pageSize
- **status** (string) - Optional - Content status (e.g., draft)

## POST /api/articles

### Description
Creates a new article document.

### Method
POST

### Endpoint
/api/articles

### Request Body
- **data** (object) - Required - The article content fields

## PUT /api/articles/{documentId}

### Description
Updates an existing article document.

### Method
PUT

### Endpoint
/api/articles/{documentId}

### Parameters
#### Path Parameters
- **documentId** (string) - Required - The unique identifier of the document

## DELETE /api/articles/{documentId}

### Description
Deletes an article document.

### Method
DELETE

### Endpoint
/api/articles/{documentId}

### Parameters
#### Path Parameters
- **documentId** (string) - Required - The unique identifier of the document
```

--------------------------------

### GET /data/doc/{dataset}/{documentId}

Source: https://github.com/coreyhaines31/marketingskills/blob/main/tools/integrations/sanity.md

Retrieve a single document by its unique identifier.

```APIDOC
## GET /data/doc/{dataset}/{documentId}

### Description
Fetches a specific document by its ID from the given dataset.

### Method
GET

### Endpoint
https://{projectId}.api.sanity.io/v2024-01-01/data/doc/{dataset}/{documentId}

### Parameters
#### Path Parameters
- **dataset** (string) - Required - The name of the dataset.
- **documentId** (string) - Required - The unique ID of the document.
```

--------------------------------

### List Pendo Metadata Schemas

Source: https://github.com/coreyhaines31/marketingskills/blob/main/tools/integrations/pendo.md

Retrieve the schema definitions for visitor, account, and parent account metadata in Pendo. Requires authentication.

```bash
GET https://app.pendo.io/api/v1/metadata/schema/visitor
GET https://app.pendo.io/api/v1/metadata/schema/account
GET https://app.pendo.io/api/v1/metadata/schema/parentAccount
```

### Documentation

Source: https://github.com/coreyhaines31/marketingskills/blob/main/skills/ab-testing/SKILL.md

Document every A/B test comprehensively, including the hypothesis, variants with screenshots, results (sample size, metrics, significance), and the final decision with learnings. Templates are available for structured documentation.

--------------------------------

### Writing Style Guidelines

Source: https://github.com/coreyhaines31/marketingskills/blob/main/CLAUDE.md

Documentation should be kept concise by limiting files to 500 lines, using short paragraphs, and employing clear formatting like bold text for key terms. The tone should be direct, instructional, and professional, written in the second person. Clarity is prioritized by focusing on one idea per section and using active voice.
