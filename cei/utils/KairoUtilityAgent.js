// GeminiUtilityAgent.js
import { GeminiBaseAgent } from "./GeminiBaseAgent.js";
import { contextManager } from "../context/ContextManagerAgent.js"; // Make sure the path is correct

export class GeminiUtilityAgent extends GeminiBaseAgent {
    constructor() {
        super(""); // 🔇 No persistent system prompt — lightweight
    }

    async isContextualPrompt(prompt, sessionId) {
        const context = contextManager.getContext(sessionId); // 🧠 Pull current context

        const input = `
Prompt: "${prompt}"
Context: ${JSON.stringify(context, null, 2)}

Return only:
{ "isContextual": true/false, "doesNeedUpdateToContext": true/false }

Rules:
- "isContextual": true if the prompt refers to earlier info, uses vague words ("this", "me", "it", etc.), or feels incomplete.
- "doesNeedUpdateToContext": true if the prompt reveals *any new factual information* about the user, tasks, projects, etc.
- Don't ignore facts even if they don’t sound important — if it can be remembered, mark update as true.

Examples:
"My name is Aryan" → { isContextual: false, doesNeedUpdateToContext: true }
"I'm a designer" → { isContextual: false, doesNeedUpdateToContext: true }
"I work at Lexxov" → { isContextual: false, doesNeedUpdateToContext: true }
"This task is urgent" (with no task in context) → { isContextual: true, doesNeedUpdateToContext: true }
"Do you know me?" → { isContextual: true, doesNeedUpdateToContext: false }
"Hello" → { isContextual: false, doesNeedUpdateToContext: false }
`.trim();


        try {
            const raw = await this.sendPrompt({ prompt: input })
            return JSON.parse(raw.match(/{[\s\S]*}/)?.[0]) || {
                isContextual: false,
                doesNeedUpdateToContext: false
            };
        } catch {
            return { isContextual: false, doesNeedUpdateToContext: false };
        }
    }

    async enrichPrompt(prompt, context = {}) {
        const input = `
Fix and clarify the user's message using context only if necessary.

Prompt: "${prompt}"
Context: ${JSON.stringify(context)}

Instructions:
- Fix spelling, grammar, or shorthand.
- Use context to clarify vague words like "this", "that", "again" only if needed.
- Do not generate a reply.

Return:
{ "enrichedPrompt": "..." }
    `.trim();

        try {
            const raw = await this.sendPrompt({ prompt: input });
            return JSON.parse(raw.match(/{[\s\S]*}/)?.[0]) || { enrichedPrompt: prompt };
        } catch {
            return { enrichedPrompt: prompt };
        }
    }

    async isCancellationIntent(prompt) {
        const input = `
Prompt: "${prompt}"

Does this message indicate that the user wants to cancel or restart?

Return only:
{ "clear": true/false }
    `.trim();

        try {
            const raw = await this.sendPrompt({ prompt: input });
            return JSON.parse(raw.match(/{[\s\S]*}/)?.[0]) || { clear: false };
        } catch {
            return { clear: false };
        }
    }

    // Add more utility micro-functions here as needed
}

export const kairoUtility = new GeminiUtilityAgent()