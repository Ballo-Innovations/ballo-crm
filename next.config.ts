import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile, `runner` target).
  output: "standalone",
};

export default nextConfig;
