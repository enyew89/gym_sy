import express from 'express';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import { chapaService } from '../services/chapa.service.js';
import { isAuthenticated, requireAdmin, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all payments (with optional filters)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'member') {
      filter.memberEmail = req.user.email;
    } else if (req.query.memberId) {
      filter.memberId = req.query.memberId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST record new payment (Staff POS: Admin or Receptionist only)
router.post('/', requireRole('admin', 'receptionist'), async (req, res) => {
  try {
    const { memberId, memberName, memberEmail, amount, plan, method, status, notes } = req.body;
    if (!memberName || !amount) {
      return res.status(400).json({ success: false, message: 'Member name and amount are required' });
    }

    const targetEmail = (memberEmail || req.user?.email || '').toLowerCase().trim();
    const selectedPlanName = plan || 'Standard';

    // Prevent duplicate active plan payments if member has > 7 days remaining
    if (req.user.role === 'member' && req.user.plan && req.user.plan.toLowerCase() === selectedPlanName.toLowerCase()) {
      if (req.user.planExpiryDate && new Date(req.user.planExpiryDate) > new Date()) {
        const timeDiff = new Date(req.user.planExpiryDate).getTime() - Date.now();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysRemaining > 7) {
          return res.status(400).json({
            success: false,
            message: `You already have an active ${selectedPlanName} membership with ${daysRemaining} days remaining. Duplicate payment is not allowed until expiration nears.`,
          });
        }
      }
    }

    // Check if there is already a pending payment
    if (req.user.role === 'member') {
      const existingPending = await Payment.findOne({
        memberEmail: targetEmail,
        plan: selectedPlanName,
        status: 'pending',
      });
      if (existingPending) {
        return res.status(400).json({
          success: false,
          message: `You already have a pending payment for ${selectedPlanName} (Ref: ${existingPending.receiptNo || existingPending.tx_ref}). Please verify or cancel it first.`,
          isPending: true,
        });
      }
    }

    const payment = await Payment.create({
      memberId: memberId || req.user?._id?.toString() || '',
      memberName,
      memberEmail: targetEmail,
      amount: Number(amount),
      currency: 'ETB',
      plan: selectedPlanName,
      method: method || 'Cash',
      status: status || 'completed',
      date: new Date().toISOString().split('T')[0],
      notes: notes || '',
    });

    // If payment is completed and is for a plan, update member plan and active status
    if (memberEmail && (status === 'completed' || !status)) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      await User.findOneAndUpdate(
        { email: memberEmail.toLowerCase().trim() },
        { plan: plan || 'Standard', status: 'active', planExpiryDate: expiry }
      );
    }

    res.status(201).json({ success: true, message: 'Payment recorded successfully', payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update payment (Admin or Receptionist only)
router.put('/:id', requireRole('admin', 'receptionist'), async (req, res) => {
  try {
    const { status, method, amount, notes, plan } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (method) updateData.method = method;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (notes !== undefined) updateData.notes = notes;
    if (plan) updateData.plan = plan;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // If marked as completed, activate member
    if (status === 'completed' && payment.memberEmail) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      await User.findOneAndUpdate(
        { email: payment.memberEmail.toLowerCase().trim() },
        { status: 'active', plan: payment.plan || 'Standard', planExpiryDate: expiry }
      );
    }

    res.json({
      success: true,
      message: 'Payment updated successfully',
      payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE payment - Admin can delete any; Members can cancel their own pending payment
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Role check: non-admins can only cancel their own pending payment
    if (req.user.role !== 'admin') {
      if (payment.memberEmail?.toLowerCase().trim() !== req.user.email?.toLowerCase().trim()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this payment' });
      }
      if (payment.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Only pending payment records can be cancelled' });
      }
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Payment record cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET revenue statistics and monthly chart data
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const allPayments = await Payment.find();
    const completedPayments = allPayments.filter((p) => p.status === 'completed');
    const pendingPayments = allPayments.filter((p) => p.status === 'pending');

    const totalRevenue = completedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const unpaidAmount = pendingPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Group by month
    const monthlyMap = {};
    completedPayments.forEach((p) => {
      const date = new Date(p.date || p.createdAt);
      const monthName = date.toLocaleString('default', { month: 'short' });
      monthlyMap[monthName] = (monthlyMap[monthName] || 0) + p.amount;
    });

    const chartData = Object.keys(monthlyMap).map((m) => ({
      month: m,
      revenue: monthlyMap[m],
    }));

    res.json({
      success: true,
      totalRevenue,
      unpaidAmount,
      completedCount: completedPayments.length,
      pendingCount: pendingPayments.length,
      count: allPayments.length,
      chartData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * =========================================================================
 * CHAPA PAYMENT GATEWAY INTEGRATION
 * =========================================================================
 */

// GET public config
router.get('/chapa/config', (req, res) => {
  res.json({
    success: true,
    publicKey: chapaService.publicKey,
    mode: 'test',
    currency: 'ETB',
  });
});

// POST initialize a Chapa checkout session
router.post('/chapa/initialize', isAuthenticated, async (req, res) => {
  try {
    const { planName, amount, returnUrl, phoneNumber } = req.body;
    const user = req.user;

    const plan = await Plan.findOne({ name: planName || user.plan || 'Standard' });
    const chargeAmount = Number(amount) || (plan ? plan.price : 1000);
    const selectedPlanName = plan ? plan.name : (planName || 'Standard');

    // Clean up any stale pending payments for this member so a fresh session can be initiated
    await Payment.updateMany(
      {
        memberEmail: user.email.toLowerCase().trim(),
        status: 'pending',
      },
      {
        $set: {
          status: 'cancelled',
          notes: 'Superseded by new checkout attempt',
        },
      }
    );

    // Split user name into first and last name
    const nameParts = (user.name || 'Gym Member').trim().split(' ');
    const firstName = nameParts[0] || 'Gym';
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    // Unique transaction reference
    const tx_ref = `GP-CHAPA-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;

    // Fallback client return url (uses CLIENT_URL, or dynamically detects the live host)
    const clientBase = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const finalReturnUrl =
      returnUrl || `${clientBase}/member/payments?chapa_status=verify&tx_ref=${tx_ref}`;
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/payments/chapa/webhook`;

    // Create pending payment record
    const payment = await Payment.create({
      memberId: user._id.toString(),
      memberName: user.name,
      memberEmail: user.email,
      amount: chargeAmount,
      currency: 'ETB',
      plan: selectedPlanName,
      method: 'Chapa',
      status: 'pending',
      receiptNo,
      tx_ref,
      notes: `Chapa checkout session initiated for ${selectedPlanName} membership`,
    });

    const initResult = await chapaService.initialize({
      amount: chargeAmount,
      currency: 'ETB',
      email: user.email,
      firstName,
      lastName,
      phoneNumber: phoneNumber || user.phone || '0911000000',
      tx_ref,
      return_url: finalReturnUrl,
      callback_url: callbackUrl,
      title: `GymPro ${selectedPlanName} Membership`,
      description: `Payment for ${selectedPlanName} membership tier at GymPro`,
    });

    res.json({
      success: true,
      checkoutUrl: initResult.checkoutUrl,
      tx_ref,
      payment,
      message: 'Chapa payment link generated successfully',
    });
  } catch (error) {
    console.error('Chapa init error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET verify payment with Chapa
router.get('/chapa/verify/:tx_ref', isAuthenticated, async (req, res) => {
  try {
    const { tx_ref } = req.params;
    const verifyResult = await chapaService.verify(tx_ref);

    const payment = await Payment.findOne({ tx_ref });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found for this transaction reference.',
      });
    }

    if (verifyResult.success) {
      payment.status = 'completed';
      payment.chapaReference = verifyResult.reference || verifyResult.data?.reference || '';
      payment.notes = `Verified by Chapa (${payment.chapaReference || 'Ref Verified'})`;
      await payment.save();

      // Extend membership
      const plan = await Plan.findOne({ name: payment.plan });
      const durationDays = plan ? (plan.durationDays || 30) : 30;

      const user = await User.findById(payment.memberId || req.user._id);
      if (user) {
        const now = new Date();
        let expiryDate = new Date();
        if (user.planExpiryDate && new Date(user.planExpiryDate) > now) {
          expiryDate = new Date(user.planExpiryDate);
        }
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        user.plan = payment.plan;
        user.planExpiryDate = expiryDate;
        user.status = 'active';
        await user.save();
      }

      return res.json({
        success: true,
        message: `Payment of ${payment.amount} ETB successfully verified with Chapa! Your ${payment.plan} membership is active until ${user ? user.planExpiryDate.toISOString().split('T')[0] : '30 days'}.`,
        payment,
        user,
      });
    } else {
      payment.status = 'failed';
      payment.notes = `Chapa verification returned: ${verifyResult.status || 'failed'}`;
      await payment.save();

      return res.status(400).json({
        success: false,
        message:
          verifyResult.message || 'Chapa reported this transaction was not completed or failed.',
        status: verifyResult.status,
      });
    }
  } catch (error) {
    console.error('Chapa verify error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST webhook callback from Chapa
router.post('/chapa/webhook', async (req, res) => {
  try {
    const { tx_ref } = req.body || {};
    if (!tx_ref) {
      return res.status(400).json({ message: 'Missing tx_ref' });
    }

    const verifyResult = await chapaService.verify(tx_ref);
    if (verifyResult.success) {
      const payment = await Payment.findOne({ tx_ref });
      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.chapaReference = verifyResult.reference || '';
        payment.notes = `Verified by Chapa Webhook (${payment.chapaReference})`;
        await payment.save();

        const plan = await Plan.findOne({ name: payment.plan });
        const durationDays = plan ? (plan.durationDays || 30) : 30;

        const user = await User.findById(payment.memberId);
        if (user) {
          const now = new Date();
          let expiryDate = new Date();
          if (user.planExpiryDate && new Date(user.planExpiryDate) > now) {
            expiryDate = new Date(user.planExpiryDate);
          }
          expiryDate.setDate(expiryDate.getDate() + durationDays);

          user.plan = payment.plan;
          user.planExpiryDate = expiryDate;
          user.status = 'active';
          await user.save();
        }
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
