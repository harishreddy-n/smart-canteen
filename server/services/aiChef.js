const Order = require("../models/Order");

const menuDB = [
    { id: 1, name: "Rice Sambar", price: 40, category: "Meals", avgDaily: 120 },
    { id: 2, name: "Mudde Meal", price: 80, category: "Meals", avgDaily: 60 },
    { id: 3, name: "Curd Rice", price: 30, category: "Meals", avgDaily: 85 },
    { id: 4, name: "Masala Dosa", price: 50, category: "Dosa", avgDaily: 150 },
    { id: 5, name: "Plain Dosa", price: 40, category: "Dosa", avgDaily: 90 },
    { id: 6, name: "Butter Masala Dosa", price: 70, category: "Dosa", avgDaily: 70 },
    { id: 7, name: "Veg Fried Rice", price: 70, category: "Chinese", avgDaily: 100 },
    { id: 8, name: "Gobi Manchurian", price: 70, category: "Chinese", avgDaily: 130 },
    { id: 9, name: "Veg Noodles", price: 70, category: "Chinese", avgDaily: 110 },
    { id: 10, name: "Samosa (2pc)", price: 20, category: "Snacks", avgDaily: 200 },
    { id: 11, name: "Veg Maggi", price: 40, category: "Snacks", avgDaily: 140 },
    { id: 12, name: "French Fries", price: 70, category: "Snacks", avgDaily: 80 },
    { id: 13, name: "Veg Cheese Sandwich", price: 40, category: "Snacks", avgDaily: 60 },
    { id: 14, name: "Watermelon Juice", price: 35, category: "Drinks", avgDaily: 90 },
    { id: 15, name: "Fruit Juice", price: 40, category: "Drinks", avgDaily: 80 },
    { id: 16, name: "Chocolate Milkshake", price: 50, category: "Drinks", avgDaily: 50 }
];

// Get traffic analysis
async function analyzeTraffic() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const ordersToday = await Order.countDocuments({
            createdAt: { $gte: today }
        });

        const dayOfWeek = today.getDay();
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        let trafficLevel = "Medium";
        let reason = "Normal day";

        if (dayOfWeek === 1) {  // Monday
            trafficLevel = "High";
            reason = "Monday Rush (+15% demand)";
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {  // Weekend
            trafficLevel = "Low";
            reason = "Weekend pattern (-15% demand)";
        }

        return {
            level: trafficLevel,
            reason: reason,
            ordersToday: ordersToday,
            dayName: dayNames[dayOfWeek]
        };
    } catch (error) {
        console.error("Traffic analysis error:", error);
        return { level: "Medium", reason: "Unable to analyze", ordersToday: 0 };
    }
}

// Get weather recommendations
function getWeatherRecommendations() {
    const date = new Date();
    const month = date.getMonth();

    let weatherFactor = "Normal";
    let recommendation = [];

    if (month >= 5 && month <= 9) {  // Rainy season
        weatherFactor = "🌧️ Rainy";
        recommendation = [
            { item: "Veg Maggi", boost: 1.3, reason: "Hot snacks popular in rain" },
            { item: "Watermelon Juice", cut: 0.6, reason: "Cold drinks less popular" }
        ];
    } else if (month >= 3 && month <= 5) {  // Hot season
        weatherFactor = "🌞 Hot";
        recommendation = [
            { item: "Fruit Juice", boost: 1.4, reason: "Cold beverages in demand" },
            { item: "Rice Sambar", cut: 0.8, reason: "Hot meals less preferred" }
        ];
    } else {  // Winter
        weatherFactor = "❄️ Cold";
        recommendation = [
            { item: "Veg Maggi", boost: 1.2, reason: "Hot snacks in winter" },
            { item: "Chocolate Milkshake", boost: 1.3, reason: "Warm beverages trending" }
        ];
    }

    return { weatherFactor, recommendation };
}

// Generate cooking plan with AI
async function generateCookingPlan() {
    try {
        const traffic = await analyzeTraffic();
        const weather = getWeatherRecommendations();

        const cookPlan = menuDB.slice(0, 8).map(item => {
            let quantity = Math.floor(item.avgDaily);
            let reason = "📊 Normal Trend";
            let adjustment = 1;

            // Apply traffic multiplier
            if (traffic.level === "High") {
                adjustment *= 1.15;
                reason = "📈 High Traffic";
            } else if (traffic.level === "Low") {
                adjustment *= 0.85;
                reason = "📉 Low Traffic";
            }

            // Apply weather adjustments
            weather.recommendation.forEach(rec => {
                if (rec.item === item.name && rec.boost) {
                    adjustment *= rec.boost;
                    reason = `🌦️ ${rec.reason}`;
                } else if (rec.item === item.name && rec.cut) {
                    adjustment *= rec.cut;
                    reason = `🌦️ ${rec.reason}`;
                }
            });

            quantity = Math.floor(quantity * adjustment * 0.95);

            return {
                id: item.id,
                name: item.name,
                avgDaily: item.avgDaily,
                recommendedQty: quantity,
                reason: reason,
                adjustment: adjustment.toFixed(2)
            };
        });

        const estimatedSavings = Math.floor(cookPlan.length * 45);

        return {
            traffic,
            weather: weather.weatherFactor,
            cookPlan,
            estimatedSavings
        };

    } catch (error) {
        console.error("Cooking plan error:", error);
        return { error: "Unable to generate plan" };
    }
}

// Analyze waste
async function analyzeWaste() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const tomorrow = new Date(yesterday);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const ordersYesterday = await Order.find({
            createdAt: { $gte: yesterday, $lt: tomorrow }
        });

        const wasteData = [];

        menuDB.forEach(item => {
            const itemOrders = ordersYesterday.filter(order =>
                order.items.some(i => i.name === item.name)
            );

            if (itemOrders.length > 0) {
                const totalSold = itemOrders.reduce((sum, order) => {
                    const qty = order.items.find(i => i.name === item.name)?.quantity || 0;
                    return sum + qty;
                }, 0);

                const estimatedCooked = Math.ceil(totalSold * 1.1);
                const wasted = estimatedCooked - totalSold;
                const wastePercentage = ((wasted / estimatedCooked) * 100).toFixed(1);

                if (totalSold > 0) {
                    wasteData.push({
                        name: item.name,
                        cooked: estimatedCooked,
                        sold: totalSold,
                        wasted: wasted,
                        wastePercentage: wastePercentage,
                        status: wastePercentage > 10 ? "⚠️ High" : "✅ Good"
                    });
                }
            }
        });

        const avgWaste = wasteData.length > 0
            ? (wasteData.reduce((sum, d) => sum + parseFloat(d.wastePercentage), 0) / wasteData.length).toFixed(1)
            : "0";

        return {
            date: yesterday.toLocaleDateString(),
            totalItems: wasteData.length,
            averageWaste: avgWaste,
            systemHealth: avgWaste > 10 ? "⚠️ High Wastage" : "✅ System Healthy",
            items: wasteData
        };

    } catch (error) {
        console.error("Waste analysis error:", error);
        return { error: "Unable to analyze waste" };
    }
}

module.exports = {
    generateCookingPlan,
    analyzeWaste,
    analyzeTraffic,
    getWeatherRecommendations
};