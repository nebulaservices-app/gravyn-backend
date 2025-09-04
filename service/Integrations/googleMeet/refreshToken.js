const axios = require('axios');
const mongoDBClient = require('../../../utils/MongoClient');
const { ObjectId } = require('mongodb');

const refreshGoogleToken = async (integrationInstanceId) => {
    const db = await mongoDBClient.getDatabase('main');
    const appIntegrations = db.collection('appIntegrations');
    const integrationCollection = db.collection('Integrations');
    console.log("We are getting a new access token from the refresh token usage here with integration ID" , integrationInstanceId)


    const instance = await appIntegrations.findOne({ _id: new ObjectId(integrationInstanceId) });


    console.log("We are getting a new access token from the refresh token usage here" , instance)
    if (!instance) throw new Error("Integration instance not found.");

    const integration = await integrationCollection.findOne({ _id: new ObjectId(instance.integrationId) });
    if (!integration?.oauth) throw new Error("OAuth config not found.");

    const { clientId, clientSecret, tokenUrl } = integration.oauth;

    const tokenRes = await axios.post(tokenUrl, null, {
        params: {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: instance.refreshToken,
            grant_type: 'refresh_token',
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, expires_in } = tokenRes.data;
    if (!access_token) throw new Error("Access token refresh failed.");

    const newExpiry = new Date(Date.now() + expires_in * 1000);

    await appIntegrations.updateOne(
        { _id: new ObjectId(integrationInstanceId) },
        {
            $set: {
                accessToken: access_token,
                tokenExpiry: newExpiry
            }
        }
    );

    return { accessToken: access_token };
};

module.exports = { refreshGoogleToken };