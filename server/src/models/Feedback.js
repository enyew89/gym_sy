import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    memberName: {
      type: String,
      required: true,
      trim: true,
    },
    memberEmail: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['equipment_issue', 'suggestion', 'general', 'complaint'],
      default: 'suggestion',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    equipmentName: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved'],
      default: 'open',
    },
    adminResponse: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
