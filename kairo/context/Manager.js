// kairo/context/Manager.js

export class ContextManager {
    constructor() {
        this.sessions = new Map();
    }

    _initializeSession(sessionId) {
        this.sessions.set(sessionId, {
            active: {},
            lastAction: {},
            focused: {},
            unfocused: [],
            messages: [],
            meta: {
                summary: "",
                history: []
            }
        });
    }

    getSessionContext(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this._initializeSession(sessionId);
        }
        return this.sessions.get(sessionId);
    }

    updateWithIntents(sessionId, intents = []) {
        const session = this.getSessionContext(sessionId);
        const lastFocused = session.focused || {};

        // Push previous focus to unfocused if it's being replaced
        if (lastFocused.intent && lastFocused.entity) {
            session.unfocused.push({
                ...lastFocused,
                droppedAt: new Date().toISOString()
            });
        }

        const topIntent = intents[0] || { intent: "generalised", entity: null };

        session.active = {
            intent: topIntent.intent,
            entity: topIntent.entity
        };

        session.focused = {
            intent: topIntent.intent,
            entity: topIntent.entity
        };

        session.meta.lastUpdated = new Date().toISOString();
        session.meta.history.push({
            timestamp: new Date().toISOString(),
            context: JSON.parse(JSON.stringify(session)) // Deep snapshot
        });

        return session;
    }

    pushMessage(sessionId, prompt) {
        const session = this.getSessionContext(sessionId);
        session.messages.push({ prompt, timestamp: new Date().toISOString() });

        // Cap messages to last 5
        if (session.messages.length > 5) {
            session.messages.shift();
        }
    }

    recordAction(sessionId, status, reason = "") {
        const session = this.getSessionContext(sessionId);
        session.lastAction = {
            status,
            reason,
            timestamp: new Date().toISOString()
        };
    }

    refreshSummary(sessionId) {
        const session = this.getSessionContext(sessionId);

        const recent = session.messages.map(m => m.prompt).join(" | ");

        const summary = `Recent activity: ${recent}. Last action: ${session.lastAction.status || "none"}`;

        session.meta.summary = summary;
        return summary;
    }

    clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }
}