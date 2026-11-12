import User from '../models/User.js';
import Plan from '../models/Plan.js';

/**
 * Production Bootstrap Seeder:
 * - Ensures standard membership tiers exist
 * - Ensures the single Master Admin account exists (configured via .env or safe defaults)
 * - Zero dummy staff, zero dummy members, zero dummy classes, zero dummy equipment.
 * - The Gym Owner (Admin) manages their own staff, classes, and equipment from the dashboard.
 */
export async function seedDatabase() {
  try {
    // 1. Seed Standard Membership Plans (if not already existing)
    const plansCount = await Plan.countDocuments();
    if (plansCount === 0) {
      const plans = [
        {
          planId: 'p1',
          name: 'Basic',
          price: 500,
          currency: 'ETB',
          durationDays: 30,
          features: ['Gym floor access', 'Locker room usage', 'Standard cardio & weights'],
          activeSubscribers: 0,
        },
        {
          planId: 'p2',
          name: 'Standard',
          price: 1000,
          currency: 'ETB',
          durationDays: 30,
          features: ['All Basic features', 'Group fitness classes', 'Sauna & steam room', 'Diet consultation'],
          activeSubscribers: 0,
          isPopular: true,
        },
        {
          planId: 'p3',
          name: 'Premium',
          price: 2000,
          currency: 'ETB',
          durationDays: 30,
          features: [
            'All Standard features',
            'Dedicated Personal Trainer',
            'AI workout assistant',
            'Priority locker & towel service',
            'Guest passes (2/mo)',
          ],
          activeSubscribers: 0,
        },
        {
          planId: 'p4',
          name: 'Annual VIP',
          price: 18000,
          currency: 'ETB',
          durationDays: 365,
          features: ['All Premium features for 1 full year', '3 months free included', 'Unlimited access to all studios'],
          activeSubscribers: 0,
        },
      ];
      await Plan.insertMany(plans);
      console.log(`✅ Seeded ${plans.length} standard membership plans.`);
    }

    // 2. Ensure Single Master Admin Account exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const adminName = process.env.ADMIN_NAME || 'Abebe Kebede';
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gympro.com').toLowerCase().trim();
      const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
      const adminPhone = process.env.ADMIN_PHONE || '+251911223344';

      console.log(`👑 Creating Master Admin account: ${adminEmail}...`);
      const admin = new User({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        role: 'admin',
        status: 'active',
      });
      await User.register(admin, adminPassword);
      console.log(`✅ Master Admin provisioned successfully (${adminEmail}).`);
    } else {
      console.log(`👑 Master Admin account verified: ${existingAdmin.email}`);
    }

    console.log('----------------------------------------------------');
    console.log('🏋️ GymPro Clean Production Ready:');
    console.log('👑 Admin: Only 1 Master Admin configured.');
    console.log('👥 Staff & Classes: Blank slate for Gym Owner to populate.');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}
