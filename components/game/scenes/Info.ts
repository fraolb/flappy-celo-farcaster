import { Scene } from "phaser";
import { AudioManager } from "../AudioManager";

export class InfoScene extends Scene {
  private audioManager!: AudioManager;

  constructor() {
    super("Info");
  }

  create() {
    this.audioManager = new AudioManager(this);

    const gameWidth = this.sys.canvas.width;
    const gameHeight = this.sys.canvas.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;
    const scaleFactor = Math.min(gameWidth / 400, 1);

    // Background setup (same as others)
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
    const panelHeight = Math.min(gameHeight * 0.7, 500);
    this.add
      .rectangle(centerX, centerY, panelWidth, panelHeight, 0x1a1a2e)
      .setStrokeStyle(2, 0x4cc9f0);

    // Title
    this.add
      .text(centerX, centerY - panelHeight / 2 + 40, "ABOUT", {
        fontFamily: "Arial Black",
        fontSize: 28 * scaleFactor,
        color: "#4cc9f0",
        align: "center",
      })
      .setOrigin(0.5);

    // Game info
    this.add
      .text(
        centerX,
        centerY - 50,
        "FLAPPY ROCKET V3\n\n" +
          "A fun space adventure game\n" +
          "Built with Phaser 3\n\n" +
          "Developed by Fraol Bereket\n" +
          "Version 3.0.0\n\n",
        {
          fontFamily: "Arial",
          fontSize: 16 * scaleFactor,
          color: "#ffffff",
          align: "center",
          lineSpacing: 10,
        }
      )
      .setOrigin(0.5);

    // Social/links (optional)
    const linkStyle = {
      fontFamily: "Arial",
      fontSize: 14 * scaleFactor,
      color: "#4cc9f0",
      align: "center",
    };

    const website = this.add
      .text(centerX, centerY + 50, "Lets Connect on Farcaster", linkStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    website.on("pointerover", () => website.setColor("#067fa3ff"));
    website.on("pointerout", () => website.setColor("#4cc9f0"));
    website.on("pointerdown", () => {
      this.audioManager.playSound("menuSelect");
      window.open("https://farcaster.xyz/fraolchris", "_blank");
    });

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
