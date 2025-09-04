// /controllers/googleMeetController.js
const googleMeetService = require('../service/googleMeetService');

const createGoogleMeet = async (req, res) => {
    const { summary, description, start, end } = req.body;

    // Check if user is authenticated
    if (!req.session.tokens) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const result = await googleMeetService.createGoogleMeet(req.session.tokens, { summary, description, start, end });
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createGoogleMeet,
};