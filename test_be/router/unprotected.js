import express from 'express';
import jwt from 'jsonwebtoken';

const accessTokenLife = '10m';
const router = express.Router();

//TODO this needs to be moved to a .env file
const secretKey = process.env.SECRET_KEY;

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

export default router;