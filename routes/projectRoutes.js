const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController.js");
const aiTriageController = require('../Features/AITriage/aiTriageController')

// Get all projects
router.get("/", projectController.getAllProjects);

// ✅ Correct Order
router.get("/filter/:field/:value", projectController.filterProjects);
router.get("/:projectId", projectController.getProjectById);

// Create a new project
router.post("/", projectController.createProject);

// Update a project by ID
router.put("/:projectId", projectController.updateProject);

// Delete a project by ID
router.delete("/:projectId", projectController.deleteProject);


// FETCH THE LATEST PROJECT UPDATE
router.get("/updates/latest/:projectId", projectController.getLatestProjectUpdate);


























// ===== DRIFTIQ ROUTES =====
// Check for drift bottlenecks in a project
router.post("/:projectId/drift-check", projectController.checkProjectForDrift);























router.post('/:projectId/triage-issue', aiTriageController.aiTriageAutoMode);
// Optionally: router.get('/triage-candidates', aiTriageController.pollTriageCandidates);

module.exports = router;



module.exports = router;