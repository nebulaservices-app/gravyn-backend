// utils/MongoClient.js
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const clusterUri = process.env.MONGO_URI;

class MongoDBClient {
    constructor() {
        if (MongoDBClient.instance) {
            return MongoDBClient.instance;
        }

        if (!clusterUri) {
            throw new Error('MONGO_URI environment variable not set')
        }

        this.clusterUri = clusterUri;
        this.client = new MongoClient(this.clusterUri, {
            maxPoolSize: 20,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 30000,
        });

        this.connected = false;
        MongoDBClient.instance = this;
    }

    async connect() {
        if (!this.connected) {
            try {
                await this.client.connect();
                this.connected = true;
                console.log('🔗 MongoDB client connected');
            } catch (err) {
                console.error('❌ Failed to connect to MongoDB:', err);
                throw err;
            }
        }
    }

    async getDatabase(dbName) {
        if (!this.connected) {
            await this.connect();
        }
        return this.client.db(dbName);
    }

    async getCollection(dbName, collectionName) {
        const db = await this.getDatabase(dbName);
        return db.collection(collectionName);
    }

    async close() {
        if (this.connected) {
            await this.client.close();
            this.connected = false;
            console.log('🛑 MongoDB client connection closed')
        }
    }
}

const mongoDBClient = new MongoDBClient();

process.on('SIGINT', async () => {
    await mongoDBClient.close();
    process.exit(0);
});

module.exports = mongoDBClient;