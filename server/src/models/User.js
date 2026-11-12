import mongoose from 'mongoose';
import passportLocalMongoosePkg from 'passport-local-mongoose';

const passportLocalMongoose = typeof passportLocalMongoosePkg === 'function'
  ? passportLocalMongoosePkg
  : passportLocalMongoosePkg.default?.default || passportLocalMongoosePkg.default || passportLocalMongoosePkg;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['admin', 'trainer', 'receptionist', 'member'],
      default: 'member',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'suspended', 'expired'],
      default: 'active',
    },
    // Member specific fields
    plan: {
      type: String,
      default: 'None',
    },
    planExpiryDate: {
      type: Date,
      default: null,
    },
    fitnessGoal: {
      type: String,
      default: 'General Fitness',
    },
    gender: {
      type: String,
      default: '',
    },
    age: {
      type: Number,
      default: null,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    trainerName: {
      type: String,
      default: '',
    },
    // Staff/Trainer specific fields
    specialization: {
      type: String,
      default: '',
    },
    certifications: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Apply passport-local-mongoose plugin
// This adds email (as username), hash, and salt fields, plus auth helpers
userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameLowerCase: true,
  errorMessages: {
    UserExistsError: 'An account with the given email address is already registered.',
    IncorrectPasswordError: 'Incorrect password entered.',
    IncorrectUsernameError: 'No account found with this email.',
  },
});

const User = mongoose.model('User', userSchema);
export default User;
