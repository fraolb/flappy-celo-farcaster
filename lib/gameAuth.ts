import { SignJWT } from "jose";

export const createScoreToken = async (
  username: string | undefined,
  score: number
) => {
  if (!process.env.NEXT_PUBLIC_JWT_SECRET) {
    throw new Error("JWT secret not configured");
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

    return await new SignJWT({
      username,
      score,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2m")
      .sign(secret);
  } catch (error) {
    console.error("Token signing failed:", error);
    throw error;
  }
};

export const generatePlayToken = async (
  wallet: string,
  username: string | undefined
) => {
  if (!process.env.NEXT_PUBLIC_JWT_SECRET) {
    throw new Error("JWT secret not configured");
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

    return await new SignJWT({
      wallet,
      username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2m")
      .sign(secret);
  } catch (error) {
    console.error("Token signing failed:", error);
    throw error;
  }
};
