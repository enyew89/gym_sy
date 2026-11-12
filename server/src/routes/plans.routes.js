import express from 'express';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/plans
 * @desc    Get all membership plans with dynamic, real-time active subscriber counts
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 }).lean();

    // Calculate real active subscribers for each plan dynamically from User collection
    const activeCounts = await User.aggregate([
      {
        $match: {
          role: 'member',
          status: 'active',
        },
      },
      {
        $group: {
          _id: { $toLower: '$plan' },
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    activeCounts.forEach((c) => {
      if (c._id) countMap[c._id.trim()] = c.count;
    });

    const enrichedPlans = plans.map((plan) => {
      const planNameKey = (plan.name || '').toLowerCase().trim();
      const realSubscribers = countMap[planNameKey] || 0;
      return {
        ...plan,
        activeSubscribers: realSubscribers,
        memberCount: realSubscribers,
      };
    });

    return res.json({
      success: true,
      count: enrichedPlans.length,
      plans: enrichedPlans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch membership plans.',
    });
  }
});

/**
 * @route   POST /api/plans
 * @desc    Create a new membership plan
 * @access  Private (Admin only)
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, price, currency, durationDays, features, color, isPopular } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Plan name and price are required' });
    }

    const featureList = Array.isArray(features)
      ? features
      : typeof features === 'string'
      ? features.split('\n').map((f) => f.trim()).filter(Boolean)
      : ['Gym floor access', 'Locker access'];

    const planId = `plan_${Date.now()}`;

    const newPlan = await Plan.create({
      planId,
      name: name.trim(),
      price: Number(price),
      currency: currency || 'ETB',
      durationDays: Number(durationDays) || 30,
      features: featureList,
      color: color || 'blue',
      isPopular: !!isPopular,
      activeSubscribers: 0,
    });

    return res.status(201).json({
      success: true,
      message: `Plan "${newPlan.name}" created successfully!`,
      plan: newPlan,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/plans/:id
 * @desc    Update a membership plan (price, features, duration, etc.)
 * @access  Private (Admin only)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, price, currency, durationDays, features, color, isPopular } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (currency) updateData.currency = currency;
    if (durationDays !== undefined) updateData.durationDays = Number(durationDays);
    if (color) updateData.color = color;
    if (isPopular !== undefined) updateData.isPopular = !!isPopular;

    if (features !== undefined) {
      updateData.features = Array.isArray(features)
        ? features
        : typeof features === 'string'
        ? features.split('\n').map((f) => f.trim()).filter(Boolean)
        : [];
    }

    // Try finding by _id first, then by planId
    let plan = await Plan.findById(req.params.id);
    if (!plan) {
      plan = await Plan.findOne({ planId: req.params.id });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    Object.assign(plan, updateData);
    await plan.save();

    return res.json({
      success: true,
      message: `Plan "${plan.name}" updated successfully!`,
      plan,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/plans/:id
 * @desc    Delete a membership plan
 * @access  Private (Admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    let plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      plan = await Plan.findOneAndDelete({ planId: req.params.id });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    return res.json({
      success: true,
      message: `Plan "${plan.name}" deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
