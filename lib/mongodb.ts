import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const cached: { conn: Mongoose | null; promise: Promise<Mongoose> | null } = {
  conn: null,
  promise: null,
};

async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) {
    console.log("MongoDB connected successfully from cache");
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
    console.log("MongoDB connected successfully");
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
