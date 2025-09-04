import { MongoClient } from 'mongodb';
import dotenv from "dotenv";


dotenv.config();

const DB_PASSWORD = process.env.MNG_DB_PASSCODE;
const DatabaseURI = `mongodb+srv://lexxovnebula:${DB_PASSWORD}@cluster0.ubcvib2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// async function DatabaseConnect(database) {
//     const client = new MongoClient(DatabaseURI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     });
//
//     try {
//         await client.connect();
//
//         const db = client.db(database);
//         return { client, db };
//     } catch (err) {
//         console.error(`Error connecting to the database: ${err.message}`, err);
//         process.exit(1);
//     }
// }
//
// export { DatabaseConnect };


// Initialize a single MongoClient instance
let client = null;

// Function to connect to MongoDB and reuse the client connection
async function DatabaseConnect(database) {
    try {
        // If the client is already connected, reuse it
        if (client) {
            const db = client.db(database);
            const clientProxy = {
                close: async () => {
                },
                db: client.db.bind(client), // Ensure db() method works
            };
            return { client: clientProxy, db };
        }

        // Create a new client and connect
        client = new MongoClient(DatabaseURI); // Removed deprecated options
        await client.connect();

        const db = client.db(database);
        // Return a client object for backward compatibility
        const clientProxy = {
            close: async () => {
                // Do nothing, as the client is managed by DatabaseConnect
            },
            db: client.db.bind(client),
        };
        return { client: clientProxy, db };
    } catch (err) {
        console.error(`Error connecting to the database: ${err.message}`, err);
        throw err; // Throw the error to the caller instead of exiting
    }
}

// Gracefully close the MongoDB client on application shutdown
function setupGracefulShutdown() {
    process.on('SIGINT', async () => {
        if (client) {
            await client.close();
        }
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        if (client) {
            await client.close();
        }
        process.exit(0);
    });
}

// Call the shutdown handler setup when the module is loaded
setupGracefulShutdown();

// Export the DatabaseConnect function
export { DatabaseConnect };








