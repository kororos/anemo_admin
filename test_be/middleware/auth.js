import jwt from 'jsonwebtoken';
import db from '../db/models/index.js';

function isLoggedIn(req, res, next) {
  // Check if user is logged in
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Verify the token
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        // If the token is invalid, send an unauthorized status
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // If the token is valid, store the user object in the request object
      req.user = user;
      // Proceed to the next middleware or route handler
      next();
    });
    // User is logged in, proceed to the next middleware or route handler
    //next();
  } else {
    // User is not logged in, send an error response
    res.status(401).json({ error: 'Unauthorized by middleware' });
  }
}

export async function checkRole(roles) {
  return async function (req, res, next) {
    try {
      // Check if user has the correct role
      const user = await db.User.findOne({ where: { name: req.user.username } });
      if (user.role != undefined) {
        if (!roles.includes(user.role)) {
          // If the user does not have the correct role, send an unauthorized status
          return res.status(401).json({ error: 'Unauthorized' });
        }
      } else {
        return res.status(401).json({ error: 'Need to Upgrade DB schema. Role is not in the database' });
      }
      req.userId = user.id;
      // User has the correct role, proceed to the next middleware or route handler
      next();
    } catch (error) {
      next(error);
    }
  }
}

export default isLoggedIn;
