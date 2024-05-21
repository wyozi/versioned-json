import { resolve } from "path";
import { doctest } from "vite-plugin-doctest";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";
import packageJson from "./package.json";

export default defineConfig({
  plugins: [doctest(), dts({ rollupTypes: true })],
  test: {
    includeSource: [
      "./src/**/*.[jt]s?(x)",
      // "./README.md"
    ],
  },
  build: {
    // lib: {
    //   entry: resolve(__dirname, "src/index.ts"),
    //   name: getPackageNameCamelCase(),
    //   formats,
    //   fileName: (format) => fileName[format],
    // },
    rollupOptions: {
      input: {
        index: resolve(__dirname, "src/index.ts"),
        zod: resolve(__dirname, "src/zod/index.ts"),
      },
      external: [...Object.keys(packageJson.peerDependencies)],
      output: [
        {
          dir: resolve(__dirname, "dist"),
          format: "es",
          entryFileNames: "[name].[format].js",
        },
        {
          dir: resolve(__dirname, "dist"),
          format: "cjs",
          entryFileNames: "[name].[format].js",
        },
      ],
    },
  },
});
