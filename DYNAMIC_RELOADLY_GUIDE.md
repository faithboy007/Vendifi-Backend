# Making VENDIFI Fully Dynamic with Reloadly

## Overview
This guide explains how to convert your VENDIFI backend from static product catalogs to fully dynamic fetching from Reloadly APIs.

## What Will Change

### Before (Current):
- Static PRODUCT_CATALOG with hardcoded plans and prices
- Operator IDs synced separately
- Manual updates needed when networks change plans

### After (Dynamic):
- Real-time fetching from Reloadly on each request
- Automatic markup applied to all products
- Always up-to-date plans, prices, and availability
- Caching for performance (5-minute cache)

## Environment Variables to Add

Add these to your `.env` file and Railway:

```env
# Markup percentages (your profit margin)
MARKUP_AIRTIME=5        # 5% markup on airtime
MARKUP_DATA=10          # 10% markup on data bundles
MARKUP_CABLE_TV=8       # 8% markup on cable TV
MARKUP_ELECTRICITY=7    # 7% markup on electricity

# Cache duration in minutes (optional, default: 5)
CACHE_DURATION=5
```

## Key Changes Needed

### 1. Add Markup Configuration (After line 55)

```javascript
// --- MARKUP CONFIGURATION ---
const MARKUP = {
    airtime: parseFloat(process.env.MARKUP_AIRTIME || '5') / 100,      // 5% default
    data: parseFloat(process.env.MARKUP_DATA || '10') / 100,           // 10% default
    cableTV: parseFloat(process.env.MARKUP_CABLE_TV || '8') / 100,     // 8% default
    electricity: parseFloat(process.env.MARKUP_ELECTRICITY || '7') / 100 // 7% default
};

// Cache configuration
const CACHE_DURATION = parseInt(process.env.CACHE_DURATION || '5') * 60 * 1000; // 5 minutes default

// Product cache
let productCache = {
    operators: { data: null, timestamp: 0 },
    cableTVBillers: { data: null, timestamp: 0 },
    electricityBillers: { data: null, timestamp: 0 }
};
```

### 2. Add Cache Helper Function

```javascript
/**
 * Checks if cached data is still valid
 */
function isCacheValid(cacheEntry) {
    return cacheEntry.data && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
}

/**
 * Updates cache entry
 */
function updateCache(cacheEntry, data) {
    cacheEntry.data = data;
    cacheEntry.timestamp = Date.now();
}
```

### 3. Create Dynamic Product Fetching Functions

```javascript
/**
 * Fetches all Nigerian operators with caching and markup
 * @returns {Promise<Object>} Categorized operators (airtime and data)
 */
async function fetchDynamicProducts() {
    // Check cache first
    if (isCacheValid(productCache.operators)) {
        return productCache.operators.data;
    }

    try {
        const operators = await fetchReloadlyOperators();
        
        // Categorize operators
        const airtime = [];
        const data = [];
        
        const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
        
        for (const network of networks) {
            // Find operator for this network
            const operator = operators.find(op => 
                matchOperatorName(op.name, network) && 
                op.country?.isoName === 'Nigeria'
            );
            
            if (!operator) continue;
            
            // Airtime product
            if (operator.fx?.rate || operator.denominationType === 'FIXED') {
                airtime.push({
                    network: network,
                    name: `${network} Airtime`,
                    operatorId: operator.operatorId,
                    service: 'airtime',
                    minAmount: operator.minAmount || 50,
                    maxAmount: operator.maxAmount || 50000,
                    markup: MARKUP.airtime
                });
            }
            
            // Data bundles
            if (operator.data || operator.bundle) {
                // Fetch specific data bundles for this operator
                const bundles = operator.fixedAmounts || [];
                bundles.forEach((bundle, index) => {
                    const basePrice = bundle.amount || bundle;
                    const price = Math.round(basePrice * (1 + MARKUP.data));
                    
                    data.push({
                        planId: `${network}-DATA-${index + 1}`,
                        network: network,
                        name: `${network} ${bundle.name || bundle.description || `Plan ${index + 1}`}`,
                        price: price,
                        basePrice: basePrice,
                        operatorId: operator.operatorId,
                        service: 'data',
                        validity: bundle.validity || 'N/A',
                        markup: MARKUP.data
                    });
                });
            }
        }
        
        const result = { airtime, data };
        updateCache(productCache.operators, result);
        
        return result;
    } catch (error) {
        console.error('Error fetching dynamic products:', error.message);
        // Return cached data if available, even if expired
        if (productCache.operators.data) {
            console.log('Returning stale cache due to fetch error');
            return productCache.operators.data;
        }
        throw error;
    }
}

/**
 * Fetches Cable TV billers with markup
 */
async function fetchDynamicCableTV() {
    if (isCacheValid(productCache.cableTVBillers)) {
        return productCache.cableTVBillers.data;
    }

    try {
        const billers = await fetchReloadlyBillers('CABLE_TV');
        
        const cableTV = [];
        
        for (const biller of billers) {
            if (biller.country !== 'Nigeria') continue;
            
            // Extract provider from biller name
            const provider = biller.billerName.includes('DSTV') ? 'DStv' :
                           biller.billerName.includes('GOTV') ? 'GOtv' :
                           biller.billerName.includes('STAR') ? 'StarTimes' : biller.billerName;
            
            // Get available packages
            const packages = biller.products || [];
            packages.forEach((pkg, index) => {
                const basePrice = pkg.amount || pkg.price || 0;
                const price = Math.round(basePrice * (1 + MARKUP.cableTV));
                
                cableTV.push({
                    planId: `${provider.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${pkg.id || index}`,
                    provider: provider,
                    name: pkg.name || `${provider} Package ${index + 1}`,
                    price: price,
                    basePrice: basePrice,
                    operatorId: biller.billerId,
                    service: 'cableTV',
                    markup: MARKUP.cableTV
                });
            });
        }
        
        updateCache(productCache.cableTVBillers, cableTV);
        return cableTV;
        
    } catch (error) {
        console.error('Error fetching cable TV billers:', error.message);
        if (productCache.cableTVBillers.data) {
            return productCache.cableTVBillers.data;
        }
        throw error;
    }
}

/**
 * Fetches Electricity billers
 */
async function fetchDynamicElectricity() {
    if (isCacheValid(productCache.electricityBillers)) {
        return productCache.electricityBillers.data;
    }

    try {
        const billers = await fetchReloadlyBillers('ELECTRICITY_BILL_PAYMENT');
        
        const electricity = [];
        
        const discoMap = {
            'AEDC': 'Abuja Electricity Distribution Company',
            'EKEDC': 'Eko Electricity Distribution Company',
            'IKEDC': 'Ikeja Electric',
            'IBEDC': 'Ibadan Electricity Distribution Company',
            'EEDC': 'Enugu Electricity Distribution Company',
            'PHED': 'Port Harcourt Electricity Distribution Company',
            'JED': 'Jos Electricity Distribution Company',
            'KAEDCO': 'Kaduna Electric',
            'KEDCO': 'Kano Electricity Distribution Company',
            'BEDC': 'Benin Electricity Distribution Company',
            'YEDC': 'Yola Electricity Distribution Company'
        };
        
        for (const [disco, fullName] of Object.entries(discoMap)) {
            const biller = billers.find(b => 
                matchOperatorName(b.billerName, disco) || 
                matchOperatorName(b.billerName, fullName)
            );
            
            if (!biller) continue;
            
            // Prepaid and postpaid
            ['prepaid', 'postpaid'].forEach(type => {
                electricity.push({
                    planId: `${disco}-${type.toUpperCase()}`,
                    disco: disco,
                    discoName: fullName,
                    name: `${disco} ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                    serviceType: type,
                    operatorId: biller.billerId,
                    service: 'electricity',
                    minAmount: 1000,
                    maxAmount: 100000,
                    markup: MARKUP.electricity
                });
            });
        }
        
        updateCache(productCache.electricityBillers, electricity);
        return electricity;
        
    } catch (error) {
        console.error('Error fetching electricity billers:', error.message);
        if (productCache.electricityBillers.data) {
            return productCache.electricityBillers.data;
        }
        throw error;
    }
}
```

### 4. Replace GET /api/get-data-plans Endpoint

```javascript
/**
 * @route   GET /api/get-data-plans
 * @desc    Get dynamic product catalog from Reloadly with markup
 * @access  Public
 */
