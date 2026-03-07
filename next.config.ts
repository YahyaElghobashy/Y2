import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json") as { version: string };

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  env: {
    APP_VERSION: pkg.version,
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
};

export default withSerwist(nextConfig);
