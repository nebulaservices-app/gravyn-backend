// driftIQService.js
import {
    filterTasksForWindow,
    generateOverlappingWindows
} from "./driftIQUtils.js";
import {evenDistributionWPC} from "../../utils/AiUtils/WorkEstimatorCalculator.js";

// --- Configuration ---
const DAILY_WLC_SUM_THRESHOLD = 1; // In hours/day, set to daily capacity
const HIGH_PRESSURE_DAY_COUNT_THRESHOLD = 2;
const BETA_COOLDOWN_HOURS = 0.5;
const DAILY_WORKING_HOURS = 8;

// --- Utility: Days in Analysis Window ---
function getDatesInRange(startDate, numberOfDays) {
    const dates = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    for (let i = 0; i < numberOfDays; i++) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

/**
 * Scan next 7 days for bottlenecks with Even Distribution WPC for graphing
 */
export function scanNext7DaysForBottlenecks({ tasks, userId }) {
    const today = new Date();  // Note: Months are 0-based (6=July)
    today.setHours(0, 0, 0, 0); // Normalize to midnight local
    const next7Days = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

    const relevantTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= next7Days;
    });

    if (!relevantTasks.length) {
        return {
            userId,
            hasBottleneck: false,
            relevantTasks: [],
            message: "No tasks due in next 7 days",
            wlcGraphData: null
        };
    }

    // Analysis window: 7 days forward
    const datesInWindow = getDatesInRange(today, 7);
    const dailyCumulativeWLCs = Array(7).fill(0);
    let highPressureTaskCount = 0;
    const taskWLCBreakdown = [];
    const dailyWLCData = [];
    const allTaskAverages = [];

    // Log headers
    console.log(`\n📊 EVEN DISTRIBUTION ANALYSIS FOR USER: ${userId}`);
    console.log(`${'Task Name'.padEnd(25)} | ${datesInWindow.map(d => d.toISOString().split('T')[0].slice(5)).join(' | ')} | Avg  | Max  | Status`);
    console.log('─'.repeat(100));

    for (const task of relevantTasks) {
        const taskName = (task.title || task.name || 'Untitled').substring(0, 23);

        // Calculate per-day required hours (“even distribution”)
        // Precompute the fixed per-day quota for this task based on today
        const dailyScores = datesInWindow.map(date =>
            evenDistributionWPC(task, today, next7Days, date)
        );



        // Analysis/Thresholds
        const avgTaskWlc = dailyScores.reduce((sum, wlc) => sum + wlc, 0) / dailyScores.length
        const maxTaskWlc = Math.max(...dailyScores);
        const sumTaskWlc = dailyScores.reduce((sum, wlc) => sum + wlc, 0);

        allTaskAverages.push(avgTaskWlc);

        // Mark “high pressure” if any day’s required hours > daily capacity
        const daysOverThreshold = dailyScores.filter(wlc => wlc > DAILY_WLC_SUM_THRESHOLD).length;
        const isHighPressureMultipleDays = daysOverThreshold >= 3;
        const isHighPressureAvg = avgTaskWlc > (DAILY_WLC_SUM_THRESHOLD * 0.5); // >4h/day on avg, tweak as needed
        const isHighPressure = daysOverThreshold > 0 || isHighPressureMultipleDays || isHighPressureAvg;

        // Track for downstream stats/graph
        taskWLCBreakdown.push({
            taskId: task._id?.toString() ?? 'unknown',
            taskName: taskName,
            dailyWLC: dailyScores.map(wlc => +wlc.toFixed(2)),
            dueDate: task.dueDate,
            priority: task.priority || 'Normal',
            avgWLC: +avgTaskWlc.toFixed(2),
            maxWLC: +maxTaskWlc.toFixed(2),
            sumWLC: +sumTaskWlc.toFixed(2),
            isHighPressure,
            daysOverThreshold
        });

        // Log each task's daily quota for all 7 days
        const wlcString = dailyScores.map(wlc => wlc.toFixed(2).padStart(5)).join(' | ');
        const avgString = avgTaskWlc.toFixed(2).padStart(4);
        const maxString = maxTaskWlc.toFixed(2).padStart(4);
        const statusString = isHighPressure ? '🚨 HIGH' : '✅ OK';

        console.log(`${taskName.padEnd(25)} | ${wlcString} | ${avgString} | ${maxString} | ${statusString}`);

        if (isHighPressure) highPressureTaskCount++;

        // Add to daily user total for each day
        dailyScores.forEach((wlc, dayIndex) => {
            dailyCumulativeWLCs[dayIndex] += wlc;
        });
    }

    // Create daily summary data for graph
    datesInWindow.forEach((date, index) => {
        dailyWLCData.push({
            date: date.toISOString().split('T')[0],
            dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            cumulativeWLC: +dailyCumulativeWLCs[index].toFixed(2),
            isOverThreshold: dailyCumulativeWLCs[index] > DAILY_WLC_SUM_THRESHOLD,
            threshold: DAILY_WLC_SUM_THRESHOLD
        });
    });

    // Show daily cumulative totals
    const cumulativeString = dailyCumulativeWLCs.map(cum => cum.toFixed(2).padStart(5)).join(' | ');
    console.log('\n' + `${'DAILY CUMULATIVE'.padEnd(25)} | ${cumulativeString}`);

    // Show days over threshold
    const thresholdString = dailyCumulativeWLCs.map(cum =>
        cum > DAILY_WLC_SUM_THRESHOLD ? '🚨'.padStart(5) : '✅'.padStart(5)
    ).join(' | ');
    console.log(`${'THRESHOLD STATUS'.padEnd(25)} | ${thresholdString}\n`);

    // Bottleneck detection: flag if any day exceeds daily cap multiple times
    const highPressureDayCount = dailyCumulativeWLCs.filter(dailySum => dailySum > DAILY_WLC_SUM_THRESHOLD).length;
    const hasSustainedOverload = highPressureDayCount > HIGH_PRESSURE_DAY_COUNT_THRESHOLD;
    const hasBottleneck = highPressureDayCount > 0 && hasSustainedOverload;

    // Compose user graph data
    const wlcGraphData = {
        userId,
        userName: userId.slice(-4),
        dailySummary: dailyWLCData,
        taskBreakdown: taskWLCBreakdown,
        analysisMetrics: {
            totalTasks: relevantTasks.length,
            highPressureTaskCount,
            highPressureDays: highPressureDayCount,
            avgWLC: +(dailyCumulativeWLCs.reduce((sum, wlc) => sum + wlc, 0) / 7).toFixed(2),
            maxDailyWLC: +Math.max(...dailyCumulativeWLCs).toFixed(2),
            hasSustainedOverload,
            hasBottleneck
        },
        thresholds: {
            dailyWLCThreshold: DAILY_WLC_SUM_THRESHOLD,
            highPressureDayThreshold: HIGH_PRESSURE_DAY_COUNT_THRESHOLD
        }
    };

    return {
        userId,
        hasBottleneck,
        relevantTasks,
        highPressureTaskCount,
        totalTasks: relevantTasks.length,
        avgWLC: dailyCumulativeWLCs.reduce((sum, wlc) => sum + wlc, 0) / 7,
        dailyCumulativeWLCs: dailyCumulativeWLCs.map(wlc => +wlc.toFixed(2)),
        wlcGraphData
    };
}

