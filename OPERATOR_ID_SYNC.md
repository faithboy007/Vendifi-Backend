# 🔄 Automatic Operator ID Sync

## ✅ It's Now Fully Automatic!

Your operator IDs will **automatically sync** when you start the server. No manual configuration needed!

## 🚀 How It Works:

### When You Start the Server:
```bash
cmd /c npm start
```

**The server will:**

1. ✅ Check environment variables
2. ✅ Connect to Reloadly API
3. ✅ **Automatically fetch and match operator IDs**
4. ✅ Configure all products
5. ✅ Start accepting requests

### What You'll See:

```
========================================
   VENDIFI BACKEND API SERVER
========================================
✓ Server is running on http://localhost:3000
✓ Node version: v22.19.0
✓ Environment: development

--- Environment Variables Check ---
✓ All required environment variables are configured
  ✓ FLUTTERWAVE_SECRET_KEY
  ✓ RELOADLY_CLIENT_ID
  ✓ RELOADLY_CLIENT_SECRET
  ✓ FIREBASE_PROJECT_ID
  ✓ FIREBASE_PRIVATE_KEY
  ✓ FIREBASE_CLIENT_EMAIL

--- Reloadly Authentication ---
✓ Reloadly authentication successful

--- Product Configuration Check ---
⚠ WARNING: Some products have placeholder operator IDs:
  ✗ airtime: 4/4 products need configuration
  ✗ data: 30/30 products need configuration
  ✗ cableTV: 16/16 products need configuration
  ✗ electricity: 22/22 products need configuration

  🔄 Attempting automatic operator ID sync...
  ✓ Auto-configured MTN Airtime: 341
  ✓ Auto-configured GLO Airtime: 342
  ✓ Auto-configured AIRTEL Airtime: 343
  ✓ Auto-configured 9MOBILE Airtime: 344

  ✅ Automatically configured 72 operator IDs!
  💾 Note: These are in-memory only. For persistence, update server.js or use a database.

--- Available Endpoints ---
...
========================================
```

## 💾 Making It Persistent (Optional):

The auto-synced IDs are stored in memory. To save them permanently:

### Option 1: Save to JSON File
After server starts successfully, run:
```bash
cmd /c npm run save-ids
```

This creates `operator-ids.json` with all synced IDs.

### Option 2: Use a Database
For production, consider storing in your database:
- MongoDB
- PostgreSQL
- MySQL
- Firebase Firestore (already configured!)

## 📊 What Gets Auto-Synced:

### ✅ Airtime (4 networks)
- MTN
- GLO
- Airtel
- 9mobile

### ✅ Data Plans (30+ plans)
- All major networks
- Multiple data bundles per network

### ✅ Cable TV (16+ packages)
- DStv
- GOtv
- StarTimes

### ✅ Electricity (22+ DISCOs)
- AEDC, EKEDC, IKEDC
- IBEDC, EEDC, PHED
- JED, KAEDCO, KEDCO
- BEDC, YEDC
- Both prepaid and postpaid

## 🔍 How Matching Works:

The system uses **fuzzy matching** to find the right operator IDs:

```javascript
// Example: Matching "MTN Nigeria" with "MTN"
matchOperatorName("MTN Nigeria", "MTN") // ✓ Match!

// Example: Matching "Multichoice DSTV" with "DStv"
matchOperatorName("Multichoice DSTV", "DStv") // ✓ Match!
```

**Built-in variations:**
- MTN ↔ Mobile Telecommunications Network
- GLO ↔ Globacom
- 9mobile ↔ Etisalat
- DStv ↔ D-STV ↔ Multichoice
- And many more...

## ⚠️ What If Auto-Sync Fails?

If automatic sync fails, you'll see:

```
✗ Automatic sync failed: Could not authenticate with Reloadly.
  You can still manually sync by visiting:
  http://localhost:3000/api/sync-operator-ids
```

