// kairo/intelligence/GPIResponder.js

import { GeminiAgent } from "../utils/GeminiAgent.js";
import { KairoReply } from "./KairoReply.js"; // Deterministic context-based replies

const SYSTEM_PROMPT = `
You are Kairo, an intelligent assistant inside Nebula — a project and task management platform.

You handle general-purpose user questions like:
- “How does this work?”
- “What’s your role here?”
- “Do you know my name?”
- “What project am I working on?”

Use a friendly and informative tone.
Never respond with JSON or structured output — only natural, human-like language.
`.trim();

export class GPIResponder extends GeminiAgent {
    constructor() {
        super(SYSTEM_PROMPT);
    }

    async respond(prompt, context = {}) {
        const { contextSummary = "", sessionId = "", lastIntent = {}, lastEntities = {} } = context;

        // Step 1: Try deterministic context-based reply
        const kairoReply = new KairoReply(prompt, {
            contextSummary,
            lastIntent,
            lastEntities,
            sessionId
        });

        const deterministic = await kairoReply.generate();
        if (deterministic) {
            return {
                type: "gpi-response",
                source: "KairoReply",
                content: deterministic
            };
        }

        // Step 2: Gemini fallback
        const composed = `
You are a helpful assistant in the Nebula system.

User Prompt: "${prompt}"
Context Summary: ${contextSummary || "N/A"}
Last Intent: ${JSON.stringify(lastIntent)}
Entities: ${JSON.stringify(lastEntities)}

Respond clearly in natural language. Do not repeat context unless asked.
`.trim();

        const response = await this.ask(composed);

        return {
            type: "gpi-response",
            source: "GPIResponder",
            content: response
        };
    }
}