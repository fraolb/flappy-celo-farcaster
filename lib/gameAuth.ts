import { sign } from "jsonwebtoken"; // Named import recommended

export const createScoreToken = (username: string, score: number) => {
  if (!process.env.NEXT_PUBLIC_JWT_TOKEN) {
    throw new Error("JWT token not configured");
  }

  try {
    return sign(
      { username: username, score: score },
      process.env.NEXT_PUBLIC_JWT_TOKEN,
      { algorithm: "HS256", expiresIn: "2m" } // Explicitly specify algorithm
    );
  } catch (error) {
    console.error("Token signing failed:", error);
    throw error;
  }
};
