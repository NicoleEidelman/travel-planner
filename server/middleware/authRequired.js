
// Middleware to require authentication for protected routes.
// Supports both session-based and JWT-based authentication.
import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Checks if the request is authenticated (session or JWT).
 * - If session user exists, allows request.
 * - If JWT is present and valid, loads user and populates req.session.user for compatibility.
 * - If neither, responds with 401 Unauthorized.
 *
 * Design decision: Allows both session and JWT auth for flexibility (web and API clients).
 */
export function authRequired(req, res, next) {
  // Primary authentication: Session-based (existing system)
  if (req.session?.user) {
    return next();
  }

  // JWT fallback authentication (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded?.id) {
      // For JWT users, populate req.session.user for compatibility with session-based code
      User.findById(decoded.id).select('-passwordHash')
        .then(user => {
          if (user) {
            req.session.user = {
              id: user._id,
              name: user.name,
              email: user.email
            };
            return next();
          } else {
            return res.status(401).json({ message: 'Not authenticated' });
          }
        })
        .catch(() => {
          return res.status(401).json({ message: 'Not authenticated' });
        });
      return; // Prevent double execution
    }
  }

  // No valid authentication found
  return res.status(401).json({ message: 'Not authenticated' });
}