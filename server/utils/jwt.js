
// Simple JWT utility for authentication tokens.
// Uses jsonwebtoken library and a secret from environment variables.
import jwt from 'jsonwebtoken';

/**
 * Generates a JWT for a given user id, valid for 7 days.
 * The token payload contains the user id as { id }.
 */
export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d',
  });
}

/**
 * Verifies a JWT and returns the decoded payload if valid, or null if invalid/expired.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    return null;
  }
}