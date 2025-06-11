import jwt from "jsonwebtoken";

export const createScoreToken = (username: string, score: number) => {
  if (!process.env.NEXT_PUBLIC_JWT_SECRET) {
    throw new Error("JWT_SECRET not configured from createScoreToken");
  }
  return jwt.sign({ username, score }, process.env.NEXT_PUBLIC_JWT_SECRET!, {
    expiresIn: "2m",
  });
};
