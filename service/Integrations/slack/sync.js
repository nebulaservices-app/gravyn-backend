const axios = require('axios');

const fetchSlackChannels = async (accessToken) => {
    try {
        const response = await axios.get('https://slack.com/api/conversations.list', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                types: 'public_channel',  // Optional: include private_channel if needed
                limit: 100
            }
        });

        if (response.data.ok) {
            return response.data.channels; // array of channels
        } else {
            console.error("Error fetching channels:", response.data.error);
            return [];
        }
    } catch (error) {
        console.error("Failed to fetch Slack channels:", error.message);
        return [];
    }
};