import axios from 'axios';
import config from '../db/config/config';

export async function getGoogleOAuthTokens(code) {
    const url = 'https://oauth2.googleapis.com/token';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    const data = {
        code,
        client_id: config[process.env.NODE_ENV].googleClientId,
        client_secret: config[process.env.NODE_ENV].googleClientSecret,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
    }


    try {
        const res = await axios.post(url, data, options);
        return res.data;
    } catch (error) {
        console.error('Failed to fetch Google OAuth tokens:', error);
    }
}