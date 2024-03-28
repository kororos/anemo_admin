import express from 'express';
import jwt from 'jsonwebtoken';
// import db from '../db/models/index.js';
// import isLoggedIn from '../middleware/auth.js';

const router = express.Router();
const accessTokenLife = '2m';
const secretKey = process.env.SECRET_KEY;

router.post('/logout', (req, res) => {

    // Set the access token as an HTTP-only cookie
    //const domain = process.env.NODE_ENV === 'production' ? 'kororos.eu' : 'localhost';

    if (process.env.NODE_ENV === 'production') {
        res.clearCookie('refreshToken', { domain: 'kororos.eu', httpOnly: true, secure: true, sameSite: 'strict' });
    } else {
        res.clearCookie('refreshToken', { httpOnly: true, secure: false, sameSite: 'strict' });
    }
    res.send();
});

// router.post('/register', (req, res) => {
//     const { username, password } = req.body;
//     db.User.create({ username, password });
// });





export default router;
