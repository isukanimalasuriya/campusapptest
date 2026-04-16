/**
 * Clears Skill Exchange collections, removes prior @skilltest.local users,
 * creates 4 test users (same password), and inserts fresh demo data.
 *
 * Usage (from backend folder): node scripts/reset-and-seed-skill-exchange.mjs
 * Requires MONGO_URI in .env
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const TEST_EMAIL_DOMAIN = "skilltest.local";
const SHARED_PASSWORD = "TestPass123!";

const usersSeed = [
  { studentId: "IT1111001", name: "Alice Host", email: `alice@${TEST_EMAIL_DOMAIN}` },
  { studentId: "IT1111002", name: "Bob Learner", email: `bob@${TEST_EMAIL_DOMAIN}` },
  { studentId: "IT1111003", name: "Carol Volunteer", email: `carol@${TEST_EMAIL_DOMAIN}` },
  { studentId: "IT1111004", name: "Dana Joiner", email: `dana@${TEST_EMAIL_DOMAIN}` },
];

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const { User } = await import("../models/user.js");
  const Skill = (await import("../models/Skill.js")).default;
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const LearningRequest = (await import("../models/LearningRequest.js")).default;
  const SkillExchangeNotification = (await import("../models/SkillExchangeNotification.js")).default;

  const skillDel = await Skill.deleteMany({});
  const reqDel = await SkillRequest.deleteMany({});
  const lrDel = await LearningRequest.deleteMany({});
  const notifDel = await SkillExchangeNotification.deleteMany({});
  console.log("Cleared Skill Exchange data:", {
    skills: skillDel.deletedCount,
    skillRequests: reqDel.deletedCount,
    learningRequests: lrDel.deletedCount,
    notifications: notifDel.deletedCount,
  });

  const userDel = await User.deleteMany({
    email: { $regex: new RegExp(`@${TEST_EMAIL_DOMAIN}$`, "i") },
  });
  console.log("Removed prior test users:", userDel.deletedCount);

  const passwordHash = await User.hashPassword(SHARED_PASSWORD);
  const users = [];
  for (const u of usersSeed) {
    const created = await User.create({
      ...u,
      passwordHash,
    });
    users.push(created);
    console.log("Created user:", created.email, created.studentId);
  }

  const [alice, bob, carol, dana] = users;

  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const publicSkill = await Skill.create({
    skillName: "React Hooks & State",
    subject: "Computer Science",
    moduleCode: "IT2020",
    description: "Hands-on session covering useState, useEffect, and custom hooks.",
    skillLevel: "Intermediate",
    mode: "Online",
    isPublic: true,
    meetingLink: "https://meet.jit.si/SmartCampus-seed-demo",
    availability: soon,
    providerName: alice.name,
    userId: alice._id,
    joinRequests: [
      {
        userId: dana._id,
        userName: dana.name,
        status: "Pending",
      },
    ],
  });

  await SkillRequest.create({
    skillId: publicSkill._id,
    problemDescription: "Need help with dependency arrays in useEffect.",
    preferredTime: soon,
    requesterName: bob.name,
    requesterId: bob._id,
    status: "Pending",
  });

  await LearningRequest.create({
    subject: "Computer Science",
    moduleCode: "IT3040",
    titleWhatIWantToLearn: "MongoDB aggregation pipelines",
    description: "Struggling with $lookup and grouping stages for coursework.",
    preferredTime: tomorrow,
    skillLevel: "Intermediate",
    mode: "Online",
    requesterName: bob.name,
    requesterId: bob._id,
    status: "Open",
    volunteers: [
      {
        userId: carol._id,
        userName: carol.name,
        message: "I scored well in IT3040 — happy to walk through aggregations.",
      },
    ],
  });

  console.log("\nDone. Test accounts (password for all):", SHARED_PASSWORD);
  console.log(
    users.map((u) => `  ${u.email}  (${u.studentId})`).join("\n"),
  );
  console.log("\nSample data: public skill + join request (Dana), help request (Bob), learning request + volunteer (Bob/Carol).");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
