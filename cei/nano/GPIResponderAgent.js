import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";
import { KairoReply } from "./KairoReply.js";

export class GPIResponderAgent extends GeminiBaseAgent {
    constructor() {
        super(""); // No system prompt needed
        this.replyAgent = new KairoReply();
    }

    async getResponse({ prompt, isContextual = false, context = {} }) {
        const fallbackResponse = await this.replyAgent.generateFallbackReply({
            prompt,
            isContextual,
            context
        });

        return {
            type: "gpi-response",
            source: "GPIResponderAgent",
            content: this._safeResponse(fallbackResponse)
        };
    }


    _safeResponse(text) {
        if (!text || text.length < 4 || /i (don't|do not) know/i.test(text)) {
            return "Hmm, I didn’t quite catch that. Could you clarify?";
        }
        return text.trim();
    }
}