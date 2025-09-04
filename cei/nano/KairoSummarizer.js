import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";
import { cleanJSON } from "./KairoIntentAgent.js";

const sysPromptSummarize = `
You are KairoSummarizer, an AI micro-agent in Nebula. Your task is to summarize a JSON array of objects (e.g., users, projects, or tasks) and offer intelligent guidance.

Your response must include:
- total count
- 1–3 sample entries (preferably key ones with name, _id, email, etc.)
- common insights (e.g., frequent roles, active project stats, etc.)
- an AI-generated assistant-style note that is:
  - concise (1–2 lines)
  - helpful and role-aware
  - optionally recommends a next action or suggestion

🎯 Your tone should be clear, helpful, and professional.

Return this JSON:
{
  "code": "FFxF",
  "summary": {
    "totalCount": 5,
    "sampleEntries": [
      { "_id": "...", "name": "Jane Cooper", "email": "...", "role": "Designer" }
    ],
    "commonInsights": {
      "topRoles": ["Designer", "Developer"],
      "statusSummary": { "active": 3, "inactive": 2 }
    },
    "note": "Jane Cooper is a highly active Designer and could be ideal for new UI/UX projects." !important
  },
  "target": "KairoUser"
}

❌ If you cannot summarize:
{
  "code": "00xE",
  "error": "Summary could not be generated.",
  "target": "KairoUser"
}
`;
export class KairoSummarizer extends GeminiBaseAgent {
    constructor() {
        super(sysPromptSummarize);
    }

    async summarize(dataList, entityType = "Entity") {
        if (!Array.isArray(dataList) || dataList.length === 0) {
            return {
                code: "00xE",
                error: "Empty or invalid data list.",
                target: `Kairo${entityType}`
            };
        }

        const totalCount = dataList.length;
        const sampleEntries = dataList.slice(0, 3).map(entry => {
            return {
                _id: entry._id?.toString?.() || "N/A",
                name: entry.name || entry.title || "Unnamed",
                email: entry.email || undefined,
                role: entry?.roles?.[0]?.role || undefined,
                status: entry.status || undefined,
            };
        });

        // Extract simple common insight examples
        const roles = [];
        const statusSummary = {};

        dataList.forEach(entry => {
            const role = entry?.roles?.[0]?.role;
            const status = entry?.status;

            if (role) roles.push(role);
            if (status) {
                statusSummary[status] = (statusSummary[status] || 0) + 1;
            }
        });

        const topRoles = [...new Set(roles)].slice(0, 3);


        const finalSummaryResult = {
            code: "FFxF",
            summary: {
                totalCount,
                sampleEntries,
                commonInsights: {
                    topRoles,
                    statusSummary,
                }
            },
            target: `Kairo${entityType}`
        }


        return finalSummaryResult;
    }
}