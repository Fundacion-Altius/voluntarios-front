import { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Explicitly set assetPrefix to undefined for root domain deployment
    // This ensures no /voluntarios/ prefix is added to asset paths
    assetPrefix: undefined,
    
    // Remove CORS headers and rewrites since we're using Vercel internal networking
    // API calls will go directly to backend service via internal URLs
    
    // Enable React Strict Mode for better development
    reactStrictMode: true,
    
    // Ensure basePath is also undefined to prevent any path prefixing
    basePath: undefined,
    
    // Configure output file tracing to help with asset loading
    experimental: {
      outputFileTracingRoot: process.cwd(),
    },
}

export default nextConfig;
