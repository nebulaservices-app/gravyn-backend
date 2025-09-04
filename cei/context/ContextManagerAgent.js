import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";
import { defaultContext } from "./ContextTypes.js";
import { MemoryStore } from "./MemoryStore.js";
import { SummaryBuilder } from "./SummaryBuilder.js";

export class ContextManagerAgent extends GeminiBaseAgent {
    constructor() {
        super(`You are a context interpreter for Nebula — a project management system.`);
        this.memory = new MemoryStore();
        this.summaryBuilder = new SummaryBuilder();
    }

    // 📥 Get current session context
    getContext(sessionId) {
        return this.memory.get(sessionId);
    }

    // 🧹 Clear session
    clearContext(sessionId) {
        this.memory.delete(sessionId);
    }

    // 🪪 Debug view
    debugContext(sessionId) {
        return this.memory.debug(sessionId);
    }

    // 🧠 Summary (cached)
    summarizeContext(sessionId) {
        return this.getContext(sessionId)?.meta?.summary || "";
    }

    // 🔄 Clear last intent
    clearLastFailedIntent(sessionId) {
        const current = this.getContext(sessionId);
        current.active = { intent: null, entity: null, targetId: null };
        this.memory.update(sessionId, current);
    }


    // 🧽 Detect if user asked to clear/reset
    async _shouldClearIntent(prompt) {
        const input = `
User said: "${prompt}"

→ Reply only:
{ "clear": true } or { "clear": false }
`.trim();

        const raw = await this.sendPrompt({ prompt: input });
        try {
            const parsed = JSON.parse(raw.match(/{[\s\S]*}/)?.[0]);
            return parsed?.clear === true;
        } catch {
            return false;
        }
    }

    // 📄 Update summary only
    async refreshSummary(sessionId) {
        const current = this.getContext(sessionId);
        current.meta.summary = await this.summaryBuilder.build(current.entities || {});
        return current.meta.summary;
    }

    // 🧠 Infer and update context (core functionality)
    async inferAndUpdateContext(sessionId, prompt, extractedIntent, externalContext = {}) {
        const current = this.getContext(sessionId);

//         const contextPrompt = `
// You are a context updater for Nebula — a project management assistant.
//
// Your job:
// Update the working session context based on the user's prompt and extracted intent.
//
// ---
//
// 🟨 Prompt:
// ${prompt}
//
// 🟩 Extracted Intent:
// ${JSON.stringify(extractedIntent, null, 2)}
//
// 🗃️ Current Context:
// ${JSON.stringify(current, null, 2)}
// ---
//
// 📘 Rules:
//
// 1. Return a strict JSON object — **only the fields that changed**.
// 2. Do NOT include free text or natural language.
// 3. Structure entities as arrays:
//    - Example: "Task": [ { id, title, assignedTo: { id, name }, dueDate, priority, status } ]
// 4. If you're creating something new, generate a short readable ID (e.g. "task_391").
// 5. Add a string to meta.history like:
//    - "Created Task 'Design Page'"
//    - "Updated Task 'task_391'"
// 6. Set meta.lastCreated if new item added:
//    - { entity: "Task", name: "Design Page", _id: "task_391", createdAt: "..." }
// 7. Set meta.lastUpdated to the current ISO timestamp.
//
// 🔍 8. Build a **strong, clear meta.summary**:
//    - Include key stats (e.g. number of tasks, projects, users).
//    - Mention roles, assignments, and deadlines briefly if relevant.
//    - If personal info was updated, reflect it (e.g., “User Aryan is a Backend Engineer from Kanpur.”).
//    - Make it sound like a quick status report a PM would read.
//    - Use human-style summarization, not bullet points or JSON format.
//    - Example:
//      - "You have 3 active tasks. 'Design Page' is due tomorrow. Aryan is assigned to two tasks."
//      - "User Aryan is a 23-year-old Backend Engineer from Kanpur. No active projects yet."
//
// 9. If the user shares **personal info** (e.g., "My name is Aryan"), store it in \`entities.GeneralInfo\`, not in the \`User\` list.
//    - Example:
//      GeneralInfo: {
//        name: "Aryan",
//        timezone: "Asia/Kolkata"
//      }
//
// 10. Do NOT treat personal declarations as new entities unless clearly asking to "create user", "add teammate", etc.
//
// ---
//
// 📤 Your response must return ONLY this:
//
// {
//   active: { intent, entity, targetId },
//   entities: {
//     Task: [ ... ],
//     Project: [ ... ],
//     User: [ ... ],
//     GeneralInfo: { ... }
//   },
//   meta: {
//     summary: "Updated summary string",
//     lastUpdated: "ISO timestamp",
//     lastCreated: { entity, name, _id, createdAt },
//     history: [ "..." ]
//   }
// }
// `.trim();

        const contextPrompt = `
You are a context updater for Nebula — a project management assistant.

Your task:
Update the session context using the user's prompt and extracted intent.

---

🔹 Prompt:
${prompt}

🔹 Extracted Intent:
${JSON.stringify(extractedIntent, null, 2)}

🔹 Current Context:
${JSON.stringify(current, null, 2)}

---

📘 Rules:

1. Return only changed fields in a strict JSON object.
2. Do not include natural language or comments.
3. Use arrays for entities. Example:
   Task: [{ id, title, assignedTo: { id, name }, dueDate, priority, status }]
4. When creating new entities, use short IDs (e.g., "task_391").
5. Add a line to \`meta.history\` such as:
   - "Created Task 'Design Page'"
   - "Updated Task 'task_391'"
6. Set \`meta.lastCreated\` if a new entity is created:
   { entity, name, _id, createdAt }
7. Set \`meta.lastUpdated\` to the current ISO timestamp.
8. Generate \`meta.summary\` as a brief project manager-style report:
   - Include task counts, assignments, user roles, or personal info.
   - Use one-liner format. Examples:
     - "You have 3 active tasks. 'Design Page' is due tomorrow."
     - "User Aryan is a 23-year-old Backend Engineer from Kanpur. No active projects."
9. Personal info (e.g., “My name is Aryan”) must go under \`entities.GeneralInfo\`, not in the \`User\` array.
10. Do not assume creation of new users or projects unless explicitly asked.

---

📤 Output format:

{
  active: { intent, entity, targetId },
  entities: {
    Task: [ ... ],
    Project: [ ... ],
    User: [ ... ],
    GeneralInfo: { ... }
  },
  meta: {
    summary: "Updated summary string",
    lastUpdated: "ISO timestamp",
    lastCreated: { entity, name, _id, createdAt },
    history: [ "..." ]
  }
}
`.trim();
        let updates = {};
        try {
            const raw = await this.sendPrompt({ prompt: contextPrompt });
            updates = JSON.parse(raw.match(/{[\s\S]*}/)?.[0]) || {};
        } catch (e) {
            console.error("❌ Failed to parse context update:\n", e);
            return current;
        }




        // Only LLM determines updates now — no local processing
        return this.memory.update(sessionId, updates);
    }

}

export const contextManager = new ContextManagerAgent();