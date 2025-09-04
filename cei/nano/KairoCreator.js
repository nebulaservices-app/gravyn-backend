// CEI/nano/KairoCreator.js
import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";
import mongoDBClient from "../../utils/MongoClient.js";
import { ObjectId } from "mongodb";
import { KairoFetcher } from "./KairoFetcher.js";
import { KairoReply } from "./KairoReply.js";
import { getRecipeByEntity } from "../RecipeBook/recipe.js";

export class KairoCreator extends GeminiBaseAgent {
    constructor(entity) {
        super();
        this.entity = entity;
        this.fetcher = new KairoFetcher(); // Optional future use
        this.reply = new KairoReply();
        this.recipe = getRecipeByEntity(entity); // ✅ Load recipe definition
    }

    async applyDefaults(payload) {
        const defaultFields = {};
        const allFields = { ...this.recipe.fields };

        for (const [key, config] of Object.entries(allFields)) {
            if (!(key in payload) && config?.default !== undefined) {
                defaultFields[key] = config.default;
            }
        }

        return { ...defaultFields, ...payload };
    }

    async create(payload, entity, context, userPrompt) {
        // 1️⃣ Apply defaults from recipe
        payload = await this.applyDefaults(payload);

        // 2️⃣ Convert ObjectId fields based on recipe
        for (const [field, config] of Object.entries(this.recipe.fields)) {
            if (
                config.type === "ObjectId" &&
                typeof payload[field] === "string" &&
                ObjectId.isValid(payload[field])
            ) {
                payload[field] = new ObjectId(payload[field]);
            }
        }

        // 3️⃣ Convert date fields based on recipe
        for (const [field, config] of Object.entries(this.recipe.fields)) {
            if (
                config.type === "date" &&
                typeof payload[field] === "string" &&
                !isNaN(Date.parse(payload[field]))
            ) {
                payload[field] = new Date(payload[field]);
            }
        }

        // 4️⃣ Append timestamps
        const now = new Date();
        payload.createdAt = now;
        payload.updatedAt = now;

        // 5️⃣ Insert into MongoDB
        const db = await mongoDBClient.getDatabase("main");
        const collectionName = this.recipe.collection;

        const result = await db.collection(collectionName).insertOne({
            ...payload,
            projectId: new ObjectId("68159219cdb8524689046498")
        });

        // 6️⃣ AI reply
        const aiMessage = await this.reply.generateCreationConfirmation(
            payload,
            this.entity,
            context,
            userPrompt
        );

        return {
            code: "CRxT",
            message: aiMessage,
            _id: result.insertedId,
            entity: this.entity,
            created: payload
        };
    }

    async extractCreateFields() {
        return {
            code: "00xE",
            error: "extractCreateFields is deprecated. Use resolvedFields from orchestrator."
        };
    }
}