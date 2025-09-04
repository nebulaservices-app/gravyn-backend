const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const {updateTaskFieldController, updateTaskDueDate} = require("../controllers/taskController");
const {updateTaskField} = require("../service/taskService");

// Basic routes
router.get("/", taskController.getAllTasks);
router.get("/:taskId", taskController.getTaskById);
router.get("/name/:name", taskController.getTasksByName);
router.get("/assignee/:userId", taskController.getTasksByAssignee);
router.get("/status/:status", taskController.getTasksByStatus);

// Advanced filters
router.post("/filter/custom-fields", taskController.getTasksByCustomFields);
router.get("/due/:date", taskController.getTasksByDueDate);
router.get("/workspace/:workspaceId", taskController.getTasksByWorkspace);
router.get("/search", taskController.searchTasks);
router.get("/range", taskController.getTasksByDateRange);
router.get("/overdue/all", taskController.getOverdueTasks);
router.get("/top", taskController.getTopTasks);
router.get("/project/:projectId", taskController.getTasksByProjectId);
router.patch("/:taskId/due-date", taskController.updateTaskDueDate);
router.get("/project/:projectId/week", taskController.getTasksByCurrentWeek);


module.exports = router;