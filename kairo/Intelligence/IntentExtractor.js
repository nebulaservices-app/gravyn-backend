// kairo/intelligence/IntentExtractor.js

import { GeminiAgent } from "../utils/GeminiAgent.js";

const SYSTEM_PROMPT = `
You are KairoIntent, an intent classification nano-agent inside Nebula.

Your job is to extract structured intent-entity pairs from user prompts.

Return ONLY a JSON array where each object includes:
- intent: the action (e.g. create, assign, fetch)
- entity: the domain (e.g. Task, Project, User)
- confidence: number between 0.0 to 1.0

If the prompt is unclear or general-purpose, respond with:
[{ "intent": "generalised", "entity": null, "confidence": 0.5 }]

Valid example:
[
  { "intent": "create", "entity": "Task", "confidence": 0.93 },
  { "intent": "fetch", "entity": "Project", "confidence": 0.82 }
]

NO explanation. Only clean JSON array output.
`.trim();

const VALID_INTENT_ENTITY_PAIRS = {
    Task: ["create", "delete", "assign", "update", "fetch", "summarize", "set"],
    Project: ["create", "delete", "update", "fetch", "summarize"],
    User: ["fetch", "assign", "delete", "update"],
    Workflow: ["create", "run", "delete"],
    Summary: ["fetch", "update"],
    Note: ["create", "update", "delete", "fetch"]
};

function isValid(intent, entity) {
    return VALID_INTENT_ENTITY_PAIRS?.[entity]?.includes(intent);
}

export class IntentExtractor extends GeminiAgent {
    constructor() {
        super(SYSTEM_PROMPT);
    }

    async extract(prompt) {
        try {
            const raw = await this.ask(prompt);
            const cleaned = raw.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleaned);
            const array = Array.isArray(parsed) ? parsed : [parsed];

            const valid = array.filter(({ intent, entity }) =>
                intent === "generalised" || isValid(intent, entity)
            );

            return valid.length > 0
                ? valid.map(({ intent, entity, confidence }) => ({
                    intent,
                    entity,
                    confidence,
                    combined: []
                }))
                : [{ intent: "generalised", entity: null, confidence: 0.5 }];
        } catch (err) {
            console.warn("⚠️ Intent parse failed:", err.message);
            return [{ intent: "generalised", entity: null, confidence: 0.4 }];
        }
    }
}