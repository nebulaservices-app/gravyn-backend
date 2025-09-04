const { ObjectId } = require("mongodb");
const mongoClient = require('./utils/MongoClient');

const projectId = new ObjectId("68159219cdb8524689046498");

const teamMembers = [
  { _id: new ObjectId("6821e97f0b78b01dae9527bd"), name: "Nebula" },
  { _id: new ObjectId("682261a534dad32c4fb247d4"), name: "ignixOP" },
  { _id: new ObjectId("687e9bed062bfaac21f96c6d"), name: "Stephen McLaugh" }
];

// Helper to generate random future date within next 30 days
function randomDate() {
  return new Date(Date.now() + Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
}

async function seedRooms() {
  const db = await mongoClient.getDatabase("main");

  // Clear old rooms for this project (optional)
  await db.collection("rooms").deleteMany({ projectId });

  // Seed Channels - consistent fields and ObjectId participants
  const channels = [
    {
      name: "General",
      type: "channel",
      participants: teamMembers.map(u => u._id),
      projectId,
      parentRoomId: null,
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {}
    },
    {
      name: "Development",
      type: "channel",
      participants: teamMembers.map(u => u._id),
      projectId,
      parentRoomId: null,
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {}
    }
  ];

  const insertChannels = await db.collection("Rooms").insertMany(channels);
  const generalChannelId = insertChannels.insertedIds[0];
  const devChannelId = insertChannels.insertedIds[1];

  // Seed DMs for every pair of team members
  const dmPairs = [
    [teamMembers[0], teamMembers[1]],
    [teamMembers[0], teamMembers[2]],
    [teamMembers[1], teamMembers[2]]
  ];

  const dmRooms = dmPairs.map(([userA, userB]) => ({
    name: `${userA.name} ↔ ${userB.name}`,
    type: "private/dm",
    participants: [userA._id, userB._id],
    projectId,
    parentRoomId: null,
    lastMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    config: {}
  }));

  const insertDMs = await db.collection("Rooms").insertMany(dmRooms);
  const dmIds = Object.values(insertDMs.insertedIds);

  // Seed Threads with consistent structure
  const threads = [
    {
      name: "Weekly sync",
      type: "thread",
      participants: teamMembers.map(u => u._id),
      projectId,
      parentRoomId: generalChannelId,
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {}
    },
    {
      name: "UI Polish",
      type: "thread",
      participants: teamMembers.slice(0, 2).map(u => u._id),
      projectId,
      parentRoomId: generalChannelId,
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {}
    },
    {
      name: "Bug fixes",
      type: "thread",
      participants: teamMembers.map(u => u._id),
      projectId,
      parentRoomId: devChannelId,
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {}
    },
    {
      name: "Pricing discussion",
      type: "thread",
      participants: [teamMembers[0]._id, teamMembers[1]._id],
      projectId,
      parentRoomId: dmIds[0],
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {}
    },
    {
      name: "Design specs",
      type: "thread",
      participants: [teamMembers[1]._id, teamMembers[2]._id],
      projectId,
      parentRoomId: dmIds[2],
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {}
    }
  ];

  await db.collection("Rooms").insertMany(threads);

  console.log("✅ Seeded channels, DMs, and threads.");
}

seedRooms().catch(console.error);
