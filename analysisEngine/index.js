const mongoDBClient = require("../utils/MongoClient");
const { getWorkloadReportForAssignee } = require("./workloadAnalysis");
const { ObjectId } = require("mongodb");

/**
 * Run workload analysis for all users in a project
 */
const analyzeAllAssignees = async (projectId) => {
    const db = await mongoDBClient.getDatabase("main");
    const tasksCollection = db.collection("tasks");

    const allTasks = await tasksCollection.find({ projectId: new ObjectId(projectId) }).toArray();

    const userTaskMap = {};

    // Group tasks by assignee
    for (const task of allTasks) {
        const assignee = task.assignedTo?.toString();
        if (!assignee) continue;

        if (!userTaskMap[assignee]) {
            userTaskMap[assignee] = [];
        }
        userTaskMap[assignee].push(task);
    }

    const analysisResults = [];

    for (const [assigneeId, tasks] of Object.entries(userTaskMap)) {
        const report = getWorkloadReportForAssignee(assigneeId, tasks);
        analysisResults.push(report);
    }

    return analysisResults;
};

/**
 * Run workload analysis for a specific user
 */
const analyzeOneAssignee = async (projectId, assigneeId) => {
    const db = await mongoDBClient.getDatabase("main");
    const tasksCollection = db.collection("tasks");

    const tasks = await tasksCollection
        .find({
            projectId: new ObjectId(projectId),
            assignedTo: new ObjectId(assigneeId),
        })
        .toArray();

    return getWorkloadReportForAssignee(assigneeId, tasks);
};


// TEMP: Run it directly if this file is executed
if (require.main === module) {
    analyzeOneAssignee("68159219cdb8524689046498", "68221d90e2d6a83803299798")
        .then((result) => {
            console.log("📊 Workload Report:\n", JSON.stringify(result, null, 2));
        })
        .catch((err) => {
            console.error("❌ Error running workload analysis:", err);
        });
}
module.exports = {
    analyzeAllAssignees,
    analyzeOneAssignee,
};