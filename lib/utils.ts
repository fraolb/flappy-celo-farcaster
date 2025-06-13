import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  APP_BUTTON_TEXT,
  APP_DESCRIPTION,
  APP_ICON_URL,
  APP_NAME,
  APP_OG_IMAGE_URL,
  APP_PRIMARY_CATEGORY,
  APP_SPLASH_BACKGROUND_COLOR,
  APP_TAGS,
  APP_URL,
  APP_WEBHOOK_URL,
} from "./constants";
import { APP_SPLASH_URL } from "./constants";

interface FrameMetadata {
  version: string;
  name: string;
  iconUrl: string;
  homeUrl: string;
  imageUrl?: string;
  buttonTitle?: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  webhookUrl?: string;
  description?: string;
  primaryCategory?: string;
  tags?: string[];
}

interface FrameManifest {
  accountAssociation?: {
    header: string;
    payload: string;
    signature: string;
  };
  frame: FrameMetadata;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSecretEnvVars() {
  const seedPhrase = process.env.SEED_PHRASE;
  const fid = process.env.FID;

  if (!seedPhrase || !fid) {
    return null;
  }

  return { seedPhrase, fid };
}

export function getFrameEmbedMetadata(ogImageUrl?: string) {
  return {
    version: "next",
    imageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT,
      action: {
        type: "launch_frame",
        name: APP_NAME,
        url: APP_URL,
        splashImageUrl: APP_SPLASH_URL,
        iconUrl: APP_ICON_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
        description: APP_DESCRIPTION,
        primaryCategory: APP_PRIMARY_CATEGORY,
        tags: APP_TAGS,
      },
    },
  };
}

export async function getFarcasterMetadata(): Promise<FrameManifest> {
  // First check for FRAME_METADATA in .env and use that if it exists
  if (process.env.FRAME_METADATA) {
    try {
      const metadata = JSON.parse(process.env.FRAME_METADATA);
      console.log("Using pre-signed frame metadata from environment");
      return metadata;
    } catch (error) {
      console.warn("Failed to parse FRAME_METADATA from environment:", error);
    }
  }

  if (!APP_URL) {
    throw new Error("NEXT_PUBLIC_URL not configured");
  }

  // Get the domain from the URL (without https:// prefix)
  const domain = new URL(APP_URL).hostname;
  console.log("Using domain for manifest:", domain);

  const secretEnvVars = getSecretEnvVars();
  if (!secretEnvVars) {
    console.warn(
      "No seed phrase or FID found in environment variables -- generating unsigned metadata"
    );
  }

  return {
    accountAssociation: {
      header:
        "eyJmaWQiOjg1OTE0OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEQ3OTI4NzlFMTZDNWU4N0VDRDUzMzE5RTEzNDcxMTQ3NTczMjZGNjIifQ",
      payload: "eyJkb21haW4iOiJmbGFwcHktZmFyY2FzdGVyLnZlcmNlbC5hcHAifQ",
      signature:
        "MHhhN2JjOGRkMDg1OTY3ZGFkZmY4YzBjMzg5ZWVhODk4YWU1YjEzYjMzMTFkZmU4NzNjYjZlNjQzOTg3NzM1Y2QwMjY1MzFhMDJlMDFhMjAxYmE0NmFkMjZlMmJlNDAwYWI4Njg5ZmU4NjNjNDM4MDJjNDk3YmM5ZmY0NzgyOWM2ZjFi",
    },
    frame: {
      version: "1",
      name: APP_NAME ?? "Frames v2 Demo",
      iconUrl: APP_ICON_URL,
      homeUrl: APP_URL,
      imageUrl: APP_OG_IMAGE_URL,
      buttonTitle: APP_BUTTON_TEXT ?? "Launch Frame",
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      description: APP_DESCRIPTION,
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
    },
  };
}
