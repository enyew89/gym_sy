import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    weight: { type: Number, required: true }, // in kg
    bodyFat: { type: Number, default: 0 }, // %
    chest: { type: Number, default: 0 }, // cm
    waist: { type: Number, default: 0 }, // cm
    arms: { type: Number, default: 0 }, // cm
    benchPress: { type: Number, default: 0 }, // kg
    squat: { type: Number, default: 0 }, // kg
    deadlift: { type: Number, default: 0 }, // kg
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
