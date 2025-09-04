const express = require('express');
const router = express.Router();
const {
    googleMeetOAuthCallback,
    createGoogleMeet,
    listMeetings,
    deleteMeeting,
    refreshGoogleAccessToken
} = require('../../../controllers/integrations/google/googleMeet_cont');

// Google OAuth callback (OAuth redirect)
router.get('/callback', googleMeetOAuthCallback);

// CRUD endpoints
router.post('/create', createGoogleMeet);
router.get('/list', listMeetings);
router.delete('/delete', deleteMeeting);
router.post('/refresh-token', refreshGoogleAccessToken); // ✅ Token Refresh Controller here


module.exports = router;