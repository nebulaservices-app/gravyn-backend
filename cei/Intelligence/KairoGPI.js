// intelligence/KairoGPI.js
import { KairoIntentAgent } from "../nano/KairoIntentAgent.js";
import { GPIResponderAgent } from "../nano/GPIResponderAgent.js";
import { ClearIntentAgent } from "../nano/ClearIntentAgent.js";

export class KairoGPI {
    constructor() {
        this.intentExtractorAgent = new KairoIntentAgent();
        this.generalPurposeResponderAgent = new GPIResponderAgent();
        this.clearIntentAgent = new ClearIntentAgent();
    }

    async extractIntent(prompt) {
        return await this.intentExtractorAgent.getIntent(prompt);
    }

    async generalPurposeResponse(prompt, isContextual, context) {
        const response = await this.generalPurposeResponderAgent.getResponse({prompt , isContextual , context});

        return {
            code: "GPIx",
            message: response
        };
    }
    async askShouldClearIntent(prompt) {
        return await this.clearIntentAgent.check(prompt);
    }
}