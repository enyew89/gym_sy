import express from 'express';
import GymClass from '../models/GymClass.js';
import { isAuthenticated, requireRole, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all classes (public/authenticated)
router.get('/', async (req, res) => {
  try {
    const classes = await GymClass.find().sort({ createdAt: -1 });
    res.json({ success: true, count: classes.length, classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create class (admin or trainer only)
router.post('/', requireRole('admin', 'trainer'), async (req, res) => {
  try {
    const { name, trainerName, schedule, time, capacity, room, trainerId } = req.body;
    if (!name || !trainerName || !schedule || !time) {
      return res.status(400).json({ success: false, message: 'Missing required class fields' });
    }

    const gymClass = await GymClass.create({
      name,
      trainerName,
      trainerId: trainerId || req.user?._id || '',
      schedule,
      time,
      capacity: capacity || 20,
      room: room || 'Studio A',
      status: 'active',
      enrolled: 0,
      enrolledMembers: [],
    });

    res.status(201).json({ success: true, message: 'Class scheduled successfully', gymClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST enroll in class
router.post('/:id/enroll', isAuthenticated, async (req, res) => {
  try {
    const gymClass = await GymClass.findById(req.params.id);
    if (!gymClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const memberId = req.body.memberId || req.user?._id?.toString() || req.user?.id;
    if (gymClass.enrolledMembers.includes(memberId)) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this class' });
    }

    if (gymClass.enrolled >= gymClass.capacity) {
      return res.status(400).json({ success: false, message: 'Class is at full capacity' });
    }

    gymClass.enrolledMembers.push(memberId);
    gymClass.enrolled += 1;
    if (gymClass.enrolled >= gymClass.capacity) {
      gymClass.status = 'full';
    }
    await gymClass.save();

    res.json({ success: true, message: `Enrolled in ${gymClass.name}!`, gymClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update class (admin or trainer only)
router.put('/:id', requireRole('admin', 'trainer'), async (req, res) => {
  try {
    const gymClass = await GymClass.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, gymClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE class (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await GymClass.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Class removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
