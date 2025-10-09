import { Document, Schema, model, models, Model } from "mongoose";

export interface WatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

const WatchlistSchema = new Schema<WatchlistItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, trim: true, uppercase: true },
    company: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Compound unique index so a user can't add the same symbol twice
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const existing = (models as Record<string, Model<WatchlistItem>> | undefined)?.Watchlist;
const WatchlistModel = existing || model<WatchlistItem>("Watchlist", WatchlistSchema);

export default WatchlistModel;
