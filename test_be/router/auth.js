import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/models/index.js';
import isLoggedIn from '../middleware/auth.js';

const router = express.Router();
const accessTokenLife = '10m';
const secretKey = process.env.SECRET_KEY;


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

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.User.create({ username, password });
});



export default router;
