// googleOAuthService.js
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_AUTH_CLIENTID,
    process.env.CLIENT_SECRET_ID,
    'http://localhost:5001/auth/google/callback' // Redirect URI
);

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'openid',
    'email',
    'profile'
];
function getAuthUrl(state) {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        state: JSON.stringify(state) // Pass userId, projectId, integrationI
    });
}

async function getTokensFromCode(code) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
}

module.exports = { getAuthUrl, getTokensFromCode };