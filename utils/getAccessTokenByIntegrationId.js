// utils/getAccessTokenByIntegrationId.js
const axios = require('axios');
const mongoDbClient = require('../utils/MongoClient');
const {getAppIntegrationsByIntegrationId, getAppIntegrationById} = require("../service/AppIntegrationService");
/**
 * Safely gets the accessToken using an integration ID.
 * Fetches token from DB (or renews if expired in future enhancement).
 * @param {string} integrationId - The stored integration reference (user/org-specific).
 * @returns {Promise<string>} accessToken
 */
async function getAccessTokenByIntegrationId(integrationId) {
    if (!integrationId) throw new Error("Missing integrationId");


    // const db = await mongoDbClient.getDatabase("main");
    // const collection = db.collection('appIntegrations');


    // Step 1: Get integration record from DB
    const integration = await getAppIntegrationById(integrationId); // You define this
    if (!integration) throw new Error("Integration not found");

    const {  credentials, expiresAt , refreshToken} = integration;

    const accessToken = credentials.accessToken

    // Step 2: (Optional) Check if token is expired (if you store expiry)
    if(refreshToken){
        if (expiresAt && new Date(expiresAt) < new Date()) {
            throw new Error("Access token expired — implement refresh logic if needed.");
        }
    }


    // Step 3: Return the valid access token
    return accessToken;
}

module.exports = getAccessTokenByIntegrationId;