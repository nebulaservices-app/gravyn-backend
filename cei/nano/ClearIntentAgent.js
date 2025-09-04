// nano/ClearIntentAgent.js
import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";

export class ClearIntentAgent extends GeminiBaseAgent {
    constructor() {
        super(`
      You are a nano-agent. Your only job is to detect if the user wants to cancel the last intent.
      
      Respond only in JSON:
      { "clear": true } or { "clear": false }

      Examples:
      - "Leave it" → { "clear": true }
      - "Cancel that task" → { "clear": true }
      - "Actually, tell me project status" → { "clear": true }
      - "Create a new task for design" → { "clear": false }
    `);
    }

    async check(prompt) {
        try {
            const result = await this.ask(prompt);
            return JSON.parse(result);
        } catch {
            return { clear: false };
        }
    }
}