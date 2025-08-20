import { NextResponse } from "next/server";
import UserPlay from "@/model/userPlays";
import dbConnect from "@/lib/mongodb";
import { jwtVerify } from "jose";

// GET: Fetch user's plays left and last play time
export async function GET(request: Request) {
  await dbConnect();

  const body = await request.json();
  const { username } = body;

  try {
    // Fetch the user's plays left and last play time
    let userPlay = await UserPlay.findOne({ username });
    const now = new Date();
    if (!userPlay) {
      userPlay = new UserPlay({
        username,
        playsLeft: 3, // Start with 3 since we're deducting one
        lastPlay: now,
      });

      return NextResponse.json({
        userPlay,
      });
    }
    return NextResponse.json(userPlay);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching user play", error },
      { status: 500 }
    );
  }
}

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
      const user = await UserPlay.findOne({ username });
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
        let userPlay = await UserPlay.findOne({ wallet });

        if (!userPlay) {
          // Create new user if doesn't exist
          userPlay = new UserPlay({
            wallet,
            username,
            playsLeft: 3, // Start with 3 since we're deducting one
            lastPlay: now,
          });
        } else {
          // Update existing user
          userPlay.playsLeft -= 1;
          userPlay.lastPlay = now;
          userPlay.username = username; // Update username if changed
        }

        await userPlay.save();

        return NextResponse.json({
          success: true,
          playsLeft: userPlay.playsLeft,
          message: "Play deducted successfully",
        });
      } catch (error) {
        console.error("Save operation error:", error);

        return NextResponse.json(
          { error: `Failed to save play data, ${error}` },
          { status: 500 }
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
