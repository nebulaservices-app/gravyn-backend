const axios = require('axios');
const mongoDBClient = require('../../../utils/MongoClient');
const { ObjectId } = require('mongodb');

const handleGoogleMeetOAuthCallback = async ({ code, userId, projectId, integrationId }) => {
    const db = await mongoDBClient.getDatabase('main');

    const integrationConfig = await db.collection('Integrations').findOne({ _id: new ObjectId(integrationId) });
    if (!integrationConfig?.oauth) throw new Error("Google Meet OAuth config not found.");

    const { clientId, clientSecret, redirectUri, tokenUrl } = integrationConfig.oauth;

    const tokenRes = await axios.post(tokenUrl, null, {
        params: {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    if (!access_token) throw new Error("Google token missing");

    await db.collection('appIntegrations').insertOne({
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
        integrationId: new ObjectId(integrationId),
        key: 'google_meet',
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: new Date(Date.now() + expires_in * 1000),
        createdAt: new Date()
    });

    return { success: true };
};

module.exports = { handleGoogleMeetOAuthCallback };