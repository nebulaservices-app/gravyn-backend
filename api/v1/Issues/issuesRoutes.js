const express = require("express");
const router = express.Router();
const issueController = require("../../../controllers/issueController");

// CRUD operations
router.get("/", issueController.getAllIssues);                   // List issues with filters
router.get("/:id", issueController.getIssueById);               // Get one issue
router.post("/", issueController.createIssue);                  // Create issue
router.put("/:id", issueController.updateIssue);                // Update issue
router.delete("/:id", issueController.deleteIssue);             // Delete issue

// Comments & logs
router.post("/:id/comments", issueController.addComment);       // Add comment
router.post("/:id/logs", issueController.addLog);               // Add log

module.exports = router;