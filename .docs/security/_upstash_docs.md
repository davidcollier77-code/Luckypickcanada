===============
LIBRARY RULES
===============
From library maintainers:
- **Need a Redis database fast?** Skip the signup and dashboard — POST to [`https://upstash.com/start-redis`](https://upstash.com/start-redis) to get an endpoint and token. The database expires in 72 hours, but you can claim it with your Upstash account



### HSETEX Command Documentation

Source: https://github.com/upstash/docs/blob/main/redis/sdks/py/commands/hash/hsetex.mdx

Documentation for the HSETEX command, detailing its arguments, response, and usage examples.

```APIDOC
## HSETEX

### Description
Set hash fields with expiration support. The `HSETEX` command sets the specified fields with their values and optionally sets their expiration time or TTL. It supports conditional operations to control when fields should be set.

### Method
APICall

### Endpoint
/redis/commands/hash/hsetex

### Parameters
#### Arguments
- **key** (str, required): The key of the hash.
- **field** (str, optional): A single field name to set. Use with `value` parameter.
- **value** (Any, optional): A single value to set. Use with `field` parameter.
- **values** (Dict[str, Any], optional): A dictionary of fields and their values to set. Either use `field`/`value` or `values`, but not both.
- **fnx** (bool, optional): Only set fields if the hash does not exist.
- **fxx** (bool, optional): Only set fields if the hash already exists.
- **ex** (int, optional): Set expiration time in seconds.
- **px** (int, optional): Set expiration time in milliseconds.
- **exat** (int, optional): Set expiration as Unix timestamp in seconds.
- **pxat** (int, optional): Set expiration as Unix timestamp in milliseconds.
- **keepttl** (bool, optional): Retain the existing time to live (TTL) associated with the hash key when setting fields. If the hash has an expiration, it will be preserved.

### Response
#### Success Response
- **(int)**: 0 if no fields were set, 1 if all the fields were set.

### Request Example
```py Single Field
# Set a single field with expiration
result = redis.hsetex("myhash", "field1", "Hello", ex=60)
assert result == 1
```

```py Multiple Fields
# Set fields with 1 hour expiration
result = redis.hsetex(
    "user:123",
    values={"name": "John", "email": "john@example.com"},
    ex=3600
)
assert result == 2
```

```py With FNX (only if hash doesn't exist)
# Set fields only if the hash doesn't exist
result = redis.hsetex(
    "user:456",
    values={"name": "Jane", "age": "25"},
    fnx=True
)
assert result == 2

# Try again - will return 0 since hash now exists
result = redis.hsetex(
    "user:456",
    values={"email": "jane@example.com"},
    fnx=True
)
assert result == 0
```

```py With FXX (only if hash exists)
# First create the hash
redis.hset("session:abc", "token", "xyz")

# Update only if hash exists
result = redis.hsetex(
    "session:abc",
    values={"user": "john"},
    fxx=True
)
assert result == 1  # Hash exists, field added

# Try on non-existent hash
result = redis.hsetex(
    "session:nonexistent",
    values={"user": "jane"},
    fxx=True
)
assert result == 0  # Hash doesn't exist
```

```py With PX (milliseconds)
import time

# Set fields with 30 second expiration
result = redis.hsetex(
    "cache:data",
    values={"value": "cached data", "timestamp": str(int(time.time()))},
    px=30000
)
assert result == 2
```

```py With EXAT (Unix timestamp in seconds)
import time

# Set expiration to specific timestamp
future_time = int(time.time()) + 7200  # 2 hours from now
result = redis.hsetex(
    "temp:data",
    values={"info": "temporary information"},
    exat=future_time
)
assert result == 1
```

```py With PXAT (Unix timestamp in milliseconds)
import time

# Set expiration to specific timestamp in milliseconds
future_time = int(time.time() * 1000) + 300000  # 5 minutes from now
result = redis.hsetex(
    "session:xyz",
    values={"token": "abc123", "user": "john"},
    pxat=future_time
)
assert result == 2
```

```py Combined: Conditional + Expiration
import time

# Set fields only if hash doesn't exist, with 1 hour expiration
result = redis.hsetex(
    "user:789",
    values= {
        "name": "Alice",
        "email": "alice@example.com",
        "created": str(int(time.time()))
    },
    fnx=True,
    ex=3600
)
assert result == 3
```

```py With KEEPTTL
# First set fields with expiration
redis.hsetex("cache:data", values={"value": "cached"}, ex=300)

# Later update fields while retaining the existing TTL
result = redis.hsetex("cache:data", values={"updated": "yes"}, keepttl=True)
assert result == 1

# Verify TTL is still 300 seconds (or less if time passed)
ttl = redis.ttl("cache:data")
assert ttl > 0 and ttl <= 300  # TTL was retained
```

```py Without Options
# Just set fields without expiration or conditions
result = redis.hsetex(
    "data:simple",
    values={"field1": "value1", "field2": "value2"}
)
assert result == 2
```

## Use Cases

- **Session Management**: Create sessions with automatic expiration
- **Cache with TTL**: Store cached data that expires automatically
- **Temporary Data**: Create temporary records with built-in cleanup
- **Rate Limiting**: Store rate limit counters with automatic reset
- **Conditional Updates**: Ensure data consistency with FNX/FXX options
```

--------------------------------

### Delete Documents

Source: https://github.com/upstash/docs/blob/main/search/sdks/ts/commands/delete.mdx

The delete method allows you to remove documents from your index. You can specify document IDs, a prefix to match multiple IDs, or a filter to delete documents based on their content.

```APIDOC
## delete

### Description
Deletes documents from the index based on provided criteria.

### Method
`delete`

### Parameters
#### IDs
- **IDs** (string[] | number[] | string | number) - Required - One or more document IDs to delete.

#### OR

#### DeletePayload
- **DeletePayload** (object) - Required
  - **ids** (string[] | number[] | string | number) - Optional - One or more document IDs to delete.
  - **prefix** (string) - Optional - A string prefix to match document IDs for deletion. All documents with IDs starting with this prefix will be deleted.
  - **filter** (string) - Optional - A filter to delete documents based on content fields. Deleting with a filter is an O(N) operation.

### Response
#### Success Response (200)
- **Response** (DeleteResult) - Required
  - **deleted** (number) - Required - The number of documents that were successfully deleted.

### Request Example
```typescript
// Delete by IDs Array
const response = await index.delete(["star-wars", "inception"]);
// { deleted: 2 }

// Delete Single ID
const response = await index.delete("star-wars");
// { deleted: 1 }

// Delete by Prefix
const response = await index.delete({
  prefix: "star-",
});
// { deleted: 3 }

// Delete with Filter
const response = await index.delete({
  filter: "age > 30",
});
// { deleted: 3 }
```
```

--------------------------------

### Get Database Info

Source: https://github.com/upstash/docs/blob/main/search/sdks/ts/commands/info.mdx

Retrieve overall database statistics, including disk size, total document counts, and information about all indexes within the database.

```APIDOC
## Database Info

Alternatively, you can call `info` on the client itself, which will return information about the whole database:

### Response

#### Success Response (200)
- **documentCount** (number) - The total number of documents in the database, that are ready to use.
- **pendingDocumentCount** (number) - The number of documents in the database, that is still processing and not ready to use.
- **diskSize** (number) - The size of the database, in `b`.
- **indexes** (Record<string, Object>) - A map of indexes to their information in the following format
  - **documentCount** (number) - The total number of documents in the index, that are ready to use.
  - **pendingDocumentCount** (number) - The number of documents in the index, that is still processing and not ready to use.

### Request Example

```typescript Database
const client = new Search();

const infoResponse = await client.info();
/*
{
  diskSize: 456890,
  pendingDocumentCount: 12,
  documentCount: 120,
  indexes: {
    "movies": {
      documentCount: 100,
      pendingDocumentCount: 5
    },
    "actors": {
      documentCount: 20,
      pendingDocumentCount: 7
    }
  }
}
*/
```
```

--------------------------------

### DatabaseStats response body schema

Source: https://github.com/upstash/docs/blob/main/devops/developer-api/openapi.yml

Full JSON shape of the response body with all fields including metrics, latency, throughput, billing, etc.

```yaml
    DatabaseStats:
      type: object
      properties:
        monitor_count:
          $ref: "#/components/schemas/TimeSeriesData"
        daily_net_commands:
          type: integer
        daily_read_requests:
          type: integer
        daily_write_requests:
          type: integer
        connection_count:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        keyspace:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        throughput:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        diskusage:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        latencymean:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        latency_99:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        read_latency_mean:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        read_latency_99:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        write_latency_mean:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        write_latency_99:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        hits:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        misses:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        read:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        write:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        dailyrequests:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        days:
          type: array
          items:
            type: string
        dailybilling:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        dailybandwidth:
          type: integer
        bandwidths:
          type: array
          items:
            $ref: "#/components/schemas/TimeSeriesData"
        total_monthly_bandwidth:
          type: integer
        total_monthly_requests:
          type: integer
        total_monthly_read_requests:
          type: integer
        total_monthly_write_requests:
          type: integer
        total_monthly_script_requests:
          type: integer
        queue_optimized:
          type: boolean
        total_monthly_storage:
          type: integer
        current_storage:
          type: integer
        total_monthly_billing:
          type: number
          format: float
        command_counts:
          type: array
          items:
            $ref: "#/components/schemas/CommandCount"
```

### Query Options > Controlling Output

Source: https://github.com/upstash/docs/blob/main/redis/search/querying.mdx

By default, search results return the document key, relevance score, and the full document content. Users can control the output by excluding content entirely or by selecting specific fields to return. When selecting fields, users must reference the actual document field name rather than any defined aliases, as aliasing occurs at the index level and does not change the underlying document structure.
