# Email Confirmation Link Fix

## Problem
Email confirmation links are redirecting to `localhost` instead of the production domain `https://cornucopialocal.com`.

## Root Cause
Supabase email templates use the "Site URL" configured in your Supabase project settings. This needs to be updated to point to your production domain.

## Solution

### Step 1: Update Supabase Project Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh

2. Navigate to **Authentication** → **URL Configuration**

3. Update the following settings:

   **Site URL:**
   ```
   https://cornucopialocal.com
   ```

   **Redirect URLs** (Add all of these if not already present):
   ```
   https://cornucopialocal.com/auth/callback
   https://cornucopialocal.com/auth/login
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/login
   ```

4. Click **Save**

### Step 2: Verify Email Templates

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**

2. Check the **Confirm signup** template

3. Verify that it uses `{{ .SiteURL }}` in the confirmation link, which should look like:
   ```
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
   ```

4. If the template doesn't use `{{ .SiteURL }}`, update it accordingly

### Step 3: Test the Fix

1. Create a new test account on the production site
2. Check that the confirmation email now contains links to `https://cornucopialocal.com` instead of `localhost`
3. Click the confirmation link to verify it works correctly

## Additional Notes

- The local environment (`.env.local`) uses `http://localhost:3000` which is correct for development
- The production environment (Vercel) uses `https://cornucopialocal.com` via `vercel.json`
- Supabase's "Site URL" determines which URL is used in email templates
- For local development to work, `http://localhost:3000/auth/callback` must be in the redirect URLs list

## Common Issues

**Q: I updated the Site URL but emails still show localhost**
A: Clear your browser cache and wait a few minutes for Supabase to propagate the changes. Also check that you saved the settings properly.

**Q: Can I use both production and localhost?**
A: The Site URL can only be one domain. For local development, you can manually change it back to localhost temporarily, but it's recommended to keep it set to production and test production deployments for email flows.

**Q: Email confirmation works but redirects to wrong page**
A: Check the `app/auth/callback/route.ts` file. The default redirect is to `/dashboard/analytics` which can be modified if needed.
