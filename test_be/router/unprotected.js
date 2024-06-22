import express from 'express';
import jwt from 'jsonwebtoken';
import { getGoogleOAuthTokens } from '../services/user.service.js';
import db from '../db/models/index.js';
import path  from 'path';
import { log } from 'console';

const accessTokenLife = '2m';
const refreshTokenLife = '1d';

const router = express.Router();

//TODO this needs to be moved to a .env file
const secretKey = process.env.SECRET_KEY;

/**
 * Generates an access token for the given username.
 * This function uses the jsonwebtoken library to generate a JWT access token with the username as the payload.
 * The token is signed with a secret key and has a specified lifespan.
 *
 * @param {string} username - The username for which to generate the access token.
 * @returns {string} - A JWT access token.
 */
function generateAccessToken(username) {
    return jwt.sign({ username }, secretKey, { expiresIn: accessTokenLife });
}

/**
 * Generates a refresh token for the given username.
 * This function uses the jsonwebtoken library to generate a JWT refresh token with the username as the payload.
 * The token is signed with a secret key and has a specified lifespan.
 *
 * @param {string} username - The username for which to generate the refresh token.
 * @returns {string} - A JWT refresh token.
 */
function generateRefreshToken(username) {
    return jwt.sign({ username }, secretKey, { expiresIn: refreshTokenLife });
}

/**
 * Sets the authentication cookies and header for the response.
 * This function generates an access token and a refresh token for the given username,
 * sets them as HTTP-only cookies, and sets the 'Authorization' header with the access token.
 *
 * @param {Object} res - The Express response object.
 * @param {string} username - The username for which to generate the tokens.
 * @param {string} role - The role of the user.
 * @returns {Object} - An object containing the username, role, and access token.
 */
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

 /**
 * POST /login
 * This route handler authenticates a user.
 * It receives a username and password from the request body, validates them,
 * generates an access token and a refresh token, sets them as HTTP-only cookies,
 * and sends a success response with the username and role.
 *
 * @param {Object} req - The Express request object. The request body should contain a 'username' and 'password'.
 * @param {Object} res - The Express response object. The response will contain the 'username' and 'role' in the response body.
 * @returns {Promise<void>} - A Promise that resolves when the method has finished executing.
 */
router.post('/login', async(req, res) => {
    // Get the username and password from the request body
    const { username, password, redirectUrl } = req.body;

    // TODO: Implement your own validation logic here
    // For example, check if the username and password are correct

    const user = await db.User.findOne({ where: { name: username, password: password, status: 'active' } });
    if (!user) {
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
    setAuthCookiesAndHeader(res, username, user.role.toLowerCase());
    // Send a success response
    res.send({ username: username, role: user.role.toLowerCase() });
});

/**
 * Route handling method for '/session/oauth/google'.
 * This method handles the OAuth process with Google.
 * It receives a code from the query string, exchanges it for an ID token and an access token,
 * decodes the ID token to get the user's Google profile information,
 * and then upserts (updates or inserts) the user in the database.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the method has finished executing.
 */
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

/**
 * POST /refresh
 * This route handler refreshes the user's access token.
 * It receives a refresh token from the request cookies, verifies it,
 * generates a new access token, sets the 'Authorization' header with the new access token,
 * and sends a success response with the username and role.
 *
 * @param {Object} req - The Express request object. The request cookies should contain a 'refreshToken'.
 * @param {Object} res - The Express response object. The response will contain the 'username' and 'role' in the response body.
 * @returns {Promise<void>} - A Promise that resolves when the method has finished executing.
 */
router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
        return res.status(401).send('Access Denied. No refresh token provided.');
    }

    try {
        const decoded = jwt.verify(refreshToken, secretKey);
        //const accessToken = jwt.sign({ username: decoded.username }, secretKey, { expiresIn: accessTokenLife });
        const user = await db.User.findOne({ where: { name: decoded.username, status: 'active' } });
        if (!user) {
            return res.status(401).send('Access Denied. User not found.');
        }
        const accessToken = generateAccessToken(decoded.username);
        res
            .header('Authorization', `Bearer ${accessToken}`)
            .send({ username: decoded.username, role: user.role.toLowerCase()});
    } catch (error) {
        return res.status(400).send('Invalid refresh token.');
    }
});

