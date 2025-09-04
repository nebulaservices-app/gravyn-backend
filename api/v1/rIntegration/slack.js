const express = require('express');
const { slackCallbackController } = require('../../../controllers/integrations/slack/callback');

const router = express.Router();

router.get('/callback', slackCallbackController);

module.exports = router;