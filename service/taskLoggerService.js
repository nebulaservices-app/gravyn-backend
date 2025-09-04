const { taskLogs } =  require('../config/taskConfig.js') ;

class TaskLoggerService {
    static log(taskCode, status, details) {
        // Retrieve the task log configuration based on taskCode
        const taskLogConfig = taskLogs[taskCode];
        if (!taskLogConfig) {
            throw new Error(`Invalid task code: ${taskCode}`);
        }

        // Retrieve the log details based on the status
        const logDetails = taskLogConfig[status];
        if (!logDetails) {
            throw new Error(`Invalid status: ${status} for task code: ${taskCode}`);
        }

        // Replace placeholders with actual details (like taskTitle, errorReason, etc.)
        let message = logDetails.message.replace(/{taskTitle}/g, details.taskTitle || 'Unknown Task');
        Object.keys(details).forEach((key) => {
            message = message.replace(`{${key}}`, details[key]);
        });

        // Return the log entry with task code, message, action, and status
        return {
            code: logDetails.code,    // Unique code for each log entry
            action: logDetails.action, // Description of the action performed
            message: message,          // The final log message
            status: logDetails.status, // Status of the task
        };
    }
}

module.exports =  TaskLoggerService;