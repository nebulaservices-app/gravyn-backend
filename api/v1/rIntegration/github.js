const express = require('express');
const router = express.Router();
const { githubOAuthCallback } = require('../../../controllers/integrations/github/github_cont');

router.get('/callback', githubOAuthCallback);

module.exports = router;