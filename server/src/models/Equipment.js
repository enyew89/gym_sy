import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, default: 'Life Fitness' },
    quantity: { type: Number, default: 1 },
    working: { type: Number, default: 1 },
    maintenance: { type: Number, default: 0 },
    location: { type: String, default: 'Main Gym Floor' },
    status: { type: String, enum: ['good', 'partial', 'maintenance', 'broken'], default: 'good' },
    purchaseDate: { type: String, default: '' },
    lastServiced: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Equipment = mongoose.model('Equipment', equipmentSchema);
export default Equipment;
