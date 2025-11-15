# Security Guidelines for Cornucopia

## 🚨 CRITICAL SECURITY ISSUES FIXED

This document was created after identifying and fixing critical security vulnerabilities in the codebase.

### Issues Found and Resolved

1. **Hardcoded Database Credentials** ✅ FIXED
   - Location: `lib/env.server.ts` and `lib/env.server.mjs`
   - Issue: Production database URLs with passwords were hardcoded
   - Fix: Removed all hardcoded credentials, now uses environment variables only

2. **Exposed Codebase** ✅ FIXED
   - Location: `repomix-output.xml`
   - Issue: Entire codebase including sensitive code was in a single XML file
   - Fix: Added to .gitignore to prevent future commits

3. **Unprotected SQL Files** ⚠️ PARTIALLY PROTECTED
   - Location: Root directory *.sql files
   - Issue: Migration and setup SQL files were not in .gitignore
   - Fix: Added *.sql to .gitignore (except approved migration files)

---

## 📋 Security Checklist

### Before Every Commit

- [ ] No hardcoded API keys or secrets in code
- [ ] No database credentials in files
- [ ] Environment variables use process.env
- [ ] .env and .env.local are in .gitignore
- [ ] No sensitive data in commit messages
- [ ] repomix-output.xml not being committed

### Environment Variables

**✅ DO:**
- Store all secrets in .env.local (gitignored)
- Use process.env to access secrets
- Provide .env.example with placeholder values
- Rotate credentials if accidentally exposed

**❌ DON'T:**
- Hardcode credentials in source files
- Commit .env or .env.local files
- Share credentials in Slack/Discord
- Use production credentials in development

### Protected Files (.gitignore)

The following files are automatically excluded from git:
```
.env
.env*.local
.env.production
repomix-output.xml
*.sql (except migrations)
ClineContext.txt
/docs (documentation folder)
```

---

## 🔑 Secret Management

### Required Secrets

1. **Database Credentials**
   - `DATABASE_URL` - PostgreSQL connection with password
   - `DIRECT_URL` - Direct database connection
   - **Storage:** .env.local only
   - **Rotation:** Every 90 days recommended

2. **Supabase Keys**
   - `NEXT_PUBLIC_SUPABASE_URL` - Public, but project-specific
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public, but should be rotated if compromised
   - `SUPABASE_SERVICE_ROLE_KEY` - **CRITICAL** Never expose
   - `SUPABASE_JWT_SECRET` - **CRITICAL** Never expose
   - **Storage:** .env.local only
   - **Rotation:** Immediately if compromised

3. **Payment Keys (Stripe)**
   - `STRIPE_SECRET_KEY` - **CRITICAL** Never expose
   - `STRIPE_SECRET_WEBHOOK` - **CRITICAL** Never expose
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Public, but project-specific
   - **Storage:** .env.local only
   - **Rotation:** Immediately if compromised

4. **Third-Party APIs**
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Has usage quotas
   - `RESEND_API_KEY` - Controls email sending
   - `UPSTASH_REDIS_REST_TOKEN` - Controls cache access
   - **Storage:** .env.local only

### Accidental Exposure Response Plan

If credentials are accidentally committed to GitHub:

1. **IMMEDIATE ACTIONS:**
   ```bash
   # Do NOT just delete the file - it's still in git history!
   
   # 1. Rotate ALL compromised credentials immediately
   # 2. Remove from git history using one of these methods:
   
   # Option A: Using git filter-repo (recommended)
   git filter-repo --path lib/env.server.ts --invert-paths
   
   # Option B: Using BFG Repo-Cleaner
   bfg --delete-files env.server.ts
   
   # 3. Force push (⚠️ coordinate with team first)
   git push origin --force --all
   ```

2. **CREDENTIAL ROTATION:**
   - Supabase: Generate new JWT secret, anon key
   - Database: Change password in Supabase dashboard
   - Stripe: Deactivate old keys, create new ones
   - Update .env.local with new credentials

