import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Use internal HTTP URL to avoid self-signed SSL cert errors on VPS
        source: '/supabase/:path*',
        destination: `${process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL}/:path*`,
      },
    ]
  },
};

export default nextConfig;
