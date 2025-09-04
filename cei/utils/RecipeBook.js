export const RecipeBook = {
    Task: {
        create: {
            requiredFields: {
                title: {
                    type: "string",
                    resolveStrategy: "ASK_FROM_USER"
                },
                description: {
                    type: "string",
                    resolveStrategy: "ASK_AI"
                },
                dueDate: {
                    type: "date",
                    format: "ISO8601",
                    resolveStrategy: "ASK_FROM_USER"
                },
                priority: {
                    type: "enum",
                    allowedValues: ["low", "medium", "high", "urgent"],
                    resolveStrategy: "ASK_FROM_USER"
                },
                status: {
                    type: "enum",
                    allowedValues: ["backlog", "pending", "in_progress", "under_review", "completed", "cancelled", "blocked"],
                    resolveStrategy: "ASK_FROM_USER"
                },
                assignedTo: {
                    type: "ObjectId",
                    refEntity: "User",
                    resolvableFrom: "name",
                    fallbackField: "assignedToName",
                    resolveStrategy: "DYNAMIC"
                }
            },
            optionalDefaults: {
                attachments: [],
                comments: [],
                issues: [],
                subtasks: [],
                logs: [],
                completedSubtasks: 0,
                totalSubtasks: 0,
                category: "unknown"
            }
        },

        update: {
            optionalUpdatableFields: {
                title: {
                    type: "string"
                },
                description: {
                    type: "string"
                },
                dueDate: {
                    type: "date",
                    format: "ISO8601"
                },
                priority: {
                    type: "enum",
                    allowedValues: ["low", "medium", "high", "urgent"]
                },
                status: {
                    type: "enum",
                    allowedValues: ["pending", "in-progress", "completed", "blocked", "archived"]
                },
                assignedTo: {
                    type: "ObjectId",
                    refEntity: "User",
                    resolvableFrom: "name",
                    fallbackField: "assignedToName"
                },
                attachments: {
                    type: "array"
                },
                comments: {
                    type: "array"
                },
                issues: {
                    type: "array"
                },
                subtasks: {
                    type: "array"
                },
                logs: {
                    type: "array"
                },
                completedSubtasks: {
                    type: "number"
                },
                totalSubtasks: {
                    type: "number"
                },
                category: {
                    type: "string"
                }
            }
        }
    }

    // Add more entities if needed...
};