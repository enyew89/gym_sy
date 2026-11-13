import express from 'express';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import GymClass from '../models/GymClass.js';
import { requireReceptionist } from '../middleware/auth.js';

const router = express.Router();

// Require receptionist or admin privileges
router.use(requireReceptionist);

/**
 * =========================================================================
 * 1. RECEPTIONIST DASHBOARD OVERVIEW
 * =========================================================================
 * @route   GET /api/receptionist/overview
 * @desc    Live stats: today's checkins, active members in gym, payments recorded, expiring memberships
 */
router.get('/overview', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Today's attendance
    const todayAttendance = await Attendance.find({ date: todayStr }).sort({ createdAt: -1 });
    const inGymCount = todayAttendance.filter((a) => !a.checkOut).length;

    // Today's payments
    const todayPayments = await Payment.find({ date: todayStr });
    const todayRevenue = todayPayments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Expiring or expired members needing renewal (within next 7 days or recently expired)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringUsers = await User.find({
      role: 'member',
      $or: [
        { status: 'expired' },
        { planExpiryDate: { $lte: sevenDaysFromNow } },
      ],
    })
      .select('-hash -salt')
      .limit(10)
      .sort({ planExpiryDate: 1 });

    const formattedExpiring = expiringUsers.map((u) => {
      const now = new Date();
      const expiry = u.planExpiryDate ? new Date(u.planExpiryDate) : now;
      const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return {
        id: u._id.toString(),
        name: u.name,
        phone: u.phone,
        email: u.email,
        plan: u.plan || 'Standard',
        expiryDate: u.planExpiryDate ? u.planExpiryDate.toISOString().split('T')[0] : 'Expired',
        daysLeft: diffDays,
        status: u.status,
      };
    });

    // Today's classes
    const classes = await GymClass.find({ status: 'active' }).limit(5);

    return res.json({
      success: true,
      stats: {
        todayCheckIns: todayAttendance.length,
        inGymNow: inGymCount,
        todayPaymentsCount: todayPayments.length,
        todayRevenue,
        expiringCount: formattedExpiring.length,
      },
      recentCheckIns: todayAttendance.slice(0, 8),
      expiringMembers: formattedExpiring,
      classes,
    });
  } catch (error) {
    console.error('Receptionist overview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 2. MEMBER REGISTRATION
 * =========================================================================
 * @route   POST /api/receptionist/members
 * @desc    Create new member account, assign plan, and record upfront payment
 */
router.post('/members', async (req, res) => {
  try {
    const {
      fullName,
      name,
      email,
      phone,
      gender,
      dob,
      age,
      fitnessGoal,
      planName,
      planDuration,
      paymentMethod,
      paidAmount,
      referenceNumber,
      notes,
      password,
    } = req.body;

    const memberName = fullName || name;
    if (!memberName || !email) {
      return res.status(400).json({ success: false, message: 'Member name and email are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with email "${email}" already exists.`,
      });
    }

    // Determine plan duration
    let durationInDays = Number(planDuration) || 30;
    const matchedPlan = await Plan.findOne({ name: planName || 'Standard' });
    if (matchedPlan && matchedPlan.duration) {
      durationInDays = matchedPlan.duration;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationInDays);

    // Create user
    const member = new User({
      name: memberName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      gender: gender || 'Male',
      age: age ? Number(age) : null,
      role: 'member',
      status: 'active',
      plan: planName || (matchedPlan ? matchedPlan.name : 'Standard'),
      planExpiryDate: expiryDate,
      fitnessGoal: fitnessGoal || 'General Fitness',
      createdBy: req.user._id,
    });

    const registeredUser = await User.register(
      member,
      password || 'GymMember@2026'
    );

    // Record Payment
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
    const paymentRecord = await Payment.create({
      memberId: registeredUser._id.toString(),
      memberName: registeredUser.name,
      memberEmail: registeredUser.email,
      amount: Number(paidAmount) || (matchedPlan ? matchedPlan.price : 1000),
      currency: 'ETB',
      plan: registeredUser.plan,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod || 'Cash',
      status: 'completed',
      receiptNo,
      notes: notes || `Initial registration payment (${referenceNumber || 'N/A'})`,
    });

    const userObj = registeredUser.toObject();
    delete userObj.hash;
    delete userObj.salt;

    return res.status(201).json({
      success: true,
      message: `Member ${registeredUser.name} registered successfully!`,
      member: userObj,
      payment: paymentRecord,
      receiptNo,
    });
  } catch (error) {
    console.error('Member registration error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 3. MEMBERSHIP VERIFICATION & ENTRY CONTROL
 * =========================================================================
 * @route   GET /api/receptionist/verify/:query
 * @desc    Search and verify member eligibility by ID, Email, Phone, or QR code
 */
router.get('/verify/:query', async (req, res) => {
  try {
    const rawQuery = decodeURIComponent(req.params.query).trim();
    if (!rawQuery) {
      return res.status(400).json({ success: false, message: 'Search parameter required.' });
    }

    let member = null;
    let searchId = null;
    let searchEmail = null;

    if (rawQuery.startsWith('GYM-PASS:')) {
      const parts = rawQuery.split(':');
      if (parts[1] && parts[1] !== 'none') searchId = parts[1].trim();
      if (parts[2] && parts[2] !== 'none') searchEmail = parts[2].trim().toLowerCase();
    } else {
      searchId = rawQuery;
      searchEmail = rawQuery.toLowerCase();
    }

    // Check if ID is a valid ObjectId
    if (searchId && /^[0-9a-fA-F]{24}$/.test(searchId)) {
      member = await User.findById(searchId);
    }

    // Try email or phone or name or fallback search
    if (!member) {
      const conditions = [];
      if (searchEmail) conditions.push({ email: searchEmail });
      if (searchId) {
        conditions.push({ phone: searchId });
        conditions.push({ name: new RegExp(searchId, 'i') });
      }
      if (conditions.length > 0) {
        member = await User.findOne({ $or: conditions });
      }
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        eligible: false,
        message: `No member record found for "${rawQuery}".`,
      });
    }

    // Evaluate Entry Eligibility
    const now = new Date();
    const expiry = member.planExpiryDate ? new Date(member.planExpiryDate) : null;
    const isExpired = member.status === 'expired' || (expiry && expiry < now);
    const isSuspended = member.status === 'suspended';

    let eligible = true;
    let reason = 'Active member in good standing. Gate access permitted.';

    if (isSuspended) {
      eligible = false;
      reason = 'Account suspended by management. Gate entry denied.';
    } else if (isExpired) {
      eligible = false;
      reason = `Membership expired on ${expiry ? expiry.toISOString().split('T')[0] : 'N/A'}. Renewal required before entry.`;
    }

    // Check if member already checked in today (only 1 check-in per calendar day allowed)
    const todayStr = new Date().toISOString().split('T')[0];
    const existingAttendanceToday = await Attendance.findOne({
      date: todayStr,
      $or: [
        { memberId: member._id.toString() },
        { memberEmail: member.email.toLowerCase().trim() },
      ],
    });

    if (existingAttendanceToday) {
      eligible = false;
      if (existingAttendanceToday.checkOut) {
        reason = `${member.name} has already attended the gym today (Checked in at ${existingAttendanceToday.checkIn}, out at ${existingAttendanceToday.checkOut}). Only 1 check-in per day is permitted.`;
      } else {
        reason = `${member.name} is already inside the gym today (Checked in at ${existingAttendanceToday.checkIn}). Must check out before re-entering.`;
      }
    }

    const daysRemaining = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : 0;

    const userObj = member.toObject();
    delete userObj.hash;
    delete userObj.salt;

    return res.json({
      success: true,
      eligible,
      reason,
      isExpired,
      isSuspended,
      daysRemaining,
      member: userObj,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 4. QR CHECK-IN & ATTENDANCE LOGGING
 * =========================================================================
 * @route   POST /api/receptionist/checkin
 * @desc    Record member entrance after eligibility verification
 */
router.post('/checkin', async (req, res) => {
  try {
    const { identifier, memberId, memberEmail, memberName, method } = req.body;
    const rawLookup = identifier || memberId || memberEmail || memberName;

    if (!rawLookup) {
      return res.status(400).json({ success: false, message: 'Member identifier required for check-in.' });
    }

    let member = null;
    let searchId = null;
    let searchEmail = null;

    if (typeof rawLookup === 'string' && rawLookup.startsWith('GYM-PASS:')) {
      const parts = rawLookup.split(':');
      if (parts[1] && parts[1] !== 'none') searchId = parts[1].trim();
      if (parts[2] && parts[2] !== 'none') searchEmail = parts[2].trim().toLowerCase();
    } else {
      searchId = memberId || rawLookup;
      searchEmail = memberEmail || (typeof rawLookup === 'string' && rawLookup.includes('@') ? rawLookup.toLowerCase() : null);
    }

    if (searchId && /^[0-9a-fA-F]{24}$/.test(searchId)) {
      member = await User.findById(searchId);
    }
    if (!member) {
      const conditions = [];
      if (searchEmail) conditions.push({ email: searchEmail });
      if (typeof rawLookup === 'string') {
        conditions.push({ phone: rawLookup });
        conditions.push({ name: new RegExp(rawLookup, 'i') });
      }
      if (conditions.length > 0) {
        member = await User.findOne({ $or: conditions });
      }
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        gateUnlocked: false,
        message: `No registered member found matching "${rawLookup}". Please verify the QR pass or register the member first.`,
      });
    }

    // Verify Eligibility
    const now = new Date();
    const expiry = member.planExpiryDate ? new Date(member.planExpiryDate) : null;

    if (member.status === 'suspended') {
      return res.status(403).json({
        success: false,
        gateUnlocked: false,
        message: `Access Denied: ${member.name}'s account is suspended.`,
        member: {
          id: member._id,
          name: member.name,
          plan: member.plan,
          status: member.status,
        },
      });
    }

    if (member.status === 'expired' || (expiry && expiry < now)) {
      return res.status(403).json({
        success: false,
        gateUnlocked: false,
        message: `Access Denied: ${member.name}'s membership expired on ${expiry ? expiry.toISOString().split('T')[0] : 'N/A'}. Please renew.`,
        member: {
          id: member._id,
          name: member.name,
          plan: member.plan,
          status: 'expired',
          planExpiryDate: member.planExpiryDate,
        },
      });
    }

    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    // Enforce strictly 1 attendance check-in per member per calendar day
    const targetMemberId = member ? member._id.toString() : (searchId || rawLookup);
    const existingAttendance = await Attendance.findOne({
      date: dateStr,
      $or: [
        { memberId: targetMemberId },
        ...(member?.email ? [{ memberEmail: member.email.toLowerCase().trim() }] : []),
        ...(searchEmail ? [{ memberEmail: searchEmail.toLowerCase().trim() }] : []),
      ],
    });

    if (existingAttendance) {
      const isInside = !existingAttendance.checkOut;
      const msg = isInside
        ? `Access Denied: ${existingAttendance.memberName} is already inside the gym today (Checked in at ${existingAttendance.checkIn}). Please check out first.`
        : `Access Denied: ${existingAttendance.memberName} already completed attendance today (Checked in at ${existingAttendance.checkIn}, out at ${existingAttendance.checkOut}). Only 1 check-in per day is allowed.`;

      return res.status(400).json({
        success: false,
        gateUnlocked: false,
        alreadyCheckedIn: true,
        message: msg,
        attendance: existingAttendance,
        member: {
          id: member?._id || existingAttendance.memberId,
          _id: member?._id || existingAttendance.memberId,
          name: member?.name || existingAttendance.memberName,
          plan: member?.plan || 'Standard',
          status: member?.status || 'active',
          planExpiryDate: member?.planExpiryDate,
          phone: member?.phone,
          email: member?.email || existingAttendance.memberEmail,
        },
      });
    }

    const attendanceRecord = await Attendance.create({
      memberId: member ? member._id.toString() : targetMemberId,
      memberName: member ? member.name : memberName || 'Walk-in Member',
      date: dateStr,
      checkIn: timeStr,
      checkOut: null,
      method: method || 'QR',
      status: 'active',
    });

    return res.status(201).json({
      success: true,
      gateUnlocked: true,
      message: `Access Granted! Welcome, ${attendanceRecord.memberName}.`,
      attendance: attendanceRecord,
      member,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 5. ATTENDANCE HISTORY & SEARCH
 * =========================================================================
 * @route   GET /api/receptionist/attendance
 * @desc    Search attendance records by date, member, and method
 */
router.get('/attendance', async (req, res) => {
  try {
    const filter = {};
    if (req.query.date && req.query.date !== 'all') {
      filter.date = req.query.date;
    }
    if (req.query.method && req.query.method !== 'all') {
      filter.method = req.query.method;
    }
    if (req.query.search) {
      filter.memberName = new RegExp(req.query.search, 'i');
    }

    const records = await Attendance.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: records.length,
      attendance: records,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/receptionist/attendance/:id/checkout
 * @desc    Record member check-out time
 */
router.post('/attendance/:id/checkout', async (req, res) => {
  try {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { checkOut: timeStr, status: 'checked_out' },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    return res.json({
      success: true,
      message: `Checked out ${record.memberName} at ${timeStr}.`,
      attendance: record,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 6. PAYMENT RECORDING & RECEIPT ISSUING
 * =========================================================================
 * @route   POST /api/receptionist/payments
 * @desc    Record POS in-person payment (Cash, Bank Transfer, Mobile Money) and issue receipt
 */
router.post('/payments', async (req, res) => {
  try {
    const { memberId, memberName, memberEmail, amount, plan, method, notes } = req.body;

    if (!memberName || !amount) {
      return res.status(400).json({ success: false, message: 'Member name and amount are required.' });
    }

    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;

    const payment = await Payment.create({
      memberId: memberId || '',
      memberName,
      memberEmail: memberEmail || '',
      amount: Number(amount),
      currency: 'ETB',
      plan: plan || 'Standard',
      date: new Date().toISOString().split('T')[0],
      method: method || 'Cash',
      status: 'completed',
      receiptNo,
      notes: notes || 'In-person front desk transaction',
    });

    // If payment is for a plan, update member
    if (memberId || memberEmail) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      const query = memberId && /^[0-9a-fA-F]{24}$/.test(memberId)
        ? { _id: memberId }
        : { email: (memberEmail || '').toLowerCase().trim() };

      await User.findOneAndUpdate(query, {
        status: 'active',
        plan: plan || 'Standard',
        planExpiryDate: expiry,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Payment of ${amount} ETB recorded with receipt ${receiptNo}!`,
      payment,
      receiptNo,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 7. MEMBERSHIP RENEWAL
 * =========================================================================
 * @route   POST /api/receptionist/renew
 * @desc    Process membership renewal, update expiry date, and issue receipt
 */
router.post('/renew', async (req, res) => {
  try {
    const { memberId, planName, durationDays, amount, paymentMethod, notes } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID is required for renewal.' });
    }

    let member = null;
    if (/^[0-9a-fA-F]{24}$/.test(memberId)) {
      member = await User.findById(memberId);
    }
    if (!member) {
      member = await User.findOne({
        $or: [
          { email: memberId.toLowerCase() },
          { name: new RegExp(memberId, 'i') },
        ],
      });
    }

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const daysToAdd = Number(durationDays) || 30;
    const now = new Date();

    // If current expiry is in the future, extend from that future date; otherwise extend from today
    let newExpiry = new Date();
    if (member.planExpiryDate && new Date(member.planExpiryDate) > now) {
      newExpiry = new Date(member.planExpiryDate);
    }
    newExpiry.setDate(newExpiry.getDate() + daysToAdd);

    member.status = 'active';
    if (planName) member.plan = planName;
    member.planExpiryDate = newExpiry;
    await member.save();

    // Create payment receipt for renewal
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
    const payment = await Payment.create({
      memberId: member._id.toString(),
      memberName: member.name,
      memberEmail: member.email,
      amount: Number(amount) || 1000,
      currency: 'ETB',
      plan: member.plan,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod || 'Cash',
      status: 'completed',
      receiptNo,
      notes: notes || `Membership renewed until ${newExpiry.toISOString().split('T')[0]}`,
    });

    const userObj = member.toObject();
    delete userObj.hash;
    delete userObj.salt;

    return res.json({
      success: true,
      message: `Membership renewed for ${member.name} until ${newExpiry.toISOString().split('T')[0]}!`,
      member: userObj,
      payment,
      receiptNo,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 8. CLASS BOOKINGS & AVAILABILITY
 * =========================================================================
 * @route   GET /api/receptionist/classes
 * @desc    View class availability and booked members
 */
router.get('/classes', async (req, res) => {
  try {
    const classes = await GymClass.find({ status: 'active' }).sort({ time: 1 });
    return res.json({ success: true, count: classes.length, classes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/receptionist/classes/:id/book
 * @desc    Book a member into a class on their behalf
 */
router.post('/classes/:id/book', async (req, res) => {
  try {
    const { memberId, notes } = req.body;
    if (!memberId) {
      return res.status(400).json({ success: false, message: 'Member ID required for booking.' });
    }

    const gymClass = await GymClass.findById(req.params.id);
    if (!gymClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    let member = null;
    if (/^[0-9a-fA-F]{24}$/.test(memberId)) {
      member = await User.findById(memberId);
    }
    if (!member) {
      member = await User.findOne({
        $or: [{ email: memberId.toLowerCase() }, { name: new RegExp(memberId, 'i') }],
      });
    }

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Check member status
    if (member.status === 'expired' || member.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: `Cannot book: ${member.name}'s membership is ${member.status}. Please renew first.`,
      });
    }

    // Check capacity
    if (gymClass.enrolled >= gymClass.capacity) {
      return res.status(400).json({ success: false, message: 'Class is already at full capacity.' });
    }

    const memberIdStr = member._id.toString();
    if (gymClass.enrolledMembers.includes(memberIdStr)) {
      return res.status(400).json({ success: false, message: `${member.name} is already booked in this class.` });
    }

    gymClass.enrolledMembers.push(memberIdStr);
    gymClass.enrolled += 1;
    if (gymClass.enrolled >= gymClass.capacity) {
      gymClass.status = 'full';
    }
    await gymClass.save();

    return res.json({
      success: true,
      message: `Booked ${member.name} into ${gymClass.name}!`,
      gymClass,
      member: { id: member._id, name: member.name, email: member.email, plan: member.plan },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/receptionist/members
 * @desc    Quick member search for dropdowns and lookup
 */
router.get('/members', async (req, res) => {
  try {
    const query = (req.query.search || '').trim();
    const filter = { role: 'member' };
    if (query) {
      filter.$or = [
        { name: new RegExp(query, 'i') },
        { email: new RegExp(query, 'i') },
        { phone: new RegExp(query, 'i') },
      ];
    }
    const members = await User.find(filter)
      .select('-hash -salt')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, count: members.length, members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
