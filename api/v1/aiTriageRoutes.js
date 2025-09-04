const express = require("express");
const router = express.Router();
const aiTriageController = require("../../controllers/aiTriageController");

// Enable or update AI Triage settings
router.post("/config/:projectId", aiTriageController.configureAITriage);

// Trigger a triage run (single issue or bulk)
router.post("/run", aiTriageController.runTriage);

// Optional: Reset today's stats (can be used by cron or manually)
router.post("/reset/:projectId", aiTriageController.resetDailyStats);

module.exports = router;