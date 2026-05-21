import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/commands/doctor/index.ts",
    "src/commands/prompt/index.ts",
    "src/commands/component/index.ts",
    "src/commands/new/index.ts",
    "src/commands/pack/index.ts",
    "src/commands/launch/index.ts",
    "src/commands/dash/index.ts",
    "src/commands/config/index.ts",
    "src/commands/template/index.ts",
  ],
  format: ["esm"],
  target: "node20",
  sourcemap: true,
  clean: true,
  splitting: false,
  outDir: "dist",
  dts: false,
  outExtension() {
    return {
      js: ".js",
    };
  },
});