import { User } from "../../../../models/User.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ error: false, users });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: "Failed to fetch users",
      details: err.message,
    });
  }
};

export const createUser = async (req, res) => {
  const { name, username, password, email } = req.body;
  try {
    // prevent duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        error: true,
        message: "Email already in use!",
      });
    }
    // prevent duplicate username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        error: true,
        message: "username already in use!",
      });
    }
    // create and save new user
    const user = new User({ name, username, password, email });
    await user.save();

    res.status(201).json({
      error: false,
      user,
      message: "User created successfully!",
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: "Server error",
      details: err.message,
    });
  }
};
