

// analysisEngine/utils/weights.js

function calculateWeights({ leadTime, cycleTime, dueDate, completedAt, createdAt, priority, status }) {
    let leadCycleRatio = null;
    if (leadTime && cycleTime && cycleTime > 0) {
        leadCycleRatio = +(leadTime / cycleTime).toFixed(2);
    }

    let efficiencyDelta = null;
    if (leadTime && dueDate) {
        const due = new Date(dueDate);
        const completed = completedAt ? new Date(completedAt) : new Date();
        const estimatedTime = (due - new Date(createdAt)) / (1000 * 60 * 60); // hours
        efficiencyDelta = +(estimatedTime - leadTime).toFixed(2); // positive = faster than estimated
    }

    let baseWeight = 1;

    if (priority === "high") baseWeight += 2.5;
    if (priority === "medium") baseWeight += 1.5;
    if (priority === "low") baseWeight += 0.5;

    if (status === "blocked") baseWeight += 2;
    if (status === "under_review") baseWeight += 1.5;

    return {
        leadCycleRatio,
        efficiencyDelta,
        baseWeight
    };
}

module.exports = {
    calculateWeights
};
