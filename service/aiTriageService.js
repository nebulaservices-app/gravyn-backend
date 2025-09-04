const { ObjectId } = require("mongodb");
const mongoDBClient = require("../utils/MongoClient");
const { updateAITriageSettings } = require("./projectService");

// ⛳ Enable or configure AI Triage settings
async function enableAITriage(projectId, { isEnabled, mode }) {

    console.log("ENABLING AI TRAIGE : ", projectId , " IS ENABLED " ,isEnabled , " MDOE " , mode)
    const settings = {
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        mode: mode || "auto"
    };
    return await updateAITriageSettings(projectId, settings);
}

// 📊 Record token usage and stats after triage
async function recordTriageStats(projectId, { tokenUsed = 2000 } = {}) {
    const db = await mongoDBClient.getDatabase("main");
    const projects = db.collection("Projects");

    const project = await projects.findOne({ _id: new ObjectId(projectId) });
    if (!project) throw new Error("Project not found");

    const stats = project.aiTriage?.stats || {};
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const isSameDay = stats.lastTriagedAt?.slice(0, 10) === today;

    const updatedStats = {
        todayTriagedCount: isSameDay ? (stats.todayTriagedCount || 0) + 1 : 1,
        todayTokenUsage: isSameDay ? (stats.todayTokenUsage || 0) + tokenUsed : tokenUsed,
        totalTriagedCount: (stats.totalTriagedCount || 0) + 1,
        totalTokenUsage: (stats.totalTokenUsage || 0) + tokenUsed,
        lastTriagedAt: new Date().toISOString()
    };

    return await updateAITriageSettings(projectId, { stats: updatedStats });
}

// 🧹 Optional utility to reset stats (e.g., midnight cron)
async function resetAITriageDailyStats(projectId) {
    return await updateAITriageSettings(projectId, {
        stats: {
            todayTriagedCount: 0,
            todayTokenUsage: 0
        }
    });
}

module.exports = {
    enableAITriage,
    recordTriageStats,
    resetAITriageDailyStats
};