const axios = require("axios");
const { ObjectId } = require("mongodb");
const mongoClient = require("../../utils/MongoClient");

exports.processGitHubOAuth = async ({ code, state }) => {
    const { userId, projectId, integrationId } = state;

    const clientId = "Ov23liiuFfItvOICegEj";
    const clientSecret = "5afe7c416dcd29bb25d9f9d4846b8548243661d8";

    const tokenRes = await axios.post(
        `https://github.com/login/oauth/access_token`,
        {
            client_id: clientId,
            client_secret: clientSecret,
            code,
        },
        {
            headers: {
                Accept: "application/json"
            }
        }
    );

    const accessToken = tokenRes.data.access_token;

    if (!accessToken) {
        console.error("❌ Access token not received from GitHub");
        throw new Error("GitHub access token not received");
    }

    const db = await mongoClient.getDatabase('main');
    const integrationsCollection = db.collection('appIntegrations');
    const usersCollection = db.collection('users');
    const projectsCollection = db.collection('projects');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    const integrationData = {
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
        integrationId: new ObjectId(integrationId),
        provider: 'github',
        accessToken: accessToken,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await integrationsCollection.updateOne(
        {
            userId: new ObjectId(userId),
            projectId: new ObjectId(projectId),
            integrationId: new ObjectId(integrationId)
        },
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

    return true;
};