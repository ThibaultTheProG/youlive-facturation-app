/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  devIndicators: {
    position: "bottom-right", // Position de l'indicateur
  },
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig; 