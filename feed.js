const mongoDbClient = require('./utils/MongoClient');

async function updateAppIntegrationsWithDefaultEntities() {
    try {

        const db = await mongoDbClient.getDatabase("main")
        const AppIntegration = db.collection("appIntegrations")
        console.log("✅ Connected to MongoDB");

        // Default entities structure
        const defaultEntities = [
            {
                entityType: "",
                entityId: null, // No repo connected yet
            },
            {
                entityType: "",
                entityId: null, // No brand connected yet
            },
        ];

        const result = await AppIntegration.updateMany(
            { entities: { $exists: false } }, // Only update if entities don't exist
            { $set: { entities: defaultEntities } }
        );

        console.log(`✅ Updated ${result.modifiedCount} appIntegrations`);
    } catch (err) {
        console.error("❌ Error updating appIntegrations:", err);
    } finally {

    }
}

updateAppIntegrationsWithDefaultEntities();