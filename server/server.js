import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { sessionMiddleware } from './config/session.js';
import { log } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';

dotenv.config();

const app = express();                                // <-- create app first
app.use(express.json());                              // parsers next
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));

// Request log (AFTER app exists)
app.use((req, _res, next) => {
  const u = req.session?.user?.id ? ` uid=${req.session.user.id}` : '';
  log(`${req.method} ${req.path}${u}`);
  next();
});

await connectDB(process.env.MONGODB_URI);             // DB before session store
app.use(sessionMiddleware({
  mongoUrl: process.env.MONGODB_URI,
  secret: process.env.SESSION_SECRET
}));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`[HTTP] listening on ${port}`));
// This file is the main entry point for the Travel Planner MVP server application. It sets up the Express server, connects to the database, configures middleware, and defines routes.