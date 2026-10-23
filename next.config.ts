import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Eingebettetes Postgres (nur lokal) soll nicht gebündelt werden
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
