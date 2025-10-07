# Supabase Migration Checklist

Use this checklist to complete your Supabase migration. Check off each item as you complete it.

## ✅ Completed (Automated)

- [x] Created new Supabase project (swhinhgrtcowjmpstozh)
- [x] Updated `.env.local` with new Supabase credentials
- [x] Updated `.env` with database URLs for Prisma
- [x] Generated Prisma client
- [x] Updated `upload.ts` to use correct bucket names
- [x] Created SQL setup script (`supabase-setup.sql`)
- [x] Created setup guide (`SUPABASE_SETUP_GUIDE.md`)

## 🔲 Manual Steps Required

### 1. Wait for Database Migration to Complete
- [ ] Check terminal - the `npx prisma migrate deploy` command should complete
- [ ] Verify no errors in the migration output
- [ ] If migration fails, check troubleshooting section below

### 2. Run SQL Setup in Supabase Dashboard

**URL:** https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/sql

- [ ] Navigate to SQL Editor in Supabase dashboard (link above)
- [ ] Open `supabase-setup.sql` from your project
- [ ] Copy all SQL content
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" to execute
- [ ] Verify success message (should see "Success. No rows returned")

This creates:
- UUID extension
- 4 storage buckets
- All RLS policies for storage

### 3. Configure Email Authentication

**URL:** https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/auth/providers

- [ ] Go to Authentication → Providers
- [ ] Find "Email" provider
- [ ] Verify it's enabled (should be by default)
- [ ] Optional: Configure email templates or confirmation settings

### 4. Configure Google OAuth

**Part A: Get Google Credentials**
- [ ] Go to https://console.cloud.google.com/
- [ ] Create new project or select existing
- [ ] Navigate to "APIs & Services" → "Credentials"
- [ ] Click "Create Credentials" → "OAuth 2.0 Client ID"
- [ ] Choose "Web application"
- [ ] Add redirect URIs:
  - `https://swhinhgrtcowjmpstozh.supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback`
- [ ] Save and copy Client ID and Client Secret

**Part B: Configure in Supabase**

**URL:** https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/auth/providers

- [ ] Go to Authentication → Providers
- [ ] Find "Google" provider
- [ ] Enable the provider
- [ ] Paste Client ID
- [ ] Paste Client Secret
- [ ] Save changes

### 5. Configure Auth URL Settings

**URL:** https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/auth/url-configuration

- [ ] Set Site URL: `http://localhost:3000`
- [ ] Add Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/dashboard`
  - `http://localhost:3000/*` (wildcard for all routes)
- [ ] Save changes
- [ ] Note: Update these with production URLs when deploying

### 6. Verify Storage Buckets Created

**URL:** https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh/storage/buckets

- [ ] Navigate to Storage → Buckets
- [ ] Verify these buckets exist:
  - `product-images`
  - `market-stand-images`
  - `profile-images`
  - `local-images`
- [ ] All should be marked as "Public"

### 7. Test the Setup

**Start Development Server:**
```bash
npm run dev
```

**Test Authentication:**
- [ ] Visit http://localhost:3000
- [ ] Try signing up with email
- [ ] Try logging in with Google OAuth
- [ ] Verify successful login and redirect

**Test Database:**
- [ ] Log in to your app
- [ ] Try creating a market stand or product
- [ ] Verify data appears in Supabase database
- [ ] Check Supabase → Table Editor to see the data

**Test Image Upload:**
- [ ] Try uploading an image (product or profile)
- [ ] Verify upload succeeds
- [ ] Check Supabase → Storage to see the uploaded file
- [ ] Verify image displays correctly in your app

## 🔍 Verification

Once all steps are complete, verify:

- [ ] Users can sign up/login with email
- [ ] Users can sign up/login with Google
- [ ] Products/market stands can be created
- [ ] Images can be uploaded
- [ ] Images display correctly
- [ ] Database tables are populated correctly

## 🚨 Troubleshooting

### Migration Fails
If `npx prisma migrate deploy` fails:

1. **Check connection:**
   ```bash
   npx prisma db pull
   ```
   If this works, your connection is fine.

2. **Try direct URL instead of pooler:**
   - Temporarily change `DATABASE_URL` in `.env` to use `DIRECT_URL`
   - Run migration again
   - Change back after migration completes

3. **Verify credentials:**
   - Double-check password in `.env`
   - Ensure DATABASE_URL is formatted correctly

### Auth Not Working
- Verify all redirect URLs are correct (no typos)
- Check that Site URL matches your app URL
- For Google OAuth, ensure redirect URI in Google Console matches Supabase exactly
- Clear browser cookies and try again

### Images Not Uploading
- Verify storage buckets exist in Supabase dashboard
- Check that RLS policies were created (run supabase-setup.sql again if needed)
- Verify file size is under bucket limits (default 5MB)
- Check browser console for specific error messages

### Database Connection Issues
- Verify password is correct
- Try using DIRECT_URL instead of transaction pooler
- Check if IP is whitelisted (Supabase allows all by default)
- Verify project isn't paused in Supabase dashboard

## 📝 Notes

- **Environment Variables:** Keep `.env` and `.env.local` in sync for Supabase credentials
- **Production:** Remember to update redirect URLs and Site URL when deploying
- **Storage:** Images are organized by user ID (`bucket-name/user-id/filename`)
- **RLS:** Storage policies ensure users can only delete their own images but everyone can view

## ✅ Migration Complete!

Once all checklist items are complete, your Supabase migration is done! Your app should be fully functional with:
- Working authentication (email + Google)
- Database connected and migrated
- Image uploads to Supabase Storage
- All features operational

For ongoing management, bookmark your Supabase dashboard:
https://supabase.com/dashboard/project/swhinhgrtcowjmpstozh
