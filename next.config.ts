import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep browser-test builds independent of the local development server.
  distDir:
    process.env.PORTFOLIO_BROWSER_TEST === "1" ? ".next-browser" : ".next",
};

export default nextConfig;
