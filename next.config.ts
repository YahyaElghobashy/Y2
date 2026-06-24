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
  // Ship the hosted-trip static bundles with the serverless function that
  // serves them. Without this the files exist in the repo but are tree-shaken
  // out of the Vercel bundle → prod 404s from the serve route. Keys are matched
  // as globs against route paths, so we cover the exact route plus a glob.
  outputFileTracingIncludes: {
    "/(main)/travels/[tripId]/site/[[...path]]": ["content/trips/**/*"],
    "**/travels/**/site/**": ["content/trips/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
};

export default withSerwist(nextConfig);
