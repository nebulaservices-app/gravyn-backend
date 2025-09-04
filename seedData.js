const { ObjectId } = require("mongodb");
const mongoDBClient = require("./utils/MongoClient")

async function assignDefaultAITriageToProjects() {
    const defaultAITriage = {
        enabled: true,
        mode: "auto",
        isAllowed : true,
        access: {
            modes: {
                auto: {
                    isAllowed: true,
                    label: "Auto Triage",
                    description: "Automatically triage critical or high-priority issues"
                },
                manual: {
                    isAllowed: true,
                    label: "Manual Triage",
                    description: "Manually drag issues to Triaged column"
                }
            },
            statsAccess: true,
            usageTracking: true,
            partnerAutoAssign: true
        },
        tokenUsage: {
            today: 0,
            total: 0
        },
        stats: {
            totalTriaged: 0,
            todayTriaged: 0,
            issueTypeBreakdown: {
                bug: 0,
                performance: 0,
                security: 0,
                design: 0
            },
            severityBreakdown: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            }
        }
    };

    try {
        const db = await mongoDBClient.getDatabase("main");
        const collection = db.collection("projects");

        const projects = await collection.find({}).toArray();

        const bulkOps = projects.map((project) => ({
            updateOne: {
                filter: { _id: project._id },
                update: {
                    $set: { aiTriage: defaultAITriage },
                },
            },
        }));

        if (bulkOps.length > 0) {
            const result = await collection.bulkWrite(bulkOps);
            console.log(`✅ Updated ${result.modifiedCount} projects with default aiTriage config.`);
        } else {
            console.log("ℹ️ No projects found.");
        }
    } catch (err) {
        console.error("❌ Error assigning aiTriage config:", err);
    }
}

assignDefaultAITriageToProjects();