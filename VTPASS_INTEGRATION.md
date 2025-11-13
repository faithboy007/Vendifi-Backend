# VTPass Integration Guide

## Why VTPass?

VTPass is the recommended provider for MTN and GLO data bundles in Nigeria because:
- ✅ Reliable and popular in Nigeria
- ✅ Supports ALL Nigerian networks (MTN, GLO, Airtel, 9Mobile)
- ✅ Clear documentation
- ✅ Competitive pricing
- ✅ Good API support

## Setup Steps

### 1. Register for VTPass
1. Visit: https://www.vtpass.com/
2. Create an account
3. Get your API credentials from dashboard

### 2. Add VTPass Credentials to .env

```env
# VTPass Configuration
VTPASS_API_KEY=your-vtpass-api-key-here
VTPASS_SECRET_KEY=your-vtpass-secret-key-here
VTPASS_PUBLIC_KEY=your-vtpass-public-key-here
```

### 3. VTPass Data Bundle Service IDs

**MTN Data:**
- Service ID: `mtn-data`

**GLO Data:**
- Service ID: `glo-data`

**Airtel Data:**
- Service ID: `airtel-data`

**9Mobile Data:**
- Service ID: `etisalat-data`

## Common VTPass Data Plans

### MTN Data Plans (Approximate Prices)
- 500MB - ₦500 (Code: `mtn-500mb`)
- 1.5GB - ₦1,000 (Code: `mtn-1.5gb`)
- 3.5GB - ₦2,000 (Code: `mtn-3.5gb`)
- 7GB - ₦2,500 (Code: `mtn-7gb`)
- 10GB - ₦3,500 (Code: `mtn-10gb`)

### GLO Data Plans (Approximate Prices)
- 500MB - ₦500 (Code: `glo-500mb`)
- 1.5GB - ₦1,000 (Code: `glo-1.5gb`)
- 2.9GB - ₦1,500 (Code: `glo-2.9gb`)
- 5.8GB - ₦2,500 (Code: `glo-5.8gb`)
- 10GB - ₦3,500 (Code: `glo-10gb`)

## API Integration Code

### VTPass Purchase Request

```javascript
// VTPass API endpoint
const VTPASS_BASE_URL = 'https://api-service.vtpass.com/api';

// Function to purchase data via VTPass
async function purchaseDataViaVTPass(serviceID, phone, variation_code, amount) {
    try {
        const response = await axios.post(`${VTPASS_BASE_URL}/pay`, {
            request_id: `REQ-${Date.now()}`,
            serviceID: serviceID, // e.g., 'mtn-data'
            billersCode: phone, // Phone number
            variation_code: variation_code, // e.g., 'mtn-1.5gb'
            amount: amount,
            phone: phone
        }, {
            headers: {
                'api-key': process.env.VTPASS_API_KEY,
                'secret-key': process.env.VTPASS_SECRET_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('VTPass Error:', error.response?.data || error.message);
        throw error;
    }
}
```

### Verify VTPass Transaction

```javascript
async function verifyVTPassTransaction(request_id) {
    try {
        const response = await axios.post(`${VTPASS_BASE_URL}/requery`, {
            request_id: request_id
        }, {
            headers: {
                'api-key': process.env.VTPASS_API_KEY,
                'secret-key': process.env.VTPASS_SECRET_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('VTPass Verification Error:', error.response?.data || error.message);
        throw error;
    }
}
```

## Implementation Plan

### Option A: VTPass for ALL networks (Recommended)
- Use VTPass for MTN, GLO, Airtel, and 9Mobile
- Remove Reloadly completely
- Simpler codebase, one API to manage

### Option B: Hybrid Approach
- Use Reloadly for Airtel only
- Use VTPass for MTN, GLO, and 9Mobile
- More complex but uses existing Reloadly integration

## Next Steps

1. **Register with VTPass** and get API credentials
2. **Test VTPass API** with sandbox/test mode
3. **Update backend** to integrate VTPass
4. **Update PRODUCT_CATALOG** with VTPass variation codes
5. **Test end-to-end** flow before going live

## Useful Links

- VTPass Website: https://www.vtpass.com/
- VTPass Documentation: https://www.vtpass.com/documentation/
- VTPass Dashboard: https://www.vtpass.com/dashboard/

## Recommendation

🎯 **Use VTPass for all networks** - It's simpler, well-documented, and specifically built for Nigerian bill payments. You can always keep Reloadly as a backup or fallback option.
