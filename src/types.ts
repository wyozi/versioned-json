// https://twitter.com/mattpocockuk/status/1622730173446557697
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type SchemaTypeFromLatestVersion<
  Schemas extends Record<number, Record<any, any>>,
  LatestVersion extends keyof Schemas | null
> = LatestVersion extends keyof Schemas ? Schemas[LatestVersion] : unknown;

// https://stackoverflow.com/a/53808212/13065068
export type IfEquals<T, U, Y = unknown, N = never> = (<G>() => G extends T
  ? 1
  : 2) extends <G>() => G extends U ? 1 : 2
  ? Y
  : N;

// https://stackoverflow.com/a/73555039/13065068
export type Arr<N extends number, T extends any[] = []> = T["length"] extends N
  ? T
  : Arr<N, [...T, any]>;
export type Decrement<N extends number> = Arr<N> extends [any, ...infer U]
  ? U["length"]
  : never;
