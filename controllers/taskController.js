const mongoDBClient = require("../utils/MongoClient.js");
const {ObjectId} = require("mongodb");
const {fetchWeeklyTasks, updateTaskField} = require("../service/taskService");

// Get all tasks
const getAllTasks = async (req, res) => {
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({}).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get task by ID
const getTaskById = async (req, res) => {
    const { taskId } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const task = await collection.findOne({ _id: new ObjectId(taskId) });
        if (!task) return res.status(404).json({ error: "Task not found" });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch task" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get tasks by name
const getTasksByName = async (req, res) => {
    const { name } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({ name: { $regex: name, $options: "i" } }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks by name" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get tasks by assignee
const getTasksByAssignee = async (req, res) => {
    const { userId } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({ assignee: userId }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks by assignee" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get tasks by status
const getTasksByStatus = async (req, res) => {
    const { status } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({ status }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks by status" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get tasks using custom fields
const getTasksByCustomFields = async (req, res) => {
    const filters = req.body;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const query = {};
        for (const key in filters) {
            query[`customFields.${key}`] = filters[key];
        }

        const tasks = await collection.find(query).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to filter tasks" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get tasks by due date
const getTasksByDueDate = async (req, res) => {
    const { date } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({ dueDate: date }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks by due date" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get tasks by workspace
const getTasksByWorkspace = async (req, res) => {
    const { workspaceId } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({ workspaceId }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks by workspace" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Search tasks by keyword
const searchTasks = async (req, res) => {
    const { keyword } = req.query;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({
            $or: [
                { name: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } }
            ]
        }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Search failed" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get tasks by date range
const getTasksByDateRange = async (req, res) => {
    const { from, to } = req.query;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({
            createdAt: {
                $gte: new Date(from),
                $lte: new Date(to)
            }
        }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks by date range" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get overdue tasks
const getOverdueTasks = async (req, res) => {
    const today = new Date().toISOString().split("T")[0];
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({
            dueDate: { $lt: today },
            status: { $ne: "completed" }
        }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch overdue tasks" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get top priority tasks
const getTopTasks = async (req, res) => {
    const { limit } = req.query;
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const tasks = await collection.find({})
            .sort({ "customFields.priority": -1 })
            .limit(Number(limit))
            .toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch top tasks" });
    } finally {
        // await mongoDBClient.close();
    }
};


// Get tasks by project name
const getTasksByProjectName = async (req, res) => {
    const { projectName } = req.params;
    const db = await mongoDBClient.getDatabase("main");

    try {
        const project = await db.collection("projects").findOne({ name: projectName });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        const tasks = await db.collection("tasks").find({ projectId: project._id.toString() }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks by project name" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get tasks by list of IDs
const getTasksByIds = async (req, res) => {
    const { ids } = req.body; // expects: { ids: ["id1", "id2", ...] }

    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "IDs must be an array" });
    }

    const db = await mongoDBClient.getDatabase("main");

    try {
        const objectIds = ids.map(id => new ObjectId(id));
        const tasks = await db.collection("tasks").find({ _id: { $in: objectIds } }).toArray();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks by IDs" });
    } finally {
        // await mongoDBClient.close();
    }
};

// Get tasks by project ID
const getTasksByProjectId = async (req, res) => {
    const { projectId } = req.params;
    const db = await mongoDBClient.getDatabase("main");
    const oid = new ObjectId(projectId)
    try {
        const tasks = await db.collection("tasks").find({ projectId : oid }).toArray();
        if (tasks.length === 0) {
            return res.status(404).json({ error: "No tasks found for this project" });
        }

        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch tasks by project ID" });
    } finally {
        // if(mongoDBClient) await mongoDBClient.close();
    }
};


const getTasksByCurrentWeek = async (req, res) => {
    try {
        const { projectId } = req.params;
        const data = await fetchWeeklyTasks(projectId);
        res.status(200).json(data);
    } catch (error) {
        console.error("❌ Error fetching weekly tasks:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
    finally {
        // if(mongoDBClient) await mongoDBClient.close();
    }
};


const updateTaskFieldController = async (req, res) => {
    const { taskId } = req.params;
    const { field, value } = req.body;

    if (!taskId || !field || typeof value === "undefined") {
        return res.status(400).json({ error: "Missing taskId, field or value in request" });
    }

    try {
        const result = await updateTaskField(taskId, field, value);
        res.status(200).json({ message: "Task updated successfully", result });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Failed to update task", details: error.message });
    }
};
// Update task dueDate
const updateTaskDueDate = async (req, res) => {
    const { taskId } = req.params;
    const { dueDate } = req.body;

    if (!dueDate) {
        return res.status(400).json({ error: "Missing dueDate" });
    }


    console.log("TASK DATA", taskId , dueDate)
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    try {
        const result = await collection.updateOne(
            { _id: new ObjectId(taskId) },
            { $set: { dueDate } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.status(200).json({ message: "Due date updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update dueDate", details: err.message });
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    getTasksByName,
    getTasksByAssignee,
    getTasksByStatus,
    getTasksByCustomFields,
    getTasksByDueDate,
    getTasksByWorkspace,
    searchTasks,
    getTasksByDateRange,
    getOverdueTasks,
    getTopTasks,
    getTasksByProjectName,
    getTasksByIds,
    getTasksByProjectId,
    getTasksByCurrentWeek,
    updateTaskFieldController,
    updateTaskDueDate
};