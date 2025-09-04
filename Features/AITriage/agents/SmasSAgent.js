// SmasSAgent.js

import { GeminiAgent } from "../../../utils/GeminiAgent.js";
import {ObjectId} from "mongodb";

// SYSTEM PROMPT: instructs the LLM how to perform assignment
const SYSTEM_PROMPT = `
You are an AI-powered assignment agent for a software team.
Given a new issue, its severity, and a list of project teams (with their roles and descriptions), choose the single best team to assign the issue to, based ONLY on their fit and purpose.
- Consider severity, the team's main skills/mission, and any clues from the issue.
- Respond in JSON with: assignedTeam (the code), explanation (sentence why), and confidence (0-1).
- If more context would help, say so in the explanation.
`;

export class SmasSAgent extends GeminiAgent {
    constructor() {
        super(SYSTEM_PROMPT); // parent GeminiAgent handles LLM setup
    }

    /**
     * Assign an issue to the best team using Gemini LLM.
     * @param {Object} issue - {title, description, severity, ...}
     * @param {Array} teams - Array of {name, code, description}
     * @returns {Object} Assignment result { assignedTeam, explanation, confidence }
     */
    async assign(issue, teams) {
        const teamsStr = JSON.stringify(teams, null, 2);

        // Compose instructions and data for Gemini
        const prompt = `
New issue to assign:
Title: ${issue.title}
Description: ${issue.description}
Severity: ${issue.severity}

Candidate Teams (project):
${teamsStr}

QUESTION:
Based on severity and the most appropriate team's area, which team (by "code") should own this issue? Explain in 1-2 sentences, and output JSON with: assignedTeamId(Object Id) , assignedTeam, explanation, confidence.
`;

        const raw = await this.ask(prompt);

        try {
            // Parse Gemini's JSON output (you may want to use cleanJSON if output is verbose)
            const parsed = JSON.parse(raw.match(/\{[\s\S]+\}/)[0]); // safer if Gemini outputs text+JSON


            return {
                assignedTeamId : new ObjectId(parsed.assignedTeamId),
                assignedTeam: parsed.assignedTeam,
                explanation: parsed.explanation,
                confidence: parsed.confidence ?? null,
            };
        } catch (e) {
            console.error("Failed to parse SmasSAgent LLM response:", e, raw);
            return {
                assignedTeam: null,
                explanation: "Could not parse Gemini response.",
                confidence: null
            };
        }
    }
}
