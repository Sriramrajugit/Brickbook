 import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,  // For non-Turbopack
  // turbopack: { root: __dirname },  // If using Turbopack
};
module.exports = nextConfig;


export default nextConfig; 



