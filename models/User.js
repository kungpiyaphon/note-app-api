import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

// Create MongoDB document schema
const UserSchema = new Schema({
  fullName: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String },
  microsoftId: { type: String },
  tenantId: { type: String },
  authProvider: { type: String, enum:["local", "microsoft"],default: "local" },
  createdOn: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  // Salt
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Use schema to create model
// Mongoose will use model nam User and name our collection as users automaticcally
export const User = model("User", UserSchema);
