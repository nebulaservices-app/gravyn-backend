const { handleSlackOAuthCallback } = require('../../../service/integrations/slack/callback');

const slackCallbackController = async (req, res) => {
    try {
        const userId = req.query.state; // userId sent as `state` from frontend
        const result = await handleSlackOAuthCallback(req.query.code, { id: userId });
        res.redirect('http://localhost:7001/app');
    } catch (error) {
        console.error("Slack callback error:", error.message);
        res.status(500).send("Slack integration failed.");
    }
};
module.exports = { slackCallbackController };