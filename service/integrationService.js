const mongoDBClient = require("../utils/MongoClient");
const {ObjectId} = require("mongodb");

const getIntegrationCollection = async () => {
    const db = await mongoDBClient.getDatabase('main');
    return db.collection('Integrations');
};

// Insert a new integration
const createIntegration = async (integrationData) => {
    const collection = await getIntegrationCollection();
    return await collection.insertOne(integrationData);
};

// Get all integrations
const getIntegrations = async () => {
    const collection = await getIntegrationCollection();
    return await collection.find().toArray();
};

// Get integration by ID
const getIntegrationById = async (integrationId) => {

    console.log("Fetching the integration " , integrationId)
    const collection = await getIntegrationCollection();
    const integration = await collection.findOne({ _id: new ObjectId(integrationId) });
    return integration;
};

// Update integration
const updateIntegration = async (integrationId, updateData) => {
    const collection = await getIntegrationCollection();
    return await collection.updateOne({ _id: integrationId }, { $set: updateData });
};

// Delete integration
const deleteIntegration = async (integrationId) => {
    const collection = await getIntegrationCollection();
    return await collection.deleteOne({ _id: integrationId });
};

module.exports = {
    createIntegration,
    getIntegrations,
    getIntegrationById,
    updateIntegration,
    deleteIntegration,
};