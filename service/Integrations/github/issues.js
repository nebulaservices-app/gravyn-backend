// --- ✅ USE ESM 'import' SYNTAX FOR ALL MODULES ---
import axios from 'axios';
import { ObjectId } from 'mongodb';
import mongoDbClient from '../../../utils/MongoClient.js';
import { estimateEffortSecondsForTask } from '../../../utils/AiUtils/WorkEstimator.js';

// =========================================================================
// == REAL-TIME EVENT HANDLING (from Webhooks)
// =========================================================================

/**
 * Main entry point for webhook events related to issues.
 * This function is called by the webhook controller.
 * @param {object} payload - The full webhook payload from GitHub.
 */
export const handleWebhookEvent = async (payload) => {
    // Route the event based on the action (e.g., 'opened', 'closed')
    if (payload.action === 'opened') {
        console.log("New issue opened, Processing new issue...");
        await handleIssueOpened(payload);
    } else {
        console.log(`Received issue event with unhandled action: ${payload.action}`);
    }
};

/**
 * Internal helper to process a newly created issue from a webhook.
 * This is not exported and is only used within this file.
 * @param {object} payload - The webhook payload for the 'opened' action.
 */
const handleIssueOpened = async (payload) => {
    try {

        console.log("Payload checked..." , payload.issue)
        const { issue, repository } = payload;
        console.log(`ISSUE SERVICE: Processing new issue from webhook: #${issue.number}`);

        const db = await mongoDbClient.getDatabase("main");
        const integrationEntity = await db.collection("IntegrationEntities").findOne({
            "payload.repo.id": repository.id
        });



        if (!integrationEntity) {
            console.warn(`No Gravyn project linked to repository ID ${repository.id}.`);
            return;
        }

        const existingIssue = await db.collection("issues").findOne({ "sourceMetadata.id": issue.id });
        if (existingIssue) {
            console.log(`Issue #${issue.number} already exists in Gravyn. Skipping.`);
            return;
        }


        console.log("Creating issues...", integrationEntity.projectId, integrationEntity);

        const newIssueDocument = {
            _id: new ObjectId(),
            projectId: new ObjectId(integrationEntity.projectId),
            title: issue.title,
            description: issue.body,
            status: "pending", // 'open'
            type : null ,
            severity: 'low',
            labels: issue.labels.map(l => l.name),
            source: 'github',
            sourceMetadata: {
                id: issue.id,
                number: issue.number,
                url: issue.html_url,
                author: issue.user.login,
                authorAvatarUrl: issue.user.avatar_url,
            },
            dueDate : new Date(),
            createdAt: new Date(issue.created_at),
            updatedAt: new Date(issue.updated_at),
        };

        const effortSeconds = await estimateEffortSecondsForTask({ title: issue.title, description: issue.body });
        newIssueDocument.effortSeconds = effortSeconds;

        await db.collection("issues").insertOne(newIssueDocument);
        console.log(`✅ Successfully stored issue #${issue.number} in Gravyn.`);

    } catch (error) {
        console.error("Error in handleIssueOpened service:", error);
    }
};

// =========================================================================
// == BULK SYNCING (for initial setup)
// =========================================================================

/**
 * Fetches all issues for a given GitHub repository.
 * Internal helper function.
 * @param {string} accessToken - The user's GitHub OAuth token.
 * @param {string} repoFullName - The full name of the repository (e.g., "user/repo").
 */
const fetchAllIssues = async (accessToken, repoFullName) => {
    const response = await axios.get(`https://api.github.com/repos/${repoFullName}/issues`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json'
        }
    });
    return response.data || [];
};

/**
 * Orchestrates a one-time sync of all existing issues for a repository.
 * This can be called by a controller after a repo is first linked.
 * @param {object} params - Contains integrationInstanceId and repoId.
 */
export const syncAllIssuesForRepo = async ({ integrationInstanceId, repoId }) => {
    try {
        const db = await mongoDbClient.getDatabase("main");

        const integrationInstance = await db.collection("appIntegrations").findOne({ _id: new ObjectId(integrationInstanceId) });
        if (!integrationInstance || !integrationInstance.accessToken) {
            throw new Error("Could not find integration instance or access token.");
        }
        const { accessToken, projectId } = integrationInstance;

        const repoResource = await db.collection("integrationResources").findOne({ resourceId: repoId });
        if (!repoResource || !repoResource.data.full_name) {
            throw new Error("Could not find linked repository details.");
        }
        const repoFullName = repoResource.data.full_name;

        console.log(`BULK SYNC: Fetching all issues for ${repoFullName}...`);
        const allGithubIssues = await fetchAllIssues(accessToken, repoFullName);
        console.log(`BULK SYNC: Found ${allGithubIssues.length} issues.`);

        if (allGithubIssues.length === 0) return { success: true, count: 0 };

        const issuesToInsert = allGithubIssues.map(issue => ({
            _id: new ObjectId(),
            projectId: new ObjectId(projectId),
            title: issue.title,
            body: issue.body,
            status: issue.state,
            priority: 'medium',
            labels: issue.labels.map(l => l.name),
            source: 'github',
            sourceMetadata: { id: issue.id, number: issue.number, url: issue.html_url, author: issue.user.login, authorAvatarUrl: issue.user.avatar_url },
            createdAt: new Date(issue.created_at),
            updatedAt: new Date(issue.updated_at),
        }));

        await db.collection("issues").insertMany(issuesToInsert);
        console.log(`✅ BULK SYNC: Successfully stored ${issuesToInsert.length} issues in Gravyn.`);

        return { success: true, count: issuesToInsert.length };

    } catch (error) {
        console.error("Error during bulk issue sync:", error);
        return { success: false, error: error.message }
    }
};

// --- ✅ REMOVED 'module.exports' ---
// The 'export' keyword on each function handles this now.
