const axios = require('axios');
const { ObjectId } = require('mongodb');
const mongoDBClient = require('../../../utils/MongoClient');
const {google} = require("googleapis");

const handleGoogleOAuthCallback = async ({ code, userId, projectId, integrationId }) => {
    const db = await mongoDBClient.getDatabase("main");
    const integrationCollection = db.collection("Integrations");
    const appIntegrationCollection = db.collection("appIntegrations");

    const integration = await integrationCollection.findOne({ _id: new ObjectId(integrationId) });

    if (!integration || !integration.oauth) {
        throw new Error("Google OAuth config not found.");
    }

    const { clientId, clientSecret, redirectUri, tokenUrl } = integration.oauth;

    const tokenRes = await axios.post(tokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
    }, {
        headers: { 'Content-Type': 'application/json' }
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    await appIntegrationCollection.insertOne({
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
        integrationId: new ObjectId(integrationId),
        key: 'google_meet',
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        createdAt: new Date()
    });
};

// Create a meeting using Google Calendar API

const createMeetService = async ({
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
                                 }) => {
    const db = await mongoDBClient.getDatabase("main");

    const integration = await db.collection("appIntegrations").findOne({
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
        key: "google_meet"
    });


    if (!integration) throw new Error("Google Meet integration not found for this user & project" , integration);

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: integration.accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const timeZone = 'Asia/Kolkata';

    const event = {
        summary: title,
        description: agenda || "Meeting created via Nebula",
        start: { dateTime: startDate.toISOString(), timeZone },
        end: { dateTime: endDate.toISOString(), timeZone },
        conferenceData: {
            createRequest: {
                requestId: `nebula-meet-${Date.now()}`,
                conferenceSolutionKey: { type: "hangoutsMeet" }
            }
        },
        attendees: participants.map(p => ({ email: p.email }))    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1
    });

    const createdEvent = response.data;

    const result = await db.collection("meetings").insertOne({
        title,
        agenda,
        location,
        platform,
        date,
        duration,
        participants,
        sendNotifications,
        sendReminder,
        link: createdEvent.hangoutLink,
        startTime: createdEvent.start.dateTime,
        endTime: createdEvent.end.dateTime,
        integrationKey: "google_meet",
        creatorId: new ObjectId(creatorId),
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
        googleEventId: createdEvent.id,
        createdAt: new Date(),
        syncedAt: new Date()
    });

    return {
        _id: result.insertedId,
        title,
        agenda,
        location,
        platform,
        date,
        duration,
        participants,
        sendNotifications,
        sendReminder,
        link: createdEvent.hangoutLink,
        startTime: createdEvent.start.dateTime,
        endTime: createdEvent.end.dateTime
    };
};

const listMeetingsService = async ({ userId, projectId }) => {
    const db = await mongoDBClient.getDatabase("main");

    const list =  await db.collection("meetings").find({
        userId: new ObjectId(userId),
        projectId: new ObjectId(projectId),
    }).toArray();
    return list;
};

const deleteMeetingService = async ({ meetingId, userId }) => {
    const db = await mongoDBClient.getDatabase("main");

    // Remove from Google Calendar
    const integration = await db.collection("appIntegrations").findOne({
        userId: new ObjectId(userId),
        key: "google_meet"
    });

    if (!integration) throw new Error("Integration not found.")

    const calendarId = "primary";

    await axios.delete(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${meetingId}`, {
        headers: {
            Authorization: `Bearer ${integration.accessToken}`
        }
    });

    // Remove from DB
    await db.collection("integrationResources").deleteOne({
        resourceId: meetingId,
        integrationKey: "google_meet"
    });
};

module.exports = {
    handleGoogleOAuthCallback,
    createMeetService,
    listMeetingsService,
    deleteMeetingService
};