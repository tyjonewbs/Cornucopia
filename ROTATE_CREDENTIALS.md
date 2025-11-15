# How to Rotate Compromised Credentials

## 🚨 URGENT: Your database password was exposed in the code

The password `JxdbOlO57Tra5sVi` was hardcoded and needs to be changed immediately.

---

## Step 1: Reset Database Password in Supabase

### Option A: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase Database Settings:**
   
   Direct Link: https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/settings/database

2. **Find "Database Password" section:**
   - Look for "Reset database password" or "Database Password" section
   - Click "Reset database password" or "Generate new password"

3. **Generate New Password:**
   - Supabase will generate a new secure password
   - **IMPORTANT:** Copy this password immediately
   - Save it in a secure location (password manager recommended)

4. **Get New Connection Strings:**
   - After password reset, Supabase will show new connection strings
   - Copy both:
     - **Connection pooling (Transaction)** - for DATABASE_URL
     - **Direct connection** - for DIRECT_URL

### Option B: Manual Password Change

If Option A isn't available in your Supabase dashboard:

1. **Go to SQL Editor:**
   
   https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/sql

2. **Run this SQL command:**
   ```sql
   -- Replace 'NEW_SECURE_PASSWORD_HERE' with a strong password
   ALTER USER postgres WITH PASSWORD 'NEW_SECURE_PASSWORD_HERE';
   ```

3. **Update connection strings manually:**
   - Replace `JxdbOlO57Tra5sVi` with your new password in:
     - DATABASE_URL
     - DIRECT_URL

---

## Step 2: Update Your .env.local File

After getting the new connection strings:

1. **Open `.env.local` file in your project**

2. **Replace these values:**
   ```env
   # Old (COMPROMISED - DO NOT USE)
   DATABASE_URL="postgresql://postgres.swhinhgrtcowjmpstozh:JxdbOlO57Tra5sVi@..."
   DIRECT_URL="postgresql://postgres.swhinhgrtcowjmpstozh:JxdbOlO57Tra5sVi@..."

   # New (with your new password)
   DATABASE_URL="postgresql://postgres.swhinhgrtcowjmpstozh:YOUR_NEW_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.swhinhgrtcowjmpstozh:YOUR_NEW_PASSWORD@db.swhinhgrtcowjmpstozh.supabase.co:5432/postgres"
   ```

3. **Save the file**

---

## Step 3: Rotate Supabase JWT Secret

The JWT secret was also exposed. You should reset it:

1. **Go to API Settings:**
   
   https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/settings/api

2. **Find "JWT Settings" section**
   - Click "Generate new JWT secret" or similar button
   - If this option isn't available, the JWT secret is typically managed automatically

3. **Update in .env.local:**
   ```env
   SUPABASE_JWT_SECRET="your-new-jwt-secret"
   ```

**Note:** The JWT secret might regenerate automatically when you reset the database password. Check the API settings page after the password reset.

---

## Step 4: Verify New Credentials Work

Test your new credentials locally:

```bash
# 1. Test database connection
npx prisma db pull

# 2. Start your dev server
npm run dev

# 3. Try to sign in and use the app
# Visit http://localhost:3000
```

If everything works, your credentials are successfully rotated!

---

## Step 5: Update Vercel (Production)

If you're using Vercel for hosting:

1. **Go to Vercel Project Settings:**
   - Visit your project dashboard
   - Go to Settings → Environment Variables

2. **Update these variables:**
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SUPABASE_JWT_SECRET` (if changed)

3. **Redeploy:**
   - Trigger a new deployment for changes to take effect

---

## Step 6: Remove Credentials from Git History

⚠️ **IMPORTANT:** The old credentials are still in your git history!

### If you've already pushed to GitHub:

```bash
# Option 1: Use git filter-repo (recommended)
# Install: pip install git-filter-repo
git filter-repo --path lib/env.server.ts --invert-paths
git filter-repo --path lib/env.server.mjs --invert-paths

# Option 2: Use BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
bfg --delete-files env.server.ts
bfg --delete-files env.server.mjs

# After either option, force push to GitHub
git push origin --force --all
git push origin --force --tags
```

### If you haven't pushed yet:

You're safe! Just make sure to never push the old commits with the exposed credentials.

---

## Quick Reference: Where to Find What

| What | Where in Supabase Dashboard |
|------|----------------------------|
| Database Password | Settings → Database |
| Connection Strings | Settings → Database (after password reset) |
| JWT Secret | Settings → API |
| Service Role Key | Settings → API |
| Anon Key | Settings → API |

**Your Supabase Project URL:**
https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/settings/database

---

## ✅ Verification Checklist

After rotating credentials:

- [ ] New database password set in Supabase
- [ ] .env.local updated with new credentials
- [ ] Application runs locally with new credentials
- [ ] Old password no longer works
- [ ] Vercel production environment updated (if applicable)
- [ ] Git history cleaned (if credentials were pushed)
- [ ] Team members notified of credential change

---

## 📞 Need Help?

If you encounter issues:

1. Check Supabase doesn't show connection errors
2. Verify the connection strings are formatted correctly
3. Make sure there are no extra spaces or quotes in .env.local
4. Try the DIRECT_URL if pooler connection fails
5. Check Supabase status page for any outages

---

**Created:** November 14, 2025  
**Status:** URGENT - Complete these steps before pushing to GitHub
