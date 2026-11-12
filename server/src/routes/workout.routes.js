import express from 'express';
import WorkoutPlan from '../models/WorkoutPlan.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// GET all workouts (filter by trainer or member)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'trainer') {
      filter.trainerId = req.user._id.toString();
    } else if (req.user.role === 'member') {
      filter.memberId = req.user._id.toString();
    }
    if (req.query.memberId) {
      filter.memberId = req.query.memberId;
    }

    const plans = await WorkoutPlan.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: plans.length, workoutPlans: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single workout plan
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, workoutPlan: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create workout plan (Trainer or Admin)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, memberId, memberName, days, notes } = req.body;
    if (!name || !days || days.length === 0) {
      return res.status(400).json({ success: false, message: 'Plan name and routine days are required' });
    }

    const newPlan = await WorkoutPlan.create({
      name,
      trainerId: req.user._id.toString(),
      trainerName: req.user.name,
      memberId: memberId || '',
      memberName: memberName || '',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active',
      days,
      notes: notes || '',
    });

    res.status(201).json({ success: true, message: 'Workout plan created successfully', workoutPlan: newPlan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update workout plan
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const updated = await WorkoutPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, workoutPlan: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE workout plan
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    await WorkoutPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Workout plan deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
