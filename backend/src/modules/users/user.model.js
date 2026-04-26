const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT', 'AGENT'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'AGENT', index: true },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['ENABLED', 'DISABLED'], default: 'ENABLED', index: true },
    access: { type: String, enum: ['FULL_ACCESS', 'LIMITED_ADMIN', 'READ_ONLY'], default: 'LIMITED_ADMIN' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 10);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
module.exports = { User, ROLES };
