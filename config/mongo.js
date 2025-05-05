import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectMongo = async () => {
  // Connect to MongoDB via Mongoose
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Mongo Database 🥭");
  } catch (err) {
    console.error(`💔    MongoDB connection error: ${err}`);
    process.exit(1);
  }
};
