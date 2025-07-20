export class AudioManager {
  private scene: Phaser.Scene;
  private audioContext: AudioContext;
  private sounds: Map<string, any> = new Map();
  private backgroundMusic: any = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.initializeSounds();
  }

  private initializeSounds() {
    // Initialize sound effects
    this.createSound('flap', 200, 'sine', 0.3);
    this.createSound('score', 800, 'square', 0.2);
    this.createSound('collision', 150, 'sawtooth', 0.4);
    this.createSound('gameOver', 300, 'triangle', 0.5);
    this.createSound('menuSelect', 400, 'sine', 0.2);
  }

  private createSound(
    key: string,
    frequency: number,
    type: OscillatorType,
    volume: number
  ) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(
      frequency,
      this.audioContext.currentTime
    );

    gainNode.gain.setValueAtTime(
      volume * this.volume,
      this.audioContext.currentTime
    );

    this.sounds.set(key, {
      oscillator: oscillator,
      gainNode: gainNode,
      frequency: frequency,
      type: type,
      volume: volume
    });
  }

  playSound(key: string) {
    if (this.isMuted) return;

    const sound = this.sounds.get(key);
    if (!sound) return;

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = sound.type;
    oscillator.frequency.setValueAtTime(
      sound.frequency,
      this.audioContext.currentTime
    );

    gainNode.gain.setValueAtTime(
      sound.volume * this.volume,
      this.audioContext.currentTime
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.3
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  startBackgroundMusic() {
    if (this.isMuted) return;

    // Create a simple background music loop
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3 note

    gainNode.gain.setValueAtTime(
      0.1 * this.volume,
      this.audioContext.currentTime
    );

    this.backgroundMusic = { oscillator, gainNode };

    oscillator.start(this.audioContext.currentTime);
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.oscillator.stop();
      this.backgroundMusic = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBackgroundMusic();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  isAudioMuted(): boolean {
    return this.isMuted;
  }
}
