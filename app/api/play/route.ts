import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { encodeFunctionData, parseEther } from "viem";
import { submitReferral, getReferralTag } from "@divvi/referral-sdk";
import FlappyRocketGameABI from "../../../ABI/FlappyRocket.json";

const FlappyRocketGameAddress = "0x883D06cc70BE8c3E018EA35f7BB7671B044b4Beb";

export async function POST() {
  try {
    // Initialize clients
    const publicClient = createPublicClient({
      chain: celo,
      transport: http("https://forno.celo.org"),
    });

    let referralTag;
    try {
      referralTag = getReferralTag({
        user: "0x137f7b4Ac3BB0456C08A1025335133FF3120844f" as `0x${string}`,
        consumer: "0xC00DA57cDE8dcB4ED4a8141784B5B4A5CBf62551", // Your Divvi Identifier
      });
    } catch (diviError) {
      console.error("Divvi getDataSuffix error:", diviError);
      throw new Error("Failed to generate referral data");
    }

    // Validate and setup sponsor account
    const privateKey = process.env.SPONSOR_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("SPONSOR_PRIVATE_KEY not configured");
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http("https://forno.celo.org"),
    });

    // Encode depositCELO function call
    const contractData = encodeFunctionData({
      abi: FlappyRocketGameABI,
      functionName: "depositCELO",
    });

    const combinedData = referralTag
      ? contractData + referralTag
      : contractData;

    // Send transaction with the minimum deposit value
    const hash = await walletClient.sendTransaction({
      account,
      to: FlappyRocketGameAddress,
      data: combinedData as `0x${string}`,
      value: parseEther("0.1"),
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Optional: Report to Divi
    if (referralTag) {
      try {
        await submitReferral({
          txHash: receipt.transactionHash,
          chainId: 42220,
        });
      } catch (diviError) {
        console.error("Divi referral error:", diviError);
      }
    }

    return NextResponse.json({
      success: true,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error("Sponsor deposit error:", error);
    return NextResponse.json(
      {
        error: `Failed to sponsor deposit: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
