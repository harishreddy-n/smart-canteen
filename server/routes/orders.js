const router = require("express").Router();
const Order = require("../models/Order");
const { addOrderToExcel, updateOrderStatusInExcel } = require("../services/excelWriter");
const Seat = require("../models/Seat");

let lastToken = 100;

// Generate unique code
function generateOrderCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// CREATE ORDER
// CREATE ORDER
router.post("/create", async (req, res) => {
    try {
        lastToken++;
        const orderCode = generateOrderCode();

        // Get customer name from request
        const customerName = req.body.userName || "Customer";

        const order = new Order({
            userId: null,
            userName: customerName,
            userEmail: req.body.userEmail,
            items: req.body.items,
            total: req.body.total,
            token: lastToken,
            code: orderCode,
            status: "Received"
        });

        await order.save();

        // Add to Excel file
        await addOrderToExcel({
            userEmail: req.body.userEmail,
            userName: customerName,
            token: lastToken,
            code: orderCode,
            items: req.body.items,
            total: req.body.total,
            status: "Received"
        });

        // AUTO-ASSIGN SEAT
        let assignedSeat = null;
        const availableSeat = await Seat.findOne({ status: "available" });
        
        if (availableSeat) {
            availableSeat.status = "occupied";
            availableSeat.customerName = customerName;  // ✅ Use customerName here
            availableSeat.customerEmail = req.body.userEmail;
            availableSeat.orderToken = lastToken;
            availableSeat.occupiedAt = new Date();
            await availableSeat.save();
            assignedSeat = availableSeat;
        }

        res.json({
            token: order.token,
            code: order.code,
            seat: assignedSeat,
            message: "Order created successfully"
        });

    } catch (error) {
        console.error("Order creation error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET ALL ORDERS
router.get("/all", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET ORDER BY TOKEN
router.get("/:token", async (req, res) => {
    try {
        const order = await Order.findOne({ token: req.params.token });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// UPDATE ORDER STATUS
router.put("/:token/status", async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOneAndUpdate(
            { token: req.params.token },
            { status: status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Update in Excel
        await updateOrderStatusInExcel(req.params.token, status);

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET STATISTICS
router.get("/stats/dashboard", async (req, res) => {
    try {
        const orders = await Order.find();

        let totalRevenue = 0;
        let totalOrders = orders.length;

        orders.forEach(order => {
            totalRevenue += order.total;
        });

        res.json({
            totalRevenue,
            totalOrders,
            recentOrders: orders.slice(-10).reverse()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;