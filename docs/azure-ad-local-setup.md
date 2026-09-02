# Local Development Setup for Azure AD Central Auth Host

## Overview

This guide explains how to set up your local development environment to test the Central Auth Host pattern for Azure AD OAuth with host-based multitenancy.

## Prerequisites

- Node.js v18+ installed
- pnpm installed
- Docker (optional, for backend services)
- Access to Azure AD tenant for testing

## Step 1: Configure /etc/hosts

Add DNS entries for your tenant hosts to resolve to localhost:

### On Linux/macOS

```bash
# Edit hosts file
sudo nano /etc/hosts

# Add these entries (replace existing if they exist)
127.0.0.1 localhost
127.0.0.1 fundacionaltius.localhost
127.0.0.1 homelessentrepreneur.localhost
```

### On Windows

1. Open Notepad as Administrator
2. Open `C:\Windows\System32\drivers\etc\hosts`
3. Add the entries:
   ```
   127.0.0.1 localhost
   127.0.0.1 fundacionaltius.localhost
   127.0.0.1 homelessentrepreneur.localhost
   ```
4. Save the file

### Verify Hosts Configuration

```bash
# On Linux/macOS
cat /etc/hosts | grep localhost

# On Windows
type C:\Windows\System32\drivers\etc\hosts | find "localhost"
```

You should see the tenant host entries.

## Step 2: Configure Environment Variables

Create a `.env.local` file in the `voluntarios-front` directory:

```bash
cd voluntarios-front
cp .env.example .env.local
```

Edit `.env.local` with your Azure AD credentials:

```bash
# API URL (backend)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Central Auth Host URL
NEXTAUTH_URL=http://localhost:3000

# Azure AD Configuration
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id

# NextAuth Secret (generate a strong secret)
NEXTAUTH_SECRET=your-strong-secret-here-minimum-32-characters

# Other settings
NEXT_PUBLIC_IMAGE_PREFIX=/
NEXT_PUBLIC_ENABLE_SW=false
```

### Generate a Strong NEXTAUTH_SECRET

```bash
# On Linux/macOS
openssl rand -base64 32

# On Windows (PowerShell)
[System.Web.Security.Membership]::GeneratePassword(32, 10)

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 3: Register Redirect URIs in Azure AD

For local development, register this redirect URI in Azure AD:

```
http://localhost:3000/api/auth/callback/azure-ad
```

**Steps:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. Select your application
4. Go to Authentication blade
5. Under Redirect URIs, add: `http://localhost:3000/api/auth/callback/azure-ad`
6. Click Save

## Step 4: Start the Development Servers

### Start Frontend

```bash
cd voluntarios-front
pnpm install
pnpm run dev
```

The frontend will be available at:
- `http://localhost:3000` (auth host)
- `http://fundacionaltius.localhost:3000` (tenant host)
- `http://homelessentrepreneur.localhost:3000` (tenant host)

### Start Backend (Optional)

If you need the backend API:

```bash
cd voluntarios-back
pnpm install
pnpm run dev
```

The backend will be available at `http://localhost:3001`.

## Step 5: Test the Flow

### Test 1: Direct Auth Host Login

1. Open browser to: `http://localhost:3000/login`
2. Click Microsoft login button
3. Complete Azure AD login
4. Verify you're redirected back and logged in

### Test 2: Tenant Host Login (Central Auth Host Flow)

1. Open browser to: `http://fundacionaltius.localhost:3000/login`
2. Click Microsoft login button
3. **Expected behavior:**
   - You should be redirected to: `http://localhost:3000/login?tenant=fundacionaltius&return_to=/admin/dashboard&state=...`
   - Complete Azure AD login on localhost:3000
   - After successful login, you should be redirected to: `http://fundacionaltius.localhost:3000/api/auth/receive-handoff?token=...`
   - Finally, you should land on: `http://fundacionaltius.localhost:3000/admin/dashboard` with an active session

### Test 3: Different Tenant

1. Open a new incognito/private window
2. Navigate to: `http://homelessentrepreneur.localhost:3000/login`
3. Click Microsoft login button
4. Complete the flow
5. Verify you're logged in on the homelessentrepreneur host

### Test 4: Tenant Isolation

1. Login on `http://fundacionaltius.localhost:3000`
2. Verify you're logged in
3. Open a new incognito window to `http://homelessentrepreneur.localhost:3000/admin/dashboard`
4. **Expected:** You should NOT be logged in (401 or redirect to login)

### Test 5: Session Persistence

1. Login on `http://fundacionaltius.localhost:3000`
2. Refresh the page
3. **Expected:** Still logged in
4. Navigate to different pages
5. **Expected:** Access granted

## Step 6: Debugging

### Check Console Logs

Open browser developer tools (F12) and check the Console and Network tabs for errors.

### Check Server Logs

The development server logs will show:
- OAuth flow progress
- State verification results
- Handoff token creation
- Session establishment

### Common Issues

#### Issue: Redirect URI Mismatch

**Error:** `AADSTS50011: The redirect URI does not match`

**Solution:**
1. Verify `NEXTAUTH_URL=http://localhost:3000` is set
2. Verify Azure AD has `http://localhost:3000/api/auth/callback/azure-ad` registered
3. Check that you're not using HTTPS in local development

#### Issue: Host Not Found

**Error:** Browser says "This site can't be reached" for tenant hosts

**Solution:**
1. Verify `/etc/hosts` entries are correct
2. Try pinging the hosts: `ping fundacionaltius.localhost`
3. Clear DNS cache: `sudo dscacheutil -flushcache` (macOS) or `ipconfig /flushdns` (Windows)

#### Issue: Invalid State Parameter

**Error:** Redirect to `/login?error=invalid_state`

**Solution:**
1. Verify `NEXTAUTH_SECRET` is set and consistent
2. Check that the tenant is in `KNOWN_TENANT_SLUGS` (fundacionaltius, homelessentrepreneur)
3. Ensure the state hasn't expired (5-minute window)

#### Issue: Token Expired

**Error:** Redirect to `/login?error=token_expired`

**Solution:**
1. Complete the OAuth flow within 5 minutes
2. Check that server time is synchronized

## Step 7: Verify All Tests Pass

Run the unit tests to ensure everything is working:

```bash
cd voluntarios-front
pnpm test -- src/lib/authState.spec.ts
```

All tests should pass.

## Configuration Summary

| Setting | Value | Purpose |
|---------|-------|---------|
| `/etc/hosts` entries | `127.0.0.1 fundacionaltius.localhost` etc. | Resolve tenant hosts to localhost |
| `NEXTAUTH_URL` | `http://localhost:3000` | Central auth host URL |
| `AZURE_AD_CLIENT_ID` | Your Azure AD client ID | OAuth client credentials |
| `AZURE_AD_CLIENT_SECRET` | Your Azure AD client secret | OAuth client credentials |
| `AZURE_AD_TENANT_ID` | Your Azure AD tenant ID | OAuth tenant identifier |
| `NEXTAUTH_SECRET` | Strong random string | Signing secret for state/tokens |
| Azure AD Redirect URI | `http://localhost:3000/api/auth/callback/azure-ad` | OAuth callback endpoint |

## Clean Up

When you're done with local development:

1. Remove the `/etc/hosts` entries if you no longer need them
2. Clear browser cookies for the test hosts
3. Stop the development servers

## Tips

- Use browser incognito/private windows for testing different tenants
- Clear cookies between tests to avoid session conflicts
- Use the browser's Network tab to inspect the OAuth flow
- Check the server console for detailed logs
- Test with both Microsoft and Google OAuth if both are configured