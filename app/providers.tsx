"use client";

import dynamic from "next/dynamic";
import { MiniAppProvider } from "@neynar/react";
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
      <MiniAppProvider analyticsEnabled={true} backButtonEnabled={true}>
        <ScoreProvider>{children}</ScoreProvider>
      </MiniAppProvider>
    </WagmiProvider>
  );
}
