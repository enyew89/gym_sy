import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    checkIn: { type: String, required: true }, // e.g. "06:30"
    checkOut: { type: String, default: null },
    method: { type: String, enum: ['QR', 'Manual', 'Turnstile'], default: 'QR' },
    status: { type: String, enum: ['active', 'checked_out'], default: 'active' },
  },
  { timestamps: true }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
