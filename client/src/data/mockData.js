// Clean Production Data Baseline (All dummy sample records removed - only Master Admin configured)

export const currentUser = {
  id: 'admin',
  name: 'Abebe Kebede',
  email: 'admin@gympro.com',
  role: 'admin',
  avatar: null,
  phone: '+251911223344',
};

// All entities start clean for the Gym Owner to populate
export const members = [];
export const staff = [];

// Standard Membership Tiers
export const plans = [
  {
    id: 'p1',
    name: 'Basic',
    price: 500,
    currency: 'ETB',
    duration: 30,
    durationUnit: 'days',
    features: ['Gym floor access', 'Locker room usage', 'Standard cardio & weights'],
    color: 'slate',
    memberCount: 0,
  },
  {
    id: 'p2',
    name: 'Standard',
    price: 1000,
    currency: 'ETB',
    duration: 30,
    durationUnit: 'days',
    features: ['All Basic features', 'Group fitness classes', 'Sauna & steam room', 'Diet consultation'],
    color: 'blue',
    memberCount: 0,
    isPopular: true,
  },
  {
    id: 'p3',
    name: 'Premium',
    price: 2000,
    currency: 'ETB',
    duration: 30,
    durationUnit: 'days',
    features: [
      'All Standard features',
      'Dedicated Personal Trainer',
      'AI workout assistant',
      'Priority locker & towel service',
      'Guest passes (2/mo)',
    ],
    color: 'amber',
    memberCount: 0,
  },
  {
    id: 'p4',
    name: 'Annual VIP',
    price: 18000,
    currency: 'ETB',
    duration: 365,
    durationUnit: 'days',
    features: ['All Premium features for 1 full year', '3 months free included', 'Unlimited access to all studios'],
    color: 'amber',
    memberCount: 0,
  },
];

export const payments = [];
export const attendance = [];
export const classes = [];
export const equipment = [];
export const workoutPlans = [];
export const progressData = [];

export const dashboardStats = {
  totalMembers: 0,
  activeMembers: 0,
  newThisMonth: 0,
  expiringSoon: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  todayAttendance: 0,
  avgDailyAttendance: 0,
  totalTrainers: 0,
  totalClasses: 0,
  equipmentIssues: 0,
  occupancyRate: 0,
};

export const revenueChartData = [];
export const membershipGrowthData = [];
export const attendanceChartData = [];
export const notifications = [];
