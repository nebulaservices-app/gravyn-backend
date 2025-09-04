const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// OAuth2 Client
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'  // Redirect URL
);

// Generate the authentication URL
const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
});