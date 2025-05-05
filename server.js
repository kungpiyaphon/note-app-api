import express from "express";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import apiRoutes from "./api/v1/routes.js";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import limiter from "./middleware/rateLimiter.js";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

// Global middlewares
app.use(helmet());
const corsOptions = {
  origin: ["http://localhost:5173"], // your front-end domain
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

app.use(errorHandler);
const PORT = process.env.PORT;

const db = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize the tables (users, notes)
(async () => {
  // Connect to MongoDB via Mongoose
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Mongo Database 🥭");
  } catch (err) {
    console.error(`MongoDB connection error: ${err}`);
    process.exit(1);
  }

  // Ping Turso
  try {
    await db.execute("SELECT 1");
    console.log("Checked successful communication with Turso database 🫎");
  } catch (err) {
    console.error("❌ Failed to connect to Turso:", err);
    process.exit(1);
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT, --JSON-encoded array of strings
      is_pinned INTEGER DEFAULT 0, -- 0 = false, 1 = true
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    );
  `);
})();

// CREATE a user
// app.post("/users", async (req, res) => {
//   const { name, email } = req.body;

//   if (!name || !email) {
//     return res.status(400).send("Name and email are required");
//   }

//   const result = await db.execute({
//     sql: "INSERT INTO users (name, email) VALUES (?, ?)",
//     args: [name, email],
//   });

//   res.status(201).json({
//     id: Number(result.lastInsertRowid),
//     name,
//     email,
//   });
// });

// CREATE a note
// app.post("/notes", async (req, res) => {
//   const {title, content, tags = [], is_pinned = false, user_id} = req.body;

//   if (!user_id) {
//     return res.status(400).send("User ID is required");
//   };

//   const result = await db.execute({
//     sql: `
//       INSERT INTO notes (title, content, tags, is_pinned, user_id)
//       VALUES (?,?,?,?,?)
//     `,
//     args: [title, content, JSON.stringify(tags), is_pinned ? 1:0, user_id],
//   });

//   res.status(201).json({
//     id: Number(result.lastInsertRowid),
//     title,
//     content,
//     tags,
//     is_pinned,
//     user_id,
//   });
// });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🛫`);
});
