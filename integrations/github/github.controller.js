// --- ✅ USE ESM 'import' SYNTAX FOR ALL MODULES ---
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import mongoDbClient from '../../utils/MongoClient.js';
import GitHubAdapter from '../github/github.adapter.js';
import getAccessTokenByIntegrationId from '../../utils/getAccessTokenByIntegrationId.js';
// Import your issue service using ESM syntax
import { handleWebhookEvent } from '../../service/Integrations/github/issues.js';

// --- ✅ USE 'export const' INSTEAD OF 'exports.' ---

export const handleGitHubCallback = async (req, res) => {
    // 🎯 CONSOLE LOG: Log the start of the process and the raw inputs
    console.log("\n--- GitHub OAuth Callback Triggered ---");
    const { code, state: encodedState } = req.query;
    console.log("Received code:", code);

    let state;
    try {
        state = JSON.parse(decodeURIComponent(encodedState));
        // 🎯 CONSOLE LOG: Show the decoded state object
        console.log("Parsed state object:", state);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid state parameter.' });
    }

    const { userId, projectId, key } = state;

    if (!code || !userId || !projectId) {
        return res.status(400).json({ error: 'Callback is missing required parameters.' });
    }

    try {
        const db = await mongoDbClient.getDatabase("main");
        const collection = db.collection("Integrations");

        const integrationConfig = await collection.findOne({ key: key });

        if (!integrationConfig || !integrationConfig.oauth) {
            throw new Error(`Integration configuration for key "${key}" not found or is incomplete.`);
        }

        const requestPayload = {
            client_id: integrationConfig.oauth.clientId,
            client_secret: integrationConfig.oauth.clientSecret,
            code: code,
        };

        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            requestPayload,
            { headers: { 'Accept': 'application/json' } }
        );

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            throw new Error("GitHub did not return an access token.");
        }

        const query = {
            userId: new ObjectId(userId),
            projectId: new ObjectId(projectId),
            key: key,
        };

        const update = {
            $set: {
                status: "active",
                "credentials.type": "OAUTH_TOKEN",
                "credentials.accessToken": accessToken,
                updatedAt: new Date(),
            },
            $setOnInsert: {
                userId: new ObjectId(userId),
                projectId: new ObjectId(projectId),
                key: key,
                integrationId : new ObjectId(integrationConfig._id),
                createdAt: new Date(),
            }
        };

        await db.collection("appIntegrations").findOneAndUpdate(query, update, { upsert: true });

        console.log(`✅ Successfully connected GitHub OAuth for user ${userId}. Redirecting...`);
        const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:7001';
        return res.redirect(`${FRONTEND_BASE_URL}/app/project/${projectId}/issues`);

    } catch (error) {
        console.error("💥 ERROR in GitHub OAuth callback:", error.message);
        if (error.response) {
            console.error("   - GitHub API Error:", error.response.data);
        }
        res.status(500).json({ error: 'Failed to complete GitHub OAuth connection.' });
    }
};

export const fetchUserRepositories = async (req, res) => {
    const { integrationId } = req.query;
    if (!integrationId) return res.status(400).json({ error: 'Missing integrationId in query' });

    try {
        const db = await mongoDbClient.getDatabase("main");
        const appIntegration = await db.collection("appIntegrations").findOne({ _id: new ObjectId(integrationId) });

        if (!appIntegration) return res.status(404).json({ error: 'AppIntegration not found' });

        const accessToken = appIntegration?.credentials.accessToken;
        if (!accessToken) return res.status(401).json({ error: 'Access token not found' });

        const github = new GitHubAdapter(accessToken);
        const repositories = await github.getRepositories();
        return res.status(200).json({ repositories });

    } catch (err) {
        console.error('Error fetching GitHub repositories:', err);
        return res.status(500).json({ error: 'Internal server error while fetching repositories' });
    }
};

export const fetchRepositoryBranches = async (req, res) => {
    try {
        const { integrationId, repoFullName } = req.query;
        const accessToken = await getAccessTokenByIntegrationId(integrationId);

        if (!accessToken) return res.status(401).json({ message: "Missing GitHub access token." });

        const response = await axios.get(`https://api.github.com/repos/${repoFullName}/branches`, {
            headers: { Authorization: `token ${accessToken}`, Accept: "application/vnd.github+json" }
        });
        return res.status(200).json({ branches: response.data });

    } catch (error) {
        console.error("Error fetching branches:", error?.response?.data || error.message);
        return res.status(500).json({ message: "Failed to fetch branches from GitHub." });
    }
};

