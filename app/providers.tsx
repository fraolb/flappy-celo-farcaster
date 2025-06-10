"use client";

import dynamic from "next/dynamic";
import { FrameProvider } from "@/components/providers/FrameProvider";
import { ScoreProvider } from "@/components/providers/ScoreContext";

const WagmiProvider = dynamic(
  () => import("@/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      <FrameProvider>
        <ScoreProvider>{children}</ScoreProvider>
      </FrameProvider>
    </WagmiProvider>
  );
}
