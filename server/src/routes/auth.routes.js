import express from 'express';
import passport from 'passport';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Shared login for all roles (Admin, Trainer, Receptionist, Member)
 * @access  Public
 */
router.post('/login', (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.',
    });
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid email or password.',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact gym administration.',
      });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }

      return res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          plan: user.plan,
          planExpiryDate: user.planExpiryDate,
          fitnessGoal: user.fitnessGoal,
          specialization: user.specialization,
          avatar: user.avatar,
        },
      });
    });
  })(req, res, next);
});

/**
 * @route   POST /api/auth/register-member
 * @desc    Public Member Registration
 *          IMPORTANT: Backend strictly enforces 'member' role.
 *          Public users cannot supply Admin, Trainer, or Receptionist role.
 * @access  Public
 */
router.post('/register-member', async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, acceptTerms, fitnessGoal, plan } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // Default 30-day membership access upon registration
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // STRICT SECURITY: Always force role to 'member' regardless of any incoming payload
    const newMember = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      role: 'member', // Enforced role
      status: 'active',
      plan: plan && plan !== 'None' ? plan : 'Standard',
      planExpiryDate: expiryDate,
      fitnessGoal: fitnessGoal || 'General Fitness',
    });

    const registeredUser = await User.register(newMember, password);

    // Auto-login the registered member into express-session
    req.logIn(registeredUser, (err) => {
      if (err) return next(err);

      return res.status(201).json({
        success: true,
        message: 'Member account created successfully! Welcome to GymPro.',
        user: {
          id: registeredUser._id,
          name: registeredUser.name,
          email: registeredUser.email,
          phone: registeredUser.phone,
          role: registeredUser.role,
          status: registeredUser.status,
          plan: registeredUser.plan,
          fitnessGoal: registeredUser.fitnessGoal,
        },
      });
    });
  } catch (error) {
    console.error('Member Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while creating member account.',
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user session
 * @access  Private
 */
router.get('/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return res.json({
      success: true,
      isAuthenticated: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        status: req.user.status,
        plan: req.user.plan,
        planExpiryDate: req.user.planExpiryDate,
        fitnessGoal: req.user.fitnessGoal,
        specialization: req.user.specialization,
        avatar: req.user.avatar,
      },
    });
  }

  return res.status(401).json({
    success: false,
    isAuthenticated: false,
    user: null,
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Log out current session
 * @access  Private
 */
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error('Session destroy error:', destroyErr);
      }
      res.clearCookie('connect.sid');
      return res.json({
        success: true,
        message: 'Logged out successfully.',
      });
    });
  });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset instructions
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your registered email address.',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (user) {
    console.log(`[AUTH] Password reset requested for ${user.email} (${user.role})`);
  }

  return res.json({
    success: true,
    message: 'If an account exists with this email, your request has been logged. Please contact gym administration or visit the front desk to complete identity verification.',
  });
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Admin-authorized password reset (prevents unauthorized public account takeover)
 * @access  Private (Admin only)
 */
router.post('/reset-password', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Self-service password resets are disabled for security. Please contact gym administration.',
    });
  }

  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both email and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.',
      });
    }

    await user.setPassword(newPassword);
    await user.save();

    return res.json({
      success: true,
      message: `Password for ${email} has been reset successfully by Administrator.`,
    });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error occurred while resetting password.',
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Allow currently logged-in user to change their own password securely
 * @access  Private (Authenticated)
 */
router.post('/change-password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.user._id);
    user.changePassword(currentPassword, newPassword, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Incorrect current password.',
        });
      }
      return res.json({
        success: true,
        message: 'Password changed successfully!',
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error changing password.',
    });
  }
});

export default router;
