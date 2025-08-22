/* eslint-disable @typescript-eslint/no-explicit-any */

import { Scene, GameObjects } from "phaser";
import { AudioManager } from "../AudioManager";

interface Score {
  _id: string;
  username: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

interface GamePlayType {
  username: string;
  wallet: string;
  playsLeft: number;
  lastPlay: Date;
  lastEarned: number;
  totalEarned: number;
}

export class MainMenu extends Scene {
  background!: Phaser.GameObjects.TileSprite;
  logo!: GameObjects.Image;
  title!: GameObjects.Text;
  tapToStart!: GameObjects.Text;
  highScoreText!: GameObjects.Text;
  tapToStartTween!: Phaser.Tweens.Tween;
  titleGlowTween!: Phaser.Tweens.Tween;

  // Audio system
  audioManager!: AudioManager;

  onPaymentRequested: () => Promise<void>;
  handleConnectToCelo: () => Promise<void>;
  isProcessing: React.RefObject<boolean>;
  isConnected: boolean;
  errorRef: React.RefObject<string>;
  showGameRef: React.RefObject<boolean>;
  userGamePlayRef: React.RefObject<GamePlayType | null>;
  scoresRef: React.RefObject<{
    userScore: Score | null;
    topScores: Score[] | null;
  }>;

  playButtonText!: Phaser.GameObjects.Text;
  errorDisplay!: Phaser.GameObjects.Text; // Add this property

  constructor(
    onPaymentRequested: () => Promise<void>,
    handleConnectToCelo: () => Promise<void>,
    isConnected: boolean,
    isProcessing: React.RefObject<boolean>,
    errorRef: React.RefObject<string>,
    showGameRef: React.RefObject<boolean>,
    userGamePlayRef: React.RefObject<GamePlayType | null>,
    scoresRef: React.RefObject<{
      userScore: Score | null;
      topScores: Score[] | null;
    }>
  ) {
    super("MainMenu");
    this.onPaymentRequested = onPaymentRequested;
    this.handleConnectToCelo = handleConnectToCelo;
    this.isConnected = isConnected;
    this.isProcessing = isProcessing;
    this.errorRef = errorRef;
    this.showGameRef = showGameRef;
    this.userGamePlayRef = userGamePlayRef;
    this.scoresRef = scoresRef;
  }

