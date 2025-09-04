const mongoDBClient = require("../utils/MongoClient");
const { ObjectId } = require("mongodb");

const getAppIntegrationsCollection = async () => {
    const db = await mongoDBClient.getDatabase("main");
    return db.collection("appIntegrations");
};
/**
 * ✅ INITIATE: Creates a new, pending appIntegration record.
 * This is a secure way to start the connection flow.
 */




const createAppIntegration = async (creationData) => {
    const { userId, projectId, key } = creationData;

    // Securely construct the new document on the backend.
    // This prevents the frontend from sending a "status: active" or other malicious data.
    const newDoc = {
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
        key: key,
        status : "active",
        credentials: {},   // Always starts with empty credentials.
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const collection = await getAppIntegrationsCollection();
    const result = await collection.insertOne(newDoc);

    // Return the full document that was just created.
    return await collection.findOne({ _id: result.insertedId });
};


// ✅ Get all appIntegrations
const getAllAppIntegrations = async () => {
    const collection = await getAppIntegrationsCollection();
    return await collection.find({}).toArray();
};

// ✅ Get appIntegration by _id
const getAppIntegrationById = async (id) => {
    const collection = await getAppIntegrationsCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
};

// ✅ Get appIntegrations by userId
const getAppIntegrationsByUserId = async (userId) => {
    const collection = await getAppIntegrationsCollection();
    return await collection.find({ userId }).toArray();
};

// ✅ Get appIntegrations by projectId
const getAppIntegrationsByProjectId = async (projectId) => {
    const collection = await getAppIntegrationsCollection();
    return await collection.find({ projectId }).toArray();
};

// ✅ Get appIntegrations by integrationId
const getAppIntegrationsByIntegrationId = async (integrationId) => {
    const collection = await getAppIntegrationsCollection();
    return await collection.find({ integrationId }).toArray();
};

// ✅ Update accessToken and refreshToken
const updateTokens = async (id, accessToken, refreshToken) => {
    const collection = await getAppIntegrationsCollection();
    return await collection.updateOne(
        { _id: new ObjectId(id) },
        {
            $set: {
                accessToken,
                refreshToken,
                updatedAt: new Date(),
            },
        }
    );
};

// ✅ Update any fields in appIntegration
const updateAppIntegration = async (id, updateData) => {
    updateData.updatedAt = new Date();
    const collection = await getAppIntegrationsCollection();
    return await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
    );
};

// ✅ Delete appIntegration by _id
const deleteAppIntegration = async (id) => {
    const collection = await getAppIntegrationsCollection();
    return await collection.deleteOne({ _id: new ObjectId(id) });
};

// ✅ Export all appIntegrations (e.g., to CSV or JSON)
const exportAppIntegrations = async () => {
    const collection = await getAppIntegrationsCollection();
    const data = await collection.find({}).toArray();
    // You can write this data to a file or send it to the frontend
    return data;
};

// ✅ Get appIntegration by userId + projectId
const getAppIntegrationByUserAndProject = async (userId, projectId, key) => {
    console.log("Trying to find");
    const collection = await getAppIntegrationsCollection();

    const query = {
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
    };

    console.log("Query for fetching  ", query)

    // Only add provider to query if key is provided
    if (key) {
        query.provider = key;
        const result = await collection.findOne(query);
        return result;
    } else {
        const results = await collection.find(query).toArray();
        return results;
    }
};
module.exports = {
    createAppIntegration,
    getAllAppIntegrations,
    getAppIntegrationById,
    getAppIntegrationsByUserId,
    getAppIntegrationsByProjectId,
    getAppIntegrationsByIntegrationId,
    updateTokens,
    updateAppIntegration,
    deleteAppIntegration,
    exportAppIntegrations,
    getAppIntegrationByUserAndProject
};