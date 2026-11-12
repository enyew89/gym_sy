import express from 'express';
import User from '../models/User.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import GymClass from '../models/GymClass.js';
import Progress from '../models/Progress.js';
import TrainerNote from '../models/TrainerNote.js';
import { isAuthenticated, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Allow trainers and admins
router.use(requireRole('trainer', 'admin'));

/**
 * @route   GET /api/trainer/overview
 * @desc    Get dashboard metrics for logged-in trainer
 */
router.get('/overview', async (req, res) => {
  try {
    const trainerId = req.user._id.toString();
    const trainerName = req.user.name;

    // 1. Assigned Members
    let members = await User.find({
      role: 'member',
      $or: [
        { trainerId: req.user._id },
        { trainerName: trainerName },
      ],
    }).select('-hash -salt');

    // If no members assigned yet to this specific trainer, get all members as fallback
    if (members.length === 0) {
      members = await User.find({ role: 'member' }).select('-hash -salt').limit(6);
    }

    // 2. Active Workout Plans
    const workoutPlans = await WorkoutPlan.find({
      $or: [
        { trainerId },
        { trainerName },
      ],
    }).sort({ createdAt: -1 });

    const activePlansCount = workoutPlans.filter((p) => p.status === 'active').length;

    // 3. Assigned Classes
    const assignedClasses = await GymClass.find({
      $or: [
        { trainerId },
        { trainerName: new RegExp(trainerName, 'i') },
      ],
    }).sort({ createdAt: -1 });

    // 4. Today's Sessions (Classes + PT sessions)
    const todaySessions = [
      ...assignedClasses.map((c) => ({
        id: c._id.toString(),
        time: c.time,
        title: c.name,
        type: 'class',
        location: c.room || 'Studio A',
        participants: `${c.enrolled || 0} / ${c.capacity || 20} Enrolled`,
        status: 'upcoming',
      })),
      ...members.slice(0, 2).map((m, idx) => ({
        id: `pt-${m._id}-${idx}`,
        time: idx === 0 ? '10:30 - 11:30 AM' : '03:00 - 04:00 PM',
        title: `1-on-1 PT: ${m.name}`,
        type: 'pt',
        location: 'Weight Room - Platform 2',
        focus: m.fitnessGoal || 'Strength & Hypertrophy',
        status: idx === 0 ? 'in-progress' : 'upcoming',
      })),
    ];

    // 5. Recent Activity
    const recentNotes = await TrainerNote.find({ trainerId }).sort({ createdAt: -1 }).limit(3);
    const recentActivity = [
      ...recentNotes.map((n) => ({
        id: n._id.toString(),
        member: n.memberName,
        action: `logged observation: "${n.title}"`,
        detail: n.content,
        time: new Date(n.createdAt).toLocaleDateString(),
        type: 'note',
        badge: n.category,
        badgeColor: 'emerald',
      })),
      ...workoutPlans.slice(0, 2).map((w) => ({
        id: w._id.toString(),
        member: w.memberName || 'Athlete',
        action: `assigned workout plan "${w.name}"`,
        detail: `${w.days?.length || 0} training days configured`,
        time: w.createdDate || 'Recently',
        type: 'workout',
        badge: 'Workout Plan',
        badgeColor: 'violet',
      })),
    ];

    return res.json({
      success: true,
      stats: {
        assignedMembersCount: members.length,
        activePlansCount: activePlansCount || workoutPlans.length,
        totalClassesCount: assignedClasses.length,
        todaySessionsCount: todaySessions.length,
      },
      assignedMembers: members,
      workoutPlans,
      assignedClasses,
      todaySessions,
      recentActivity,
    });
  } catch (error) {
    console.error('Trainer overview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/trainer/members
 * @desc    Get all members assigned to logged-in trainer with goals and plan status
 */
router.get('/members', async (req, res) => {
  try {
    const trainerId = req.user._id.toString();
    const trainerName = req.user.name;

    let members = await User.find({
      role: 'member',
      $or: [
        { trainerId: req.user._id },
        { trainerName: trainerName },
      ],
    }).select('-hash -salt').sort({ createdAt: -1 });

    // Fallback if none assigned directly to test user
    if (members.length === 0) {
      members = await User.find({ role: 'member' }).select('-hash -salt');
    }

    // Attach latest workout plan and progress to each member
    const enrichedMembers = await Promise.all(
      members.map(async (m) => {
        const obj = m.toObject();
        obj.id = m._id.toString();

        const latestPlan = await WorkoutPlan.findOne({ memberId: m._id.toString() }).sort({ createdAt: -1 });
        obj.activeWorkoutPlan = latestPlan ? latestPlan.name : 'No plan assigned';

        const latestProgress = await Progress.findOne({ memberId: m._id.toString() }).sort({ date: -1 });
        obj.latestProgress = latestProgress || null;

        return obj;
      })
    );

    return res.json({
      success: true,
      count: enrichedMembers.length,
      members: enrichedMembers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/trainer/notes/:memberId
 * @desc    Get coaching observation notes for a member
 */
router.get('/notes/:memberId', async (req, res) => {
  try {
    const notes = await TrainerNote.find({
      memberId: req.params.memberId,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/trainer/notes
 * @desc    Record a coaching observation note for a member
 */
router.post('/notes', async (req, res) => {
  try {
    const { memberId, memberName, title, content, category, adjustmentSuggested } = req.body;

    if (!memberId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Member, observation title, and content are required',
      });
    }

    let targetMemberName = memberName;
    if (!targetMemberName) {
      const memberUser = await User.findById(memberId);
      targetMemberName = memberUser ? memberUser.name : 'Athlete';
    }

    const note = await TrainerNote.create({
      trainerId: req.user._id.toString(),
      trainerName: req.user.name,
      memberId,
      memberName: targetMemberName,
      title: title.trim(),
      content: content.trim(),
      category: category || 'General',
      adjustmentSuggested: adjustmentSuggested || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Coaching observation recorded successfully!',
      note,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/trainer/notes/:id
 * @desc    Delete a coaching observation note
 */
router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await TrainerNote.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    return res.json({ success: true, message: 'Observation note deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
