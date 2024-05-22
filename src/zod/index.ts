import { z } from "zod";
import { VersionedJson, VersionedJsonOptions } from "..";

type SafeParseReturnType<T extends z.ZodTypeAny> = T extends z.ZodType<
  infer Output,
  any,
  infer Input
>
  ? z.SafeParseReturnType<Input, Output>
  : never;

export class VersionedZodJson<
  ZodSchema extends z.ZodTypeAny,
  Options extends VersionedJsonOptions,
  Schemas extends Record<number, any> = {},
  LatestVersion extends (keyof Schemas & number) | never = never
> {
  static fromSchemaAndVersionedJson<
    ZodSchema extends z.ZodTypeAny,
    Options extends VersionedJsonOptions,
    Schemas extends Record<number, any> = {},
    LatestVersion extends (keyof Schemas & number) | never = never
  >(
    schema: ZodSchema,
    vj: VersionedJson<Options, Schemas, LatestVersion>
  ): Schemas[LatestVersion] extends z.infer<ZodSchema>
    ? VersionedZodJson<ZodSchema, Options, Schemas, LatestVersion>
    : { error: true; message: "Schema does not match latest version" } {
    return new VersionedZodJson(schema, vj) as any;
  }

  private constructor(
    private schema: ZodSchema,
    private versionedJson: VersionedJson<Options, Schemas, LatestVersion>
  ) {}

  safeParse(input: unknown): SafeParseReturnType<ZodSchema> {
    const migrated = this.versionedJson.unpack(input);
    return this.schema.safeParse(migrated) as any;
  }

  unpack(input: unknown): z.infer<ZodSchema> {
    return this.schema.parse(this.versionedJson.unpack(input));
  }

  pack(input: z.infer<ZodSchema>) {
    return this.versionedJson.pack(this.schema.parse(input));
  }
}
