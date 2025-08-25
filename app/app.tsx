"use client";

import { useRef, useState, useEffect } from "react";
import sdk from "@farcaster/frame-sdk";
import { useMiniApp } from "@neynar/react";
import { useAccount, useConnect } from "wagmi";
import { celo } from "wagmi/chains";
import { addUserScore } from "../lib/dbFunctions";
import { createScoreToken, generatePlayToken } from "../lib/gameAuth";
import { IRefPhaserGame, PhaserGame } from "../components/PhaserGame";
import { useScoreContext } from "../components/providers/ScoreContext";
import { useGamePlayContext } from "../components/providers/UserGamePlayContext";
import { config } from "../components/providers/WagmiProvider";

interface GamePlayType {
  username: string;
  wallet: string;
  playsLeft: number;
  lastPlay: Date | string;
  lastEarned: number;
  totalEarned: number;
}

function App() {
  // The sprite can only be moved in the MainMenu Scene
  const [canMoveSprite, setCanMoveSprite] = useState(true);

  const { context } = useMiniApp();
  const { userScore, topScores, refetchScores } = useScoreContext();
  const { userGamePlay, fetchUserGamePlay } = useGamePlayContext();
  const scoresRef = useRef({ userScore: userScore, topScores: topScores });
  const userGamePlayRef = useRef<GamePlayType | null>(null);

  //  References to the PhaserGame component (game and scene are exposed)
  const phaserRef = useRef<IRefPhaserGame | null>(null);

  // Event emitted from the PhaserGame component
  const currentScene = (scene: Phaser.Scene) => {
    setCanMoveSprite(scene.scene.key !== "MainMenu");
  };

  const isProcessingRef = useRef(false);
  const showGameRef = useRef(false);
  const errorRef = useRef<string>("");
  const [error, setError] = useState<string>("");

  console.log("ts test ", error, canMoveSprite);

  const { isConnected, chainId, address } = useAccount();
  const { connectAsync } = useConnect();

  const handleSubmit = async () => {
    console.log("handleSubmit called");
    setError("");
    errorRef.current = "";
    isProcessingRef.current = true;

    try {
      // 1. Ensure Wallet is Connected
      if (
        !isConnected ||
        !address ||
        !context?.user?.username ||
        context?.user?.username == undefined
      ) {
        console.log("Wallet not connected, attempting to connect...");
        await connectAsync({
          chainId: celo.id,
          connector: config.connectors[0],
        });
        if (!address) throw new Error("Wallet connection failed");
      }

      // 2. Generate JWT token (you'll need to implement this)
      const username = context?.user.username;
      const token = await generatePlayToken(address, username); // You need to create this function

      // 3. Call the play route
      const playResponse = await fetch("/api/play", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: context?.user?.username,
          wallet: address,
        }),
      });

      const playResult = await playResponse.json();

      if (!playResponse.ok) {
        if (playResponse.status === 400 && playResult.playsLeft === 0) {
          // Handle no plays left with reset timer
          const nextReset = playResult.nextReset
            ? new Date(playResult.nextReset)
            : null;
          errorRef.current = `No plays left for today. Comback after ${nextReset}`;
          throw new Error(
            `No plays left. ${
              nextReset
                ? `Resets at: ${nextReset.toLocaleTimeString()}`
                : "Try again tomorrow."
            }`
          );
        }
        throw new Error(playResult.error || "Failed to start game");
      }

      console.log("Play route success:", playResult);

      // 4. Update local state with remaining plays
      //setPlaysLeft(playResult.playsLeft);

      // 5. Proceed to Game
      showGameRef.current = true;
    } catch (err) {
      console.error("Play submission error:", err);
      setError(err instanceof Error ? err.message : "Failed to start game");
    } finally {
      isProcessingRef.current = false;
    }
  };

  const handleConnectToCelo = async () => {
    await connectAsync({
      chainId: celo.id,
      connector: config.connectors[0],
    });
    console.log("Connected to Celo?", isConnected);
  };

  const handleAddUserScore = async (score: number) => {
    if (!isConnected || !context?.user?.username) {
      setError("Please connect your wallet first");
      return;
    }
    console.log("handleAddUserScore called with score:", score);
    const username = context.user.username;
    try {
      const rewardPlayer = await fetch("/api/reward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: context?.user?.username,
          wallet: address,
          score: score,
        }),
      });
      console.log("the reward player res ", rewardPlayer);
      await fetchUserGamePlay();

      const token = await createScoreToken(username, score);

      await addUserScore(username, score, token);
      // Optionally refetch scores to update UI
      refetchScores?.();
    } catch (err) {
      setError("Failed to save score.");
      console.error("Error adding user score:", err);
    }
    console.log("User score added successfully:");
  };

  const shareScore = async (score: number) => {
    const rewardAmount = (score * 0.0005).toFixed(3);
    await sdk.actions.composeCast({
      text: `🎮 I just scored ${score} playing Flappy Rocket and got rewarded ${rewardAmount}! 🏆\n 🚀 Play and win CELO instantly!\n`,
      embeds: ["https://flappy-farcaster.vercel.app"],
    });
  };

  const endGame = () => {
    showGameRef.current = false;
  };

  useEffect(() => {
    if (userGamePlay) {
      userGamePlayRef.current = userGamePlay;
      console.log("user gameplay updated:", userGamePlay);
    } else {
      userGamePlayRef.current = null;
    }
    scoresRef.current = { userScore, topScores };
    console.log("user gameplay is ", userGamePlay, userGamePlayRef.current);
  }, [userGamePlay, userScore, topScores]);

  useEffect(() => {
    async function checkConnection() {
      if (!isConnected) {
        await connectAsync({
          chainId: celo.id,
          connector: config.connectors[0],
        });
      }
    }
    checkConnection();
  }, []);
  console.log("the user gameplay ref is ", userGamePlayRef.current);

  return (
    <div id="app">
      <PhaserGame
        ref={phaserRef}
        currentActiveScene={currentScene}
        onPaymentRequested={handleSubmit}
        handleConnectToCelo={handleConnectToCelo}
        isConnected={isConnected && chainId == celo.id ? true : false}
        isProcessing={isProcessingRef}
        errorRef={errorRef}
        showGameRef={showGameRef}
        endGame={endGame}
        userGamePlayRef={userGamePlayRef}
        scoresRef={scoresRef}
        handleAddUserScore={handleAddUserScore}
        shareScore={shareScore}
      />
    </div>
  );
}

export default App;
