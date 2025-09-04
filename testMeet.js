require('dotenv').config();
const meetingService = require('./service/meetingService');

// Replace this with real values from your DB
const mockAppIntegration = {
    provider: 'google',
    accessToken: 'ya29.a0AW4Xtxi4QqlUPdUp_0bRrwX_p5O_bU2As_-OyiBUfcl4u-kiZFctJU9xeYnwFFW1yPKazNoN2yxmCmPIdTO79EVD2ALstoC2FmzYmY0CI73aHr5OEFiSEMseOw3SeYGbmTKNiNpyysZ2ATh5hkAJ8zu8LXwYupOwuzaeu84daCgYKAd0SARISFQHGX2MiHf1a36dd0b41k4d1jbB0cA0175', // full token here
};

const meetingData = {
    title: 'Test Meeting from Script',
    description: 'Testing Google Meet Creation',
    startTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min from now
    endTime: new Date(Date.now() + 40 * 60 * 1000).toISOString(),   // 40 min from now
    timeZone: 'Asia/Kolkata',
    attendees: [
        { email: 'testuser@example.com' }
    ]
};

const run = async () => {
    try {
        const result = await meetingService.createMeeting({
            provider: mockAppIntegration.provider,
            accessToken: mockAppIntegration.accessToken,
            meetingData,
        });

        console.log('Meeting Created:');
        console.log(result);
    } catch (err) {
        console.error('Error:', err.message || err);
    }
};

run();