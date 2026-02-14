const router = require("express").Router();
const Seat = require("../models/Seat");

// Initialize seats (run once)
async function initializeSeats() {
    const existingSeats = await Seat.countDocuments();
    if (existingSeats === 0) {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const seatsPerRow = 7;
        const seats = [];

        for (let row of rows) {
            for (let col = 1; col <= seatsPerRow; col++) {
                seats.push({
                    seatNumber: `${row}${col}`,
                    row: row,
                    column: col,
                    status: "available"
                });
            }
        }

        await Seat.insertMany(seats);
        console.log("✅ 56 seats initialized!");
    }
}

// Initialize on startup
initializeSeats();

// GET ALL SEATS
router.get("/all", async (req, res) => {
    try {
        const seats = await Seat.find().sort({ seatNumber: 1 });
        res.json(seats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET SEAT STATS
router.get("/stats", async (req, res) => {
    try {
        const totalSeats = await Seat.countDocuments();
        const occupiedSeats = await Seat.countDocuments({ status: "occupied" });
        const availableSeats = totalSeats - occupiedSeats;

        res.json({
            totalSeats,
            occupiedSeats,
            availableSeats,
            occupancyRate: ((occupiedSeats / totalSeats) * 100).toFixed(1)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// ASSIGN SEAT TO CUSTOMER
router.post("/assign", async (req, res) => {
    try {
        const { customerName, customerEmail, orderToken } = req.body;

        // Find first available seat
        const availableSeat = await Seat.findOne({ status: "available" });

        if (!availableSeat) {
            return res.status(400).json({ message: "No seats available" });
        }

        // Assign seat
        availableSeat.status = "occupied";
        availableSeat.customerName = customerName;
        availableSeat.customerEmail = customerEmail;
        availableSeat.orderToken = orderToken;
        availableSeat.occupiedAt = new Date();

        await availableSeat.save();

        res.json({
            message: "Seat assigned successfully",
            seat: availableSeat
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// RELEASE SEAT
router.post("/release/:seatNumber", async (req, res) => {
    try {
        const seat = await Seat.findOneAndUpdate(
            { seatNumber: req.params.seatNumber },
            {
                status: "available",
                customerName: null,
                customerEmail: null,
                orderToken: null,
                releasedAt: new Date()
            },
            { new: true }
        );

        if (!seat) {
            return res.status(404).json({ message: "Seat not found" });
        }

        res.json({ message: "Seat released", seat });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;