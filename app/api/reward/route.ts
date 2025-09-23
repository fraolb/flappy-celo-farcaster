import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { encodeFunctionData, parseEther } from "viem";
// import { submitReferral, getReferralTag } from "@divvi/referral-sdk";
import FlappyRocketGameABI from "../../../ABI/FlappyRocket.json";

import UserPlay from "@/model/userPlays";
import dbConnect from "@/lib/mongodb";

const FlappyRocketGameAddress = "0x883D06cc70BE8c3E018EA35f7BB7671B044b4Beb";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { username, wallet, score } = body;

    // Validate required fields
    if (!username || !wallet) {
      return NextResponse.json(
        { error: "Missing username or wallet" },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Initialize clients
    const publicClient = createPublicClient({
      chain: celo,
      transport: http("https://forno.celo.org"),
    });

    // let referralTag;
    // try {
    //   referralTag = getReferralTag({
    //     user: "0x137f7b4Ac3BB0456C08A1025335133FF3120844f" as `0x${string}`,
    //     consumer: "0xC00DA57cDE8dcB4ED4a8141784B5B4A5CBf62551",
    //   });
    // } catch (diviError) {
    //   console.error("Divvi getDataSuffix error:", diviError);
    //   throw new Error("Failed to generate referral data");
    // }

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

    const RATE = 0.0005; // CELO per point
    const reward = score * RATE;
    const rewardInBigint = parseEther(String(reward));
    // Encode payoutCELOToWinner function call
    const contractData = encodeFunctionData({
      abi: FlappyRocketGameABI,
      functionName: "payoutCELOToWinner",
      args: [wallet, rewardInBigint],
    });

    // const combinedData = referralTag
    //   ? contractData + referralTag
    //   : contractData;

    // Send transaction with the minimum deposit value
    const hash = await walletClient.sendTransaction({
      account,
      to: FlappyRocketGameAddress,
      data: contractData as `0x${string}`,
      value: parseEther("0"),
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Check if user exists and update rewards data
    try {
      // update the winners last earned and total earned data
      await UserPlay.findOneAndUpdate(
        { username },
        {
          $set: { lastEarned: reward },
          $inc: { totalEarned: reward },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    } catch (error) {
      return NextResponse.json(
        { error: `error rest playsleft, ${error}` },
        { status: 401 }
      );
    }

    // Optional: Report to Divi
    // if (referralTag) {
    //   try {
    //     await submitReferral({
    //       txHash: receipt.transactionHash,
    //       chainId: 42220,
    //     });
    //   } catch (diviError) {
    //     console.error("Divi referral error:", diviError);
    //   }
    // }

    return NextResponse.json({
      success: true,
      transactionHash: receipt.transactionHash,
    });
  } catch (error) {
    console.error("Payout winner error:", error);
    return NextResponse.json(
      {
        error: `Failed to payout winner: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
