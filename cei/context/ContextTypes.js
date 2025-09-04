export const defaultContext = () => ({
    active: {
        intent: null,
        entity: null,
        targetId: null
    },
    entities: {
        Task: [],
        Project: [],
        User: [],
        GeneralInfo: {} // 🆕 Holds session-level data (NOT an entity array)
    },
    meta: {
        summary: "",
        lastUpdated: null,
        history: []
    }
});