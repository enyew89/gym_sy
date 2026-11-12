import mongoose from 'mongoose';

const workoutLogSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    workoutPlanId: {
      type: String,
      default: '',
    },
    workoutName: {
      type: String,
      required: true,
      default: 'Daily Gym Routine',
    },
    dayTitle: {
      type: String,
      default: 'Day Session',
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    durationMinutes: {
      type: Number,
      default: 45,
    },
    exercisesCompleted: {
      type: [
        {
          name: String,
          sets: String,
          reps: String,
          weight: String,
          completed: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);
export default WorkoutLog;
