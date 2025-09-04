const { createIntegration, getIntegrations, getIntegrationById, updateIntegration, deleteIntegration } = require('../service/integrationService');
const mongoDBClient = require("../utils/MongoClient.js");
const {ObjectId} = require("mongodb");

// Create a new integration
const createNewIntegration = async (req, res) => {
    try {
        const integrationData = req.body;
        const result = await createIntegration(integrationData);
        res.status(201).json({ message: "Integration created successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Error creating integration", error: error.message });
    }
};

// Get all integrations
const getAllIntegrations = async (req, res) => {
    try {
        const integrations = await getIntegrations();
        res.status(200).json(integrations);
    } catch (error) {
        res.status(500).json({ message: "Error fetching integrations", error: error.message });
    }
};

// Get a specific integration by ID
const getIntegration = async (req, res) => {
    try {
        const { integrationId } = req.params;

        console.log("Getting the integration using id " , integrationId)
        const integration = await getIntegrationById(integrationId);
        if (integration) {
            res.status(200).json(integration);
        } else {
            res.status(404).json({ message: "Integration not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error fetching integration", error: error.message });
    }
};

// Update an integration
const updateIntegrationData = async (req, res) => {
    try {
        const { integrationId } = req.params;
        const updateData = req.body;
        const result = await updateIntegration(integrationId, updateData);
        if (result.modifiedCount > 0) {
            res.status(200).json({ message: "Integration updated successfully" });
        } else {
            res.status(404).json({ message: "Integration not found or no changes made" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating integration", error: error.message });
    }
};

// Delete an integration
const deleteIntegrationData = async (req, res) => {
    try {
        const { integrationId } = req.params;
        const result = await deleteIntegration(integrationId);
        if (result.deletedCount > 0) {
            res.status(200).json({ message: "Integration deleted successfully" });
        } else {
            res.status(404).json({ message: "Integration not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error deleting integration", error: error.message });
    }
};


const runValidation = async (req, res) => {

    const { userId, integrationId, projectId } = req.query;

    console.log("Checking integration with params:", { userId, integrationId, projectId });

    // Validate query parameters
    if (!userId || !integrationId || !projectId) {
        return res.status(400).json({ message: 'Missing required query parameters' });
    }

    try {
        const db = await mongoDBClient.getDatabase('main');
        const collection = db.collection('appIntegrations');

        // Check the integration in the database
        const integration = await collection.findOne({
            userId : new ObjectId(userId),
            integrationId: new ObjectId(integrationId),
            projectId : new ObjectId(projectId),
        });

        if (integration) {
            return res.status(200).json({ isConnected: true, integration });
        }


        return res.status(200).json({ isConnected: false });

    } catch (err) {
        console.error('Error checking integration:', err);  // Log detailed error
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const deleteAppIntegration = async (req, res) => {
    const { integrationId, userId, projectId } = req.query;


    console.log("Deleting integration...",  integrationId, userId, projectId )

    if (!integrationId || !userId || !projectId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const db = await mongoDBClient.getDatabase('main');
        const collection = db.collection('appIntegrations');
        const deleted = await collection.deleteOne({
            integrationId : new ObjectId(integrationId),
            userId : new ObjectId(userId),
            projectId : new ObjectId(projectId),
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Integration not found' });
        }

        return res.status(200).json({ message: 'Integration deleted successfully' });
    } catch (error) {
        console.error('Error deleting integration:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    createNewIntegration,
    getAllIntegrations,
    getIntegration,
    updateIntegrationData,
    deleteIntegrationData,
    runValidation,
    deleteAppIntegration
};