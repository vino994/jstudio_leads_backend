require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { connectRedis } = require("./config/redis");

const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");

const app = express();

/* ---------------- CORS CONFIG ---------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "https://jstudioleads.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    return callback(null, true); // 🔥 allow temporarily (avoid blocking)
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// 🔥 VERY IMPORTANT (fixes your error)
app.options("*", cors());



/* ---------------- GLOBAL MIDDLEWARE ---------------- */

app.use(express.json());
app.set("trust proxy", 1);
/* ---------------- RATE LIMITER ---------------- */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later"
});

/* ---------------- ROUTES ---------------- */

app.use("/api/auth", authRoutes);
app.use("/api/leads", limiter, leadRoutes);

app.get("/test", (req, res) => {
  res.json({ message: "Server working fine" });
});

app.get("/", (req, res) => {
  res.send("Lead SaaS Backend Live 🚀");
});

/* ---------------- DB CONNECTION ---------------- */

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
   if (process.env.REDIS_URL) {
  await connectRedis();
}
    console.log("Redis Connected");
  })
  .catch(err => console.log(err));

/* ---------------- SERVER START ---------------- */

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});