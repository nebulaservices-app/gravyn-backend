const { google } = require('googleapis');

const createMeeting = async (accessToken, meetingData) => {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    console.log("Working")

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
        summary: meetingData.title,
        description: meetingData.description || '',
        start: {
            dateTime: meetingData.startTime,
            timeZone: meetingData.timeZone || 'Asia/Kolkata',
        },
        end: {
            dateTime: meetingData.endTime,
            timeZone: meetingData.timeZone || 'Asia/Kolkata',
        },
        attendees: meetingData.attendees || [],
        conferenceData: {
            createRequest: {
                requestId: `meet-${Date.now()}`,
                conferenceSolutionKey: {
                    type: 'hangoutsMeet',
                },
            },
        },
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
    });

    return {
        id: response.data.id,
        meetLink: response.data.hangoutLink,
        event: response.data,
    };
};

module.exports = {
    createMeeting,
};