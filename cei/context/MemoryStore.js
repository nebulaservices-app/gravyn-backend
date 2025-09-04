// CEI/context/MemoryStore.js

import { defaultContext } from "./ContextTypes.js";

export class MemoryStore {
    constructor() {
        this.sessionMap = new Map();
    }

    getAll() {
        return Object.fromEntries(this.sessionMap.entries());
    }

    get(sessionId) {
        if (!this.sessionMap.has(sessionId)) {
            this.sessionMap.set(sessionId, defaultContext());
        }
        return this.sessionMap.get(sessionId);
    }

    update(sessionId, newContext = {}) {

        const existing = this.sessionMap.get(sessionId) || {};

        // ✅ Dynamically deep merge entities
        const mergedEntities = { ...existing.entities };

        for (const [entityKey, newEntityValue] of Object.entries(newContext.entities || {})) {
            const existingEntityValue = existing.entities?.[entityKey];

            if (
                typeof newEntityValue === "object" &&
                !Array.isArray(newEntityValue) &&
                newEntityValue !== null &&
                typeof existingEntityValue === "object"
            ) {
                // Merge plain object sub-entities (e.g., GeneralInfo)
                mergedEntities[entityKey] = {
                    ...existingEntityValue,
                    ...newEntityValue
                };
            } else {
                // Replace arrays or unknown types
                mergedEntities[entityKey] = newEntityValue;
            }
        }

        // ✅ Intelligent History Management
        const existingHistory = existing.meta?.history || [];
        const newHistory = newContext.meta?.history || [];
        const finalHistory = [...existingHistory];

        for (const entry of newHistory) {
            const recentSlice = finalHistory.slice(-5); // prevent spamming recent 5
            if (!recentSlice.includes(entry)) {
                finalHistory.push(entry);
            }
        }

        const final = {
            ...existing,
            ...newContext,
            entities: mergedEntities,
            meta: {
                ...existing.meta,
                ...(newContext.meta || {}),
                history: finalHistory,
                lastUpdated: newContext.meta?.lastUpdated || existing.meta?.lastUpdated
            },
            flags: {
                ...existing.flags,
                ...(newContext.flags || {})
            }
        };

        this.sessionMap.set(sessionId, final);
        return final;
    }


    delete(sessionId) {


        this.sessionMap.delete(sessionId);
    }

    debug(sessionId) {
        return this.get(sessionId);
    }

    clearAll() {
        this.sessionMap.clear();
    }
}