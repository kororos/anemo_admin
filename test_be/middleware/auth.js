import jwt from 'jsonwebtoken';
import db from '../db/models/index.js';

/**
 * Verifies if the user is logged in based on JWT token
 * @param {Object} req - Express request object
 * @returns {Object|false} - Returns the decoded user object if logged in, false otherwise
 */
function verifyLoggedIn(req) {
  // Check if user is logged in
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Verify the token
      const user = jwt.verify(token, process.env.SECRET_KEY);
      return user; // User is logged in, return the user object
    } catch (err) {
      return false; // Invalid token
    }
  }
  return false; // No token provided
}

/**
 * Authorization middleware that checks user roles
 * If 'guest' role is included in the allowed roles, access is granted without authentication
 * Otherwise, verifies the user is logged in and has one of the required roles
 */
export async function checkRole(roles) {
  return async function (req, res, next) {
    try {
      // Check if roles includes 'guest', allow access without authentication
      if (roles.includes('guest')) {
        return next();
      }
      
      // For other roles, first verify the user is logged in
      const user = verifyLoggedIn(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized - Authentication required' });
      }
      
      // Set the user object on the request
      req.user = user;
      
      // Check if user has the correct role
      const dbUser = await db.User.findOne({ where: { name: user.username } });
      if (!dbUser) {
        return res.status(401).json({ error: 'Unauthorized - User not found' });
      }
      
      if (dbUser.role == undefined) {
        return res.status(401).json({ error: 'Need to Upgrade DB schema. Role is not in the database' });
      }
      
      if (!roles.includes(dbUser.role)) {
        return res.status(401).json({ error: 'Unauthorized - Insufficient permissions' });
      }
      
      // Set the user ID on the request
      req.userId = dbUser.id;
      
      // User has the correct role, proceed to the next middleware or route handler
      next();
    } catch (error) {
      next(error);
    }
  }
}
