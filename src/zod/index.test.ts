import { describe, expect, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { VersionedZodJson } from ".";
import { VersionedJson } from "..";

describe("mismatched schema and migrated object result", () => {
  const schema = z.object({
    bar: z.number(),
  });
  const versioned = VersionedZodJson.fromSchemaAndVersionedJson(
    schema,
    new VersionedJson().initialMigration((input: unknown) => {
      return { version: 1, data: { foo: "bar" } };
    })
  );

  test("fails with error", () => {
    expectTypeOf(versioned).toMatchTypeOf<{ error: true }>();
  });
});

describe("initial migration", () => {
  const schema = z.object({
    foo: z.string(),
  });
  const versioned = VersionedZodJson.fromSchemaAndVersionedJson(
    schema,
    new VersionedJson().initialMigration((input: unknown) => {
      return { version: 1, data: { foo: "bar" } };
    })
  );

  test("works", () => {
    const migrated = versioned.safeParse({});
    expect(migrated).toEqual({
      success: true,
      data: { foo: "bar" },
    });
    expectTypeOf(migrated.data).toEqualTypeOf<{ foo: string } | undefined>();
  });
});

describe("chained migration", () => {
  const schema = z.object({
    foo: z.string(),
    bar: z.number(),
  });
  const versioned = VersionedZodJson.fromSchemaAndVersionedJson(
    schema,
    new VersionedJson()
      .initialMigration<{ foo: string }>()
      .migrationTo(2, (input) => {
        return { ...input, bar: 42 };
      })
  );

  test("parses and unpacks input", () => {
    const migrated = versioned.safeParse({ version: 1, data: { foo: "nice" } });
    expect(migrated).toEqual({
      success: true,
      data: { foo: "nice", bar: 42 },
    });
  });

  test("packs input", () => {
    const packed = versioned.pack({ foo: "nice", bar: 42 });
    expect(packed).toEqual({ version: 2, data: { foo: "nice", bar: 42 } });
  });
});

describe("chained migration with flattened data", () => {
  const schema = z.object({
    foo: z.string(),
    bar: z.number(),
  });
  const versioned = VersionedZodJson.fromSchemaAndVersionedJson(
    schema,
    new VersionedJson({ flattenedData: true })
      .initialMigration<{ foo: string }>()
      .migrationTo(2, (input) => {
        return { ...input, bar: 42 };
      })
  );

  test("parses and unpacks input", () => {
    const migrated = versioned.safeParse({ version: 1, foo: "nice" });
    expect(migrated).toEqual({
      success: true,
      data: { foo: "nice", bar: 42 },
    });
  });

  test("packs input", () => {
    const packed = versioned.pack({ foo: "nice", bar: 42 });
    expect(packed).toEqual({ version: 2, foo: "nice", bar: 42 });
  });
});
