// ✅ GeminiBaseAgent.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// const GOOGLE_SERVICE_GEMINI_API =  || "AIzaSyBhFRuqZouZcaMVB8uQeA1mneuijJRfqss";
const GOOGLE_SERVICE_GEMINI_API = "AIzaSyBxhBFq_c2LdbzV94nV8AMJdL8bB78H6cs"
export class GeminiBaseAgent {
    constructor(systemPrompt) {
        this.systemPrompt = systemPrompt;
        this.model = new GoogleGenerativeAI(GOOGLE_SERVICE_GEMINI_API).getGenerativeModel({
            model: "gemini-1.5-flash"  // ⬅️ use "gemini-1.5-pro" instead of "gemini-1.5-flash"
        });

        this.totalTokens = 0; // ✅ TRACK TOKENS
    }

    async sendPrompt({ prompt }) {
        const fullPrompt = `${this.systemPrompt}\n\n${prompt}`;
        const result = await this.model.generateContent(fullPrompt);
        const response = await result.response;

        const usage = result.usageMetadata || response.usageMetadata;
        if (usage?.totalTokenCount || usage?.totalTokens) {
            this.totalTokens += usage.totalTokenCount || usage.totalTokens;
        }

        return response.text();
    }

    async ask(userPrompt) {
        const fullPrompt = `${this.systemPrompt}\n\n${userPrompt}`;

        const result = await this.model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: fullPrompt }]
                }
            ]
        });

        const response = result.response;

        const usage = result.usageMetadata || response.usageMetadata;
        if (usage?.totalTokenCount || usage?.totalTokens) {
            this.totalTokens += usage.totalTokenCount || usage.totalTokens;
        }

        return response.text();
    }

    // ✅ Expected by CEIEngine
    getTotalTokensUsed() {
        return this.totalTokens;
    }

    getEstimatedCost(currency = "INR") {
        const costPerThousand = 0.008; // ₹ per 1000 tokens (Gemini Flash pricing approx)
        return (this.totalTokens / 1000 * costPerThousand).toFixed(4);
    }
}
