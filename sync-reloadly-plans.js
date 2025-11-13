// Script to fetch actual data plans from Reloadly API
// Run this with: node sync-reloadly-plans.js

import axios from 'axios';
import 'dotenv/config';

const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET;
const RELOADLY_AUTH_URL = "https://auth.reloadly.com/oauth/token";
const RELOADLY_OPERATORS_URL = "https://topups.reloadly.com/operators";

// Get Reloadly Access Token
async function getReloadlyAccessToken() {
    try {
        console.log('Authenticating with Reloadly...');
        const response = await axios.post(RELOADLY_AUTH_URL, {
            client_id: RELOADLY_CLIENT_ID,
            client_secret: RELOADLY_CLIENT_SECRET,
            grant_type: "client_credentials",
            audience: "https://topups.reloadly.com"
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('✓ Authentication successful\n');
        return response.data.access_token;
    } catch (error) {
        console.error('✗ Authentication failed:', error.response?.data || error.message);
        throw error;
    }
}

// Fetch operators for Nigeria
async function fetchNigerianOperators(accessToken) {
    try {
        console.log('Fetching Nigerian operators from Reloadly...\n');
        const response = await axios.get(`${RELOADLY_OPERATORS_URL}?countryISO=NG&size=200&includeData=true&includePin=false`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/com.reloadly.topups-v1+json'
            }
        });
        
        return response.data.content || [];
    } catch (error) {
        console.error('✗ Failed to fetch operators:', error.response?.data || error.message);
        throw error;
    }
}

// Filter and display data plans
function displayDataPlans(operators) {
    console.log('='.repeat(80));
    console.log('NIGERIAN DATA PLANS FROM RELOADLY');
    console.log('='.repeat(80));
    
    const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
    
    networks.forEach(networkName => {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`${networkName} DATA PLANS`);
        console.log('='.repeat(80));
        
        const networkOperators = operators.filter(op => {
            const name = op.name.toUpperCase();
            return name.includes(networkName) || 
                   (networkName === '9MOBILE' && (name.includes('ETISALAT') || name.includes('9MOBILE'))) ||
                   (networkName === 'AIRTEL' && name.includes('AIRTEL'));
        });
        
        if (networkOperators.length === 0) {
            console.log('No operators found for this network');
            return;
        }
        
        networkOperators.forEach(operator => {
            console.log(`\nOperator: ${operator.name}`);
            console.log(`Operator ID: ${operator.operatorId}`);
            console.log(`Country: ${operator.country?.name || 'Nigeria'}`);
            console.log(`Denomination Type: ${operator.denominationType}`);
            
            // Display fixed amounts if available
            if (operator.fixedAmounts && operator.fixedAmounts.length > 0) {
                console.log('\nFixed Data Plans:');
                operator.fixedAmounts.slice(0, 15).forEach(amount => {
                    console.log(`  - ${amount} NGN`);
                });
                if (operator.fixedAmounts.length > 15) {
                    console.log(`  ... and ${operator.fixedAmounts.length - 15} more plans`);
                }
            }
            
            // Display range if available
            if (operator.minAmount && operator.maxAmount) {
                console.log(`\nPrice Range: ₦${operator.minAmount} - ₦${operator.maxAmount}`);
            }
            
            // Display fx rate if available
            if (operator.fx) {
                console.log(`Exchange Rate: ${operator.fx.rate} ${operator.fx.currencyCode}`);
            }
            
            // Display suggested amounts
            if (operator.suggestedAmounts && operator.suggestedAmounts.length > 0) {
                console.log('\nSuggested Amounts:');
                operator.suggestedAmounts.forEach(amount => {
                    console.log(`  - ₦${amount}`);
                });
            }
            
            console.log('-'.repeat(80));
        });
    });
}

// Generate updated catalog code
function generateCatalogCode(operators) {
    console.log('\n\n' + '='.repeat(80));
    console.log('SUGGESTED DATA PLANS FOR YOUR PRODUCT_CATALOG');
    console.log('='.repeat(80));
    console.log('\nBased on Reloadly\'s API, here are suggested plans:\n');
    
    const networks = {
        'MTN': operators.find(op => op.name.toUpperCase().includes('MTN')),
        'GLO': operators.find(op => op.name.toUpperCase().includes('GLO')),
        'AIRTEL': operators.find(op => op.name.toUpperCase().includes('AIRTEL')),
        '9MOBILE': operators.find(op => op.name.toUpperCase().includes('9MOBILE') || op.name.toUpperCase().includes('ETISALAT'))
    };
    
    Object.entries(networks).forEach(([networkName, operator]) => {
        if (!operator) {
            console.log(`\n// ${networkName} - Operator not found`);
            return;
        }
        
        console.log(`\n// ${networkName} Data Plans (Operator ID: ${operator.operatorId})`);
        
        if (operator.fixedAmounts && operator.fixedAmounts.length > 0) {
            // Common data plan prices in Nigeria
            const commonPrices = [300, 500, 800, 1000, 1200, 1500, 1600, 2000, 2500, 3000, 3500, 4000, 5000, 10000, 15000, 20000];
            const availablePrices = operator.fixedAmounts.filter(price => commonPrices.includes(price));
            
            console.log(`// Available prices: ${availablePrices.join(', ')}`);
            console.log(`// Total plans available: ${operator.fixedAmounts.length}`);
        }
    });
    
    console.log('\n\n' + '='.repeat(80));
    console.log('INSTRUCTIONS:');
    console.log('='.repeat(80));
    console.log('1. Use the Operator IDs shown above in your PRODUCT_CATALOG');
    console.log('2. Choose prices from the "Fixed Data Plans" or "Available prices" lists');
    console.log('3. Match each plan ID with the correct operator ID');
    console.log('4. Update both backend and frontend with the same plan IDs and prices');
    console.log('='.repeat(80));
}

// Main execution
async function main() {
    try {
        // Check if credentials are configured
        if (!RELOADLY_CLIENT_ID || !RELOADLY_CLIENT_SECRET || 
            RELOADLY_CLIENT_ID.includes('your-') || RELOADLY_CLIENT_SECRET.includes('your-')) {
            console.error('\n❌ ERROR: Reloadly credentials not configured!');
            console.error('\nPlease update your .env file with:');
            console.error('  - RELOADLY_CLIENT_ID');
            console.error('  - RELOADLY_CLIENT_SECRET');
            console.error('\nGet these from: https://www.reloadly.com/dashboard\n');
            process.exit(1);
        }
        
        const accessToken = await getReloadlyAccessToken();
        const operators = await fetchNigerianOperators(accessToken);
        
        console.log(`✓ Found ${operators.length} operators in Nigeria\n`);
        
        displayDataPlans(operators);
        generateCatalogCode(operators);
        
        // Save to JSON file for reference
        const fs = await import('fs');
        fs.writeFileSync(
            'reloadly-operators-data.json',
            JSON.stringify(operators, null, 2),
            'utf8'
        );
        console.log('\n✓ Full operator data saved to: reloadly-operators-data.json\n');
        
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    }
}

main();
