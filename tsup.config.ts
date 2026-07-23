import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  tsconfig: "./ts.config.json",
  external: ["react", "react-dom", "@base-ui/react"],
  clean: false,
});