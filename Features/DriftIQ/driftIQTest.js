import { triggerDriftIQCheck } from './driftIQTrigger.js';

const result = await triggerDriftIQCheck("68159219cdb8524689046498");

if (result.hasDrift) {
    console.log("Drift detected!", result.drift);
    // Handle drift creation in your application
} else {
    console.log("No drift needed");
}
