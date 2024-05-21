import { z } from "zod";
import { VersionedJson, VersionedJsonOptions } from "..";
import { IfEquals, SchemaTypeFromLatestVersion } from "../types";

type SafeParseReturnType<T extends z.ZodTypeAny> = T extends z.ZodType<
  infer Output,
  any,
  infer Input
>
  ? z.SafeParseReturnType<Input, Output>
  : never;

type ValidateSetup<
  ZodSchema extends z.ZodTypeAny,
  Options extends VersionedJsonOptions,
  Schemas extends Record<number, any> = {},
  LatestVersion extends (keyof Schemas & number) | never = never
> = IfEquals<
  z.infer<ZodSchema>,
  SchemaTypeFromLatestVersion<Schemas, LatestVersion>,
  VersionedZodJson<ZodSchema, Options, Schemas, LatestVersion>,
  { error: true; message: "Schema does not match latest version" }
>;

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
  ): ValidateSetup<ZodSchema, Options, Schemas, LatestVersion> {
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

  pack(input: z.infer<ZodSchema>) {
    return this.versionedJson.pack(this.schema.parse(input));
  }
}
