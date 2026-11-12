import express from 'express';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import Equipment from '../models/Equipment.js';
import GymClass from '../models/GymClass.js';
import Feedback from '../models/Feedback.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply requireAdmin to all routes in this router
router.use(requireAdmin);

/**
 * =========================================================================
 * 1. DASHBOARD OVERVIEW
 * =========================================================================
 * @route   GET /api/admin/overview
 * @desc    Comprehensive gym statistics: members, revenue, attendance, equipment
 * @access  Private (Admin only)
 */
router.get('/overview', async (req, res) => {
  try {
    // 1. Members count
    const totalMembers = await User.countDocuments({ role: 'member' });
    const activeMembers = await User.countDocuments({ role: 'member', status: 'active' });
    const inactiveMembers = await User.countDocuments({ role: 'member', status: { $in: ['inactive', 'suspended'] } });
    const expiredMembers = await User.countDocuments({ role: 'member', status: 'expired' });

    // 2. Staff count
    const totalTrainers = await User.countDocuments({ role: 'trainer' });
    const totalReceptionists = await User.countDocuments({ role: 'receptionist' });
    const totalStaff = totalTrainers + totalReceptionists;

    // 3. Plans
    const plans = await Plan.find().sort({ price: 1 });

    // 4. Financial Performance & Revenue
    const allPayments = await Payment.find();
    const completedPayments = allPayments.filter((p) => p.status === 'completed');
    const pendingPayments = allPayments.filter((p) => p.status === 'pending');

    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const unpaidAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate this month's revenue
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const thisMonthPayments = completedPayments.filter((p) => {
      const d = new Date(p.date || p.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const monthlyRevenue = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // 5. Attendance
    const todayStr = now.toISOString().split('T')[0];
    const todayAttendance = await Attendance.countDocuments({ date: todayStr });
    const totalVisits = await Attendance.countDocuments();
    // Unique dates in attendance to compute daily average
    const uniqueDates = await Attendance.distinct('date');
    const avgDailyAttendance = uniqueDates.length > 0
      ? Math.round(totalVisits / uniqueDates.length)
      : todayAttendance;

    // 6. Equipment
    const allEquipment = await Equipment.find();
    const totalEquipmentUnits = allEquipment.reduce((acc, e) => acc + (e.quantity || 0), 0);
    const workingUnits = allEquipment.reduce((acc, e) => acc + (e.working || 0), 0);
    const maintenanceUnits = allEquipment.reduce((acc, e) => acc + (e.maintenance || 0), 0);
    const equipmentHealthPercentage = totalEquipmentUnits > 0
      ? Math.round((workingUnits / totalEquipmentUnits) * 100)
      : 100;

    // 7. Classes
    const totalClasses = await GymClass.countDocuments();

    // 8. Membership breakdown by tier
    const memberUsers = await User.find({ role: 'member' }).select('plan status');
    const tierMap = {};
    memberUsers.forEach((m) => {
      const p = m.plan && m.plan !== 'None' ? m.plan : 'Basic';
      tierMap[p] = (tierMap[p] || 0) + 1;
    });
    const tierColors = ['#09090b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];
    const membershipDistribution = Object.keys(tierMap).map((name, i) => ({
      name,
      count: tierMap[name],
      value: totalMembers > 0 ? Math.round((tierMap[name] / totalMembers) * 100) : 0,
      color: tierColors[i % tierColors.length],
    }));

    // 9. Recent payments & recent members
    const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5);
    const recentMembers = await User.find({ role: 'member' })
      .select('-hash -salt')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        inactiveMembers,
        expiredMembers,
        totalTrainers,
        totalReceptionists,
        totalStaff,
        totalRevenue,
        monthlyRevenue,
        unpaidCount: pendingPayments.length,
        unpaidAmount,
        todayAttendance,
        avgDailyAttendance,
        totalVisits,
        equipmentCategories: allEquipment.length,
        totalEquipmentUnits,
        workingUnits,
        maintenanceUnits,
        equipmentHealthPercentage,
        totalClasses,
        plansCount: plans.length,
      },
      membershipDistribution,
      recentPayments,
      recentMembers,
      plans,
    });
  } catch (error) {
    console.error('Overview error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch overview metrics.',
    });
  }
});

