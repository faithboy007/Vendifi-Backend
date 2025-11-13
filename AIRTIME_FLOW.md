# Airtime Purchase Flow - Complete Guide

## Overview
Your Vendifi platform automatically delivers airtime to customers after they pay via Flutterwave. Here's the complete flow:

## Current Status ✅

### Supported Networks:
- ✅ **Airtel** (Operator ID: 342)
- ✅ **9Mobile** (Operator ID: 340)

### Not Yet Supported:
- ❌ **MTN** - Not available on Reloadly (need VTPass)
- ❌ **GLO** - Not available on Reloadly (need VTPass)

## How It Works (Step-by-Step)

### 1. Customer Initiates Purchase
- Customer visits your website
- Selects "Airtime" tab
- Chooses network (Airtel or 9Mobile)
- Enters phone number (e.g., 08012345678)
- Enters amount (minimum ₦50)
- Enters email for receipt
- Clicks "Pay Now"

### 2. Payment Processing (Flutterwave)
```
Frontend (script.js) → initiatePayment()
├─ Validates input
├─ Opens Flutterwave payment modal
├─ Customer pays via Card/Bank Transfer/USSD
└─ Flutterwave returns payment status
```

### 3. Automatic Delivery (Your Backend)
When payment succeeds, your backend automatically:

```javascript
// File: server.js, Line 1156-1276
POST /api/process-transaction

Step 1: Verify Payment with Flutterwave ✅
├─ Check transaction reference
├─ Verify amount matches
└─ Confirm payment successful

Step 2: Extract Transaction Details ✅
├─ Network (AIRTEL or 9MOBILE)
├─ Phone number
├─ Amount paid
└─ Customer email

Step 3: Find Operator ID ✅
├─ Look up network in PRODUCT_CATALOG
├─ Get operatorId (342 for Airtel, 340 for 9Mobile)
└─ Validate operatorId exists

Step 4: Calculate Reloadly Amount ✅
├─ Remove your profit margin (2% default)
├─ Example: Customer pays ₦1000
│   └─ Reloadly receives ₦980
│   └─ Your profit: ₦20
└─ Round to nearest naira

Step 5: Send Airtime via Reloadly API ✅
POST https://topups.reloadly.com/topups
{
  "operatorId": 342,  // Airtel Nigeria
  "amount": 980,      // Amount after margin
  "recipientPhone": {
    "countryCode": "NG",
    "number": "8012345678"  // Without +234
  },
  "customIdentifier": "VENDIFI-1234567890"
}

Step 6: Customer Receives Airtime! ✅
└─ Airtime credited to their phone instantly
```

## What You Need To Do ✅

### Already Done:
1. ✅ Reloadly account created
2. ✅ Reloadly API credentials added to .env
3. ✅ Backend configured with correct operator IDs
4. ✅ Payment flow integrated with Flutterwave
5. ✅ Automatic airtime delivery coded

### To Test:
1. **Fund your Reloadly wallet** at https://www.reloadly.com/dashboard
   - Go to "Wallet" → "Add Funds"
   - Minimum recommended: $50 (₦40,000)
   
2. **Test the complete flow:**
   ```
   1. Customer pays ₦100 for Airtel airtime
   2. Your backend receives webhook from Flutterwave
   3. Backend calls Reloadly API
   4. Customer receives ₦98 airtime (after 2% margin)
   5. Your profit: ₦2
   ```

3. **Monitor transactions:**
   - Flutterwave Dashboard: Payment status
   - Reloadly Dashboard: Airtime delivery status
   - Your server logs: Complete transaction flow

## Important Notes ⚠️

### Phone Number Format
Your backend automatically converts Nigerian phone numbers:
```javascript
// Input formats accepted:
08012345678  → +2348012345678
8012345678   → +2348012345678
+2348012345678 → +2348012345678 (unchanged)
```

### Profit Margins
Configured in server.js (Line 58-63):
```javascript
const MARKUP = {
    airtime: 2%,      // Default profit on airtime
    data: 5%,         // Default profit on data
    cableTV: 3%,      // Default profit on cable
    electricity: 2%   // Default profit on electricity
};
```

You can adjust these in your `.env` file:
```env
MARKUP_AIRTIME=2
MARKUP_DATA=5
MARKUP_CABLE_TV=3
MARKUP_ELECTRICITY=2
```

### Error Handling
Your backend handles common errors:
- ❌ Payment verification fails → Shows error to customer
- ❌ Operator ID not configured → Shows "Service unavailable"
- ❌ Reloadly API fails → Shows "Delivery failed"
- ❌ Insufficient Reloadly balance → Logs error

## Adding MTN & GLO Support

To add MTN and GLO airtime:

### Option 1: Use VTPass (Recommended)
1. Register at https://www.vtpass.com/
2. Add credentials to `.env`:
   ```env
   VTPASS_API_KEY=your-key-here
   VTPASS_SECRET_KEY=your-secret-here
   ```
3. I'll help you integrate VTPass for MTN/GLO

### Option 2: Wait for Reloadly
- Reloadly might add MTN/GLO in the future
- Check their dashboard periodically

## Summary

### What Happens After You Fund Reloadly Wallet:

**Nothing else needed! The flow is fully automated:**

1. ✅ Customer pays → Flutterwave processes
2. ✅ Your backend verifies payment
3. ✅ Your backend calls Reloadly API
4. ✅ Reloadly sends airtime to customer's phone
5. ✅ Customer receives airtime (usually instant)
6. ✅ You keep your profit margin

**You just need to:**
- Monitor your Reloadly wallet balance
- Top up when needed
- Check transaction logs for any issues

## Troubleshooting

### Customer didn't receive airtime?
1. Check Flutterwave dashboard - was payment successful?
2. Check Reloadly dashboard - was API call made?
3. Check server logs - any errors?
4. Check Reloadly wallet - sufficient balance?

### Wrong amount delivered?
- Check MARKUP settings in `.env`
- Verify Reloadly transaction in their dashboard

### Operator ID error?
- Only Airtel (342) and 9Mobile (340) work
- MTN/GLO will show "not configured" error

## Contact & Support

- **Reloadly Support**: https://www.reloadly.com/support
- **Flutterwave Support**: https://www.flutterwave.com/support  
- **Your Backend Logs**: Check console for detailed errors

---

**Ready to go live?** ✅
Just fund your Reloadly wallet and test with a small amount (₦100) first!
