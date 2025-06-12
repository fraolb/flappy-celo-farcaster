"use client";

import { useState, useCallback } from "react";
import {
  useSendTransaction,
  useAccount,
  useConnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
  type UseSendTransactionParameters,
} from "wagmi";
import { parseEther } from "viem";
import { UserRejectedRequestError } from "viem";
import { celo } from "wagmi/chains";
import { useRef, useEffect } from "react";
import { runGame } from "@/components/GameFunction";
import { useScoreContext } from "@/components/providers/ScoreContext";
import { addUserScore } from "@/lib/dbFunctions";
import { useFrame } from "@/components/providers/FrameProvider";
import { createScoreToken } from "@/lib/gameAuth";

type SendTransactionArgs = UseSendTransactionParameters & {
  to: `0x${string}`;
  value: bigint;
};

export default function Home() {
  const { isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: hash, sendTransaction } = useSendTransaction();
  const { status } = useWaitForTransactionReceipt({
    hash,
  });
  const { switchChain } = useSwitchChain();
  const [error, setError] = useState<string>("");
  //const [isProcessing, setIsProcessing] = useState(false);
  // const [showGame, setShowGame] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const showGameRef = useRef(false);
  const isProcessingRef = useRef(false);
  const errorRef = useRef<string>("");
  const { scores, topScores, refetchScores } = useScoreContext();
  const scoresRef = useRef({ scores: scores, topScores: topScores });
  const { context } = useFrame();

  const endGame = () => {
    showGameRef.current = false;
    //setIsGameStarted(false); // If you want to hide the canvas and fully reset
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called");
    setError("");
    errorRef.current = "";
    if (!isConnected) return setError("Please connect your wallet first");
    //setIsProcessing(true);
    isProcessingRef.current = true;
    try {
      await switchChain({ chainId: celo.id });
      await sendTransactionAsync({
        to: "0xC00DA57cDE8dcB4ED4a8141784B5B4A5CBf62551",
        value: parseEther("0.01"),
      });
      if (status === "error") throw new Error("Transaction reverted");
      showGameRef.current = true;
    } catch (err) {
      //setIsProcessing(false);
      isProcessingRef.current = false;
      if (err instanceof UserRejectedRequestError) {
        setError("Payment cancelled");
        errorRef.current = "Payment cancelled";
      } else {
        setError(err instanceof Error ? err.message : "Transaction failed");
        errorRef.current =
          err instanceof Error ? err.message : "Transaction failed";
      }
    }
    //setIsProcessing(false);
    isProcessingRef.current = false;
  };

  const handleAddUserScore = async (score: number) => {
    if (!isConnected || !context?.user?.username) {
      setError("Please connect your wallet first");
      return;
    }
    console.log("handleAddUserScore called with score:", score);
    const username = context.user.username;
    try {
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

  const sendTransactionAsync = useCallback(
    async (tx: SendTransactionArgs): Promise<`0x${string}`> => {
      return new Promise<`0x${string}`>((resolve, reject) => {
        sendTransaction(tx, {
          onSuccess: (hash) => resolve(hash),
          onError: (err) => reject(err),
        });
      });
    },
    [sendTransaction]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    scoresRef.current = { scores, topScores };
  }, [scores, topScores]);

  useEffect(() => {
    if (!isConnected || chainId !== celo.id || !isGameStarted) {
      // When game is not showing, ensure canvas ref is null
      canvasRef.current = null;
      return;
    }

    if (!canvasRef.current) {
      // Create new canvas if none exists
      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 640;
      canvasRef.current = canvas;
    }

    const canvas = canvasRef.current;
    let gameCleanup: (() => void) | undefined;

    // Initialize game
    try {
      gameCleanup = runGame(
        canvas,
        handleSubmit,
        handleAddUserScore,
        isProcessingRef,
        errorRef,
        showGameRef,
        endGame,
        scoresRef
      );
    } catch (err) {
      console.error("Game initialization failed:", err);
      setError("Failed to start game. Please refresh the page.");

      canvasRef.current = null;
      return;
    }

    // Cleanup function
    return () => {
      // 1. Run game's cleanup if it exists
      if (typeof gameCleanup === "function") {
        try {
          gameCleanup();
        } catch (err) {
          console.error("Game cleanup error:", err);
        }
      }
    };
  }, [isGameStarted]);

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: "100vw",
        backgroundImage: "url('/assets/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {!isGameStarted && (
        <div
          style={{
            background: "rgba(30, 41, 59, 0.85)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            padding: "2rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: 350,
          }}
        >
          <h1
            style={{
              color: "#fff",
              fontSize: "2.2rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              letterSpacing: "1px",
              textAlign: "center",
            }}
          >
            Flappy Bird Game
          </h1>
          <div style={{ width: "100%", marginBottom: "1.5rem" }}>
            {!isConnected ? (
              <div style={{ textAlign: "center" }}>
                <p
                  className="mb-6 text-gray-300"
                  style={{
                    color: "#cbd5e1",
                    marginBottom: "1rem",
                  }}
                >
                  Connect your wallet
                </p>
                <button
                  type="button"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    background: "linear-gradient(to right, #6366f1, #a21caf)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() => connect({ connector: connectors[0] })}
                >
                  Connect Wallet
                </button>
              </div>
            ) : chainId !== celo.id ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#cbd5e1", marginBottom: "1rem" }}>
                  Switch to Celo network
                </p>
                <button
                  type="button"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    fontSize: "1rem",
                    borderRadius: "8px",
                    background: "linear-gradient(to right, #6366f1, #a21caf)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() => switchChain?.({ chainId: celo.id })}
                >
                  Switch to Celo
                </button>
              </div>
            ) : !isGameStarted ? (
              <button
                style={{
                  width: "100%",
                  padding: "1rem",
                  fontSize: "1.2rem",
                  marginTop: "1rem",
                  borderRadius: "8px",
                  background: "linear-gradient(to right, #6366f1, #a21caf)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  transition: "background 0.2s",
                }}
                onClick={() => setIsGameStarted(true)}
              >
                Load Game
              </button>
            ) : null}
          </div>

          {error && (
            <div
              style={{
                color: "#f87171",
                marginTop: "1.2rem",
                textAlign: "center",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}
      {isGameStarted && (
        <canvas
          ref={canvasRef}
          style={{
            zIndex: 100,
          }}
        />
      )}
    </div>
  );
}
