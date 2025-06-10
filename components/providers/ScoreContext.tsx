"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getUserScores, getTopScorers } from "@/lib/dbFunctions";
import { useFrame } from "./FrameProvider";

interface Score {
  _id: string;
  username: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

interface ScoreContextType {
  scores: Score | null;
  topScores: Score[] | null;
  loading: boolean;
  scoreError: string | null;
  refetchScores: () => Promise<void>;
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined);

export const ScoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isSDKLoaded, context } = useFrame();

  const [scores, setScores] = useState<Score | null>(null);
  const [topScores, setTopScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    if (!isSDKLoaded || !context) return;
    if (!context.user?.username) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedUserScore = await getUserScores(context?.user?.username);
      setScores(fetchedUserScore);
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
  }, [context, isSDKLoaded]);

  return (
    <ScoreContext.Provider
      value={{
        scores,
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
