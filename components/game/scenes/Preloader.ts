/* eslint-disable @typescript-eslint/no-explicit-any */

import { Scene } from "phaser";

export class Preloader extends Scene {
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super("Preloader");
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(400, 300, "background");

    // Create improved loading UI
    this.createLoadingUI();
  }

  private createLoadingUI() {
    const width = this.scale.width;
    const height = this.scale.height;
    const isMobile = width < 600;

    // Responsive font sizes
    const titleFontSize = isMobile ? "22px" : "32px";
    const progressFontSize = isMobile ? "16px" : "24px";
    const barWidth = Math.floor(width * 0.7);
    const barHeight = isMobile ? 18 : 30;

    // Loading title
    this.add
      .text(width / 2, height * 0.25, "Loading Flappy Rocket V2", {
        fontSize: titleFontSize,
        fontFamily: "Arial Black",
        color: "#FFD700",
        stroke: "#FF4500",
        strokeThickness: isMobile ? 2 : 4,
      })
      .setOrigin(0.5);

    // Progress bar background
    this.add
      .rectangle(width / 2, height / 2, barWidth, barHeight, 0x333333, 0.8)
      .setStrokeStyle(isMobile ? 1 : 2, 0xffffff)
      .setOrigin(0.5);

    // Progress bar (anchor left edge)
    this.progressBar = this.add
      .rectangle(
        width / 2 - barWidth / 2,
        height / 2,
        0,
        barHeight - 4,
        0x00ff00
      )
      .setOrigin(0, 0.5);

    // Progress text
    this.progressText = this.add
      .text(width / 2, height / 2 + barHeight + (isMobile ? 12 : 20), "0%", {
        fontSize: progressFontSize,
        fontFamily: "Arial",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("assets");

    // Core game assets
    this.load.image("bird", "2rocket.png");
    this.load.image("birdSprite", "birdSprite.png");
    this.load.image("pipe", "block.webp");
    this.load.image("pipe2", "block2.webp");
    this.load.image("background", "bg.png");
    this.load.spritesheet("rocket", "rock.webp", {
      frameWidth: 100,
      frameHeight: 50,
    });
    this.load.image("heart", "1heart.png");
    this.load.image("logo", "splash.png");

    // UI assets
    this.load.image("pause", "pause.png");

    // button assets
    this.load.image("instructionIcon", "user-guide.png");
    this.load.image("leaderboardIcon", "leaderboard.png");
    this.load.image("infoIcon", "guidebook.png");

    //audio assets
    this.load.audio("punch", "punch.mp3");
    this.load.audio("jump", "jump.mp3");
    this.load.audio("game_over", "game_over.mp3");

    // Set up progress tracking
    this.load.on("progress", (progress: number) => {
      this.updateProgress(progress);
    });

    this.load.on("complete", () => {
      this.progressText.setText("100%");
    });

    // Generate audio files using Web Audio API
    this.generateAudioFiles();
  }

  private updateProgress(progress: number) {
    // Update progress bar width only (left edge stays fixed)
    const barWidth =
      (this.scale.width - Math.floor(this.scale.width * 0.3)) * progress;
    this.progressBar.width = barWidth;
    // No need to update x position since origin is (0, 0.5)

    // Update progress text
    const percentage = Math.round(progress * 100);
    this.progressText.setText(`${percentage}%`);
  }

  generateAudioFiles() {
    // Generate simple audio files using Web Audio API
    this.generateSound("flap", 200, "sine", 0.3);
    this.generateSound("score", 800, "square", 0.2);
    this.generateSound("collision", 150, "sawtooth", 0.4);
    this.generateSound("gameOver", 300, "triangle", 0.5);
  }

  generateSound(
    key: string,
    frequency: number,
    type: OscillatorType,
    volume: number
  ) {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    // Store the audio context and nodes for later use
    if (!this.cache.audio.has(key)) {
      this.cache.audio.add(key, {
        context: audioContext,
        oscillator: oscillator,
        gainNode: gainNode,
        frequency: frequency,
        type: type,
        volume: volume,
      });
    }
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    // Create animations
    this.anims.create({
      key: "fly",
      frames: this.anims.generateFrameNumbers("rocket", {
        start: 0,
        end: 2,
      }),
      frameRate: 6,
      repeat: -1,
      yoyo: true,
    });

    // Add a small delay for better UX
    this.time.delayedCall(500, () => {
      this.scene.start("MainMenu");
    });
  }
}
