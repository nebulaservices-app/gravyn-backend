const express = require('express');
const router = express.Router();
const {
    createNewIntegration,
    getAllIntegrations,
    getIntegration,
    updateIntegrationData,
    deleteIntegrationData,
    runValidation,
    deleteAppIntegration
} = require('../../../controllers/integrationController');

// Create a new integration
router.post('/create', createNewIntegration);

// Get all integrations
router.get('/', getAllIntegrations);

// Get a specific integration by ID
router.get('/:integrationId', getIntegration);

// Update an integration by ID
router.put('/:integrationId', updateIntegrationData);

// Delete an integration by ID
router.delete('/:integrationId', deleteIntegrationData);

// Run validation for integration
router.get('/validate/check', runValidation);

// Delete app-specific integration (based on query params)
router.delete('/app/remove', deleteAppIntegration);

module.exports = router;