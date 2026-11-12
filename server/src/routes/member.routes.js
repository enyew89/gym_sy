import express from 'express';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import Payment from '../models/Payment.js';
import WorkoutPlan from '../models/WorkoutPlan.js';
import WorkoutLog from '../models/WorkoutLog.js';
import Progress from '../models/Progress.js';
import GymClass from '../models/GymClass.js';
import Message from '../models/Message.js';
import Feedback from '../models/Feedback.js';
import Attendance from '../models/Attendance.js';
import { requireMember } from '../middleware/auth.js';

const router = express.Router();

router.use(requireMember);

/**
 * =========================================================================
 * 1. MEMBER PROFILE & PERSONAL DETAILS
 * =========================================================================
 */
router.get('/profile', async (req, res) => {
  try {
    const member = await User.findById(req.user._id).select('-hash -salt');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member profile not found.' });
    }
    return res.json({ success: true, member });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const {
      name,
      phone,
      gender,
      age,
      dob,
      fitnessGoal,
      address,
      emergencyContactName,
      emergencyContactPhone,
      dietaryPreference,
      medicalNotes,
      height,
      targetWeight,
    } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (gender) updateFields.gender = gender;
    if (age !== undefined) updateFields.age = Number(age);
    if (fitnessGoal) updateFields.fitnessGoal = fitnessGoal;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    ).select('-hash -salt');

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      member: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 2. MEMBERSHIP STATUS & ONLINE PAYMENT / RENEWAL
 * =========================================================================
 */
router.get('/membership', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-hash -salt');
    const plans = await Plan.find({ status: 'active' });

    const now = new Date();
    const expiry = user.planExpiryDate ? new Date(user.planExpiryDate) : null;
    const isExpired = user.status === 'expired' || (expiry && expiry < now);
    const daysRemaining = expiry ? Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))) : 0;

    return res.json({
      success: true,
      membership: {
        plan: user.plan || 'Standard',
        status: isExpired ? 'expired' : user.status,
        planExpiryDate: user.planExpiryDate,
        daysRemaining,
        isExpired,
        trainerName: user.trainerName || 'Assigned Gym Coach',
      },
      availablePlans: plans,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/choose-plan', async (req, res) => {
  try {
    const { planName, paymentMethod, durationDays } = req.body;
    if (!planName) {
      return res.status(400).json({ success: false, message: 'Plan name is required.' });
    }

    const plan = await Plan.findOne({ name: planName });
    const daysToAdd = Number(durationDays) || (plan ? plan.durationDays || plan.duration : 30);

    const now = new Date();
    let expiryDate = new Date();
    if (req.user.planExpiryDate && new Date(req.user.planExpiryDate) > now) {
      expiryDate = new Date(req.user.planExpiryDate);
    }
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        plan: planName,
        planExpiryDate: expiryDate,
        status: 'active',
      },
      { new: true }
    ).select('-hash -salt');

    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
    const payment = await Payment.create({
      memberId: req.user._id.toString(),
      memberName: req.user.name,
      memberEmail: req.user.email,
      amount: plan ? plan.price : 1000,
      currency: 'ETB',
      plan: planName,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod || 'Mobile Money',
      status: 'completed',
      receiptNo,
      notes: `Online membership plan subscription via ${paymentMethod || 'Portal'}`,
    });

    return res.json({
      success: true,
      message: `Successfully enrolled in ${planName} plan!`,
      user: updatedUser,
      payment,
      receiptNo,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/pay-online', async (req, res) => {
  try {
    const { planName, amount, paymentMethod, phoneNumber } = req.body;
    const plan = await Plan.findOne({ name: planName || req.user.plan || 'Standard' });
    const chargeAmount = Number(amount) || (plan ? plan.price : 1000);
    const durationDays = plan ? plan.durationDays || plan.duration : 30;

    const now = new Date();
    let expiryDate = new Date();
    if (req.user.planExpiryDate && new Date(req.user.planExpiryDate) > now) {
      expiryDate = new Date(req.user.planExpiryDate);
    }
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        plan: planName || req.user.plan || 'Standard',
        planExpiryDate: expiryDate,
        status: 'active',
      },
      { new: true }
    ).select('-hash -salt');

    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
    const payment = await Payment.create({
      memberId: req.user._id.toString(),
      memberName: req.user.name,
      memberEmail: req.user.email,
      amount: chargeAmount,
      currency: 'ETB',
      plan: updatedUser.plan,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod || 'Mobile Money',
      status: 'completed',
      receiptNo,
      notes: `Online transaction confirmed (${paymentMethod || 'Telebirr/CBE'} - ${phoneNumber || 'Direct'})`,
    });

    return res.json({
      success: true,
      message: `Payment of ${chargeAmount} ETB confirmed! Membership extended until ${expiryDate.toISOString().split('T')[0]}.`,
      user: updatedUser,
      payment,
      receiptNo,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find({
      $or: [
        { memberId: req.user._id.toString() },
        { memberEmail: req.user.email.toLowerCase() },
      ],
    }).sort({ createdAt: -1 });

    return res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/attendance', async (req, res) => {
  try {
    const attendance = await Attendance.find({
      $or: [
        { memberId: req.user._id.toString() },
        { memberEmail: req.user.email.toLowerCase() },
      ],
    }).sort({ createdAt: -1 });

    return res.json({ success: true, count: attendance.length, attendance });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 3. WORKOUT PLANS & WORKOUT LOGGING
 * =========================================================================
 */
router.get('/workouts', async (req, res) => {
  try {
    let plan = await WorkoutPlan.findOne({
      memberId: req.user._id.toString(),
      status: 'active',
    }).sort({ createdAt: -1 });

    if (!plan) {
      plan = await WorkoutPlan.findOne({ status: 'active' });
    }

    return res.json({ success: true, workoutPlan: plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/workouts/log', async (req, res) => {
  try {
    const { workoutPlanId, workoutName, dayTitle, durationMinutes, exercisesCompleted, notes } = req.body;

    const log = await WorkoutLog.create({
      memberId: req.user._id,
      memberName: req.user.name,
      workoutPlanId: workoutPlanId || '',
      workoutName: workoutName || 'Daily Routine',
      dayTitle: dayTitle || 'Workout Session',
      date: new Date().toISOString().split('T')[0],
      durationMinutes: Number(durationMinutes) || 45,
      exercisesCompleted: exercisesCompleted || [],
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Workout session logged successfully!',
      log,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/workouts/history', async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ memberId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 4. FITNESS GOALS & BIOMETRIC PROGRESS
 * =========================================================================
 */
router.get('/progress', async (req, res) => {
  try {
    const records = await Progress.find({
      memberId: req.user._id.toString(),
    }).sort({ date: 1 });

    return res.json({ success: true, count: records.length, progress: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/progress', async (req, res) => {
  try {
    const { date, weight, bodyFat, chest, waist, arms, benchPress, squat, deadlift, notes } = req.body;

    const entry = await Progress.create({
      memberId: req.user._id.toString(),
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

    return res.status(201).json({
      success: true,
      message: 'Progress metrics saved successfully!',
      progress: entry,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 5. CLASSES & BOOKINGS
 * =========================================================================
 */
router.get('/classes', async (req, res) => {
  try {
    const classes = await GymClass.find({ status: 'active' }).sort({ time: 1 });
    const memberIdStr = req.user._id.toString();

    const formatted = classes.map((c) => {
      const obj = c.toObject();
      obj.isEnrolled = (c.enrolledMembers || []).includes(memberIdStr);
      return obj;
    });

    return res.json({ success: true, count: formatted.length, classes: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/classes/:id/enroll', async (req, res) => {
  try {
    const gymClass = await GymClass.findById(req.params.id);
    if (!gymClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    if (req.user.status === 'expired' || req.user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your membership is not active. Please renew before booking group classes.',
      });
    }

    const memberIdStr = req.user._id.toString();
    if (gymClass.enrolledMembers.includes(memberIdStr)) {
      return res.status(400).json({ success: false, message: 'You are already booked into this class.' });
    }

    if (gymClass.enrolled >= gymClass.capacity) {
      return res.status(400).json({ success: false, message: 'Class is at maximum capacity.' });
    }

    gymClass.enrolledMembers.push(memberIdStr);
    gymClass.enrolled += 1;
    if (gymClass.enrolled >= gymClass.capacity) {
      gymClass.status = 'full';
    }
    await gymClass.save();

    return res.json({
      success: true,
      message: `Booked your spot for ${gymClass.name}!`,
      gymClass,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/classes/:id/cancel', async (req, res) => {
  try {
    const gymClass = await GymClass.findById(req.params.id);
    if (!gymClass) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const memberIdStr = req.user._id.toString();
    gymClass.enrolledMembers = gymClass.enrolledMembers.filter((m) => m !== memberIdStr);
    gymClass.enrolled = Math.max(0, gymClass.enrolled - 1);
    if (gymClass.status === 'full' && gymClass.enrolled < gymClass.capacity) {
      gymClass.status = 'active';
    }
    await gymClass.save();

    return res.json({
      success: true,
      message: `Reservation for ${gymClass.name} cancelled.`,
      gymClass,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 6. NOTIFICATIONS
 * =========================================================================
 */
router.get('/notifications', async (req, res) => {
  try {
    const notificationsList = [];
    const now = new Date();

    // 1. Membership Expiry Warning
    if (req.user.planExpiryDate) {
      const expiry = new Date(req.user.planExpiryDate);
      const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && diffDays > 0) {
        notificationsList.push({
          id: 'notif-expiry-warning',
          type: 'membership',
          title: 'Membership Expiring Soon',
          message: `Your ${req.user.plan} membership expires in ${diffDays} day${diffDays > 1 ? 's' : ''}. Renew online to avoid check-in disruption.`,
          date: 'Today',
          read: false,
          actionUrl: '/member/membership',
        });
      } else if (diffDays <= 0) {
        notificationsList.push({
          id: 'notif-expired',
          type: 'membership_alert',
          title: 'Membership Expired',
          message: 'Your membership validity has ended. Please renew to access gym turnstiles.',
          date: 'Action Required',
          read: false,
          actionUrl: '/member/membership',
        });
      }
    }

    // 2. Direct Coaching Messages from Trainer
    const trainerMessages = await Message.find({
      recipientId: req.user._id.toString(),
    }).sort({ createdAt: -1 }).limit(5);

    trainerMessages.forEach((msg) => {
      notificationsList.push({
        id: `notif-msg-${msg._id}`,
        type: msg.type || 'instruction',
        title: `${msg.type.toUpperCase()}: ${msg.subject}`,
        message: msg.content,
        date: msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Recent',
        read: msg.isRead,
        actionUrl: '/member/workouts',
      });
    });

    // 3. Class Booking Reminder
    const bookedClasses = await GymClass.find({
      enrolledMembers: req.user._id.toString(),
      status: 'active',
    }).limit(2);

    bookedClasses.forEach((cls) => {
      notificationsList.push({
        id: `notif-cls-${cls._id}`,
        type: 'booking',
        title: `Class Reminder: ${cls.name}`,
        message: `You are booked for ${cls.name} at ${cls.time} (${cls.room}). Remember your water bottle!`,
        date: cls.schedule || 'This Week',
        read: true,
        actionUrl: '/member/classes',
      });
    });

    return res.json({
      success: true,
      count: notificationsList.length,
      notifications: notificationsList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * 7. FEEDBACK & EQUIPMENT PROBLEM REPORTING
 * =========================================================================
 */
router.get('/feedback', async (req, res) => {
  try {
    const feedbackItems = await Feedback.find({ memberId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, count: feedbackItems.length, feedback: feedbackItems });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { type, subject, equipmentName, message, priority } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message details are required.',
      });
    }

    const feedback = await Feedback.create({
      memberId: req.user._id,
      memberName: req.user.name,
      memberEmail: req.user.email,
      type: type || 'suggestion',
      subject: subject.trim(),
      equipmentName: equipmentName ? equipmentName.trim() : '',
      message: message.trim(),
      priority: priority || 'medium',
      status: 'open',
    });

    return res.status(201).json({
      success: true,
      message: type === 'equipment_issue'
        ? 'Equipment issue report submitted. Maintenance team alerted!'
        : 'Thank you! Your feedback has been sent to gym management.',
      feedback,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
