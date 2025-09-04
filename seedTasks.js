// seedBottleneckTasks.js
import { ObjectId } from "mongodb";
import mongoDBClient from "./utils/MongoClient.js";
import { estimateEffortSecondsForTask } from "./utils/AiUtils/WorkEstimator.js";

const projectId = "68159219cdb8524689046498";

// User profiles for workload distribution
const userProfiles = {
    // OVERLOADED USERS (high bottleneck risk)
    "6821e97f0b78b01dae9527bd": { name: "Alex_Backend", maxCapacity: 8, stress: "HIGH" },
    "68221d90e2d6a83803299798": { name: "Maya_QA", maxCapacity: 6, stress: "HIGH" },
    "68564c39c9b01c76fa6db939": { name: "Sam_Frontend", maxCapacity: 7, stress: "CRITICAL" },

    // BALANCED USERS (moderate load)
    "682261a534dad32c4fb247d4": { name: "Raj_DevOps", maxCapacity: 8, stress: "MEDIUM" },

    // UNDERUTILIZED USERS (light load)
    "6822652d34dad32c4fb247d5": { name: "Lisa_Design", maxCapacity: 8, stress: "LOW" },
    "6822659534dad32c4fb247d6": { name: "Tom_Product", maxCapacity: 8, stress: "LOW" }
};

