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
  useBalance,
  useConnect,
  useSwitchChain,
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
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
  });

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
    // if (!isConnected || !address)
    //   return setError("Please connect your wallet first");
    isProcessingRef.current = true;

    if (!isConnected) {
      await connectAsync({
        chainId: celo.id,
        connector: config.connectors[0],
      });
    }
    if (!address) {
      console.error("No address found, please connect your wallet");
      return setError("Please connect your wallet first");
    }

    console.log("isConnected:", isConnected);

    try {
      switchChain({ chainId: celo.id });
      if (chainId !== celo.id) {
        console.error("Network switch to celo failed");
        //throw new Error('Please complete the network switch to Celo');
      }
      console.log("Switched to Celo chain", chainId);

      console.log("Balance:", balance);

      // Step 1: Generate the Divvi data suffix
      let referralTag;

      try {
        referralTag = getReferralTag({
          user: address, // The user address making the transaction
          consumer: "0xC00DA57cDE8dcB4ED4a8141784B5B4A5CBf62551", // Your Divvi Identifier
        });
      } catch (diviError) {
        console.error("Divvi getDataSuffix error:", diviError);
        throw new Error("Failed to generate referral data");
      }

      const celoBalance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });
      const celoBalanceFormatted = formatGwei(celoBalance);

      console.log(
        "Celo Balance:",
        Number(celoBalanceFormatted),
        celoBalance,
        celoBalanceFormatted
      );

      if (Number(celoBalanceFormatted) >= 1) {
        const gameData = encodeFunctionData({
          abi: FlappyRocketGameABI,
          functionName: "depositCELO",
        });

        const combinedData = referralTag ? gameData + referralTag : gameData;

        // if (chainId !== celo.id) {
        //   console.error('Network switch to celo failed2');
        //   throw new Error('Please complete the network switch to Celo');
        // }

        // Step 2: Send transaction with data suffix
        console.log("starting tx");
        const txHash = await sendTransactionAsync({
          to: FlappyRocketGameAddress as `0x${string}`,
          data: combinedData as `0x${string}`,
          value: parseEther("0.1"),
          maxFeePerGas: parseUnits("100", 9),
          maxPriorityFeePerGas: parseUnits("100", 9),
        });

        console.log("Transaction sent:", txHash);

        if (status === "error") throw new Error("Transaction reverted");
        //Step 3: Submit referral after successful transaction
        try {
          await submitReferral({
            txHash: txHash,
            chainId: 42220,
          });
        } catch (referralError) {
          console.error("Referral submission error:", referralError);
        }
      } else {
        console.log("user has no celo, paying for user!");
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
    } finally {
      isProcessingRef.current = false;
    }
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
