// driftIQController.js

import { scanBottlenecks } from "./driftIQService.js";

import mongoDbClient from "../../utils/MongoClient.js";

// Example usage in an Express route/controller
export async function getBottleneckReport(req, res) {
    try {
        const tasks = await mongoDbClient.getDatabase("main").collection("tasks").find({ projectId: req.params.projectId }).toArray();
        const { start, end } = req.query;
        const projectStart = start ? new Date(start) : new Date(Math.min(...tasks.map(t => new Date(t.createdAt).getTime())));
        const projectEnd = end ? new Date(end) : new Date();

        const report = scanBottlenecks({
            tasks,
            projectStart,
            projectEnd,
            windowSizeDays: 7,
            stepDays: 1 // overlapping windows for higher resolution
        });

        res.json({ ok: true, report });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
}