3. **VERIFICATION:**
   - Scan git history: `git log -p -- lib/env.server.ts`
   - Check GitHub commits don't contain secrets
   - Verify old credentials no longer work
   - Test app with new credentials

---

## 🛡️ Security Best Practices

### Code Security

1. **Input Validation**
   - Always validate user input with Zod schemas
   - Sanitize HTML content to prevent XSS
   - Use parameterized queries (Prisma does this)
   - Validate file uploads (type, size, content)

2. **Authentication & Authorization**
   - Use Supabase RLS policies
   - Verify user ownership before modifications
   - Check user roles for admin actions
   - Implement rate limiting on auth endpoints

3. **API Security**
   - Validate all API inputs
   - Use proper HTTP methods (GET for reads, POST for writes)
   - Implement CSRF protection
   - Rate limit API endpoints (using @upstash/ratelimit)

4. **Data Protection**
   - Never log sensitive data
   - Mask passwords and keys in logs
   - Use HTTPS in production
   - Encrypt sensitive data at rest if needed

### Deployment Security

1. **Environment Variables**
   - Set all secrets in Vercel dashboard (never in vercel.json)
   - Use different credentials for prod/dev/staging
   - Enable Vercel's environment variable encryption

2. **Database Security**
   - Use connection pooling (PgBouncer)
   - Enable SSL for database connections
   - Regularly backup database
   - Monitor for unusual query patterns

3. **Third-Party Services**
   - Restrict API keys to specific domains
   - Enable webhook signature verification
   - Monitor usage and set alerts
   - Use least-privilege access

---

## 🔍 Security Audit Checklist

Run this audit before every major release:

### Code Review
- [ ] No hardcoded secrets in codebase
- [ ] All API endpoints have authentication
- [ ] Input validation on all forms
- [ ] File uploads are properly validated
- [ ] SQL injection not possible (using Prisma)
- [ ] XSS prevention in place

### Configuration
- [ ] .env and .env.local in .gitignore
- [ ] .env.example is up to date
- [ ] All environment variables documented
- [ ] Production uses different credentials than dev
- [ ] HTTPS enabled in production
- [ ] Security headers configured (CSP, etc.)

### Dependencies
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Dependencies are up to date
- [ ] No known security issues in packages
- [ ] Unused dependencies removed

### Access Control
- [ ] Admin routes properly protected
- [ ] User roles enforced
- [ ] API endpoints check authorization
- [ ] File access properly restricted

---

## 🚀 Secure Deployment Process

### Pre-Deployment
```bash
# 1. Audit dependencies
npm audit

# 2. Check for hardcoded secrets
git grep -E "(sk_live_|sk_test_|pk_live_|password|secret_key)" --cached

# 3. Verify .gitignore is working
git status --ignored

# 4. Run tests
npm test
```

### During Deployment
1. Set environment variables in Vercel dashboard
2. Enable Vercel's security features
3. Configure custom domain with HTTPS
4. Set up monitoring and alerts

### Post-Deployment
1. Verify HTTPS is working
2. Test authentication flows
3. Check error logging
4. Monitor for unusual activity

---

## 📞 Incident Response

If a security incident occurs:

1. **Assess Impact**
   - What data was exposed?
   - How many users affected?
   - Was the breach contained?

2. **Immediate Response**
   - Rotate all potentially compromised credentials
   - Deploy fixes immediately
   - Monitor for abuse
   - Preserve logs for investigation

3. **Communication**
   - Notify affected users if required
   - Document the incident
   - Update security procedures
   - Conduct post-mortem

4. **Prevention**
   - Implement additional safeguards
   - Update this security guide
   - Train team on lessons learned
   - Schedule regular security audits

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/security)

---

## ✅ Security Compliance

This project implements:
- ✅ Encrypted connections (HTTPS, SSL)
- ✅ Secure authentication (Supabase Auth)
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS prevention (React auto-escaping)
- ✅ CSRF protection (SameSite cookies)
- ✅ Rate limiting (Upstash)
- ✅ Secure file uploads (Supabase Storage with RLS)

---

**Last Updated:** November 14, 2025  
**Next Review:** Before each major release
