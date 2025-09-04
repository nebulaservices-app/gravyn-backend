import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";
import { cleanJSON } from "./KairoIntentAgent.js";
import mongoDBClient from "../../utils/MongoClient.js";
import { KairoSummarizer } from "./KairoSummarizer.js";
import { UserPrompt, TaskPrompt, ProjectPrompt } from "../utils/fetcherPrompt.js";
import Fuse from 'fuse.js';
import {ObjectId} from "mongodb";

const entityFields = {
    Task: { regexFields: ["title", "description"], fuzzyFields: ["title"] },
    User: { regexFields: ["name", "email"], fuzzyFields: ["name", "email"] },
    Project: { regexFields: ["title", "description"], fuzzyFields: ["title"] }
};

const promptMap = {
    User: UserPrompt,
    Task: TaskPrompt,
    Project: ProjectPrompt
};

function stringifyObjectIds(obj) {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value instanceof ObjectId) {
            converted[key] = value.toString();
        } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            converted[key] = stringifyObjectIds(value);
        } else {
            converted[key] = value;
        }
    }
    return converted;
}

const sanitizerMap = {
    User: (u) => {
        const { password, ...safe } = u;
        return stringifyObjectIds(safe);
    },
    Task: (t) => stringifyObjectIds(t),
    Project: (p) => stringifyObjectIds(p)
};


// Simplified MongoDB filter builder
function buildMongoFilters(filters, config) {
    const built = {};
    for (const [field, value] of Object.entries(filters)) {
        if (config.regexFields?.includes(field) && typeof value === 'string') {
            built[field] = { $regex: new RegExp(value, 'i') };
        } else if (typeof value === 'object' && value !== null && Object.keys(value).some(k => k.startsWith('$'))) {
            built[field] = value;
        } else if (Array.isArray(value)) {
            built[field] = { $in: value };
        } else {
            built[field] = value;
        }
    }
    return built;
}

export class KairoFetcher extends GeminiBaseAgent {
    constructor(entity = "Task") {
        super(promptMap[entity]);
        this.entity = entity;
        this.summarizer = new KairoSummarizer();
    }

    async fetch(userPrompt, requiredFields = [], fuzzySearchValue = "", returnSummary = true) {
        console.log(`🔍 [${this.entity}] Fetcher invoked...`);

        const entityPrompt = promptMap[this.entity];
        const fetchPrompt = `
Prompt: ${userPrompt}
Fields: ${JSON.stringify(requiredFields)}
Fuzzy: ${fuzzySearchValue}
${entityPrompt}
        `.trim();

        const config = entityFields[this.entity] || {};
        const projection = requiredFields.reduce((acc, f) => ({ ...acc, [f]: 1 }), {});
        let parsed, result = [];

        try {
            const raw = await this.sendPrompt({ prompt: fetchPrompt });
            parsed = JSON.parse(cleanJSON(raw));
        } catch (e) {
            console.warn("⚠️ GPT plan failed, fallback active.");
            parsed = null;
        }

        try {
            const db = await mongoDBClient.getDatabase(parsed?.fetch?.database || "main");
            const collection = db.collection(parsed?.fetch?.collection || `${this.entity.toLowerCase()}s`);

            if (parsed?.fetch?.filters) {
                const filters = buildMongoFilters(parsed.fetch.filters, config);
                let cursor = collection.find(filters, { projection });

                if (parsed.fetch?.sort) cursor = cursor.sort(parsed.fetch.sort);
                if (typeof parsed.fetch?.limit === 'number') cursor = cursor.limit(parsed.fetch.limit);

                result = await cursor.toArray();
            }

            console.log("Kairo fetcher filters" , parsed?.fetch?.filters);

            // Fuzzy fallback
            if (result.length === 0 && fuzzySearchValue && config.fuzzyFields?.length > 0) {
                const fallback = await collection.find({}, { projection }).limit(25).toArray();
                const fuse = new Fuse(fallback, { keys: config.fuzzyFields, threshold: 0.4 });
                const [match] = fuse.search(fuzzySearchValue);
                if (match) {
                    console.log(`✅ Fuzzy match for "${fuzzySearchValue}"`);
                    result = [match.item];
                }
            }
            const rawResults = result; // has ObjectIds

            if (returnSummary) {
                const sanitize = sanitizerMap[this.entity] || ((x) => x);
                const cleaned = rawResults.map(sanitize); // stringify _ids

                const summary = await this.summarizer.summarize(cleaned, this.entity);
                return { code: "FFxF", result: cleaned, summary };
            }

            return { code: "FFxF", result: rawResults };

        } catch (error) {
            console.error("❌ DB Error:", error.message);
            return { code: "00xE", error: error.message, target: `Kairo${this.entity}` };
        }
    }
}