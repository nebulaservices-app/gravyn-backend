const { ObjectId } = require("mongodb");
const mongoDBClient = require('./utils/MongoClient')
// Replace with your actual IDs!
const projectId = new ObjectId("68159219cdb8524689046498");
const userIds = [
    "6821e97f0b78b01dae9527bd",
    "68221d90e2d6a83803299798",
    "682261a534dad32c4fb247d4",
    "6822652d34dad32c4fb247d5",
    "68564c39c9b01c76fa6db939",
    "6822659534dad32c4fb247d6"
];

const realIssues = [
    {
        title: "Payment webhook fails on live Stripe charges",
        description: "Production Stripe webhook returns intermittent 502 errors, causing failed subscription activations for new customers. Impacting onboarding and revenue.",
        type: "bug",
        severity: "critical",
        status: "pending",
        triage: "auto",
        module: "Payment",
        source: "github",
        assignedTo: { type: "team", team: "Backend", users: [] },
        tags: ["payment", "stripe", "onboarding", "webhook"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-10T16:41:00Z"),
        dueDate: new Date("2025-07-13T20:00:00Z"),
        attachments: [],
        comments: [
            {
                text: "Logs show consistent 502s between 3-6am UTC.",
                author: new ObjectId(userIds[0]),
                timestamp: new Date("2025-07-10T18:02:00Z")
            }
        ],
        projectId: projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-10T16:41:00Z"), by: new ObjectId(userIds[0]) }
        ]
    },
    {
        title: "Production deploy blocked by failing e2e suite",
        description: "CI/CD pipeline halts all release jobs due to e2e_test_login flake. Devs unable to push hotfixes. Root cause unclear, started after merge #1253.",
        type: "blocker",
        severity: "severe",
        status: "pending",
        triage: "auto",
        module: "Deployments",
        source: "github",
        assignedTo: { type: "team", team: "QA", users: [] },
        tags: ["ci", "deploy-blocked", "e2e", "urgent", "release"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-21T08:30:00Z"),
        dueDate: new Date("2025-07-21T12:00:00Z"),
        attachments: [],
        comments: [],
        projectId: projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-21T08:30:00Z"), by: new ObjectId(userIds[1]) }
        ]
    },
    {
        title: "Customer: Cannot enable 2FA via mobile app",
        description: "Enterprise customer reports 'Enable two-factor' button is disabled after migration to v3.1. Replicated on iOS by QA. Security risk if not fixed before Friday.",
        type: "security",
        severity: "critical",
        status: "triaged",
        triage: "auto",
        module: "Auth",
        source: "intercom",
        assignedTo: { type: "individual", users: [userIds[2]], team: null },
        tags: ["auth", "2FA", "customer", "security"],
        ref: { type: "task", id: new ObjectId() },
        createdAt: new Date("2025-07-23T14:10:00Z"),
        dueDate: new Date("2025-07-25T18:00:00Z"),
        attachments: [],
        comments: [
            {
                text: "Will escalate to on-call if not resolved by tomorrow.",
                author: new ObjectId(userIds[3]),
                timestamp: new Date("2025-07-23T15:12:00Z")
            }
        ],
        projectId: projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-23T14:10:00Z"), by: new ObjectId(userIds[2]) }
        ]
    },
    {
        title: "Analytics dashboard slow to load in Chrome",
        description: "Dashboard users waiting >15s on main analytics page. No issues on Firefox/Edge. No errors in FE logs. Regression from last UI refactor?",
        type: "performance",
        severity: "medium",
        status: "confirmed",
        triage: "auto",
        module: "Dashboard",
        source: "internal",
        assignedTo: { type: "individual", users: [userIds[4]], team: null },
        tags: ["slow", "dashboard", "performance", "ui"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-24T07:45:00Z"),
        dueDate: new Date("2025-08-01T23:59:00Z"),
        attachments: [],
        comments: [],
        projectId: projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-24T07:45:00Z"), by: new ObjectId(userIds[4]) }
        ]
    },
    {
        title: "Feature request: Allow API key rotation from UI",
        description: "Multiple enterprise customers are requesting support for rotating API keys through the dashboard rather than through support tickets.",
        type: "improvement",
        severity: "medium",
        status: "pending",
        triage: "manual",
        module: "API",
        source: "email",
        assignedTo: { type: "team", team: "Frontend", users: [] },
        tags: ["feature", "api", "enterprise"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-20T11:00:00Z"),
        dueDate: new Date("2025-07-28T23:59:00Z"),
        attachments: [],
        comments: [],
        projectId: projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-20T11:00:00Z"), by: new ObjectId(userIds[0]) }
        ]
    },
    {
        title: "Intermittent notification emails not sent to users",
        description: "Monitoring system showed 87 notification emails failed to send last night. Affected all users on US-East-2. No clear cause in Postfix logs.",
        type: "bug",
        severity: "high",
        status: "pending",
        triage: "auto",
        module: "Notification",
        source: "internal",
        assignedTo: { type: "team", team: "DevOps", users: [] },
        tags: ["email", "notification", "outage", "us-east"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-27T03:32:00Z"),
        dueDate: new Date("2025-07-29T14:00:00Z"),
        attachments: [],
        comments: [],
        projectId: projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-27T03:32:00Z"), by: new ObjectId(userIds[1]) }
        ]
    },
    {
        title: "GitHub PR blocked: failing security check for external package",
        description: "Pull request #2347 flagged by automated security scan due to CVE-2025-1021 in 'xml2json' dependency. Blocked from merging into release branch until addressed.",
        type: "security",
        severity: "critical",
        status: "pending",
        triage: "auto",
        module: "API",
        source: "github",
        assignedTo: { type: "team", team: "Backend", users: [] },
        tags: ["security", "dependency", "blocker", "cve"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-28T12:15:00Z"),
        dueDate: new Date("2025-07-29T21:00:00Z"),
        attachments: [],
        comments: [
            {
                text: "Need to upgrade xml2json ASAP; all merges blocked.",
                author: new ObjectId(userIds[1]),
                timestamp: new Date("2025-07-28T13:11:00Z")
            }
        ],
        projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-28T12:15:00Z"), by: new ObjectId(userIds[1]) }
        ]
    },
    {
        title: "Dashboard renders blank for Japanese language users",
        description: "Multiple Intercom chats report that the analytics dashboard shows empty widgets when user locale is set to ja_JP. Suspected regression from i18n refactor.",
        type: "bug",
        severity: "medium",
        status: "triaged",
        triage: "manual",
        module: "Dashboard",
        source: "intercom",
        assignedTo: { type: "individual", users: [userIds[2]], team: null },
        tags: ["i18n", "dashboard", "UX", "customer"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-25T09:50:00Z"),
        dueDate: new Date("2025-07-30T23:59:00Z"),
        attachments: [],
        comments: [],
        projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-25T09:50:00Z"), by: new ObjectId(userIds[2]) }
        ]
    },
    {
        title: "Voice notification integration: Twilio callbacks not received",
        description: "Support agents not getting automated call triggers for overdue ticket alerts. Investigation reveals missing Twilio callback URLs after recent config push.",
        type: "integration",
        severity: "high",
        status: "confirmed",
        triage: "auto",
        module: "Notification",
        source: "internal",
        assignedTo: { type: "team", team: "DevOps", users: [] },
        tags: ["twilio", "integration", "notification", "ops"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-27T11:30:00Z"),
        dueDate: new Date("2025-07-28T19:00:00Z"),
        attachments: [],
        comments: [
            {
                text: "DevOps: Callbacks returning 404, checking reverse proxy config.",
                author: new ObjectId(userIds[5]),
                timestamp: new Date("2025-07-27T12:10:00Z")
            }
        ],
        projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-27T11:30:00Z"), by: new ObjectId(userIds[5]) }
        ]
    },
    {
        title: "PR feedback: add accessibility to project summary modal",
        description: "Reviewer notes that modal component lacks ARIA labels for screen readers. Request to add keyboard navigation, tab cycling, and contrast ratio improvements.",
        type: "improvement",
        severity: "low",
        status: "pending",
        triage: "manual",
        module: "Design",
        source: "github",
        assignedTo: { type: "individual", users: [userIds[3]], team: null },
        tags: ["a11y", "ui", "review", "feature"],
        ref: { type: "task", id: new ObjectId() },
        createdAt: new Date("2025-07-27T13:17:00Z"),
        dueDate: new Date("2025-08-05T20:00:00Z"),
        attachments: [],
        comments: [],
        projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-27T13:17:00Z"), by: new ObjectId(userIds[3]) }
        ]
    },
    {
        title: "Integration test: SSO login fails for Okta tenants",
        description: "After recent API update, SSO login for Okta-managed tenants fails with HTTP 401 error. No such errors on Auth0 or Azure. Blocker for enterprise client onboarding.",
        type: "blocker",
        severity: "severe",
        status: "pending",
        triage: "auto",
        module: "Auth",
        source: "github",
        assignedTo: { type: "team", team: "Developers", users: [] },
        tags: ["sso", "okta", "auth", "enterprise", "blocker"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-29T10:45:00Z"),
        dueDate: new Date("2025-07-29T15:00:00Z"),
        attachments: [],
        comments: [
            {
                text: "Customer launch blocked! Need urgent fix.",
                author: new ObjectId(userIds[1]),
                timestamp: new Date("2025-07-29T11:05:00Z")
            }
        ],
        projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-29T10:45:00Z"), by: new ObjectId(userIds[1]) }
        ]
    },
    {
        title: "User feedback: unclear error when uploading CSV to dashboard",
        description: "Several beta customers confused by 'Unknown error' popup when uploading malformed CSV. Request for clearer error messaging and sample CSV download.",
        type: "improvement",
        severity: "medium",
        status: "pending",
        triage: "manual",
        module: "Dashboard",
        source: "intercom",
        assignedTo: { type: "individual", users: [userIds[0]], team: null },
        tags: ["feedback", "dashboard", "csv", "usability"],
        ref: { type: "task", id: new ObjectId() },
        createdAt: new Date("2025-07-26T17:25:00Z"),
        dueDate: new Date("2025-08-02T18:00:00Z"),
        attachments: [],
        comments: [],
        projectId,
        logs: [
            { action: "created", timestamp: new Date("2025-07-26T17:25:00Z"), by: new ObjectId(userIds[0]) }
        ]
    },
    {
        title: "Tooltip missing for search icon in navbar",
        description: "The search icon on the top navigation bar lacks an explanatory tooltip for screen readers. Does not block any core flow.",
        type: "design",
        severity: "low",
        status: "pending",
        triage: "manual",
        module: "Dashboard",
        source: "internal",
        assignedTo: { type: "individual", users: [userIds[4]], team: null },
        tags: ["ui", "a11y", "minor"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-25T09:15:00Z"),
        dueDate: new Date("2025-08-05T18:00:00Z"),
        attachments: [],
        comments: [],
        projectId,
        logs: []
    },
    {
        title: "Customer feedback: confirmation message unclear after password reset",
        description: "Beta tester reports that the 'password reset successful' toast message does not clarify next steps. Not causing account access issues.",
        type: "feedback",
        severity: "low",
        status: "pending",
        triage: "auto",
        module: "Auth",
        source: "intercom",
        assignedTo: { type: "team", team: "Frontend", users: [] },
        tags: ["ux", "copy", "feedback"],
        ref: { type: "task", id: new ObjectId() },
        createdAt: new Date("2025-07-20T15:10:00Z"),
        dueDate: new Date("2025-08-01T23:59:00Z"),
        attachments: [],
        comments: [],
        projectId,
        logs: []
    },
    {
        title: "Unexpected log out after idle session (non-prod only)",
        description: "QA reports that sandbox user sessions expire after 10 minutes even when 'remember me' is checked. Not replicated in production, no user complaints.",
        type: "bug",
        severity: "medium",
        status: "confirmed",
        triage: "auto",
        module: "Auth",
        source: "internal",
        assignedTo: { type: "team", team: "QA", users: [] },
        tags: ["auth", "testing", "session"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-27T12:30:00Z"),
        dueDate: new Date("2025-08-06T12:00:00Z"),
        attachments: [],
        comments: [],
        projectId,
        logs: []
    },
    {
        title: "Minor delay in dashboard charts on slow networks",
        description: "Customer on a low-bandwidth connection observes a slight (2-3s) lag loading main dashboard KPIs. All data is eventually loaded correctly.",
        type: "performance",
        severity: "medium",
        status: "pending",
        triage: "manual",
        module: "Dashboard",
        source: "email",
        assignedTo: { type: "individual", users: [userIds[1]], team: null },
        tags: ["performance", "network", "kpi"],
        ref: { type: "project", id: projectId },
        createdAt: new Date("2025-07-29T11:10:00Z"),
        dueDate: new Date("2025-08-04T18:00:00Z"),
        attachments: [],
        comments: [],
        projectId,
        logs: []
    }
];

// Example for seeding:
const seedIssues = async () => {
    const db = await mongoDBClient.getDatabase("main");
    await db.collection("issues").insertMany(realIssues);
    console.log(`✅ Inserted ${realIssues.length} real-world project issues.`);
};

seedIssues().catch(console.error);
