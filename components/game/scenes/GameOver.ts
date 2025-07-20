import { Scene } from 'phaser';
import { AudioManager } from '../AudioManager';

interface GameOverData {
  score: number;
  highScore: number;
}

export class GameOver extends Scene {
  camera!: Phaser.Cameras.Scene2D.Camera;
  background!: Phaser.GameObjects.Image;
  gameover_text!: Phaser.GameObjects.Text;
  score_text!: Phaser.GameObjects.Text;
  high_score_text!: Phaser.GameObjects.Text;
  tap_to_restart_text!: Phaser.GameObjects.Text;
  main_menu_text!: Phaser.GameObjects.Text;

  // Audio system
  audioManager!: AudioManager;
  shareScore: (score: number) => Promise<void>;

  constructor(shareScore: (score: number) => Promise<void>) {
    super('GameOver');
    this.shareScore = shareScore;
  }

  create(data: GameOverData) {
    // Initialize audio manager
    this.audioManager = new AudioManager(this);

    // Get responsive dimensions
    const gameWidth = this.sys.canvas.width;
    const gameHeight = this.sys.canvas.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    this.camera = this.cameras.main;
    //this.camera.setBackgroundColor(0x1e90ff); // Dodger blue background

    this.background = this.add.image(centerX, centerY, 'background');
    //this.background.setAlpha(0.2);

    // Add gradient overlay for depth
    const gradient = this.add.rectangle(
      centerX,
      centerY,
      gameWidth,
      gameHeight,
      0x000000,
      0.3,
    );
    gradient.setOrigin(0.5);

    // Responsive scaling based on screen width
    const scaleFactor = Math.min(gameWidth / 400, 1);

    // Game Over title with responsive styling
    const gameOverFontSize = Math.floor(36 * scaleFactor);
    const gameOverY = centerY - Math.floor(50 * scaleFactor);

    this.gameover_text = this.add.text(centerX, gameOverY, 'GAME OVER', {
      fontFamily: 'Arial Black',
      fontSize: gameOverFontSize,
      color: '#FF4500', // Orange-red
      stroke: '#8B0000', // Dark red stroke
      strokeThickness: Math.max(2, Math.floor(4 * scaleFactor)),
      align: 'center',
      shadow: {
        offsetX: Math.floor(2 * scaleFactor),
        offsetY: Math.floor(2 * scaleFactor),
        color: '#000000',
        blur: Math.floor(4 * scaleFactor),
        fill: true,
      },
    });
    this.gameover_text.setOrigin(0.5);

    // Score display with responsive styling
    const scoreFontSize = Math.floor(20 * scaleFactor);
    const scoreY = gameOverY + Math.floor(32 * scaleFactor);

    this.score_text = this.add.text(centerX, scoreY, `Score: ${data.score}`, {
      fontFamily: 'Arial Black',
      fontSize: scoreFontSize,
      color: '#FFD700', // Bright gold
      stroke: '#FF4500', // Orange-red stroke
      strokeThickness: Math.max(2, Math.floor(3 * scaleFactor)),
      align: 'center',
      shadow: {
        offsetX: Math.floor(1 * scaleFactor),
        offsetY: Math.floor(1 * scaleFactor),
        color: '#000000',
        blur: Math.floor(2 * scaleFactor),
        fill: true,
      },
    });
    this.score_text.setOrigin(0.5);

    // High score display with responsive styling
    const highScoreY = scoreY + Math.floor(24 * scaleFactor);

    // New high score message with responsive styling
    if (data.score >= data.highScore && data.score > 0) {
      const newRecordFontSize = Math.floor(16 * scaleFactor);
      const newRecordY = highScoreY + Math.floor(24 * scaleFactor);

      const newRecordText = this.add.text(
        centerX,
        newRecordY,
        'NEW RECORD! 🎉',
        {
          fontFamily: 'Arial Black',
          fontSize: newRecordFontSize,
          color: '#FF1493', // Deep pink
          stroke: '#8B0000', // Dark red stroke
          strokeThickness: Math.max(1, Math.floor(2 * scaleFactor)),
          align: 'center',
          shadow: {
            offsetX: Math.floor(1 * scaleFactor),
            offsetY: Math.floor(1 * scaleFactor),
            color: '#000000',
            blur: Math.floor(2 * scaleFactor),
            fill: true,
          },
        },
      );
      newRecordText.setOrigin(0.5);

      // Add celebration animation
      this.tweens.add({
        targets: newRecordText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 500,
        ease: 'Power2',
        yoyo: true,
        repeat: 3,
      });
    }

    // Add 'Play Again' button with rounded corners using graphics
    const buttonY = highScoreY + Math.floor(80 * scaleFactor);
    const buttonWidth = Math.floor(150 * scaleFactor);
    const buttonHeight = Math.floor(52 * scaleFactor);
    const borderRadius = Math.floor(12 * scaleFactor);
    const playAgainGraphics = this.add.graphics();
    playAgainGraphics.fillStyle(0xffffff, 1); // white bg
    playAgainGraphics.lineStyle(
      Math.max(1, Math.floor(2 * scaleFactor)),
      0xffd700, // yellow border
      1,
    );
    playAgainGraphics.fillRoundedRect(
      centerX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      borderRadius,
    );
    playAgainGraphics.strokeRoundedRect(
      centerX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      borderRadius,
    );
    playAgainGraphics.setDepth(1);
    playAgainGraphics.setInteractive(
      new Phaser.Geom.Rectangle(
        centerX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
      ),
      Phaser.Geom.Rectangle.Contains,
    );

    const playAgainText = this.add
      .text(centerX, buttonY, 'PLAY AGAIN', {
        fontFamily: 'Arial Black',
        fontSize: Math.floor(14 * scaleFactor),
        color: '#000000', // black text
        stroke: '#ffea31ff',
        strokeThickness: Math.max(1, Math.floor(2 * scaleFactor)),
        align: 'center',
        shadow: {
          offsetX: Math.floor(1 * scaleFactor),
          offsetY: Math.floor(1 * scaleFactor),
          color: '#000000',
          blur: Math.floor(2 * scaleFactor),
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(2);

    playAgainGraphics.on('pointerover', () => {
      playAgainGraphics.clear();
      playAgainGraphics.fillStyle(0xffd700, 1); // yellow bg
      playAgainGraphics.lineStyle(
        Math.max(1, Math.floor(2 * scaleFactor)),
        0xffd700, // yellow border
        1,
      );
      playAgainGraphics.fillRoundedRect(
        centerX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        borderRadius,
      );
      playAgainGraphics.strokeRoundedRect(
        centerX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        borderRadius,
      );
      playAgainText.setColor('#000000'); // black text
    });
    playAgainGraphics.on('pointerout', () => {
      playAgainGraphics.clear();
      playAgainGraphics.fillStyle(0xffffff, 1); // white bg
      playAgainGraphics.lineStyle(
        Math.max(1, Math.floor(2 * scaleFactor)),
        0xffd700, // yellow border
        1,
      );
      playAgainGraphics.fillRoundedRect(
        centerX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        borderRadius,
      );
      playAgainGraphics.strokeRoundedRect(
        centerX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        borderRadius,
      );
      playAgainText.setColor('#000000'); // black text
    });
    playAgainGraphics.on('pointerdown', () => {
      this.audioManager.playSound('menuSelect');
      this.scene.start('MainMenu');
    });

    // Add 'Share Score' rounded button below Play Again
    const shareButtonY = buttonY + buttonHeight + Math.floor(20 * scaleFactor);
    const shareButtonWidth = Math.floor(140 * scaleFactor);
    const shareButtonHeight = Math.floor(32 * scaleFactor);
    const shareBorderRadius = Math.floor(12 * scaleFactor);
    const shareGraphics = this.add.graphics();
    shareGraphics.fillStyle(0x1e90ff, 0.95); // Dodger blue
    shareGraphics.lineStyle(
      Math.max(1, Math.floor(2 * scaleFactor)),
      0xffd700,
      1,
    ); // Gold border
    shareGraphics.fillRoundedRect(
      centerX - shareButtonWidth / 2,
      shareButtonY - shareButtonHeight / 2,
      shareButtonWidth,
      shareButtonHeight,
      shareBorderRadius,
    );
    shareGraphics.strokeRoundedRect(
      centerX - shareButtonWidth / 2,
      shareButtonY - shareButtonHeight / 2,
      shareButtonWidth,
      shareButtonHeight,
      shareBorderRadius,
    );
    shareGraphics.setDepth(1);
    shareGraphics.setInteractive(
      new Phaser.Geom.Rectangle(
        centerX - shareButtonWidth / 2,
        shareButtonY - shareButtonHeight / 2,
        shareButtonWidth,
        shareButtonHeight,
      ),
      Phaser.Geom.Rectangle.Contains,
    );

    const shareText = this.add
      .text(centerX, shareButtonY, 'SHARE SCORE', {
        fontFamily: 'Arial Black',
        fontSize: Math.floor(14 * scaleFactor),
        color: '#FFFFFF',
        stroke: '#FFD700',
        strokeThickness: Math.max(1, Math.floor(2 * scaleFactor)),
        align: 'center',
        shadow: {
          offsetX: Math.floor(1 * scaleFactor),
          offsetY: Math.floor(1 * scaleFactor),
          color: '#000000',
          blur: Math.floor(2 * scaleFactor),
          fill: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(2);

    shareGraphics.on('pointerover', () => {
      shareGraphics.clear();
      shareGraphics.fillStyle(0xffd700, 1); // Gold
      shareGraphics.lineStyle(
        Math.max(1, Math.floor(2 * scaleFactor)),
        0x1e90ff,
        1,
      ); // Blue border
      shareGraphics.fillRoundedRect(
        centerX - shareButtonWidth / 2,
        shareButtonY - shareButtonHeight / 2,
        shareButtonWidth,
        shareButtonHeight,
        shareBorderRadius,
      );
      shareGraphics.strokeRoundedRect(
        centerX - shareButtonWidth / 2,
        shareButtonY - shareButtonHeight / 2,
        shareButtonWidth,
        shareButtonHeight,
        shareBorderRadius,
      );
      shareText.setColor('#0d0d0eff');
    });
    shareGraphics.on('pointerout', () => {
      shareGraphics.clear();
      shareGraphics.fillStyle(0x1e90ff, 0.95); // Dodger blue
      shareGraphics.lineStyle(
        Math.max(1, Math.floor(2 * scaleFactor)),
        0xffd700,
        1,
      ); // Gold border
      shareGraphics.fillRoundedRect(
        centerX - shareButtonWidth / 2,
        shareButtonY - shareButtonHeight / 2,
        shareButtonWidth,
        shareButtonHeight,
        shareBorderRadius,
      );
      shareGraphics.strokeRoundedRect(
        centerX - shareButtonWidth / 2,
        shareButtonY - shareButtonHeight / 2,
        shareButtonWidth,
        shareButtonHeight,
        shareBorderRadius,
      );
      shareText.setColor('#FFFFFF');
    });
    shareGraphics.on('pointerdown', () => {
      this.audioManager.playSound('menuSelect');
      // TODO: Implement share logic here
      // For now, just show a message or call a share function
      //alert(`Share your score: ${data.score}`);
      this.shareScore(data.score).catch(err => {
        console.error('Error sharing score:', err);
      });
    });

    // Keyboard support for main menu
    this.input.keyboard?.once('keydown-M', () => {
      this.audioManager.playSound('menuSelect');
      this.scene.start('MainMenu');
    });
  }
}
