## versioned-json

Type-safe versioned JSON and migrations.

### Installation

`npm i --save versioned-json`

### Example

```ts:filename.ts@import.meta.vitest
const { VersionedJson, LatestVersionType } = await import('.');

const metadataJson = new VersionedJson()
  // Specify version and type of initial version
  .initialMigration<1, { name: string }>()
  // Specify migration from version 1 to version 2
  // By default fromVersion is toVersion - 1
  .migrationTo(2, (input) => {
    // input is dynamically typed based on the previous migrations
    return { ...input, clicks: 0 };
  });

// Unpack versioned type (that might come from a database)
const initialMetadata = { version: 1, data: { name: "image.jpg" }}
const migrated = metadataJson.unpack(initialMetadata)
migrated.name // image.jpg
migrated.clicks // 0

// Pack raw type for database storage with proper versioning
const packed = metadataJson.pack({ name: "doc.pdf", clicks: 10 })
packed // { version: 2, data: { name: doc.pdf, clicks: 10 } }

// Get type of the latest version (i.e. result of .unpack)
type Metadata = LatestVersionType<typeof metadataJson>
// { name: string, clicks: number }
```

##