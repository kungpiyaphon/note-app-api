import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../../../models/User.js";
import { createUser, getAllUsers } from "./controllers/usersController.js";

const router = express.Router();

// Get all users
router.get("/users", getAllUsers);

// Create a user
router.post("/users", createUser);

// Register a new user
router.post("/auth/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({
      error: true,
      message: "All fields are required",
    });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: true,
        message: "Email already in use.",
      });
    }
    const user = new User({ fullName, email, password });
    await user.save();

    return res.status(201).json({
      error: false,
      fullName,
      message: "User created successfully!",
    });
  } catch (err) {
    return res.status(500).json({
      error: true,
      message: "Sever error",
      details: err.message,
    });
  }
});

// Login a user
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: "Email and password are required.",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        error: true,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({
      error: false,
      token,
      message: "Login successful!",
    });
  } catch (err) {
    return res.status(500).json({
      error: true,
      message: "Server error",
      details: err.message,
    });
  }
});

export default router;
