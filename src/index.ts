import { Decrement } from "./types";

export type VersionedJsonOptions = { flattenedData?: boolean };

export type VersionedType<T, Version extends number = number> = {
  version: Version;
  data: T;
};
export type FlattenedVersionedType<
  T extends Record<any, any>,
  Version extends number = number
> = {
  version: Version;
} & T;

export type EitherVersionedType<
  Options extends VersionedJsonOptions,
  T extends Record<any, any>,
  Version extends number = number
> = Options extends { flattenedData: true }
  ? FlattenedVersionedType<T, Version>
  : VersionedType<T, Version>;

export class VersionedJson<
  Options extends VersionedJsonOptions,
  Schemas extends Record<number, Record<any, any>> = {},
  LatestVersion extends (keyof Schemas & number) | never = never
> {
  private migrations = new Map<
    number | null,
    { newVersion: number | null; migrator: (input: any) => any }
  >();
  private latestVersion: LatestVersion = null as any;

  constructor(private options: Options = {} as any) {}

  initialMigration<
    FirstVersionType extends Record<any, any>,
    const FirstVersion extends number = 1
  >(
    migrate?: (
      unversioned: unknown
    ) => EitherVersionedType<Options, FirstVersionType, FirstVersion>
  ): VersionedJson<
    Options,
    Schemas & {
      [_ in FirstVersion]: FirstVersionType;
    },
    FirstVersion
  > {
    if (migrate) {
      this.migrations.set(null, { newVersion: null, migrator: migrate });
    }
    return this as any;
  }

  migrationTo<
    ToVersionType,
    const ToVersion extends number,
    const FromVersion extends keyof Schemas | null = Decrement<ToVersion>
  >(
    to: ToVersion,
    migrate: (
      previous: FromVersion extends keyof Schemas
        ? Schemas[FromVersion]
        : unknown
    ) => ToVersionType
  ): VersionedJson<
    Options,
    Schemas & {
      [_ in ToVersion]: ToVersionType;
    },
    ToVersion
  > {
    if (!(typeof to === "number")) {
      throw new Error("to must be a number");
    }
    const fromVersion = (to - 1) as any;
    this.migrations.set(fromVersion, { newVersion: to, migrator: migrate });
    this.latestVersion = to as any;
    return this as any;
  }

  applyMigration(
    input: unknown
  ): LatestVersion extends keyof Schemas
    ? EitherVersionedType<Options, Schemas[LatestVersion], LatestVersion>
    : never {
    if (
      this.options.flattenedData &&
      input &&
      typeof input === "object" &&
      "version" in input &&
      typeof input.version === "number"
    ) {
      const { version, ...data } = input;
      if (version === this.latestVersion) {
        return input as any;
      }

      const migrator = this.migrations.get(version);
      if (!migrator) {
        throw new Error("missing migrator");
      }
      const migrated = {
        ...migrator.migrator(data),
        version: migrator.newVersion!,
      };
      return this.applyMigration(migrated);
    } else if (
      !this.options.flattenedData &&
      input &&
      typeof input === "object" &&
      "version" in input &&
      typeof input.version === "number" &&
      "data" in input
    ) {
      const { version, data } = input;
      if (version === this.latestVersion) {
        return input as any;
      }

      const migrator = this.migrations.get(version);
      if (!migrator) {
        throw new Error("missing migrator");
      }
      const migrated = {
        version: migrator.newVersion!,
        data: migrator.migrator(data),
      };
      return this.applyMigration(migrated);
    } else {
      const migrator = this.migrations.get(null);
      if (!migrator) {
        throw new Error("missing null migrator");
      }
      const migrated = migrator.migrator(input);

      if (this.latestVersion === null) {
        // no further migrations exist
        return migrated as any;
      }
      return this.applyMigration(migrated);
    }
  }

  unpack(
    input: unknown
  ): Options extends { flattenedData: true }
    ? FlattenedVersionedType<Schemas[LatestVersion], LatestVersion>
    : Schemas[LatestVersion] {
    if (this.options.flattenedData) {
      return this.applyMigration(input) as any;
    } else {
      return this.applyMigration(input).data;
    }
  }

  pack(
    input: Schemas[LatestVersion]
  ): LatestVersion extends keyof Schemas
    ? EitherVersionedType<Options, Schemas[LatestVersion], LatestVersion>
    : never {
    if (this.options.flattenedData) {
      return {
        ...input,
        version: this.latestVersion as any,
      } as any;
    } else {
      return {
        version: this.latestVersion as any,
        data: input,
      } as any;
    }
  }
}

export type LatestVersionType<V extends VersionedJson<any, any, any>> =
  V extends VersionedJson<any, infer Schemas, infer Latest>
    ? Latest extends keyof Schemas
      ? Schemas[Latest]
      : never
    : never;
