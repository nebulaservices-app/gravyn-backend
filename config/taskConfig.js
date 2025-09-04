export const taskLogs = {
    task_creation: {
        initiate: {
            code: "CMxP",  // Create Task - Pending
            action: "Task Creation Initiated",
            message: "A new task titled '{taskTitle}' has been created by the user.",
            status: "pending",
        },
        success: {
            code: "CMxS",  // Create Task - Success
            action: "Task Created",
            message: "Task '{taskTitle}' has been successfully created.",
            status: "success",
        },
        failure: {
            code: "CMxF",  // Create Task - Failure
            action: "Task Creation Failed",
            message: "Failed to create the task '{taskTitle}'. Reason: {errorReason}.",
            status: "error",
        },
        missing_fields: {
            code: "CMxI",  // Create Task - Invalid Input
            action: "Missing Fields",
            message: "Task creation failed due to missing required fields: {missingFields}.",
            status: "error",
        },
    },
    task_update: {
        initiate: {
            code: "TExP",  // Task Update - Pending
            action: "Task Update Initiated",
            message: "Task '{taskTitle}' update has been initiated by the user.",
            status: "pending",
        },
        success: {
            code: "TExS",  // Task Update - Success
            action: "Task Updated",
            message: "Task '{taskTitle}' has been updated with new details: {updatedFields}.",
            status: "success",
        },
        failure: {
            code: "TExF",  // Task Update - Failure
            action: "Task Update Failed",
            message: "Failed to update task '{taskTitle}'. Reason: {errorReason}.",
            status: "error",
        },
    },
    task_completion: {
        initiate: {
            code: "TCxP",  // Task Completion - Pending
            action: "Task Completion Initiated",
            message: "User has marked task '{taskTitle}' as completed.",
            status: "pending",
        },
        success: {
            code: "TCxS",  // Task Completion - Success
            action: "Task Completed",
            message: "Task '{taskTitle}' has been marked as completed.",
            status: "success",
        },
        failure: {
            code: "TCxF",  // Task Completion - Failure
            action: "Task Completion Failed",
            message: "Failed to mark task '{taskTitle}' as completed. Reason: {errorReason}.",
            status: "error",
        },
    },
    task_deletion: {
        initiate: {
            code: "TDxP",  // Task Deletion - Pending
            action: "Task Deletion Initiated",
            message: "User has requested to delete task '{taskTitle}'.",
            status: "pending",
        },
        success: {
            code: "TDxS",  // Task Deletion - Success
            action: "Task Deleted",
            message: "Task '{taskTitle}' has been successfully deleted.",
            status: "success",
        },
        failure: {
            code: "TDxF",  // Task Deletion - Failure
            action: "Task Deletion Failed",
            message: "Failed to delete task '{taskTitle}'. Reason: {errorReason}.",
            status: "error",
        },
    },
    task_status_update: {
        initiate: {
            code: "TSxP",  // Task Status Update - Pending
            action: "Task Status Update Initiated",
            message: "User has requested to update the status of task '{taskTitle}'.",
            status: "pending",
        },
        success: {
            code: "TSxS",  // Task Status Update - Success
            action: "Task Status Updated",
            message: "Task '{taskTitle}' status has been successfully updated to '{newStatus}'.",
            status: "success",
        },
        failure: {
            code: "TSxF",  // Task Status Update - Failure
            action: "Task Status Update Failed",
            message: "Failed to update the status of task '{taskTitle}'. Reason: {errorReason}.",
            status: "error",
        },
    },
    task_assignment: {
        initiate: {
            code: "TAxP",  // Task Assignment - Pending
            action: "Task Assignment Initiated",
            message: "User has initiated task assignment for '{taskTitle}'.",
            status: "pending",
        },
        success: {
            code: "TAxS",  // Task Assignment - Success
            action: "Task Assigned",
            message: "Task '{taskTitle}' has been assigned to {assignedTo}.",
            status: "success",
        },
        failure: {
            code: "TAxF",  // Task Assignment - Failure
            action: "Task Assignment Failed",
            message: "Failed to assign task '{taskTitle}' to {assignedTo}. Reason: {errorReason}.",
            status: "error",
        },
    },
    task_failed: {
        code: "TFxF",  // Task Failed - Failure
        action: "Task Failed",
        message: "Task '{taskTitle}' has failed. Reason: {errorReason}.",
        status: "error",
    },
    task_invalid: {
        code: "TIxI",  // Task Invalid - Invalid Input
        action: "Task Invalid",
        message: "Task '{taskTitle}' contains invalid fields: {invalidFields}.",
        status: "error",
    },
};