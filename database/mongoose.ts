import mongoose from "mongoose";

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cache = global.mongooseCache;

if (!cache) {
  cache = global.mongooseCache = { conn: null, promise: null };
}

export const connectTodatabase = async () => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI must be set within .env");
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  console.log(`connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}`);
};
