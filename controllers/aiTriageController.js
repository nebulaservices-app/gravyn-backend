const { enableAITriage, recordTriageStats, resetAITriageDailyStats } = require("../service/aiTriageService");
const triageEngine = require("../service/aiTriageEngine"); // To be created for actual AI logic

// POST /api/aitriage/config/:projectId
exports.configureAITriage = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { isEnabled, mode } = req.body;


        console.log("Configuring the projectId" , projectId)

        const updated = await enableAITriage(projectId, { isEnabled, mode });
        return res.status(200).json({ success: true, data: updated });
    } catch (err) {
        console.error("Configure AI Triage failed:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/aitriage/run
exports.runTriage = async (req, res) => {
    try {
        const { issueId, issues = [], mode = "auto" } = req.body;
        const issuesToTriage = issueId ? [issueId] : issues;

        if (!Array.isArray(issuesToTriage) || issuesToTriage.length === 0) {
            return res.status(400).json({ success: false, message: "No issues provided" });
        }

        const triageResults = await triageEngine.performTriage(issuesToTriage, mode);

        for (const result of triageResults) {
            await recordTriageStats(result.projectId, { tokenUsed: result.tokenUsed || 2000 });
        }

        const morePending = await triageEngine.hasMorePendingCriticalIssues(); // Optional rescan flag

        return res.status(200).json({
            success: true,
            data: triageResults,
            nextScanRequired: morePending
        });
    } catch (err) {
        console.error("Run AI Triage failed:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/aitriage/reset/:projectId
exports.resetDailyStats = async (req, res) => {
    try {
        const { projectId } = req.params;
        const result = await resetAITriageDailyStats(projectId);
        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        console.error("Reset AI Triage stats failed:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};