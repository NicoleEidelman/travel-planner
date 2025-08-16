import mongoose from 'mongoose';

// This file defines the Trip model for the Travel Planner MVP application.

const Coord = new mongoose.Schema({ lat: Number, lon: Number }, { _id: false });

const TripSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, enum: ['bike','trek'], required: true },
  coords: { type: [[Number]], default: [] }, // [ [lon,lat], ... ]
  dayDistances: { type: [Number], default: [] },
  narrative: { type: String, default: '' },
  start: { type: Coord },
  end: { type: Coord },
  // Add new fields for place information
  cover: { type: String, default: '' },           // Cover image URL
  placeDescription: { type: String, default: '' }, // Wikipedia description
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Trip', TripSchema);