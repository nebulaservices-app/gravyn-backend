// /integrations/google/calendar.service.js

const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const mongoDBClient = require('../../utils/MongoClient'); // Your MongoDB helper
require('dotenv').config();

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'openid',
    'email',
    'profile'
];

function getOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_AUTH_CLIENTID,
        process.env.CLIENT_SECRET_ID,
        "http://localhost:5001/api/v1/google_calendar/callback"
    );
}

async function getTokensFromCode(code) {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    return tokens;
}

exports.processGoogleCalendarOAuth = async ({ code, state }) => {
    const { userId, projectId, integrationId } = state;

    console.log("state recognition", state);

    const tokens = await getTokensFromCode(code);
    const { access_token, refresh_token } = tokens;

    console.log("Tokens are", access_token)


    // DB Operations
    const db = await mongoDBClient.getDatabase('main');
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');
    const integrationsCollection = db.collection('appIntegrations');

    // Upsert user
    let user = await usersCollection.findOne({ _id : new ObjectId(userId) });


    // Save integration info
    const integrationData = {
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
        integrationId: new ObjectId(integrationId),
        provider: 'google_calendar',
        accessToken: access_token,
        refreshToken: refresh_token,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await integrationsCollection.updateOne(
        { userId: user._id, projectId: new ObjectId(projectId), integrationId: new ObjectId(integrationId) },
        { $set: integrationData },
        { upsert: true }
    );

    // Add user to project if not already linked
    await projectsCollection.updateOne(
        { _id: new ObjectId(projectId), "users._id": { $ne: user._id } },
        {
            $addToSet: {
                users: {
                    _id: user._id,
                    name: user.name,
                    role: 'member',
                    permission: 'read',
                    appIntegrations: [integrationId]
                }
            }
        }
    );

    // You can set JWT or session here, or skip if only used for integration
    return true;
};