/**
 * GET /api/otaUpdate
 * This route handler handles the OTA (Over The Air) update process.
 * It receives a firmware version and a MAC address from the request headers,
 * checks if there is a pending firmware update request for the given MAC address,
 * and if there is, it checks if the requested firmware version is available.
 * If the requested firmware version is available, it sends it in the response.
 * If not, it sends a 'No firmware request found for the given mac' message.
 *
 * @param {Object} req - The Express request object. The request headers should contain 'x-esp8266-version' and 'x-esp8266-sta-mac'.
 * @param {Object} res - The Express response object. The response will contain the firmware file or a message.
 * @returns {Promise<void>} - A Promise that resolves when the method has finished executing.
 */
router.get('/api/otaUpdate', async (req, res) => {
    // Get the firmware version from the query string
    const currentFullVersion = req.headers['x-esp8266-version'];
    const hwVersion = currentFullVersion.split('-')[0];
    const fwVersion = currentFullVersion.split('-')[1];

    try{
        const requestedFirmware = await db.PendingUpdates.findOne({
            where: {status: 'PENDING', macAddress: req.headers['x-esp8266-sta-mac']},
            order: [['id', 'DESC']]
        });
        if(!requestedFirmware){
            res.status(304).json({message: 'No firmware request found for the given mac'});
            return;
        }
        const availableFirmware = await db.Firmware.findOne({
            where: {hwVersion: hwVersion, swVersion: requestedFirmware.requestedFwVersion},
            order: [['id', 'DESC']]
        });
        if(!availableFirmware){
            res.status(304).json({message: 'No firmware found for the given hwVersion'});
            return;
        }
        const ROOT =process.cwd() + path.sep + 'uploads' + path.sep;
        const dir = `${ROOT}${path.sep}${hwVersion}${path.sep}${availableFirmware.swVersion}`;
        if(fwVersion !== availableFirmware.swVersion){
            res.sendFile(`${dir}${path.sep}firmware.bin`);
            await db.PendingUpdates.update({status: 'COMPLETED'}, {where: {id: requestedFirmware.id}});
        }else{
            res.status(304).send('No updates available');
        }
    }catch(error){
        console.error("error: ", error);
        res.status(500).json({message: 'An error occurred while fetching the firmware from DB'});
    }
});


/**
    * GET /api/otaUpdateCheck
    * This route handler checks if there is a new firmware version available.
    * It receives the current firmware version from the request headers,
    * checks if the firmware version is '0.0.0',
    *
    * If the firmware version is '0.0.0', it sends a 'New firmware available' message with the new firmware version.
    * If not, it sends a 'No updates available' message.
    * 
    * @param {Object} req - The Express request object. The request headers should contain 'x-esp8266-version'.
    * @param {Object} res - The Express response object. The response will contain a message.
    * @returns {Promise<void>} - A Promise that resolves when the method has finished executing.
    * 
 */
router.get('/api/otaUpdateCheck', async (req, res) => {
    log('req.headers', req.headers);
    
    // Get the firmware version from the query string
    const currentFullVersion = req.headers['x-esp32-version'];
    if(!currentFullVersion){
        res.status(400).json({message: 'Invalid request'});
        return;
    }
    const hwVersion = currentFullVersion.split('-')[1];
    const swVersion = currentFullVersion.split('-')[0];
    
    if(swVersion === '0.0.0'){
        res.status(200).json({message: 'New firmware available', version: '1.0.0'});
        return;
    }else{
        res.status(304).json({message: 'No updates available'});
        return;
    }
});


export default router;