**Common reasons:**
1. Missing Reloadly credentials in `.env`
2. Wrong credentials (sandbox vs production)
3. Network connectivity issues
4. Reloadly API downtime

**Solution:**
1. Check your `.env` file
2. Verify Reloadly credentials
3. Restart the server: `cmd /c npm start`

## 🛠️ Manual Sync (Backup Option):

If you prefer manual control:

### Step 1: Get Matched IDs
```bash
curl http://localhost:3000/api/sync-operator-ids
```

### Step 2: Review and Update
```bash
curl -X POST http://localhost:3000/api/update-operator-ids \
  -H "Content-Type: application/json" \
  -d '{"matchedIds": {...}}'
```

## 📝 Verification:

Check if sync was successful:

```bash
curl http://localhost:3000/api/get-data-plans
```

Look for `operatorId` values:
- ✅ Good: `"operatorId": 341` (real ID)
- ❌ Bad: `"operatorId": 340` (placeholder)

## 🎯 Best Practices:

### 1. Development Environment
```env
# Use Reloadly SANDBOX credentials
RELOADLY_CLIENT_ID=sandbox-client-id
RELOADLY_CLIENT_SECRET=sandbox-secret
```
- Test without spending real money
- Operator IDs may differ from production

### 2. Production Environment
```env
# Use Reloadly LIVE credentials
RELOADLY_CLIENT_ID=live-client-id
RELOADLY_CLIENT_SECRET=live-secret
```
- Run auto-sync once
- Save IDs using `npm run save-ids`
- Commit `operator-ids.json` to your private repo (not public!)

### 3. Regular Updates
- Reloadly may add new operators
- Run auto-sync monthly or when adding new products
- Check Reloadly dashboard for new services

## 🔄 Update Frequency:

| Environment | Sync Frequency |
|-------------|----------------|
| Development | Every server restart (automatic) |
| Staging | Weekly or on-demand |
| Production | Monthly or when issues occur |

## 📊 Monitoring:

The server logs show exactly what was synced:

```
✓ Auto-configured MTN Airtime: 341
✓ Auto-configured GLO Airtime: 342
...

✅ Automatically configured 72 operator IDs!
```

**Review these logs to:**
- Confirm all products were matched
- Identify any missing configurations
- Verify operator IDs are correct

## 🐛 Troubleshooting:

### Issue: "Could not auto-match operator IDs"

**Cause:** Reloadly operator names don't match your product names

**Solution:**
1. Visit `/api/sync-operator-ids` in browser
2. Check `availableOperators` in response
3. Update `matchOperatorName()` function in `server.js` with new variations

### Issue: "Automatic sync failed: 401 Unauthorized"

**Cause:** Invalid Reloadly credentials

**Solution:**
1. Check `.env` file
2. Verify credentials at reloadly.com
3. Ensure using correct environment (sandbox vs live)

### Issue: Operator IDs reset after server restart

**Cause:** In-memory storage (by design)

**Solution:**
1. Run `npm run save-ids` after successful sync
2. Or implement database storage
3. Or update operator IDs directly in `server.js`

## 💡 Pro Tips:

1. **First time setup:**
   - Start server
   - Wait for auto-sync
   - Run `npm run save-ids`
   - Keep `operator-ids.json` for reference

2. **Adding new products:**
   - Add to `PRODUCT_CATALOG` in `server.js`
   - Restart server
   - Auto-sync will fetch new operator IDs

3. **Different environments:**
   - Sandbox IDs ≠ Production IDs
   - Sync separately for each environment
   - Keep track with comments in code

## 🎓 Summary:

**You don't need to do anything manually!**

1. ✅ Configure `.env` with Reloadly credentials
2. ✅ Start server: `cmd /c npm start`
3. ✅ Operator IDs sync automatically
4. ✅ Your API is ready to use!

---

**Questions about operator ID sync?** Check the server logs or visit `/api/sync-operator-ids` for detailed information.
