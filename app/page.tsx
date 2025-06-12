"use client";

import { useState } from "react";
import {
  useSendTransaction,
  useAccount,
  useBalance,
  useConnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
  // type UseSendTransactionParameters,
} from "wagmi";
import { parseEther, parseUnits } from "viem";
import { UserRejectedRequestError } from "viem";
import { celo } from "wagmi/chains";
import { useRef, useEffect } from "react";
import { runGame } from "@/components/GameFunction";
import { useScoreContext } from "@/components/providers/ScoreContext";
import { addUserScore } from "@/lib/dbFunctions";
import { useFrame } from "@/components/providers/FrameProvider";
import { createScoreToken } from "@/lib/gameAuth";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import { config } from "@/components/providers/WagmiProvider";

// type SendTransactionArgs = UseSendTransactionParameters & {
//   to: `0x${string}`;
//   value: bigint;
//   data?: `0x${string}`; // Add data field to your type
//   gasLimit?: bigint; // Optional gas limit
//   gas?: bigint; // Optional gas limit
// };

export default function Home() {
  const { isConnected, chainId, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: hash } = useSendTransaction();
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
  // Setup transaction sending
  const { sendTransactionAsync } = useSendTransaction({ config });

  const endGame = () => {
    showGameRef.current = false;
    //setIsGameStarted(false); // If you want to hide the canvas and fully reset
  };

  const { data: balance } = useBalance({
    address,
  });

  const handleSubmit = async () => {
    console.log("handleSubmit called");
    setError("");
    errorRef.current = "";
    if (!isConnected) return setError("Please connect your wallet first");
    isProcessingRef.current = true;

    try {
      await switchChain({ chainId: celo.id });
      if (chainId !== celo.id) {
        console.error("Network switch to celo failed");
        throw new Error("Please complete the network switch to Celo");
      }

      console.log("Balance:", balance);

      // Step 1: Generate the Divvi data suffix
      let dataSuffix;
      try {
        dataSuffix = getDataSuffix({
          consumer: "0xC00DA57cDE8dcB4ED4a8141784B5B4A5CBf62551",
          providers: [
            "0x0423189886d7966f0dd7e7d256898daeee625dca",
            "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
          ],
        });
      } catch (diviError) {
        console.error("Divvi getDataSuffix error:", diviError);
        throw new Error("Failed to generate referral data");
      }

      if (chainId !== celo.id) {
        console.error("Network switch to celo failed2");
        throw new Error("Please complete the network switch to Celo");
      }
      console.log("Data suffix generated:", dataSuffix);
      const data = dataSuffix.startsWith("0x") ? dataSuffix : `0x${dataSuffix}`;
      // Step 2: Send transaction with data suffix
      const txHash = await sendTransactionAsync({
        to: "0xF3805e6d1320FDcD2FceD1aFc827D44E55cA0ca2" as `0x${string}`,
        data: data as `0x${string}`, // Append the data suffix
        value: parseEther("0.000001"),
        maxFeePerGas: parseUnits("100", 9),
        maxPriorityFeePerGas: parseUnits("100", 9),
      });

      if (status === "error") throw new Error("Transaction reverted");

      // Step 3: Submit referral after successful transaction
      try {
        await submitReferral({
          txHash: txHash,
          chainId: 42220,
        });
      } catch (referralError) {
        console.error("Referral submission error:", referralError);
      }

      showGameRef.current = true;
    } catch (err) {
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

  // const sendTransactionAsync1 = useCallback(
  //   async (tx: SendTransactionArgs): Promise<`0x${string}`> => {
  //     return new Promise<`0x${string}`>((resolve, reject) => {
  //       sendTransaction(tx, {
  //         onSuccess: (hash) => resolve(hash),
  //         onError: (err) => reject(err),
  //       });
  //     });
  //   },
  //   [sendTransaction]
  // );

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
              <div>
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
                {balance && (
                  <div>
                    Balance: {balance.formatted} {balance.symbol}
                  </div>
                )}
              </div>
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
