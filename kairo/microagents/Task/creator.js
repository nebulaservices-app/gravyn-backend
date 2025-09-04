// kairo/agents/Task/Creator.js

import { GeminiAgent } from "../../utils/GeminiAgent.js";
import { TaskRecipe } from "./Recipe.js";
import { Registry } from "../../knowledge/registry.js";

export class TaskCreator extends GeminiAgent {
    constructor() {
        super(`
You are TaskCreator, a micro-agent in Nebula responsible for creating tasks.
Ensure all required fields are present before creating a task.
If any field is missing, return a helpful error message.
Reply concisely and informatively in natural language.
        `.trim());
        this.recipe = TaskRecipe;
    }

    async generateResponse(prompt, context, projectId, options = {}) {
        const { contextUpdate = {} } = context;
        const requiredFields = this.recipe.requiredFields;

        const missing = requiredFields.filter(field => !contextUpdate[field]);
        if (missing.length > 0) {
            return {
                success: false,
                error: `Missing required fields: ${missing.join(", ")}`,
                hint: `Please provide values for: ${missing.join(", ")}.`
            };
        }

        // 🛠️ Build new task object
        const newTask = {
            title: contextUpdate.title,
            assignedTo: contextUpdate.assignedTo,
            dueDate: contextUpdate.dueDate || null,
            projectId: projectId || contextUpdate.projectId || null,
            status: "pending",
            createdAt: new Date().toISOString()
        };

        // 📦 Simulate task storage
        const taskId = Registry.save("Task", newTask);

        const agenticConfirmation = await this.ask(
            `A task titled "${newTask.title}" has been created and assigned to ${newTask.assignedTo}.`
        );

        return {
            success: true,
            taskId,
            message: agenticConfirmation
        };
    }
}