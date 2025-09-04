// driftIQTrigger.js
import mongoDbClient from "../../utils/MongoClient.js";
import { generateCapacityBasedDrifts } from "./driftIQService.js";
import { ObjectId } from "mongodb";

/**
 * Creates a proper drift data structure from DriftIQ analysis with graph data
 */
function createDriftDataStructure(driftSuggestion, driftIndex = 1) {
    if (!driftSuggestion) return null;

    const drift = {
        name: `Drift ${driftIndex}`,
        startDate: driftSuggestion.startDate,
        endDate: driftSuggestion.endDate,
        durationDays: driftSuggestion.durationDays,
        tasks: [],
        metadata: {
            type: driftSuggestion.type,
            calculationBasis: driftSuggestion.calculationBasis,
            workingHoursPerDay: driftSuggestion.workingHoursPerDay,
            cooldownHours: driftSuggestion.cooldownHours,
            totalTasks: driftSuggestion.totalTasks,
            affectedUsers: driftSuggestion.affectedUsers?.length || 0,
            severity: driftSuggestion.severity || 'MEDIUM',
            confidence: driftSuggestion.confidence || 'MEDIUM',
            createdAt: new Date()
        },
        users: driftSuggestion.affectedUsers?.map(user => ({
            userId: user.userId,
            taskCount: user.taskCount,
            workHours: user.workHours,
            taskIds: user.taskIds,
            highPressureTaskCount: user.highPressureTaskCount,
            avgWLC: user.avgWLC,
            driftDays: user.driftDays,
            wlcGraphData: user.wlcGraphData
        })) || []
    };

    return drift;
}

/**
 * Main trigger function to check for bottlenecks and create drift if needed
 * Now returns WLC graph data for frontend visualization
 */
export async function triggerDriftIQCheck(projectId, options = {}) {
    try {
        const { forceFresh = false } = options;
        console.log(`🔍 Running DriftIQ check for project: ${projectId}${forceFresh ? ' (FORCE REFRESH)' : ''}`);

        const db = await mongoDbClient.getDatabase("main");

        // Add explicit sort to ensure consistent ordering and fresh data
        const tasks = await db
            .collection("tasks")
            .find({
                projectId: new ObjectId(projectId),
                $or: [
                    { status: { $ne: "completed" } },
                ]
            })
            .sort({ updatedAt: -1 }) // Get most recently updated tasks first
            .toArray();



        console.log(`📊 Analyzing ${tasks.length} active tasks`);

        // Debug: Log effort seconds to verify fresh data
        if (forceFresh) {
            console.log(`🔍 Task effort verification (showing first 5 tasks):`);
            tasks.slice(0, 5).forEach(task => {
                console.log(`   ${task.title || 'Untitled'}: ${task.effortSeconds || 'undefined'}s (${((task.effortSeconds || 3600) / 3600).toFixed(1)}h)`);
            });
        }

        // Run the analysis
        const driftAnalysis = generateCapacityBasedDrifts({ allTasks: tasks });

        // Check if no drift is needed
        if (!driftAnalysis.needsAttention || !driftAnalysis.drift) {
            console.log("✅ No bottlenecks detected - no drift needed");

            return {
                success: true,
                hasDrift: false,
                message: "No bottlenecks detected for next 7 days",
                analysisDate: new Date(),
                projectId,
                graphData: driftAnalysis.graphData || null,
                tasksAnalyzed: tasks.length,
                refreshMode: forceFresh ? 'FORCED' : 'NORMAL'
            };
        }

        // Process drift detection
        const driftSuggestion = driftAnalysis.drift;
        const drift = createDriftDataStructure(driftSuggestion, 1);

        // Add graph data from analysis
        drift.graphData = driftAnalysis.graphData;

        // Populate the drift with full task objects
        const allTaskIds = driftSuggestion.totalTaskIds;
        drift.tasks = tasks.filter(task =>
            allTaskIds.includes(task._id.toString())
        ).map(task => ({
            id: task._id.toString(),
            name: task.title || task.name || '[Untitled]',
            dueDate: task.dueDate,
            assignedTo: task.assignedTo,
            effortSeconds: task.effortSeconds || 3600,
            effortHours: ((task.effortSeconds || 3600) / 3600).toFixed(1),
            priority: task.priority || 'Normal',
            status: task.status || 'Pending'
        }));

        console.log(`🚨 DRIFT DETECTED:`);
        console.log(`   📅 Period: ${drift.startDate.toISOString().split('T')[0]} to ${drift.endDate.toISOString().split('T')[0]}`);
        console.log(`   ⏱️  Duration: ${drift.durationDays} days`);
        console.log(`   📝 Tasks: ${drift.tasks.length}`);
        console.log(`   👥 Users: ${drift.metadata.affectedUsers}`);
        console.log(`   📊 Graph Data: Available for ${drift.graphData?.projectWLCData?.length || 0} users`);

        // Debug: Show effort hours of affected tasks
        if (forceFresh && drift.tasks.length > 0) {
            console.log(`🔍 Affected tasks effort breakdown:`);
            drift.tasks.forEach(task => {
                console.log(`   ${task.name}: ${task.effortHours}h (${task.effortSeconds}s)`);
            });
        }

        return {
            success: true,
            hasDrift: true,
            drift: drift,
            analysisDate: new Date(),
            projectId,
            graphData: drift.graphData,
            tasksAnalyzed: tasks.length,
            refreshMode: forceFresh ? 'FORCED' : 'NORMAL'
        };

    } catch (error) {
        console.error("❌ Error in DriftIQ check:", error.message);
        console.error("Stack trace:", error.stack);

        return {
            success: false,
            error: error.message,
            analysisDate: new Date(),
            projectId,
            graphData: null
        };
    }
}

// Rest of your existing functions remain the same...
export async function runDriftIQCheck(projectId, saveToDB = false) {
    const result = await triggerDriftIQCheck(projectId);

    if (result.success && result.hasDrift && saveToDB) {
        try {
            const db = await mongoDbClient.getDatabase("main");
            const driftData = {
                ...result.drift,
                projectId: new ObjectId(projectId),
                createdAt: new Date(),
                status: 'proposed'
            };

            const insertResult = await db.collection("drifts").insertOne(driftData);
            console.log(`💾 Drift saved to database with ID: ${insertResult.insertedId}`);

            result.driftId = insertResult.insertedId;
            result.savedToDB = true;
        } catch (error) {
            console.error("❌ Error saving drift to database:", error.message);
            result.saveError = error.message;
        }
    }

    return result;
}
