# Production Deployment Checklist

## Pre-Deployment: Database Setup

### 1. Initialize Database Schema
```bash
# Connect to Neon PostgreSQL
psql "$POSTGRES_URL"

# Run schema creation script
\i create-database-schema.sql

# Verify tables were created
\dt
```

**Expected Output:**
```
 Schema |     Name      | Type  |    Owner     
--------+---------------+-------+--------------
 public | luck_shares   | table | neondb_owner
 public | lucky_stories | table | neondb_owner
```

### 2. Verify Environment Variables

Ensure these are set in your production environment:
```env
# Replace each placeholder below with your actual Neon PostgreSQL connection string.
# Find it in your Neon project dashboard under Connection Details.
# It typically looks like: postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
POSTGRES_URL=<your-neon-connection-string>
DATABASE_URL=<your-neon-connection-string>
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
ADMIN_PASSWORD=...
GIFT_FROM_EMAIL=...
```

## Build & Deploy

### 1. Clear Build Cache
```bash
rm -rf .next
rm -rf .open-next
npm run build
```

### 2. Verify Theme CSS in Build Output

The active theme source lives under `themes/default/` and is imported by the application. Next.js emits the compiled CSS into `.next/static/css/`; the retired `public/themes/default/` mirror is not part of the active stylesheet pipeline.

```bash
# Inspect the generated Next.js CSS bundles
ls -la .next/static/css/
```

### 3. Test Production Build Locally
```bash
npm run start
# Open http://localhost:3000
# Verify homepage has dark background and gold colors
# Verify fonts are "Cinzel" and "Manrope"
```

## Post-Deployment Verification

### 1. CSS Loading Test

Open production site and check browser console:
```javascript
// Should return dark color, not white
console.log(getComputedStyle(document.body).backgroundColor);

// Should include 'Manrope'
console.log(getComputedStyle(document.body).fontFamily);

// Check that Next.js-generated CSS bundles are linked
console.log([...document.styleSheets].map(s => s.href).filter(h => h?.includes('/_next/static/css/')));
```

### 2. Database Connection Test

**Lucky Stories Test:**
1. Navigate to `/stories`
2. Verify the page loads without "database needs to be available" message
3. Check browser Network tab - `/api/lucky-stories` should return `200 OK`

**Lucky Map Test:**
1. Navigate to `/map`
2. Verify the map loads without fallback error message
3. Check browser Network tab - `/api/luck-map` should return `200 OK`

### 3. Full Feature Test

1. **Homepage:** Dark background with aurora gradients visible
2. **Navigation:** Header with gold logo and links styled properly
3. **Lucky Card:** Card reveal animation works with proper styling
4. **Lucky Stories:** Form submits successfully, stores in database
5. **Lucky Map:** Map displays with province data
6. **Checkout:** Stripe integration works for $1 Lucky Pick

## Rollback Procedure

If issues occur after deployment:

1. **CSS Issue:**
   - Confirm the active imports in `app/layout.js` and the affected route still point to files under `themes/default/`.
   - Verify the generated `/_next/static/css/` responses return successfully.
   - Check the affected elements' computed styles and the deployment's asset responses.

2. **Database Issue:**
   - Verify `POSTGRES_URL` environment variable is set
   - Check Neon dashboard - database may be paused
   - Review application logs for connection errors

## Common Production Issues & Fixes

### Issue: White Homepage
**Symptoms:** Homepage renders with white background and default fonts
**Fix:**
- Verify the active imports in `app/layout.js` and the affected route still point to files under `themes/default/`.
- Check that the production HTML references generated `/_next/static/css/` bundles and that those requests succeed.
- Inspect computed styles and identify any overriding CSS rule.
- Do not restore the retired `public/themes/default/` copy or add a direct stylesheet link to it.

### Issue: "Database needs to be available" error
**Symptoms:** Lucky Map shows fallback message
**Fix:**
- Run `create-database-schema.sql` in Neon SQL Editor
- Verify `POSTGRES_URL` is correctly set
- Check database isn't paused (Neon auto-pauses after 5 minutes inactivity)

### Issue: Lucky Stories not saving
**Symptoms:** Form submits but stories don't appear
**Fix:**
- Verify `lucky_stories` table exists
- Check `approved` column defaults to `true`
- Review application logs for database errors

## Success Criteria

✅ Homepage displays dark background with aurora gradients  
✅ Typography uses Cinzel (headings) and Manrope (body)  
✅ Lucky Stories form accepts submissions  
✅ Lucky Map displays without error message  
✅ Database stores data correctly  
✅ All API endpoints return proper status codes  
✅ Stripe checkout process completes successfully  

## Support Contacts

- **Database Issues:** Neon Support (https://neon.tech/docs)
- **Deployment Issues:** Vercel/AWS Support
- **Application Issues:** Review GitHub repository logs
