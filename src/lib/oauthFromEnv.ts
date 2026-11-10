/** Azure AD has no wildcard redirect URIs. Register each tenant origin:
 *  {origin}/api/auth/callback/azure-ad
 *  Scale-out pattern: one canonical auth host + cookie on the parent domain.
 */
export function oauthFromEnv() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || '';
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || '';
  const azureClientId = process.env.AZURE_AD_CLIENT_ID || process.env.AUTH_AZURE_AD_ID || '';
  const azureClientSecret = process.env.AZURE_AD_CLIENT_SECRET || process.env.AUTH_AZURE_AD_SECRET || '';
  const azureTenantId = process.env.AZURE_AD_TENANT_ID || process.env.AUTH_AZURE_AD_TENANT_ID || 'common';

  return {
    google: Boolean(googleClientId && googleClientSecret),
    azure: Boolean(azureClientId && azureClientSecret),
    googleClientId,
    googleClientSecret,
    azureClientId,
    azureClientSecret,
    azureTenantId,
  };
}
