import { Note } from "../../../../models/Note.js";

export const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1, isPinned: -1 });
    res.json({ notes });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: "Failed to fetch all notes",
      details: err.message,
    });
  }
};

export const createNote = async (req, res) => {
  const { title, content, tags = [], isPinned = false, userId } = req.body;

  try {
    const note = await Note.create({
      title,
      content,
      tags,
      isPinned,
      userId,
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({
      error: true,
      message: "Failed to create note",
      details: err.message,
    });
  }
};
