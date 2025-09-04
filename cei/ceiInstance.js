
// services/ceiInstance.js
import { CEIEngine } from "./engine.js";

// ✅ Singleton instance — created once, shared across requests
export const cei = new CEIEngine();