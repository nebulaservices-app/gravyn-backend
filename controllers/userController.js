const mongoDBClient  = require("../utils/MongoClient");
const {ObjectId} = require("mongodb");

// @desc    Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const db = await mongoDBClient.getDatabase("main");
        const users = await db.collection("users").find().toArray();
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const db = await mongoDBClient.getDatabase("main");
        const user = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
};

// @desc    Get user by email
exports.getUserByEmail = async (req, res) => {
    try {
        const db = await mongoDBClient.getDatabase("main");
        const user = await db.collection("users").findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a new user


exports.createUser = async (req, res) => {

    try {
        const db = await mongoDBClient.getDatabase("main");
        const result = await db.collection("users").insertOne(req.body);
        res.status(201).json({ success: true, data: result.ops?.[0] || req.body });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update a user
exports.updateUser = async (req, res) => {
    try {
        const db = await mongoDBClient.getDatabase("main");
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );
        if (result.matchedCount === 0) return res.status(404).json({ success: false, message: 'User not found' });

        const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true, data: updatedUser });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};




// @desc    Get users by role
exports.getUsersByRole = async (req, res) => {
    try {
        const db = await mongoDBClient.getDatabase("main");
        const users = await db.collection("users").find({ role: req.params.role }).toArray();
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Search users by query string (e.g., name or email)
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ success: false, message: 'Query string is required' });

        const db = await mongoDBClient.getDatabase("main");
        const users = await db.collection("users").find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).toArray();

        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Paginated users
exports.getPaginatedUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const db = await mongoDBClient.getDatabase("main");
        const users = await db.collection("users").find()
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const total = await db.collection("users").countDocuments();

        res.json({
            success: true,
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: users
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get current user (needs req.user from middleware)
exports.getCurrentUser = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        const db = await mongoDBClient.getDatabase("main");
        const user = await db.collection("users").findOne({ _id: new ObjectId(req.user.id) });

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Invalid token or user ID' });
    }
};

// @desc    Partial update user
exports.partialUpdateUser = async (req, res) => {
    try {
        const db = await mongoDBClient.getDatabase("main");
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );

        if (result.matchedCount === 0) return res.status(404).json({ success: false, message: 'User not found' });

        const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true, data: updatedUser });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


// @desc    Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const db = await mongoDBClient.getDatabase("main");
        const result = await db.collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

