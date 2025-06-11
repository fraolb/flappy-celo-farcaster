import { NextResponse } from "next/server";
import Score from "@/model/score";
import dbConnect from "@/lib/mongodb";
import jwt from "jsonwebtoken";

// GET: Fetch top 5 scores or a specific user's scores (by username query param)
export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  try {
    if (username) {
      // Fetch the single score for a specific user
      const userScore = await Score.findOne({ username });
      if (!userScore) {
        return NextResponse.json(
          { message: "User score not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(userScore);
    } else {
      // Fetch top 5 scores overall, sorted by score descending
      const topScores = await Score.find({}).sort({ score: -1 }).limit(5);
      return NextResponse.json(topScores);
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching scores", error },
      { status: 500 }
    );
  }
}

// POST: Create or update a user's score (only if new score is higher)
export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { username, score } = body;

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      username: string;
      score: number;
    };

    if (decoded.username !== username || decoded.score !== score) {
      return NextResponse.json({ error: "Data mismatch" }, { status: 400 });
    }

    if (!username || typeof score !== "number") {
      return NextResponse.json(
        { message: "Username and score are required" },
        { status: 400 }
      );
    }

    // Find the user's existing highest score
    const existing = await Score.findOne({ username });

    if (!existing) {
      // No score yet, create new
      const newScore = await Score.create({ username, score });
      return NextResponse.json(newScore, { status: 201 });
    } else if (score > existing.score) {
      // Update only if new score is higher
      existing.score = score;
      await existing.save();
      return NextResponse.json(existing, { status: 200 });
    } else {
      // Do not update if new score is not higher
      return NextResponse.json(
        {
          message: "Score not updated. New score is not higher than previous.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Error creating/updating score", error },
      { status: 500 }
    );
  }
}
