// --- API CONFIGURATION ---
const API_URL = "http://localhost:5000/api";

// --- MENU DATABASE ---
const menuDB = [
    { id: 1, name: "Rice Sambar", price: 40, icon: "🍛", category: "Meals" },
    { id: 2, name: "Mudde Meal", price: 80, icon: "🍘", category: "Meals" },
    { id: 3, name: "Curd Rice", price: 30, icon: "🍚", category: "Meals" },
    { id: 4, name: "Masala Dosa", price: 50, icon: "🥞", category: "Dosa" },
    { id: 5, name: "Plain Dosa", price: 40, icon: "🧇", category: "Dosa" },
    { id: 6, name: "Butter Masala Dosa", price: 70, icon: "🧈", category: "Dosa" },
    { id: 7, name: "Veg Fried Rice", price: 70, icon: "🥡", category: "Chinese" },
    { id: 8, name: "Gobi Manchurian", price: 70, icon: "🥦", category: "Chinese" },
    { id: 9, name: "Veg Noodles", price: 70, icon: "🍜", category: "Chinese" },
    { id: 10, name: "Samosa (2pc)", price: 20, icon: "🥟", category: "Snacks" },
    { id: 11, name: "Veg Maggi", price: 40, icon: "🍜", category: "Snacks" },
    { id: 12, name: "French Fries", price: 70, icon: "🍟", category: "Snacks" },
    { id: 13, name: "Veg Cheese Sandwich", price: 40, icon: "🥪", category: "Snacks" },
    { id: 14, name: "Watermelon Juice", price: 35, icon: "🍉", category: "Drinks" },
    { id: 15, name: "Fruit Juice", price: 40, icon: "🥤", category: "Drinks" },
    { id: 16, name: "Chocolate Milkshake", price: 50, icon: "🍫", category: "Drinks" }
];

// --- STATE ---
let cart = {};
let currentUser = null;
let currentToken = null;
let currentRole = "user";
let currentUserName = null;  // ADD THIS

// --- INIT ---
window.onload = function() {
    checkAuth();
};

// --- AUTH ---
function toggleAuthForm() {
    document.getElementById("login-form").classList.toggle("active");
    document.getElementById("register-form").classList.toggle("active");
}

function showAuthMessage(message, type) {
    const messageEl = document.getElementById("auth-message");
    messageEl.innerText = message;
    messageEl.className = `auth-message ${type}`;
}

