// Script to fetch actual data plans from Reloadly API
import axios from 'axios';
import fs from 'fs';
import 'dotenv/config';

const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET;
const RELOADLY_AUTH_URL = "https://auth.reloadly.com/oauth/token";
const RELOADLY_OPERATORS_URL = "https://topups.reloadly.com/operators";

async function getReloadlyAccessToken() {
    console.log('🔐 Authenticating with Reloadly...');
    const response = await axios.post(RELOADLY_AUTH_URL, {
        client_id: RELOADLY_CLIENT_ID,
        client_secret: RELOADLY_CLIENT_SECRET,
        grant_type: "client_credentials",
        audience: "https://topups.reloadly.com"
    }, {
        headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Authentication successful!\n');
    return response.data.access_token;
}

async function fetchNigerianOperators(accessToken) {
    console.log('📡 Fetching Nigerian data operators...');
    const response = await axios.get(`${RELOADLY_OPERATORS_URL}?countryISO=NG&size=200&includeData=true`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/com.reloadly.topups-v1+json'
        }
    });
    return response.data.content || [];
}

function findNetworkOperator(operators, networkName) {
    return operators.find(op => {
        const name = op.name.toUpperCase();
        const country = op.country?.isoName?.toUpperCase() || '';
        
        // Must be in Nigeria
        const isNigeria = country.includes('NIGERIA') || country === 'NG' || name.includes('NIGERIA');
        if (!isNigeria) return false;
        
        if (networkName === 'MTN') return name.includes('MTN');
        if (networkName === 'GLO') return name.includes('GLO');
        if (networkName === 'AIRTEL') return name.includes('AIRTEL');
        if (networkName === '9MOBILE') return name.includes('9MOBILE') || name.includes('ETISALAT');
        return false;
    });
}

function findClosestPlan(fixedAmounts, targetSize, targetPrice) {
    // Common data bundle prices in Nigeria
    const commonPrices = [300, 350, 500, 800, 1000, 1200, 1500, 1600, 2000, 2500, 3000, 3500, 4000, 5000, 10000, 15000, 20000];
    
    // Try to find exact price match
    if (fixedAmounts.includes(targetPrice)) {
        return targetPrice;
    }
    
    // Find closest common price
    return commonPrices.find(price => fixedAmounts.includes(price) && price >= targetPrice * 0.8 && price <= targetPrice * 1.2);
}

async function main() {
    try {
        const accessToken = await getReloadlyAccessToken();
        const operators = await fetchNigerianOperators(accessToken);
        
        console.log(`✅ Found ${operators.length} operators\n`);
        
        const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
        const results = {
            timestamp: new Date().toISOString(),
            networks: {},
            recommendations: []
        };
        
        console.log('='.repeat(80));
        console.log('RELOADLY DATA PLANS ANALYSIS');
        console.log('='.repeat(80));
        
        networks.forEach(networkName => {
            const operator = findNetworkOperator(operators, networkName);
            
            if (!operator) {
                console.log(`\n❌ ${networkName}: Operator not found`);
                return;
            }
            
            console.log(`\n✅ ${networkName}`);
            console.log(`   Operator ID: ${operator.operatorId}`);
            console.log(`   Name: ${operator.name}`);
            console.log(`   Denomination Type: ${operator.denominationType}`);
            
            if (operator.fixedAmounts && operator.fixedAmounts.length > 0) {
                console.log(`   Available Plans: ${operator.fixedAmounts.length} plans`);
                console.log(`   Price Range: ₦${Math.min(...operator.fixedAmounts)} - ₦${Math.max(...operator.fixedAmounts)}`);
                
                // Show first 15 plans
                const commonAmounts = operator.fixedAmounts.filter(a => a >= 300 && a <= 20000).slice(0, 15);
                console.log(`   Common Prices: ${commonAmounts.join(', ')}`);
            }
            
            results.networks[networkName] = {
                operatorId: operator.operatorId,
                name: operator.name,
                denominationType: operator.denominationType,
                fixedAmounts: operator.fixedAmounts || [],
                minAmount: operator.minAmount,
                maxAmount: operator.maxAmount
            };
        });
        
        // Generate recommendations for your requested plans
        console.log('\n' + '='.repeat(80));
        console.log('RECOMMENDED PLANS FOR YOUR CATALOG');
        console.log('='.repeat(80));
        
        const requestedPlans = [
            { size: '500MB', targetPrice: 500 },
            { size: '1.5GB', targetPrice: 1200 },
            { size: '3.2GB', targetPrice: 2000 }
        ];
        
        networks.forEach(networkName => {
            const networkData = results.networks[networkName];
            if (!networkData || !networkData.fixedAmounts.length) return;
            
            console.log(`\n${networkName} (Operator ID: ${networkData.operatorId}):`);
            
            requestedPlans.forEach(plan => {
                const closestPrice = findClosestPlan(networkData.fixedAmounts, plan.size, plan.targetPrice);
                if (closestPrice) {
                    console.log(`  ✅ ${plan.size}: ₦${closestPrice} available`);
                    results.recommendations.push({
                        network: networkName,
                        operatorId: networkData.operatorId,
                        size: plan.size,
                        price: closestPrice
                    });
                } else {
                    console.log(`  ⚠️  ${plan.size}: Target ₦${plan.targetPrice} not available, closest options: ${
                        networkData.fixedAmounts
                            .filter(a => a >= plan.targetPrice * 0.5 && a <= plan.targetPrice * 1.5)
                            .slice(0, 3)
                            .join(', ')
                    }`);
                }
            });
        });
        
        // Save full results
        fs.writeFileSync('reloadly-data-plans.json', JSON.stringify(results, null, 2));
        console.log('\n✅ Full data saved to: reloadly-data-plans.json');
        
        // Generate code suggestions
        console.log('\n' + '='.repeat(80));
        console.log('CODE SUGGESTIONS FOR BACKEND');
        console.log('='.repeat(80));
        console.log('\nUpdate your PRODUCT_CATALOG with these operator IDs:');
        
        Object.entries(results.networks).forEach(([network, data]) => {
            console.log(`\n// ${network}`);
            console.log(`operatorId: ${data.operatorId}`);
            console.log(`// Available prices: ${data.fixedAmounts.filter(a => a >= 300 && a <= 5000).join(', ')}`);
        });
        
        console.log('\n' + '='.repeat(80));
        
    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

main();
