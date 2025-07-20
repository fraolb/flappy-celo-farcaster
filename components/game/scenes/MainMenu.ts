import { Scene, GameObjects } from 'phaser';
import { AudioManager } from '../AudioManager';

interface Score {
  _id: string;
  username: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export class MainMenu extends Scene {
  background!: GameObjects.Image;
  logo!: GameObjects.Image;
  title!: GameObjects.Text;
  tapToStart!: GameObjects.Text;
  highScoreText!: GameObjects.Text;
  tapToStartTween!: Phaser.Tweens.Tween;
  titleGlowTween!: Phaser.Tweens.Tween;

  // Audio system
  audioManager!: AudioManager;

  onPaymentRequested: () => Promise<void>;
  isProcessing: React.RefObject<boolean>;
  errorRef: React.RefObject<string>;
  showGameRef: React.RefObject<boolean>;
  scoresRef: React.RefObject<{
    userScore: Score | null;
    topScores: Score[] | null;
  }>;

  playButtonText!: Phaser.GameObjects.Text;
  errorDisplay!: Phaser.GameObjects.Text; // Add this property

  constructor(
    onPaymentRequested: () => Promise<void>,
    isProcessing: React.RefObject<boolean>,
    errorRef: React.RefObject<string>,
    showGameRef: React.RefObject<boolean>,
    scoresRef: React.RefObject<{
      userScore: Score | null;
      topScores: Score[] | null;
    }>,
  ) {
    super('MainMenu');
    this.onPaymentRequested = onPaymentRequested;
    this.isProcessing = isProcessing;
    this.errorRef = errorRef;
    this.showGameRef = showGameRef;
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
    this.background = this.add.image(0, 0, 'background');
    this.background.setOrigin(0);

    // Add a subtle gradient overlay for depth
    const gradient = this.add.rectangle(
      centerX,
      centerY,
      gameWidth,
      gameHeight,
      0x000000,
      0.2,
    );
    gradient.setOrigin(0.5);

    // Responsive scaling based on screen width
    const scaleFactor = Math.min(gameWidth / 400, 1); // 400px is base width, scale down for smaller screens

    // Game title with responsive styling
    const titleFontSize = Math.floor(32 * scaleFactor);
    const titleY = centerY - Math.floor(80 * scaleFactor);

    this.title = this.add.text(centerX, titleY, 'FLAPPY ROCKET', {
      fontFamily: 'Arial Black',
      fontSize: titleFontSize,
      color: '#FFD700', // Bright gold
      stroke: '#FF4500', // Orange-red stroke
      strokeThickness: Math.max(2, Math.floor(4 * scaleFactor)),
      align: 'center',
      shadow: {
        offsetX: Math.floor(1 * scaleFactor),
        offsetY: Math.floor(1 * scaleFactor),
        color: '#000000',
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
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // Play button
    const playButtonY = titleY + Math.floor(72 * scaleFactor);
    const playButtonWidth = Math.floor(180 * scaleFactor);
    const playButtonHeight = Math.floor(52 * scaleFactor);
    const borderRadius = Math.floor(12 * scaleFactor);
    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillStyle(0xffffff, 1);
    buttonGraphics.lineStyle(
      Math.max(1, Math.floor(2 * scaleFactor)),
      0xcccccc,
      1,
    );
    buttonGraphics.fillRoundedRect(
      centerX - playButtonWidth / 2,
      playButtonY - playButtonHeight / 2,
      playButtonWidth,
      playButtonHeight,
      borderRadius,
    );
    buttonGraphics.strokeRoundedRect(
      centerX - playButtonWidth / 2,
      playButtonY - playButtonHeight / 2,
      playButtonWidth,
      playButtonHeight,
      borderRadius,
    );
    buttonGraphics.setDepth(1);
    buttonGraphics.setInteractive(
      new Phaser.Geom.Rectangle(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight,
      ),
      Phaser.Geom.Rectangle.Contains,
    );

    this.playButtonText = this.add
      .text(centerX, playButtonY, 'PLAY', {
        fontFamily: 'Arial Black',
        fontSize: Math.floor(24 * scaleFactor),
        color: '#000000',
        stroke: '#cccccc',
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
    // Payment info text below play button
    const paymentInfoFontSize = Math.floor(14 * scaleFactor);
    const paymentInfoY =
      playButtonY + playButtonHeight / 2 + Math.floor(30 * scaleFactor);
    this.add
      .text(centerX, paymentInfoY, 'Pay 0.1 CELO to play', {
        fontFamily: 'Arial',
        fontSize: paymentInfoFontSize,
        color: '#ffffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    // Error text display (initially hidden)
    const errorFontSize = Math.floor(10 * scaleFactor);
    this.errorDisplay = this.add
      .text(
        centerX,
        playButtonY + playButtonHeight / 2 + Math.floor(12 * scaleFactor),
        '',
        {
          fontFamily: 'Arial',
          fontSize: errorFontSize,
          color: '#FF3333',
          align: 'center',
          wordWrap: { width: playButtonWidth + 10 },
        },
      )
      .setOrigin(0.5);

    // Button hover effect
    buttonGraphics.on('pointerover', () => {
      buttonGraphics.clear();
      buttonGraphics.fillStyle(0xfff700, 1); // yellow
      buttonGraphics.lineStyle(
        Math.max(1, Math.floor(2 * scaleFactor)),
        0xcccccc,
        1,
      );
      buttonGraphics.fillRoundedRect(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight,
        borderRadius,
      );
      buttonGraphics.strokeRoundedRect(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight,
        borderRadius,
      );
      this.playButtonText.setColor('#000000'); // black text
    });
    buttonGraphics.on('pointerout', () => {
      buttonGraphics.clear();
      buttonGraphics.fillStyle(0xffffff, 1); // white
      buttonGraphics.lineStyle(
        Math.max(1, Math.floor(2 * scaleFactor)),
        0xcccccc,
        1,
      );
      buttonGraphics.fillRoundedRect(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight,
        borderRadius,
      );
      buttonGraphics.strokeRoundedRect(
        centerX - playButtonWidth / 2,
        playButtonY - playButtonHeight / 2,
        playButtonWidth,
        playButtonHeight,
        borderRadius,
      );
      this.playButtonText.setColor('#000000'); // black text
    });

    // Button click triggers payment request (only once)
    let playClicked = false;
    buttonGraphics.on('pointerdown', async () => {
      if (playClicked || this.isProcessing.current) return;
      playClicked = true;
      buttonGraphics.disableInteractive();
      this.audioManager.playSound('menuSelect');
      this.playButtonText.setText('Processing...');
      this.errorDisplay.setText(''); // Clear error on new attempt

      try {
        await this.onPaymentRequested();
        playClicked = false;
      } catch (err) {
        // Payment failed or was rejected
        this.playButtonText.setText('PLAY');
        buttonGraphics.setInteractive(
          new Phaser.Geom.Rectangle(
            centerX - playButtonWidth / 2,
            playButtonY - playButtonHeight / 2,
            playButtonWidth,
            playButtonHeight,
          ),
          Phaser.Geom.Rectangle.Contains,
        );
        playClicked = false;
        console.log('the err is ', err);
        // Show error message (up to first period)
        let errorMsg = 'Payment was cancelled or failed.';
        if (typeof errorMsg === 'string') {
          const periodIdx = errorMsg.indexOf('.');
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
          this.playButtonText.setText('Processing...');
        }
        if (this.showGameRef.current) {
          this.scene.start('Game');
        }
        // Update error display if errorRef changes
        if (this.errorRef.current) {
          this.playButtonText.setText('PLAY');
          buttonGraphics.setInteractive(
            new Phaser.Geom.Rectangle(
              centerX - playButtonWidth / 2,
              playButtonY - playButtonHeight / 2,
              playButtonWidth,
              playButtonHeight,
            ),
            Phaser.Geom.Rectangle.Contains,
          );
          const periodIdx = this.errorRef.current.indexOf('.');
          const errText = this.errorRef.current.slice(0, periodIdx + 1);
          console.log('Error text:', errText, this.errorRef.current);
          this.errorDisplay.setText(errText);
        }
      },
    });

    // High score display with responsive styling
    const highScoreFontSize = Math.floor(24 * scaleFactor);
    const highScoreY = playButtonY + Math.floor(78 * scaleFactor);

    this.highScoreText = this.add.text(centerX, highScoreY, 'Top 5 Scores', {
      fontFamily: 'Arial Black',
      fontSize: highScoreFontSize,
      color: '#FFD700', // Yellow
      stroke: '#FF4500', // Orange-red stroke
      strokeThickness: Math.max(1, Math.floor(2 * scaleFactor)),
      align: 'center',
      shadow: {
        offsetX: Math.floor(1 * scaleFactor),
        offsetY: Math.floor(1 * scaleFactor),
        color: '#000000',
        blur: Math.floor(2 * scaleFactor),
        fill: true,
      },
    });
    this.highScoreText.setOrigin(0.5);

    console.log('Scores:', this.scoresRef.current);
    // Top scores list
    const topScores = this.scoresRef?.current?.topScores || [];
    const topScoreFontSize = Math.floor(16 * scaleFactor);
    const topScoreStartY = highScoreY + Math.floor(25 * scaleFactor);
    topScores.slice(0, 5).forEach((score: Score, idx: number) => {
      const scoreText = `${idx + 1}. ${score.username} - ${score.score}`;
      this.add
        .text(
          centerX,
          topScoreStartY + idx * Math.floor(20 * scaleFactor),
          scoreText,
          {
            fontFamily: 'Arial',
            fontSize: topScoreFontSize,
            color: '#FFFFFF',
            align: 'center',
            wordWrap: { width: Math.floor(180 * scaleFactor) },
          },
        )
        .setOrigin(0.5);
    });

    // User score display
    const userScore = this.scoresRef?.current?.userScore;
    if (userScore) {
      const userScoreFontSize = Math.floor(22 * scaleFactor);
      const userScoreY =
        topScoreStartY +
        5 * Math.floor(20 * scaleFactor) +
        Math.floor(10 * scaleFactor);
      this.add
        .text(centerX, userScoreY, `Your Score: ${userScore.score}`, {
          fontFamily: 'Arial',
          fontSize: userScoreFontSize,
          color: '#FFD700',
          align: 'center',
          wordWrap: { width: Math.floor(180 * scaleFactor) },
        })
        .setOrigin(0.5);
    }
  }
}
