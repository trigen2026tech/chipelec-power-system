const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");

console.log("========== ENV VARIABLES ==========");
console.log({
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD ? "Loaded" : "Missing"
});
console.log("==================================");


const db = require("./config/db");
const productRoutes = require("./routes/products");
const customerRoutes = require("./routes/customers");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const orderRoutes = require("./routes/orders");
const serviceRoutes = require("./routes/services");
const enquiryRoutes = require("./routes/enquiries");
const adminRoutes = require("./routes/admin");
const brandRoutes = require("./routes/brands");
const categoryRoutes = require("./routes/categories");
const installationRoutes = require("./routes/installations");
const salesRoutes = require("./routes/sales");
const serviceRequestRoutes = require("./routes/serviceRequests");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const customerAuthRoutes = require("./routes/customerAuth");


const app = express();

// Middleware
// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(xss());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));


// Routes
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/installations", installationRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/customer", customerAuthRoutes);



app.get("/", (req, res) => {
    res.send("🚀 Chipelec Power System Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});