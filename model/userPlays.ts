// model/userPlays.ts
import { Schema, model, models } from "mongoose";

const UserPlaySchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    wallet: {
      type: String,
      required: true,
      unique: true,
    },
    playsLeft: {
      type: Number,
      default: 4,
    },
    lastPlay: {
      type: Date,
      default: Date.now,
    },
    lastEarned: {
      type: Number,
      default: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strict: true, // Keep this as true for safety
  }
);

// Add index for better performance
UserPlaySchema.index({ wallet: 1 });
UserPlaySchema.index({ lastPlay: 1 });

export default models.UserPlay || model("UserPlay", UserPlaySchema);
