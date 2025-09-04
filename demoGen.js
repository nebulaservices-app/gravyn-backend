// import mongoDBClient from "./utils/MongoClient.js";
// import { ObjectId } from "mongodb";
// import { randomUUID } from "crypto";
//
// const sampleTitles = [
//     "Frontend: Redesign navigation bar to support responsive layout",
//     "Backend: Add JWT-based authentication middleware",
//     "UI: Create interactive login screen with validation",
//     "Content: Rewrite pricing page copy based on marketing brief",
//     "Data Model: Refactor task schema to support nested subtasks",
//     "Backend: Implement daily reminder email queue system",
//     "Bugfix: Resolve production crash in payment controller",
//     "DevOps: Add structured logging middleware to track API calls",
//     "Docs: Update README with setup instructions for new devs",
//     "CI/CD: Set up GitHub Actions for test + build pipeline",
//     "QA: Write unit tests for user registration module",
//     "Research: Analyze user feedback from survey data",
// ];
//
// const sampleDescriptions = [
//     "This task involves updating the navigation component to adapt seamlessly across screen sizes. Collaborate with the design team for new Figma specs and ensure compatibility with the legacy codebase.",
//     "Integrate JWT for securing API endpoints. Tokens should expire after 24 hours. Sync with the mobile team to ensure token flow aligns with their login strategy.",
//     "The login screen must include real-time form validation and error messaging. UX must be intuitive on both desktop and mobile. Refer to Jira ticket #1045 for edge cases.",
//     "We need to align pricing page content with the updated service tiers provided by the marketing team. All changes should be A/B tested using Google Optimize.",
//     "The current task model is too flat. Introduce support for recursive subtasks and adjust existing APIs. Migration script must be backward compatible.",
//     "Users should receive daily email reminders at 8 AM if they have pending high-priority tasks. Use cron jobs and nodemailer with HTML templates.",
//     "The payment controller intermittently crashes under load. Investigate logs from production and reproduce using load tests. Likely related to third-party gateway.",
//     "Middleware should log request paths, response codes, and latency. Avoid logging PII. Implement in both Express and Lambda functions.",
//     "Improve onboarding for new developers by adding clearer setup steps in the README, including environment variable explanations and test suite instructions.",
//     "CI/CD pipeline should lint, run unit tests, and build before merging to main. Add Slack notifications on failure and code coverage badge.",
//     "Focus on test coverage for edge cases around invalid input and rate-limiting. Mock third-party APIs during testing to avoid real calls.",
//     "Summarize key trends from user feedback collected via Typeform. Create a Notion doc highlighting major pain points and opportunities for v2 roadmap.",
// ];
//
// const priorities = ["low", "medium", "high", "emergency"];
// const statuses = ["pending", "progress", "completed", "blocked"];
// const departments = ["Frontend", "Backend", "DevOps", "QA", "Product"];
//
// const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
// const getRandomHour = () => Math.floor(Math.random() * 8 + 9); // 9 AM–5 PM
// const getRandomMinute = () => Math.floor(Math.random() * 60);
// const getRandomSubtasks = () => {
//     const count = Math.floor(Math.random() * 3 + 1); // 1–3 subtasks
//     return Array.from({ length: count }, (_, i) => ({
//         id: randomUUID(),
//         name: `Subtask ${i + 1}`,
//         status: getRandomElement(statuses),
//     }));
// };
//
// const getDynamicTitle = () =>
//     `${getRandomElement(departments)}: ${getRandomElement(["Urgent", "Refactor", "Improvement", "New Feature", "Bugfix"])} - ${getRandomElement(sampleTitles)}`;
//
// const seedWeeklyRealisticTasks = async (projectId) => {
//     if (!projectId) {
//         console.error("❌ Please provide a valid projectId.");
//         process.exit(1);
//     }
//
//     const db = await mongoDBClient.getDatabase("main");
//     const collection = db.collection("tasks");
//
//     const today = new Date();
//     today.setUTCHours(0, 0, 0, 0);
//
//     const dayOfWeek = today.getUTCDay(); // 0 = Sunday
//     const sunday = new Date(today);
//     sunday.setUTCDate(today.getUTCDate() - dayOfWeek);
//
//     const tasks = [];
//
//     for (let i = 0; i < 7; i++) {
//         const date = new Date(sunday);
//         date.setUTCDate(sunday.getUTCDate() + i);
//
//         const isWeekend = i === 0 || i === 6;
//         const taskCount = isWeekend
//             ? Math.floor(Math.random() * 3 + 1)
//             : Math.floor(Math.random() * 6 + 5);
//
//         for (let j = 0; j < taskCount; j++) {
//             const createdAt = new Date(date);
//             createdAt.setUTCHours(getRandomHour(), getRandomMinute(), 0, 0);
//
//             const task = {
//                 title: getDynamicTitle(),
//                 description: getRandomElement(sampleDescriptions),
//                 dueDate: new Date(createdAt.getTime() + Math.floor(Math.random() * 5 + 1) * 86400000).toISOString(),
//                 priority: getRandomElement(priorities),
//                 status: getRandomElement(statuses),
//                 projectId: new ObjectId(projectId),
//                 assignedTo: null, // You can update this to assign to a specific user based on your logic
//
//                 attachments: [],
//                 comments: [],
//                 issues: [],
//                 subtasks: getRandomSubtasks(),
//
//                 createdAt,
//                 updatedAt: createdAt,
//                 logs: [],
//             };
//
//             tasks.push(task);
//         }
//     }
//
//     const result = await collection.insertMany(tasks);
//     console.log(`✅ Inserted ${result.insertedCount} tasks.`);
// };
//
// seedWeeklyRealisticTasks("68159219cdb8524689046498");
//
// export default seedWeeklyRealisticTasks;