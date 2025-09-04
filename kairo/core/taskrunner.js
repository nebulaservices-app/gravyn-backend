// kairo/core/TaskRunner.js

import { AgentRegistry } from "../agents/AgentRegistry.js";

export class TaskRunner {
    static async run({ prompt, context, intent, entity, sessionId, trace }) {
        try {
            // 1. Resolve micro-agent
            const EntityAgents = AgentRegistry[entity];
            if (!EntityAgents || !EntityAgents[intent]) {
                return {
                    error: `No agent found for intent '${intent}' on entity '${entity}'`,
                    entity,
                    intent
                };
            }

            const AgentClass = EntityAgents[intent];
            const agentInstance = new AgentClass();

            // 2. Call agent's handler
            const result = await agentInstance.handle(prompt, context, {
                intent,
                entity,
                sessionId,
                trace
            });

            return { result };
        } catch (err) {
            return {
                error: `Agent error: ${err.message}`,
                entity,
                intent
            };
        }
    }
}