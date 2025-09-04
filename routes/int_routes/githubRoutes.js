import express from 'express';
import {
    initiateGitHubAuth,
    githubCallback,
    handleGitHubWebhook
} from '../controllers/githubController.js';

const router = express.Router();

router.get('/auth/github', initiateGitHubAuth);
router.get('/auth/github/callback', githubCallback);
router.post('/webhook/github', handleGitHubWebhook);

export default router;