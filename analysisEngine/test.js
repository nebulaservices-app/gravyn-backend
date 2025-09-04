// runKairoTimeEstimateDemo.js
import { KairoTime } from "./analysisAi.js";

const demoTasks = [
    {
        title: "Set up CI/CD pipeline for backend repo",
        description: `Implement CI/CD using GitHub Actions for automated testing and deployment to staging and production.`,
        subtasks: [
            "Write workflows",
            "Add environment secrets",
            "Connect to staging",
            "Add lint & test steps",
            "Document pipeline setup"
        ],
        projectTitle: "Nebula DevOps",
        projectDesc: "Handles automated development operations and staging releases.",
        createdAt: "2025-07-01",
        dueDate: "2025-07-04" // 🧠 Human Estimate: ~2–2.5 days
    },
    {
        title: "Create user profile page (responsive)",
        description: `A UI for user profile with image, personal info, and settings, responsive for mobile and tablet.`,
        subtasks: [
            "Wireframe design",
            "Build layout (React)",
            "Connect to API",
            "Make responsive",
            "Test on devices"
        ],
        projectTitle: "User Experience Platform",
        projectDesc: "Frontend-facing product for personal user dashboards.",
        createdAt: "2025-07-01",
        dueDate: "2025-07-06" // 🧠 Human Estimate: ~3 days
    },
    {
        title: "Add Slack + Email notification system for comments",
        description: `Notify users via Slack and Email when they are mentioned in comments across the app.`,
        subtasks: [
            "Slack webhook integration",
            "Email template setup",
            "Notification DB schema",
            "Test cases",
            "Admin toggles"
        ],
        projectTitle: "Kairo Comms",
        projectDesc: "Real-time notification and communication module.",
        createdAt: "2025-07-02",
        dueDate: "2025-07-07" // 🧠 Human Estimate: ~2.5–3 days
    },
    {
        title: "Migrate database from MongoDB to PostgreSQL",
        description: `Convert schema, adapt queries, test and deploy migration script for production.`,
        subtasks: [
            "Schema mapping",
            "Update backend models",
            "Test migration script",
            "Verify edge cases",
            "Deploy safely"
        ],
        projectTitle: "Core Data Layer",
        projectDesc: "Migrating underlying DB technology for improved consistency and analytics.",
        createdAt: "2025-07-01",
        dueDate: "2025-07-10" // 🧠 Human Estimate: ~5–6 days
    },
    {
        title: "Set up logging and monitoring using Prometheus + Grafana",
        description: `Integrate Prometheus and Grafana into the app with alert rules and visual dashboards.`,
        subtasks: [
            "Add metrics exporters",
            "Create Grafana dashboard",
            "Setup alerting rules",
            "Test log coverage",
            "Write internal guide"
        ],
        projectTitle: "Monitoring Infra",
        projectDesc: "System-wide observability setup for backend and infra.",
        createdAt: "2025-07-03",
        dueDate: "2025-07-08" // 🧠 Human Estimate: ~3 days
    },
    {
        title: "Design logo and branding palette for internal tool",
        description: `Create a clean, simple logo and choose font, brand colors for internal admin dashboard.`,
        subtasks: [
            "Sketch drafts",
            "Finalize logo design",
            "Pick primary/secondary colors",
            "Package fonts",
            "Export and deliver"
        ],
        projectTitle: "Nebula Identity",
        projectDesc: "Branding for the internal suite of productivity tools.",
        createdAt: "2025-07-01",
        dueDate: "2025-07-03" // 🧠 Human Estimate: ~1.5–2 days
    },
    {
        title: "Build file upload component with preview and validation",
        description: `Drag-drop file uploader that previews images/PDFs and validates size/type before upload.`,
        subtasks: [
            "UI layout",
            "File parser",
            "Preview generator",
            "Validation logic",
            "API integration"
        ],
        projectTitle: "File Uploader",
        projectDesc: "Frontend tool for secure and intuitive file uploads.",
        createdAt: "2025-07-02",
        dueDate: "2025-07-05" // 🧠 Human Estimate: ~2 days
    }
];

async function runDemoEstimate() {
    const kairoTime = new KairoTime();

    for (const task of demoTasks) {
        console.log("\n🚀 Estimating Task:", task.title);
        const estimatedSeconds = await kairoTime.estimateTaskTime({
            ...task,
            startDate: task.createdAt,
            deadline: task.dueDate
        });

        if (estimatedSeconds) {
            const hours = (estimatedSeconds / 3600).toFixed(2);
            const days = (estimatedSeconds / 86400).toFixed(1);

            console.log(`🧠 Estimated Time to Complete: ${estimatedSeconds} seconds`);
            console.log(`⏱️ Roughly: ${hours} hours (${days} days)`);
        } else {
            console.log("❌ Failed to get estimated time.");
        }

        console.log(`📊 Tokens used so far: ${kairoTime.getTotalTokensUsed()}`);
        console.log(`💰 Cost so far: ₹${kairoTime.getEstimatedCost()}`);
    }
}

runDemoEstimate();