import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import GymClass from '../models/GymClass.js';
import Equipment from '../models/Equipment.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import Feedback from '../models/Feedback.js';
import Message from '../models/Message.js';
import Progress from '../models/Progress.js';
import TrainerNote from '../models/TrainerNote.js';
import WorkoutLog from '../models/WorkoutLog.js';
import WorkoutPlan from '../models/WorkoutPlan.js';

async function cleanDatabase() {
  try {
    await connectDB();
    console.log('🧹 Starting cleanup: Deleting everything EXCEPT Master Admin and Plans...');

    // 1. Delete all non-admin users
    const deleteNonAdminUsers = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`Deleted ${deleteNonAdminUsers.deletedCount} non-admin user accounts.`);

    // 2. Ensure at least one Admin exists
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('No admin found, creating default Master Admin...');
      const adminName = process.env.ADMIN_NAME || 'System Administrator';
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gympro.com').toLowerCase().trim();
      const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
      const adminPhone = process.env.ADMIN_PHONE || '+251911223344';

      const admin = new User({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        role: 'admin',
        status: 'active',
      });
      await User.register(admin, adminPassword);
      console.log(`✅ Master Admin created: ${adminEmail}`);
    } else {
      const existingAdmins = await User.find({ role: 'admin' }).select('name email role');
      console.log('Preserved Master Admin account(s):', existingAdmins);
    }

    // 3. Delete classes and equipment (to be created by gym owner)
    const delClasses = await GymClass.deleteMany({});
    console.log(`Deleted ${delClasses.deletedCount} sample gym classes.`);

    const delEquipment = await Equipment.deleteMany({});
    console.log(`Deleted ${delEquipment.deletedCount} sample equipment units.`);

    // 4. Delete payments, attendance, workout plans, logs, notes, messages, feedbacks
    const delPayments = await Payment.deleteMany({});
    const delAttendance = await Attendance.deleteMany({});
    const delWorkoutPlans = await WorkoutPlan.deleteMany({});
    const delWorkoutLogs = await WorkoutLog.deleteMany({});
    const delProgress = await Progress.deleteMany({});
    const delNotes = await TrainerNote.deleteMany({});
    const delMessages = await Message.deleteMany({});
    const delFeedbacks = await Feedback.deleteMany({});

    console.log(`Deleted ${delPayments.deletedCount} payments.`);
    console.log(`Deleted ${delAttendance.deletedCount} attendance logs.`);
    console.log(`Deleted ${delWorkoutPlans.deletedCount} workout plans.`);
    console.log(`Deleted ${delWorkoutLogs.deletedCount} workout logs.`);
    console.log(`Deleted ${delProgress.deletedCount} progress records.`);
    console.log(`Deleted ${delNotes.deletedCount} trainer notes.`);
    console.log(`Deleted ${delMessages.deletedCount} messages.`);
    console.log(`Deleted ${delFeedbacks.deletedCount} feedbacks.`);

    // Clear sessions
    try {
      await mongoose.connection.collection('sessions').deleteMany({});
      console.log('Cleared expired sessions.');
    } catch (e) {
      // ignore
    }

    const plansCount = await Plan.countDocuments();
    console.log(`Membership plans intact: ${plansCount} tiers.`);

    const remainingUsers = await User.find({}).select('name email role status');
    console.log('====================================');
    console.log('✨ Cleanup Complete! Only Master Admin remains:');
    console.log(JSON.stringify(remainingUsers, null, 2));
    console.log('====================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanDatabase();
