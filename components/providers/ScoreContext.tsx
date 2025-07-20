"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useMiniApp } from "@neynar/react";
import { getUserScores, getTopScorers } from "@/lib/dbFunctions";

interface Score {
  _id: string;
  username: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

interface ScoreContextType {
  userScore: Score | null;
  topScores: Score[] | null;
  loading: boolean;
  scoreError: string | null;
  refetchScores: () => Promise<void>;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { context } = useMiniApp();

  const [userScore, setUserScore] = useState<Score | null>(null);
  const [topScores, setTopScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    if (!context) return;
    if (!context.user?.username) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedUserScore = await getUserScores(context?.user?.username);
      setUserScore(fetchedUserScore);
      const fetchedTopScores = await getTopScorers();
      setTopScores(fetchedTopScores);
    } catch (err) {
      console.error("Error fetching scores:", err);
      setError("Failed to fetch scores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [context]);

  return (
    <ScoreContext.Provider
      value={{
        userScore,
        topScores,
        loading,
        scoreError: error,
        refetchScores: fetchScores,
      }}
    >
      {children}
    </ScoreContext.Provider>
  );
};

export const useScoreContext = () => {
  const context = useContext(ScoreContext);
  if (!context) {
    throw new Error("useScoreContext must be used within a ScoreProvider");
  }
  return context;
};
