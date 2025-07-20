// Game constants for Flappy Bird clone

// Responsive design constants
export const IS_MOBILE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
export const IS_TOUCH_DEVICE =
  'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Base dimensions (desktop)
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 640;

// Mobile dimensions (16:9 aspect ratio)
// Get mobile dimensions based on orientation
export const MOBILE_WIDTH = 480;
export const MOBILE_HEIGHT = 640;

// Get actual game dimensions based on device
export const getGameWidth = () => (IS_MOBILE ? MOBILE_WIDTH : GAME_WIDTH);
export const getGameHeight = () => (IS_MOBILE ? MOBILE_HEIGHT : GAME_HEIGHT);

// UI scaling factors
export const MOBILE_UI_SCALE = 0.8;
export const MOBILE_FONT_SCALE = 0.7;

// Physics
export const GRAVITY_Y = 700;
export const FLAP_VELOCITY = -250;
export const MAX_VELOCITY = 400;
export const ROTATION_SPEED = 0.01;

// Pipes
export const PIPE_SPEED = 180;
export const INITIAL_PIPE_SPAWN_INTERVAL = 2200; // ms
export const PIPE_GAP = 140; // px (fair challenge)
export const PIPE_WIDTH = 52;

// Mobile-specific pipe adjustments
export const MOBILE_PIPE_GAP = 120; // Slightly smaller gap for mobile
export const MOBILE_PIPE_SPEED = 170; // Slightly slower for mobile

// Difficulty progression
export const SPEED_INCREASE_INTERVAL = 30000; // ms
export const SPEED_INCREASE_FACTOR = 0.92; // 8% faster per interval

// Touch input settings
export const TOUCH_DEAD_ZONE = 50; // Minimum distance for touch to register
export const TOUCH_COOLDOWN = 100; // ms between touch inputs
