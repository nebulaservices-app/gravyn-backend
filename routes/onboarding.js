var express = require('express');
const {inviteMembers} = require("../controllers/onboardController");
var router = express.Router();

/* GET home page. */
router.post('/onboard-members/send-email', inviteMembers);

module.exports = router;
