// project-update-ai.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const GOOGLE_SERVICE_GEMINI_API = process.env.GEMINI_API;

/* ---------- GeminiBaseAgent ---------- */
export class GeminiBaseAgent {
    constructor(systemPrompt) {
        this.systemPrompt = systemPrompt;
        this.model = new GoogleGenerativeAI(GOOGLE_SERVICE_GEMINI_API).getGenerativeModel({
            model: "gemini-2.5-flash" // Or "gemini-1.5-pro" if you want higher quality/pricing
        });

        this.totalTokens = 0;
    }

    async sendPrompt({ prompt }) {
        const fullPrompt = `${this.systemPrompt}\n\n${prompt}`;
        const result = await this.model.generateContent(fullPrompt);
        const response = result.response;

        const usage = result.usageMetadata || response.usageMetadata;
        if (usage?.totalTokenCount || usage?.totalTokens) {
            this.totalTokens += usage.totalTokenCount || usage.totalTokens;
        }

        return response.text();
    }

    async ask(userPrompt) {
        const fullPrompt = `${this.systemPrompt}\n\n${userPrompt}`;

        const result = await this.model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: fullPrompt }]
                }
            ]
        });

        const response = result.response;

        const usage = result.usageMetadata || response.usageMetadata;
        if (usage?.totalTokenCount || usage?.totalTokens) {
            this.totalTokens += usage.totalTokenCount || usage.totalTokens;
        }

        return response.text();
    }

    getTotalTokensUsed() {
        return this.totalTokens;
    }

    getEstimatedCost(currency = "INR") {
        const costPerThousand = 0.008; // ₹ per 1000 tokens (example, Gemini Flash)
        return (this.totalTokens / 1000 * costPerThousand).toFixed(4);
    }
}

/* ---------- 1. System Prompts ---------- */

// Project update system prompt
const PROJECT_UPDATE_SYS_PROMPT = `
You are ProjectUpdateAI, an expert project status analyst and daily progress reporter for software teams.

Your task:
Given all key project events, deployment notes, tasks, blockers, issues, and team statistics for a reporting period, generate a daily project update as structured JSON with these fields:

1. "sections": An array of section objects. Each object MUST have:
   - type: one of "Progress", "Milestone", "Task", "Ongoing", "Blocker", "IssueReview", "Timeline", or "Performance".
   - title: a concise heading for the section (text only, not for markup).
   - summary: a fragment of semantic HTML (not JSX!) using only these elements:
     - <div>, <h3>, <p>, <ul>, <li>, <strong>
     - The summary must be written in a cohesive, narrative paragraph style. Strongly prefer paragraphs over lists; only use <ul> and <li> if information cannot be clearly conveyed in a paragraph.
     - Do NOT use emojis, colored icons, symbols, or text stand-ins (e.g., !, [!], ⭕, etc.).
     - Do NOT use classes, id, inline styles, or any other HTML attributes.
     - Only use semantic HTML for structure and emphasis, NOT for design.
     - Aim for clear, professional English suitable for both technical and non-technical stakeholders.

2. "aisuggestion": This must be a single HTML string. Each suggestion should be in its own <p> tag, all wrapped in a single <div>. For example:
      <div>
        <p>First suggestion text.</p>
        <p>Second suggestion text.</p>
      </div>
   (If there are no suggestions, use an empty string: "".)

Formatting and Content Rules:
- Write in clear, descriptive paragraphs. Avoid short, choppy sentences or bullet-point lists unless a list is the only clear way to present the information.
- Summarize team contributions collectively. Instead of listing "User A did X, User B did Y," combine accomplishments into a cohesive narrative, such as "The team advanced the project by completing the UI redesign and automating the analytics report." Mention specific user names only when essential for context.
- Never use emojis, colors, icon unicode, class, id, style, or presentation logic.
- Only use plain, professional English and allowed semantic HTML tags.
- Never invent facts; use only provided data.
- Output must be valid, parseable JSON as described above, with string HTML fragments in "summary" and "aisuggestion".

Example output:
{
  "sections": [
    {
      "type": "Progress",
      "title": "Overall Progress",
      "summary": "<div><h3>Overall Progress</h3><div><p>The project is 76% complete. Major achievements this period include the successful deployment of Slack notifications and version 1.4, which collectively resolved several outstanding performance issues.</p></div></div>"
    },
    {
      "type": "Task",
      "title": "Recent Accomplishments",
      "summary": "<div><h3>Recent Accomplishments</h3><div><p>Significant progress was made on key tasks this period. The team successfully completed the onboarding UI redesign, which is now ready for stakeholder review. Additionally, the weekly analytics report has been fully automated, freeing up significant manual effort for the data team.</p></div></div>"
    }
  ],
  "aisuggestion": "<div><p>The Stripe API integration issue should be assigned to the backend team for immediate resolution.</p><p>A review of all open issues is recommended before the release candidate deployment window.</p></div>"
}

Respond ONLY with valid JSON in this exact structure, using ONLY the plain semantic HTML tags specified above, and never including any class, id, style, emoji, icon, or non-textual indicator.
`;

