import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // main entry
  outDir: "dist",
  format: ["cjs", "esm"], // generate CommonJS and ESM
  dts: true,               // generate type declarations
  sourcemap: true,
  clean: true,             // clean dist folder before build
  minify: false,
  target: "es2020"
});
