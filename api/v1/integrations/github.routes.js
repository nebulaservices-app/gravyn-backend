// routes/github.route.js

// --- ✅ USE ESM 'import' SYNTAX ---
import express from 'express';
// Import all controller functions as a single object
import * as githubController from '../../../integrations/github/github.controller.js';

// --- Create the router ---
const router = express.Router();

// --- Main Routes ---
// Handle GitHub callback after OAuth
router.get("/callback", githubController.handleGitHubCallback);

// Handle incoming webhook events from GitHub
router.post("/webhook", githubController.handleWebhook);

// --- Data Fetching Routes ---
// Get user's available GitHub repositories
router.get("/repos", githubController.fetchUserRepositories);

// Get branches for a specific repository
router.get("/branches", githubController.fetchRepositoryBranches);

// Fetch details of a repository already linked in Gravyn
router.get("/integration-entity", githubController.fetchConnectedRepos);

// --- Action Routes ---
// Link a new repository to Gravyn
router.post("/link-repo", githubController.linkRepository);

// Create a new branch in a repository
router.post("/create-branch", githubController.createBranch);

// --- ✅ USE 'export default' TO EXPORT THE ROUTER ---
export default router;
