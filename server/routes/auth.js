import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { loginSchema, registerSchema } from '../utils/validate.js';
import { generateToken } from '../utils/jwt.js';

// This file handles user authentication routes for the Travel Planner MVP application.
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = await registerSchema.validateAsync(req.body);
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    // Create session (existing functionality)
    req.session.user = { id: user._id, name: user.name, email: user.email };
    
    // BONUS: Add JWT token to response
    const token = generateToken(user._id);
    res.status(201).json({ user: req.session.user, token });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = await loginSchema.validateAsync(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
// Create session (existing functionality)
    req.session.user = { id: user._id, name: user.name, email: user.email };
    // BONUS: Add JWT token to response
    const token = generateToken(user._id);
    res.json({ user: req.session.user, token });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  res.json({ user: req.session?.user || null });
});

export default router;
