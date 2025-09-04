// /adapters/githubAdapter.js

const axios = require("axios");

class GitHubAdapter {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.baseURL = "https://api.github.com";
    }

    getAuthHeaders() {
        return {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: "application/vnd.github+json"
        };
    }

    /**
     * Fetch user GitHub profile
     */
    async getUser() {
        const response = await axios.get(`${this.baseURL}/user`, {
            headers: this.getAuthHeaders()
        });
        return response.data;
    }

    /**
     * Fetch repositories the user has access to
     */
    async getRepositories() {
        const response = await axios.get(`${this.baseURL}/user/repos`, {
            headers: this.getAuthHeaders()
        });
        return response.data.map(repo => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            owner: repo.owner.login
        }));
    }

    /**
     * Fetch branches for a given repo full name (e.g., "owner/repo")
     */
    async getBranches(fullRepoName) {
        const response = await axios.get(`${this.baseURL}/repos/${fullRepoName}/branches`, {
            headers: this.getAuthHeaders()
        });
        return response.data.map(branch => ({
            name: branch.name,
            protected: branch.protected
        }));
    }

    /**
     * Fetch contributors of a given repo (e.g., "owner/repo")
     */
    async getContributors(fullRepoName) {
        const response = await axios.get(`${this.baseURL}/repos/${fullRepoName}/contributors`, {
            headers: this.getAuthHeaders()
        });
        return response.data.map(contributor => ({
            username: contributor.login,
            avatarUrl: contributor.avatar_url,
            profileUrl: contributor.html_url,
            contributions: contributor.contributions
        }));
    }

    /**
     * Link entities to integration document in DB
     * Pass MongoDB models and linked entity data
     */
    async linkEntities(integrationDoc, entitiesToLink) {
        for (let entity of entitiesToLink) {
            const idx = integrationDoc.entities.findIndex(e => e.entityType === entity.entityType);
            if (idx !== -1) {
                integrationDoc.entities[idx].entityId = entity.entityId;
            } else {
                integrationDoc.entities.push({
                    entityType: entity.entityType,
                    entityId: entity.entityId
                });
            }
        }
        await integrationDoc.save();
        return integrationDoc;
    }
}



module.exports = GitHubAdapter;