  create() {
    // Initialize audio manager
    this.audioManager = new AudioManager(this);

    // Get responsive dimensions
    const gameWidth = this.sys.canvas.width;
    const gameHeight = this.sys.canvas.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Background with enhanced styling
    // Use tileSprite for background
    this.background = this.add.tileSprite(
      0,
      0,
      gameWidth,
      gameHeight,
      "background"
    );
    this.background.setOrigin(0);

    // Scale the tile so the image fits the canvas
    const bgTexture = this.textures.get("background").getSourceImage();
    const scaleX = gameWidth / bgTexture.width;
    const scaleY = gameHeight / bgTexture.height;
    this.background.tileScaleX = scaleX;
    this.background.tileScaleY = scaleY;

    // Add a subtle gradient overlay for depth
    const gradient = this.add.rectangle(
      centerX,
      centerY,
      gameWidth,
      gameHeight,
      0x000000,
      0.2
    );
    gradient.setOrigin(0.5);

    // Responsive scaling based on screen width
    const scaleFactor = Math.min(gameWidth / 400, 1); // 400px is base width, scale down for smaller screens

    // Add logo image above the title
    const logoSize = Math.floor(84 * scaleFactor); // Adjust size as needed
    const logoY = centerY - Math.floor(170 * scaleFactor); // Position above the title
    this.logo = this.add.image(centerX, logoY, "logo");
    this.logo.setOrigin(0.5);
    this.logo.setDisplaySize(logoSize, logoSize);

    // Game title with responsive styling
    const titleFontSize = Math.floor(27 * scaleFactor);
    const titleY = centerY - Math.floor(80 * scaleFactor);

    this.title = this.add.text(centerX, titleY, "FLAPPY ROCKET V2", {
      fontFamily: "Arial Black",
      fontSize: titleFontSize,
      color: "#FFD700", // Bright gold
      stroke: "#FF4500", // Orange-red stroke
      strokeThickness: Math.max(2, Math.floor(4 * scaleFactor)),
      align: "center",
      shadow: {
        offsetX: Math.floor(1 * scaleFactor),
        offsetY: Math.floor(1 * scaleFactor),
        color: "#000000",
        blur: Math.floor(2 * scaleFactor),
        fill: true,
      },
    });
    this.title.setOrigin(0.5);

    // Add glowing animation to title
    this.titleGlowTween = this.tweens.add({
      targets: this.title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      ease: "Sine.inOut",
      yoyo: true,
      repeat: -1,
    });

    // --- Connect to Celo Button ---
    const connectBtnY = centerY + Math.floor(10 * scaleFactor);
    const connectBtnWidth = Math.floor(180 * scaleFactor);
    const connectBtnHeight = Math.floor(52 * scaleFactor);
    const connectBtnRadius = Math.floor(12 * scaleFactor);

    const connectBtnGraphics = this.add.graphics();
    connectBtnGraphics.fillStyle(0x35d07f, 1); // Celo green
    connectBtnGraphics.lineStyle(
      Math.max(1, Math.floor(2 * scaleFactor)),
      0x2e7d4f,
      1
    );
    connectBtnGraphics.fillRoundedRect(
      centerX - connectBtnWidth / 2,
      connectBtnY - connectBtnHeight / 2,
      connectBtnWidth,
      connectBtnHeight,
      connectBtnRadius
    );
    connectBtnGraphics.strokeRoundedRect(
      centerX - connectBtnWidth / 2,
      connectBtnY - connectBtnHeight / 2,
      connectBtnWidth,
      connectBtnHeight,
      connectBtnRadius
    );
    connectBtnGraphics.setDepth(1);
    connectBtnGraphics.setInteractive(
      new Phaser.Geom.Rectangle(
        centerX - connectBtnWidth / 2,
        connectBtnY - connectBtnHeight / 2,
        connectBtnWidth,
        connectBtnHeight
      ),
      Phaser.Geom.Rectangle.Contains
    );

    // Play button
    const playButtonY = titleY + Math.floor(72 * scaleFactor);
    const playButtonWidth = Math.floor(180 * scaleFactor);
    const playButtonHeight = Math.floor(52 * scaleFactor);
    const borderRadius = Math.floor(12 * scaleFactor);

    if (this.isConnected == true) {
      connectBtnGraphics.destroy();
      //connectBtnText.destroy();
      // Show the Play button immediately if already connected
      this.showPlayButton(
        centerX,
        titleY,
        scaleFactor,
        playButtonY,
        playButtonWidth,
        playButtonHeight,
        borderRadius
      );
    } else {
      const connectBtnText = this.add
        .text(centerX, connectBtnY, "Connect to Celo", {
          fontFamily: "Arial Black",
          fontSize: Math.floor(20 * scaleFactor),
          color: "#fff",
          stroke: "#2e7d4f",
          strokeThickness: Math.max(1, Math.floor(2 * scaleFactor)),
          align: "center",
          shadow: {
            offsetX: Math.floor(1 * scaleFactor),
            offsetY: Math.floor(1 * scaleFactor),
            color: "#000000",
            blur: Math.floor(2 * scaleFactor),
            fill: true,
          },
        })
        .setOrigin(0.5)
        .setDepth(2);

      // Button hover effect for connect
      connectBtnGraphics.on("pointerover", () => {
        connectBtnGraphics.clear();
        connectBtnGraphics.fillStyle(0x43e68b, 1); // lighter green
        connectBtnGraphics.lineStyle(
          Math.max(1, Math.floor(2 * scaleFactor)),
          0x2e7d4f,
          1
        );
        connectBtnGraphics.fillRoundedRect(
          centerX - connectBtnWidth / 2,
          connectBtnY - connectBtnHeight / 2,
          connectBtnWidth,
          connectBtnHeight,
          connectBtnRadius
        );
        connectBtnGraphics.strokeRoundedRect(
          centerX - connectBtnWidth / 2,
          connectBtnY - connectBtnHeight / 2,
          connectBtnWidth,
          connectBtnHeight,
          connectBtnRadius
        );
        connectBtnText.setColor("#fff");
      });
      connectBtnGraphics.on("pointerout", () => {
        connectBtnGraphics.clear();
        connectBtnGraphics.fillStyle(0x35d07f, 1); // Celo green
        connectBtnGraphics.lineStyle(
          Math.max(1, Math.floor(2 * scaleFactor)),
          0x2e7d4f,
          1
        );
        connectBtnGraphics.fillRoundedRect(
          centerX - connectBtnWidth / 2,
          connectBtnY - connectBtnHeight / 2,
          connectBtnWidth,
          connectBtnHeight,
          connectBtnRadius
        );
        connectBtnGraphics.strokeRoundedRect(
          centerX - connectBtnWidth / 2,
          connectBtnY - connectBtnHeight / 2,
          connectBtnWidth,
          connectBtnHeight,
          connectBtnRadius
        );
        connectBtnText.setColor("#fff");
      });

      // Connect button click
      connectBtnGraphics.on("pointerdown", async () => {
        connectBtnGraphics.disableInteractive();
        connectBtnText.setText("Connecting...");
        try {
          await this.handleConnectToCelo();

          connectBtnGraphics.destroy();
          connectBtnText.destroy();

          // Delay showing the Play button to avoid accidental click-through
          this.time.delayedCall(100, () => {
            this.showPlayButton(
              centerX,
              titleY,
              scaleFactor,
              playButtonY,
              playButtonWidth,
              playButtonHeight,
              borderRadius
            );
          });
        } catch (err) {
          console.log("Connection error:", err);
          connectBtnText.setText("Connect to Celo");
          connectBtnGraphics.setInteractive(
            new Phaser.Geom.Rectangle(
              centerX - connectBtnWidth / 2,
              connectBtnY - connectBtnHeight / 2,
              connectBtnWidth,
              connectBtnHeight
            ),
            Phaser.Geom.Rectangle.Contains
          );
          // Optionally show error
        }
      });

      // Hide the Play button initially
      if (this.playButtonText) this.playButtonText.setVisible(false);
    }

    // User score display
    const userScore = this.scoresRef?.current?.userScore;
    if (userScore) {
      const userScoreFontSize = Math.floor(24 * scaleFactor);
      const userScoreY = playButtonY + Math.floor(78 * scaleFactor);
      this.add
        .text(centerX, userScoreY, `Your Score: ${userScore.score}`, {
          fontFamily: "Arial Black",
          fontSize: userScoreFontSize,
          color: "#FFD700", // Yellow
          stroke: "#FF4500", // Orange-red stroke
          strokeThickness: Math.max(1, Math.floor(2 * scaleFactor)),
          align: "center",
          shadow: {
            offsetX: Math.floor(1 * scaleFactor),
            offsetY: Math.floor(1 * scaleFactor),
            color: "#000000",
            blur: Math.floor(2 * scaleFactor),
            fill: true,
          },
        })
        .setOrigin(0.5);
    }

    // Total user rewards display with responsive styling
    const totalUserEarned = this.userGamePlayRef?.current?.totalEarned;
    if (totalUserEarned) {
      const totalRewardsFontSize = Math.floor(22 * scaleFactor);
      const totalRewardsY =
        playButtonY +
        5 * Math.floor(20 * scaleFactor) +
        Math.floor(10 * scaleFactor);

      this.highScoreText = this.add.text(
        centerX,
        totalRewardsY,
        `Total Rewards ${totalUserEarned}`,
        {
          fontFamily: "Arial",
          fontSize: totalRewardsFontSize,
          color: "#FFD700",
          align: "center",
          wordWrap: { width: Math.floor(180 * scaleFactor) },
        }
      );
      this.highScoreText.setOrigin(0.5);
    }

    // ====================
    // Add Buttons Row
    // ====================
    const buttonRowY =
      this.highScoreText.y +
      (this.scoresRef?.current?.userScore
        ? Math.floor(220 * scaleFactor)
        : Math.floor(180 * scaleFactor));

    // Button settings
    const buttonSpacing = Math.floor(30 * scaleFactor);
    const buttonSize = Math.floor(50 * scaleFactor);
    const totalWidth = buttonSize * 3 + buttonSpacing * 2;
    const startX = centerX - totalWidth / 2 + buttonSize / 2;

    // Instruction Button
    const instructionBtn = this.add
      .image(startX, buttonRowY, "instructionIcon")
      .setDisplaySize(buttonSize, buttonSize)
      .setInteractive({ useHandCursor: true })
      .setData("scene", "Instructions");

    // Leaderboard Button
    const leaderboardBtn = this.add
      .image(startX + buttonSize + buttonSpacing, buttonRowY, "leaderboardIcon")
      .setDisplaySize(buttonSize, buttonSize)
      .setInteractive({ useHandCursor: true })
      .setData("scene", "Leaderboard");

    // Info Button
    const infoBtn = this.add
      .image(startX + (buttonSize + buttonSpacing) * 2, buttonRowY, "infoIcon")
      .setDisplaySize(buttonSize, buttonSize)
      .setInteractive({ useHandCursor: true })
      .setData("scene", "Info");

    // Add hover effects to all buttons
    [instructionBtn, leaderboardBtn, infoBtn].forEach((button) => {
      // Scale up on hover
      button.on("pointerover", () => {
        this.tweens.add({
          targets: button,
          scaleX: 0.15,
          scaleY: 0.15,
          duration: 100,
          ease: "Power1",
        });
        this.audioManager.playSound("menuHover");
      });

      // Scale back to normal
      button.on("pointerout", () => {
        this.tweens.add({
          targets: button,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 100,
          ease: "Power1",
        });
      });

      // Click handler
      button.on("pointerdown", () => {
        this.audioManager.playSound("menuSelect");
        this.scene.start(button.getData("scene"));
      });
    });
  }

