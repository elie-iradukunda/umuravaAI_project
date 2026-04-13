import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@umurava/shared"],
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid flaky filesystem cache corruption in Next dev on Windows.
      config.cache = {
        type: "memory",
      };
    }

    return config;
  },
};

export default nextConfig;
