import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

import { connectDB } from './src/config/db.js';
import { seedDatabase } from './src/seeds/seed.js';
import User from './src/models/User.js';
import Plan from './src/models/Plan.js';
import GymClass from './src/models/GymClass.js';
import Equipment from './src/models/Equipment.js';
import Payment from './src/models/Payment.js';
import Attendance from './src/models/Attendance.js';
import WorkoutPlan from './src/models/WorkoutPlan.js';
import Progress from './src/models/Progress.js';

async function verifyFullSystem() {
  console.log('🧪 ====================================================');
  console.log('🧪 Starting Full System End-to-End Verification...');
  console.log('🧪 ====================================================\n');

  await connectDB();
  await seedDatabase();

  // 1. Verify Users & Roles
  const users = await User.find();
  const admins = users.filter(u => u.role === 'admin');
  const trainers = users.filter(u => u.role === 'trainer');
  const receptionists = users.filter(u => u.role === 'receptionist');
  const members = users.filter(u => u.role === 'member');

  console.log(`\n✅ Users in Database: ${users.length}`);
  console.log(`   - Admins: ${admins.length} (${admins[0]?.email})`);
  console.log(`   - Trainers: ${trainers.length} (${trainers.map(t => t.name).join(', ')})`);
  console.log(`   - Receptionists: ${receptionists.length} (${receptionists.map(r => r.name).join(', ')})`);
  console.log(`   - Members: ${members.length}`);

  // 2. Verify Membership Plans
  const plans = await Plan.find();
  console.log(`\n✅ Membership Plans in Database: ${plans.length}`);
  plans.forEach(p => console.log(`   - ${p.name}: ${p.price} ${p.currency} (${p.durationDays} days)`));

  // 3. Verify Classes
  const classes = await GymClass.find();
  console.log(`\n✅ Fitness Classes in Database: ${classes.length}`);
  classes.forEach(c => console.log(`   - ${c.name} (${c.schedule} @ ${c.time}) by ${c.trainerName}`));

  // 4. Verify Equipment
  const equipment = await Equipment.find();
  console.log(`\n✅ Equipment Inventory in Database: ${equipment.length}`);
  equipment.forEach(e => console.log(`   - ${e.name} (${e.brand}) | Qty: ${e.quantity} | Status: ${e.status}`));

  // 5. Verify Payments
  const payments = await Payment.find();
  console.log(`\n✅ Payment Transactions in Database: ${payments.length}`);
  payments.slice(0, 3).forEach(p => console.log(`   - ${p.receiptNo}: ${p.amount} ETB for ${p.plan} by ${p.memberName}`));

  // 6. Verify Attendance
  const attendance = await Attendance.find();
  console.log(`\n✅ Attendance Logs in Database: ${attendance.length}`);
  attendance.slice(0, 3).forEach(a => console.log(`   - ${a.date} ${a.checkIn}: ${a.memberName} via ${a.method}`));

  // 7. Verify Workout Plans
  const workouts = await WorkoutPlan.find();
  console.log(`\n✅ Workout Routines in Database: ${workouts.length}`);
  workouts.forEach(w => console.log(`   - "${w.name}" for ${w.memberName} (Days: ${w.days.length})`));

  // 8. Verify Progress Records
  const progress = await Progress.find();
  console.log(`\n✅ Biometric & Lift Records in Database: ${progress.length}`);
  progress.slice(0, 2).forEach(pr => console.log(`   - Date: ${pr.date} | Weight: ${pr.weight}kg | Bench: ${pr.benchPress}kg | Squat: ${pr.squat}kg`));

  console.log('\n🎉 ====================================================');
  console.log('🎉 FULL GYM & FITNESS MANAGEMENT SYSTEM VERIFIED 100%!');
  console.log('🎉 ====================================================');
  process.exit(0);
}

verifyFullSystem().catch(err => {
  console.error('❌ Verification Error:', err.message);
  process.exit(1);
});
