import { Schema, model, models } from "mongoose";

const ScoreSchema: Schema = new Schema(
  {
    username: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { timestamps: true }
);

const Score = models.Score || model("Score", ScoreSchema);
export default Score;
