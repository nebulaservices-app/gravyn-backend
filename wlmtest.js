// advanced-wlc-evaluator.js

import fs from "fs";

// Configurable Work Hours
const WORK_HOURS = { start: 8, end: 20 }; // 8 AM to 8 PM

// --- Formatting Utilities ---
export function formatFullDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}
export function formatTime12Hour(timestamp) {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}
export function formatDateTime(timestamp) {
    return `${formatFullDate(timestamp)} @ ${formatTime12Hour(timestamp)}`;
}

function isNightHour(date) {
    const hour = date.getHours();
    return hour < WORK_HOURS.start || hour >= WORK_HOURS.end;
}

function getTimeWarning(prepStart, idealStart) {
    const issues = [];
    if (isNightHour(prepStart)) issues.push("PrepStart in Night Hours");
    if (isNightHour(idealStart)) issues.push("IdealStart in Night Hours");
    return issues.length ? `🌙 ${issues.join(" & ")}` : "✅ Within Work Hours";
}

function adjustToWorkHours(date) {
    const adjusted = new Date(date);
    const hour = date.getHours();
    if (hour < WORK_HOURS.start) {
        adjusted.setHours(WORK_HOURS.start, 0, 0, 0);
    } else if (hour >= WORK_HOURS.end) {
        adjusted.setHours(WORK_HOURS.end - 1, 59, 0, 0);
    }
    return adjusted;
}

function getBaseLoad(rt, tReq, now, dueTime) {
    const x = rt / tReq;
    const cappedX = Math.min(x, 1);
    const part1 = 0.723 * Math.pow(1 - cappedX, 3);
    const part2 = 1.284 / (1 + Math.exp(5 * (x - 1.05)));
    const baseLoad = part1 + part2;

    const idealStart = new Date(dueTime.getTime() - tReq * 1000);
    const prepStart = new Date(dueTime.getTime() - 1.65 * tReq * 1000);
    const inPrepWindow = now >= prepStart && now < idealStart;

    return {
        baseLoad: inPrepWindow ? Math.max(baseLoad, 0.5) : baseLoad,
        inPrepWindow,
        prepStart,
        idealStart
    };
}

function getUM(rt, tReq) {
    const x = rt / tReq;
    return 0.5 + 1 / (1 + Math.exp(-1.25 * (1 - x)))
}

function getHeatLevel(wlc) {
    const w = parseFloat(wlc);
    if (w > 1.1) return "🔴 Critical";
    if (w > 0.95) return "🔶 High";
    if (w > 0.7) return "🟡 Moderate";
    return "🟢 Normal";
}

function getDeadlineRisk(rt, tReq) {
    const x = rt / tReq;
    if (x < 0.3) return '🔴 Critical Risk';
    if (x < 0.8) return '🔶 High Risk';
    if (x < 1.0) return '❌ At Risk';
    return '✅ On Track';
}


function dynamicInProgressMultiplier(rt, tReq, base = 0.9, min = 0.5) {
    // Ratio is 1 when plenty of time left, 0 when out of time
    const ratio = Math.max(0, Math.min(1, rt / tReq));
    // Smooth transition from base to min as ratio drops to 0
    return min + (base - min) * ratio;
}


/**
 * Original core WLC function - applies to one user+tasks at 1 point in time
 */
