# Azure AD Central Auth Host - Rollback Plan

## Overview

This document provides step-by-step instructions to rollback from the Central Auth Host pattern to the original per-tenant redirect URI approach.

## When to Rollback

Consider rolling back if you encounter:
- Critical issues with the Central Auth Host pattern
- Azure AD configuration conflicts
- Tenant isolation violations
- Performance issues with the handoff flow
- Need to support additional OAuth providers that don't work with the pattern

## Rollback Steps

### Step 1: Register Individual Redirect URIs in Azure AD

For each tenant, register the tenant-specific redirect URI:

#### Local Development
```
http://fundacionaltius.localhost:3000/api/auth/callback/azure-ad
http://homelessentrepreneur.localhost:3000/api/auth/callback/azure-ad
```

#### Production
```
https://fundacionaltius.klaruk.com/api/auth/callback/azure-ad
https://homelessentrepreneur.klaruk.com/api/auth/callback/azure-ad
```

**Steps:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. Select application `d5529863-cb41-4b63-a013-ef3a8a2bb3e7`
4. Go to Authentication blade
5. Add each tenant-specific redirect URI
6. Click Save

### Step 2: Remove Central Auth Host Configuration

#### Remove Environment Variables

Remove or comment out the Central Auth Host specific configuration:

```bash
# Remove or comment out
# NEXTAUTH_URL=http://localhost:3000

# Keep the original Azure AD credentials
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production
```

### Step 3: Revert Code Changes

#### Remove New Files

Delete the following files created for the Central Auth Host pattern:

```bash
# State management utilities
rm voluntarios-front/src/lib/authState.ts
rm voluntarios-front/src/lib/authState.spec.ts

# Handoff endpoints
rm -rf voluntarios-front/src/app/api/auth/tenant-handoff/
rm -rf voluntarios-front/src/app/api/auth/receive-handoff/

# Documentation
rm voluntarios-front/docs/azure-ad-configuration.md
rm voluntarios-front/docs/azure-ad-rollback.md
rm voluntarios-front/docs/azure-ad-local-setup.md
rm voluntarios-front/docs/azure-ad-production-deployment.md
```

#### Revert Modified Files

Revert the following files to their original state:

1. **`voluntarios-front/src/app/api/auth/[...nextauth]/route.ts`**
   - Remove `trustHost: true`
   - Remove the `redirect` callback
   - Remove imports for `authState` and `tenantHost`

2. **`voluntarios-front/src/app/[locale]/login/LoginForm.tsx`**
   - Remove tenant detection logic
   - Remove auth host redirect logic
   - Revert Azure AD and Google login to use direct `signIn()` calls
   - Remove imports for `tenantHost` and `authState`

3. **`voluntarios-front/src/middleware.ts`**
   - Remove `shouldBypassTenantCheck` function
   - Remove auth host bypass logic
   - Remove import for `isAuthHost`

4. **`voluntarios-front/.env.example`**
   - Remove Central Auth Host comments
   - Keep only basic NEXTAUTH_URL

### Step 4: Revert OpenSpec Changes

```bash
# Remove the OpenSpec change directory
rm -rf openspec/changes/2026-09-02-azure-ad-central-auth/

# Revert any changes to main specs if they were updated
git checkout openspec/specs/user-auth/spec.md
git checkout openspec/specs/hostname-tenancy/spec.md
git checkout openspec/specs/tenant-session-binding/spec.md
```

### Step 5: Clean Up DNS (Production Only)

If you added DNS records for `auth.klaruk.com`, you can optionally remove them:

```
# Remove the A record for auth.klaruk.com
# auth.klaruk.com.  IN  A  <your-server-ip>
```

### Step 6: Remove Nginx Configuration (Production Only)

Remove or disable the Nginx configuration for `auth.klaruk.com`:

```bash
# Remove the auth host configuration
rm /etc/nginx/sites-available/auth.klaruk.com
rm /etc/nginx/sites-enabled/auth.klaruk.com

# Reload Nginx
nginx -t && systemctl reload nginx
```

## Verification

After rollback, verify the following:

### Local Development
1. Navigate to `http://fundacionaltius.localhost:3000/login`
2. Click Azure AD login
3. Verify redirect goes directly to Azure AD (not via localhost:3000)
4. Verify callback comes back to `http://fundacionaltius.localhost:3000/api/auth/callback/azure-ad`
5. Verify session is established on the tenant host

### Production
1. Navigate to `https://fundacionaltius.klaruk.com/login`
2. Click Azure AD login
3. Verify callback comes back to `https://fundacionaltius.klaruk.com/api/auth/callback/azure-ad`
4. Verify session is established

### Tenant Isolation
1. Login on `fundacionaltius.klaruk.com`
2. Open new incognito window to `homelessentrepreneur.klaruk.com`
3. Verify NOT logged in (401 or redirect to login)

## Fallback: Hybrid Approach

If you want to keep some benefits of the Central Auth Host pattern while rolling back, consider a hybrid approach:

### Option 1: Central Auth Host for New Tenants Only

1. Keep the Central Auth Host pattern
2. Register both individual tenant URIs AND the central auth URI in Azure AD
3. Use the Central Auth Host for new tenants
4. Keep existing tenants on individual URIs

### Option 2: Central Auth Host as Fallback

1. Try the tenant-specific OAuth flow first
2. If it fails with AADSTS50011, fall back to Central Auth Host flow
3. This requires more complex error handling

## Recovery

If the rollback itself causes issues, you can restore the Central Auth Host pattern:

```bash
# Restore from git
git checkout feat/azure-ad-central-auth -- .

# Or re-apply the changes manually
```

## Support

If you encounter issues during rollback:

1. Check git history for the exact changes made
2. Review the original OpenSpec change proposal
3. Test each step individually
4. Consider creating a backup branch before rollback

## Checklist

- [ ] Individual redirect URIs registered in Azure AD
- [ ] New files removed
- [ ] Modified files reverted
- [ ] Environment variables updated
- [ ] OpenSpec changes removed
- [ ] DNS configuration cleaned up (if applicable)
- [ ] Nginx configuration removed (if applicable)
- [ ] Local development tested
- [ ] Production tested
- [ ] Tenant isolation verified