
import mongoose from 'mongoose';

// Defines the User model for the Travel Planner MVP application.
// Stores user name, email (unique, lowercase), and password hash.
// Uses Mongoose timestamps for createdAt/updatedAt fields.
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);

