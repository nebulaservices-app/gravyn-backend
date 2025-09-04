// test.createTask.js
import { Engine } from "./core/engine.js";
import dotenv from "dotenv";
dotenv.config();

const engine = new Engine();

async function testCreateTaskFlow() {
    const prompt = `
    Create a new task called "Design Landing Page".
    Assign it to Aryan and make it due on 5th August 2024.
    Set it as high priority and in-progress under Project Nebula Website.
  `;

    const sessionId = "test-session-create-task";

    try {
        const { response, trace } = await engine.handlePrompt(prompt, sessionId);

        console.log("Response:", JSON.stringify(response, null, 2));
        console.log("Trace:", trace.map((entry) => entry.message));
    } catch (err) {
        console.error("❌ Test failed with error:", err.message);
    }
}

testCreateTaskFlow();