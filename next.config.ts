import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // @ts-ignore - Support for Next.js 16 Turbopack with custom webpack plugins
  turbopack: {},
};

export default withPWA(nextConfig);
