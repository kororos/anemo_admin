function getGoogleOAuthUrl(data) {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: JSON.stringify(data)
  };

  const queryString = new URLSearchParams(options).toString();

  return `${rootUrl}?${queryString}`;
}

export default getGoogleOAuthUrl;
