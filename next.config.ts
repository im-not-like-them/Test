import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Import CSV des utilisateurs (2 Mo max côté application).
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
