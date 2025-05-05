import { Schema, model } from "mongoose";

const NoteSchema = new Schema({
    title: { type: String, require: true},
    content: { type: String, require: true },
    tags: { type: [String], default: []},
    isPinned: { type: Boolean, default: false },
    userId: { type: String, require: true},
    createdOn: { type: Date, default: new Date().getTime()}
});

export const Note = model("Note", NoteSchema);