/**
 * Helper script to save operator IDs from PRODUCT_CATALOG to a JSON file
 * This preserves synced operator IDs so they persist across server restarts
 */

import fs from 'fs';
import { PRODUCT_CATALOG } from './server.js';

const OUTPUT_FILE = './operator-ids.json';

try {
    // Extract just the operator IDs from the catalog
    const operatorIds = {
        lastUpdated: new Date().toISOString(),
        airtime: {},
        data: {},
        cableTV: {},
        electricity: {}
    };

    // Airtime
    PRODUCT_CATALOG.airtime.forEach(product => {
        operatorIds.airtime[product.network] = {
            operatorId: product.operatorId,
            name: product.name
        };
    });

    // Data
    PRODUCT_CATALOG.data.forEach(product => {
        operatorIds.data[product.planId] = {
            operatorId: product.operatorId,
            name: product.name,
            network: product.network
        };
    });

    // Cable TV
    PRODUCT_CATALOG.cableTV.forEach(product => {
        operatorIds.cableTV[product.planId] = {
            operatorId: product.operatorId,
            name: product.name,
            provider: product.provider
        };
    });

    // Electricity
    PRODUCT_CATALOG.electricity.forEach(product => {
        operatorIds.electricity[product.planId] = {
            operatorId: product.operatorId,
            name: product.name,
            disco: product.disco
        };
    });

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(operatorIds, null, 2));
    
    console.log('✅ Operator IDs saved to', OUTPUT_FILE);
    console.log('📊 Summary:');
    console.log(`  - Airtime: ${Object.keys(operatorIds.airtime).length} operators`);
    console.log(`  - Data: ${Object.keys(operatorIds.data).length} plans`);
    console.log(`  - Cable TV: ${Object.keys(operatorIds.cableTV).length} packages`);
    console.log(`  - Electricity: ${Object.keys(operatorIds.electricity).length} DISCOs`);
    
} catch (error) {
    console.error('❌ Error saving operator IDs:', error.message);
    process.exit(1);
}
