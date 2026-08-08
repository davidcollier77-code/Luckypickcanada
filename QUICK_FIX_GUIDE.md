# QUICK FIX: Production Bugs - Immediate Action Required

## Bug #1: White Homepage (CRITICAL - User-Facing)

### Root Cause
CSS files in `/themes/default/` not loading due to Next.js import path resolution in production.

### Immediate Fix Applied
**File:** `app/layout.js`
- **Changed:** Removed CSS import statement `import '../themes/default/index.css';`
- **Added:** Direct `<link>` tag in HTML `<head>`: `<link rel="stylesheet" href="/themes/default/index.css" />`
- **Why:** Next.js App Router handles static assets in `/public` and `/themes` differently in production vs development

### What This Fixes
✅ Dark background with aurora gradients will render  
✅ Cinzel and Manrope fonts will load from Google Fonts  
✅ All theme colors (gold, emerald, aurora effects) will display  
✅ Homepage styling will match development environment  

### Verify After Deploy
```javascript
// Run in browser console on production site
getComputedStyle(document.body).backgroundColor 
// Should return: "rgb(2, 7, 12)" NOT "rgb(255, 255, 255)"
```

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
psql "postgresql://neondb_owner:npg_QlcWTjK0my3G@ep-mute-voice-at782k6z-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require" -f create-database-schema.sql
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
