const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Invalid token:', err.message);
        res.status(401).json({ error: 'Unauthorized - invalid token' });
    }
};

module.exports = isAuthenticated;