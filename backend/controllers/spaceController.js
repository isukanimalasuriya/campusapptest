import { StudySpace } from "../models/studySpace.js";
import { Table } from "../models/table.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

//Create Study Space
export const createSpace = asyncHandler(async (req, res) => {
  const { name, location, totalSeats } = req.body;
  const total = Number(totalSeats);

  if (!name || !location || !Number.isFinite(total) || total < 0) {
    return res.status(400).json({
      message: "name, location, and totalSeats (0 or greater) are required",
    });
  }

  const space = await StudySpace.create({
    name,
    location,
    totalSeats: total,
    availableSeats: total,
  });

  res.status(201).json(space);
});

//create table in a study space
export const createTable = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const { code, type, capacity } = req.body;

  if (!code || !type || !capacity) {
    return res.status(400).json({
      message: "code, type, capacity are required",
    });
  }

  const space = await StudySpace.findById(spaceId);
  if (!space) {
    return res.status(404).json({ message: "Study space not found" });
  }

  // Create table
  const table = await Table.create({
    space: spaceId,
    code,
    type,
    capacity,
    availableSeats: capacity,
  });

  // Update space seat counts
  space.totalSeats += capacity;
  space.availableSeats += capacity;
  space.recomputeStatus();
  await space.save();

  res.status(201).json(table);
});

export const listSpacess = asyncHandler(async (req, res) => {
  const spaces = await StudySpace.find().sort({ name: 1 });
  return res.json({ spaces });
});

export const getSpaceTables = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;

  const space = await StudySpace.findById(spaceId);
  if (!space) return res.status(404).json({ message: "Study space not found" });

  const tables = await Table.find({ space: spaceId }).sort({ code: 1 });
  return res.json({ space, tables });
});

export const listSpaces = asyncHandler(async (req, res) => {
  const spaces = await StudySpace.find().sort({ name: 1 }).lean();

  // For each space, count GROUP and SINGLE tables
  const spacesWithCounts = await Promise.all(
    spaces.map(async (space) => {
      const [groupTables, singleTables] = await Promise.all([
        Table.countDocuments({ space: space._id, type: "GROUP" }),
        Table.countDocuments({ space: space._id, type: "SINGLE" }),
      ]);
      return { ...space, groupTables, singleTables };
    }),
  );

  return res.json({ spaces: spacesWithCounts });
});

export const deleteSpace = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;

  const space = await StudySpace.findById(spaceId);
  if (!space) return res.status(404).json({ message: "Study space not found" });

  // Delete all tables belonging to this space first
  await Table.deleteMany({ space: spaceId });

  await space.deleteOne();

  res.json({ message: "Study space and its tables deleted successfully" });
});