async function handleRegister() {
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();

    if(!name || !email || !password) {
        showAuthMessage("❌ All fields required", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        if(!response.ok) {
            showAuthMessage(`❌ ${data.message}`, "error");
            return;
        }

        showAuthMessage("✅ Registration successful!", "success");
        setTimeout(() => toggleAuthForm(), 1500);

    } catch (error) {
        showAuthMessage("❌ Connection error", "error");
    }
}

async function handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if(!email || !password) {
        showAuthMessage("❌ Email and password required", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if(!response.ok) {
            showAuthMessage(`❌ ${data.message}`, "error");
            return;
        }

        currentToken = data.token;
        localStorage.setItem("token", data.token);
        
        // ✅ Store BOTH email and name
        currentUser = email;
        currentUserName = data.name;  // Get name from backend
        localStorage.setItem("userName", data.name);
        
        if(email === "admin@ecocanteen.com") {
            currentRole = "admin";
            switchView("admin-view");
            loadAdminDashboard();
        } else {
            currentRole = "user";
            switchView("user-view");
            renderMenu();
        }

        document.getElementById("login-email").value = "";
        document.getElementById("login-password").value = "";

    } catch (error) {
        showAuthMessage("❌ Connection error", "error");
    }
}

function handleLogout() {
    localStorage.removeItem("token");
    currentToken = null;
    currentUser = null;
    cart = {};
    
    switchView("auth-view");
    document.getElementById("login-form").classList.add("active");
    document.getElementById("register-form").classList.remove("active");
}

function checkAuth() {
    const token = localStorage.getItem("token");
    if(token) {
        currentToken = token;
        switchView("user-view");
        renderMenu();
    } else {
        switchView("auth-view");
    }
}

// --- MENU ---
function renderMenu() {
    const container = document.getElementById("menu-container");
    container.innerHTML = "";
    
    const categories = ["Meals", "Dosa", "Chinese", "Snacks", "Drinks"];
    
    categories.forEach(cat => {
        const items = menuDB.filter(i => i.category === cat);
        
        if(items.length > 0) {
            container.innerHTML += `<div class="category-title">${cat}</div>`;
            
            let grid = `<div class="menu-grid">`;
            
            items.forEach(item => {
                const qty = cart[item.id] || 0;
                let btn = qty === 0 
                    ? `<button class="add-btn" onclick="updateCart(${item.id}, 1)">ADD</button>` 
                    : `<div class="qty-controls"><button class="qty-btn" onclick="updateCart(${item.id}, -1)">−</button><span>${qty}</span><button class="qty-btn" onclick="updateCart(${item.id}, 1)">+</button></div>`;
                
                grid += `
                    <div class="food-card">
                        <div class="food-img">${item.icon}</div>
                        <div class="food-title">${item.name}</div>
                        <div class="food-price">₹${item.price}</div>
                        <div style="margin-top:auto">${btn}</div>
                    </div>
                `;
            });
            
            grid += `</div>`;
            container.innerHTML += grid;
        }
    });
}

function updateCart(id, change) {
    if(!cart[id]) cart[id] = 0;
    cart[id] += change;
    if(cart[id] <= 0) delete cart[id];
    
    renderMenu();
    updateCartBar();
}

function updateCartBar() {
    let total = 0;
    let count = 0;
    
    for(let id in cart) {
        const item = menuDB.find(x => x.id == id);
        total += item.price * cart[id];
        count += cart[id];
    }
    
    document.getElementById("total-price").innerText = total;
    
    const bar = document.getElementById("cart-bar");
    if(count > 0) {
        bar.classList.add("visible");
    } else {
        bar.classList.remove("visible");
    }
}

// --- PAYMENT ---
function initiatePayment() {
    const total = document.getElementById("total-price").innerText;
    if(confirm(`Pay ₹${total}?`)) {
        setTimeout(() => {
            completeOrder(total);
        }, 1000);
    }
}

async function completeOrder(amount) {
    const orderItems = [];
    for(let id in cart) {
        const item = menuDB.find(x => x.id == id);
        orderItems.push({
            name: item.name,
            price: item.price,
            quantity: cart[id],
            icon: item.icon,
            category: item.category
        });
    }

    try {
        const response = await fetch(`${API_URL}/orders/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                userId: currentUser,
                userName: currentUser,  // ✅ This is the customer name (email)
                userEmail: currentUser,
                items: orderItems,
                total: parseInt(amount)
            })
        });

        const order = await response.json();

        if(!response.ok) {
            alert("Error creating order");
            return;
        }

        // Show token and code
        document.getElementById("token-number").innerText = `#${order.token}`;
        document.getElementById("order-code").innerText = order.code;
        
        // Show seat info if assigned
        if (order.seat) {
            console.log("Seat assigned:", order.seat.seatNumber);
        }
        
        document.getElementById("cart-bar").classList.remove("visible");
        switchView("token-view");
        startLiveTracker();
        
        cart = {};

    } catch (error) {
        console.error("Order error:", error);
        alert("Failed to create order");
    }
}

// --- TRACKER ---
function startLiveTracker() {
    const fill = document.getElementById("progress-fill");
    const s1 = document.getElementById("step-1");
    const s2 = document.getElementById("step-2");
    const s3 = document.getElementById("step-3");
    const txt = document.getElementById("live-status-text");
    const btn = document.getElementById("new-order-btn");
    
    fill.style.width = "0%";
    s1.classList.add("active");
    s2.classList.remove("active");
    s3.classList.remove("active");
    txt.innerText = "Order Received 📄";
    txt.style.color = "#374151";
    btn.style.display = "none";

    setTimeout(() => {
        fill.style.width = "50%";
        s2.classList.add("active");
        txt.innerText = "Chef is Preparing... 🔥";
    }, 3000);

    setTimeout(() => {
        fill.style.width = "100%";
        s3.classList.add("active");
        txt.innerText = "Ready to Collect! ✅";
        txt.style.color = "var(--primary)";
        btn.style.display = "inline-block";
    }, 10000);
}

// --- ADMIN ---
async function loadAdminDashboard() {
    try {
        const response = await fetch(`${API_URL}/orders/stats/dashboard`, {
            headers: {
                "Authorization": `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        document.getElementById("total-revenue").innerText = "₹" + data.totalRevenue;
        document.getElementById("total-orders").innerText = data.totalOrders;

        // Show recent orders
        const tbody = document.getElementById("orders-table-body");
        tbody.innerHTML = "";
        
        data.recentOrders.forEach(order => {
            const itemNames = order.items.map(i => i.name).join(", ");
            const time = new Date(order.createdAt).toLocaleTimeString();
            
            tbody.innerHTML += `
                <tr>
                    <td><b>#${order.token}</b></td>
                    <td><span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">${order.code}</span></td>
                    <td>${order.userName}</td>
                    <td>${itemNames}</td>
                    <td>₹${order.total}</td>
                    <td>${order.status}</td>
                    <td>${time}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

function refreshAdmin() {
    loadAdminDashboard();
}

// --- UTILS ---
function switchView(viewId) {
    document.querySelectorAll(".view-section").forEach(el => {
        el.classList.remove("active");
    });
    document.getElementById(viewId).classList.add("active");
}

function resetApp() {
    cart = {};
    renderMenu();
    switchView("user-view");
}
// --- SEAT MANAGEMENT ---
async function loadSeats() {
    try {
        const response = await fetch(`${API_URL}/seats/all`, {
            headers: {
                "Authorization": `Bearer ${currentToken}`
            }
        });

        const seats = await response.json();

        // Get stats
        const stats = await fetch(`${API_URL}/seats/stats`, {
            headers: {
                "Authorization": `Bearer ${currentToken}`
            }
        }).then(r => r.json());

        // Update stats
        document.getElementById("available-seats").innerText = stats.availableSeats;
        document.getElementById("occupied-seats").innerText = stats.occupiedSeats;

        // Render seat chart
        renderSeatChart(seats);

        // Render customer list
        renderCustomerList(seats);

    } catch (error) {
        console.error("Seats load error:", error);
    }
}

function renderSeatChart(seats) {
    const chart = document.getElementById("seat-chart");
    chart.innerHTML = "";

    // Group seats by row
    const rows = {};
    seats.forEach(seat => {
        if (!rows[seat.row]) {
            rows[seat.row] = [];
        }
        rows[seat.row].push(seat);
    });

    // Sort rows alphabetically
    Object.keys(rows).sort().forEach(row => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "seat-row";

        // Row label
        const label = document.createElement("div");
        label.className = "seat-row-label";
        label.innerText = row;
        rowDiv.appendChild(label);

        // Seats in row
        const seatsDiv = document.createElement("div");
        seatsDiv.className = "seat-row-seats";

        rows[row].forEach(seat => {
            const seatDiv = document.createElement("div");
            seatDiv.className = `seat-box ${seat.status === "occupied" ? "occupied-seat" : "available-seat"}`;
            seatDiv.innerText = seat.column;
            
            // Show customer name on hover
            if (seat.status === "occupied") {
                seatDiv.title = seat.customerName || "Occupied";
            }

            seatsDiv.appendChild(seatDiv);
        });

        rowDiv.appendChild(seatsDiv);
        chart.appendChild(rowDiv);
    });
}

function renderCustomerList(seats) {
    const content = document.getElementById("customer-list-content");
    content.innerHTML = "";

    const occupiedSeats = seats.filter(s => s.status === "occupied");

    if (occupiedSeats.length === 0) {
        content.innerHTML = "<p style='text-align: center; color: #6b7280; grid-column: 1/-1;'>No customers seated yet</p>";
        return;
    }

    occupiedSeats.forEach(seat => {
        const card = document.createElement("div");
        card.className = "customer-card";
        card.innerHTML = `
            <div class="seat-num">${seat.seatNumber}</div>
            <div class="customer-name">${seat.customerName}</div>
        `;
        content.appendChild(card);
    });
}

function goBackToOrder() {
    switchView("user-view");
    renderMenu();
}

// Load seats when viewing
function viewSeats() {
    switchView("seat-view");
    loadSeats();
}