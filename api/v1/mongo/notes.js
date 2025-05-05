import express from "express";
import { Note } from "../../../models/Note.js";
import { createNote, getAllNotes } from "./controllers/notesController.js";
import { authUser } from "../../../middleware/auth.js";

const router = express.Router();

// Get all notes
router.get("/notes", getAllNotes);

// Create a notes
router.post("/notes", createNote);

// Add Note
router.post("/add-note", authUser, async (req, res) => {
  const { title, content, tags = [], isPinned = false } = req.body;
  const { user } = req.user;

  if (!title || !content) {
    res.status(400).json({
      error: true,
      message: "All fields required!",
    });
  }

  if (!user || !user._id) {
    res.status(400).json({
      error: true,
      message: "Invalid user credentials!",
    });
  }

  try {
    const note = await Note.create({
      title,
      content,
      tags,
      isPinned,
      userId: user._id,
    });

    await note.save();
    res.json({
      error: false,
      note,
      message: "Note added successfully!",
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Edit Note
router.post("/edit-note/:noteId", async (req, res) => {});

// Update is Pinned
router.post("/update-note-pinned/:noteId", async (req, res) => {});

// Get all notes by userId
router.get("/get-all-notes", authUser, async (req, res) => {
  const { user } = req.user;
  try {
    const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });
    res.json({
      error: false,
      notes,
      message: "All notes retrieved!",
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Delete note
router.post("/delete-note/:noteId", async (req, res) => {});

// Search notes
router.get("/search-notes", authUser, async (req, res) => {
  const { user } = req.user;
  const { query } = req.query;
  if (!query) {
    res.status(400).json({
      error: true,
      message: "Search query is required!",
    });
  }

  try {
    const matchingNotes = await Note.find({
      userId: user._id,
      $or: [
        { title: { $regex: new RegExp(query, "i") } },
        { content: { $regex: new RegExp(query, "i") } },
      ],
    });

    res.json({
      error: false,
      notes: matchingNotes,
      message: "Notes matching the search query retrieved success!",
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

export default router;
