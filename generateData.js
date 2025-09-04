import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import mongoDBClient from './utils/MongoClient.js'; // Import your singleton MongoDBClient

// User registration function with hashed password, workspaces, projects, and user-defined roles

async function addNewField() {
    const db = await mongoDBClient.getDatabase('main');  // Get the database from the MongoDBClient singleton
    const usersCollection = db.collection('users');  // Ensure you have a "users" collection
    const userCursor = await usersCollection.updateMany(
        {}, // match all users
        { $set: { activeTask: 10 } } // add or update the `activeTask` field to 10
    );
}
async function registerUser(userData) {
    const db = await mongoDBClient.getDatabase('main');  // Get the database from the MongoDBClient singleton
    const usersCollection = db.collection('users');  // Ensure you have a "users" collection

    // Hash the password using bcrypt before storing it
    const hashedPassword = await bcrypt.hash(userData.password, 10); // 10 rounds of salting

    try {
        // Insert the user data into the "users" collection
        const result = await usersCollection.insertOne({
            _id: new ObjectId(), // Optional: Generate a new ObjectId for the user
            name: userData.name,
            email: userData.email,
            password: hashedPassword, // Store hashed password
            createdAt: new Date(),
            updatedAt: new Date(),
            workspaces: userData.workspaces || [],  // List of workspace IDs the user is part of
            roles: userData.roles || [], // User-defined roles for the user
            projects: userData.projects || [], // List of project IDs
            settings: userData.settings || {}, // Additional settings (e.g., notification preferences, etc.)
        });

        console.log(`User registered successfully: ${result.insertedId}`);
        return result;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    } finally {
        // Ensure client connection is closed after the operation
        await mongoDBClient.close();
    }
}

// Example user data for 20 users (10 previously added + 10 new users)
const sampleUsers = [
    {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123',
        workspaces: [new ObjectId(), new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Designer', roleCode: 'DESIGNER' },
            { workspaceId: new ObjectId(), role: 'Project Manager', roleCode: 'PM' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: false } }
    },
    {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'securePassword456',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Developer', roleCode: 'DEV' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: true } }
    },
    {
        name: 'Alice Cooper',
        email: 'alice.cooper@example.com',
        password: 'securePassword789',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Designer', roleCode: 'DESIGNER' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: false, sms: true } }
    },
    {
        name: 'Bob Marley',
        email: 'bob.marley@example.com',
        password: 'securePassword101',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Developer', roleCode: 'DEV' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: false } }
    },
    {
        name: 'Emma Watson',
        email: 'emma.watson@example.com',
        password: 'securePassword102',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Project Manager', roleCode: 'PM' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: true } }
    },
    {
        name: 'Michael Scott',
        email: 'michael.scott@example.com',
        password: 'securePassword103',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Sales Representative', roleCode: 'SALES' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: false } }
    },
    {
        name: 'Nancy Drew',
        email: 'nancy.drew@example.com',
        password: 'securePassword104',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Content Writer', roleCode: 'CONTENT' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: false, sms: true } }
    },
    {
        name: 'Steve Rogers',
        email: 'steve.rogers@example.com',
        password: 'securePassword105',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Admin', roleCode: 'ADMIN' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: false } }
    },
    {
        name: 'Clark Kent',
        email: 'clark.kent@example.com',
        password: 'securePassword106',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'HR Manager', roleCode: 'HR' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: true } }
    },
    {
        name: 'Peter Parker',
        email: 'peter.parker@example.com',
        password: 'securePassword107',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'QA Tester', roleCode: 'QA' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: false, sms: true } }
    },
    // Additional users:
    {
        name: 'Tony Stark',
        email: 'tony.stark@example.com',
        password: 'securePassword108',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Developer', roleCode: 'DEV' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: false } }
    },
    {
        name: 'Bruce Wayne',
        email: 'bruce.wayne@example.com',
        password: 'securePassword109',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Designer', roleCode: 'DESIGNER' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: true } }
    },
    {
        name: 'Diana Prince',
        email: 'diana.prince@example.com',
        password: 'securePassword110',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Admin', roleCode: 'ADMIN' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: false, sms: true } }
    },
    {
        name: 'Natasha Romanoff',
        email: 'natasha.romanoff@example.com',
        password: 'securePassword111',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Content Writer', roleCode: 'CONTENT' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: true } }
    },
    {
        name: 'Stephen Strange',
        email: 'stephen.strange@example.com',
        password: 'securePassword112',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'Project Manager', roleCode: 'PM' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: false, sms: true } }
    },
    {
        name: 'Wanda Maximoff',
        email: 'wanda.maximoff@example.com',
        password: 'securePassword113',
        workspaces: [new ObjectId()],
        roles: [
            { workspaceId: new ObjectId(), role: 'QA Tester', roleCode: 'QA' }
        ],
        projects: [new ObjectId()],
        settings: { notificationPreferences: { email: true, sms: false } }
    }
];

// Registering each user
async function registerSampleUsers() {
    for (const userData of sampleUsers) {
        try {
            await registerUser(userData);
            console.log(`User ${userData.name} registered successfully.`);
        } catch (err) {
            console.error('Registration failed for', userData.name, err);
        }
    }
}

// Run the registration process for all sample users
async function run() {
    try {
        await registerSampleUsers();
        await addNewField();
    } catch (err) {
        console.error('An error occurred during user registration:', err);
    }
}

run();