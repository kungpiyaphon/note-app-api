import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../../../models/User.js";
import { createUser, getAllUsers } from "./controllers/usersController.js";
import { authUser } from "../../../middleware/auth.js";
import axios from "axios";

const router = express.Router();

// Get all users for admin
router.get("/users", getAllUsers);

// Create a user for admin
router.post("/users", createUser);

// Register a new user with manual
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
    const allowedDomains = process.env.ALLOWED_DOMAINS.split(",");
    const domain = email.split("@")[1];
    if (!allowedDomains.includes(domain)) {
      return res.status(403).json({ 
        error: true, 
        message: "Email domain not allowed" 
      });
    }
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

// Login a user - jwt signed token
router.post("/auth/cookie/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: true, message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ error: true, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: true, message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // 1 hour expiration
    });

    const isProd = process.env.NODE_ENV === "production";

    // Set token in HttpOnly cookie
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProd, // only send over HTTPS in prod
      sameSite: isProd ? "none" : "lax", //helps prevent CSRF
      path: "/",
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    });

    res.status(200).json({
      error: false,
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        fullName: user.fullName,
      }, // send some safe public info if needed
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: true, message: "Server error", details: err.message });
  }
});

// Get current user profile
router.get("/auth/profile", authUser, async (req, res) => {
  const user = await User.findById(req.user.user._id).select("-password"); // exclude password
  if (!user) {
    return res.status(404).json({ error: true, message: "User not found" });
  }

  res.status(200).json({ error: false, user });
});

// LOGOUT
router.post("/auth/logout", (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// sign up with microsoft entra
router.post("/auth/microsoft/signup", async (req, res) => {
  const { accessToken } = req.body;
  try {
    const graphRes = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const { displayName, userPrincipalName, id, tenantId } = graphRes.data;
    let user = await User.findOne({ email: userPrincipalName });
    if (!user) {
      user = await User.create({
        fullName: displayName,
        email: userPrincipalName,
        microsoftId: id,
        tenantId,
        authProvider: "microsoft",
      });
      return res.status(201).json({
        error: false,
        newUser: true,
        fullName: user.fullName,
        message: "User created successfully!",
      });
    } else {
      return res.status(200).json({
        error: false,
        newUser: false,
        fullName: user.fullName,
        message: "User already registered.",
      });
    }
  } catch (err) {
    console.error("Signup error: ", err.response?.data || err.message || err);
    return res.status(500).json({
      error: true,
      message: "Microsoft signup failed",
      details: err.response?.data || err.message || err,
    });
  }
});

// sign in with microsoft entra
router.post("/auth/cookie/microsoft/signin", async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({
      error: true,
      message: "Access token is required",
    });
  }
  try {
    const graphRes = await axios.get("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const allowedDomains = process.env.ALLOWED_DOMAINS.split(",").map((d) =>
      d.trim()
    );

    const { mail, userPrincipalName, displayName } = graphRes.data;
    const email = mail || userPrincipalName;
    const domain = email.split("@")[1];

    if (!allowedDomains.includes(domain)) {
      return res.status(403).json({
        error: true,
        message: "Unauthorized account",
      });
    }

    let user = await User.findOne({ email });
    let newUser = false;
    if (!user) {
      user = await User.create({
        email,
        fullName: displayName,
        provider: "microsoft",
      });
      newUser = true;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      error: false,
      message: "Login with Microsoft successful",
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
      newUser,
    });
  } catch (err) {
    console.error("Microsoft login error: ", err.response?.data || err.message);
    res.status(500).json({
      error: true,
      message: "Failed to loin Microsoft",
      details: err.message,
    });
  }
});
export default router;
