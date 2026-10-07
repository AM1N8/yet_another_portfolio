import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolate deterministic browser fixtures from the real API's build/fetch cache.
  distDir:
    process.env.PORTFOLIO_BROWSER_TEST === "1"
      ? process.env.ACTIVITY_TEST_EMPTY === "1"
        ? ".next-browser-empty"
        : ".next-browser"
      : ".next",
};

export default nextConfig;
