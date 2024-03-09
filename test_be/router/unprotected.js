import express from 'express';
import jwt from 'jsonwebtoken';
import { getGoogleOAuthTokens } from '../services/user.service.js';
import db from '../db/models/index.js';

const accessTokenLife = '2m';
const refreshTokenLife = '1d';

const router = express.Router();

//TODO this needs to be moved to a .env file
const secretKey = process.env.SECRET_KEY;

function generateAccessToken(username) {
    return jwt.sign({ username }, secretKey, { expiresIn: accessTokenLife });
}

function generateRefreshToken(username) {
    return jwt.sign({ username }, secretKey, { expiresIn: refreshTokenLife });
}

function setAuthCookiesAndHeader(res, username) {
    // Generate a new access token
    const accessToken = generateAccessToken(username);
    const refreshToken = generateRefreshToken(username);

    // Set the access token as an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, { domain:'kororos.eu', httpOnly: true, sameSite: 'strict' , secure: false, maxAge: 24 * 60 * 60 * 1000});
    res.header('Authorization', `Bearer ${accessToken}`);
    const data = { username: username, accessToken: accessToken };
    return  data;
}
// Login route
router.post('/login', (req, res) => {
    // Get the username and password from the request body
    const { username, password, redirectUrl } = req.body;

    // TODO: Implement your own validation logic here
    // For example, check if the username and password are correct
    if(username !== 'admin' || password !== 'admin') {
        // If the username and password are not valid, send an unauthorized status
        return res.sendStatus(401);
    }
    // // If the username and password are valid, generate a JWT token
    // const refreshToken = jwt.sign({ username }, secretKey, {expiresIn: '1d'} );
    // const accessToken = jwt.sign({ username},secretKey, {expiresIn: accessTokenLife} );

    // // Set the token as an HTTP-only cookie
    // //TODO For testing purposes, the domain is set to localhost. In a production environment, the domain should be set to the actual domain of the application.
    // res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' , secure: false, maxAge: 24 * 60 * 60 * 1000});
    // res.header('Authorization', `Bearer ${accessToken}`);
    setAuthCookiesAndHeader(res, username);
    // Send a success response
    res.send({ username: username });
});


router.get('/session/oauth/google', async (req, res) => {
    //Get the code from query string
    const code = req.query.code;
    //get the id and the access token with code 
    const {id_token, access_token} = await getGoogleOAuthTokens(code);
    //console.log('id_token', id_token); 
    //console.log('access_token', access_token);
    //console.log('req', req); 
    const redirect = JSON.parse(req.query.state);
    // get user with tokens
    const googleUser = jwt.decode(id_token);

    // upsert the user 
    const user = await db.User.upsert({
        name: googleUser.email,
        email: googleUser.email,
        family_name: googleUser.family_name,
        given_name: googleUser.given_name,
        photo_link: googleUser.picture,
        role: 'Guest'
    });

    // create the session 
  
    // create access and refresh token 
    let data = setAuthCookiesAndHeader(res, googleUser.email);
    data = encodeURIComponent(JSON.stringify({...data, redirectUrl: redirect.from}));   
    // redirect back to client
    res.redirect(`${redirect.baseUrl}/#/login_successful?data=${data}`);
    //res.redirect(redirect.baseUrl + '#' + redirect.from);
  });
export default router;
