"use server";

import { connectTodatabase } from "@/database/mongoose";

export const getWatchlistSymbolsByEmail = async (
  email: string
): Promise<string[]> => {
  try {
    if (!email) return [];

    const mongoose = await connectTodatabase();
    const db = mongoose.connection.db;
    if (!db) return [];

    // find user via better-auth users collection
    type UserDoc = {
      id?: string;
      _id?: { toString(): string };
      email?: string;
    };
    const user = (await db
      .collection("user")
      .findOne({ email })) as UserDoc | null;
    if (!user) return [];

    const userId = user.id || user._id?.toString();
    if (!userId) return [];

    type WatchlistDoc = { symbol?: string };
    const watchlistItems = (await db
      .collection("watchlist")
      .find({ userId }, { projection: { symbol: 1 } })
      .toArray()) as WatchlistDoc[];

    return watchlistItems
      .map((w) => (w.symbol || "").toString().toUpperCase())
      .filter(Boolean);
  } catch (error) {
    console.log("getWatchlistSymbolsByEmail error", error);
    return [];
  }
};
