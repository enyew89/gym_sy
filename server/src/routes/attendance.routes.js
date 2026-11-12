import express from 'express';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// GET attendance list (today or all)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) {
      filter.date = req.query.date;
    }
    if (req.query.memberId) {
      filter.memberId = req.query.memberId;
    }
    const records = await Attendance.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, attendance: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST check in (QR or Manual)
router.post('/checkin', isAuthenticated, async (req, res) => {
  try {
    const { identifier, memberId, memberEmail, memberName, method } = req.body;
    let searchId = memberId || identifier;
    let searchEmail = memberEmail;

    if (typeof searchId === 'string' && searchId.startsWith('GYM-PASS:')) {
      const parts = searchId.split(':');
      if (parts[1] && parts[1] !== 'none') searchId = parts[1].trim();
      if (parts[2] && parts[2] !== 'none') searchEmail = parts[2].trim().toLowerCase();
    }

    // Look up user to verify membership status
    let user = null;
    if (searchId && /^[0-9a-fA-F]{24}$/.test(searchId)) {
      user = await User.findById(searchId).catch(() => null);
    }
    if (!user && searchEmail) {
      user = await User.findOne({ email: searchEmail.toLowerCase().trim() });
    }
    if (!user && memberName) {
      user = await User.findOne({ name: new RegExp(memberName, 'i') });
    }

    if (user) {
      // Check if membership is expired or suspended
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          gateUnlocked: false,
          message: `Access Denied: ${user.name}'s account is suspended.`,
          member: user,
        });
      }

      if (user.status === 'expired') {
        return res.status(403).json({
          success: false,
          gateUnlocked: false,
          message: `Access Denied: ${user.name}'s membership has expired! Please renew.`,
          member: user,
        });
      }
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];

    const record = await Attendance.create({
      memberId: user ? user._id.toString() : memberId || 'walkin',
      memberName: user ? user.name : memberName || 'Walk-in Member',
      date: dateStr,
      checkIn: timeStr,
      checkOut: null,
      method: method || 'QR',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      gateUnlocked: true,
      message: `Access Granted! Welcome, ${record.memberName}.`,
      attendance: record,
      member: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST check out
router.post('/:id/checkout', isAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { checkOut: timeStr, status: 'checked_out' },
      { new: true }
    );
    res.json({ success: true, message: 'Check-out recorded', attendance: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