export function evaluateWLCNow(tasks, efficiency = 1.0, now = new Date()) {
    // status/priority mappings as per above
    const statusMultipliers = {


        "Pending": 1.05,
        "In Progress": 0.9,
        "Backlog": 1.15,
        "Blocked": 1.6
    };
    const priorityMultipliers = {
        "Critical": 1.6,
        "High": 1.2,
        "Medium": 1.0,
        "Low": 0.9
    };

    const results = [];
    let totalWLC = 0;
    let prepOverlapCount = 0;
    let totalEffortInPrep = 0;

    const soonestDueTime = new Date(Math.min(...tasks.map(t => new Date(t.dueTime).getTime())));
    const latestDueTime = new Date(Math.max(...tasks.map(t => new Date(t.dueTime).getTime())));

    tasks.forEach(task => {
        const due = new Date(task.dueTime);
        const secondsRemaining = (due.getTime() - now.getTime()) / 1000;
        const rt = Math.max(secondsRemaining, 1);
        const isOverdue = secondsRemaining < 0;
        const tEffort = task.effortSeconds;
        const tReq = tEffort / efficiency;

        const { baseLoad, inPrepWindow, prepStart, idealStart } = getBaseLoad(rt, tReq, now, due);
        const um = getUM(rt, tReq);
        let sm = 0;
        if (task.status === "In Progress") {
            sm = dynamicInProgressMultiplier(rt, tReq, 0.9, 0.5);
        } else {
            sm = statusMultipliers[task.status] || 1.0;
        }
        const pm = priorityMultipliers[task.priority] || 1.0;
        const wlc = baseLoad * um * sm * pm;

        if (inPrepWindow) {
            prepOverlapCount++;
            totalEffortInPrep += tEffort;
        }

        const result = {
            Task: task.name,
            DueTime: formatDateTime(due),
            PrepStart: formatDateTime(prepStart),
            IdealStart: formatDateTime(idealStart),
            InPrepWindow: inPrepWindow,
            OverdueBy_Hours: isOverdue ? Math.abs(secondsRemaining / 3600).toFixed(2) : "0.00",
            HeatLevel: getHeatLevel(wlc),
            DeadlineRisk: getDeadlineRisk(rt, tReq),
            TimeWarning: getTimeWarning(prepStart, idealStart),
            SuggestedPrepStart: formatDateTime(adjustToWorkHours(prepStart)),
            SuggestedIdealStart: formatDateTime(adjustToWorkHours(idealStart)),
            RT_in_Hours: (rt / 3600).toFixed(2),
            T_req_in_Hours: (tReq / 3600).toFixed(2),
            BaseLoad: baseLoad.toFixed(6),
            UM: um.toFixed(6),
            SM: sm,
            PM: pm,
            WLC: wlc.toFixed(6)
        };

        totalWLC += wlc;
        results.push(result);
    });

    // Uncomment if you want to dump to file
    // fs.writeFileSync('wlm_report.json', JSON.stringify(results, null, 2));
    return results;
}


// --- NEW: Per-user wrapper ---
export function evaluateUserWLC(user, now = new Date()) {
    const { name, efficiency = 1.0, tasks = [] } = user;
    if (!tasks.length) {
        return {
            name,
            avgWLC: 0,
            heatLevel: "No tasks",
            prepCount: 0,
            totalWLC: 0, // <-- Key addition!
            totalTasks: 0,
            taskMetrics: []
        };
    }
    const taskMetrics = evaluateWLCNow(tasks, efficiency, now);
    const totalWLC = taskMetrics.reduce((s, t) => s + parseFloat(t.WLC), 0);
    const avgWLC = taskMetrics.length ? totalWLC / taskMetrics.length : 0;
    const prepCount = taskMetrics.filter(t => t.InPrepWindow).length;
    const heatLevel = getHeatLevel(avgWLC);

    return {
        name,
        totalWLC,
        avgWLC: +avgWLC.toFixed(2),
        heatLevel,
        prepCount,
        totalTasks: tasks.length,
        taskMetrics
    };
}

// --- NEW: Team aggregate ---
export function evaluateTeamWorkload(team, now = new Date()) {
    const teamMetrics = team.map(user => evaluateUserWLC(user, now));
    const avgTeamWLC = teamMetrics.length
        ? +(teamMetrics.reduce((s, u) => s + u.avgWLC, 0) / teamMetrics.length).toFixed(2)
        : 0;
    return {
        teamMetrics,
        avgTeamWLC,
        generatedAt: now.toISOString()
    };
}

