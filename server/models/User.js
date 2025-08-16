import mongoose from 'mongoose';
// This file defines the User model for the Travel Planner MVP application.
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });



export default mongoose.model('User', UserSchema);

