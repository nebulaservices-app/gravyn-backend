import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";
import { cleanJSON } from "../nano/KairoIntentAgent.js";
import { KairoFetcher } from "../nano/KairoFetcher.js";

const sysPrompt = `
You are KairoUser, a micro-agent specializing in user-related queries. Respond with JSON only.

If data is complete:
{
  "code": "00x1",
  "message": "Completed response message.",
  "summary": "Detailed user-related information.",
  "contextUpdate": {
    "userFocus": "Rakesh",
    "projectFocus": null,
    "workspaceFocus": null
  }
}

If data is missing:
{
  "code": "00xM",
  "message": "Explanation of missing data.",
  "requiredFields": ["field1", "field2"],
  "nextAction": "fetch_from_KairoFetcher",
  "contextUpdate": {
    "userFocus": "Rakesh",
    "projectFocus": null,
    "workspaceFocus": null
  }
}
Never invent data. Use context to guide your answer.
`;

export class KairoUser extends GeminiBaseAgent {
    constructor() {
        super(sysPrompt);
        this.fetcher = new KairoFetcher("User");  // Ensure you're fetching the correct entity
    }

    async generateResponse(userPrompt, context) {
        const structuredPrompt = `
User Prompt: ${userPrompt}
Session Context:
${JSON.stringify(context, null, 2)}

Respond as per the rules defined in the system prompt.
        `.trim();

        // Send the user prompt to Gemini for the initial response
        let raw = await this.sendPrompt({ prompt: structuredPrompt });
        let parsed;

        try {
            parsed = JSON.parse(cleanJSON(raw));
            console.log("Parsed response from Gemini:", parsed);

            // If the response indicates missing information and requires data fetch
            if (parsed.code === "00xM" && parsed.nextAction === "fetch_from_KairoFetcher") {
                const fetchedData = await this.fetcher.fetch(userPrompt, [], context.userFocus);
                console.log("Fetched data from KairoFetcher:", fetchedData);

                const enrichedContext = {
                    ...context,
                    fetchedUserData: fetchedData.result || [], // Ensure you have the result from the fetch
                };

                // Recurse with the enriched context to get the response with fetched data
                return await this.generateResponse(userPrompt, enrichedContext);
            }

            return parsed;

        } catch (err) {
            console.error("Error parsing Gemini response:", err);
            return {
                code: "00xE",
                error: "Failed to parse Gemini response.",
                raw,
            };
        }
    }
}