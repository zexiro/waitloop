import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // PGlite ships WASM that breaks when bundled — load it from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "*": ["./content/**/*", "./drizzle/**/*"],
  },
};

export default nextConfig;
