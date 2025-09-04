
import { evaluateWLCNow, evaluateUserWLC } from "./WorkEstimatorCalculator.js"; // your WLC evaluato

// 1. Get last update timestamp
export function getLastUpdated(project) {
    return project.updatedAt;
}

// 2. Get project description
export function getProjectDescription(project) {
    return project.description;
}

// 3. Gather relevant active tasks
// 3. Gather relevant active tasks for reporting (touched yesterday, today, or due soon)
export function getActiveTasks(tasks, now = new Date()) {
    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const plus3Days = new Date(now);
    plus3Days.setDate(now.getDate() + 3);

    return tasks.filter(task => {
        const updatedAtStr = new Date(task.updatedAt).toISOString().slice(0, 10);
        const dueDate = new Date(task.dueTime || task.dueDate); // support both keys

        const touchedYesterday = updatedAtStr === yesterdayStr;
        const touchedToday = updatedAtStr === todayStr;

        const inProgressNow = (task.status || "").toLowerCase() === "in_progress";
        const dueSoon = dueDate > now && dueDate <= plus3Days;

        // Covers: was touched yesterday, is being actively worked on today, or needs attention soon
        return touchedYesterday || touchedToday || (inProgressNow && dueSoon) || dueSoon;
    });
}



// 4. Get WLC reports for each task
export function getTaskWLCReports(tasks, userEfficiency = 1.0, now = new Date()) {
    return tasks.map(task => ({
        ...task,
        wlcReport: evaluateWLCNow([task], userEfficiency, now)[0]
    }));
}

// 5. For each user: WLC and their active task count
export function getUserWLCReports(users, now = new Date()) {
    return users.map(user => {
        const report = evaluateUserWLC(user, now);
        return {
            name: user.name,
            wlc: report.avgWLC,
            totalWLC: report.totalWLC,
            totalTasks: user.tasks.length,
            heatLevel: report.heatLevel
        }
    });
}
