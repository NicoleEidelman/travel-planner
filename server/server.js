import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { sessionMiddleware } from './config/session.js';
import { log } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';

// Main server entry point for the Travel Planner MVP application.
// Sets up Express, connects to MongoDB, configures middleware, and defines API routes.

dotenv.config();

const app = express(); // Create Express app instance

// Parse JSON request bodies
app.use(express.json());

// Enable CORS for frontend origin and allow credentials (cookies)
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));

// Log every incoming request with method, path, and user id if available
app.use((req, _res, next) => {
  const u = req.session?.user?.id ? ` uid=${req.session.user.id}` : '';
  log(`${req.method} ${req.path}${u}`);
  next();
});

// Connect to MongoDB before setting up session store
await connectDB(process.env.MONGODB_URI);

// Configure session middleware (MongoDB-backed sessions)
app.use(sessionMiddleware({
  mongoUrl: process.env.MONGODB_URI,
  secret: process.env.SESSION_SECRET
}));

// Health check endpoint
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Mount authentication and trip routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

// Start the HTTP server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`[HTTP] listening on ${port}`));