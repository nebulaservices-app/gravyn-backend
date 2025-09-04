import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import querystring from "querystring";

export default class GoogleService {
    constructor(mongoClient) {
        this.mongoClient = mongoClient;
    }

    getAuthUrl(state) {
        const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const params = {
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            response_type: "code",
            scope: [
                "profile",
                "email",
                "https://www.googleapis.com/auth/calendar.events"
            ].join(" "),
            access_type: "offline",
            state: JSON.stringify(state),
            prompt: "consent"
        };

        return `${baseUrl}?${querystring.stringify(params)}`;
    }

    async exchangeCodeForTokens(code) {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: querystring.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code"
            })
        });

        const data = await response.json();
        if (data.error) throw new Error("Failed to exchange code for tokens");
        return data;
    }

    async fetchUserInfo(accessToken) {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return await response.json();
    }

    async storeIntegration({ userInfo, tokens, state }) {
        const db = await this.mongoClient.getDatabase("main");
        const usersCollection = db.collection("users");
        const projectsCollection = db.collection("projects");
        const integrationsCollection = db.collection("appIntegrations");

        const { integrationId, projectId } = state;
        const { email, name, picture } = userInfo;
        let user = await usersCollection.findOne({ email });

        if (!user) {
            const newUser = {
                email,
                name,
                picture,
                createdAt: new Date(),
                updatedAt: new Date(),
                password: ""
            };
            const result = await usersCollection.insertOne(newUser);
            user = { ...newUser, _id: result.insertedId };
        }

        // Store the Google integration
        const integrationData = {
            userId: user._id,
            projectId: new ObjectId(projectId),
            integrationId: new ObjectId(integrationId),
            app: "google",
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await integrationsCollection.updateOne(
            { userId: user._id, projectId, integrationId },
            { $set: integrationData },
            { upsert: true }
        );

        // Add user to project if not already there
        await projectsCollection.updateOne(
            { _id: new ObjectId(projectId), "users._id": { $ne: user._id } },
            {
                $addToSet: {
                    users: {
                        _id: user._id,
                        name: user.name,
                        role: "member",
                        permission: "read",
                        appIntegrations: [integrationId]
                    }
                }
            }
        );

        return user;
    }

    async handleOAuthCallback(req, res) {
        try {


        console.log("We are entering into the system")
            const code = req.query.code;
            const state = JSON.parse(req.query.state);
            const tokens = await this.exchangeCodeForTokens(code);
            const userInfo = await this.fetchUserInfo(tokens.access_token);
            const user = await this.storeIntegration({ userInfo, tokens, state });

            const token = jwt.sign(
                { _id: user._id, email: user.email, name: user.name },
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1d" }
            );

            res.cookie("authToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict",
                maxAge: 24 * 60 * 60 * 1000
            });

            res.redirect(process.env.FRONTEND_BASE_URL);
        } catch (err) {
            console.error("Google OAuth callback error:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async sendAuthUrl(req, res) {
        const { integrationId, userId, projectId } = req.query;
        const state = { integrationId, userId, projectId };
        const url = this.getAuthUrl(state);
        res.json({ authUrl: url });
    }
}