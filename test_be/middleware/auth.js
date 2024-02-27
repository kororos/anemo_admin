import jwt from 'jsonwebtoken';
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
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export default  isLoggedIn;
