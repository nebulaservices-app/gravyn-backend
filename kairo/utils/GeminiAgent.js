// kairo/agents/GeminiAgent.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const MODEL_NAME = "gemini-1.5-flash"; // Use Gemini Flash

export class GeminiAgent {
    constructor(systemPrompt = "You are a helpful assistant.") {
        this.systemPrompt = systemPrompt;
        this.totalTokensUsed = 0;
        this.client = new GoogleGenerativeAI(process.env.GEMINI_API);
    }

    async ask(userPrompt) {
        const model = this.client.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
                topP: 0.95,
                topK: 40
            }
        });

        const chat = model.startChat({
            history: [] // Gemini Flash requires no prior messages from "system"
        });

        // Inject systemPrompt as a prefix to the user prompt
        const combinedPrompt = `${this.systemPrompt}\n\n${userPrompt}`;

        const result = await chat.sendMessage(combinedPrompt);
        const response = result?.response?.text() || "No response.";

        // Approximate token usage
        this.totalTokensUsed += Math.ceil((combinedPrompt.length + response.length) / 4);
        return response;
    }

    getTotalTokensUsed() {
        return this.totalTokensUsed;
    }

    getEstimatedCost(currency = "INR") {
        const ratePer1K = currency === "INR" ? 0.08 : 0.001; // Gemini Flash is cheaper
        return (this.totalTokensUsed / 1000) * ratePer1K;
    }
}

const Gemini = new GeminiAgent("You are Kairo, a smart project management assistant.");
const reply = await Gemini.ask("What's the purpose of a milestone?");
console.log(reply);