import mongoDbClient from "../../utils/MongoClient.js";
import { ObjectId } from "mongodb";
import { evaluateUserWLC } from "./WorkEstimatorCalculator.js";
import {generateTaskSummary} from "./WorkEstimator.js";
import {generateProjectUpdateFromSummaries, summarizeTaskForUpdate} from "./ProjectUpdatesAI.js";

// 1. Get relevant (active/recent/urgent) tasks for the project
export async function getActiveReportTasks(projectId, now = new Date()) {
    const db = await mongoDbClient.getDatabase("main");
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);
    const plus3 = new Date(today);
    plus3.setUTCDate(today.getUTCDate() + 3);
    plus3.setUTCHours(23, 59, 59, 999);

    const projectIdQuery = new ObjectId(projectId);
    const query = {
        projectId: projectIdQuery,
        $or: [
            { updatedAt: { $gte: yesterday, $lt: today } },
            { completedAt: { $gte: yesterday, $lt: today } },
            { dueDate: { $gte: today, $lte: plus3 } },
            { dueDate: { $gte: yesterday, $lt: today }, status: { $nin: ["done", "completed"] } }
        ]
    };
    return db.collection("tasks").find(query).toArray();
}

// 2. Get users (adapt logic if your team list is different)
export async function getUsersForProject(projectId) {
    const db = await mongoDbClient.getDatabase("main");
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });
    if (!project) return [];
    // Example: If you have a teamMembers array of user IDs
    if (project.teamMembers && project.teamMembers.length) {
        return db.collection("users").find().toArray();
    } else {
        return db.collection("users").find().toArray();
    }
}


function pruneTaskForUpdate(task) {
    return {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate,
        subtasks: task.subtasks,
        issues: task.issues,
        comments: task.comments,
        effortSeconds: task.effortSeconds,
        wlc: task.wlcMetric && {
            DueTime: task.wlcMetric.DueTime,
            PrepStart: task.wlcMetric.PrepStart,
            IdealStart: task.wlcMetric.IdealStart,
            InPrepWindow: task.wlcMetric.InPrepWindow,
            OverdueBy_Hours: task.wlcMetric.OverdueBy_Hours,
            HeatLevel: task.wlcMetric.HeatLevel,
            DeadlineRisk: task.wlcMetric.DeadlineRisk,
            TimeWarning: task.wlcMetric.TimeWarning,
            SuggestedPrepStart: task.wlcMetric.SuggestedPrepStart,
            SuggestedIdealStart: task.wlcMetric.SuggestedIdealStart,
            RT_in_Hours: task.wlcMetric.RT_in_Hours,
            T_req_in_Hours: task.wlcMetric.T_req_in_Hours,
            WLC: task.wlcMetric.WLC
        }
    };
}


// 3. Map users to relevant tasks, and run WLC on just those
export async function getUsersWithRelevantTaskWLC(projectId, now = new Date()) {
    const [tasks, users] = await Promise.all([
        getActiveReportTasks(projectId, now),
        getUsersForProject(projectId)
    ]);

    // Map userId to its relevant tasks
    const tasksByUser = {};
    for (const task of tasks) {
        const assignedTo = typeof task.assignedTo === "object"
            ? task.assignedTo.toString()
            : String(task.assignedTo);
        if (!tasksByUser[assignedTo]) tasksByUser[assignedTo] = []
        tasksByUser[assignedTo].push(task);
    }

    // Produce the output you want
    return await Promise.all(users.map(async user => {
        const userId = user._id.toString();
        const relevantTasks = tasksByUser[userId] || [];
        const wlcMetricsArr = evaluateUserWLC({ name: user.name, tasks: relevantTasks }, now).taskMetrics;

        // Prune and attach metric for each task
        const tasksWithWLC = relevantTasks.map((task, idx) =>
            pruneTaskForUpdate({ ...task, wlcMetric: wlcMetricsArr[idx] })
        );


        const tasksFinal = await Promise.all(
            tasksWithWLC.map(async (task) => ({
                name: task.title,
                description: task.description,
                summary: await summarizeTaskForUpdate(task, user.name)
            }))
        );

        // Generate summaries for all pruned tasks (async!)
        const summarizedTasks = await Promise.all(
            tasksWithWLC.map(t => summarizeTaskForUpdate(t, user.name))
        );
        const userWLC = evaluateUserWLC({ name: user.name, tasks: relevantTasks }, now);

        // You can return either the summaries or both details and summaries:
        return {
            id: userId,
            name: user.name,
            picture: user.picture,
            tasks: tasksFinal, // (optional) full pruned tasks if you want
            wlc: userWLC.avgWLC,
            totalWLC: userWLC.totalWLC,
            heatLevel: userWLC.heatLevel,
            totalTasks: userWLC.totalTasks
        };
    }));


}

// --- Usage ---
const projectId = "68159219cdb8524689046498";
const relevant = await getUsersWithRelevantTaskWLC(projectId, new Date());
// console.log("Relevant task summmary" , JSON.stringify(relevant));

const projectSummary = JSON.stringify(relevant);

const generatedProjectSummary = await generateProjectUpdateFromSummaries(projectSummary);


async function saveProjectUpdate({
                                                      projectId,
                                                      projectSummary,
                                                      generatedBy = "AI"
                                                  }) {
    const db = await mongoDbClient.getDatabase("main");
    const now = new Date();
    const nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h from now

    const doc = {
        projectId: new ObjectId(projectId),
        content: projectSummary,
        generatedAt: now,
        nextDateForGeneration: nextDate,
        runBy: generatedBy,
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection("ProjectUpdates").insertOne(doc)
    return result.insertedId;
}


console.log(generatedProjectSummary);

await saveProjectUpdate({
    projectId: "68159219cdb8524689046498",
    projectSummary: generatedProjectSummary // projectSummary should be your final content array/sections
});