/**
 * Generate capacity-based drifts with graph data
 */
export function generateCapacityBasedDrifts({ allTasks }) {
    console.log("\n🔍 Starting Capacity-Based Drift Analysis (Even Distribution Model)...\n");

    const tasksByUser = allTasks.reduce((acc, task) => {
        const userId = task.assignedTo?.toString();
        if (userId) {
            if (!acc[userId]) acc[userId] = [];
            acc[userId].push(task);
        }
        return acc;
    }, {});

    const bottleneckUsers = [];
    const allWLCGraphData = [];
    const analysisWindow = {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalDays: 7
    };

    for (const [userId, userTasks] of Object.entries(tasksByUser)) {
        console.log(`\n👤 Analyzing User: ${userId}`);
        const analysis = scanNext7DaysForBottlenecks({ tasks: userTasks, userId });

        if (analysis.wlcGraphData) {
            allWLCGraphData.push(analysis.wlcGraphData);
        }

        const statusEmoji = analysis.hasBottleneck ? '🚨' : '✅';
        console.log(`${statusEmoji} User ${userId}: ${analysis.hasBottleneck ? 'BOTTLENECK DETECTED' : 'HEALTHY WORKLOAD'}`);

        if (analysis.hasBottleneck) {
            const driftCalculation = calculateDriftPeriod(analysis.relevantTasks);

            bottleneckUsers.push({
                userId,
                tasks: analysis.relevantTasks,
                driftDays: driftCalculation.daysNeeded,
                totalWorkHours: driftCalculation.totalWorkHours,
                taskCount: analysis.relevantTasks.length,
                highPressureTaskCount: analysis.highPressureTaskCount,
                avgWLC: analysis.avgWLC,
                wlcGraphData: analysis.wlcGraphData
            });

            console.log(`   📊 Work Hours: ${driftCalculation.totalWorkHours}h`);
            console.log(`   📅 Drift Days Needed: ${driftCalculation.daysNeeded}`);
            console.log(`   ⚡ High Pressure Tasks: ${analysis.highPressureTaskCount}/${analysis.totalTasks}`);
        }
    }

    if (bottleneckUsers.length === 0) {
        console.log("\n✅ No bottlenecks detected for next 7 days!");
        return {
            needsAttention: false,
            drift: null,
            graphData: {
                analysisWindow,
                projectWLCData: allWLCGraphData
            }
        };
    }

    // Calculate drift parameters/summary
    const maxDriftDays = Math.max(...bottleneckUsers.map(user => user.driftDays));
    const totalAffectedTasks = bottleneckUsers.reduce((sum, user) => sum + user.taskCount, 0);
    const totalWorkHours = bottleneckUsers.reduce((sum, user) => sum + user.totalWorkHours, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const driftEndDate = new Date(tomorrow);
    driftEndDate.setDate(driftEndDate.getDate() + maxDriftDays - 1);

    const driftSuggestion = {
        type: 'COMBINED_CAPACITY_DRIFT',
        startDate: tomorrow,
        endDate: driftEndDate,
        durationDays: maxDriftDays,
        affectedUsers: bottleneckUsers.map(user => ({
            userId: user.userId,
            taskIds: user.tasks.map(t => t._id.toString()),
            workHours: user.totalWorkHours,
            taskCount: user.taskCount,
            highPressureTaskCount: user.highPressureTaskCount,
            avgWLC: user.avgWLC,
            driftDays: user.driftDays,
            wlcGraphData: user.wlcGraphData
        })),
        totalTaskIds: bottleneckUsers.flatMap(user => user.tasks.map(task => task._id.toString())),
        totalTasks: totalAffectedTasks,
        totalWorkHours,
        calculationBasis: 'EVEN_DISTRIBUTION_DAILY_QUOTA',
        workingHoursPerDay: DAILY_WORKING_HOURS,
        cooldownHours: BETA_COOLDOWN_HOURS,
        severity: bottleneckUsers.length > 1 ? 'HIGH' : 'MEDIUM',
        confidence: bottleneckUsers.every(user => user.highPressureTaskCount > 1) ? 'HIGH' : 'MEDIUM'
    };

    return {
        needsAttention: true,
        drift: driftSuggestion,
        graphData: {
            analysisWindow,
            projectWLCData: allWLCGraphData
        }
    };
}

// --- Task period calculation (unchanged) ---
function calculateDriftPeriod(tasks) {
    let totalWorkHours = 0;
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const taskHours = (task.effortSeconds || 3600) / 3600;
        totalWorkHours += taskHours;
        if (i < tasks.length - 1) {
            totalWorkHours += BETA_COOLDOWN_HOURS;
        }
    }
    totalWorkHours += (2 * BETA_COOLDOWN_HOURS);
    const daysNeeded = Math.ceil(totalWorkHours / DAILY_WORKING_HOURS);
    return {
        totalWorkHours: +totalWorkHours.toFixed(2),
        daysNeeded: Math.max(daysNeeded, 1)
    };
}

// --- For debugging (optional, skip for even distribution model) ---
export function debugWLCCalculation(task, userEfficiency = 1.0, currentDate, endDate) {
    console.log(`\n🔍 DEBUG EVEN DISTRIBUTION Calculation:`);
    console.log(`   Task: ${task.title || task.name || 'Untitled'}`);
    console.log(`   Due Date: ${new Date(task.dueDate).toISOString()}`);
    console.log(`   Current Date: ${currentDate.toISOString()}`);
    const quota = evenDistributionWPC(task, currentDate);
    console.log(`   Work Required Today: ${quota.toFixed(2)} h`);
    return quota;
}

export default {
    scanNext7DaysForBottlenecks,
    generateCapacityBasedDrifts,
    calculateDriftPeriod,
    debugWLCCalculation
};
