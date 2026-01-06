# Troubleshooting 500 FUNCTION_INVOCATION_FAILED Error

## Current Status
All API endpoints returning:
```
FUNCTION_INVOCATION_FAILED
```

This means the serverless functions are crashing **before** they can execute any code.

---

## Things to Check in Vercel Dashboard

### 1. Build Logs
Go to: Vercel Dashboard → Your Project → Deployments → Latest → Build Logs

**Look for:**
- ❌ TypeScript compilation errors
- ❌ Missing dependencies errors
- ❌ Build failures
- ✅ "Build Completed" message

### 2. Function Logs
Go to: Vercel Dashboard → Your Project → Deployments → Latest → Functions

**Look for:**
- Runtime errors
- Import errors
- Module not found errors
- Stack traces

### 3. Environment Variables
Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

**Verify:**
- ✅ `POSTGRES_URL` is set
- ✅ Value starts with `postgres://` or `postgresql://`
- ✅ Applied to "Production" environment

---

## Common Causes & Solutions

### Cause 1: Missing Environment Variable
**Symptom:** Functions crash immediately
**Check:** Vercel Settings → Environment Variables
**Solution:** Add `POSTGRES_URL` with your Neon database connection string

### Cause 2: TypeScript Compilation Error
**Symptom:** Build succeeds but functions fail
**Check:** Build logs for TS errors
**Solution:** Fix TypeScript errors locally first

### Cause 3: Native Dependencies (better-sqlite3)
**Symptom:** Functions fail with "Cannot find module"
**Check:** Dependencies in package.json
**Solution:** Remove `better-sqlite3` from dependencies:
```bash
pnpm remove better-sqlite3
git add package.json pnpm-lock.yaml
git commit -m "Remove better-sqlite3 (not needed for Vercel)"
git push
```

### Cause 4: @vercel/postgres Not Installed
**Symptom:** Import errors in logs
**Check:** package.json dependencies
**Solution:** Ensure `@vercel/postgres` is in dependencies (already done)

### Cause 5: Serverless Function Size Limit
**Symptom:** Functions too large
**Check:** Function size in deployment logs
**Solution:** Reduce dependencies or split functions

---

## Testing Endpoints (After Fix)

### 1. Test Simple Endpoint (No DB)
```bash
curl https://plandi1jombang.vercel.app/api/ping
```

**Expected:** JSON response with status "ok"
**If this fails:** Problem is NOT database-related

### 2. Test Health Endpoint (With DB)
```bash
curl https://plandi1jombang.vercel.app/api/health
```

**Expected:** JSON with database status and table list
**If this fails but ping works:** Database connection issue

### 3. Initialize Database
```bash
curl -X POST https://plandi1jombang.vercel.app/api/db-init
```

**Expected:** Success message with timestamp
**Run this only ONCE after deployment**

### 4. Test Students API
```bash
curl https://plandi1jombang.vercel.app/api/students
```

**Expected:** Array of student objects

### 5. Test Login
```bash
curl -X POST https://plandi1jombang.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"admin@sdnplandi1jombang.sch.id","password":"admin123"}'
```

**Expected:** User object with token

---

## Step-by-Step Debugging

### Step 1: Check Vercel Build Logs
1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments"
4. Click on the latest deployment
5. Check "Build Logs" tab

**What to look for:**
- Any red error messages
- "ERROR" or "FAILED" text
- TypeScript compilation errors
- Missing module errors

### Step 2: Check Function Logs
1. In same deployment view
2. Click "Functions" tab
3. Try calling `/api/ping`
4. Check logs for errors

### Step 3: Verify Environment
1. Go to "Settings" → "Environment Variables"
2. Verify `POSTGRES_URL` exists
3. Make sure it's enabled for "Production"
4. If missing, add it and redeploy

### Step 4: Check Function Execution
After pushing latest code:
1. Wait for deployment to complete
2. Test `/api/ping` first (simplest endpoint)
3. If ping works, test `/api/health`
4. If health works, run `/api/db-init`
5. If db-init works, test other endpoints

---

## Quick Fixes to Try

### Fix 1: Remove Problematic Dependency
```bash
cd /Users/masdevid/Projects/deny/sd-plandi
pnpm remove better-sqlite3
git add package.json pnpm-lock.yaml
git commit -m "Remove better-sqlite3 dependency"
git push origin main
```

### Fix 2: Ensure All Dev Dependencies
```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "Update dependencies"
git push origin main
```

### Fix 3: Simplify Vercel Config
The current `vercel.json` is minimal and correct. No changes needed.

---

## What We Know

✅ **Working:**
- TypeScript compiles locally
- All code syntax is correct
- Dependencies are installed
- Git repository is up to date

❌ **Not Working:**
- All serverless functions fail immediately
- No error details returned (crashes before error handler)
- Even simple ping endpoint fails (after you push it)

❌ **Most Likely Cause:**
1. Missing `POSTGRES_URL` environment variable in Vercel
2. Native dependency (`better-sqlite3`) causing crashes
3. Build configuration issue

---

## Next Steps

1. **Push the latest commit** (ping endpoint)
   ```bash
   git push origin main
   ```

2. **Wait for deployment** to complete

3. **Test ping endpoint:**
   ```bash
   curl https://plandi1jombang.vercel.app/api/ping
   ```

4. **Check Vercel logs:**
   - If ping fails → Check build logs for errors
   - If ping works → Database connection issue
   - Check function logs for specific error

5. **Share the error from Vercel logs** so we can fix the exact issue

---

## Environment Variable Format

Your `POSTGRES_URL` should look like:
```
postgres://user:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Or:
```
postgresql://user:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Make sure:**
- ✅ No spaces
- ✅ Includes `?sslmode=require`
- ✅ Correct password (no special URL encoding needed if using Vercel)
- ✅ Set in Production environment

---

## If Nothing Works

Try redeploying from scratch:
1. Go to Vercel Dashboard
2. Click your project
3. Settings → General → Delete Project
4. Re-import from Git
5. Add `POSTGRES_URL` environment variable
6. Deploy

OR

Create a new Vercel project and connect it to your Git repo.

---

**Last Updated:** 2026-01-06
**Status:** Investigating 500 errors
**Current Deployment:** Check Vercel dashboard for latest logs
