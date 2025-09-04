// kairo/KairoIntentAgent.js
import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";

// 🎯 Valid entity-intent mapping
export const VALID_INTENT_ENTITY_PAIRS = {
    Task: ["create", "delete", "assign", "update", "fetch", "summarize", "set"],
    Project: ["create", "delete", "update", "fetch", "summarize", "decompose"],
    Conversation: ["start", "end", "summarize", "fetch"],
    Summary: ["fetch", "update", "create"],
    User: ["create", "delete", "update", "fetch"],
    Workflow: ["create", "update", "delete", "fetch", "run"],
    Wealth: ["predict", "estimate"]
};

// 🧹 Remove markdown & trim
export function cleanJSON(rawText) {
    return rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
}

class KairoUnifiedIntentAgent extends GeminiBaseAgent {
    constructor() {
        const prompt = `
Return exactly one JSON array with one object:
[{ "entity": string|null, "intent": string, "confidence": float }]

Rules:
- entity ∈ [${Object.keys(VALID_INTENT_ENTITY_PAIRS).join(", ")}] or null
- intent must match a valid action for the entity, or be "generalised" if no clear intent
- confidence ∈ [0, 1] (use 0.5 for generalised)

Use "generalised" if the prompt is:
- Personal info (e.g., "My name is Aryan")
- Descriptive/non-actionable (e.g., "I built a system")
- Vague (e.g., "Okay", "Hi", "Hmm")

❗Never return an empty array
✅ Example fallback:
[{ "entity": null, "intent": "generalised", "confidence": 0.5 }]
`.trim();
        super(prompt, {
            model: "gemini-1.5-flash-latest",
            temperature: 0.1
        });

        this.cache = new Map();
        this.cacheHits = 0;
        this.MAX_CACHE_SIZE = 1000;
    }

    async extract(prompt) {
        console.time("🧠 Intent Extraction Total");

        if (!prompt || prompt.length > 500) {
            console.timeEnd("🧠 Intent Extraction Total");
            return [this._fallback()];
        }

        const key = prompt.trim().toLowerCase();

        // 🔁 Cache lookup
        console.time("🔁 Cache Lookup");
        if (this.cache.has(key)) {
            this.cacheHits++;
            console.timeEnd("🔁 Cache Lookup");
            console.timeEnd("🧠 Intent Extraction Total");
            return this.cache.get(key);
        }
        console.timeEnd("🔁 Cache Lookup");

        try {
            console.time("📤 LLM Request");
            const response = await this.ask(prompt);
            console.timeEnd("📤 LLM Request");

            console.time("🧹 JSON Cleanup");
            const cleaned = cleanJSON(response);
            console.timeEnd("🧹 JSON Cleanup");

            console.time("📦 JSON Parse");
            const parsed = JSON.parse(cleaned);
            console.timeEnd("📦 JSON Parse");

            console.time("✅ Filter + Normalize");
            const result = Array.isArray(parsed) && parsed.length > 0
                ? parsed.filter(this._isValidIntent).map(this._normalizeIntent)
                : [this._fallback()];
            console.timeEnd("✅ Filter + Normalize");

            // Failsafe: fallback if somehow empty after filtering
            if (result.length === 0) {
                console.warn("⚠️ Intent array was empty, forcing fallback");
                result.push(this._fallback());
            }

            console.time("💾 Cache Save");
            this._cacheSet(key, result);
            console.timeEnd("💾 Cache Save");

            console.timeEnd("🧠 Intent Extraction Total");
            return result;
        } catch (err) {
            console.warn("❌ IntentAgent Error:", err.message);
            console.timeEnd("🧠 Intent Extraction Total");
            return [this._fallback()];
        }
    }

    _isValidIntent(item) {
        if (!item || typeof item !== "object") return false;
        const { entity, intent } = item;
        if (intent === "generalised") return entity === null;
        return entity in VALID_INTENT_ENTITY_PAIRS &&
            VALID_INTENT_ENTITY_PAIRS[entity].includes(intent);
    }

    _normalizeIntent(item) {
        return {
            entity: item.entity || null,
            intent: item.intent || "generalised",
            confidence: Math.min(Math.max(parseFloat(item.confidence ?? 0.7), 0), 1)
        };
    }

    _fallback() {
        return { entity: null, intent: "generalised", confidence: 0.5 };
    }

    _cacheSet(key, value) {
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, value);
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            hits: this.cacheHits
        };
    }
}

export class KairoIntentAgent {
    constructor() {
        this.unifiedAgent = new KairoUnifiedIntentAgent();
    }

    async getIntent(prompt = "") {
        return await this.unifiedAgent.extract(prompt);
    }

    getCacheStats() {
        return this.unifiedAgent.getCacheStats();
    }
}