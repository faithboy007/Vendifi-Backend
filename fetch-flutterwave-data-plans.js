// Fetch actual MTN and GLO data plans from Flutterwave Bills API
import axios from 'axios';
import fs from 'fs';
import 'dotenv/config';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

// Flutterwave biller codes for Nigerian networks
const BILLER_CODES = {
    'MTN': 'BIL108',
    'GLO': 'BIL109',
    '9MOBILE': 'BIL111'
};

async function fetchDataPlansForNetwork(network) {
    try {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Fetching ${network} Data Plans...`);
        console.log('='.repeat(80));
        
        // Try different endpoints
        let response;
        try {
            response = await axios.get(`${FLW_BASE_URL}/billers/${BILLER_CODES[network]}/products`, {
                headers: {
                    'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (e1) {
            // Try alternative endpoint
            response = await axios.get(`${FLW_BASE_URL}/bill-items`, {
                headers: {
                    'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    biller_code: BILLER_CODES[network]
                }
            });
        }
        
        const plans = response.data.data || [];
        console.log(`✅ Found ${plans.length} ${network} data plans\n`);
        
        // Filter for common sizes we want
        const targetSizes = ['500mb', '1.5gb', '3.2gb', '1gb', '2gb', '3gb', '5gb', '7gb', '10gb'];
        
        const matchedPlans = [];
        
        plans.forEach((plan, index) => {
            const planName = plan.name.toLowerCase();
            const amount = plan.amount;
            
            // Check if plan matches our target sizes
            const matchesTarget = targetSizes.some(size => planName.includes(size));
            
            if (matchesTarget || index < 15) { // Show first 15 or matching plans
                console.log(`${plan.name}`);
                console.log(`  Amount: ₦${amount}`);
                console.log(`  Code: ${plan.item_code}`);
                console.log(`  Biller: ${plan.biller_code}`);
                console.log('');
                
                if (matchesTarget) {
                    matchedPlans.push({
                        network,
                        name: plan.name,
                        amount,
                        item_code: plan.item_code,
                        biller_code: plan.biller_code
                    });
                }
            }
        });
        
        return { network, plans, matchedPlans };
        
    } catch (error) {
        console.error(`❌ Error fetching ${network} plans:`, error.response?.data || error.message);
        return { network, plans: [], matchedPlans: [] };
    }
}

async function main() {
    console.log('\n🔍 Fetching MTN and GLO Data Plans from Flutterwave Bills API\n');
    
    const results = {};
    
    // Fetch plans for each network
    for (const network of ['MTN', 'GLO', '9MOBILE']) {
        const data = await fetchDataPlansForNetwork(network);
        results[network] = data;
    }
    
    // Save to file
    fs.writeFileSync('flutterwave-data-plans.json', JSON.stringify(results, null, 2));
    console.log('\n✅ Results saved to: flutterwave-data-plans.json');
    
    // Generate summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY - Plans matching your requirements (500MB, 1.5GB, 3.2GB, etc.)');
    console.log('='.repeat(80));
    
    Object.entries(results).forEach(([network, data]) => {
        console.log(`\n${network}:`);
        if (data.matchedPlans.length > 0) {
            data.matchedPlans.forEach(plan => {
                console.log(`  ✅ ${plan.name} - ₦${plan.amount} (${plan.item_code})`);
            });
        } else {
            console.log(`  ⚠️  No exact matches found - check full list in JSON file`);
        }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('NEXT STEPS:');
    console.log('='.repeat(80));
    console.log('1. Review flutterwave-data-plans.json for all available plans');
    console.log('2. Choose the plans you want to offer');
    console.log('3. Update your PRODUCT_CATALOG with the item_code and biller_code');
    console.log('4. Use Flutterwave Bills API to purchase data bundles');
    console.log('='.repeat(80) + '\n');
}

main();
