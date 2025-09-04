const axios = require('axios');
const mongoDBClient = require('../../../utils/MongoClient');
const { ObjectId } = require('mongodb');

const handleGitHubOAuthCallback = async ({ code, userId, projectId, integrationId }) => {
    const db = await mongoDBClient.getDatabase("main");

    const integrationCollection = db.collection("Integrations");
    const appIntegrationCollection = db.collection("appIntegrations");

    // Fetch OAuth config from DB
    const integrationConfig = await integrationCollection.findOne({ _id: new ObjectId(integrationId) });

    if (!integrationConfig || !integrationConfig.oauth) {
        throw new Error("❌ GitHub OAuth configuration not found.");
    }

    const { clientId, clientSecret, redirectUri, tokenUrl } = integrationConfig.oauth;

    const tokenResponse = await axios.post(tokenUrl || 'https://github.com/login/oauth/access_token', {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
    }, {
        headers: {
            Accept: 'application/json'
        }
    });

    const { access_token, scope, token_type } = tokenResponse.data;

    if (!access_token) {
        throw new Error("❌ GitHub token exchange failed.");
    }

    await appIntegrationCollection.insertOne({
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
        integrationId: new ObjectId(integrationId),
        key: 'github',
        accessToken: access_token,
        tokenType: token_type,
        grantedScopes: scope?.split(',') || [],
        createdAt: new Date()
    });

    return { success: true };
};

module.exports = { handleGitHubOAuthCallback };