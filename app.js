// app.js

// --- ✅ USE ESM 'import' SYNTAX FOR ALL MODULES ---
import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import mongoDbClient from "./utils/MongoClient.js";

// --- ✅ IMPORT ALL ROUTERS USING ESM SYNTAX (with .js extension) ---
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import authenticationRouter from './routes/authentication.js';
import OnboardingRouter from './routes/onboarding.js';
import workspaceRoutes from './routes/workspacesRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoute.js';
import integrationRoutes from './api/v1/integration/integrationRoutes.js';
import slackRoutes from './api/v1/rIntegration/slack.js';
import githubRoutes from './api/v1/integrations/github.routes.js';
import googleMeetRoutes from './api/v1/rIntegration/googleMeetRoutes.js';
import appIntegrationRoutes from "./api/v1/AppIntegration/AppIntegrationRoutes.js";
import issueRoutes from "./api/v1/Issues/issuesRoutes.js";
import aiTriageRoutes from "./api/v1/aiTriageRoutes.js";
import googleCalendarRoutes from './api/v1/integrations/googleCalendar.routes.js';
import roomRoutes  from './api/v1/roomRoutes.js';
import messageRoutes from "./api/v1/messageRoutes.js";
import chatRoutes from './api/v1/comm/chat.routes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// --- Middleware Setup ---

// Use morgan logger in development
app.use(logger('dev'));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Parse cookies
app.use(cookieParser());

// CORS configuration (only needs to be set once)
app.use(cors({
    origin: "http://localhost:7001", // Your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// --- ✅ MOUNT ALL ROUTERS ---
app.use('/', indexRouter);
app.use('/api/v1/users', usersRouter);
app.use('/auth', authenticationRouter);
app.use('/onboarding' , OnboardingRouter);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/projects", projectRoutes)
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/issues", issueRoutes)
app.use("/api/v1/integration", integrationRoutes);
app.use("/api/v1/slack", slackRoutes);
app.use('/api/v1/google_meet', googleMeetRoutes);
app.use("/api/v1/app-integrations", appIntegrationRoutes)
app.use("/api/v1/aitriage", aiTriageRoutes);
app.use('/api/v1/google_calendar', googleCalendarRoutes);
app.use('/api/v1/github', githubRoutes);

// Communication and Messaging Routes
app.use('/api/v1/comm/chat', chatRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use("/api/v1/messages", messageRoutes);

// --- ✅ USE 'export default' TO EXPORT THE APP INSTANCE ---
export default app;
