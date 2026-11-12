import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['trainer', 'member', 'admin', 'receptionist'],
      required: true,
    },
    recipientId: {
      type: String,
      required: true,
    },
    recipientName: {
      type: String,
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ['trainer', 'member', 'admin', 'receptionist'],
      required: true,
    },
    type: {
      type: String,
      enum: ['instruction', 'reminder', 'feedback', 'general'],
      default: 'instruction',
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
