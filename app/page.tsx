"use client";

import { useState, useCallback, FormEvent } from "react";
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

type SendTransactionArgs = UseSendTransactionParameters & {
  to: `0x${string}`;
  value: bigint;
};

export default function Home() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: hash, sendTransaction } = useSendTransaction();
  const { status } = useWaitForTransactionReceipt({
    hash,
  });
  const { switchChain } = useSwitchChain();
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isConnected) return setError("Please connect your wallet first");
    setIsProcessing(true);

    try {
      await switchChain({ chainId: celo.id });
      await sendTransactionAsync({
        to: "0xC00DA57cDE8dcB4ED4a8141784B5B4A5CBf62551",
        value: parseEther("0.01"),
      });
      if (status === "error") throw new Error("Transaction reverted");
      setShowGame(true); // Show the game after payment
    } catch (err) {
      setIsProcessing(false);
      if (err instanceof UserRejectedRequestError) {
        setError("Payment cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Transaction failed");
      }
    }
    setIsProcessing(false);
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
    if (!showGame) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use the extracted runGame function
    const cleanup = runGame(canvas, setShowGame);

    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [showGame, setShowGame]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/assets/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <h1>Flappy Bird Game</h1>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!isConnected ? (
        <div className="text-center">
          <p className="mb-6 text-gray-300">Connect your wallet</p>
          <button
            type="button"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition"
            onClick={() => connect({ connector: connectors[0] })}
          >
            Connect Wallet
          </button>
        </div>
      ) : !showGame ? (
        <form onSubmit={handleSubmit}>
          <div>Pay 1 Celo to play</div>
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-green-700 transition"
          >
            {isProcessing ? "Processing..." : "Pay"}
          </button>
        </form>
      ) : null}
      {showGame && <canvas ref={canvasRef} width={480} height={640} />}
    </div>
  );
}
