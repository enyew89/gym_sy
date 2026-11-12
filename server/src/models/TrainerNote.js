import mongoose from 'mongoose';

const trainerNoteSchema = new mongoose.Schema(
  {
    trainerId: {
      type: String,
      required: true,
    },
    trainerName: {
      type: String,
      required: true,
    },
    memberId: {
      type: String,
      required: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Technique', 'Milestone', 'General', 'Recovery', 'Injury Prevention'],
      default: 'General',
    },
    adjustmentSuggested: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const TrainerNote = mongoose.model('TrainerNote', trainerNoteSchema);
export default TrainerNote;
