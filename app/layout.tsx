import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { Press_Start_2P, VT323 } from "next/font/google";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
      <body>
        <Providers>
          {children} <Analytics />
        </Providers>
      </body>
    </html>
  );
}