/**
 * =========================================================================
 * 2. STAFF MANAGEMENT (Trainers & Receptionists)
 * =========================================================================
 */

/**
 * @route   POST /api/admin/create-staff
 * @desc    Admin-only creation of Trainer and Receptionist accounts
 */
router.post('/create-staff', async (req, res) => {
  try {
    const { name, email, phone, role, specialization, certifications, password, status } = req.body;

    if (!role || !['trainer', 'receptionist'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff role. Admin can only create "trainer" or "receptionist" accounts.',
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and temporary password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with email ${email} already exists.`,
      });
    }

    const certList = Array.isArray(certifications)
      ? certifications
      : certifications
      ? certifications.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    const newStaff = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      role,
      status: status || 'active',
      specialization: role === 'trainer' ? specialization || 'General Fitness & Conditioning' : '',
      certifications: role === 'trainer' ? certList : [],
      createdBy: req.user._id,
    });

    const registeredStaff = await User.register(newStaff, password);

    return res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully for ${name}!`,
      staff: {
        _id: registeredStaff._id,
        id: registeredStaff._id,
        name: registeredStaff.name,
        email: registeredStaff.email,
        phone: registeredStaff.phone,
        role: registeredStaff.role,
        status: registeredStaff.status,
        specialization: registeredStaff.specialization,
        certifications: registeredStaff.certifications,
        createdAt: registeredStaff.createdAt,
      },
    });
  } catch (error) {
    console.error('Create Staff Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while creating staff account.',
    });
  }
});

/**
 * @route   GET /api/admin/staff
 * @desc    Get all staff members (trainers, receptionists, admins)
 */
router.get('/staff', async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['trainer', 'receptionist', 'admin'] },
    }).select('-hash -salt').sort({ createdAt: -1 });

    // Populate assigned members count for trainers
    const staffWithAssigned = await Promise.all(
      staff.map(async (s) => {
        const staffObj = s.toObject();
        staffObj.id = s._id.toString();
        if (s.role === 'trainer') {
          const assignedCount = await User.countDocuments({ trainerId: s._id });
          staffObj.assignedClientsCount = assignedCount;
        }
        return staffObj;
      })
    );

    return res.json({
      success: true,
      count: staffWithAssigned.length,
      staff: staffWithAssigned,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch staff members.',
    });
  }
});

/**
 * @route   PUT /api/admin/staff/:id
 * @desc    Update staff details (name, phone, specialization, certifications, status)
 */
