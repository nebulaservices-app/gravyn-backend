const issueService = require("../service/issuesService");

const getAllIssues = async (req, res) => {
    try {
        const issues = await issueService.fetchIssuesFromDB(req.query);
        res.status(200).json({ data: issues });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getIssueById = async (req, res) => {
    try {
        const issue = await issueService.fetchIssueByIdFromDB(req.params.id);
        if (!issue) return res.status(404).json({ error: "Issue not found" })
        res.status(200).json({ data: issue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createIssue = async (req, res) => {
    try {
        const id = await issueService.createIssueInDB(req.body);
        res.status(201).json({ message: "Issue created", id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateIssue = async (req, res) => {
    try {
        const result = await issueService.updateIssueInDB(req.params.id, req.body);
        if (result.matchedCount === 0) return res.status(404).json({ error: "Issue not found" });
        res.status(200).json({ message: "Issue updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteIssue = async (req, res) => {
    try {
        const result = await issueService.deleteIssueFromDB(req.params.id);
        if (result.deletedCount === 0) return res.status(404).json({ error: "Issue not found" });
        res.status(200).json({ message: "Issue deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addComment = async (req, res) => {
    try {
        const result = await issueService.addCommentToIssueInDB(req.params.id, req.body);
        res.status(200).json({ message: "Comment added", result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addLog = async (req, res) => {
    try {
        const result = await issueService.addLogToIssueInDB(req.params.id, req.body);
        res.status(200).json({ message: "Log added", result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllIssues,
    getIssueById,
    createIssue,
    updateIssue,
    deleteIssue,
    addComment,
    addLog
};