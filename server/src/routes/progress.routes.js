import express from 'express';
import Progress from '../models/Progress.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// GET progress records for a member
router.get('/:memberId', isAuthenticated, async (req, res) => {
  try {
    const memberId = req.params.memberId || req.user?._id?.toString();
    const records = await Progress.find({ memberId }).sort({ date: 1 });
    res.json({ success: true, count: records.length, progress: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add progress record
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { memberId, date, weight, bodyFat, chest, waist, arms, benchPress, squat, deadlift, notes } = req.body;
    const targetMemberId = memberId || req.user?._id?.toString();

    if (!weight) {
      return res.status(400).json({ success: false, message: 'Weight is required' });
    }

    const record = await Progress.create({
      memberId: targetMemberId,
      date: date || new Date().toISOString().split('T')[0],
      weight: Number(weight),
      bodyFat: Number(bodyFat) || 0,
      chest: Number(chest) || 0,
      waist: Number(waist) || 0,
      arms: Number(arms) || 0,
      benchPress: Number(benchPress) || 0,
      squat: Number(squat) || 0,
      deadlift: Number(deadlift) || 0,
      notes: notes || '',
    });

    res.status(201).json({ success: true, message: 'Progress recorded successfully', progress: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
