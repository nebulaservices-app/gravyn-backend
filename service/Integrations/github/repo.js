const axios = require('axios');

const storeRepositories = async (db, repos, { userId, projectId, integrationInstanceId }) => {
    const collection = db.collection('integrationResources');

    const docs = repos.map(repo => ({
        integrationKey: 'github',
        integrationInstanceId,
        resourceType: 'repo',
        resourceId: repo.id,
        userId,
        projectId,
        data: repo,
        syncedAt: new Date()
    }));

    if (docs.length > 0) {
        await collection.insertMany(docs);
    }
};

const fetchUserRepositories = async (accessToken) => {
    const perPage = 100;
    let page = 1;
    let allRepos = [];

    while (true) {
        const response = await axios.get(`https://api.github.com/user/repos`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github+json'
            },
            params: {
                per_page: perPage,
                page
            }
        });

        if (!response.data || response.data.length === 0) break;

        allRepos.push(...response.data);
        if (response.data.length < perPage) break; // Last page
        page++;
    }

    console.log("Repository " , allRepos)

    return allRepos;
};

module.exports = {
    fetchUserRepositories,
    storeRepositories
};

fetchUserRepositories();