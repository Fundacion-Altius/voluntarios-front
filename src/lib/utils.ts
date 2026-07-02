import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Environment detection utility
export function getEnvironment() {
  // Check Vercel environment first
  if (process.env.VERCEL_ENV === 'production') return 'production'
  if (process.env.VERCEL_ENV === 'preview') return 'staging'
  
  // Fallback to custom environment variables
  if (process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true') return 'production'
  if (process.env.NEXT_PUBLIC_IS_STAGING === 'true') return 'staging'
  if (process.env.NEXT_PUBLIC_IS_DEVELOPMENT === 'true') return 'development'
  
  // Default to development
  return 'development'
}

export function isProduction() {
  return getEnvironment() === 'production'
}

export function isStaging() {
  return getEnvironment() === 'staging'
}

export function isDevelopment() {
  return getEnvironment() === 'development'
}

export function getAPIUrl() {
  // Use environment-specific API URL
  const env = getEnvironment()
  
  switch (env) {
    case 'production':
      return process.env.NEXT_PUBLIC_API_URL || 'https://api.voluntarios.example.com'
    case 'staging':
      return process.env.NEXT_PUBLIC_API_URL || 'https://staging-api.voluntarios.example.com'
    case 'development':
    default:
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  }
}

export function getFeatureFlag(flagName: string) {
  // Get feature flag value with environment-specific defaults
  const env = getEnvironment()
  
  switch (flagName) {
    case 'NEW_CONTRACT_FLOW':
      return process.env.NEXT_PUBLIC_FEATURE_NEW_CONTRACT_FLOW === 'true' || env !== 'development'
    case 'ADVANCED_ANALYTICS':
      return process.env.NEXT_PUBLIC_FEATURE_ADVANCED_ANALYTICS === 'true' || env === 'production'
    case 'AZURE_AD_AUTH':
      return process.env.NEXT_PUBLIC_FEATURE_AZURE_AD_AUTH === 'true' || true
    default:
      return false
  }
}
