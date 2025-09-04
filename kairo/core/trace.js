// kairo/core/Trace.js

export class Trace {
    constructor(prompt) {
        this.prompt = prompt;
        this.steps = [];
        this.timestamp = new Date().toISOString();
        this.sessionId = null;
    }

    log(label, data = null) {
        this.steps.push({
            timestamp: new Date().toISOString(),
            label,
            ...(data !== null ? { data } : {})
        });
    }

    attachSession(sessionId) {
        this.sessionId = sessionId;
    }

    get() {
        return {
            sessionId: this.sessionId,
            prompt: this.prompt,
            timestamp: this.timestamp,
            steps: this.steps
        };
    }

    // print() {
    //     for (const step of this.steps) {
    //         if (step.data) {
    //             console.dir(step.data, { depth: null });
    //         }
    //     }
    // }
}