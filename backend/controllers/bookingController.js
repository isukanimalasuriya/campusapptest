import mongoose from "mongoose";
import { Booking } from "../models/booking.js";
import { StudySpace } from "../models/studySpace.js";
import { Table } from "../models/table.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { io } from "../index.js";

export const getMyActiveBooking = asyncHandler(async (req, res) => {
  const active = await Booking.findOne({ user: req.user.id, status: "ACTIVE" })
    .populate("space", "name location")
    .populate("table", "code type capacity availableSeats");

  return res.json({ active });
});

export const createBooking = asyncHandler(async (req, res) => {
  const { tableId, seats } = req.body;
  const seatsInt = Number(seats);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const table = await Table.findById(tableId).session(session);
    const space = await StudySpace.findById(table.space).session(session);

    if (!table || !space) return res.status(404).json({ message: "Not found" });

    if (table.availableSeats < seatsInt) {
      return res.status(409).json({ message: "Not enough seats" });
    }

    const [booking] = await Booking.create(
      [
        {
          user: req.user.id,
          space: space._id,
          table: table._id,
          seats: seatsInt,
        },
      ],
      { session },
    );

    table.availableSeats -= seatsInt;
    await table.save({ session });

    space.availableSeats -= seatsInt;
    space.recomputeStatus();
    await space.save({ session });

    await session.commitTransaction();
    session.endSession();

    //  REAL-TIME UPDATE
    io.emit("seatUpdated", {
      tableId: table._id.toString(),
      spaceId: space._id.toString(),
      availableSeats: table.availableSeats,
    });

    res.status(201).json({ booking });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

export const checkout = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findOne({
      user: req.user.id,
      status: "ACTIVE",
    }).session(session);

    if (!booking) return res.status(404).json({ message: "No booking" });

    const table = await Table.findById(booking.table).session(session);
    const space = await StudySpace.findById(booking.space).session(session);

    booking.status = "ENDED";
    booking.endedAt = new Date();
    await booking.save({ session });

    table.availableSeats += booking.seats;
    await table.save({ session });

    space.availableSeats += booking.seats;
    space.recomputeStatus();
    await space.save({ session });

    await session.commitTransaction();
    session.endSession();

    // 🔥 REAL-TIME UPDATE
    io.emit("seatUpdated", {
      tableId: table._id.toString(),
      spaceId: space._id.toString(),
      availableSeats: table.availableSeats,
    });

    res.json({ message: "Checked out" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});
