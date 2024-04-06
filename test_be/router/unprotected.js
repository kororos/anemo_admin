import express from 'express';
import jwt from 'jsonwebtoken';
import { getGoogleOAuthTokens } from '../services/user.service.js';
import db from '../db/models/index.js';
import path  from 'path';
import e from 'express';

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

function setAuthCookiesAndHeader(res, username, role) {
    // Generate a new access token
    const accessToken = generateAccessToken(username);
    const refreshToken = generateRefreshToken(username);

    // Set the access token as an HTTP-only cookie
    const domain = process.env.NODE_ENV === 'production' ? 'kororos.eu' : 'localhost';
    if (process.env.NODE_ENV === 'production') {
        res.cookie('refreshToken', refreshToken, { domain: domain, httpOnly: true, sameSite: 'strict', secure: true, maxAge: 24 * 60 * 60 * 1000 });
    } else {
        res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict', secure: false, maxAge: 24 * 60 * 60 * 1000 });
    }
    //res.cookie('refreshToken', refreshToken, { domain:'kororos.eu', httpOnly: true, sameSite: 'strict' , secure: false, maxAge: 24 * 60 * 60 * 1000});
    res.header('Authorization', `Bearer ${accessToken}`);
    const data = { username: username, role: role, accessToken: accessToken };
    return data;
}
// Login route
router.post('/login', (req, res) => {
    // Get the username and password from the request body
    const { username, password, redirectUrl } = req.body;

    // TODO: Implement your own validation logic here
    // For example, check if the username and password are correct
    if (username !== 'admin' || password !== 'admin') {
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
    const { id_token, access_token } = await getGoogleOAuthTokens(code);
    //console.log('id_token', id_token); 
    //console.log('access_token', access_token);
    //console.log('req', req); 
    const redirect = JSON.parse(req.query.state);
    // get user with tokens
    const googleUser = jwt.decode(id_token);

    // upsert the user 
    const userData = await db.User.upsert({
        name: googleUser.email,
        email: googleUser.email,
        family_name: googleUser.family_name,
        given_name: googleUser.given_name,
        photo_link: googleUser.picture
    });
    // create the session 

    // create access and refresh token 
    let data = setAuthCookiesAndHeader(res, googleUser.email, userData[0].role);
    data = encodeURIComponent(JSON.stringify({ ...data, redirectUrl: redirect.from }));
    // redirect back to client
    res.redirect(`${redirect.baseUrl}/#/login_successful?data=${data}`);
    //res.redirect(redirect.baseUrl + '#' + redirect.from);
});

router.post('/refresh', (req, res) => {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
        return res.status(401).send('Access Denied. No refresh token provided.');
    }

    try {
        const decoded = jwt.verify(refreshToken, secretKey);
        //const accessToken = jwt.sign({ username: decoded.username }, secretKey, { expiresIn: accessTokenLife });
        const accessToken = generateAccessToken(decoded.username);
        res
            .header('Authorization', `Bearer ${accessToken}`)
            .send({ username: decoded.username });
    } catch (error) {
        return res.status(400).send('Invalid refresh token.');
    }
});

//# Create a GET API route at /api/otaUpdate to handle the OTA Update request
//# from the ESP8266HttpUpdate library

router.get('/api/otaUpdate', async (req, res) => {
    // Get the firmware version from the query string
    const currentFwVersion = req.headers['x-esp8266-version'];
    const hwVersion = '1.0';
    let availableFirmware;

    try{
        availableFirmware = await db.Firmware.findOne({
            where: {hwVersion: hwVersion},
            order: [['id', 'DESC']]
        });

        const ROOT =process.cwd() + path.sep + 'uploads' + path.sep;
        const dir = `${ROOT}${path.sep}${hwVersion}${path.sep}${availableFirmware.swVersion}`;
        if(currentFwVersion !== availableFirmware.swVersion){
            res.sendFile(`${dir}${path.sep}firmware.bin`);
        }else{
            res.status(304).send('No updates available');
        }
    }catch(error){
        console.error("error: ", error);
        res.status(500).json({message: 'An error occurred while fetching the firmware from DB'});
    }
});

export default router;
