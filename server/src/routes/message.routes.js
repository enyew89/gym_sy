import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();
router.use(isAuthenticated);

/**
 * @route   GET /api/messages
 * @desc    Get messages for logged-in user (inbox/sent)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const filter = {
      $or: [{ senderId: userId }, { recipientId: userId }],
    };

    if (req.query.recipientId) {
      filter.$and = [
        {
          $or: [
            { senderId: userId, recipientId: req.query.recipientId },
            { senderId: req.query.recipientId, recipientId: userId },
          ],
        },
      ];
      delete filter.$or;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const messages = await Message.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/messages
 * @desc    Send a message (instruction, reminder, feedback, general)
 */
router.post('/', async (req, res) => {
  try {
    const { recipientId, recipientName, type, subject, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Recipient and message content are required',
      });
    }

    let targetName = recipientName;
    let targetRole = 'member';
    const recipientUser = await User.findById(recipientId).catch(() => null);
    if (recipientUser) {
      targetName = recipientUser.name;
      targetRole = recipientUser.role;
    }

    const message = await Message.create({
      senderId: req.user._id.toString(),
      senderName: req.user.name,
      senderRole: req.user.role,
      recipientId: recipientId.toString(),
      recipientName: targetName || 'Gym Member',
      recipientRole: targetRole,
      type: type || 'instruction',
      subject: subject || (type === 'reminder' ? 'Session Reminder' : type === 'feedback' ? 'Workout Feedback' : 'Training Instruction'),
      content: content.trim(),
      read: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: message,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PATCH /api/messages/:id/read
 * @desc    Mark a message as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    return res.json({ success: true, message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a message
 */
router.delete('/:id', async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    return res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
