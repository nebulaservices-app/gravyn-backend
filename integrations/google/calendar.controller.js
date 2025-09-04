// /integrations/google/calendar.controller.js

const calendarService = require('./calendar.service');
const mongoDbClient = require("../../utils/MongoClient");
const {ObjectId} = require("mongodb");
const {google} = require("googleapis");

exports.handleGoogleCalendarCallback = async (req, res) => {
    const code = req.query.code;
    let state;

    console.log("Code acknowledged" , code);

    try {
        const decoded = decodeURIComponent(decodeURIComponent(req.query.state));
        state = JSON.parse(decoded);
        console.log("State parameter" , state)
    } catch (e) {
        return res.status(400).json({ error: 'Invalid state parameter' });
    }

    console.log("State parameter from google calendar" , state)

    const { projectId, integrationId } = state;

    if (!code || !projectId || !integrationId) {
        return res.status(400).json({ error: 'Missing code, projectId, or integrationId' });
    }

    try {
        await calendarService.processGoogleCalendarOAuth({ code, state });
        const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:7001';
        return res.redirect(`${FRONTEND_BASE_URL}`);
    } catch (error) {
        console.error('Google Calendar Callback Error:', error);
        return res.status(500).json({ error: 'Failed to process Google Calendar OAuth callback' });
    }
};





function isAccessTokenExpired(updatedAt, expirySeconds = 3600) {
    const tokenTime = new Date(updatedAt).getTime();
    const now = Date.now();
    return (now - tokenTime) > expirySeconds * 1000;
}

exports.getGoogleCalendarEvents = async (req, res) => {
    try {

        console.log("Initiating calendar")
        const { userId, projectId } = req.query;
        const db = await mongoDbClient.getDatabase('main');
        const integrationsCollection = db.collection('appIntegrations');

        const integration = await integrationsCollection.findOne({
            userId: new ObjectId(userId),
            projectId: new ObjectId(projectId),
            provider: 'google_calendar'
        });

        console.log("We have fetched the integration correctly ", integration)

        if (!integration || !integration.accessToken || !integration.refreshToken) {
            return res.status(404).json({ error: 'Integration not found or incomplete' });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        // Check if token is expired
        if (isAccessTokenExpired(integration.updatedAt)) {
            console.log("yes its expired")
            const { credentials } = await oauth2Client.refreshToken(integration.refreshToken);
            oauth2Client.setCredentials(credentials);

            // Update DB with new accessToken and updatedAt
            await integrationsCollection.updateOne(
                { _id: integration._id },
                {
                    $set: {
                        accessToken: credentials.access_token,
                        updatedAt: new Date()
                    }
                }
            );
        } else {
            oauth2Client.setCredentials({
                access_token: integration.accessToken,
                refresh_token: integration.refreshToken
            });
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 20,
            singleEvents: true,
            orderBy: 'startTime'
        });

        return res.json({ events: response.data.items });

    } catch (err) {
        console.error("🔴 Failed to fetch calendar events", err.message);
        return res.status(500).json({ error: 'Failed to fetch events' });
    }
};