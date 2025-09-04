// CEI/context/SummaryBuilder.js

import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";

export class SummaryBuilder extends GeminiBaseAgent {
    constructor() {
        super(`
You are a summarization agent for Nebula.

Given structured entity data (like Task, Project, User), generate a natural language summary describing the current state of the project context.

Return ONLY a plain string summary. No bullet points, no JSON. One-line if possible.
`);
    }

    /**
     * 👇 Rule-based fallback for summary generation
     */
    static buildDeterministic(entities = {}) {
        const parts = [];

        if (entities?.Task?.title) parts.push(`task "${entities.Task.title}"`);
        if (entities?.Task?.assignedTo) parts.push(`assigned to ${entities.Task.assignedTo}`);
        if (entities?.Project?.name) parts.push(`in project "${entities.Project.name}"`);
        if (entities?.User?.name) parts.push(`initiated by ${entities.User.name}`);

        return parts.length > 0 ? parts.join(", ") : "No relevant summary yet.";
    }

    /**
     * 👇 LLM-enhanced summary builder
     */
    async build(entities = {}) {
        const jsonData = JSON.stringify(entities, null, 2);
        const prompt = `
Here is structured JSON entity data:

${jsonData}

→ Generate a one-line project summary from the data.
        `.trim();

        const response = await this.sendPrompt({ prompt });

        if (!response || response.length < 5) {
            return SummaryBuilder.buildDeterministic(entities);
        }

        return response.trim();
    }
}