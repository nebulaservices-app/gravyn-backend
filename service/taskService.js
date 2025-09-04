const mongoDBClient =  require("../utils/MongoClient.js");
const { ObjectId } =  require("mongodb");






// CREATING A TASK


async function createTask({ projectId, assignedTo, title, description, subtasks = [], priority, dueDate }) {
    const db = await mongoDBClient.getDatabase("main");
    const tasksCollection = db.collection("tasks");

    const now = new Date();
    const taskId = new ObjectId();

    // 🧠 Use kairoTime to get estimated time to complete this task
    const estimatedSeconds = await kairoTime.estimateCompletionTime({
        title,
        description,
        subtasks,
        projectTitle: await getProjectTitle(db, projectId),
        today: now,
        projectStartDate: await getProjectStartDate(db, projectId),
        projectDeadline: dueDate
    });

    const task = {
        _id: taskId,
        projectId: new ObjectId(projectId),
        assignedTo: new ObjectId(assignedTo),
        title,
        description,
        priority,
        dueDate: new Date(dueDate),
        createdAt: now,
        startedAt: null,
        completedAt: null,
        status: "todo",
        estimatedTime: estimatedSeconds,
        subtasks,
        issues: [],
        comments: [],
        attachments: [],
        logs: [
            {
                action: "created",
                timestamp: now,
                by: new ObjectId(assignedTo)
            }
        ]
    };

    await tasksCollection.insertOne(task);

    return {
        success: true,
        taskId,
        estimatedTime: estimatedSeconds
    };
}

// 🔍 Helper to get project title
async function getProjectTitle(db, projectId) {
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });
    return project?.title || "";
}

// 🔍 Helper to get project start date
async function getProjectStartDate(db, projectId) {
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });
    return project?.startDate || new Date();
}

// const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Update a specific field of a task by its ID
 * @param {string} taskId - The ID of the task to update
 * @param {string} field - The field name to update
 * @param {*} value - The new value to set
 * @returns {object} - Result of the update operation
 */
const updateTaskField = async (taskId, field, value) => {
    if (!taskId || !field) {
        throw new Error("Missing taskId or field to update");
    }

    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    const updateQuery = {
        $set: {
            [field]: value
        }
    };

    const result = await collection.updateOne(
        { _id: new ObjectId(taskId) },
        updateQuery
    );

    if (result.matchedCount === 0) {
        throw new Error("Task not found or update failed");
    }

    return result;
};


const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fetchWeeklyTasks = async (projectId) => {

    if (!projectId) throw new Error("Missing projectId");

    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const dayOfWeek = today.getUTCDay();
    const sunday = new Date(today);
    sunday.setUTCDate(today.getUTCDate() - dayOfWeek);

    const saturday = new Date(sunday);
    saturday.setUTCDate(sunday.getUTCDate() + 6);
    saturday.setUTCHours(23, 59, 59, 999);

    const tasks = await collection.find({
        projectId: new ObjectId(projectId),
        createdAt: {
            $gte: sunday,
            $lte: saturday,
        },
    }).toArray();

    // Initialize day-wise grouped object
    const grouped = WEEKDAYS.reduce((acc, day) => {
        acc[day] = {
            blocked: 0,
            pending: 0,
            completed: 0,
            utc: null
        };
        return acc;
    }, {});

    // Group and count tasks
    tasks.forEach(task => {
        const createdAt = new Date(task.createdAt);
        const dayIndex = createdAt.getUTCDay();
        const dayName = WEEKDAYS[dayIndex];

        if (!grouped[dayName].utc) {
            const dateAtMidnightUTC = new Date(Date.UTC(
                createdAt.getUTCFullYear(),
                createdAt.getUTCMonth(),
                createdAt.getUTCDate()
            ));
            grouped[dayName].utc = dateAtMidnightUTC.toISOString();
        }

        if (task.status === "completed") grouped[dayName].completed += 1;
        else if (task.status === "blocked") grouped[dayName].blocked += 1;
        else if (task.status === "pending") grouped[dayName].pending += 1;
    });

    // Convert grouped data into final array
    const result = WEEKDAYS.map(day => ({
        day,
        data: {
            blocked: grouped[day].blocked,
            pending: grouped[day].pending,
            completed: grouped[day].completed
        },
        utc: grouped[day].utc
    }));

    return result;
};module.exports = {
    fetchWeeklyTasks,
    updateTaskField
}