import mongoose from "mongoose";

mongoose.set("strictQuery", true);

/**
 * Establishes a resilient MongoDB connection using the provided Atlas URI.
 * Retries are delegated to MongoDB's native driver.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connection established");
  } catch (error) {
    console.error("MongoDB connection error", error);
    throw error;
  }
};

export default connectDB;
