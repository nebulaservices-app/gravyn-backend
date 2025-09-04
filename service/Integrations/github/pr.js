const axios = require('axios');

/**
 * Fetches pull requests for a given repo.
 * @param {string} accessToken - GitHub access token
 * @param {string} repoFullName - Repository full name (e.g., "owner/repo")
 * @returns {Promise<Array>} - List of PRs
 */
const fetchPullRequests = async (accessToken, repoFullName) => {
    const response = await axios.get(`https://api.github.com/repos/${repoFullName}/pulls`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json'
        }
    });

    return response.data || [];
};

/**
 * Stores pull requests in integrationResources.
 */
const storePullRequests = async (db, pullRequests, { userId, projectId, integrationInstanceId, repoId }) => {
    const collection = db.collection('integrationResources');

    const docs = pullRequests.map(pr => ({
        integrationKey: 'github',
        integrationInstanceId,
        resourceType: 'pull_request',
        userId,
        projectId,
        parentResourceId: repoId, // links PRs to their repo
        resourceId: pr.id,
        data: pr,
        syncedAt: new Date()
    }));

    if (docs.length > 0) {
        await collection.insertMany(docs);
    }
};

module.exports = {
    fetchPullRequests,
    storePullRequests
};