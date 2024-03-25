import express from 'express';
import jwt from 'jsonwebtoken';
// import db from '../db/models/index.js';
// import isLoggedIn from '../middleware/auth.js';

const router = express.Router();
const accessTokenLife = '2m';
const secretKey = process.env.SECRET_KEY;

router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken');
    res.send();
});

// router.post('/register', (req, res) => {
//     const { username, password } = req.body;
//     db.User.create({ username, password });
// });





export default router;
