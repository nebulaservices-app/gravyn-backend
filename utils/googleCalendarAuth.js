// /utils/googleAuth.js
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3001/auth/google/callback' // Redirect URL
);

module.exports = oauth2Client;