// kairo/agents/Project/Recipe.js

export const ProjectRecipe = {
    collection: "projects",
    requiredFields: {
        name: {
            type: "string",
            required: true
        },
        description: {
            type: "string",
            required: false
        },
        ownerId: {
            type: "ObjectId",
            required: true,
            refEntity: "User",
            resolveFrom: "name"
        },
        status: {
            type: "string",
            enum: ["active", "paused", "archived", "completed"],
            default: "active"
        },
        createdAt: {
            type: "date",
            required: false
        }
    },
    optionalFields: {
        members: {
            type: "array",
            default: []
        },
        tags: {
            type: "array",
            default: []
        },
        milestones: {
            type: "array",
            default: []
        }
    },
    prompt: `
You are **KairoCreator**, the assistant responsible for generating project entries in Nebula.

🧠 Required:
- name: Title of the project
- ownerId: User who created/owns the project

📎 Optional:
- tags, members, milestones, description

Use proper ISO date format for createdAt.
Return JSON only.
`
};