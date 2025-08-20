"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useMiniApp } from "@neynar/react";

interface GamePlayType {
  username: string;
  wallet: string;
  playsLeft: number;
  lastPlay: Date;
  lastEarned: number;
  totalEarned: number;
}

interface GamePlayContextType {
  userGamePlay: GamePlayType | null;
  loading: boolean;
  userGameplayError: string | null;
  fetchUserGamePlay: () => Promise<void>;
}

const GamePlayContext = createContext<GamePlayContextType | undefined>(
  undefined
);

export const UserGamePlayProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { context } = useMiniApp();

  const [userGamePlay, setUserUserGamePlay] = useState<GamePlayType | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserGamePlay = async () => {
    if (!context) return;
    if (!context.user?.username) {
      setError("User not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedUserGamePlay = await fetch("/api/play", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: context?.user?.username,
        }),
      });
      const result = await fetchedUserGamePlay.json();
      setUserUserGamePlay(result);
    } catch (err) {
      console.error("Error fetching user gameplay:", err);
      setError("Failed to fetch user gameplay");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserGamePlay();
  }, [context]);

  return (
    <GamePlayContext.Provider
      value={{
        userGamePlay,
        loading,
        userGameplayError: error,
        fetchUserGamePlay,
      }}
    >
      {children}
    </GamePlayContext.Provider>
  );
};

export const useGamePlayContext = () => {
  const context = useContext(GamePlayContext);
  if (!context) {
    throw new Error("useGamePlayContext must be used within a ScoreProvider");
  }
  return context;
};
