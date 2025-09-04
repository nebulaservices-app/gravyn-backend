var express = require('express');
var router = express.Router();
const authenticationController = require('../controllers/authController');
const {handleGoogleOAuthCallback} = require("../controllers/authController");


// 🔐 Google Login
router.post('/google', authenticationController.googleLogin);
router.get('/me' , authenticationController.isUserAuthenticated);
router.get('/google_meet/callback', authenticationController.handleGoogleOAuthCallback);
router.get('/google-meet/getUrl', authenticationController.getGoogleAuthUrl);

// ❌ Logout
// router.post('/logout', authenticationController.logout);

module.exports = router;
