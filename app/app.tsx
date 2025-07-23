"use client";

import { useRef, useState, useEffect } from "react";
import { getReferralTag, submitReferral } from "@divvi/referral-sdk";
import sdk from "@farcaster/frame-sdk";
import { useMiniApp } from "@neynar/react";
import { parseEther, parseUnits, encodeFunctionData, formatGwei } from "viem";
import { UserRejectedRequestError } from "viem";
import { createPublicClient, http } from "viem";
import {
  useSendTransaction,
  useAccount,
  // useBalance,
  useConnect,
  useSwitchChain,
  // useDisconnect,
} from "wagmi";
import { celo } from "wagmi/chains";
import FlappyRocketGameABI from "../ABI/FlappyRocket.json";
import { addUserScore } from "../lib/dbFunctions";
import { createScoreToken } from "../lib/gameAuth";
import { IRefPhaserGame, PhaserGame } from "../components/PhaserGame";
import { useScoreContext } from "../components/providers/ScoreContext";
import { config } from "../components/providers/WagmiProvider";

const FlappyRocketGameAddress = "0x883D06cc70BE8c3E018EA35f7BB7671B044b4Beb";

function App() {
  // The sprite can only be moved in the MainMenu Scene
  const [canMoveSprite, setCanMoveSprite] = useState(true);

  const { context } = useMiniApp();
  const { userScore, topScores, refetchScores } = useScoreContext();
  const scoresRef = useRef({ userScore: userScore, topScores: topScores });

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
  //const { disconnectAsync } = useDisconnect();
  const { switchChain } = useSwitchChain();
  // const { data: balance } = useBalance({
  //   address,
  // });

  const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
  });

  // Setup transaction sending
  const { sendTransactionAsync } = useSendTransaction({ config });

  const handleSubmit = async () => {
    console.log("handleSubmit called");
    setError("");
    errorRef.current = "";
    isProcessingRef.current = true;

    try {
      // 1. Ensure Wallet is Connected
      if (!isConnected || !address) {
        console.log("Wallet not connected, attempting to connect...");
        await connectAsync({
          chainId: celo.id,
          connector: config.connectors[0],
        });
        if (!address) throw new Error("Wallet connection failed");
      }

      // 2. Ensure Correct Chain (Celo)
      if (chainId !== celo.id) {
        console.log("Switching to Celo...");
        try {
          await switchChain({ chainId: celo.id });
        } catch (switchError) {
          console.error("Failed to switch chain:", switchError);
          throw new Error("Please switch to Celo manually");
        }
      }

      // 3. Check Celo Balance
      const celoBalance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });
      const celoBalanceFormatted = formatGwei(celoBalance);

      if (Number(celoBalanceFormatted) < 0.1) {
        throw new Error("Insufficient CELO balance (need at least 0.1 CELO)");
      }

      // 4. Generate Referral Tag (if applicable)
      let referralTag;
      try {
        referralTag = getReferralTag({
          user: address,
          consumer: "0xC00DA57cDE8dcB4ED4a8141784B5B4A5CBf62551",
        });
      } catch (diviError) {
        console.error("Divvi referral error:", diviError);
        throw new Error("Failed to generate referral data");
      }

      // 5. Prepare Transaction Data
      const gameData = encodeFunctionData({
        abi: FlappyRocketGameABI,
        functionName: "depositCELO",
      });
      const combinedData = referralTag ? gameData + referralTag : gameData;

      // 6. Send Transaction (with Retry Logic)
      let txHash;
      let retries = 0;
      const maxRetries = 2;

      while (retries < maxRetries) {
        try {
          console.log("Sending transaction (attempt", retries + 1, ")...");
          txHash = await sendTransactionAsync({
            to: FlappyRocketGameAddress as `0x${string}`,
            data: combinedData as `0x${string}`,
            value: parseEther("0.1"),
            maxFeePerGas: parseUnits("100", 9),
            maxPriorityFeePerGas: parseUnits("100", 9),
          });
          break; // Success, exit retry loop
        } catch (txError) {
          // Case 1: User rejected the transaction → exit loop
          if (txError instanceof UserRejectedRequestError) {
            console.log("User rejected transaction");
            break; // Exit loop (no retry)
          }

          console.error(`Transaction attempt ${retries} failed:`, txError);

          // If it's a wallet error, try reconnecting
          /* eslint-disable @typescript-eslint/no-explicit-any */
          if (
            typeof txError === "object" &&
            txError !== null &&
            "message" in txError &&
            typeof (txError as any).message === "string" &&
            (txError as any).message.includes("getChainId is not a function")
          ) {
            console.log("Reconnecting wallet...");
            // await disconnectAsync();
            await connectAsync({
              chainId: celo.id,
              connector: config.connectors[0],
            });
            continue;
          }

          retries++;
          console.log(`Retrying transaction (${retries})...`);

          // If max retries reached, throw the error
          if (retries >= maxRetries) {
            throw txError;
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log("Transaction successful:", txHash);

      // 7. Submit Referral (if applicable)
      if (txHash != undefined) {
        try {
          await submitReferral({
            txHash: txHash,
            chainId: 42220,
          });
        } catch (referralError) {
          console.error(
            "Referral submission failed (non-critical):",
            referralError
          );
        }
      }

      // 8. Proceed to Game
      showGameRef.current = true;
    } catch (err) {
      console.error("Transaction error:", err);
      if (err instanceof UserRejectedRequestError) {
        setError("Payment cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Transaction failed");
      }
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
      text: `🎮 I just scored ${score} playing Flappy Rocket! 🏆\n 🚀 Play and win Celo Weekly!\n`,
      embeds: ["https://flappy-farcaster.vercel.app"],
    });
  };

  const endGame = () => {
    showGameRef.current = false;
  };

  useEffect(() => {
    scoresRef.current = { userScore, topScores };
  }, [userScore, topScores]);

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

  return (
    <div id="app">
      <PhaserGame
        ref={phaserRef}
        currentActiveScene={currentScene}
        onPaymentRequested={handleSubmit}
        handleConnectToCelo={handleConnectToCelo}
        isProcessing={isProcessingRef}
        errorRef={errorRef}
        showGameRef={showGameRef}
        endGame={endGame}
        scoresRef={scoresRef}
        handleAddUserScore={handleAddUserScore}
        shareScore={shareScore}
      />
    </div>
  );
}

export default App;
