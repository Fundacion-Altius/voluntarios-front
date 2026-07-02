import { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Remove assetPrefix for Vercel deployment (serves from root domain)
    assetPrefix: '',
    
    // Remove CORS headers and rewrites since we're using Vercel internal networking
    // API calls will go directly to backend service via internal URLs
    
    // Enable React Strict Mode for better development
    reactStrictMode: true,
}

export default nextConfig;
