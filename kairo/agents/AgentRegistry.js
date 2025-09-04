// kairo/agents/registry.js

import { TaskCreator } from "../microagents/Task/Creator.js";
import { TaskUpdater } from "../microagents/Task/Updater.js";
import { TaskFetcher } from "../microagents/Task/Fetcher.js";

import { UserHandler } from "../microagents/User/Handler.js";
import { ProjectHandler } from "../microagents/Project/Handler.js";

export const AgentRegistry = {
    Task: {
        create: TaskCreator,
        update: TaskUpdater,
        fetch: TaskFetcher
    },
    User: {
        fetch: UserHandler
    },
    Project: {
        fetch: ProjectHandler
    }
};