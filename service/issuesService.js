// Service

const { ObjectId } = require("mongodb");
const mongoDBClient = require("../utils/MongoClient");

const ISSUE_COLLECTION = "issues";

/**
 * Fetch issues with optional filters, pagination, sorting
 */
const fetchIssuesFromDB = async ({
                                     projectId,
                                     taskId,
                                     status,
                                     severity,
                                     type,
                                     triage
                                 }) => {
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection(ISSUE_COLLECTION);

    const query = {};

    console.log("⚙️ Fetching issues from DB...");

    // ✅ Filter by projectId
    try {
        if (projectId && ObjectId.isValid(projectId)) {
            query.projectId = new ObjectId(projectId);
            console.log("🔎 Project Query:", query);
        } else if (projectId) {
            throw new Error("Invalid projectId");
        }
    } catch (err) {
        console.error("❌ Error casting projectId:", projectId, err.message);
        throw err;
    }

    // ✅ Filter by task reference
    if (taskId) {
        query["ref.type"] = "task";
        query["ref.id"] = new ObjectId(taskId);
    }

    // ✅ Additional filters
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (triage) query.triage = triage;

    try {
        console.log("🔍 Final Query:", query);

        const issues = await collection.find(query).toArray();

        console.log(`✅ Found ${issues.length} issues`);
        return issues;
    } catch (err) {
        console.error("❌ Error fetching issues from DB:", err.message);
        throw err;
    }
};

/**
 * Fetch a single issue by ID
 */
const fetchIssueByIdFromDB = async (issueId) => {
    const db = await mongoDBClient.getDatabase("main");
    return db.collection(ISSUE_COLLECTION).findOne({ _id: new ObjectId(issueId) });
};

/**
 * Create a new issue
 */
const createIssueInDB = async (issueData) => {

    console.log("Creating the issue", issueData)
    const db = await mongoDBClient.getDatabase("main")
    const result = await db.collection(ISSUE_COLLECTION).insertOne({
        ...issueData,
        projectId : new ObjectId(issueData.projectId),
        createdAt: new Date(),
        updatedAt: new Date(),
        logs: [{
            action: "created",
            timestamp: new Date(),
            by: issueData?.createdBy || null
        }]
    });

    return result.insertedId;
};

/**
 * Update an issue
 */
const updateIssueInDB = async (issueId, updates) => {
    const db = await mongoDBClient.getDatabase("main");
    const updateObj = {
        $set: {
            ...updates,
            updatedAt: new Date()
        }
    };

    return db.collection(ISSUE_COLLECTION).updateOne(
        { _id: new ObjectId(issueId) },
        updateObj
    );
};

/**
 * Delete an issue
 */
const deleteIssueFromDB = async (issueId) => {
    const db = await mongoDBClient.getDatabase("main");
    return db.collection(ISSUE_COLLECTION).deleteOne({ _id: new ObjectId(issueId) });
};

/**
 * Add a comment to an issue
 */
const addCommentToIssueInDB = async (issueId, commentData) => {
    const db = await mongoDBClient.getDatabase("main");

    return db.collection(ISSUE_COLLECTION).updateOne(
        { _id: new ObjectId(issueId) },
        {
            $push: {
                comments: {
                    text: commentData.text,
                    author: new ObjectId(commentData.author),
                    timestamp: new Date()
                }
            },
            $set: {
                updatedAt: new Date()
            }
        }
    );
};

/**
 * Add a log entry to an issue
 */
const addLogToIssueInDB = async (issueId, logData) => {
    const db = await mongoDBClient.getDatabase("main");

    return db.collection(ISSUE_COLLECTION).updateOne(
        { _id: new ObjectId(issueId) },
        {
            $push: {
                logs: {
                    action: logData.action,
                    timestamp: logData.timestamp || new Date(),
                    by: logData.by
                }
            }
        }
    );
};

module.exports = {
    fetchIssuesFromDB,
    fetchIssueByIdFromDB,
    createIssueInDB,
    updateIssueInDB,
    deleteIssueFromDB,
    addCommentToIssueInDB,
    addLogToIssueInDB
};