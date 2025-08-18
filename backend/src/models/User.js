const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    default: undefined
  },
    lastName: {
    type: String,
    required: false,
    unique: false,
    lowercase: true,
    trim: true,
    default: undefined
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  accountType: {
    type: String,
    enum: ['demo', 'live'],
    default: 'live'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