// Task summary system prompt
const TASK_SUMMARIZER_SYS_PROMPT = `
You are TaskSummarizerAI for a project management dashboard. 
You receive a task object with fields:
- title, description, status, owner, dueDate, startedAt, effortSeconds
- wlc: {
  DueTime (deadline), PrepStart (when prep should begin), IdealStart (ideal start to finish on time),
  InPrepWindow (should be working now), OverdueBy_Hours (lateness), HeatLevel (urgency), DeadlineRisk,
  TimeWarning (out-of-hours?), WLC (>1=overloaded), RT_in_Hours (remaining), T_req_in_Hours (needed)
}
- subtasks, issues, comments

Your job:
- Write a **comprehensive but concise summary** of the task for a manager/tech lead: typically 3–5 sentences, more if needed for clarity.
- Analyze and **infer relevant details**: mention if the task is late, at risk, overloaded (using WLC, HeatLevel, DeadlineRisk), if work started late, or may require out-of-hours effort.
- If startedAt is after IdealStart or PrepStart, note delay.
- Summarize all major blockers/issues and relevant comments/feedback.
- Report on progress, urgency, risks, blockers, and effort.
- **Never invent or hallucinate information:** only summarize or infer from the supplied fields. 
- Prefer clear, professional, executive-reporting language.
- **Do NOT output JSON.**

Example input:
{
  "title": "...",
  "status": "...",
  "owner": "...",
  "dueDate": "...",
  "startedAt": "...",
  "wlc": { ... },
  "issues": [...],
  "comments": [...]
}

Example output:
"UI: Add Ticket Source Filter (high priority, due July 22) for Shravani is in progress. Current workload is critical (WLC 2.55), and there is a high risk of missing the deadline. Prep and ideal start occurred during night hours, and the task should be underway now. No blockers reported. Progress is on track, but requires urgent focus to avoid delay."

---

`;

/* ---------- 2. Singleton Agents ---------- */
const ProjectUpdateAI = new GeminiBaseAgent(PROJECT_UPDATE_SYS_PROMPT);
const TaskSummarizerAI = new GeminiBaseAgent(TASK_SUMMARIZER_SYS_PROMPT);

/* ---------- 3. Task Summarization Utility ---------- */

/**
 * Summarizes a single project task for a report.
 * @param {Object} task
 * @param {string} owner - The assignee/owner name (optional)
 * @returns {Promise<string>} - Short summary bullet.
 */
export async function summarizeTaskForUpdate(task, owner = "") {
    // Extract key fields only
    const pruned = {
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        priority: task.priority,
        wlc: task.wlc || task.wlcMetric,
        owner: owner || task.owner
    };
    const prompt = `Task:
${JSON.stringify(pruned, null, 2)}
`;

    const resp = await TaskSummarizerAI.ask(prompt);
    return (resp || "").replace(/^- /, "").trim();
}

