// analysisEngine/utils/time.js

function getCycleTime(task) {
    if (!task.startedAt || !task.completedAt) return null;
    const start = new Date(task.startedAt);
    const end = new Date(task.completedAt);
    return (end - start) / (1000 * 60 * 60); // hours
}

function getLeadTime(task) {
    if (!task.createdAt || !task.completedAt) return null;
    const start = new Date(task.createdAt);
    const end = new Date(task.completedAt);
    return (end - start) / (1000 * 60 * 60); // hours
}

function hoursUntilDue(dueDate) {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    return (due - now) / (1000 * 60 * 60); // hours
}

function daysAgo(date) {
    const now = new Date();
    const then = new Date(date);
    return (now - then) / (1000 * 60 * 60 * 24);
}

function daysUntilDue(task) {
    if (!task.dueDate) return null;
    const now = new Date();
    const due = new Date(task.dueDate);
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24)); // in days
}

function isOverdue(task) {
    return task.dueDate && new Date(task.dueDate) < new Date() && !task.completedAt;
}

module.exports = {
    getCycleTime,
    getLeadTime,
    hoursUntilDue,
    daysAgo,
    daysUntilDue,
    isOverdue
};