import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  // Force Turbopack to use this app folder (avoids picking a parent lockfile)
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
