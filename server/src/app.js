const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

/* =========================
   CORS CONFIG
========================= */

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, server-to-server, mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      
      "https://stc-chit-fund.vercel.app",
      "https://stc-chit-fund-4bff.vercel.app",
    ];

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* =========================
   MIDDLEWARE
========================= */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://stc-chit-fund-4bff.vercel.app",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

/* =========================
   ROUTES (SAFE LOAD)
========================= */

// Always working route
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Load other routes safely to avoid crash
const safeLoadRoute = (path, routePath) => {
  try {
    const route = require(routePath);

    if (typeof route === "function") {
      app.use(path, route);
      console.log(`Loaded route: ${path}`);
    } else {
      console.warn(`Skipped ${path} (not a router)`);
    }
  } catch (err) {
    console.warn(`Error loading ${path}:`, err.message);
  }
};

// Load all other routes safely
safeLoadRoute("/api/user", "./routes/userRoutes");
safeLoadRoute("/api/chits", "./routes/chitRoutes");
safeLoadRoute("/api/payments", "./routes/paymentRoutes");
safeLoadRoute("/api/dashboard", "./routes/dashboardRoutes");
safeLoadRoute("/api/auctions", "./routes/auctionRoutes");
safeLoadRoute("/api/admin", "./routes/adminRoutes");
safeLoadRoute("/api/notifications", "./routes/notificationRoutes");

/* =========================
   BASE ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({ msg: "STC Chit Fund API Running 🚀" });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    success: false,
    msg: err.message || "Internal server error",
  });
});

/* =========================
   EXPORT
========================= */

module.exports = app;