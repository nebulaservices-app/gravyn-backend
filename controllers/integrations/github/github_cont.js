const { handleGitHubOAuthCallback } = require('../../../service/Integrations/github/auth');

const githubOAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            return res.status(400).json({ error: "Missing code or state in query." });
        }

        let parsedState;
        try {
            parsedState = JSON.parse(decodeURIComponent(state));
        } catch (err) {
            console.error("❌ Failed to parse state:", err.message);
            return res.status(400).json({ error: "Invalid state format." });
        }

        const { userId, integrationId, projectId } = parsedState;

        if (!userId || !integrationId || !projectId) {
            return res.status(400).json({ error: "Missing required parameters in state." });
        }

        await handleGitHubOAuthCallback({
            code,
            userId,
            integrationId,
            projectId
        });

        // Redirect to frontend success page
        res.redirect(`http://localhost:7001/app`);
    } catch (err) {
        console.error("❌ GitHub OAuth callback error:", err.message);
        res.status(500).json({ error: "OAuth callback failed." });
    }
};

module.exports = {
    githubOAuthCallback
};