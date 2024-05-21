import { describe, expect, expectTypeOf, test } from "vitest";
import { LatestVersionType, VersionedJson } from ".";

describe("initial migration", () => {
  const versioned = new VersionedJson().initialMigration(() => {
    return { version: 1, data: { foo: "bar" } };
  });

  test("works", () => {
    const migrated = versioned.applyMigration({});
    expect(migrated).toEqual({ version: 1, data: { foo: "bar" } });
    expectTypeOf(migrated).toEqualTypeOf<{
      version: 1;
      data: { foo: string };
    }>();
  });
});

describe("initial migration without implementation", () => {
  const versioned = new VersionedJson()
    .initialMigration<{ name: string }>()
    .migrationTo(2, (input) => {
      return { ...input, age: -1 };
    });

  test("works", () => {
    const migrated = versioned.applyMigration({
      version: 1,
      data: { name: "Mike Rowe" },
    });
    expect(migrated).toEqual({
      version: 2,
      data: { name: "Mike Rowe", age: -1 },
    });
    expectTypeOf(migrated).toEqualTypeOf<{
      version: 2;
      data: { name: string; age: number };
    }>();
  });
});

describe("chained migration", () => {
  const versioned = new VersionedJson()
    .initialMigration((input: unknown) => {
      return { version: 1, data: { foo: `${(input as any).foo} meme` } };
    })
    .migrationTo(2, (input) => {
      return { ...input, baz: 42 };
    });

  test("has correct type", () => {
    expectTypeOf<LatestVersionType<typeof versioned>>().toEqualTypeOf<{
      foo: string;
      baz: number;
    }>();
  });

  test("works", () => {
    const migrated = versioned.applyMigration({ foo: "nice" });
    expect(migrated).toEqual({
      version: 2,
      data: { foo: "nice meme", baz: 42 },
    });
  });
});

describe("with flattenedData", () => {
  describe("chained migration", () => {
    const versioned = new VersionedJson({ flattenedData: true })
      .initialMigration((input: unknown) => {
        return { version: 1, foo: `${(input as any).foo} meme` };
      })
      .migrationTo(2, (input) => {
        return { ...input, baz: 42 };
      });

    test("has correct type", () => {
      expectTypeOf<LatestVersionType<typeof versioned>>().toEqualTypeOf<{
        version: 1;
        foo: string;
        baz: number;
      }>();
    });

    test("works", () => {
      const migrated = versioned.applyMigration({ foo: "nice" });
      expect(migrated).toEqual({
        version: 2,
        foo: "nice meme",
        baz: 42,
      });
    });
  });
});
