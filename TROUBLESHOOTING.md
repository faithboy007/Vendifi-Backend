# Troubleshooting Guide: Airtime Not Being Delivered

## Problem
✅ Customers make payments successfully via Flutterwave  
❌ Airtime is NOT delivered to their phones

---

## Root Cause Analysis

### Issue #1: Backend Server Not Running (MOST COMMON) ⚠️

**Symptoms:**
- Payment goes through
- Frontend shows "Network Error" or "Could not connect to server"
- No airtime delivered

**Solution:**
```bash
# 1. Open PowerShell/Terminal
cd "C:\Users\DELL\Documents\VENDIFI BACKEND"

# 2. Start the backend server
node server.js

# 3. You should see:
# ========================================
#    VENDIFI BACKEND API SERVER
# ========================================
# ✓ Server is running on http://localhost:3000

# 4. Keep this window OPEN while testing!
```

### Issue #2: Wrong Backend URL in Frontend

**Symptoms:**
- Payment succeeds
- Frontend shows "Network Error"
- Backend is running but not receiving requests

**Solution:**
✅ **FIXED!** Changed `BACKEND_URL` from Render.com to `http://localhost:3000`

For local testing, use:
```javascript
const BACKEND_URL = "http://localhost:3000";
```

For live deployment, use:
```javascript
const BACKEND_URL = "https://vendifi-backend-3.onrender.com";
```

### Issue #3: Empty Reloadly Wallet 💰

**Symptoms:**
- Payment verified successfully
- Backend logs show "Reloadly API call made"
- Backend logs show error: "Insufficient funds"

**Solution:**
1. Go to https://www.reloadly.com/dashboard
2. Click "Wallet" → "Add Funds"
3. Add at least $50 (₦40,000)
4. Wait 5-10 minutes for funds to reflect

### Issue #4: CORS Error (Cross-Origin Request Blocked)

**Symptoms:**
- Browser console shows: "CORS policy blocked"
- Backend is running
- Frontend can't reach backend

**Solution:**
Backend already has CORS enabled (Line 49 in server.js):
```javascript
app.use(cors()); // Enable Cross-Origin Resource Sharing
```

If still having issues, update to:
```javascript
app.use(cors({
    origin: '*', // Allow all origins (for testing)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Issue #5: Flutterwave Callback Not Triggering

**Symptoms:**
- Payment succeeds
- Modal never shows "Processing..."
- No backend request made

**Solution:**
Already handled in `script.js` (Line 320-332):
```javascript
callback: function(response) {
    if (response.status === "successful" || response.status === "completed") {
        verifyPaymentAndDeliver(response.tx_ref);
    }
}
```

### Issue #6: Wrong Operator ID

**Symptoms:**
- Backend logs: "Configuration Error: Operator ID not configured"
- Payment verified but no airtime sent

**Solution:**
✅ **FIXED!** Updated operator IDs:
- Airtel: 342 ✅
- 9Mobile: 340 ✅
- MTN: Not available (removed)
- GLO: Not available (removed)

---

## Complete Testing Procedure

### Step 1: Start Backend Server
```bash
cd "C:\Users\DELL\Documents\VENDIFI BACKEND"
node server.js
```

**Expected Output:**
```
========================================
   VENDIFI BACKEND API SERVER
========================================
✓ Server is running on http://localhost:3000
✓ Reloadly authentication successful
✓ All products are configured with operator IDs
```

### Step 2: Open Frontend
1. Open `index.html` in your browser
2. Or use Live Server extension in VS Code

### Step 3: Test Airtime Purchase
1. Select "Airtime" tab
2. Choose "Airtel" or "9Mobile" (MTN/GLO not available yet)
3. Enter phone number: e.g., 08012345678
4. Enter amount: e.g., 100 (minimum ₦50)
5. Enter email
6. Click "Pay Now"

### Step 4: Complete Payment
1. Flutterwave modal opens
2. Use test card (if in test mode):
   - Card: 5531 8866 5214 2950
   - CVV: 564
   - Expiry: 09/32
   - PIN: 3310
   - OTP: 12345

### Step 5: Monitor Logs
Watch the backend terminal for:
```
Payment Verified: VENDIFI-1234567890-123456
💰 PROFIT: Customer paid ₦100 → Reloadly cost ₦98 → Your profit ₦2 (airtime)
Reloadly Response: { status: 'SUCCESSFUL', transactionId: '...' }
```

### Step 6: Verify Delivery
- Customer should receive airtime within 1-30 seconds
- Check Reloadly dashboard for transaction status
- Check Flutterwave dashboard for payment status

---

## Quick Diagnostic Checklist

- [ ] Backend server is running (`node server.js`)
- [ ] Backend shows "Server is running on http://localhost:3000"
- [ ] Frontend BACKEND_URL is set to `http://localhost:3000`
- [ ] Reloadly wallet has funds (check dashboard)
- [ ] Using Airtel or 9Mobile (NOT MTN/GLO)
- [ ] Phone number is valid Nigerian number
- [ ] Amount is at least ₦50
- [ ] Browser console shows no errors
- [ ] Backend terminal shows no errors

---

## Common Error Messages & Fixes

### "Network Error - Could not connect to server"
**Fix:** Start your backend server with `node server.js`

### "Payment verification failed"
**Fix:** Check Flutterwave dashboard - was payment actually successful?

### "Product not found in catalog"
**Fix:** Make sure you're using Airtel or 9Mobile (not MTN/GLO)

### "Operator ID not configured"
**Fix:** Already fixed in latest code. Pull latest changes from GitHub.

### "Service delivery failed at vendor"
**Fix:** 
1. Check Reloadly wallet balance
2. Check Reloadly dashboard for error details
3. Verify operator ID is correct (342 for Airtel, 340 for 9Mobile)

### "An internal server error occurred"
**Fix:** Check backend terminal logs for detailed error

---

## For Live Deployment (Render.com)

When you deploy to Render.com:

1. **Update frontend BACKEND_URL:**
   ```javascript
   const BACKEND_URL = "https://vendifi-backend-3.onrender.com";
   ```

2. **Ensure backend is deployed and running on Render**

3. **Check Render logs** for errors

4. **Set environment variables on Render:**
   - FLUTTERWAVE_SECRET_KEY
   - RELOADLY_CLIENT_ID
   - RELOADLY_CLIENT_SECRET
   - (and all other .env variables)

---

## Still Having Issues?

### Check Backend Logs:
```bash
# Backend terminal will show:
✓ Payment Verified: ...
✓ Reloadly Response: ...
❌ Error: ... (if something fails)
```

### Check Browser Console:
Press F12 → Console tab
Look for errors in red

### Check Network Tab:
F12 → Network tab → Look for:
- POST to `/api/process-transaction`
- Check if it returns 200 (success) or error

### Manual Test Backend:
```bash
# Test if backend is accessible
curl http://localhost:3000/api/get-data-plans
```

Should return JSON with product catalog.

---

## Contact & Support

- **Reloadly Dashboard:** https://www.reloadly.com/dashboard
- **Flutterwave Dashboard:** https://dashboard.flutterwave.com
- **Backend Logs:** Check your terminal running `node server.js`
- **Browser Console:** Press F12 to see JavaScript errors

---

**Most Common Solution:**  
👉 **Just run `node server.js` in your backend folder!** 👈

This fixes 90% of delivery issues!
