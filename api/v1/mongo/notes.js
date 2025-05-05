import express from "express";
import { Note } from "../../../models/Note.js";
import { addNote, createNote, deleteUserNote, editNote, getAllNotes, getNoteById, getUserNotes, searchUserNotes, togglePin } from "./controllers/notesController.js";
import { authUser } from "../../../middleware/auth.js";

const router = express.Router();

// Get all notes
router.get("/notes", getAllNotes);

// Create a notes
router.post("/notes", createNote);

// Add Note
router.post("/add-note", authUser, addNote);

// Edit Note
router.post("/edit-note/:noteId", editNote);

// Update is Pinned
router.post("/update-note-pinned/:noteId", togglePin);

// Get all notes by userId
router.get("/get-all-notes", authUser, getUserNotes);

// Delete note
router.post("/delete-note/:noteId", deleteUserNote);

// Search notes
router.get("/search-notes", authUser, searchUserNotes);

// Get a note by ID
router.get("/get-note/:noteId", authUser, getNoteById);

export default router;
