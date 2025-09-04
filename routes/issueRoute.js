// routes/issueRoutes.js
const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');

// Route to get issue by issue ID
router.get('/:id', issueController.getIssueById);

// Route to get issues by target (task, project, phase, etc.) and ID
router.get('/target/:type/:id', issueController.getIssuesByTarget);

// Route to get issues by priority level
router.get('/priority/:level', issueController.getIssuesByPriority);

// Route to get issues by reporter name
router.get('/reporter/:name', issueController.getIssuesReportedByUser);

// Route to get issues by status (open, closed, in-progress)
router.get('/status/:status', issueController.getIssuesByStatus);

// Route to get issues within a date range
router.get('/date-range', issueController.getIssuesByCreatedDateRange);

// Route to create a new issue
router.post('/', issueController.createIssue);

// Route to update an issue by its ID
router.put('/:id', issueController.updateIssue);

// Route to delete an issue by its ID
router.delete('/:id', issueController.deleteIssue);


// Route to get issues by a list of IDs
router.post('/bulk', issueController.getIssuesByIds);

module.exports = router;