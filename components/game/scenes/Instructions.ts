import { Scene } from "phaser";
import { AudioManager } from "../AudioManager";

export class InstructionsScene extends Scene {
  private audioManager!: AudioManager;

  constructor() {
    super("Instructions");
  }

  create() {
    this.audioManager = new AudioManager(this);

    // Get responsive dimensions
    const gameWidth = this.sys.canvas.width;
    const gameHeight = this.sys.canvas.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;
    const scaleFactor = Math.min(gameWidth / 400, 1);

    // Background (same as main menu)
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

    // Dark overlay
    const gradient = this.add.rectangle(
      centerX,
      centerY,
      gameWidth,
      gameHeight,
      0x000000,
      0.6
    );
    gradient.setOrigin(0.5);

    // Instruction panel
    const panelWidth = Math.min(gameWidth * 0.9, 400);
    const panelHeight = Math.min(gameHeight * 0.8, 600);
    this.add
      .rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e)
      .setStrokeStyle(2, 0x4cc9f0);

    // Title
    this.add
      .text(centerX, centerY - panelHeight / 2 + 40, "HOW TO PLAY", {
        fontFamily: "Arial Black",
        fontSize: 28 * scaleFactor,
        color: "#4cc9f0",
        align: "center",
      })
      .setOrigin(0.5);

    // Instruction text
    this.add
      .text(
        centerX,
        centerY - panelHeight / 2 + 200,
        "1. Tap tap to make your rocket fly\n" +
          "2. Avoid obstacles from touching the rocket \n" +
          "3. The longer you survive, the higher your \n score\n\n" +
          "Controls:\n" +
          "- Tap anywhere to jump\n" +
          "- Hold to fly higher",
        {
          fontFamily: "Arial",
          fontSize: 16 * scaleFactor,
          color: "#ffffff",
          align: "left",
          lineSpacing: 10,
        }
      )
      .setOrigin(0.5);

    // Back button
    const backButton = this.add
      .text(centerX, centerY + panelHeight / 2 - 40, "BACK", {
        fontFamily: "Arial Black",
        fontSize: 20 * scaleFactor,
        color: "#f72585",
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Button effects
    backButton.on("pointerover", () => {
      backButton.setColor("#b5179e");
      this.audioManager.playSound("menuHover");
    });
    backButton.on("pointerout", () => backButton.setColor("#f72585"));
    backButton.on("pointerdown", () => {
      this.audioManager.playSound("menuSelect");
      this.scene.start("MainMenu");
    });

    // Make the background interactive to close (optional)
    gradient.setInteractive().on("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }

  update() {
    // Optional: Add any animations here
  }
}
