// driftIQUtils.js

// Returns true if the task is active in the given window
export function isTaskActiveInWindow(task, windowStart, windowEnd) {
    const createdAt = new Date(task.createdAt);
    const completedAt = task.completedAt ? new Date(task.completedAt) : null;
    return createdAt < windowEnd && (!completedAt || completedAt > windowStart);
}

// Returns true if the task is overdue in the given window
export function isTaskOverdueInWindow(task, windowEnd) {
    const dueDate = new Date(task.dueDate);
    return dueDate < windowEnd && (!task.completedAt || new Date(task.completedAt) > windowEnd);
}

// Returns true if a task is considered "important"
export function isTaskImportant(task) {
    return ["high", "urgent"].includes((task.priority || "").toLowerCase()) || task.isImportant;
}

// Filters relevant tasks based on active, overdue, or important state
export function filterTasksForWindow(tasks, windowStart, windowEnd) {
    return tasks.filter(task => {
        // Ensure we are working with Date objects
        const taskStart = new Date(task.createdAt || task.startDate || windowStart); // Use creation/start date, or fallback to windowStart
        const taskDue = new Date(task.dueDate);

        // The logic for overlap:
        // The task must start before the window ends, AND
        // the task must be due after the window starts.
        const startsBeforeWindowEnd = taskStart < windowEnd;
        const dueAfterWindowStart = taskDue > windowStart;

        return startsBeforeWindowEnd && dueAfterWindowStart;
    });
}

// Generates a sequence of overlapping windows over the project timeline
export function generateOverlappingWindows(startDate, endDate, windowSize = 7, step = 1) {
    const windows = [];
    let current = new Date(startDate);
    const msInDay = 24 * 60 * 60 * 1000;
    while (current.getTime() + windowSize * msInDay <= endDate.getTime()) {
        windows.push({
            windowStart: new Date(current),
            windowEnd: new Date(current.getTime() + windowSize * msInDay)
        });
        current = new Date(current.getTime() + step * msInDay);
    }
    return windows;
}
