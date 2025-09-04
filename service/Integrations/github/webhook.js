const storeWebhookEvent = async (db, payload, { userId, projectId, integrationInstanceId, eventType }) => {
    const collection = db.collection('integrationResources');

    await collection.insertOne({
        integrationKey: 'github',
        integrationInstanceId,
        resourceType: 'webhook_event',
        userId,
        projectId,
        eventType,
        resourceId: payload?.id || `${Date.now()}-${Math.random()}`,
        data: payload,
        syncedAt: new Date()
    });
};

module.exports = { storeWebhookEvent };