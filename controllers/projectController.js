const { ObjectId } = require("mongodb");
const mongoDBClient = require("../utils/MongoClient.js");
const {getLatestProjectUpdateFromDB} = require("../service/projectService");
const {triggerDriftIQCheck} = require("../Features/DriftIQ/driftIQTrigger");

// Get all projects
const getAllProjects = async (req, res) => {
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("projects");

    try {
        const projects = await collection.find({}).toArray();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch projects" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};

// Get project by ID
const getProjectById = async (req, res) => {
    const { projectId } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = await db.collection("projects");

    try {
        const project = await collection.findOne({ _id: new ObjectId(projectId) });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch project" });
    } finally {
        // if(mongoDBClient) await mongoDBClient.close();
    }
};

// Filter projects by custom fields (dynamic filtering)
const filterProjects = async (req, res) => {
    const { field, value } = req.params;  // e.g. 'name' and 'value' for filtering by project name
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("projects");

    try {
        // Dynamically building the query for filtering projects
        const query = {};
        query[field] = { $regex: value, $options: "i" };  // Case-insensitive matching

        const filteredProjects = await collection.find(query).toArray();
        if (filteredProjects.length === 0) {
            return res.status(404).json({ error: `No projects found with ${field}: ${value}` });
        }
        res.json(filteredProjects);
    } catch (err) {
        res.status(500).json({ error: "Failed to filter projects" });
    } finally {
        // if(mongoDBClient) await mongoDBClient.close();
    }
};

// Create a new project
const createProject = async (req, res) => {
    const { name, category, status, startDate, endDate, description } = req.body;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("projects");

    try {
        const newProject = {
            name,
            category,
            status,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            description,
            createdAt: new Date(),
        };

        const result = await collection.insertOne(newProject);
        res.status(201).json({ _id: result.insertedId, ...newProject });
    } catch (err) {
        res.status(500).json({ error: "Failed to create project" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};

// Update project details
const updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { name, category, status, startDate, endDate, description } = req.body;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("projects");

    try {
        const updatedFields = {
            ...(name && { name }),
            ...(category && { category }),
            ...(status && { status }),
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate && { endDate: new Date(endDate) }),
            ...(description && { description }),
            updatedAt: new Date(),
        };

        const result = await collection.updateOne(
            { _id: new ObjectId(projectId) },
            { $set: updatedFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.json({ message: "Project updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update project" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};

// Delete a project
const deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("projects");

    try {
        const result = await collection.deleteOne({ _id: new ObjectId(projectId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.json({ message: "Project deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete project" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};











const getLatestProjectUpdate = async (req, res) => {
    try {
        const { projectId } = req.params;
        const update = await getLatestProjectUpdateFromDB(projectId);
        if (!update) {
            return res.status(404).json({ message: "No updates found for this project." });
        }
        return res.json(update);
    } catch (err) {
        console.error("Error fetching project update:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};


/**
 * Check project for drift bottlenecks using triggerDriftIQCheck
 */
const checkProjectForDrift = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, forceFresh = false } = req.body;

        console.log(`🔍 DriftIQ check requested for project: ${projectId} by user: ${userId}`);
        if (forceFresh) {
            console.log('🔄 Force refresh requested - fetching latest task data');
        }

        // Validate required parameters
        if (!projectId) {
            return res.status(400).json({
                success: false,
                error: "Project ID is required"
            });
        }

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "User ID is required"
            });
        }

        // Pass forceFresh option to triggerDriftIQCheck
        const result = await triggerDriftIQCheck(projectId, { forceFresh });

        // Handle the response based on result
        if (result.success && result.hasDrift) {
            console.log("🚨 Drift detected for project:", projectId);
            console.log(`📊 Graph data available for ${result.graphData?.projectWLCData?.length || 0} users`);

            res.status(200).json({
                success: true,
                needsAttention: true,
                drift: result.drift,
                graphData: result.graphData,
                message: "Drift bottleneck detected",
                timestamp: new Date(),
                projectId,
                forceFresh // Echo back to confirm fresh data was used
            });
        } else if (result.success && !result.hasDrift) {
            console.log("✅ No drift needed for project:", projectId);

            res.status(200).json({
                success: true,
                needsAttention: false,
                drift: null,
                graphData: result.graphData,
                message: "No bottlenecks detected - team workload is healthy",
                timestamp: new Date(),
                projectId,
                forceFresh
            });
        } else {
            console.log("❌ DriftIQ check failed for project:", projectId);

            res.status(500).json({
                success: false,
                error: result.error || "DriftIQ analysis failed",
                message: "Failed to analyze project for bottlenecks",
                graphData: null
            });
        }

    } catch (error) {
        console.error("❌ Error in checkProjectForDrift:", error.message);

        res.status(500).json({
            success: false,
            error: error.message,
            message: "Internal server error during drift analysis",
            timestamp: new Date(),
            graphData: null
        });
    }
};


module.exports = {
    getAllProjects,
    getProjectById,
    filterProjects,
    createProject,
    updateProject,
    deleteProject,
    getLatestProjectUpdate,
    checkProjectForDrift
};