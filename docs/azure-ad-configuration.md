# Azure AD Configuration for Central Auth Host

## Overview

This guide explains how to configure Microsoft Entra ID (Azure AD) to work with the Central Auth Host pattern for host-based multitenancy.

## Problem Solved

Azure AD does not support wildcard redirect URIs. Without the Central Auth Host pattern, you would need to register a separate redirect URI for each tenant:

```
http://fundacionaltius.localhost:3000/api/auth/callback/azure-ad
http://homelessentrepreneur.localhost:3000/api/auth/callback/azure-ad
https://fundacionaltius.klaruk.com/api/auth/callback/azure-ad
https://homelessentrepreneur.klaruk.com/api/auth/callback/azure-ad
```

With the Central Auth Host pattern, you only need to register **one redirect URI per environment**:

## Azure Portal Configuration

### Step 1: Navigate to App Registration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign in with an account that has access to the Azure AD tenant
3. Navigate to **Azure Active Directory**
4. Select **App registrations**
5. Find and select application: `d5529863-cb41-4b63-a013-ef3a8a2bb3e7`

### Step 2: Configure Redirect URIs

1. In the app registration, select **Authentication** from the left menu
2. Under **Redirect URIs**, click **Add a platform**
3. Select **Web**
4. Add the following redirect URIs based on your environment:

#### Local Development
```
http://localhost:3000/api/auth/callback/azure-ad
```

#### Production
```
https://auth.klaruk.com/api/auth/callback/azure-ad
```

5. Click **Save**

### Step 3: Verify Other Settings

Ensure the following settings are configured:

- **Supported account types**: Select the appropriate option for your use case
- **ID tokens**: Check that ID tokens are enabled
- **Access tokens**: Check that access tokens are enabled
- **Implicit grant flow**: Can be disabled (we use authorization code flow)

## Environment Variables

### Local Development

In your `.env.development` or `.env.local` file:

```bash
# Auth host URL
NEXTAUTH_URL=http://localhost:3000

# Azure AD credentials
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# NextAuth secret (must be strong, at least 32 characters)
NEXTAUTH_SECRET=your-strong-secret-here
```

### Production

In your production environment:

```bash
# Auth host URL
NEXTAUTH_URL=https://auth.klaruk.com

# Azure AD credentials (from Azure portal)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id

# NextAuth secret (must be strong, at least 32 characters)
NEXTAUTH_SECRET=your-strong-secret-here
```

## Local Development Setup

### Step 1: Configure /etc/hosts

Add entries for your tenant hosts:

```
# On Linux/macOS
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 fundacionaltius.localhost
127.0.0.1 homelessentrepreneur.localhost
```

On Windows, edit `C:\Windows\System32\drivers\etc\hosts` with administrator privileges.

### Step 2: Test the Flow

1. Start your Next.js development server:
   ```bash
   cd voluntarios-front
   pnpm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://fundacionaltius.localhost:3000/login
   ```

3. Click the Microsoft login button
4. You should be redirected to:
   ```
   http://localhost:3000/login?tenant=fundacionaltius&return_to=/admin/dashboard&state=...
   ```

5. Complete the Microsoft login
6. You should be redirected back to:
   ```
   http://fundacionaltius.localhost:3000/admin/dashboard
   ```

7. Verify you are logged in and the session is active

## Production Deployment

### DNS Configuration

Add a DNS A record for the auth host:

```
auth.klaruk.com.  IN  A  <your-server-ip>
```

### SSL Certificate

Ensure you have a valid SSL certificate for `auth.klaruk.com`. You can use:

- Let's Encrypt with Certbot
- Your hosting provider's SSL management
- A wildcard certificate for `*.klaruk.com`

### Nginx Configuration

Example Nginx configuration for the auth host:

```nginx
server {
    listen 443 ssl;
    server_name auth.klaruk.com;
    
    ssl_certificate /path/to/auth.klaruk.com.crt;
    ssl_certificate_key /path/to/auth.klaruk.com.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Verify Production Configuration

1. Ensure `NEXTAUTH_URL=https://auth.klaruk.com` is set
2. Ensure Azure AD has `https://auth.klaruk.com/api/auth/callback/azure-ad` registered
3. Test the flow with a production tenant host

## Troubleshooting

### Error: AADSTS50011 - Redirect URI Mismatch

**Cause**: The redirect URI in the OAuth request doesn't match what's registered in Azure AD.

**Solution**: 
1. Verify `NEXTAUTH_URL` is set correctly
2. Verify the redirect URI is registered in Azure AD
3. Check that you're not accidentally using a tenant-specific URL

### Error: Invalid State Parameter

**Cause**: The state parameter couldn't be verified (tampered or expired).

**Solution**:
1. Check that `NEXTAUTH_SECRET` is the same on all instances
2. Ensure the state hasn't expired (5-minute window)
3. Verify the tenant is in `KNOWN_TENANT_SLUGS`

### Error: Token Expired

**Cause**: The handoff token expired before being used (5-minute expiry).

**Solution**:
1. Complete the OAuth flow within 5 minutes
2. Check server time synchronization

### Error: Not on Auth Host

**Cause**: The tenant handoff endpoint was accessed from a non-auth host.

**Solution**:
1. Verify the OAuth callback is going to the auth host
2. Check that `NEXTAUTH_URL` is configured correctly

## Security Considerations

### State Parameter
- Signed with HMAC-SHA256 using `NEXTAUTH_SECRET`
- Contains tenant, returnTo, and timestamp
- Valid for 5 minutes only
- Prevents CSRF and replay attacks

### Handoff Token
- Signed with the same secret
- Contains user data and auth tokens
- Valid for 5 minutes only
- Used only once (consumed immediately)

### Session Cookies
- Host-only (no Domain attribute)
- HttpOnly (not accessible via JavaScript)
- Secure in production (HTTPS only)
- SameSite=Lax for CSRF protection

## Testing Checklist

- [ ] Azure AD redirect URI registered correctly
- [ ] `NEXTAUTH_URL` set to auth host
- [ ] `NEXTAUTH_SECRET` configured and consistent
- [ ] `/etc/hosts` entries for local development
- [ ] SSL certificate for production auth host
- [ ] DNS A record for auth.klaruk.com
- [ ] Nginx/Apache proxy configuration
- [ ] Tenant isolation verified (separate sessions per host)

## Rollback Plan

If you need to rollback to the previous behavior:

1. Register individual redirect URIs for each tenant in Azure AD
2. Remove the handoff endpoints
3. Revert the LoginForm changes
4. Remove the state management utilities

See `docs/azure-ad-rollback.md` for detailed rollback instructions.