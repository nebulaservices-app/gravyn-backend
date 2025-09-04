// kairo/core/Pipeline.js

import { TaskRunner } from "./TaskRunner.js";

export class Pipeline {
    constructor({ prompt, context, intents, sessionId, trace }) {
        this.prompt = prompt;
        this.context = context;
        this.intents = intents;
        this.sessionId = sessionId;
        this.trace = trace;
    }

    async execute() {
        const responses = [];

        for (const intentObj of this.intents) {
            const { intent, entity, confidence, combined = [] } = intentObj;

            this.trace.log(`🔁 Executing: intent='${intent}' on entity='${entity}'`);

            const result = await TaskRunner.run({
                prompt: this.prompt,
                context: this.context,
                intent,
                entity,
                sessionId: this.sessionId,
                trace: this.trace
            });

            if (result?.error) {
                this.trace.log(`❌ Failed: ${result.error}`);
                responses.push({ ...result });
            } else {
                this.trace.log(`✅ Completed: ${intent} ${entity}`, result.result);
                responses.push({
                    entity,
                    intent,
                    result: result.result
                });
            }
        }

        return responses.length === 1
            ? responses[0]
            : { type: "multi-response", responses };
    }
}