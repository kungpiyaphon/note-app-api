import express from "express";
import dotenv from "dotenv";
import apiRoutes from "./api/v1/routes.js";
import helmet from "helmet";
import cors from "cors";
import limiter from "./middleware/rateLimiter.js";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler.js";
import { connectMongo } from "./config/mongo.js";
import { connectTurso, db } from "./config/turso.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

// Global middlewares
app.use(helmet());
const corsOptions = {
  origin: ["http://localhost:5173","https://my-note-app-frontend.vercel.app"], // your front-end domain
  credentials: true, // allow cookies to be sent
};

app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json());
app.use(cookieParser());
app.use("/", apiRoutes(db));
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Backend Landing Page</title>
  <style>
  * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', sans-serif;
}

body {
  background: linear-gradient(to right, #2c3e50, #4ca1af);
  color: white;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.btn {
  text-decoration: none;
  background: #1abc9c;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  transition: background 0.3s ease;
}

.btn:hover {
  background: #16a085;
}
  </style>
</head>
<body>
  <div class="container">
    <h1>ยินดีต้อนรับสู่ระบบหลังบ้าน</h1>
    <p>จัดการข้อมูลได้ง่าย สะดวก และปลอดภัย</p>
    <a href="/login" class="btn">เข้าสู่ระบบ</a>
  </div>
</body>
</html>
    `);
});

// Centralized error handling
app.use(errorHandler);

const PORT = process.env.PORT;

// Initialize the tables (users, notes)
(async () => {
  try {
    await connectMongo();
    await connectTurso();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} 🛫`);
    });
  } catch (err) {
    console.error("⛔ Startup error:", err);
    process.exit(1);
  }
})();

// Handle unhandled promise rejections globally
process.on("unhandledRejection", (err) => {
  console.error("💥 Unhandled Rejection:", err.message);
  process.exit(1);
});
