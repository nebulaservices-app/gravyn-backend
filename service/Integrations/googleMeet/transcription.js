const storeTranscription = async (db, { userId, projectId, integrationInstanceId, transcriptionData }) => {
    const collection = db.collection('integrationResources');

    await collection.insertOne({
        integrationKey: 'google_meet',
        integrationInstanceId,
        resourceType: 'transcript',
        userId,
        projectId,
        data: transcriptionData,
        syncedAt: new Date()
    });
};

module.exports = { storeTranscription };