export const recipes = {
    Task: {
        collection: "tasks",
        fields: {
            title: { type: "string" },
            description: { type: "string" },
            projectId: { type: "ObjectId", refEntity: "Project", resolveFrom: "name" },
            assignedTo: { type: "ObjectId", refEntity: "User", resolveFrom: "name" },
            status: { type: "string", default: "pending" },
            priority: { type: "string", default: "medium" },
            category: { type: "string", default: "general" },

            // Timeline fields
            createdAt: { type: "date", auto: true },
            startedAt: { type: "date" },
            dueDate: { type: "date" },
            completedAt: { type: "date" },

            // Nested structures
            subtasks: { type: "array" },
            issues: { type: "array" },
            comments: { type: "array" },
            attachments: { type: "array" },
            logs: { type: "array" }
        }
    },

    Project: {
        collection: "projects",
        fields: {
            name: { type: "string" },
            description: { type: "string" },
            ownerId: { type: "ObjectId", refEntity: "User", resolveFrom: "name" },
            createdAt: { type: "date", auto: true }
        }
    },

    User: {
        collection: "users",
        fields: {
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", default: "member" },
            createdAt: { type: "date", auto: true }
        }
    }
};

export const getRecipeByEntity = (entity) => {
    if (!recipes[entity]) throw new Error(`No recipe defined for entity: ${entity}`);
    return recipes[entity];
};