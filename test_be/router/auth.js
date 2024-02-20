import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const secretKey = "my-secret-key";
const accessTokenLife = '10m';
// Login route
router.post('/login', (req, res) => {
    // Get the username and password from the request body
    const { username, password } = req.body;

    // TODO: Implement your own validation logic here
    // For example, check if the username and password are correct
    if(username !== 'admin' || password !== 'admin') {
        // If the username and password are not valid, send an unauthorized status
        return res.sendStatus(401);
    }
    // If the username and password are valid, generate a JWT token
    const refreshToken = jwt.sign({ username }, secretKey, {expiresIn: '1d'} );
    const accessToken = jwt.sign({ username},secretKey, {expiresIn: accessTokenLife} );

    // Set the token as an HTTP-only cookie
    //TODO For testing purposes, the domain is set to localhost. In a production environment, the domain should be set to the actual domain of the application.
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' , secure: false, maxAge: 24 * 60 * 60 * 1000});
    res.header('Authorization', `Bearer ${accessToken}`);

    // Send a success response
    res.send({ username: username });
});

router.post('/refresh', (req, res) => {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      return res.status(401).send('Access Denied. No refresh token provided.');
    }
  
    try {
      const decoded = jwt.verify(refreshToken, secretKey);
      const accessToken = jwt.sign({ user: decoded.username }, secretKey, { expiresIn: accessTokenLife });
  
      res
        .header('Authorization', `Bearer ${accessToken}`)
        .send(decoded.username);
    } catch (error) {
      return res.status(400).send('Invalid refresh token.');
    }
  });
  
router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken');
    res.send();
});

export default router;
