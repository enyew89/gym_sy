import mongoose from 'mongoose';

const gymClassSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    trainerId: { type: String, default: '' },
    trainerName: { type: String, required: true },
    schedule: { type: String, required: true }, // e.g. "Mon, Wed, Fri"
    time: { type: String, required: true }, // e.g. "06:00 - 07:00"
    capacity: { type: Number, default: 20 },
    enrolled: { type: Number, default: 0 },
    room: { type: String, default: 'Studio A' },
    status: { type: String, enum: ['active', 'full', 'cancelled'], default: 'active' },
    enrolledMembers: [{ type: String }],
  },
  { timestamps: true }
);

const GymClass = mongoose.model('GymClass', gymClassSchema);
export default GymClass;
