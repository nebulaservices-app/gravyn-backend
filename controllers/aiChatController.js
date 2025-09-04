// controllers/aiChatController.js
import { cei } from "../cei/ceiInstance.js";

export const handleAIMessage = async (req, res) => {
    try {
        const { message, userId } = req.body;

        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message is required',
            });
        }

        console.log("📩 Received message:", message);

        const result = await cei.handleUserPrompt({
            prompt: message,
            sessionId: userId || "default-session"
        });



        // 🧠 Direct contextual response
        if (result?.response?.code === 'CTX-ANSWER') {
            return res.status(200).json({
                success: true,
                type: 'contextual-answer',
                message: result.response.message,
                trace: result.trace,
            });
        }

        // 🌐 Fallback response from GPI
        if (result?.message?.type === 'gpi-response') {
            return res.status(200).json({
                success: true,
                type: 'fallback',
                message: result.message.content,
                trace: result.trace,
            });
        }

        // 🧩 Ask for missing required fields
        if (result?.response?.code === 'ASK_REQUIRED_FIELDS') {
            return res.status(200).json({
                success: true,
                type: 'ask-required',
                message: result.response.message,
                missingFields: result.response.missingFields,
                trace: result.trace,
            });
        }

        // 🎯 Intent handled correctly (Task, Project, User)
        if (result?.response?.code?.startsWith("CR") || // Created
            result?.response?.code?.startsWith("AS") || // Assigned
            result?.response?.code?.startsWith("FF")) { // Fetched/Fulfilled
            return res.status(200).json({
                success: true,
                type: 'intent-handled',
                message: result.response.message || "Operation completed successfully",
                data: result.response,
                trace: result.trace,
            });
        }

        // 📦 Multiple responses (multi-agent execution)
        if (result?.type === 'multi-response') {
            return res.status(200).json({
                success: true,
                type: 'multi-response',
                results: result.results,
                trace: result.trace,
            });
        }

        // 🧩 Missing required fields fallback
        if (result?.response?.code === '00xM') {

            return res.status(200).json({
                success: false,
                type: 'missing-fields',
                message: result.response.error || "Some required information is missing.",
                missingFields: result.response.requiredFields || [],
                trace: result.trace,
            });
        }

        // ❌ Agent or known error (code-based failure)
        if (result?.response?.code === "00xE" || result?.code === "00xE") {
            return res.status(200).json({
                success: false,
                type: 'agent-error',
                message: result?.response?.message  ?  result?.response?.message  : result?.error || "Something went wrong while handling your request.",
                trace: result.trace,
            });
        }

        // 🌀 Unknown/unstructured response
        return res.status(400).json({
            success: false,
            type: 'unexpected-format',
            message: "AI returned an unexpected response format.",
            debug: result,
        });



    } catch (error) {
        console.error("❌ AI Chat Error:", error);
        return res.status(500).json({
            success: false,
            type: 'server-error',
            message: "AI processing failed. Please try again later.",
        });
    }
};