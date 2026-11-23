import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile, `runner` target).
  output: "standalone",
  // Old module URLs from before the nav followed the design system.
  async redirects() {
    return [
      { source: "/abm", destination: "/accounts", permanent: true },
      { source: "/vsi", destination: "/forecast", permanent: true },
      { source: "/insights", destination: "/intelligence", permanent: true },
      { source: "/admin", destination: "/settings", permanent: true },
    ];
  },
};

export default nextConfig;
