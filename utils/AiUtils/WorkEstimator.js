// ai-utils.js
import { GeminiBaseAgent } from "../../cei/utils/GeminiBaseAgent.js";

const SYS_PROMPT = `
You are Nebula AI, a highly accurate project effort estimator. 
Estimate in SECONDS how long an average software developer or data engineer would take to complete a task.
Factor in:
- Task complexity
- Amount of data (if mentioned)
- Priority (e.g., urgent → include daily interruptions)
- Hidden effort like testing, debugging, and rollback

Always include a realistic buffer. Output only a positive integer in seconds.`;




const GeminiAI = new GeminiBaseAgent(SYS_PROMPT);

// Utility method: estimate effortSeconds for a single task object
export async function estimateEffortSecondsForTask(task) {
    const parts = [
        'Project for which this task is made Description : Tracy.ai is a smart automation platform designed to streamline customer support using the power of artificial intelligence. This demo project — Time Tracker Dashboard UI — showcases how Tracy.ai helps support teams monitor agent activity, track issue resolution times, and gain insights through a visually optimized dashboard. The UI is built to reflect Tracy.ai’s core capabilities: intelligently resolving customer queries, proactively suggesting solutions, and optimizing support workflows by learning from past interactions. The dashboard provides a clean, real-time interface to measure support performance metrics, agent availability, task durations, and overall support health — making it an essential component for businesses seeking to automate and elevate their customer experience '
    ];

    console.log("Task" , JSON.stringify(task))

    const prompt = `Estimate effort required for the following task (output integer seconds only):\n\n ${JSON.stringify(task)}
            'Project for which this task is made Description : Tracy.ai is a smart automation platform designed to streamline customer support using the power of artificial intelligence. This demo project — Time Tracker Dashboard UI — showcases how Tracy.ai helps support teams monitor agent activity, track issue resolution times, and gain insights through a visually optimized dashboard. The UI is built to reflect Tracy.ai’s core capabilities: intelligently resolving customer queries, proactively suggesting solutions, and optimizing support workflows by learning from past interactions. The dashboard provides a clean, real-time interface to measure support performance metrics, agent availability, task durations, and overall support health — making it an essential component for businesses seeking to automate and elevate their customer experience '

    `;



    const resp = await GeminiAI.ask(prompt);
    // Parse and sanitize
    const seconds = parseInt((resp + "").replace(/[^\d]/g, ""), 10);
    // Failsafe: fall back to 3600 if not parseable
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 3600;
}

// Utility: Estimate for ALL TASKS in a list, with effortSeconds injected
export async function estimateEffortForTaskList(tasks) {
    return await Promise.all(
        tasks.map(async task => ({
            ...task,
            effortSeconds: task.effortSeconds && task.effortSeconds > 0
                ? await estimateEffortSecondsForTask(task)
                : await estimateEffortSecondsForTask(task)
        }))
    );
}

// Utility: expose raw Gemini agent for any custom prompt
export { GeminiAI };

// Example: Add more utils (e.g., generate summary, augments, prioritization)
export async function generateTaskSummary(task) {
    const prompt = `Summarize the following task for a daily project update in 1 or 2 concise lines:\n\nTitle: ${task.title}\nDescription: ${task.description}\nPriority: ${task.priority}\nCategory: ${task.category}`;
    return await GeminiAI.ask(prompt);
}

const task = 'name: Implement task duration timer\n' +
    'description: Add a timer component that tracks how long an agent is working on each support ticket.'

console.log(
    "Time exposed for this task:",
    await estimateEffortSecondsForTask( `${task}`)
);
