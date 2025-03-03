import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    buildActivity: false, // Désactive l’overlay de build
    buildActivityPosition: "bottom-right", // (facultatif) position de l’indicateur
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
  middleware: {
    runtime: "nodejs",
  },
};

export default nextConfig;
