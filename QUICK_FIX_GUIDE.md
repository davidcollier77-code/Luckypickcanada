# QUICK FIX: Production Bugs - Immediate Action Required

## Bug #1: White Homepage (CSS Loading)

### Current CSS delivery

The old troubleshooting instructions for copying theme CSS into `public/themes/default/` and linking `/themes/default/index.css` are obsolete. The active application imports its styles from `themes/default/`, and Next.js compiles them into generated `/_next/static/css/` bundles.

Current imports:

- `app/layout.js`: `../themes/default/index.css`
- `app/homepage/HomePage.js`: `../../themes/default/homepage.css`
- `app/homepage/Hero.js`: `../../themes/default/hero.css`
- `app/map/page.js`, `app/crystal-ball/page.js`, and `app/crystal-ball/preview/page.js`: active `homepage.css`
- `app/lucky-map-of-canada/lucky-map-of-canada.js`: active `map.css`

### Verification

Inspect the production HTML and Network panel. The page should load generated `/_next/static/css/[hash].css` files successfully. Check the affected element's computed styles and confirm its active source CSS import still exists.

Do not recreate `public/themes/default/` or add a direct link to `/themes/default/index.css`. Those files are a retired duplicate, not the application stylesheet source.

---

---

## Bug #2: Lucky Map Database Error (CRITICAL - Feature Broken)

### Root Cause
PostgreSQL tables `lucky_stories` and `luck_shares` don't exist in Neon database.

### Immediate Fix Required

**Step 1: Run SQL Schema (2 minutes)**
```bash
# Option A: Neon SQL Editor (Recommended)
1. Go to: https://console.neon.tech
2. Open SQL Editor for project: summer-silence-20834502
3. Copy entire contents of create-database-schema.sql
4. Click "Run"

# Option B: psql Command Line
psql "$DATABASE_URL" -f create-database-schema.sql
```

**Step 2: Verify Tables Created**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lucky_stories', 'luck_shares');
```

**Expected Result:**
```
  table_name   
---------------
 luck_shares
 lucky_stories
```

### Files Updated
1. **`app/lucky-stories-db.js`** - Added null check for database connection
2. **`create-database-schema.sql`** - Complete schema with indexes
3. **`DATABASE_SETUP.md`** - Detailed setup instructions

### What This Fixes
✅ Lucky Map will display province data instead of error message  
✅ Community stories will save to database successfully  
✅ `/api/lucky-stories` endpoint will return status 200  
✅ `/api/luck-map` endpoint will return status 200  

### Verify After Schema Creation
```bash
# Test lucky stories endpoint
curl https://luckypickcanada.ca/api/lucky-stories

# Should return JSON with:
# {"stories":[],"provinceCounts":{},"totalStories":0,"provincesWithStories":0,"isConfigured":true}
# Key check: "isConfigured": true
```

---

## Summary of All Changes

| File | Change | Purpose |
|------|--------|---------|
| `app/layout.js` | CSS link method | Fix white homepage |
| `app/lucky-stories-db.js` | Database null check | Graceful error handling |
| `create-database-schema.sql` | New file | Database schema |
| `DATABASE_SETUP.md` | New file | Setup instructions |
| `CSS_FIX_GUIDE.md` | New file | CSS troubleshooting |
| `DEPLOYMENT_CHECKLIST.md` | New file | Deployment guide |

## Deploy Order

1. **First:** Run database schema in Neon (Bug #2)
2. **Second:** Deploy code changes (Bug #1)
3. **Third:** Clear CDN/CloudFront cache if applicable
4. **Fourth:** Verify both fixes using the test commands above

## Estimated Time to Fix

- Database schema: **2 minutes**
- Code deployment: **5-10 minutes** (depending on your CI/CD pipeline)
- Total: **~15 minutes** to resolve both production bugs
