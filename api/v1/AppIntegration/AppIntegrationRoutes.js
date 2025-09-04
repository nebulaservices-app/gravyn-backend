const express = require("express");
const router = express.Router();
const controller = require("../../../controllers/AppIntegrationController");

// CRUD routes
router.post("/", controller.createAppIntegration);
router.get("/", controller.getAllAppIntegrations);
router.get("/:id", controller.getAppIntegrationById);
router.get("/find/by-user-project", controller.getAppIntegrationByUserAndProject);
router.put("/:id", controller.updateAppIntegration);
router.delete("/:id", controller.deleteAppIntegration);

module.exports = router;