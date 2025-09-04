// seedTeams.js

const { ObjectId } = require('mongodb');
const mongoDbClient = require('./utils/MongoClient');

// --- CONFIGURATION ---
const PROJECT_ID = new ObjectId('68159219cdb8524689046498'); // Set your real project ObjectId!
const PROJECT_NAME = 'Time Tracker Dashboard UI - Tracy.ai';

// --- Helper: Generate 4-letter unique team code ---
function generateTeamCode(teamName, projectName) {
    const teamPart = teamName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
    const projPart = projectName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
    return teamPart + projPart; // e.g., FETA
}

// --- Team definitions ---
const teams = [
    { name: 'Frontend', description: 'Develops and maintains user-facing UI.' },
    { name: 'Backend',  description: 'Builds and manages core APIs, services, and data.' },
    { name: 'QA',       description: 'Ensures stability and quality of platform features.' },
    { name: 'DevOps',   description: 'Manages deployments, CI/CD, and system reliability.' },
];

async function seedTeams() {
    const db = await mongoDbClient.getDatabase("main");

    // Clean prior teams for this project
    await db.collection('teams').deleteMany({ projectId: PROJECT_ID });

    // Prepare and deduplicate codes if needed
    const usedCodes = new Set();
    const teamsToInsert = [];

    for (const team of teams) {
        let baseCode = generateTeamCode(team.name, PROJECT_NAME);
        let code = baseCode;
        let suffix = 1;
        // Ensure within this script's batch: no in-memory duplicate codes
        while (usedCodes.has(code) || await db.collection('teams').findOne({ projectId: PROJECT_ID, code })) {
            code = baseCode.slice(0, 3) + String(suffix); // e.g. FET1
            suffix++;
        }
        usedCodes.add(code);

        teamsToInsert.push({
            ...team,
            projectId: PROJECT_ID,
            members: [],
            code
        });
    }

    // Insert new teams
    const result = await db.collection('teams').insertMany(teamsToInsert);
    console.log(`Seeded ${result.insertedCount} teams successfully.`);
}

seedTeams().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
