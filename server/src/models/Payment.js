import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    memberId: { type: String, default: '' },
    memberName: { type: String, required: true },
    memberEmail: { type: String, default: '' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'ETB' },
    plan: { type: String, default: 'Standard' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    method: { type: String, enum: ['Cash', 'Bank Transfer', 'Mobile Money', 'Credit Card', 'Chapa'], default: 'Cash' },
    status: { type: String, enum: ['completed', 'pending', 'overdue', 'refunded', 'failed'], default: 'completed' },
    receiptNo: {
      type: String,
      unique: true,
      default: () => `RCP-${Date.now().toString().slice(-6)}`,
    },
    tx_ref: { type: String, default: '' },
    chapaReference: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
