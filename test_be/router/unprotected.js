import express from 'express';
import jwt from 'jsonwebtoken';
import { getGoogleOAuthTokens } from '../services/user.service.js';

const accessTokenLife = '2m';
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


router.get('/session/oauth/google', async (req, res) => {
    //Get the code from query string
    const code = req.query.code;
    //get the id and the access token with code 
    const {id_token, access_token} = await getGoogleOAuthTokens(code);
    console.log('id_token', id_token); 
    console.log('access_token', access_token);
    // get user with tokens
  
    // upsert the user 
  
    // create the session 
  
    // create access and refresh token 
  
    // redirect back to client
    res.redirect('http://localhost:9000');
  });
export default router;