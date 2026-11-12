import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    durationDays: {
      type: Number,
      default: 30,
    },
    features: {
      type: [String],
      default: [],
    },
    activeSubscribers: {
      type: Number,
      default: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: 'blue',
    },
  },
  {
    timestamps: true,
  }
);

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
