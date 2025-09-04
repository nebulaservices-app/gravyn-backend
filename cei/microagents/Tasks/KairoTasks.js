import { GeminiBaseAgent } from "../../utils/GeminiBaseAgent.js";
import { KairoCreator } from "../../nano/KairoCreator.js";
import { KairoUpdater } from "../../nano/KairoUpdater.js";
import { KairoFetcher } from "../../nano/KairoFetcher.js";
import { KairoReply } from "../../nano/KairoReply.js";
import { KairoGPI } from "../../Intelligence/KairoGPI.js";
import { ObjectId } from "mongodb";
import mongoDBClient from "../../../utils/MongoClient.js";

export class KairoTask extends GeminiBaseAgent {
    constructor() {
        super();
        this.creator = new KairoCreator("Task");
        this.updater = new KairoUpdater("Task");
        this.fetcher = new KairoFetcher("User");
        this.kairoGPI = new KairoGPI();
        this.replyAgent = new KairoReply();
    }

    async generateResponse(prompt, intent ,entity , context,resolvedFields, unresolvedFields, projectId) {

        switch (intent) {
            case "create":
                console.log("Creating the data", intent)
                return await this._handleCreate(prompt, entity , context, resolvedFields, unresolvedFields, projectId);
            case "update":
                return await this.updater.updateFromPrompt(prompt, context);
            case "fetch":
                return await this.fetchTask(context.taskId);
            case "assign":
                return await this.assignTask(context.taskId, context.assigneeName);
            case "delete":
                return await this.deleteTask(context.taskId);
            default:
                const fallback = await this.replyAgent.generateFallbackReply({ prompt });
                return {
                    code: "00xE",
                    error: fallback,
                    message: fallback
                };
        }
    }

    async _handleCreate(prompt, entity , context, resolvedFields, unresolvedFields, projectId) {
        let payload;

        const hasResolved = resolvedFields && Object.keys(resolvedFields).length > 0;
        const hasUnresolved = unresolvedFields && Object.keys(unresolvedFields).length > 0;

        if (hasResolved && !hasUnresolved) {
            // ✅ Use passed-in resolved fields directly
            payload = resolvedFields;
        } else {
            console.log("There is unresoivled data")
            // 🧠 Fallback to LLM-based field extraction
            const fields = await this.creator.extractCreateFields(prompt, context, projectId);

            if (!fields || fields.code === "00xM") {
                const missingFields = fields?.requiredFields || Object.keys(this.creator.recipe.requiredFields);
                const reply = await this.replyAgent.generateIntentReply({
                    prompt,
                    context,
                    outcome: { missingFields },
                    intent: { intent: "create", entity: "Task" }
                });

                return {
                    code: "00xM",
                    error: reply,
                    requiredFields: missingFields,
                    message: reply
                };
            }

            payload = fields.contextUpdate;
        }

        const created = await this.creator.create(payload, entity, context, prompt);

        console.log("Data creeated" , created,  "with payload" , payload)

        const reply = await this.replyAgent.generateIntentReply({
            prompt,
            context,
            outcome: { created },
            intent: { intent: "create", entity: "Task" }
        });

        return { ...created, message: reply };
    }


    async assignTask(taskId, assigneeName) {
        const db = await mongoDBClient.getDatabase("main");
        const user = await db.collection("users").findOne({ name: assigneeName });

        if (!user) {
            return {
                code: "00xE",
                error: `User ${assigneeName} not found.`
            };
        }

        const result = await db.collection("tasks").updateOne(
            { _id: new ObjectId(taskId) },
            { $set: { assignedTo: user._id } }
        );

        return {
            code: "ASxT",
            message: `Task ${taskId} assigned to ${assigneeName}`,
            modifiedCount: result.modifiedCount
        };
    }

    async fetchTask(taskId) {
        const db = await mongoDBClient.getDatabase("main");
        const task = await db.collection("tasks").findOne({ _id: new ObjectId(taskId) });

        if (!task) {
            return {
                code: "00xE",
                error: `Task ${taskId} not found.`
            };
        }

        return {
            code: "FFxF",
            task
        };
    }

    async deleteTask(taskId) {
        const db = await mongoDBClient.getDatabase("main");
        const result = await db.collection("tasks").deleteOne({ _id: new ObjectId(taskId) });

        if (!result.deletedCount) {
            return {
                code: "00xE",
                error: `Failed to delete task ${taskId}`
            };
        }

        return {
            code: "00x1",
            message: `Task ${taskId} deleted successfully.`
        };
    }
}