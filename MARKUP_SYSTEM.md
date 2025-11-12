# VENDIFI Markup & Profit System

## Overview
VENDIFI now includes an automatic markup system that adds your profit margin to all services. The markup is applied when products are fetched and removed before sending to Reloadly.

## How It Works

### 1. **Customer Pays** (With Markup)
Customer sees and pays prices with your markup included.

### 2. **You Send to Reloadly** (Without Markup)
System automatically calculates base price and sends to Reloadly.

### 3. **You Keep the Difference** (Your Profit!)
Difference between customer payment and Reloadly cost = Your profit

## Markup Configuration

Add these environment variables to your `.env` file and Railway:

```env
# Markup percentages (your profit margin)
MARKUP_AIRTIME=2        # 2% markup on airtime (default)
MARKUP_DATA=5           # 5% markup on data bundles (default)
MARKUP_CABLE_TV=3       # 3% markup on cable TV (default)
MARKUP_ELECTRICITY=2    # 2% markup on electricity (default)
```

## Markup Examples

### Airtime (2% markup):
- Customer pays: ₦1,000
- You send to Reloadly: ₦980
- **Your profit: ₦20**

### Data Bundle (5% markup):
- Base price in catalog: ₦1,000
- Customer pays: ₦1,050 (₦1,000 × 1.05)
- You send to Reloadly: ₦1,000
- **Your profit: ₦50**

### Cable TV (3% markup):
- Base price: ₦5,000
- Customer pays: ₦5,150 (₦5,000 × 1.03)
- You send to Reloadly: ₦5,000
- **Your profit: ₦150**

### Electricity (2% markup):
- Customer pays: ₦10,000
- You send to Reloadly: ₦9,804
- **Your profit: ₦196**

## Adjusting Markup

### Via Environment Variables:
1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Update markup values (e.g., `MARKUP_DATA=10` for 10%)
5. Railway will auto-redeploy

### Via Local .env File:
```env
MARKUP_AIRTIME=5     # 5% markup
MARKUP_DATA=10       # 10% markup
MARKUP_CABLE_TV=8    # 8% markup
MARKUP_ELECTRICITY=7 # 7% markup
```

## API Response

When frontend calls `GET /api/get-data-plans`, it receives:

```json
{
  "success": true,
  "data": {
    "airtime": [...],
    "data": [
      {
        "planId": "MTN-1GB-DAILY",
        "name": "MTN 1GB Daily",
        "basePrice": 300,
        "price": 315,  // ← Customer pays this (with markup)
        "network": "MTN"
      }
    ],
    "cableTV": [...],
    "electricity": [...]
  },
  "markup": {
    "airtime": "2%",
    "data": "5%",
    "cableTV": "3%",
    "electricity": "2%"
  }
}
```

## Transaction Flow

1. **Customer initiates payment**
   - Selects MTN 1GB Daily (₦315 with markup)
   - Pays via Flutterwave

2. **Backend verifies payment**
   - Confirms ₦315 received from customer
   - Looks up product in catalog (base price: ₦300)

3. **Backend delivers service**
   - Calculates: ₦315 ÷ 1.05 = ₦300 (removes markup)
   - Sends ₦300 to Reloadly
   - Logs: "Customer paid: ₦315, Sending to Reloadly: ₦300, Your profit: ₦15"

4. **Service delivered**
   - Customer gets airtime/data/service
   - You keep ₦15 profit automatically

## Recommended Markup Rates

Based on industry standards in Nigeria:

| Service | Recommended Markup | Reason |
|---------|-------------------|--------|
| **Airtime** | 1-3% | High volume, low margin |
| **Data** | 5-10% | Medium volume, better margin |
| **Cable TV** | 2-5% | Fixed packages, steady profit |
| **Electricity** | 1-3% | High volume, low margin |

### Competitive Rates:
- **Too Low** (<1%): Hard to cover costs and make profit
- **Sweet Spot** (2-8%): Competitive pricing, good profit
- **Too High** (>10%): Customers may go elsewhere

## Profit Calculation

### Monthly Profit Example (₦1M in sales):

**With 5% average markup:**
- Total customer payments: ₦1,000,000
- Total sent to Reloadly: ₦952,381
- **Your monthly profit: ₦47,619**

**With 10% average markup:**
- Total customer payments: ₦1,000,000
- Total sent to Reloadly: ₦909,091
- **Your monthly profit: ₦90,909**

## Important Notes

### ✅ Benefits:
- Automatic markup application
- Transparent profit calculation
- Easy markup adjustments via environment variables
- No code changes needed to adjust rates
- Logs show profit on each transaction

### ⚠️ Considerations:
- Markup must be competitive with other VTU platforms
- Higher markup may reduce sales volume
- Lower markup may increase volume but reduce profit
- Test different rates to find sweet spot
- Monitor competitor prices regularly

## Markup Best Practices

1. **Start Conservative**: Begin with 2-5% markup
2. **Monitor Sales**: Track if customers are price-sensitive
3. **A/B Testing**: Try different rates for different services
4. **Seasonal Adjustments**: Increase during peak periods
5. **Volume Discounts**: Consider lower markup for bulk buyers
6. **Competitive Analysis**: Check competitor prices monthly

## Viewing Markup in Logs

Every transaction shows profit in Railway logs:

```
Customer paid: ₦1050, Sending to Reloadly: ₦1000, Your profit: ₦50
```

Monitor these logs to track daily/weekly profits.

## Troubleshooting

**Q: Markup not applying?**
- Check environment variables are set in Railway
- Restart server after updating variables
- Verify variables with: `console.log(MARKUP)`

**Q: Negative profit showing?**
- Check if base prices in catalog are higher than Reloadly actual prices
- Update base prices in PRODUCT_CATALOG
- Re-sync operator IDs

**Q: Frontend showing wrong prices?**
- Clear frontend cache
- Check `/api/get-data-plans` response
- Verify markup calculation in `applyMarkupToCatalog()`

---

## Summary

✅ Markup system automatically adds profit to all services
✅ Easy to adjust via environment variables
✅ Transparent profit calculation and logging
✅ No manual price calculations needed
✅ Competitive rates maintained automatically

**Your VENDIFI platform now automatically generates profit on every transaction!** 💰
