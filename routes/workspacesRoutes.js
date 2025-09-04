const express = require('express');
const {
    getAllWorkspaces,
    getWorkspaceById,
    getWorkspacesByName,
    getWorkspacesByMember,
    getWorkspacesByCreationDate,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace
} = require("../controllers/workspacesController.js");

const router = express.Router();

// GET /api/v1/workspaces/
router.get("/", getAllWorkspaces);

// GET /api/v1/workspaces/:workspaceId
router.get("/:workspaceId", getWorkspaceById);

// GET /api/v1/workspaces/name/:name
router.get("/name/:name", getWorkspacesByName);

// GET /api/v1/workspaces/member/:memberId
router.get("/member/:memberId", getWorkspacesByMember);

// GET /api/v1/workspaces/created-after/:date
router.get("/created-after/:date", getWorkspacesByCreationDate);

// POST /api/v1/workspaces/
router.post("/", createWorkspace);

// PUT /api/v1/workspaces/:workspaceId
router.put("/:workspaceId", updateWorkspace);

// DELETE /api/v1/workspaces/:workspaceId
router.delete("/:workspaceId", deleteWorkspace);

module.exports = router;
