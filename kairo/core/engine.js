// kairo/core/Engine.js

import { ContextManager } from "../context/Manager.js";
import { IntentExtractor } from "../intelligence/IntentExtractor.js";
import { GPIResponder } from "../intelligence/GPIResponder.js";
import { Pipeline } from "./Pipeline.js";
import { Trace } from "./Trace.js";

export class Engine {
    constructor() {
        this.contextManager = new ContextManager();
        this.intentExtractor = new IntentExtractor();
        this.gpiResponder = new GPIResponder();
    }

    async handlePrompt(prompt, sessionId = "default-session") {
        const trace = new Trace(prompt);

        // 1. Message Ingestion
        trace.log("📩 Prompt received");

        // 2. Context Interpretation
        const context = this.contextManager.getSessionContext(sessionId);
        trace.log("🧠 Loaded context", context);

        // 3. Intent Extraction
        const intents = await this.intentExtractor.extract(prompt);
        trace.log("🎯 Intents extracted", intents);

        // 4. Context Update
        const updatedContext = this.contextManager.updateWithIntents(sessionId, intents);

        // 5. Field Resolution & Routing
        const pipeline = new Pipeline({
            prompt,
            context: updatedContext,
            intents,
            sessionId,
            trace
        });

        // 6. Run the pipeline to perform agentic task
        const response = await pipeline.execute();

        // 7. Memory Update & Summary
        this.contextManager.refreshSummary(sessionId);

        // 8. Final Response
        trace.log("✅ Final response", response);
        return {
            response,
            trace: trace.get()
        };
    }
}