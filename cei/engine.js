// ✅ CEIEngine.js
import { KairoGPI } from "./Intelligence/KairoGPI.js";
import { ContextManagerAgent } from "./context/ContextManagerAgent.js";
import { KairoUser } from "./microagents/KairoUser.js";
import { KairoTask } from "./microagents/Tasks/KairoTasks.js";
import { KairoProject } from "./microagents/KairoProject.js";

import { KairoOrchestrator } from "./nano/KairoOrchestrator.js";

export class CEIEngine {
    constructor() {
        this.kairoGPI = new KairoGPI();
        this.contextAgent = new ContextManagerAgent();

        this.kairoAgents = {
            User: new KairoUser(),
            Task: new KairoTask(),
            Project: new KairoProject(),
        };

        this.orchestrator = new KairoOrchestrator({
            kairoGPI: this.kairoGPI,
            contextAgent: this.contextAgent,
            kairoAgents: this.kairoAgents
        });
    }

    async handleUserPrompt({ prompt, sessionId = "default-session" }) {
        return await this.orchestrator.run({ prompt, sessionId });
    }
}