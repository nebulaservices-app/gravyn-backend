const { v4: uuidv4 } = require("uuid");
const { faker } = require("@faker-js/faker");
const mongoDBClient = require("./utils/MongoClient");
const {ObjectId} = require("mongodb"); // Adjust path

const createMockTasks = (projectId, userIds = []) => {
    const statuses = [
        "backlog",
        "pending",
        "in_progress",
        "under_review",
        "blocked",
        "completed",
        "cancelled"
    ];
    const priorities = ["low", "medium", "high" , "emergency"];
    const taskCategories = ["feature", "chore", "enhancement"]; // removed 'bug'

    const tasks = [];

    for (let i = 0; i < 70; i++) {

        const createdAt = faker.date.between({ from: new Date("2025-03-01"), to: new Date("2025-05-01") });
        const dueDate = faker.date.between({ from: new Date("2025-05-02"), to: new Date("2025-06-30") });
        const startedAt = faker.date.between({ from: createdAt, to: dueDate });

        const completedAt = faker.helpers.arrayElement([
            faker.date.between({ from: startedAt, to: dueDate }),
            null
        ]);

        const task = {
            title: faker.hacker.phrase(),
            description: faker.lorem.sentences(2),
            projectId : new ObjectId(projectId),
            assignedTo: new ObjectId(faker.helpers.arrayElement(userIds)),
            status: faker.helpers.arrayElement(statuses),
            priority: faker.helpers.arrayElement(priorities),
            category: faker.helpers.arrayElement(taskCategories),

            createdAt,
            startedAt,
            dueDate,
            completedAt,

            subtasks: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
                id: uuidv4(),
                name: `${faker.hacker.verb()} ${faker.hacker.noun()}`,
                status: faker.helpers.arrayElement([
                    "todo",
                    "in_progress",
                    "blocked",
                    "completed",
                    "cancelled"
                ])
            })),

            issues: faker.datatype.boolean() ? [faker.hacker.noun()] : [],
            comments: faker.datatype.boolean() ? [faker.lorem.sentence()] : [],
            attachments: faker.datatype.boolean() ? [faker.internet.url()] : [],
            logs: [
                {
                    timestamp: createdAt,
                    action: "created",
                    by: faker.helpers.arrayElement(userIds),
                },
                {
                    timestamp: startedAt,
                    action: "started",
                    by: faker.helpers.arrayElement(userIds),
                },
                ...(completedAt
                    ? [
                        {
                            timestamp: completedAt,
                            action: "completed",
                            by: faker.helpers.arrayElement(userIds),
                        },
                    ]
                    : []),
            ],
        };

        tasks.push(task);
    }

    return tasks;
};

const seedTasks = async () => {
    const db = await mongoDBClient.getDatabase("main");
    const collection = db.collection("tasks");

    const projectId = "68159219cdb8524689046498";
    const userIds = [
        "6821e97f0b78b01dae9527bd",
        "68221d90e2d6a83803299798",
        "682261a534dad32c4fb247d4",
        "6822652d34dad32c4fb247d5",
        "68564c39c9b01c76fa6db939",
        "6822659534dad32c4fb247d6"
    ];

    const mockTasks = createMockTasks(projectId, userIds);

    await collection.insertMany(mockTasks);
    console.log("✅ 40 mock tasks inserted.");
};

seedTasks().catch(console.error);