// Complete task dataset with workload imbalance
const bottleneckTasks = [
    // =================================================================
    // ALEX_BACKEND - OVERLOADED (58+ hours in 7 days) - CRITICAL BOTTLENECK
    // =================================================================
    {
        projectId,
        title: "Database Migration: User Permissions Overhaul",
        description: "Migrate 2M+ user records to new permission system with zero downtime.",
        assignedTo: "6821e97f0b78b01dae9527bd",
        status: "in_progress",
        priority: "urgent",
        category: "feature",
        createdAt: "2025-08-17T09:00:00Z",
        startedAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-20T09:00:00Z",  // Changed due date
        estimatedHours: 16,
        subtasks: ["backup current data", "test migration script", "rollback plan", "monitor performance"],
        issues: [],
        comments: [],
        attachments: [],
        logs: []
    },
    {
        projectId,
        title: "API Gateway: Rate Limiting & Circuit Breaker",
        description: "Implement advanced rate limiting with Redis cluster and circuit breaker patterns.",
        assignedTo: "6821e97f0b78b01dae9527bd",
        status: "todo",
        priority: "high",
        category: "feature",
        createdAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-20T09:00:00Z",  // Changed due date
        estimatedHours: 12,
        subtasks: ["Redis setup", "rate limiter logic", "circuit breaker", "load testing"],
        issues: [],
        comments: [],
        attachments: [],
        logs: []
    },
    {
        projectId,
        title: "Critical: Memory Leak in WebSocket Handler",
        description: "Production memory leak causing server crashes every 6 hours.",
        assignedTo: "6821e97f0b78b01dae9527bd",
        status: "blocked",
        priority: "urgent",
        category: "bugfix",
        createdAt: "2025-08-17T09:00:00Z",
        startedAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-19T09:00:00Z",  // Changed due date
        estimatedHours: 10,
        subtasks: ["memory profiling", "identify leak source", "fix implementation", "stress test"],
        issues: [{ _id: "leak001", title: "WebSocket connections not being cleaned up" }],
        comments: [{ author: "ops_lead", text: "Production impact critical - need fix ASAP" }],
        attachments: [],
        logs: []
    },
    {
        projectId,
        title: "Microservices: Event Sourcing Implementation",
        description: "Implement event sourcing pattern for order processing microservice.",
        assignedTo: "6821e97f0b78b01dae9527bd",
        status: "todo",
        priority: "high",
        category: "refactor",
        createdAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-21T09:00:00Z",  // Changed due date
        estimatedHours: 20,
        subtasks: ["event store design", "aggregate implementation", "projection handlers", "integration tests"],
        issues: [],
        comments: [],
        attachments: [],
        logs: []
    },

    // =================================================================
    // MAYA_QA - OVERLOADED (44+ hours in 7 days) - HIGH BOTTLENECK
    // =================================================================
    {
        projectId,
        title: "Comprehensive Security Audit & Penetration Testing",
        description: "Full security audit of authentication, authorization, and data protection.",
        assignedTo: "68221d90e2d6a83803299798",
        status: "in_progress",
        priority: "urgent",
        category: "chore",
        createdAt: "2025-08-17T09:00:00Z",
        startedAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-21T09:00:00Z",  // Changed due date
        estimatedHours: 18,
        subtasks: ["vulnerability scan", "penetration testing", "security report", "remediation plan"],
        issues: [],
        comments: [{ author: "security_lead", text: "High priority due to compliance deadline" }],
        attachments: [],
        logs: []
    },
    {
        projectId,
        title: "End-to-End Testing: Payment Gateway Integration",
        description: "Complete E2E testing for new payment gateway with multiple scenarios.",
        assignedTo: "68221d90e2d6a83803299798",
        status: "todo",
        priority: "high",
        category: "chore",
        createdAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-21T09:00:00Z",  // Changed due date
        estimatedHours: 14,
        subtasks: ["test scenarios", "payment flows", "error handling", "regression tests"],
        issues: [],
        comments: [],
        attachments: [],
        logs: []
    },
    {
        projectId,
        title: "Performance Testing: Load Testing Suite",
        description: "Setup and execute comprehensive load testing for new features.",
        assignedTo: "68221d90e2d6a83803299798",
        status: "under_review",
        priority: "medium",
        category: "chore",
        createdAt: "2025-08-17T09:00:00Z",
        startedAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-21T09:00:00Z",  // Changed due date
        estimatedHours: 12,
        subtasks: ["load test setup", "performance benchmarks", "bottleneck analysis"],
        issues: [],
        comments: [],
        attachments: [],
        logs: []
    },

    // =================================================================
    // SAM_FRONTEND - CRITICAL OVERLOAD (52+ hours in 7 days) - WORST BOTTLENECK
    // =================================================================
    {
        projectId,
        title: "Mobile App: Complete UI/UX Redesign",
        description: "Complete redesign of mobile application with new design system.",
        assignedTo: "68564c39c9b01c76fa6db939",
        status: "in_progress",
        priority: "urgent",
        category: "design",
        createdAt: "2025-08-17T09:00:00Z",
        startedAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-21T09:00:00Z",  // Changed due date
        estimatedHours: 22,
        subtasks: ["design system", "component library", "responsive layouts", "accessibility"],
        issues: [],
        comments: [{ author: "design_lead", text: "Major client demo depends on this" }],
        attachments: [],
        logs: []
    },
    {
        projectId,
        title: "React App: State Management Refactor",
        description: "Migrate from Redux to Zustand with TypeScript implementation.",
        assignedTo: "68564c39c9b01c76fa6db939",
        status: "todo",
        priority: "high",
        category: "refactor",
        createdAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-21T09:00:00Z",  // Changed due date
        estimatedHours: 18,
        subtasks: ["migration plan", "zustand stores", "typescript types", "testing"],
        issues: [],
        comments: [],
        attachments: [],
        logs: []
    },
    {
        projectId,
        title: "Critical: Cross-browser Compatibility Issues",
        description: "Fix critical layout issues across Safari, Firefox, and Edge browsers.",
        assignedTo: "68564c39c9b01c76fa6db939",
        status: "blocked",
        priority: "urgent",
        category: "bugfix",
        createdAt: "2025-08-17T09:00:00Z",
        startedAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-20T09:00:00Z", // Changed due date
        estimatedHours: 12,
        subtasks: ["browser testing", "CSS fixes", "polyfills", "validation"],
        issues: [{ _id: "browser001", title: "Safari flexbox rendering issues" }],
        comments: [{ author: "qa_lead", text: "Blocking production release" }],
        attachments: [],
        logs: []
    },

    // =================================================================
    // RAJ_DEVOPS - MODERATE LOAD (28 hours in 7 days) - MANAGEABLE
    // =================================================================
    {
        projectId,
        title: "Kubernetes Cluster: Auto-scaling Configuration",
        description: "Setup horizontal pod autoscaling for production workloads.",
        assignedTo: "682261a534dad32c4fb247d4",
        status: "in_progress",
        priority: "medium",
        category: "feature",
        createdAt: "2025-08-17T09:00:00Z",
        startedAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-21T09:00:00Z",  // Changed due date
        estimatedHours: 12,
        subtasks: ["HPA configuration", "metrics setup", "testing", "monitoring"],
        issues: [],
        comments: [],
        attachments: [],
        logs: []
    },
    {
        projectId,
        title: "CI/CD Pipeline: Deployment Optimization",
        description: "Optimize deployment pipeline to reduce build time by 50%.",
        assignedTo: "682261a534dad32c4fb247d4",
        status: "todo",
        priority: "medium",
        category: "refactor",
        createdAt: "2025-08-17T09:00:00Z",
        updatedAt: "2025-08-17T09:00:00Z",
        dueDate: "2025-08-21T09:00:00Z",  // Changed due date
        estimatedHours: 16,
        subtasks: ["pipeline analysis", "caching strategy", "parallel builds", "testing"],
        issues: [],
        comments: [],
        attachments: [],
        logs: []
    }
];


