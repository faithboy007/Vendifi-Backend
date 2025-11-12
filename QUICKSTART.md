# 🚀 VENDIFI Backend - Quick Start Guide

This guide will help you verify that all fixes are working correctly.

## ✅ All Issues Fixed

All detected issues have been resolved:
- ✅ Dependencies installed (243 packages)
- ✅ Duplicate operator ID logic removed
- ✅ Proper error handling added
- ✅ Firebase authentication secured
- ✅ Environment validation implemented
- ✅ Comprehensive startup diagnostics added
- ✅ Full documentation created

## 🔄 Quick Verification Steps

### 1. Verify Dependencies
```bash
# Check that node_modules exists
dir node_modules
```
**Expected**: Directory exists with packages

### 2. Check Environment Configuration
```bash
# View your .env file (make sure it has real credentials)
type .env
```
**Expected**: Should show all 6 environment variables configured

### 3. Start the Server
```bash
# Use npm start (or cmd /c npm start if PowerShell gives errors)
npm start
```

**Expected Output:**
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

  To fix this:
  1. Make sure your server is running
  2. Visit: http://localhost:3000/api/sync-operator-ids
  3. Copy the matchedIds from the response
  4. POST to: http://localhost:3000/api/update-operator-ids
     with body: { "matchedIds": <copied_data> }

--- Available Endpoints ---
  GET  http://localhost:3000/api/get-data-plans
  GET  http://localhost:3000/api/sync-operator-ids
  POST http://localhost:3000/api/update-operator-ids
  POST http://localhost:3000/api/process-transaction
  POST http://localhost:3000/api/login
  POST http://localhost:3000/api/check-status

========================================
Server ready to accept requests!
========================================
```

### 4. Test Product Catalog Endpoint

Open a **new terminal** (keep the server running) and run:

```bash
# Test the product catalog endpoint
curl http://localhost:3000/api/get-data-plans
```

**Expected**: JSON response with all products (airtime, data, cableTV, electricity)

### 5. Sync Operator IDs (IMPORTANT!)

```bash
# Fetch real operator IDs from Reloadly
curl http://localhost:3000/api/sync-operator-ids
```

**Expected**: JSON response with:
- `matchedIds`: Automatically matched operator IDs
- `availableOperators`: All available operators from Reloadly
- `availableCableTVBillers`: Cable TV providers
- `availableElectricityBillers`: Electricity DISCOs
- `instructions`: What to do next

**Save the `matchedIds` object** from this response!

### 6. Update Operator IDs

Create a file called `update-ids.json` with:
```json
{
  "matchedIds": <paste the matchedIds object from step 5>
}
```

Then run:
```bash
# Update the product catalog
curl -X POST http://localhost:3000/api/update-operator-ids -H "Content-Type: application/json" -d @update-ids.json
```

**Expected**: Success message with updated count

### 7. Restart and Verify

Stop the server (Ctrl+C) and start again:
```bash
npm start
```

**Expected**: Product Configuration Check should now show:
```
✓ All products are configured with operator IDs
```

## 🧪 Testing Individual Features

### Test Authentication (After Frontend Update)
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your-firebase-id-token"}'
```

### Test Transaction Processing (With Valid Payment)
```bash
curl -X POST http://localhost:3000/api/process-transaction \
  -H "Content-Type: application/json" \
  -d '{"reference": "your-flutterwave-reference"}'
```

### Test Status Check
```bash
curl -X POST http://localhost:3000/api/check-status \
  -H "Content-Type: application/json" \
  -d '{"reference": "your-flutterwave-reference"}'
```

## 🐛 Common Issues & Quick Fixes

### Issue: "npm: cannot be loaded because running scripts is disabled"
**Fix**: Use `cmd /c` prefix:
```bash
cmd /c npm start
cmd /c npm install
```

### Issue: Server shows missing environment variables
**Fix**: 
1. Copy `.env.example` to `.env`
2. Edit `.env` and fill in your real API credentials
3. Restart the server

### Issue: Reloadly authentication failed
**Possible causes**:
- Wrong credentials in `.env`
- Using sandbox vs production credentials mismatch
- Network issues

**Fix**:
1. Double-check credentials in Reloadly dashboard
2. Ensure you're using the correct environment (sandbox/production)
3. Check your internet connection

### Issue: Products still show as unconfigured after sync
**Possible causes**:
- Reloadly doesn't have exact matches for your products
- Product names don't match Reloadly's naming

**Fix**:
1. Check the `availableOperators` in sync response
2. Manually map operator IDs if needed
3. Update `PRODUCT_CATALOG` in `server.js` directly

## 📁 Project Files

```
VENDIFI BACKEND/
├── node_modules/          ✅ Installed (243 packages)
├── .env                   ⚠️  Configure with real credentials
├── .env.example           ✅ Template provided
├── .gitignore            ✅ Configured
├── CHANGELOG.md          ✅ All changes documented
├── package-lock.json     ✅ Generated
├── package.json          ✅ Dependencies defined
├── QUICKSTART.md         ✅ This file
├── README.md             ✅ Full documentation
└── server.js             ✅ Fixed and improved
```

## 🎯 Next Actions

1. **Configure `.env`** - Add your real API credentials
2. **Start server** - Run `npm start`
3. **Sync operator IDs** - Call `/api/sync-operator-ids`
4. **Update catalog** - Call `/api/update-operator-ids`
5. **Update frontend** - Change authentication to use Firebase SDK
6. **Test transactions** - Process test payments

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Change Log**: See `CHANGELOG.md`
- **Environment Template**: See `.env.example`

## ✅ Verification Checklist

- [ ] Dependencies installed successfully
- [ ] Server starts without errors
- [ ] Environment variables validated
- [ ] Product catalog accessible via API
- [ ] Operator IDs synced from Reloadly
- [ ] Product catalog updated with real IDs
- [ ] Server shows all products configured
- [ ] Frontend updated to use new auth flow

---

**Need Help?**
- Check `README.md` for detailed documentation
- Check `CHANGELOG.md` for all fixes and changes
- Open an issue on GitHub

**Last Updated**: 2025-01-12
