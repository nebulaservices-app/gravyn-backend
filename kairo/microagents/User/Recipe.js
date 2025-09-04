// kairo/agents/User/Recipe.js

export const UserRecipe = {
    collection: "users",
    requiredFields: {
        name: {
            type: "string",
            required: true
        },
        email: {
            type: "string",
            required: true
        },
        role: {
            type: "string",
            enum: ["admin", "manager", "contributor", "viewer"],
            default: "contributor"
        }
    },
    optionalFields: {
        phone: {
            type: "string",
            required: false
        },
        avatarUrl: {
            type: "string",
            required: false
        },
        createdAt: {
            type: "date",
            required: false
        },
        lastActiveAt: {
            type: "date",
            required: false
        },
        assignedTasks: {
            type: "array",
            default: []
        }
    },
    prompt: `
You are **KairoCreator**, the intelligent assistant for creating user profiles in Nebula.

🧠 Required Fields:
- name: Full name of the user.
- email: Valid email address.
- role: User role in the project team.

📎 Optional Fields:
- phone, avatarUrl, createdAt, lastActiveAt

Only return valid JSON.
`
};