const prepareTasks = async () => {
    console.log("🔄 Preparing tasks with effort estimation...");

    return Promise.all(bottleneckTasks.map(async (task, index) => {
        const convertToDate = (d) => d ? new Date(d) : undefined;
        const convertToObjId = (v) => v ? new ObjectId(v) : undefined;

        // Use estimatedHours if provided, otherwise use AI estimation
        let effortSeconds;
        if (task.estimatedHours) {
            effortSeconds = task.estimatedHours * 3600; // Convert hours to seconds
            console.log(`📝 [${index + 1}/${bottleneckTasks.length}] ${task.title}: Using manual estimate of ${task.estimatedHours}h`);
        } else {
            effortSeconds = await estimateEffortSecondsForTask(task);
            console.log(`🤖 [${index + 1}/${bottleneckTasks.length}] ${task.title}: Using AI estimate of ${(effortSeconds/3600).toFixed(1)}h`);
        }

        return {
            ...task,
            _id: task._id ? convertToObjId(task._id) : new ObjectId(),
            projectId: convertToObjId(task.projectId),
            assignedTo: convertToObjId(task.assignedTo),
            effortSeconds: effortSeconds,
            dueDate: convertToDate(task.dueDate),
            createdAt: convertToDate(task.createdAt),
            updatedAt: convertToDate(task.updatedAt),
            startedAt: convertToDate(task.startedAt),
            completedAt: convertToDate(task.completedAt)
        };
    }));
};

const seedBottleneckTasks = async () => {
    try {
        console.log("🚀 Starting bottleneck task seeding...");

        const db = await mongoDBClient.getDatabase("main");
        const tasksCollection = db.collection("tasks");

        // Clear existing test tasks for this project (optional)
        console.log("🧹 Clearing existing test tasks...");
        await tasksCollection.deleteMany({
            projectId: new ObjectId(projectId),
            title: { $regex: /Database Migration|API Gateway|Critical:|Comprehensive Security|End-to-End Testing|Mobile App:|React App:|Kubernetes Cluster|CI\/CD Pipeline|Brand Guidelines|Icon Library|Product Requirements|User Feedback|Emergency:|Regression Testing|Urgent:/ }
        });

        const preparedTasks = await prepareTasks();

        console.log("💾 Inserting tasks into database...");
        await tasksCollection.insertMany(preparedTasks);

        console.log(`✅ Successfully inserted ${preparedTasks.length} bottleneck test tasks!`);

        // Print workload summary
        console.log("\n📊 WORKLOAD SUMMARY:");
        console.log("=" .repeat(60));

        const workloadByUser = {};
        preparedTasks.forEach(task => {
            const userId = task.assignedTo.toString();
            const userName = userProfiles[userId]?.name || userId.slice(-4);
            const hours = task.effortSeconds / 3600;

            if (!workloadByUser[userName]) {
                workloadByUser[userName] = {
                    tasks: 0,
                    hours: 0,
                    stress: userProfiles[userId]?.stress || "UNKNOWN"
                };
            }
            workloadByUser[userName].tasks++;
            workloadByUser[userName].hours += hours;
        });

        Object.entries(workloadByUser)
            .sort((a, b) => b[1].hours - a[1].hours)
            .forEach(([userName, data]) => {
                const indicator = data.stress === "CRITICAL" ? "🔥" :
                    data.stress === "HIGH" ? "🚨" :
                        data.stress === "MEDIUM" ? "⚠️" : "✅";
                console.log(`${indicator} ${userName}: ${data.tasks} tasks, ${data.hours.toFixed(1)}h (${data.stress})`);
            });

        console.log("=" .repeat(60));
        console.log("🎯 DriftIQ should detect bottlenecks for Alex_Backend, Maya_QA, and Sam_Frontend!");
        console.log("📈 Run your DriftIQ analysis to see the workload visualization.");

    } catch (error) {
        console.error("❌ Error seeding bottleneck tasks:", error);
        throw error;
    }
};

// Execute the seeding
seedBottleneckTasks()
    .then(() => {
        console.log("🎉 Bottleneck task seeding completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Seeding failed:", error);
        process.exit(1);
    });