// --- ✅ CORRECTED linkRepository function ---
export const linkRepository = async (req, res) => {
    try {
        const payload = req.body; // This payload should contain the full repo object including the 'id'
        const accessToken = await getAccessTokenByIntegrationId(payload.inid);
        const db = await mongoDbClient.getDatabase("main");
        const collection = db.collection("IntegrationEntities");

        // ✅ CRITICAL FIX: Ensure the 'id' from the repo object is being saved.
        // The payload from your frontend must include the full repo object from GitHub's API.
        if (!payload.payload || !payload.payload.repo || !payload.payload.repo.id) {
            return res.status(400).json({ message: "Invalid payload: Missing repository details or repository ID." });
        }

        const newEntityPayload = {
            ...payload,
            inid: new ObjectId(payload.inid),
            userId: new ObjectId(payload.userId),
            status: "linked",
            webhook: { status: "pending", id: null, lastCheckedAt: null }
        };

        const result = await collection.insertOne(newEntityPayload);
        const newEntityId = result.insertedId;

        // --- Automatically create the webhook and update the document ---
        if (newEntityId) {
            const repoFullName = newEntityPayload.payload.repo.fullName;
            const webhookUrl = process.env.GITHUB_WEBHOOK_URL;
            const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

            if (!webhookUrl || !webhookSecret) {
                console.error("❌ CRITICAL: Webhook URL or Secret is not configured.");
            } else {
                try {
                    const hookResponse = await axios.post(
                        `https://api.github.com/repos/${repoFullName}/hooks`,
                        {
                            name: 'web', active: true,
                            events: ['issues', 'pull_request', 'push', 'issue_comment', 'create', 'delete'],
                            config: { url: webhookUrl, content_type: 'json', secret: webhookSecret }
                        },
                        { headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/vnd.github.v3+json' } }
                    );

                    const webhookId = hookResponse.data.id;
                    await collection.updateOne(
                        { _id: newEntityId },
                        { $set: { "webhook.status": "active", "webhook.id": webhookId, "webhook.lastCheckedAt": new Date() } }
                    );
                    console.log(`✅ Successfully created webhook ${webhookId} for repo: ${repoFullName}`);
                } catch (hookError) {
                    const status = hookError.response?.status === 422 ? "exists" : "error";
                    await collection.updateOne({ _id: newEntityId }, { $set: { "webhook.status": status } });
                    console.warn(`Webhook for ${repoFullName} resulted in status: ${status}.`);
                }
            }
        }
        return res.status(201).json({ message: "GitHub repository linked successfully.", data: { insertedId: newEntityId } });
    } catch (err) {
        console.error("Error in linkRepository:", err);
        return res.status(500).json({ message: "Server error during repository linking." });
    }
};


// --- Your handleIssueOpened function's query is now correct ---
// It will work once `linkRepository` saves the ID properly.
export const handleWebhook = async (req, res) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];

    if (!secret) return res.status(500).send("Webhook secret not configured.");

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

    if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        return res.status(401).send("Invalid signature.");
    }

    console.log(`✅ Event Received & Verified: ${event}`);

    switch (event) {
        case 'issues':
            await handleWebhookEvent(req.body);
            break;
        case 'pull_request':
            // await prService.handleWebhookEvent(req.body);
            break;
        default:
            console.log(`Received unhandled event: ${event}`);
            break;
    }

    res.status(200).send("Webhook acknowledged.");
};


export const fetchConnectedRepos = async (req, res) => {
    const { inkey, inid, userId } = req.query;
    if (!inkey || !inid || !userId) return res.status(400).json({ error: "Missing required parameters." });

    try {
        const db = await mongoDbClient.getDatabase("main");
        const collection = db.collection("IntegrationEntities");
        const query = { inkey, inid: new ObjectId(inid), userId: new ObjectId(userId) };
        const repos = await collection.find(query).toArray();
        return res.json({ repos });
    } catch (err) {
        console.error("Error fetching connected repos:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createBranch = async (req, res) => {
    // This function seems to rely on an undefined `getAuthenticatedClient`
    // You will need to define or import this for it to work.
    // For now, the syntax is corrected.
    const { integrationId } = req.query;
    const { repoFullName, newBranchName, sourceBranchName } = req.body;

    if (!repoFullName || !newBranchName || !sourceBranchName) {
        return res.status(400).json({ message: "Missing required parameters." });
    }
};
