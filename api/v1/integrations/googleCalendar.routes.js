const express = require('express')
const router = express.Router();
const {handleGoogleCalendarCallback, getGoogleCalendarEvents} = require('../../../integrations/google/calendar.controller')

router.get('/callback' , handleGoogleCalendarCallback )

router.get('/events', getGoogleCalendarEvents);



module.exports = router;
