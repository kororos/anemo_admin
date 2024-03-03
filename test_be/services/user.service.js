import axios from 'axios';
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
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
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