const {
    handleGoogleOAuthCallback,
    createMeetService,
    listMeetingsService,
    deleteMeetingService
} = require('../../../service/Integrations/googleMeet/meetCRUD');
const {refreshGoogleToken} = require("../../../service/Integrations/googleMeet/refreshToken");

const googleMeetOAuthCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        const parsedState = JSON.parse(decodeURIComponent(state));
        const { userId, projectId, integrationId } = parsedState;

        await handleGoogleOAuthCallback({ code, userId, projectId, integrationId });

        res.redirect(`http://localhost:7001/appq`);
    } catch (err) {
        console.error("OAuth Callback Error:", err.message);
        res.status(500).json({ error: "Google OAuth failed." });
    }
};


// Controller to refresh Google OAuth token
const refreshGoogleAccessToken = async (req, res) => {
    try {
        const { integrationInstanceId } = req.body;

        if (!integrationInstanceId) {
            return res.status(400).json({ error: "integrationInstanceId is required" });
        }

        const result = await refreshGoogleToken(integrationInstanceId)
        res.status(200).json(result);
    } catch (err) {
        console.error("🔴 Error refreshing token:", err.message);
        res.status(500).json({ error: "Failed to refresh access token" });
    }
};


const createGoogleMeet = async (req, res) => {
    try {
        const {
            title,
            agenda,
            location,
            platform,
            date,
            duration,
            participants,
            sendNotifications,
            sendReminder,
            creatorId,
            projectId,
            userId
        } = req.body;

        const result = await createMeetService({
            title,
            agenda,
            location,
            platform,
            date,
            duration,
            participants,
            sendNotifications,
            sendReminder,
            creatorId,
            projectId,
            userId
        });

        res.status(201).json(result);
    } catch (err) {
        console.error("❌ Meeting creation failed:", err.message);
        res.status(500).json({ error: "Failed to create meeting." });
    }
};


const listMeetings = async (req, res) => {
    try {
        const { userId, projectId } = req.query;

        console.log("user is for listing meeting " , userId , projectId)

        const meetings = await listMeetingsService({ userId, projectId });
        res.status(200).json(meetings);
    } catch (err) {
        console.error("List Meetings Error:", err.message);
        res.status(500).json({ error: "Failed to list meetings." });
    }
};

const deleteMeeting = async (req, res) => {
    try {
        const { meetingId, userId } = req.body;

        await deleteMeetingService({ meetingId, userId })
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Delete Meeting Error:", err.message);
        res.status(500).json({ error: "Failed to delete meeting." });
    }
};

module.exports = {
    googleMeetOAuthCallback,
    createGoogleMeet,
    listMeetings,
    deleteMeeting,
    refreshGoogleAccessToken
};