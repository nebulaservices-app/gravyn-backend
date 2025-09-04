import { GeminiAgent } from "../../../utils/GeminiAgent.js";
import { cleanJSON } from "../../../cei/nano/KairoIntentAgent.js";
import { SmasSAgent } from "./SmasSAgent.js";  // Adjust path as needed
import mongoDbClient from "../../../utils/MongoClient.js";

const SYSTEM_PROMPT = `You are an AI assistant that analyzes issues and classifies their severity into severe > critical > medium > or low.
               Also decide if smart assignment is required based on severity and other properties.
               Provide output as JSON including fields: severity, requireSmasS (boolean), explanation.`;

export class AIAgent extends GeminiAgent {
    constructor() {
        super(SYSTEM_PROMPT);
        this.smasSAgent = new SmasSAgent();
    }

    /**
     * @param issue - { title, description, ... }
     * @param teams - array of team objects for possible assignment (optional parameter)
     */
    async analyze(issue, teams) {
        console.log("Analyzing issues", issue);

        const userPrompt = `Analyze the following issue:\nTitle: ${issue.title}\nDescription: ${issue.description}\nAdditional Info: ${JSON.stringify(issue.metadata || {})}\nProvide the severity level and whether smart assignment is required. Return a JSON object.`;

        const rawResponse = await this.ask(userPrompt);


        try {
            const parsed = JSON.parse(cleanJSON(rawResponse));
            console.log("Parsed issue", parsed);

            let smartAssignment = null;

            if (parsed.requireSmasS) {
                if (!teams || !Array.isArray(teams) || teams.length === 0) {
                    smartAssignment = {
                        assignedTeam: null,
                        explanation: "No team data provided for smart assignment.",
                        confidence: null
                    };
                } else {
                    // Call SmasSAgent (Gemini-based) to perform smart assignment


                    smartAssignment = await this.smasSAgent.assign(
                        {
                            title: issue.title,
                            description: issue.description,
                            severity: parsed.severity || "medium"
                        },
                        teams
                    );

                    console.log("Smaas result" , smartAssignment)
                }
            }

            return {
                severity: parsed.severity || "medium",
                requireSmasS: !!parsed.requireSmasS,
                explanation: parsed.explanation || "",
                smartAssignment // null if not required, or object if performed
            };

        } catch (e) {
            console.error("Failed to parse AIAgent response:", e, rawResponse);
            return {
                severity: "medium",
                requireSmasS: false,
                explanation: "Failed to parse AI response."
            };
        }
    }
}
