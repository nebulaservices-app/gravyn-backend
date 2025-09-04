// kairo/intelligence/KairoReply.js

import { GeminiAgent} from "../utils/GeminiAgent.js";

export class KairoReply extends GeminiAgent {
    constructor(prompt, context) {
        super("You are KairoReply, a nano-agent in the KairoAI system that tries to answer context-aware queries deterministically without LLMs.");
        this.prompt = prompt.toLowerCase();
        this.context = context;
    }

    async generate() {
        const { meta = {}, active = {}, lastAction = {}, focused = {}, unfocused = [], messages = [] } = this.context || {};

        const simpleAnswers = {
            "what is my name": () => {
                const match = meta?.summary?.match(/name is (\w+)/i);
                return match ? `Your name is ${match[1]}.` : null;
            },
            "current project": () => {
                const match = meta?.summary?.match(/working on project ([^.,]+)/i);
                return match ? `You’re working on project ${match[1]}.` : null;
            },
            "last action": () => {
                if (lastAction?.status)
                    return `Your last action was ${lastAction.status}, reason: ${lastAction.reason || 'unspecified'}.`;
            },
            "summary": () => {
                return meta?.summary ? `Summary: ${meta.summary}` : null;
            }
        };

        for (const key in simpleAnswers) {
            if (this.prompt.includes(key)) {
                const response = simpleAnswers[key]();
                if (response) return response;
            }
        }

        return null; // fallback to LLM responder
    }
}