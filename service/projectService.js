const { ObjectId } = require("mongodb");
const mongoDBClient = require("../utils/MongoClient"); // adjust import path



async function  getLatestProjectUpdateFromDB(projectId) {
    const db = await mongoDBClient.getDatabase("main");
    const doc = await db.collection("ProjectUpdates")
        .find({ projectId: new ObjectId(projectId) })
        .sort({ generatedAt: -1 })
        .limit(1)
        .toArray();

    console.log("Docs suggested" , doc[0])
    return doc[0] || null;


};



async function updateAITriageSettings(projectId, updates) {
    const db = await mongoDBClient.getDatabase("main");
    const projectsCollection = db.collection("projects");

    const projectObjectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;


    const project = await projectsCollection.findOne({ _id: projectObjectId });
    console.log("Project finalised to update", project)
    if (!project) throw new Error("Project not found");

    const currentAI = project.aiTriage || {};

    const updatedAI = {
        ...currentAI,

        // Core Flags
        enabled: updates.isEnabled !== undefined ? updates.isEnabled : currentAI.isEnabled || false,
        mode: updates.mode || currentAI.mode || "auto",

        // Access Flags (preserve structure if exists)
        access: {
            ...(currentAI.access || {}),
            ...(updates.access || {})  // e.g., statsAccess, usageTracking, partnerAutoAssign
        },

        // Token Usage Stats
        tokenUsage: {
            today: updates.tokenUsage?.today ?? currentAI.tokenUsage?.today ?? 0,
            total: updates.tokenUsage?.total ?? currentAI.tokenUsage?.total ?? 0
        },

        // Overall Stats
        stats: {
            totalTriaged: updates.stats?.totalTriaged ?? currentAI.stats?.totalTriaged ?? 0,
            todayTriaged: updates.stats?.todayTriaged ?? currentAI.stats?.todayTriaged ?? 0,
            lastTriagedAt: updates.stats?.lastTriagedAt ?? currentAI.stats?.lastTriagedAt ?? null
        },

        // Breakdown: Preserve deeply unless explicitly overridden
        issueTypeBreakdown: {
            ...(currentAI.issueTypeBreakdown || {}),
            ...(updates.issueTypeBreakdown || {})
        },
        severityBreakdown: {
            ...(currentAI.severityBreakdown || {}),
            ...(updates.severityBreakdown || {})
        }
    };

    console.log("Project after update", updatedAI)


    await projectsCollection.updateOne(
        { _id: projectObjectId },
        { $set: { aiTriage: updatedAI } }
    );

    return updatedAI;
}

module.exports = { updateAITriageSettings,
    getLatestProjectUpdateFromDB
};