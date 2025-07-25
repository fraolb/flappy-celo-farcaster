import { Scene } from "phaser";
import { AudioManager } from "../AudioManager";

interface Score {
  _id: string;
  username: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export class LeaderboardScene extends Scene {
  private audioManager!: AudioManager;

  scoresRef: React.RefObject<{
    userScore: Score | null;
    topScores: Score[] | null;
  }>;

  constructor(
    scoresRef: React.RefObject<{
      userScore: Score | null;
      topScores: Score[] | null;
    }>
  ) {
    super("Leaderboard");
    this.scoresRef = scoresRef;
  }

  create() {
    this.audioManager = new AudioManager(this);

    const gameWidth = this.sys.canvas.width;
    const gameHeight = this.sys.canvas.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;
    const scaleFactor = Math.min(gameWidth / 400, 1);

    // Background setup (same as Instructions)
    const background = this.add.tileSprite(
      0,
      0,
      gameWidth,
      gameHeight,
      "background"
    );
    background.setOrigin(0);
    background.tileScaleX =
      gameWidth / this.textures.get("background").getSourceImage().width;
    background.tileScaleY =
      gameHeight / this.textures.get("background").getSourceImage().height;

    const gradient = this.add
      .rectangle(centerX, centerY, gameWidth, gameHeight, 0x000000, 0.6)
      .setOrigin(0.5);

    // Panel
    const panelWidth = Math.min(gameWidth * 0.9, 400);
    const panelHeight = Math.min(gameHeight * 0.8, 600);
    this.add
      .rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e)
      .setStrokeStyle(2, 0x4cc9f0);

    // Title
    this.add
      .text(centerX, centerY - panelHeight / 2 + 40, "LEADERBOARD", {
        fontFamily: "Arial Black",
        fontSize: 28 * scaleFactor,
        color: "#4cc9f0",
        align: "center",
      })
      .setOrigin(0.5);

    // Get scores from MainMenu (you'll need to pass these in)
    //const scores: Score[] = this.registry.get("topScores") || [];

    // Display scores
    if (
      this.scoresRef?.current?.topScores &&
      this.scoresRef.current?.topScores.length > 0
    ) {
      const startY = centerY - panelHeight / 2 + 100;
      const rowHeight = 30 * scaleFactor;

      // Column headers
      this.add
        .text(centerX - 80, startY, "RANK", {
          fontFamily: "Arial Black",
          fontSize: 16 * scaleFactor,
          color: "#f72585",
        })
        .setOrigin(0.5);

      this.add
        .text(centerX, startY, "PLAYER", {
          fontFamily: "Arial Black",
          fontSize: 16 * scaleFactor,
          color: "#f72585",
        })
        .setOrigin(0.5);

      this.add
        .text(centerX + 80, startY, "SCORE", {
          fontFamily: "Arial Black",
          fontSize: 16 * scaleFactor,
          color: "#f72585",
        })
        .setOrigin(0.5);

      // Score rows
      this.scoresRef.current.topScores.slice(0, 10).forEach((score, index) => {
        const yPos = startY + (index + 1) * rowHeight;

        // Rank
        this.add
          .text(centerX - 80, yPos, `${index + 1}.`, {
            fontFamily: "Arial",
            fontSize: 14 * scaleFactor,
            color: "#ffffff",
          })
          .setOrigin(0.5);

        // Player name (trim if too long)
        const name =
          score.username.length > 12
            ? score.username.substring(0, 9) + "..."
            : score.username;
        this.add
          .text(centerX, yPos, name, {
            fontFamily: "Arial",
            fontSize: 14 * scaleFactor,
            color: "#ffffff",
          })
          .setOrigin(0.5);

        // Score
        this.add
          .text(centerX + 80, yPos, score.score.toString(), {
            fontFamily: "Arial",
            fontSize: 14 * scaleFactor,
            color: "#ffffff",
          })
          .setOrigin(0.5);
      });
    } else {
      this.add
        .text(centerX, centerY, "No scores yet!", {
          fontFamily: "Arial",
          fontSize: 18 * scaleFactor,
          color: "#ffffff",
        })
        .setOrigin(0.5);
    }

    // Back button (same as Instructions)
    const backButton = this.add
      .text(centerX, centerY + panelHeight / 2 - 40, "BACK", {
        fontFamily: "Arial Black",
        fontSize: 20 * scaleFactor,
        color: "#f72585",
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    backButton.on("pointerover", () => {
      backButton.setColor("#b5179e");
      this.audioManager.playSound("menuHover");
    });
    backButton.on("pointerout", () => backButton.setColor("#f72585"));
    backButton.on("pointerdown", () => {
      this.audioManager.playSound("menuSelect");
      this.scene.start("MainMenu");
    });

    gradient.setInteractive().on("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
