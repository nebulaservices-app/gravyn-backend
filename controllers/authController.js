import jwt from "jsonwebtoken";
import mongoDBClient from "../utils/MongoClient.js";
import {getAuthUrl} from "../service/googleOAuthService.js";
import {getTokensFromCode} from "../service/googleOAuthService.js";
import {ObjectId} from "mongodb";

export const googleLogin = async (req, res) => {
    const { tokenId: accessToken } = req.body;
    console.log("User starting.... " )

    try {
        // 1. Fetch user info from Google API using accessToken
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });





        const userInfo = await response.json();

        console.log("Getting user info " , userInfo)

        if (userInfo.error) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        const { email, name, picture, sub: googleId } = userInfo;

        // 2. Get DB reference and user collection
        const db = await mongoDBClient.getDatabase("main");
        const usersCollection = await db.collection('users')



        // Console loggin db

        // 3. Check if user already exists
        let user = await usersCollection.findOne({ email });

        console.log("User login " , user);

        if (!user) {
            // 4. Create new user object
            const newUser = {
                googleId,
                email,
                name,
                picture,
                organizations: [],
                projects: [],
                workspaces: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                password: "",
                googleTokens: {
                    accessToken,
                    refreshToken: null
                }
            };

            // 5. Insert new user into DB and assign _id
            const result = await usersCollection.insertOne(newUser);
            newUser._id = result.insertedId;
            user = newUser;
        } else {
            // 6. Update existing user's token
            await usersCollection.updateOne(
                { email },
                {
                    $set: {
                        googleTokens: { accessToken, refreshToken: null },
                        updatedAt: new Date()
                    }
                }
            );
        }

        // 7. Create JWT token
        const payload = { _id: user._id, email: user.email, name: user.name };
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

        // 8. Set cookie
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        // 9. Send user info excluding password
        const { password, ...safeUser } = user;
        res.status(200).json({ message: 'Login successful', user: safeUser });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const isUserAuthenticated = async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const db = await mongoDBClient.getDatabase("main")
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email: decoded.email });

        if (!user) return res.status(404).json({ error: 'User not found' });
        const { password , ...safeUser } = user;
        res.status(200).json({ user: safeUser });

    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
}





// Backend: Get query parameters using req.query
export const getGoogleAuthUrl = (req, res) => {
    const { integrationId, userId, projectId } = req.query;  // Retrieve from query params
    const state = { integrationId, userId, projectId };
    const authUrl = getAuthUrl(state);  // Generate Google OAuth URL
    res.json({ authUrl });
};
export const handleGoogleOAuthCallback = async (req, res) => {
    const code = req.query.code;
    let state;
    try {
        state = JSON.parse(req.query.state); // Contains userId, projectId, integrationId
    } catch (e) {
        return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const { projectId, integrationId } = state;

    if (!code || !projectId || !integrationId) {
        return res.status(400).json({ error: 'Missing code, projectId, or integrationId' });
    }

    try {
        // 1. Exchange code for tokens using the service
        const tokens = await getTokensFromCode(code);
        const { access_token, refresh_token, id_token } = tokens;

        console.log("Tokens " , JSON.stringify(tokens))

        // 2. Decode the ID token to get user info
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const userInfo = await userInfoResponse.json();

        if (!userInfo || userInfo.error) {
            return res.status(401).json({ error: 'Failed to fetch Google user info' });
        }

        const { email, name, picture, sub: googleUserId } = userInfo;

        // 3. Connect to DB
        const db = await mongoDBClient.getDatabase('main');
        const usersCollection = db.collection('users');
        const projectsCollection = db.collection('projects');
        const integrationsCollection = db.collection('appIntegrations');

        // 4. Find or create the user
        let user = await usersCollection.findOne({ email });
        if (!user) {
            const newUser = {
                email,
                name,
                picture,
                createdAt: new Date(),
                updatedAt: new Date(),
                password: "" // optional placeholder
            };
            const result = await usersCollection.insertOne(newUser);
            user = { ...newUser, _id: result.insertedId };
        }

        // 5. Save integration info to appIntegrations
        const integrationData = {
            userId: user._id,
            projectId : new ObjectId(projectId),
            integrationId : new ObjectId(integrationId),
            accessToken: access_token,
            refreshToken: refresh_token,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await integrationsCollection.updateOne(
            { userId: user._id, projectId, integrationId },
            { $set: integrationData },
            { upsert: true }
        );

        // 6. Add user reference to project if not already present
        await projectsCollection.updateOne(
            { _id: projectId, "users._id": { $ne: user._id } },
            {
                $addToSet: {
                    users: {
                        _id: user._id,
                        name: user.name,
                        role: 'member',
                        permission: 'read',
                        appIntegrations: [integrationId]
                    }
                }
            }
        );

        // 7. Set cookie with JWT and redirect
        const jwtPayload = { _id: user._id, email: user.email, name: user.name };
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:7001';
        res.redirect(`${FRONTEND_BASE_URL}`);


    } catch (error) {
        console.error('OAuth Callback Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};