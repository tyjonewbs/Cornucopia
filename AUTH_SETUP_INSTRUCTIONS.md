# Authentication Setup Instructions

Follow these steps to configure authentication in your Supabase dashboard.

## Step 1: Configure Email Authentication

Email authentication should already be enabled by default, but let's verify:

1. **Navigate to Auth Providers:**
   - Go to: https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/auth/providers

2. **Verify Email Provider:**
   - Scroll down to find "Email" in the providers list
   - It should show as "Enabled"
   - Click on "Email" to configure settings

3. **Email Settings (Optional):**
   - **Confirm email**: Toggle ON if you want users to confirm their email
   - **Secure email change**: Toggle ON for additional security
   - **Double confirm email change**: Toggle ON if you want extra confirmation
   - Click "Save" if you made changes

---

## Step 2: Configure Auth URL Settings

**URL:** https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/auth/url-configuration

1. **Site URL:**
   - Set to: `http://localhost:3000`
   - For production, update to your production URL

2. **Redirect URLs:**
   Add these URLs (one per line):
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   http://localhost:3000/*
   ```

3. Click **Save**

---

## Step 3: Configure Google OAuth (Optional but Recommended)

### Part A: Create Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - Navigate to: https://console.cloud.google.com/

2. **Create or Select Project:**
   - If you have an existing project, select it
   - Or click "New Project" to create one
   - Name it something like "Cornucopia Auth"

3. **Enable Google+ API (if needed):**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable" if not already enabled

4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Click "Create"
   - Fill in required fields:
     - **App name**: Cornucopia
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click "Save and Continue"
   - Skip scopes (or add email, profile if prompted)
   - Click "Save and Continue"
   - Add test users if in testing mode
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: Cornucopia Supabase Auth
   
6. **Add Authorized Redirect URIs:**
   Click "Add URI" and add these two URLs:
   ```
   https://swhinhgrtcowjmpstozh.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

7. **Create and Copy Credentials:**
   - Click "Create"
   - **IMPORTANT:** Copy the Client ID and Client Secret
   - Keep these safe - you'll need them in the next step

### Part B: Configure Google OAuth in Supabase

1. **Navigate to Auth Providers:**
   - Go to: https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/auth/providers

2. **Find Google Provider:**
   - Scroll to find "Google" in the providers list
   - Click on "Google" to expand

3. **Enable and Configure:**
   - Toggle "Enable Sign in with Google" to **ON**
   - Paste your **Client ID** from Google Console
   - Paste your **Client Secret** from Google Console
   - Click "Save"

---

## Step 4: Verify Configuration

1. **Check Auth Providers Page:**
   - Email should show as "Enabled"
   - Google should show as "Enabled" (if you configured it)

2. **Check URL Configuration:**
   - Site URL should be set
   - Redirect URLs should be listed

---

## Testing Authentication

Once configured, test your auth:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Test Email Auth:**
   - Visit http://localhost:3000
   - Try signing up with email
   - Check your email for confirmation (if enabled)
   - Try logging in

3. **Test Google OAuth (if configured):**
   - Click "Sign in with Google"
   - Authorize with your Google account
   - Verify you're redirected back to your app

---

## Troubleshooting

### Email Auth Issues
- **Emails not sending?** Check Supabase → Authentication → Email Templates
- **Can't sign in?** Verify email confirmation is disabled or email was confirmed

### Google OAuth Issues
- **"Redirect URI mismatch" error:**
  - Double-check the redirect URI in Google Console matches exactly:
    `https://swhinhgrtcowjmpstozh.supabase.co/auth/v1/callback`
  - No trailing slashes, no typos

- **"App not verified" warning:**
  - This is normal for development
  - Add your email as a test user in Google Console
  - For production, submit app for verification

- **"Invalid client" error:**
  - Verify Client ID and Secret are correct in Supabase
  - Check they were copied completely without extra spaces

---

## Next Steps

After authentication is configured:

1. Run the SQL setup script (`supabase-setup.sql`) in Supabase SQL Editor
2. Test creating products and market stands
3. Test image uploads

Your Supabase authentication is now configured! 🎉