/* ---------- 4. Generate All Task Summaries ---------- */

/**
 * Summarizes all tasks for all users (async/parallel for scale).
 * @param {Array} usersWithTasks - [{name, tasks:[{task data...}, ...]}, ...]
 * @returns {Promise<string[]>}
 */
export async function summarizeAllTasks(usersWithTasks) {
    const summaries = [];
    for (const user of usersWithTasks) {
        for (const task of user.tasks) {
            summaries.push(
                summarizeTaskForUpdate(task, user.name)
            );
        }
    }
    return Promise.all(summaries);
}

/* ---------- 5. Project Update AI (Using Task Summaries) ---------- */

/**
 * @param {string} params.projectDescription
 * @param {string} params.previousUpdate
 * @param {Array<string>} params.taskSummaries - Array of one-line per-task summaries.
 * @param {Array} params.issues - [{title, ...}]
 * @param {Array} params.clientFeedback - [...]
 * @param {Array} params.userWLCs - [{userId, name, heatLevel, wlc, ...}]
 * @returns {Promise<Object>} - {content, aisuggestion}
 * @param projectSummary
 */
export async function generateProjectUpdateFromSummaries(projectSummary) {



    // Give context/explanation in the user prompt
    const prompt = `
Project Report Data:
Generate a daily project update summary as structured JSON (with "sections" and "aisuggestion").
PROJECT DATA : ${projectSummary}
  `;

    const resp = await ProjectUpdateAI.ask(prompt);
    try {
        const firstBrace = resp.indexOf('{');
        const lastBrace = resp.lastIndexOf('}');
        const jsonString = resp.slice(firstBrace, lastBrace + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        return { error: "Could not parse AI output as JSON.", raw: resp };
    }
}

/* ---------- 6. Batch Orchestration Example Usage ---------- */

export async function projectUpdateMain({
                                            projectDescription,
                                            previousUpdate,
                                            usersWithTasks,
                                            issues,
                                            clientFeedback,
                                            userWLCs
                                        }) {
    // Step 1: Summarize all tasks
    const taskSummaries = await summarizeAllTasks(usersWithTasks);
    // Step 2: Get project update using only summaries and other signals
    return generateProjectUpdateFromSummaries({
        projectDescription,
        previousUpdate,
        taskSummaries,
        issues,
        clientFeedback,
        userWLCs
    });
}

/* ---------- 7. Demo CLI ---------- */
if (import.meta && import.meta.url && process.argv[1] === new URL(import.meta.url).pathname) {
    // EXAMPLE DATA -- replace with live data in prod
    const usersWithTasks = [
        {
            name: "Shravani dasari",
            tasks: [
                {
                    title: "UI: Add Ticket Source Filter",
                    status: "in_progress",
                    dueDate: "2025-07-22T15:00:00.000Z",
                    priority: "high",
                    wlc: { HeatLevel: "🔴 Critical", DeadlineRisk: "🔴 Critical Risk", WLC: "2.55" }
                }
            ]
        },
        // ... more users/tasks
    ];
    (async () => {
        const summaries = await summarizeAllTasks(usersWithTasks);
        console.log("Per-task summaries:", summaries);

        // Fake project update generation
        const update = await generateProjectUpdateFromSummaries({
            projectDescription: "A demo SaaS dashboard for automated support teams.",
            previousUpdate: "Yesterday: Version 1.3 released, QA in progress.",
            taskSummaries: summaries,
            issues: [{ title: "Checkout API bug" }],
            clientFeedback: ["Found UI accessibility issues."],
            userWLCs: [{ userId: "68221d90...", name: "Shravani dasari", heatLevel: "🔴 Critical", wlc: 2.55 }]
        });
        console.log(JSON.stringify(update, null, 2));
    })();
}

export {
    TaskSummarizerAI,
    ProjectUpdateAI
};
