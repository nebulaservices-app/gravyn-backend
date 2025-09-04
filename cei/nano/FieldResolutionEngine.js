import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";
import { KairoFetcher } from "./KairoFetcher.js";
import { FieldResolutionBook } from "../utils/FieldResolutionRegistry.js";

export class FieldResolverAgent extends GeminiBaseAgent {
    constructor() {
        // We'll now pass prompts dynamically in resolve(), so we don't need to call super() here with a static prompt.
        super();
    }

    /**
     * Resolve fields using Gemini
     */
    async resolve(entity, intent, prompt, context, recipe) {
        const promptText = typeof prompt === "string" ? prompt : JSON.stringify(prompt);

        // 📦 Fetch prompt function and generate final prompt
        const promptFn = FieldResolutionBook?.[entity]?.[intent];
        const resolutionPrompt = typeof promptFn === "function"
            ? promptFn({ promptText, context, recipe })
            : this._fallbackPrompt();


        console.log("Resolution prompt ",  resolutionPrompt)

        const response = await this.ask(resolutionPrompt);
        const cleaned = this._cleanJSON(response);

        try {
            const parsed = JSON.parse(cleaned);

            // Downgrade ambiguous fields for safety
            for (const [field, meta] of Object.entries(parsed.unresolvedFields || {})) {
                if (meta.resolveStrategy === "ASK_FROM_USER") {
                    parsed.unresolvedFields[field].value = null;
                    parsed.unresolvedFields[field].resolvableFrom = null;
                }
            }

            return {
                resolvedFields: parsed?.resolvedFields || {},
                unresolvedFields: parsed?.unresolvedFields || {}
            };
        } catch (err) {
            console.warn("❌ Failed to parse Gemini response:", err.message);
            return {
                resolvedFields: {},
                unresolvedFields: {},
                error: "Invalid JSON from Gemini"
            };
        }
    }

    /**
     * Automatically resolve fields from DB using KairoFetcher
     */
    async autoResolveDBFields(unresolvedFields) {
        const resolved = {};
        const stillUnresolved = {};

        for (const [field, meta] of Object.entries(unresolvedFields)) {
            const { resolveStrategy, resolvableFrom, value, refEntity } = meta;

            if (
                resolveStrategy === "CAN_BE_RESOLVED_FROM_DB" &&
                value &&
                refEntity &&
                ["User", "Project", "Task"].includes(refEntity)
            ) {
                try {
                    const fetcher = new KairoFetcher(refEntity);
                    const result = await fetcher.fetch(
                        `Find ${refEntity} by ${resolvableFrom}: ${value}`,
                        ["_id"],
                        value,
                        false
                    );

                    const found = result?.result?.[0]?._id;
                    if (found) {
                        resolved[field] = found;
                    } else {
                        stillUnresolved[field] = meta;
                    }

                    console.log("🔍 Found in DB:", found);
                } catch (e) {
                    console.error(`❌ DB fetch failed for ${field}:`, e.message);
                    stillUnresolved[field] = meta;
                }
            } else {
                stillUnresolved[field] = meta;
            }
        }

        return { resolved, unresolved: stillUnresolved };
    }

    /**
     * Clean and extract JSON object from Gemini output
     */
    _cleanJSON(rawText) {
        const match = rawText.match(/\{[\s\S]*\}/);
        return match ? match[0].trim() : rawText.trim();
    }

    /**
     * Fallback static prompt if no dynamic one is found
     */
    _fallbackPrompt() {
        return `
You are FieldResolver, a specialized AI agent inside Nebula that extracts structured fields from user prompts.

🔐 Rules:
- Do NOT invent dummy values or ObjectIds.
- If a field can't be resolved, return it under "unresolvedFields".
- Only return JSON with two keys: resolvedFields and unresolvedFields.

✅ Format:
{
  "resolvedFields": {
    "fieldName": "value"
  },
  "unresolvedFields": {
    "fieldName": {
      "resolvableFrom": "name" | "email" | "title" | "date" | null,
      "resolveStrategy": "ASK_FROM_USER" | "CAN_BE_RESOLVED_FROM_DB",
      "refEntity": "User" | "Project" | null,
      "value": "Aryan" | null
    }
  }
}
        `.trim();
    }
}