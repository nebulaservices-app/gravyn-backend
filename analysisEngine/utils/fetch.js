const mongoDBClient = require("../../utils/MongoClient");
const { ObjectId } = require("mongodb");

async function fetchTasksByAssignee(projectId, userId) {
    const db = await mongoDBClient.getDatabase("main");
    const tasks = await db.collection("tasks")
        .find({
            projectId: new ObjectId(projectId),
            assignedTo: userId
        })
        .toArray();

    return tasks;
}

const tasks =  fetchTasksByAssignee("68159219cdb8524689046498", "68221d90e2d6a83803299798")

console.log("Tasks by assignee:\n", JSON.stringify(tasks, null, 2));


module.exports = {
    fetchTasksByAssignee
};
