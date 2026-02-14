const router = require("express").Router();
const Order = require("../models/Order");
const { generateCookingPlan, analyzeWaste } = require("../services/aiChef");

// GET COMPLETE DASHBOARD DATA
router.get("/dashboard", async (req, res) => {
    try {
        const orders = await Order.find();

        // Calculate stats
        let totalRevenue = 0;
        let totalOrders = orders.length;
        let itemsSold = {};

        orders.forEach(order => {
            totalRevenue += order.total;
            order.items.forEach(item => {
                if (!itemsSold[item.name]) {
                    itemsSold[item.name] = { quantity: 0, revenue: 0 };
                }
                itemsSold[item.name].quantity += item.quantity;
                itemsSold[item.name].revenue += item.price * item.quantity;
            });
        });

        // Get top selling items
        const topItems = Object.entries(itemsSold)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 5)
            .map(([name, data]) => ({
                name,
                quantity: data.quantity,
                revenue: data.revenue
            }));

        // Get AI recommendations
        const cookingPlan = await generateCookingPlan();
        const wasteAnalysis = await analyzeWaste();

        res.json({
            stats: {
                totalRevenue,
                totalOrders,
                topItems
            },
            aiChef: cookingPlan,
            waste: wasteAnalysis,
            recentOrders: orders.slice(-10).reverse()
        });

    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;