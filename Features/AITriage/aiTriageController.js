const aiTriageService = require('../../Features/AITriage/aiTriageService');
const mongoDbClient = require('../../utils/MongoClient');
const {ObjectId} = require("mongodb");

exports.aiTriageAutoMode = async (req, res) => {
    try {

        const { projectId } = req.params;
        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        //Llmare database handshake

        const db = await mongoDbClient.getDatabase('main');
        const pendingIssues = await db.collection('issues').find({
            projectId: new ObjectId(projectId),
            status: 'pending'
        }).toArray();

        if (!pendingIssues.length) {
            return res.json({ success: true, data: [], message: "No pending issues found" });
        }

        // 2. Run triage pipeline for each issue (could be done in parallel)
        const triageResults = await Promise.all(
            pendingIssues.map(issue => aiTriageService.triageIssue(issue))
        );

        // 3. Optionally, update issues with new triage info or statuses in DB here

        // 4. Return aggregated results
        res.json({ success: true, data: triageResults });
    } catch (err) {
        console.error("AI Triage error during bulk triage:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};