app.get('/api/get-data-plans', async (req, res) => {
    try {
        console.log('Fetching dynamic products from Reloadly...');
        
        const [products, cableTV, electricity] = await Promise.all([
            fetchDynamicProducts(),
            fetchDynamicCableTV(),
            fetchDynamicElectricity()
        ]);
        
        const catalog = {
            airtime: products.airtime,
            data: products.data,
            cableTV: cableTV,
            electricity: electricity
        };
        
        res.status(200).json({
            success: true,
            data: catalog,
            cached: isCacheValid(productCache.operators),
            cacheExpiry: new Date(productCache.operators.timestamp + CACHE_DURATION).toISOString()
        });
    } catch (error) {
        console.error(\"Error fetching product catalog:\", error.message);
        res.status(500).json({
            success: false,
            message: \"An error occurred while fetching product catalog.\",
            error: error.message
        });
    }
});
```

### 5. Update Transaction Processing

The `/api/process-transaction` endpoint needs minor changes to work with dynamic products:

```javascript
// Instead of:
// product = PRODUCT_CATALOG.airtime.find(p => p.network === meta.network);

// Use:
const products = await fetchDynamicProducts();
product = products.airtime.find(p => p.network === meta.network);

// Same for data, cableTV, electricity
```

## Implementation Steps

1. **Add environment variables** to Railway dashboard:
   - MARKUP_AIRTIME=5
   - MARKUP_DATA=10
   - MARKUP_CABLE_TV=8
   - MARKUP_ELECTRICITY=7

2. **Update server.js** with all the code changes above

3. **Remove old PRODUCT_CATALOG** (lines 245-855 in current server.js)

4. **Test locally** before deploying

5. **Deploy to Railway** - it will automatically restart

## Benefits

✅ Always up-to-date plans and prices from Reloadly
✅ Automatic markup/profit calculation
✅ No manual catalog maintenance
✅ 5-minute caching for performance
✅ Graceful fallback to stale cache on errors
✅ Easy profit margin adjustments via environment variables

## Considerations

⚠️ Depends on Reloadly API availability
⚠️ Cache means slight delay (max 5 min) for new plans
⚠️ More API calls to Reloadly (but cached)
⚠️ Need to handle Reloadly API changes

## Markup Examples

If Reloadly price is ₦1000:
- Airtime (5% markup): ₦1050
- Data (10% markup): ₦1100
- Cable TV (8% markup): ₦1080
- Electricity (7% markup): ₦1070

Your profit = Markup amount

---

**Next Step**: Would you like me to implement this fully, or would you prefer to review first?
