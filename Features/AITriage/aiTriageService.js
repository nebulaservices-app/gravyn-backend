const { AIAgent } = require('./agents/AIAgent');
const { ObjectId } = require('mongodb');
const mongoDbClient = require('../../utils/MongoClient')

exports.triageIssue = async (issue) => {
    const aiAgent = new AIAgent();
    const db = await mongoDbClient.getDatabase('main');

    // Fetch teams to provide for assignment logic
    const teams = await db.collection('teams').find({
        projectId: new ObjectId(issue.projectId)
    }).toArray();

    // Analyze and possibly assign smart
    const aiaResult = await aiAgent.analyze(issue, teams);

    // Build triage metadata for audit
    const triagedMeta = {
        triaged: true,
        by: 'ai',
        userId: null,
        triagedAt: new Date(),
        severity: aiaResult.severity,
        explanation: aiaResult.explanation || '',
    };

    // Build update object
    const updateSet = {
        severity: aiaResult.severity,
        status: "triaged",
        "meta.triaged": triagedMeta,
        updatedAt: new Date(),
    };

    // If a smart assignment was made, update assignedTo using assignedTeamId
    if (
        aiaResult.smartAssignment &&
        aiaResult.smartAssignment.assignedTeamId // Must be an ObjectId!
    ) {
        updateSet.assignedTo = {
            mode: "team",
            users: [],
            teams: [new ObjectId(aiaResult.smartAssignment.assignedTeamId)]
        };
    }

    // Update in DB
    await db.collection('issues').updateOne(
        { _id: new ObjectId(issue._id) },
        { $set: updateSet }
    );

    return {
        ...aiaResult,
        meta: { triaged: triagedMeta },
    };
};
