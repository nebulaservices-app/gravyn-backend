// File: nano/KairoUpdater.js

import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";
import { cleanJSON } from "./KairoIntentAgent.js";
import mongoDBClient from "../../utils/MongoClient.js";
import { TaskUpdatePrompt } from "../utils/updaterRegistry.js";
import { KairoFetcher } from "./KairoFetcher.js";

const updateRecipes = {
    Task: {
        collection: "tasks",
        updatableFields: ["title", "description", "status", "priority", "dueDate", "assignedTo"]
    }
};

export class KairoUpdater extends GeminiBaseAgent {
    constructor(entity) {
        super(KairoUpdater.getEntityPrompt(entity));
        this.entity = entity;
        this.recipe = updateRecipes[entity];
        this.fetcher = new KairoFetcher(entity);
    }

    static getEntityPrompt(entity) {
        switch (entity) {
            case "Task": return TaskUpdatePrompt;
            default: throw new Error(`No update prompt defined for entity: ${entity}`);
        }
    }

    async extractUpdateFields(prompt, context = {}) {
        const today = new Date().toISOString().split("T")[0];
        const structuredPrompt = `
User said: "${prompt}"
Today: ${today}
Context: ${JSON.stringify(context)}

Return structured JSON:
{
  "fieldsToUpdate": { "fieldName": "newValue" },
  "missingInfo": [],
  "target": { "byId": "...", "byName": "..." }
}`;
        const raw = await this.sendPrompt({ prompt: structuredPrompt });
        const parsed = JSON.parse(cleanJSON(raw));
        console.log("🧠 Fields extracted for update:", parsed);
        return parsed;
    }

    async findTargetId(targetInfo) {
        console.log("Target Info ", targetInfo);
        if (targetInfo?.byId) {
            return targetInfo.byId;
        }

        if (targetInfo?.byName) {
            console.log(`Searching document with name/title: ${targetInfo.byName}`);
            const fetchResult = await this.fetcher.fetch(`Find task titled \"${targetInfo.byName}\"`, ["_id"]);

            if (fetchResult.code === "FFxF" && fetchResult.result.length > 0) {
                return fetchResult.result[0]._id;
            }
        }

        return null;
    }

    async update(documentId, fieldsToUpdate = {}) {
        const db = await mongoDBClient.getDatabase("main");
        const collection = db.collection(this.recipe.collection);

        const sanitizedUpdate = {};
        for (const field of this.recipe.updatableFields) {
            if (field in fieldsToUpdate) {
                sanitizedUpdate[field] = fieldsToUpdate[field];
            }
        }

        if (Object.keys(sanitizedUpdate).length === 0) {
            return {
                code: "00xE",
                error: "No valid fields to update.",
                target: `Kairo${this.entity}`
            };
        }

        const result = await collection.updateOne(
            { _id: new mongoDBClient.ObjectId(documentId) },
            { $set: sanitizedUpdate }
        );

        if (result.modifiedCount > 0) {
            return {
                code: "UPxT",
                message: `${this.entity} updated successfully.`,
                updatedFields: sanitizedUpdate
            };
        } else {
            return {
                code: "00xE",
                error: `${this.entity} update failed or no changes made.`,
                target: `Kairo${this.entity}`
            };
        }
    }

    async updateFromPrompt(prompt, context = {}) {
        const { fieldsToUpdate, missingInfo, target } = await this.extractUpdateFields(prompt, context);
        console.log("Fields to update", fieldsToUpdate, "Missing info ", missingInfo, "Target ", target);

        if (missingInfo?.length > 0) {
            return {
                code: "00xM",
                message: "Missing fields for update.",
                missingInfo
            };
        }

        const targetId = await this.findTargetId(target);
        if (!targetId) {
            return {
                code: "00xE",
                error: "Could not locate the task to update.",
                target: `Kairo${this.entity}`
            };
        }

        return await this.update(targetId, fieldsToUpdate);
    }
}