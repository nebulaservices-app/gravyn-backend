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
    // Clamp to avoid division by zero/negative (1 second minimum)
    const safeRt = Math.max(rt, 1);
    let baseLoad = tReq / safeRt;

    // Optional: cap to a reasonable "panic" threshold for visualization
    baseLoad = Math.min(baseLoad, 2.0); // Or whatever makes graphing useful

    // Optional: Prep window boost (if you want to flag tasks ramping up)
    const idealStart = new Date(dueTime.getTime() - tReq * 1000);
    const prepStart = new Date(dueTime.getTime() - 1.65 * tReq * 1000);
    const inPrepWindow = now >= prepStart && now < idealStart;
    if (inPrepWindow) baseLoad = Math.max(baseLoad, 0.5);

    return {
        baseLoad,
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

const statusMultipliers = {
    "pending": 1.05,
    "in progress": 0.9,
    "backlog": 1.15,
    "blocked": 1.6
};

const priorityMultipliers = {
    "urgent": 1.6,
    "high": 1.2,
    "medium": 1.0,
    "low": 0.9
};

/**
 * Original core WLC function - applies to one user+tasks at 1 point in time
 */
export function evaluateWLCNow(tasks, efficiency = 1.0, now = new Date()) {


    const results = [];
    let totalWLC = 0;
    let prepOverlapCount = 0;
    let totalEffortInPrep = 0;

    const soonestDueTime = new Date(Math.min(...tasks.map(t => new Date(t.dueDate).getTime())));
    const latestDueTime = new Date(Math.max(...tasks.map(t => new Date(t.dueDate).getTime())));

    for (const task of tasks) {
        // Normalize dueTime to a Date object
        const due = new Date(task.dueDate); // Ensure it's a Date



        const secondsRemaining = (due.getTime() - now.getTime()) / 1000;

        // NEW: If now > due (overdue), set wlc to 0 and skip further calculation
        if (now > due) {
            const result = {
                Task: task.name || task.title, // Fallback for name
                WLC: "0.000000", // Explicit 0
                // ... other fields as needed, e.g., OverdueBy_Hours
                OverdueBy_Hours: Math.abs(secondsRemaining / 3600).toFixed(2),
                Note: "Overdue - WLC set to 0"
            };
            results.push(result);
            continue; // Skip to next task
        }

        const rt = Math.max(secondsRemaining, 1);
        const isOverdue = secondsRemaining < 0; // This will be false now, due to the check above

        const tEffort = task.effortSeconds;
        const tReq = tEffort / efficiency;

        const { baseLoad, inPrepWindow, prepStart, idealStart } = getBaseLoad(rt, tReq, now, due);
        const um = getUM(rt, tReq);

        const sm = task.status === "In Progress"
            ? dynamicInProgressMultiplier(rt, tReq, 0.9, 0.5)
            : statusMultipliers[task.status] || 1.0;

        const pm = priorityMultipliers[task.priority] || 1.0;

        const wlc = baseLoad * um * sm * pm;

        if (inPrepWindow) {
            prepOverlapCount++;
            totalEffortInPrep += tEffort;
        }

        const result = {
            Task: task.name || task.title, // Fallback for name
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
    }

    return results;
}











 /**
 * Calculates the instantaneous WLC score for a SINGLE task at a specific point in time.
 * Enhanced version that incorporates the comprehensive logic from evaluateWLCNow
 * while maintaining linear decay functionality for overdue tasks.
 *
 * @param {Object} task - The single task object to evaluate.
 * @param {number} efficiency - The user's efficiency factor.
 * @param {Date} now - The specific date and time for the calculation.
 * @param {Date} windowEnd - The end of the analysis window for linear decay calculation.
 * @returns {number} The calculated WLC score as a floating-point number.
 */
 export function evaluateSingleTaskWLC(task, efficiency = 1.0, now = new Date(), windowEnd = null) {
     // Normalize both due date and current time to avoid time-of-day issues
     const due = new Date(task.dueDate);
     due.setHours(0, 0, 0, 0); // Normalize to start of due date

     const currentDay = new Date(now);
     currentDay.setHours(0, 0, 0, 0); // Normalize current time to start of day

     const secondsRemaining = (due.getTime() - now.getTime()) / 1000;

     const tEffort = task.effortSeconds;
     const tReq = tEffort / efficiency;

     // Check if task is overdue (comparing normalized dates)
     const isOverdue = currentDay.getTime() > due.getTime();

     if (isOverdue) {
         // POST-DUE DATE: Apply Linear Decay Model

         if (!windowEnd) {
             return 0;
         }

         // Calculate the peak WLC (what it was on the due date)
         const rtAtDue = Math.max(1, 1);
         const { baseLoad: peakBaseLoad } = getBaseLoad(rtAtDue, tReq, due, due);
         const umAtDue = getUM(rtAtDue, tReq);

         const sm = task.status === "In Progress"
             ? dynamicInProgressMultiplier(rtAtDue, tReq, 0.9, 0.5)
             : statusMultipliers[task.status] || 1.0;

         const pm = priorityMultipliers[task.priority] || 1.0;
         const peakWLC = peakBaseLoad * umAtDue * sm * pm;

         // Normalize windowEnd to start of day
         const windowEndNormalized = new Date(windowEnd);
         windowEndNormalized.setHours(0, 0, 0, 0);

         // Adjust window end to be 1 day earlier for decay calculation
         const oneDayMs = 24 * 60 * 60 * 1000;
         const adjustedWindowEndTime = windowEndNormalized.getTime() - oneDayMs;

         // If due date is at or after adjusted window end, no decay needed
         if (due.getTime() >= adjustedWindowEndTime) {
             return parseFloat(peakWLC.toFixed(6)); // Return peak WLC, not recalculated
         }

         // Calculate decay duration and current position
         const decayDuration = adjustedWindowEndTime - due.getTime();
         const timePastDue = currentDay.getTime() - due.getTime();

         if (decayDuration <= 0) return 0;

         // Linear decay formula
         const decayFactor = Math.max(0, 1 - (timePastDue / decayDuration));
         const decayedWLC = peakWLC * decayFactor;

         return parseFloat(decayedWLC.toFixed(6));

     } else {
         // PRE-DUE DATE OR ON DUE DATE: Use standard calculation
         const rt = Math.max(secondsRemaining, 1);
         const { baseLoad } = getBaseLoad(rt, tReq, now, due);
         const um = getUM(rt, tReq);

         const sm = task.status === "In Progress"
             ? dynamicInProgressMultiplier(rt, tReq, 0.9, 0.5)
             : statusMultipliers[task.status] || 1.0;

         const pm = priorityMultipliers[task.priority] || 1.0;
         const wlc = baseLoad * um * sm * pm;

         return parseFloat(wlc.toFixed(6));
     }
 }



// --- UPDATED: Per-user wrapper (unchanged from original) ---
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

// --- NEW: Helper to get total WLC for a user's tasks on a specific day ---
export function userTotalWLCForDay(tasks, now, efficiency = 1.0) {
    const res = evaluateWLCNow(tasks, efficiency, now);
    return res.reduce((sum, t) => sum + parseFloat(t.WLC), 0);
}

// --- NEW: Helper to get average daily WLC for a user over a window ---
export function userAvgWLCInWindow(tasks, windowStart, windowEnd, efficiency = 1.0) {
    const perDayTotals = [];
    let d = new Date(windowStart);
    d.setHours(0, 0, 0, 0); // Reset to start of day
    const endTime = new Date(windowEnd).getTime();

    while (d.getTime() < endTime) {
        const totalWLC = userTotalWLCForDay(tasks, d, efficiency);
        perDayTotals.push(totalWLC);
        d.setDate(d.getDate() + 1);
    }

    if (!perDayTotals.length) return 0;
    return perDayTotals.reduce((a, b) => a + b, 0) / perDayTotals.length;
}

// --- NEW: Team aggregate (unchanged) ---
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








// --- NEW: Workload Suggestions (unchanged) ---
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




export function evenDistributionWPC(task, today, windowEnd, dateInWindow) {
    const effort = Number(task.effortSeconds || 3600); // in seconds
    const effortHours = effort / 3600;

    // Normalize dates
    const dueDate = new Date(task.dueDate); dueDate.setHours(0,0,0,0);
    const startDay = new Date(today); startDay.setHours(0,0,0,0);
    const targetDay = new Date(dateInWindow); targetDay.setHours(0,0,0,0);

    let decayWindowEnd = null;
    if (windowEnd) {
        decayWindowEnd = new Date(windowEnd); decayWindowEnd.setHours(0,0,0,0);
        decayWindowEnd.setDate(decayWindowEnd.getDate() - 1);
    }

    const msPerDay = 24 * 60 * 60 * 1000;

    // Compute the number of days in the workload window, from "today" to due date (inclusive)
    let daysToDue = Math.ceil((dueDate - startDay) / msPerDay) + 1;
    if (daysToDue < 1) daysToDue = 1;

    // Fixed quota for each day up to and including due date
    const fixedQuota = (effortHours / 8) / daysToDue; // fraction of a workday

    if (targetDay.getTime() <= dueDate.getTime()) {
        // BEFORE or ON DUE DATE: fixed quota
        return fixedQuota;
    }

    if (decayWindowEnd && targetDay.getTime() > dueDate.getTime() && targetDay.getTime() <= decayWindowEnd.getTime()) {
        // AFTER DUE DATE: Linear decay of the fixed quota
        const decayDuration = (decayWindowEnd.getTime() - dueDate.getTime()) / msPerDay;
        const daysPastDue = (targetDay.getTime() - dueDate.getTime()) / msPerDay;
        if (decayDuration <= 0) return 0;
        const decayFactor = Math.max(0, 1 - (daysPastDue / decayDuration));
        return fixedQuota * decayFactor;
    }

    // Beyond decay window: 0
    return 0;
}
