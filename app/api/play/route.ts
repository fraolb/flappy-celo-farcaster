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

    // Validate wallet address format
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
      throw new Error("JWT_SECRET not configured");
    }

    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });

      if (payload.username !== username || payload.wallet !== wallet) {
        console.error("Token data mismatch:", {
          tokenUsername: payload.username,
          requestUsername: username,
          tokenWallet: payload.wallet,
          requestWallet: wallet,
        });
        return NextResponse.json({ error: "Data mismatch" }, { status: 401 });
      }

      // Check if user exists and if plays should reset
      const user = await UserPlay.findOne({ wallet });
      const now = new Date();

      if (user) {
        // Check if 24 hours have passed since last play
        const timeSinceLastPlay = now.getTime() - user.lastPlay.getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (timeSinceLastPlay >= twentyFourHours) {
          try {
            // Reset playsLeft to 4 and update lastPlay
            const updatedPlay = await UserPlay.findOneAndUpdate(
              { wallet },
              {
                $set: {
                  playsLeft: 4, // Reset to 4 plays
                  lastPlay: now,
                  username: username,
                },
              },
              {
                new: true,
                runValidators: true,
              }
            );

            return NextResponse.json({
              success: true,
              playsLeft: updatedPlay.playsLeft,
              message: "Plays reset to 4 for new day",
            });
          } catch (error) {
            return NextResponse.json(
              { error: `error rest playsleft, ${error}` },
              { status: 401 }
            );
          }
        }

        // If less than 24 hours, check if plays left
        if (user.playsLeft <= 0) {
          return NextResponse.json(
            {
              error: "No plays left",
              playsLeft: 0,
              nextReset: new Date(
                user.lastPlay.getTime() + twentyFourHours
              ).toISOString(),
            },
            { status: 400 }
          );
        }
      }

      try {
        // If user doesn't exist or has plays left, deduct one play
        const updatedPlay = await UserPlay.findOneAndUpdate(
          { wallet },
          {
            $inc: { playsLeft: -1 },
            $set: {
              lastPlay: now,
              username: username,
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        return NextResponse.json({
          success: true,
          playsLeft: updatedPlay.playsLeft,
          message: "Play deducted successfully",
        });
      } catch (error) {
        return NextResponse.json(
          { error: `player doesnt exist or has play left error ${error}` },
          { status: 401 }
        );
      }
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
