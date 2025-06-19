"use client";

import { useState } from "react";
import {
  useSendTransaction,
  useAccount,
  useBalance,
  useConnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import Image from "next/image";
import backgroundImage from "@/public/assets/bg.webp";

import { parseEther, parseUnits, encodeFunctionData } from "viem";
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
import sdk from "@farcaster/frame-sdk";
import FlappyRocketGameABI from "@/ABI/FlappyRocket.json";

const FlappyRocketGameAddress = "0x883D06cc70BE8c3E018EA35f7BB7671B044b4Beb";

export default function App() {
  const { isConnected, chainId, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: hash } = useSendTransaction();
  const { status } = useWaitForTransactionReceipt({
    hash,
  });
  const { switchChain } = useSwitchChain();
  const [error, setError] = useState<string>("");
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

      const gameData = encodeFunctionData({
        abi: FlappyRocketGameABI,
        functionName: "depositCELO",
      });

      const combinedData = dataSuffix ? gameData + dataSuffix : gameData;

      //const data = dataSuffix.startsWith("0x") ? dataSuffix : `0x${dataSuffix}`;
      // Step 2: Send transaction with data suffix
      const txHash = await sendTransactionAsync({
        to: FlappyRocketGameAddress as `0x${string}`,
        data: combinedData as `0x${string}`,
        value: parseEther("0.1"),
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

  const shareScore = async (score: number) => {
    await sdk.actions.composeCast({
      text:
        `🎮 I just scored ${score} playing Flappy Rocket! 🏆\n` +
        `🚀 Play and win Celo Weekly!\n`,
      embeds: ["https://flappy-farcaster.vercel.app"],
    });
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    scoresRef.current = { scores, topScores };
  }, [scores, topScores]);

  useEffect(() => {
    const add = async () => {
      try {
        await sdk.actions.addMiniApp();
      } catch (err) {
        console.error("Failed to add mini app:", err);
      }
    };
    add();
  }, []);

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

      // Get the 2D rendering context
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get 2D context");
      }

      // Set font and draw text
      ctx.font = '20px "Press Start 2P"';
      ctx.fillStyle = "white";
      ctx.fillText("Score: 100", 10, 50);
    }
    const canvas = canvasRef.current;
    let gameCleanup: (() => void) | undefined;

    // Initialize game
    try {
      gameCleanup = runGame(
        canvas,
        handleSubmit,
        handleAddUserScore,
        shareScore,
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
    <div className="relative h-screen w-full">
      <div className="absolute inset-0 -z-10">
        <Image
          src={backgroundImage}
          alt="Game background"
          fill
          priority
          quality={85}
          className="object-cover"
        />
      </div>
      <div className="relative z-10 h-full w-full">
        {!isGameStarted && (
          <div className="font-vt323 flex flex-col items-center justify-center p-8 min-w-[350px] h-screen relative z-10 box-border">
            <h1 className="font-press-start text-4xl text-white [text-shadow:_3px_3px_0_#000]">
              FLAPPY ROCKET
              <span className="block text-sm font-vt323 text-gray-300">
                Powered by Celo
              </span>
            </h1>
            <h2 className="text-gray-200 text-base md:text-base mb-8 tracking-wide text-center [text-shadow:_2px_2px_0_#000]">
              Weekly competition!
            </h2>

            <div style={{ width: "100%", marginBottom: "2rem" }}>
              {!isConnected ? (
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      color: "#cbd5e1",
                      marginBottom: "1.5rem",
                      fontSize: "1.3rem",
                    }}
                  >
                    Connect your wallet
                  </p>
                  <button
                    className="font-vt323 w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl mb-2
             transition-all duration-200 ease-in-out
             hover:border-2 hover:border-white hover:-translate-y-0.5 hover:shadow-lg
             active:scale-95 active:bg-white/10 active:border-2 active:border-white/80
             relative overflow-hidden"
                    onClick={() => connect({ connector: connectors[0] })}
                  >
                    CONNECT WALLET
                  </button>
                </div>
              ) : chainId !== celo.id ? (
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      color: "#cbd5e1",
                      marginBottom: "1.5rem",
                      fontSize: "1.3rem",
                    }}
                  >
                    Switch to Celo network
                  </p>
                  <button
                    type="button"
                    className="font-vt323 w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl mb-2
             transition-all duration-200 ease-in-out
             hover:border-2 hover:border-white hover:-translate-y-0.5 hover:shadow-lg
             active:scale-95 active:bg-white/10 active:border-2 active:border-white/80
             relative overflow-hidden"
                    onClick={() => switchChain?.({ chainId: celo.id })}
                  >
                    SWITCH TO CELO
                  </button>
                </div>
              ) : !isGameStarted ? (
                <div>
                  <button
                    className="font-vt323 w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl mb-2
             transition-all duration-200 ease-in-out
             hover:border-2 hover:border-white hover:-translate-y-0.5 hover:shadow-lg
             active:scale-95 active:bg-white/10 active:border-2 active:border-white/80
             relative overflow-hidden"
                    onClick={() => setIsGameStarted(true)}
                  >
                    Load Game
                  </button>
                </div>
              ) : null}
            </div>

            <div
              style={{
                marginTop: 16,
                marginBottom: 24,
                color: "#fff",
                fontSize: "1.2rem",
                textAlign: "center",
                lineHeight: "1.5",
                maxWidth: "400px",
                textShadow: "1px 1px 0 #000",
              }}
            >
              Compete for weekly rewards on the Celo blockchain.
              <br />
              Play → Score → Win!
            </div>

            {error && (
              <div
                style={{
                  color: "#ff6b6b",
                  marginTop: "1.2rem",
                  textAlign: "center",
                  fontSize: "1.1rem",
                  textShadow: "1px 1px 0 #000",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                  padding: "0 1rem",
                }}
                title={error}
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
    </div>
  );
}
