const googleService = require('../service/googleMeetService');
// const zoomService = require('./zoomMeetingService'); // future

const createMeeting = async ({ provider, accessToken, meetingData }) => {
    switch (provider) {
        case 'google':
            console.log("Access token " , accessToken , "Meeting token " ,meetingData)
            return await googleService.createMeeting(accessToken, meetingData);
        // case 'zoom':
        //   return await zoomService.createMeeting(accessToken, meetingData);
        default:
            throw new Error(`Unsupported meeting provider: ${provider}`);
    }
};

module.exports = {
    createMeeting,
};