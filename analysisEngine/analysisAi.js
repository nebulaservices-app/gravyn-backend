import { GeminiBaseAgent } from "../cei/utils/GeminiBaseAgent.js";

export class KairoTime extends GeminiBaseAgent {
    constructor(systemPrompt = null) {
        super(systemPrompt || "")
    }

    /**
     * Estimates time (in seconds) to complete a task based on title, description, subtasks, and project context.
     */
    async estimateTaskTime({ title, description, subtasks = [], projectTitle = "", projectDesc = "", startDate = "", deadline = "" }) {
        const systemPrompt = `
You are KairoTime, an expert AI estimator for time assessment in software and digital product development.

🎯 Objective: Return a realistic time estimate in **seconds** for completing a task by a **single mid-level engineer**.

🔍 Consider:
- Task complexity and clarity
- Number and technical depth of subtasks
- Type of work: DevOps, Frontend, Backend, UI/UX, API, testing, etc.
- Expected time for setup, debugging, review, testing, and documentation
- Only count productive hours (6–8/day, weekdays only)

📅 Deadline Use:
You’ll also be given a Start Date and Deadline. Use this window to:
- Detect if the task is under time pressure (tight deadlines)
- Apply **10–15% buffer** if the deadline gives significant slack (≥ 2× your base estimate)
- Never match your estimate to the deadline unless realistically justified

📘 Output:
Return only a **valid JSON object**, in this exact format:
{ "estimatedTime": <number_in_seconds> }

⚠️ Do not include explanation, extra text, markdown, or comments.
        `.trim();

        const userPrompt = `
Task Title: ${title}
Task Description: ${description}
Subtasks: ${subtasks.length > 0 ? subtasks.join(", ") : "None"}
Project Title: ${projectTitle}
Project Description: ${projectDesc || "N/A"}
Start Date: ${startDate}
Deadline: ${deadline}
        `.trim();

        const response = await this.askWithPrompt(systemPrompt, userPrompt);

        try {
            const match = response.match(/({[^}]+})/);
            if (match && match[1]) {
                const parsed = JSON.parse(match[1]);
                return typeof parsed.estimatedTime === "number" ? parsed.estimatedTime : null;
            }
        } catch (err) {
            console.warn("⚠️ Failed to parse estimation output:", err);
        }

        return null;
    }

    /**
     * Sends prompt to Gemini and tracks token usage
     */
    async askWithPrompt(systemPrompt, userPrompt) {
        const result = await this.model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                }
            ]
        });

        const response = result.response;
        const usage = result.usageMetadata || response.usageMetadata;

        if (usage?.totalTokenCount || usage?.totalTokens) {
            this.totalTokens += usage.totalTokenCount || usage.totalTokens
        }

        return response.text();
      }
}