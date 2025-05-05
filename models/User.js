import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

// Create MongoDB document schema
const UserSchema = new Schema({
  name: { type: String },
  password: { type: String, require: true },
  email: { type: String },
  createdOn: { type: Date, default: new Date().getTime() },
});

// Hash password before saving
UserSchema.pre("save",async function(next) {
  if (!this.isModified("password")) return next();
  // Salt
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Use schema to create model
// Mongoose will use model nam User and name our collection as users automaticcally
export const User = model("User", UserSchema);
