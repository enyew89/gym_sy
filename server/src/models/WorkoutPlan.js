import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: String, default: '10-12' },
  weight: { type: String, default: 'BW' },
  rest: { type: String, default: '60s' },
});

const workoutDaySchema = new mongoose.Schema({
  day: { type: String, required: true }, // e.g. "Monday"
  focus: { type: String, required: true }, // e.g. "Chest & Triceps"
  exercises: [exerciseSchema],
});

const workoutPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    trainerId: { type: String, default: '' },
    trainerName: { type: String, default: '' },
    memberId: { type: String, default: '' },
    memberName: { type: String, default: '' },
    createdDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
    days: [workoutDaySchema],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);
export default WorkoutPlan;
