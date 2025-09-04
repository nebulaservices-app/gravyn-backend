const { ObjectId } = require("mongodb");
const mongoDBClient =   require("../utils/MongoClient.js");

// Get all workspaces
const getAllWorkspaces = async (req, res) => {
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("workspaces");

    try {
        const workspaces = await collection.find({}).toArray();
        res.json(workspaces);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch workspaces" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};

const getWorkspaceById = async (req, res) => {
    const { workspaceId } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("workspaces");

    try {
        const workspace = await collection.findOne({ _id: new ObjectId(workspaceId) });
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        res.json(workspace);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch workspace" })
    } finally {
        // if(mongoDBClient) await mongoDBClient.close();
    }
};

const getWorkspacesByName = async (req, res) => {
    const { name } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("workspaces");

    try {
        const workspaces = await collection.find({ name: { $regex: name, $options: "i" } }).toArray();
        if (workspaces.length === 0) {
            return res.status(404).json({ error: "No workspaces found with that name" });
        }
        res.json(workspaces);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch workspaces by name" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};

const getWorkspacesByMember = async (req, res) => {
    const { memberId } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("workspaces");

    try {
        const workspaces = await collection.find({ members: memberId }).toArray();
        if (workspaces.length === 0) {
            return res.status(404).json({ error: "No workspaces found for that member" });
        }
        res.json(workspaces);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch workspaces by member" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};

const getWorkspacesByCreationDate = async (req, res) => {
    const { date } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("workspaces");

    try {
        const workspaces = await collection.find({ createdAt: { $gt: new Date(date) } }).toArray();
        if (workspaces.length === 0) {
            return res.status(404).json({ error: "No workspaces found after that date" });
        }
        res.json(workspaces);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch workspaces by creation date" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};

const createWorkspace = async (req, res) => {
    const { name, members } = req.body;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("workspaces");

    try {
        const newWorkspace = {
            name,
            createdAt: new Date(),
            members,
        };

        const result = await collection.insertOne(newWorkspace);
        res.status(201).json({ _id: result.insertedId, ...newWorkspace });
    } catch (err) {
        res.status(500).json({ error: "Failed to create workspace" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};

const updateWorkspace = async (req, res) => {
    const { workspaceId } = req.params;
    const { name, members } = req.body;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("workspaces");

    try {
        const updatedFields = {
            ...(name && { name }),
            ...(members && { members }),
            updatedAt: new Date(),
        };

        const result = await collection.updateOne(
            { _id: new ObjectId(workspaceId) },
            { $set: updatedFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        res.json({ message: "Workspace updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update workspace" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};

const deleteWorkspace = async (req, res) => {
    const { workspaceId } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("workspaces");

    try {
        const result = await collection.deleteOne({ _id: new ObjectId(workspaceId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        res.json({ message: "Workspace deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete workspace" });
    } finally {
        if(mongoDBClient) await mongoDBClient.close();
    }
};


module.exports = {
    getAllWorkspaces,
    getWorkspaceById,
    getWorkspacesByName,
    getWorkspacesByMember,
    getWorkspacesByCreationDate,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
};