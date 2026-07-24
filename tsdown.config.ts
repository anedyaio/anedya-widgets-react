import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  tsconfig: "./ts.config.json",
  // Updated from external to deps.neverBundle
  deps: {
    neverBundle: ["react", "react-dom", "@base-ui/react"]
  },
  clean: false,
});
