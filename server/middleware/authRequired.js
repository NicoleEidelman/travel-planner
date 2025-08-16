// server/middleware/authRequired.js - Enhanced with JWT bonus feature
import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

export function authRequired(req, res, next) {
  // Primary authentication: Session-based (existing system)
  if (req.session?.user) {
    return next();
  }

  // BONUS: JWT fallback authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (decoded?.id) {
      // For JWT users, we need to populate req.session.user for compatibility
      // with existing code that expects req.session.user.id
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