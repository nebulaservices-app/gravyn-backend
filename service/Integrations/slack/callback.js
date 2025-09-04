const axios = require('axios');
const mongoDBClient = require('../../../utils/MongoClient');

const handleSlackOAuthCallback = async (code, user) => {
    const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URI } = process.env;

    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
        params: {
            code,
            client_id: SLACK_CLIENT_ID,
            client_secret: SLACK_CLIENT_SECRET,
            redirect_uri: SLACK_REDIRECT_URI
        }
    });

    const { access_token, scope, team, authed_user, incoming_webhook } = response.data;

    if (!access_token || !team?.id) {
        throw new Error("Slack token response is incomplete");
    }

    const db = await mongoDBClient.getDatabase("main");
    const integrationCollection = db.collection("appIntegrations");

    await integrationCollection.insertOne({
        userId: user.id,
        integrationKey: 'slack',
        teamId: team.id,
        accessToken: access_token,
        grantedScopes: scope.split(','),
        webhookUrl: incoming_webhook?.url,
        authedUserId: authed_user.id,
        createdAt: new Date()
    });

    return { success: true };
};

module.exports = { handleSlackOAuthCallback };