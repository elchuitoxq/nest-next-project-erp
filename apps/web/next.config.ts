import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { resolve } from "path";

// Load environment variables from root
loadEnvConfig(resolve(process.cwd(), "../../"));

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
