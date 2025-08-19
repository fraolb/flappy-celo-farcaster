import { Schema, model, models } from "mongoose";

// Schema for tracking plays
const UserPlays: Schema = new Schema(
  {
    username: { type: String, required: true },
    wallet: { type: String, unique: true },
    playsLeft: { type: Number, default: 4 },
    lastPlay: Date,
    lastEarned: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 }, // For analytics
  },
  { timestamps: true }
);

const UserPlay = models.Score || model("UserPlays", UserPlays);
export default UserPlay;