// --- NEW: Workload Suggestions ---
export function generateWorkloadSuggestions(teamMetrics) {
    const overloadUsers = teamMetrics.filter(u => u.avgWLC > 1.0);
    const underloadUsers = teamMetrics.filter(u => u.avgWLC > 0 && u.avgWLC < 0.7);

    const suggestions = [];

    if (overloadUsers.length) {
        suggestions.push(
            `⚠️ Overloaded: ${overloadUsers.map(u => u.name).join(", ")}. Consider rebalancing tasks.`
        );
    }
    if (underloadUsers.length) {
        suggestions.push(
            `✅ Spare capacity: ${underloadUsers.map(u => u.name).join(", ")}. Can take on more work.`
        );
    }
    if (!overloadUsers.length && !underloadUsers.length) {
        suggestions.push("👍 Team workload balanced.");
    }

    return suggestions;
}


// --------------- DEMO: Test with Example Data ---------------

// Simulated team data
const demoTeam = [
    // Heavy overload, overdue and critical
    {
        name: "Priyansh",
        efficiency: 1.0,
        tasks: [
            { name: "Migrate Database", dueTime: "2025-07-01T19:00:00Z", effortSeconds: 4 * 3600, status: "Blocked", priority: "Critical" }, // Overdue and blocked
            { name: "Draft API Docs", dueTime: "2025-07-01T12:00:00Z", effortSeconds: 2 * 3600, status: "Pending", priority: "High" }, // Close to deadline
            { name: "Backend Refactor", dueTime: "2025-07-01T23:00:00Z", effortSeconds: 6 * 3600, status: "In Progress", priority: "Medium" } // Later today
        ]
    },
    // Some in prep window, some later, mixed risk
    {
        name: "Shreya",
        efficiency: 0.75,
        tasks: [
            { name: "QA Regression", dueTime: "2025-07-01T14:00:00Z", effortSeconds: 4 * 3600, status: "In Progress", priority: "Critical" }, // Due in a few hours, critical
            { name: "Client Meeting Slides", dueTime: "2025-07-02T10:00:00Z", effortSeconds: 2 * 3600, status: "Pending", priority: "Low" }, // Due tomorrow, easy
        ]
    },
    // Low urgency, idle soon
    {
        name: "Anjali",
        efficiency: 1.2,
        tasks: [
            { name: "Design Logo", dueTime: "2025-07-02T20:00:00Z", effortSeconds: 1 * 3600, status: "Backlog", priority: "Medium" } // Plenty of time
        ]
    },
    // Idle user
    {
        name: "Ravi",
        efficiency: 1.0,
        tasks: []
    }
];


const now = new Date("2025-07-01T11:45:00Z")

console.log("=== WLC SNAPSHOT ===");
const teamReport = evaluateTeamWorkload(demoTeam, now);

console.log(JSON.stringify(teamReport, null, 2));
console.log("\n--- AI Suggestions ---");
console.log(generateWorkloadSuggestions(teamReport.teamMetrics));

// Print per-user, task-level details
teamReport.teamMetrics.forEach(user => {
    console.log(`\n>> ${user.name} | Total WLC: ${user.totalWLC.toFixed(2)} (Heat: ${user.heatLevel})`);
    user.taskMetrics.forEach(t => {
        // Calculate remaining time nicely
        const nowObj = now;
        const dueObj = new Date(t.DueTime);
        let secondsRemaining = Math.floor((dueObj.getTime() - nowObj.getTime()) / 1000);

        let remDisplay;
        if (secondsRemaining < 0) remDisplay = `OVERDUE by ${Math.abs(secondsRemaining/3600).toFixed(2)} hrs`;
        else {
            const hrs = Math.floor(secondsRemaining / 3600);
            const min = Math.floor((secondsRemaining % 3600) / 60)
            const sec = secondsRemaining % 60;
            remDisplay = `${hrs}h ${min}m ${sec}s left`;
        }

        // Show required effort
        const effortHr = parseFloat(t.T_req_in_Hours || 0).toFixed(2);

        // Print output
        console.log(
            `   - [${t.HeatLevel}] ${t.Task} (Due: ${t.DueTime}, Risk: ${t.DeadlineRisk})\n` +
            `         Time Left: ${remDisplay}\n` +
            `         Effort Required: ${effortHr} hrs`
        );
    });
});
