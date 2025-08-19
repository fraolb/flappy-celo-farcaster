import { NextResponse } from "next/server";
import UserPlay from "@/model/userPlays";
import dbConnect from "@/lib/mongodb";
import { jwtVerify } from "jose";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { username, wallet } = body;

    // Validate required fields
    if (!username || !wallet) {
      return NextResponse.json(
        { error: "Missing username or wallet" },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization token" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      // Changed from NEXT_PUBLIC_JWT_SECRET
      throw new Error("JWT_SECRET not configured");
    }

    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });

      // Verify token matches request data
      if (payload.username !== username || payload.wallet !== wallet) {
        console.error("Token data mismatch:", {
          tokenUsername: payload.username,
          requestUsername: username,
          tokenWallet: payload.wallet,
          requestWallet: wallet,
        });
        return NextResponse.json({ error: "Data mismatch" }, { status: 401 });
      }

      // Check if user has plays left
      const user = await UserPlay.findOne({ wallet });
      if (user && user.playsLeft <= 0) {
        return NextResponse.json(
          { error: "No plays left", playsLeft: 0 },
          { status: 400 }
        );
      }

      // Update or create user play record
      const updatedPlay = await UserPlay.findOneAndUpdate(
        { wallet }, // Use wallet as primary identifier
        {
          $inc: { playsLeft: -1 },
          $set: {
            lastPlay: new Date(),
            username: username, // Ensure username is always updated
          },
        },
        {
          upsert: true,
          new: true, // Return the updated document
          runValidators: true,
        }
      );

      return NextResponse.json({
        success: true,
        playsLeft: updatedPlay.playsLeft,
        message: "Play deducted successfully",
      });
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Play deduction error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
