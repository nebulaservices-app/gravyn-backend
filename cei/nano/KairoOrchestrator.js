import { FieldResolverAgent } from "./FieldResolutionEngine.js";
import { kairoUtility } from "../utils/KairoUtilityAgent.js";
import { contextManager } from "../context/ContextManagerAgent.js";
import { RecipeBook } from "../utils/RecipeBook.js";

export class KairoOrchestrator {
    constructor({ kairoGPI, contextAgent, kairoAgents }) {
        this.kairoGPI = kairoGPI;
        this.contextAgent = contextAgent;
        this.kairoAgents = kairoAgents;

        this.allAgents = [
            kairoGPI.intentExtractorAgent,
            kairoGPI.generalPurposeResponderAgent,
            contextAgent,
            ...Object.values(kairoAgents)
        ];
    }

    async run({ prompt, sessionId = "default-session" }) {
        const timeStart = Date.now();

        // Step 1: Extract Intent
        const intentResults = await this.kairoGPI.extractIntent(prompt);
        const primaryIntent = intentResults?.[0] || {};
        console.log(`⏱ Intent Extraction Time: ${Date.now() - timeStart}ms`);
        console.log("Intent Results:", intentResults);

        // Step 2: Check for contextual prompt
        const ctxStart = Date.now();
        const contextualStatus = await kairoUtility.isContextualPrompt(prompt, sessionId);
        console.log("Context Check:", contextualStatus, `⏱ Context Time: ${Date.now() - ctxStart}ms`);

        const activeContext = this.contextAgent.getContext(sessionId);

        // Step 3: Handle Generalised Intent
        if (primaryIntent.intent === "generalised") {
            const gpiResponse = await this.kairoGPI.generalPurposeResponse(
                prompt,
                contextualStatus.isContextual,
                activeContext
            );

            if (contextualStatus.doesNeedUpdateToContext) {
                this.contextAgent.inferAndUpdateContext(sessionId, prompt, primaryIntent).catch(() => {});
            }

            this._logTokenUsage();
            return gpiResponse;
        }

        // Step 4: Handle Agentic Intents
        const responses = [];

        for (const { intent, entity } of intentResults) {
            const agent = this.kairoAgents[entity];
            const recipe = RecipeBook?.[entity]?.[intent];

            if (!agent || !recipe) {
                console.log("No agent or recipe is present")
                responses.push({ error: `⚠️ No agent/recipe for ${entity}.${intent}` });
                continue;
            }

            await this.contextAgent.inferAndUpdateContext(sessionId, prompt, intent);
            const context = this.contextAgent.getContext(sessionId);

            // Step 5: Resolve fields
            const resolver = new FieldResolverAgent(entity, intent);
            const fieldResult = await resolver.resolve(entity, intent, prompt, context, recipe);

            let { resolvedFields, unresolvedFields } = fieldResult;

            console.log("Console resolved and unresolved " ,  fieldResult);


            const needsUserInput = Object.values(unresolvedFields).some(
                meta => meta.resolveStrategy === "ASK_FROM_USER"
            );

            if (needsUserInput) {
                responses.push({
                    status: "awaiting_more_info",
                    message: "Please provide the following missing information:",
                    missingFields: unresolvedFields
                });
                continue;
            }

            // Step 6: Auto Resolve DB Fields
            const { resolved, unresolved } = await resolver.autoResolveDBFields(unresolvedFields);

            resolvedFields = { ...resolvedFields, ...resolved };
            unresolvedFields = unresolved;

            context._resolvedFields = resolvedFields;

            // Step 7: Call the agent
            try {
                const response = await agent.generateResponse(
                    prompt,
                    intent,
                    entity,
                    context,
                    resolvedFields,
                    unresolvedFields,
                    "68159219cdb8524689046498"
                );

                await this.contextAgent.refreshSummary(sessionId);
                responses.push({
                    updatedContext: this.contextAgent.getContext(sessionId),
                    response
                });
            } catch (err) {
                responses.push({
                    code: "00xR",
                    error: `❌ Agent failed: ${err.message}`,
                    context
                });
            }
        }

        console.log(`⏱ Full Orchestration Time: ${Date.now() - timeStart}ms`);
        this._logTokenUsage();

        return responses.length === 1 ? responses[0] : { type: "multi-response", results: responses };
    }

    async _shouldClearIntent(prompt) {
        const ask = await this.kairoGPI.askShouldClearIntent?.(prompt);
        return ask?.clear === true;
    }

    _logTokenUsage() {
        this.allAgents.forEach(agent => {
            if (
                typeof agent.getTotalTokensUsed === "function" &&
                typeof agent.getEstimatedCost === "function"
            ) {
                const tokens = agent.getTotalTokensUsed();
                const cost = agent.getEstimatedCost("INR");
                console.log(`🧾 Tokens: ${tokens} | Cost: ₹${cost}`);
            }
        });

        console.log("✅ End of transaction.\n");
    }
}