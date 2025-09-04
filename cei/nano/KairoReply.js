// CEI/agents/KairoReply.js
import { GeminiBaseAgent } from "../utils/GeminiBaseAgent.js";

export class KairoReply extends GeminiBaseAgent {
    constructor() {
        super(""); // Prompt provided per method
    }

    // 🔁 Handles task/project/user intent replies
    async generateIntentReply({ prompt = "", context = {}, outcome = {}, intent = {} } = {}) {
        const intentType = intent?.intent || "general";

        const replyPrompt = `
You are KairoIntentReply — a natural-sounding assistant in Nebula.

User said: "${prompt}"
Intent: ${intentType}

Context:
${JSON.stringify(context, null, 2)}

Outcome:
${JSON.stringify(outcome, null, 2)}

🧠 Compose a friendly, helpful reply:
- If fields are missing, ask nicely.
- If something was created or updated, confirm it briefly.
- DO NOT greet the user again — assume the chat is ongoing.
- DO NOT use HTML or JSX here — just a plain natural reply.
        `.trim();

        const rawText = await this.ask(replyPrompt);
        return await this._formatWithHTMLAgent(rawText, { type: "intent", prompt, context, outcome });
    }

    // 🧠 Fallback for vague messages like "Hey", "You there?"
    async generateFallbackReply({ prompt = "", isContextual = false, context = {} } = {}) {
        const fallbackPrompt = isContextual
            ? `
You are Kairo — a warm, human-like assistant in the Nebula workspace.

The user said: "${prompt}"

🧠 Context:
${JSON.stringify(context, null, 2)}

Instructions:
- Use the above context to shape your reply.
- Be warm and concise. Avoid over-greeting.
- Don’t repeat things the user already knows.
- Do NOT return HTML or JSX.
        `.trim()
            : `
You are Kairo — a friendly assistant in Nebula.

The user said: "${prompt}"

Instructions:
- If this feels like the first message, greet them lightly.
- Ask how you can help.
- Keep it casual and helpful.
- DO NOT return HTML or JSX.
        `.trim();

        const rawText = await this.ask(fallbackPrompt);
        return await this._formatWithHTMLAgent(rawText, { type: "fallback", prompt, context });
    }
    // ✅ Creation confirmation message
    async generateCreationConfirmation(payload = {}, entity = "", context = {}, prompt = "") {
        const creationPrompt = `
You are Kairo, the Nebula workspace assistant.

User said: "${prompt}"

A new ${entity.toLowerCase()} has been created with the following details:
${JSON.stringify(payload, null, 2)}

🎯 Instructions:
- Confirm creation with a cheerful tone.
- Mention useful fields like title, status, or due date if available.
- Add emojis (✅, 🎉) if natural.
- DO NOT return HTML or JSX — plain text only.
        `.trim();

        const rawText = await this.ask(creationPrompt);
        return await this._formatWithHTMLAgent(rawText, { type: "creation", entity, payload, prompt });
    }

    // 🎨 Formats the LLM reply into styled JSX (with metadata awareness)
    async _formatWithHTMLAgent(rawText = "", metadata = {}) {
        if (!rawText || rawText.toLowerCase().includes("i don't know") || rawText.length < 4) {
            return `
                <div className={styles["alert"]}>
                    <p className={styles["paragraph"]}>Hmm, I didn’t quite catch that. Could you tell me a bit more? 🤔</p>
                </div>
            `.trim();
        }

        const formatterPrompt = `
You are KairoHTMLFormatter — a strict formatter that transforms plain assistant replies into styled HTML blocks using React className={styles["..."]} syntax.

👇 Raw Text:
"${rawText}"

📦 Metadata:
${JSON.stringify(metadata, null, 2)}

🎨 Formatting Rules:
- Wrap output in ONE top-level <div className={styles["..."]}>.
- Use ONLY the following styled blocks when appropriate:
  • welcomeBox → ONLY if metadata.type === "fallback"
  • success → ONLY if metadata.type === "creation"
  • alert → if metadata.outcome?.missingFields?.length > 0
  • tip → if the message offers helpful suggestions
  • examplesBox → ONLY if multiple choices/options are being offered

📝 Text Rules:
- Wrap all sentences in <p className={styles["paragraph"]}>.
- Use <strong>, <em>, <ul><li> when needed — not for style, only for clarity.
- Add emojis only when contextually useful.
- DO NOT begin every reply with "Hi there" or "Hey" unless metadata.type === "fallback".

🚫 STRICT OUTPUT:
- Return ONLY clean JSX — no markdown, no plain text.
- DO NOT explain or describe the formatting — just the JSX output.
        `.trim();

        const formatted = await this.ask(formatterPrompt);
        const formattedClean = formatted
            ?.replace(/^jsx\s*/i, "")
            .trim();

        if (!formattedClean || !formattedClean.includes('className={styles["')) {
            // fallback if LLM fails to follow structure
            return `<div className={styles["paragraph"]}>${rawText}</div>`;
        }

        return formattedClean;
    }
}