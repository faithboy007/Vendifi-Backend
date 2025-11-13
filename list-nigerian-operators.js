import axios from 'axios';
import fs from 'fs';
import 'dotenv/config';

const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET;
const RELOADLY_AUTH_URL = "https://auth.reloadly.com/oauth/token";
const RELOADLY_OPERATORS_URL = "https://topups.reloadly.com/operators";

async function getToken() {
    const response = await axios.post(RELOADLY_AUTH_URL, {
        client_id: RELOADLY_CLIENT_ID,
        client_secret: RELOADLY_CLIENT_SECRET,
        grant_type: "client_credentials",
        audience: "https://topups.reloadly.com"
    }, { headers: { 'Content-Type': 'application/json' } });
    return response.data.access_token;
}

async function main() {
    const token = await getToken();
    const response = await axios.get(`${RELOADLY_OPERATORS_URL}?countryISO=NG&size=200`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/com.reloadly.topups-v1+json'
        }
    });
    
    const operators = response.data.content || [];
    console.log(`\nFound ${operators.length} Nigerian operators:\n`);
    console.log('='.repeat(100));
    
    operators.forEach((op, index) => {
        console.log(`${index + 1}. ${op.name}`);
        console.log(`   ID: ${op.operatorId}`);
        console.log(`   Type: ${op.denominationType}`);
        console.log(`   Range: ₦${op.minAmount} - ₦${op.maxAmount}`);
        if (op.fixedAmounts && op.fixedAmounts.length > 0) {
            console.log(`   Fixed Amounts: ${op.fixedAmounts.slice(0, 10).join(', ')}...`);
        }
        if (op.suggestedAmounts && op.suggestedAmounts.length > 0) {
            console.log(`   Suggested: ${op.suggestedAmounts.slice(0, 10).join(', ')}`);
        }
        console.log('');
    });
    
    // Save to file
    fs.writeFileSync('nigerian-operators-full.json', JSON.stringify(operators, null, 2));
    console.log('✅ Full data saved to: nigerian-operators-full.json\n');
}

main().catch(console.error);
