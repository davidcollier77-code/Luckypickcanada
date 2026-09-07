### View File Size Summary

Source: https://github.com/resend/resend-node/blob/canary/_autodocs/INDEX.md

Displays the file structure and approximate line counts for the documentation repository.

```text
README.md                    ~400 lines
configuration.md            ~500 lines
types.md                     ~400 lines
errors.md                    ~800 lines
─────────────────────────────────────
api-reference/
  resend-client.md          ~300 lines
  emails.md                 ~350 lines
  batch.md                  ~400 lines
  templates.md              ~400 lines
  contacts.md               ~350 lines
  domains.md                ~350 lines
  automations.md            ~500 lines
  webhooks.md               ~450 lines
  broadcasts.md             ~250 lines
  api-keys.md               ~300 lines
  segments.md               ~250 lines
  suppressions.md           ~400 lines
  additional-modules.md     ~500 lines
─────────────────────────────────────
Total: 17 files, 6,207 lines
```

--------------------------------

### Full SDK API Surface

Source: https://github.com/resend/resend-node/blob/canary/src/resend.ts

The Resend class exposes all available SDK namespaces: emails, domains, contacts, apiKeys, batch, broadcasts, automations, webhooks, templates, topics, segments, events, logs, oauthGrants, suppressions, and contactProperties. This is the main entry point for using the SDK.

```typescript
export class Resend {
  readonly baseUrl: string;
  readonly userAgent: string;
  private readonly headers: Headers;

  readonly segments = new Segments(this);
  readonly apiKeys = new ApiKeys(this);
  /**
   * @deprecated Use segments instead
   */
  readonly audiences = this.segments;
  readonly automations = new Automations(this);
  readonly batch = new Batch(this);
  readonly broadcasts = new Broadcasts(this);
  readonly contactProperties = new ContactProperties(this);
  readonly contacts = new Contacts(this);
  readonly domains = new Domains(this);
  readonly emails = new Emails(this);
  readonly events = new Events(this);
  readonly logs = new Logs(this);
  readonly oauthGrants = new OAuthGrants(this);
  readonly suppressions = new Suppressions(this);
  readonly templates = new Templates(this);
  readonly topics = new Topics(this);
  readonly webhooks = new Webhooks(this);

  constructor(
    readonly key?: string,
    options?: ResendOptions,
  ) {
    if (!key) {
      if (typeof process !== 'undefined' && process.env) {
        this.key = process.env.RESEND_API_KEY;
      }

      if (!this.key) {
        throw new Error(
          'Missing API key. Pass it to the constructor `new Resend("re_abc123def456ghi789jkl012mno345pqr678")`',
        );
      }
    }

    this.baseUrl = options?.baseUrl ?? getDefaultBaseUrl();
    this.userAgent = options?.userAgent ?? getDefaultUserAgent();

    this.headers = new Headers({
      Authorization: `Bearer ${this.key}`,
      'User-Agent': this.userAgent,
      'Content-Type': 'application/json',
    });
  }

  async post<T>(path: string, entity?: unknown, options: PostOptions & IdempotentRequest = {}) { ... }
  async get<T>(path: string, options: GetOptions = {}) { ... }
  async put<T>(path: string, entity: unknown, options: PutOptions = {}) { ... }
  async patch<T>(path: string, entity: unknown, options: PatchOptions = {}) { ... }
  async delete<T>(path: string, query?: unknown, options: DeleteOptions = {}) { ... }
}
```

--------------------------------

### All exported public types and modules

Source: https://github.com/resend/resend-node/blob/canary/src/index.ts

The index.ts barrel file fully documents every exported interface and class, making it easy to discover all available types for every Resend API module: api-keys, automations, batch, broadcasts, contacts, domains, emails, events, logs, oauth-grants, segments, suppressions, templates, topics, webhooks, and the core Response/ErrorResponse types.

```typescript
export * from './api-keys/interfaces';
export * from './automation-runs/interfaces';
export * from './automations/interfaces';
export * from './batch/interfaces';
export * from './broadcasts/interfaces';
export * from './common/interfaces';
export * from './contact-properties/interfaces';
export * from './contacts/imports/interfaces';
export * from './contacts/interfaces';
export * from './contacts/segments/interfaces';
export * from './contacts/topics/interfaces';
export * from './domains/claims/interfaces';
export * from './domains/interfaces';
export * from './emails/attachments/interfaces';
export * from './emails/interfaces';
export * from './emails/receiving/interfaces';
export * from './events/interfaces';
export type { ErrorResponse, Response } from './interfaces';
export * from './logs/interfaces';
export * from './oauth-grants/interfaces';
export { Resend, type ResendOptions } from './resend';
export * from './segments/interfaces';
export * from './suppressions/batch/interfaces';
export * from './suppressions/interfaces';
export * from './templates/interfaces';
export * from './topics/interfaces';
export * from './webhooks/interfaces';
```

### Quality Metrics

Source: https://github.com/resend/resend-node/blob/canary/_autodocs/SUMMARY.txt

The project maintains full documentation coverage for all exported classes, public methods, types, and error codes. It includes over 100 code examples demonstrating real-world usage, error handling, and best practices.

--------------------------------

### Usage > Offline Reference

Source: https://github.com/resend/resend-node/blob/canary/_autodocs/INDEX.md

The documentation is provided as standalone markdown files with no external dependencies. This allows for flexible usage, including local viewing in text editors, conversion to HTML or PDF formats, searching via command-line tools like grep, or integration into custom documentation builds.
