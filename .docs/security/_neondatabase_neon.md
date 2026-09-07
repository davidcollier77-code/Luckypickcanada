### Documentation section in README

Source: https://github.com/neondatabase/neon/blob/main/README.md

Top-level documentation reference pointing to docs directory and SUMMARY.md as the primary documentation index

```markdown
## Documentation

[docs](/docs) Contains a top-level overview of all available markdown documentation.

- [sourcetree.md](/docs/sourcetree.md) contains overview of source tree layout.

To view your `rustdoc` documentation in a browser, try running `cargo doc --no-deps --open`

See also README files in some source directories, and `rustdoc` style documentation comments.

Other resources:

- [SELECT 'Hello, World'](https://neon.com/blog/hello-world/): Blog post by Nikita Shamgunov on the high level architecture
- [Architecture decisions in Neon](https://neon.com/blog/architecture-decisions-in-neon/): Blog post by Heikki Linnakangas
- [Neon: Serverless PostgreSQL!](https://www.youtube.com/watch?v=rES0yzeERns): Presentation on storage system by Heikki Linnakangas in the CMU Database Group seminar series
```

--------------------------------

### Documentation table of contents

Source: https://github.com/neondatabase/neon/blob/main/docs/SUMMARY.md

The primary documentation index/table of contents for the full developer documentation in the docs/ directory

```markdown
# Summary

# Looking for `neon.tech` docs?

This page linkes to a selection of technical content about the open source code in this repository.

Please visit https://neon.tech/docs for documentation about using the Neon service, which is based on the code
in this repository.

# Architecture

[Introduction]()
- [Separation of Compute and Storage](./separation-compute-storage.md)

- [Compute]()
  - [Postgres changes](./core_changes.md)

- [Pageserver](./pageserver.md)
    - [Services](./pageserver-services.md)
    - [Thread management](./pageserver-thread-mgmt.md)
    - [WAL Redo](./pageserver-walredo.md)
    - [Page cache](./pageserver-pagecache.md)
    - [Storage](./pageserver-storage.md)
    - [Compaction](./pageserver-compaction.md)
    - [Processing a GetPage request](./pageserver-processing-getpage.md)
    - [Processing WAL](./pageserver-processing-wal.md)

- [WAL Service](walservice.md)
  - [Consensus protocol](safekeeper-protocol.md)

- [Source view](./sourcetree.md)
  - [docker.md](./docker.md) — Docker images and building pipeline.
  - [Error handling and logging](./error-handling.md)

- [Glossary](./glossary.md)

# Uncategorized

- [authentication.md](./authentication.md)
- [multitenancy.md](./multitenancy.md) — how multitenancy is organized in the pageserver and Zenith CLI.
- [settings.md](./settings.md)

# RFCs

Major changes are documented in RFCS:
- See [RFCs](./rfcs/README.md) for more information
- view the RFCs at https://github.com/neondatabase/neon/tree/main/docs/rfcs
```

--------------------------------

### SUMMARY.md Entry Point

Source: https://github.com/neondatabase/neon/blob/main/docs/SUMMARY.md

The summary page acts as the table of contents for all developer documentation in the repo. It links to architecture docs, component docs, the glossary, RFCs, and points users to https://neon.tech/docs for user-facing documentation.

```markdown
# Summary

# Looking for `neon.tech` docs?

This page linkes to a selection of technical content about the open source code in this repository.

Please visit https://neon.tech/docs for documentation about using the Neon service, which is based on the code
in this repository.

# Architecture

[Introduction]()
- [Separation of Compute and Storage](./separation-compute-storage.md)

- [Compute]()
  - [Postgres changes](./core_changes.md)

- [Pageserver](./pageserver.md)
    - [Services](./pageserver-services.md)
    - [Thread management](./pageserver-thread-mgmt.md)
    - [WAL Redo](./pageserver-walredo.md)
    - [Page cache](./pageserver-pagecache.md)
    - [Storage](./pageserver-storage.md)
    - [Compaction](./pageserver-compaction.md)
    - [Processing a GetPage request](./pageserver-processing-getpage.md)
    - [Processing WAL](./pageserver-processing-wal.md)

- [WAL Service](walservice.md)
  - [Consensus protocol](safekeeper-protocol.md)

- [Source view](./sourcetree.md)
  - [docker.md](./docker.md) — Docker images and building pipeline.
  - [Error handling and logging](./error-handling.md)

- [Glossary](./glossary.md)

# Uncategorized

- [authentication.md](./authentication.md)
- [multitenancy.md](./multitenancy.md) — how multitenancy is organized in the pageserver and Zenith CLI.
- [settings.md](./settings.md)

# RFCs

Major changes are documented in RFCS:
- See [RFCs](./rfcs/README.md) for more information
- view the RFCs at https://github.com/neondatabase/neon/tree/main/docs/rfcs
```

### Documentation

Source: https://github.com/neondatabase/neon/blob/main/README.md

The `docs` directory contains an overview of markdown documentation, including `sourcetree.md` for source tree layout. Rust documentation can be viewed in a browser with `cargo doc --no-deps --open`.

--------------------------------

### Source tree layout > /docs

Source: https://github.com/neondatabase/neon/blob/main/docs/sourcetree.md

The `/docs` directory contains documentation for Neon features and concepts, currently focusing on developer documentation.
