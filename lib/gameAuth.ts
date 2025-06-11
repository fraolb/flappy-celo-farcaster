import jwt from "jsonwebtoken";

export const createScoreToken = (username: string, score: number) => {
  return jwt.sign({ username, score }, process.env.JWT_SECRET!, {
    expiresIn: "2m",
  });
};