  update() {
    if (this.background) {
      this.background.tilePositionX += 1; // Move right-to-left, adjust speed as needed
    }
  }

  // Helper to show the Play button after wallet connection
  showPlayButton(
    centerX: number,
    titleY: number,
    scaleFactor: number,
    playButtonY: number,
    playButtonWidth: number,
    playButtonHeight: number,
    borderRadius: number
  ) {
    // ...your existing play button code here...

    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillStyle(0xffffff, 1);
    buttonGraphics.lineStyle(
      Math.max(1, Math.floor(2 * scaleFactor)),
      0xcccccc,
      1
    );
    buttonGraphics.fillRoundedRect(
      centerX - playButtonWidth / 2,
      playButtonY - playButtonHeight / 2,
      playButtonWidth,
      playButtonHeight,
      borderRadius
    );
    buttonGraphics.strokeRoundedRect(
      centerX - playButtonWidth / 2,
      playButtonY - playButtonHeight / 2,
      playButtonWidth,
      playButtonHeight,
      borderRadius
    );
    buttonGraphics.setDepth(1);
    buttonGraphics.setInteractive(
      new Phaser.Geom.Rectangle(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight
      ),
      Phaser.Geom.Rectangle.Contains
    );

    this.playButtonText = this.add
      .text(centerX, playButtonY, "PLAY", {
        fontFamily: "Arial Black",
        fontSize: Math.floor(24 * scaleFactor),
        color: "#000000",
        stroke: "#cccccc",
        strokeThickness: Math.max(1, Math.floor(2 * scaleFactor)),
        align: "center",
        shadow: {
          offsetX: Math.floor(1 * scaleFactor),
          offsetY: Math.floor(1 * scaleFactor),
          color: "#000000",
          blur: Math.floor(2 * scaleFactor),
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Error text display (initially hidden)
    const errorFontSize = Math.floor(14 * scaleFactor);
    const errorY =
      playButtonY + playButtonHeight / 2 + Math.floor(30 * scaleFactor);
    this.errorDisplay = this.add
      .text(centerX, errorY, "", {
        fontFamily: "Arial",
        fontSize: errorFontSize,
        color: "#ffffffff",
        align: "center",
        wordWrap: { width: playButtonWidth + 10 },
      })
      .setOrigin(0.5);

    // Button hover effect
    buttonGraphics.on("pointerover", () => {
      buttonGraphics.clear();
      buttonGraphics.fillStyle(0xfff700, 1); // yellow
      buttonGraphics.lineStyle(
        Math.max(1, Math.floor(2 * scaleFactor)),
        0xcccccc,
        1
      );
      buttonGraphics.fillRoundedRect(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight,
        borderRadius
      );
      buttonGraphics.strokeRoundedRect(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight,
        borderRadius
      );
      this.playButtonText.setColor("#000000"); // black text
    });
    buttonGraphics.on("pointerout", () => {
      buttonGraphics.clear();
      buttonGraphics.fillStyle(0xffffff, 1); // white
      buttonGraphics.lineStyle(
        Math.max(1, Math.floor(2 * scaleFactor)),
        0xcccccc,
        1
      );
      buttonGraphics.fillRoundedRect(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight,
        borderRadius
      );
      buttonGraphics.strokeRoundedRect(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight,
        borderRadius
      );
      this.playButtonText.setColor("#000000"); // black text
    });

    // Button click triggers payment request (only once)
    let playClicked = false;
    buttonGraphics.on("pointerdown", async () => {
      if (playClicked || this.isProcessing.current) return;
      playClicked = true;
      buttonGraphics.disableInteractive();
      this.audioManager.playSound("menuSelect");
      this.playButtonText.setText("Processing...");
      this.errorDisplay.setText(""); // Clear error on new attempt

      try {
        await this.onPaymentRequested();
        playClicked = false;
      } catch (err) {
        // Payment failed or was rejected
        this.playButtonText.setText("PLAY");
        buttonGraphics.setInteractive(
          new Phaser.Geom.Rectangle(
            centerX - playButtonWidth / 2,
            playButtonY - playButtonHeight / 2,
            playButtonWidth,
            playButtonHeight
          ),
          Phaser.Geom.Rectangle.Contains
        );
        playClicked = false;
        console.log("the err is ", err);
        // Show error message (up to first period)
        let errorMsg = "Payment was cancelled or failed.";
        if (typeof errorMsg === "string") {
          const periodIdx = errorMsg.indexOf(".");
          if (periodIdx !== -1) {
            errorMsg = errorMsg.slice(0, periodIdx + 1);
          }
        }
        this.errorDisplay.setText(errorMsg);
      }
    });

    // Poll for showGameRef to change scene
    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        if (this.isProcessing.current && !this.showGameRef.current) {
          this.playButtonText.setText("Processing...");
        }
        if (this.showGameRef.current) {
          this.scene.start("Game");
        }
        // Update error display if errorRef changes
        if (this.errorRef.current) {
          this.playButtonText.setText("PLAY");
          buttonGraphics.setInteractive(
            new Phaser.Geom.Rectangle(
              centerX - playButtonWidth / 2,
              playButtonY - playButtonHeight / 2,
              playButtonWidth,
              playButtonHeight
            ),
            Phaser.Geom.Rectangle.Contains
          );
          const periodIdx = this.errorRef.current.indexOf(".");
          const errText = this.errorRef.current.slice(0, periodIdx + 1);
          console.log("Error text:", errText, this.errorRef.current);
          this.errorDisplay.setText(errText);
        }
      },
    });

    if (this.playButtonText) this.playButtonText.setVisible(true);
  }
}
