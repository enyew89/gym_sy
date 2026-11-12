/**
 * MERN Stack MongoDB Seeder Script
 * Usage: node seed.js (once your MongoDB URI and models are set up)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read seed JSON
const rawData = fs.readFileSync(path.join(__dirname, 'seed_data.json'), 'utf-8');
const seedData = JSON.parse(rawData);

console.log('====================================');
console.log('🏋️ GymPro Seed Data Ready for MongoDB');
console.log('====================================');
console.log(`- Test Accounts: ${seedData.test_accounts.length}`);
console.log(`- Membership Plans: ${seedData.membership_plans.length}`);
console.log(`- Sample Members: ${seedData.sample_members.length}`);
console.log(`- Scheduled Classes: ${seedData.classes.length}`);
console.log(`- Equipment Units: ${seedData.equipment_inventory.length}`);
console.log(`- Payment Transactions: ${seedData.recent_payments.length}`);
console.log(`- Progress Records: ${seedData.member_biometrics_and_lifts.length}`);
console.log('====================================');

export default seedData;