router.put('/staff/:id', async (req, res) => {
  try {
    const { name, phone, specialization, certifications, status, role } = req.body;
    const certList = Array.isArray(certifications)
      ? certifications
      : typeof certifications === 'string'
      ? certifications.split(',').map((c) => c.trim()).filter(Boolean)
      : undefined;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (role && ['trainer', 'receptionist'].includes(role)) updateFields.role = role;
    if (status && ['active', 'inactive', 'suspended'].includes(status)) updateFields.status = status;
    if (specialization !== undefined) updateFields.specialization = specialization;
    if (certList !== undefined) updateFields.certifications = certList;

    const updatedStaff = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('-hash -salt');

    if (!updatedStaff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    return res.json({
      success: true,
      message: `Staff member ${updatedStaff.name} updated successfully!`,
      staff: updatedStaff,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PATCH /api/admin/staff/:id/status
 * @desc    Toggle or update staff active/inactive status
 */
router.patch('/staff/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-hash -salt');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    return res.json({
      success: true,
      message: `Staff status updated to ${status}`,
      staff,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/admin/staff/:id
 * @desc    Delete a staff member account
 */
router.delete('/staff/:id', async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    if (staff.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: `Staff member ${staff.name} deleted successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 3. MEMBER MANAGEMENT (Register, Update, Deactivate, Delete)
 * =========================================================================
 */

/**
 * @route   GET /api/admin/members
 * @desc    Get all registered gym members with trainer populate
 */
router.get('/members', async (req, res) => {
  try {
    const members = await User.find({ role: 'member' })
      .populate('trainerId', 'name specialization')
      .select('-hash -salt')
      .sort({ createdAt: -1 });

    const formatted = members.map((m) => {
      const obj = m.toObject();
      obj.id = m._id.toString();
      obj.trainerName = m.trainerId?.name || m.trainerName || 'None assigned';
      return obj;
    });

    return res.json({
      success: true,
      count: formatted.length,
      members: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch gym members.',
    });
  }
});

/**
 * @route   POST /api/admin/members
 * @desc    Admin directly registers a new gym member
 */
router.post('/members', async (req, res) => {
  try {
    const { name, email, phone, gender, age, plan, trainerId, status, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Member with email ${email} already exists` });
    }

    const memberPassword = password || 'member123';
    const planDurationDays = plan === 'Annual Pass' || plan?.toLowerCase().includes('annual') ? 365 : 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + planDurationDays);

    let trainerName = '';
    if (trainerId) {
      const tr = await User.findById(trainerId);
      if (tr) trainerName = tr.name;
    }

    const newMember = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      role: 'member',
      gender: gender || 'Male',
      age: Number(age) || 25,
      plan: plan || 'Standard',
      planExpiryDate: expiry,
      trainerId: trainerId || null,
      trainerName,
      status: status || 'active',
      createdBy: req.user._id,
    });

    const registered = await User.register(newMember, memberPassword);

    // Also record initial payment if plan is assigned
    if (plan && plan !== 'None') {
      const planDoc = await Plan.findOne({ name: plan });
      const planAmount = planDoc?.price || (plan === 'Premium' ? 2000 : plan === 'Standard' ? 1000 : 500);
      await Payment.create({
        memberId: registered._id.toString(),
        memberName: registered.name,
        memberEmail: registered.email,
        amount: planAmount,
        currency: 'ETB',
        plan: plan,
        method: 'Cash',
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        notes: 'Initial registration payment recorded by admin',
      });
    }

    return res.status(201).json({
      success: true,
      message: `Member ${registered.name} registered successfully!`,
      member: {
        _id: registered._id,
        id: registered._id,
        name: registered.name,
        email: registered.email,
        phone: registered.phone,
        gender: registered.gender,
        age: registered.age,
        plan: registered.plan,
        planExpiryDate: registered.planExpiryDate,
        trainerId: registered.trainerId,
        trainerName: registered.trainerName,
        status: registered.status,
        createdAt: registered.createdAt,
      },
    });
  } catch (error) {
    console.error('Register member error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/admin/members/:id
 * @desc    Update member profile, plan, status, trainer
 */
router.put('/members/:id', async (req, res) => {
  try {
    const { name, email, phone, gender, age, plan, status, trainerId, planExpiryDate } = req.body;
    const updateFields = {};

    if (name) updateFields.name = name.trim();
    if (email) updateFields.email = email.toLowerCase().trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (gender) updateFields.gender = gender;
    if (age !== undefined) updateFields.age = Number(age);
    if (plan) updateFields.plan = plan;
    if (status) updateFields.status = status;
    if (planExpiryDate) updateFields.planExpiryDate = new Date(planExpiryDate);

    if (trainerId !== undefined) {
      updateFields.trainerId = trainerId || null;
      if (trainerId) {
        const tr = await User.findById(trainerId);
        updateFields.trainerName = tr ? tr.name : '';
      } else {
        updateFields.trainerName = '';
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('-hash -salt');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    return res.json({
      success: true,
      message: `Member ${updated.name} updated successfully!`,
      member: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PATCH /api/admin/members/:id/status
 * @desc    Deactivate / activate a member
 */
router.patch('/members/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['active', 'inactive', 'suspended', 'expired'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const member = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-hash -salt');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    return res.json({
      success: true,
      message: `Member status set to "${status}"`,
      member,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/admin/members/:id
 * @desc    Delete a gym member
 */
router.delete('/members/:id', async (req, res) => {
  try {
    const member = await User.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    return res.json({
      success: true,
      message: `Member ${member.name} deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 4. TRAINER MANAGEMENT (Assign & Unassign Members)
 * =========================================================================
 */

/**
 * @route   POST /api/admin/assign-trainer
 * @desc    Assign a member to a personal trainer
 */
router.post('/assign-trainer', async (req, res) => {
  try {
    const { memberId, trainerId } = req.body;
    if (!memberId || !trainerId) {
      return res.status(400).json({ success: false, message: 'Both memberId and trainerId are required' });
    }

    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({ success: false, message: 'Trainer not found or user is not a trainer' });
    }

    const member = await User.findByIdAndUpdate(
      memberId,
      { trainerId: trainer._id, trainerName: trainer.name },
      { new: true }
    ).select('-hash -salt');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    return res.json({
      success: true,
      message: `Member ${member.name} assigned to Trainer ${trainer.name}!`,
      member,
      trainer,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/admin/unassign-trainer
 * @desc    Remove trainer assignment from a member
 */
router.post('/unassign-trainer', async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ success: false, message: 'memberId is required' });
    }

    const member = await User.findByIdAndUpdate(
      memberId,
      { trainerId: null, trainerName: '' },
      { new: true }
    ).select('-hash -salt');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    return res.json({
      success: true,
      message: `Trainer assignment removed from ${member.name}`,
      member,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 5. MEMBERSHIP RENEWALS MANAGEMENT
 * =========================================================================
 */

/**
 * @route   GET /api/admin/renewals
 * @desc    Get expiring (within 7 days) and expired member subscriptions
 */
router.get('/renewals', async (req, res) => {
  try {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    // Members with expired status or planExpiryDate <= 7 days
    const expiringMembers = await User.find({
      role: 'member',
      $or: [
        { status: 'expired' },
        { planExpiryDate: { $lte: in7Days } },
      ],
    }).select('-hash -salt').sort({ planExpiryDate: 1 });

    return res.json({
      success: true,
      count: expiringMembers.length,
      renewals: expiringMembers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/admin/members/:id/renew
 * @desc    Renew a member subscription (extends expiry, records payment, sets status active)
 */
router.post('/members/:id/renew', async (req, res) => {
  try {
    const { plan, durationDays, amount, method } = req.body;
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const selectedPlan = plan || member.plan || 'Standard';
    const days = Number(durationDays) || (selectedPlan.toLowerCase().includes('annual') ? 365 : 30);

    // Calculate new expiry date
    let baseDate = new Date();
    if (member.planExpiryDate && new Date(member.planExpiryDate) > baseDate) {
      baseDate = new Date(member.planExpiryDate);
    }
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    // Update user
    member.plan = selectedPlan;
    member.planExpiryDate = newExpiry;
    member.status = 'active';
    await member.save();

    // Create payment transaction
    const planDoc = await Plan.findOne({ name: selectedPlan });
    const paymentAmount = Number(amount) || planDoc?.price || 1000;

    const payment = await Payment.create({
      memberId: member._id.toString(),
      memberName: member.name,
      memberEmail: member.email,
      amount: paymentAmount,
      currency: 'ETB',
      plan: selectedPlan,
      method: method || 'Cash',
      status: 'completed',
      date: new Date().toISOString().split('T')[0],
      notes: `Membership renewal for ${days} days`,
    });

    return res.json({
      success: true,
      message: `Membership for ${member.name} renewed until ${newExpiry.toISOString().split('T')[0]}!`,
      member,
      payment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 6. REPORTS & ANALYTICS
 * =========================================================================
 * @route   GET /api/admin/reports
 * @desc    Aggregated analytics: Membership growth, financial performance, attendance
 */
router.get('/reports', async (req, res) => {
  try {
    // 1. Financial Performance: monthly revenue from payments
    const allPayments = await Payment.find({ status: 'completed' });
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate the last 6 months dynamically based on the current date
    const now = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(monthNames[d.getMonth()]);
    }

    const monthlyRevenueMap = {};
    allPayments.forEach((p) => {
      const d = new Date(p.date || p.createdAt);
      const m = monthNames[d.getMonth()];
      monthlyRevenueMap[m] = (monthlyRevenueMap[m] || 0) + (p.amount || 0);
    });

    const revenueChartData = allPayments.length > 0
      ? last6Months.map((m) => ({
          month: m,
          revenue: monthlyRevenueMap[m] || 0,
        }))
      : [];

    // Payment methods breakdown
    const methodMap = {};
    allPayments.forEach((p) => {
      const m = p.method || 'Cash';
      methodMap[m] = (methodMap[m] || 0) + (p.amount || 0);
    });
    const paymentMethodData = Object.keys(methodMap).map((m) => ({
      name: m,
      value: methodMap[m],
    }));

    // 2. Membership Growth
    const allMembers = await User.find({ role: 'member' }).select('createdAt status plan');
    const totalMembers = allMembers.length;
    const activeMembers = allMembers.filter((m) => m.status === 'active').length;

    const monthlySignups = {};
    allMembers.forEach((m) => {
      const d = new Date(m.createdAt);
      const mon = monthNames[d.getMonth()];
      monthlySignups[mon] = (monthlySignups[mon] || 0) + 1;
    });

    const membershipGrowthData = allMembers.length > 0
      ? last6Months.map((m) => ({
          month: m,
          total: totalMembers,
          active: activeMembers,
          new: monthlySignups[m] || 0,
          churned: 0,
        }))
      : [];

    // Plan distribution
    const planCounts = {};
    allMembers.forEach((m) => {
      const p = m.plan && m.plan !== 'None' ? m.plan : 'Standard';
      planCounts[p] = (planCounts[p] || 0) + 1;
    });
    const planDistributionData = Object.keys(planCounts).map((name) => ({
      name,
      value: planCounts[name],
    }));

    // 3. Attendance Analytics
    const allAttendance = await Attendance.find();
    const qrCount = allAttendance.filter((a) => a.method === 'QR').length;
    const manualCount = allAttendance.filter((a) => a.method === 'Manual').length;
    const checkInMethods = [
      { name: 'QR Code Scan', count: qrCount },
      { name: 'Front Desk Manual', count: manualCount },
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const attendanceByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    allAttendance.forEach((a) => {
      const d = new Date(a.date || a.checkIn || a.createdAt);
      const day = dayNames[d.getDay()];
      if (attendanceByDay[day] !== undefined) attendanceByDay[day]++;
    });

    const attendanceChartData = allAttendance.length > 0
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
          day,
          count: attendanceByDay[day] || 0,
        }))
      : [];

    const peakHoursData = [
      { timeSlot: '06:00 - 08:00', checkIns: 0 },
      { timeSlot: '08:00 - 10:00', checkIns: 0 },
      { timeSlot: '12:00 - 14:00', checkIns: 0 },
      { timeSlot: '16:00 - 18:00', checkIns: 0 },
      { timeSlot: '18:00 - 20:00', checkIns: 0 },
      { timeSlot: '20:00 - 22:00', checkIns: 0 },
    ];

    return res.json({
      success: true,
      revenueChartData,
      paymentMethodData,
      membershipGrowthData,
      planDistributionData,
      attendanceChartData,
      checkInMethods,
      peakHoursData,
      summary: {
        totalRevenue: allPayments.reduce((s, p) => s + (p.amount || 0), 0),
        totalMembers,
        activeMembers,
        totalVisits: allAttendance.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 7. MEMBER FEEDBACK & EQUIPMENT COMPLAINTS
 * =========================================================================
 */

// @route   GET /api/admin/feedback
// @desc    Fetch all member feedback and equipment complaints
router.get('/feedback', async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;

    const feedbackList = await Feedback.find(filter).sort({ createdAt: -1 });

    const allFeedbacks = await Feedback.find();
    const stats = {
      total: allFeedbacks.length,
      equipmentIssues: allFeedbacks.filter((f) => f.type === 'equipment_issue').length,
      open: allFeedbacks.filter((f) => f.status === 'open').length,
      inReview: allFeedbacks.filter((f) => f.status === 'in_review').length,
      resolved: allFeedbacks.filter((f) => f.status === 'resolved').length,
      urgent: allFeedbacks.filter((f) => f.priority === 'urgent' && f.status !== 'resolved').length,
    };

    return res.json({
      success: true,
      count: feedbackList.length,
      feedback: feedbackList,
      stats,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/admin/feedback/:id
// @desc    Update feedback status (open, in_review, resolved) and staff response
router.patch('/feedback/:id', async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (adminResponse !== undefined) updateData.adminResponse = adminResponse;

    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Feedback report not found' });
    }

    return res.json({
      success: true,
      message: `Report marked as ${updated.status.replace('_', ' ')}!`,
      feedback: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/feedback/:id
// @desc    Delete a feedback report
router.delete('/feedback/:id', async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Feedback report not found' });
    }
    return res.json({ success: true, message: 'Feedback report removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
