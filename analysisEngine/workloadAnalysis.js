// analysisEngine/workloadAnalysis.js

const { getCycleTime, getLeadTime, isOverdue, daysUntilDue } = require("./utils/time");
const { calculateWeights } = require("./utils/weights");

/**
 * Returns workload analysis for a particular assignee based on their task history
 */
function getWorkloadReportForAssignee(assigneeId, tasks = []) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
        return {
            assigneeId,
            message: "No tasks found for analysis.",
            workloadScore: 0,
            taskCount: 0,
            detailed: [],
            status: "no_data"
        };
    }

    const now = new Date();
    let totalPressureScore = 0;
    let completedEfficiencySum = 0;
    let completedCount = 0;

    const detailed = [];

    for (const task of tasks) {
        const isCompleted = !!task.completedAt;
        const dueInDays = daysUntilDue(task);
        const dueSoon = dueInDays !== null && dueInDays <= 3;

        const cycleTime = isCompleted ? getCycleTime(task) : null;
        const leadTime = isCompleted ? getLeadTime(task) : null;

        // Heuristic coefficients and weights
        const { leadCycleRatio, efficiencyDelta, baseWeight } = calculateWeights({
            cycleTime,
            leadTime,
            dueDate: task.dueDate,
            completedAt: task.completedAt,
            createdAt: task.createdAt,
            priority: task.priority,
            status: task.status,
        });

        let pressure = baseWeight;

        // Add pressure only if task is still active
        if (!isCompleted) {
            if (isOverdue(task)) {
                pressure += 3.0;
            } else if (dueSoon) {
                pressure += 1.5;
            }

            if (task.status === "blocked") {
                pressure += 2.5;
            }
        }

        // Track overall pressure
        totalPressureScore += pressure;

        // If completed, consider for efficiency averages
        if (leadCycleRatio !== null && isCompleted) {
            completedEfficiencySum += leadCycleRatio;
            completedCount++;
        }

        detailed.push({
            taskId: task._id,
            title: task.title,
            isCompleted,
            status: task.status,
            cycleTime,
            leadTime,
            leadCycleRatio,
            efficiencyDelta,
            dueInDays,
            pressureScore: pressure,
        });
    }

    const workloadScore = Number(totalPressureScore.toFixed(2));
    const avgEfficiencyRatio = completedCount ? completedEfficiencySum / completedCount : null;

    // Adaptive threshold
    let statusLevel = "moderate";
    if (workloadScore >= 40) statusLevel = "overloaded";
    else if (workloadScore <= 20) statusLevel = "underloaded";

    return {
        assigneeId,
        status: statusLevel,
        workloadScore,
        taskCount: tasks.length,
        averageEfficiencyRatio: avgEfficiencyRatio !== null ? Number(avgEfficiencyRatio.toFixed(2)) : null,
        detailed,
    };
}

module.exports = {
    getWorkloadReportForAssignee,
};