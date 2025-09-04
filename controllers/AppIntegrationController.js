const AppIntegrationService = require("../service/AppIntegrationService");
const { ObjectId } = require("mongodb");

// ✅ Create new appIntegration
const createAppIntegration = async (req, res) => {
    try {
        const result = await AppIntegrationService.createAppIntegration(req.body);
        res.status(201).json({ success: true, insertedId: result.insertedId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ✅ Get all
const getAllAppIntegrations = async (req, res) => {
    try {
        const data = await AppIntegrationService.getAllAppIntegrations();
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ✅ Get by _id
const getAppIntegrationById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await AppIntegrationService.getAppIntegrationById(id);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ✅ Get by user + project + key
const getAppIntegrationByUserAndProject = async (req, res) => {
    try {
        const { userId, projectId, key } = req.query;
        const data = await AppIntegrationService.getAppIntegrationByUserAndProject(
            new ObjectId(userId),
            new ObjectId(projectId),
            key
        );
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ✅ Update token or any field
const updateAppIntegration = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await AppIntegrationService.updateAppIntegration(id, req.body);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ✅ Delete
const deleteAppIntegration = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await AppIntegrationService.deleteAppIntegration(id);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    createAppIntegration,
    getAllAppIntegrations,
    getAppIntegrationById,
    getAppIntegrationByUserAndProject,
    updateAppIntegration,
    deleteAppIntegration
};