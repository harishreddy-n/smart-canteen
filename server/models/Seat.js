const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
    seatNumber: String,
    row: String,
    column: Number,
    status: { type: String, enum: ["available", "occupied"], default: "available" },
    customerName: String,
    customerEmail: String,
    orderToken: Number,
    occupiedAt: Date,
    releasedAt: Date
});

module.exports = mongoose.model("Seat", seatSchema);