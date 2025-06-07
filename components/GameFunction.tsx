import kaplay, { AudioPlay, GameObj } from "kaplay";

export function runGame(
  canvas: HTMLCanvasElement,
  setStarted: (started: boolean) => void
) {
  // --- Game logic ---
  const k = kaplay({
    global: false,
    width: 480,
    height: 640,
    canvas: canvas,
  });

  // Load assets
  k.loadSprite("bg", "/assets/bg.png");
  k.loadSprite("rocket", "/assets/rocket.png", {
    sliceX: 3,
    sliceY: 1,
    anims: {
      fly: { from: 0, to: 2, loop: true, speed: 6, pingpong: true },
    },
  });
  k.loadSprite("floor", "/assets/floor.png");
  k.loadSprite("top-block", "/assets/block2.png");
  k.loadSprite("bottom-block", "/assets/block.png");
  k.loadSprite("astronaut", "/assets/astronaut.png", {
    sliceX: 5,
    sliceY: 1,
    anims: {
      astro: { from: 0, to: 4, loop: true, speed: 3 },
    },
  });
  k.loadSprite("heart", "/assets/heart.png", {
    sliceX: 3,
    sliceY: 1,
    anims: {
      one: { from: 0, to: 0 },
    },
  });
  k.loadSound("jump", "/assets/jump.mp3");
  k.loadSound("punch", "/assets/punch.mp3");
  k.loadSound("game_over", "/assets/game_over.mp3");
  k.loadSound("loop", "/assets/loop.mp3");
  k.loadSound("action", "/assets/action.mp3");

  let currentScene = "";
  let score: GameObj;
  let flappy: GameObj;
  let lives = 3;
  let pipes: GameObj[] = [];
  let playback: AudioPlay;
  const hearts: GameObj[] = [];
  const MOVEMENT = 12;

  const drawScore = (x = k.width() / 1.7, y = 30, lastScore = 0) => {
    score = k.add([
      k.text(`Blocks: ${lastScore}`, {
        size: 20,
      }),
      k.color(k.Color.WHITE),
      k.pos(x, y),
      { value: 0 },
    ]);
  };

  const drawUi = () => {
    hearts.forEach((h) => h.destroy());
    k.onDraw(() => {
      Array.from({ length: lives }).forEach((_, index) => {
        const h = k.add([
          k.sprite("heart", { anim: "one" }),
          k.pos(k.vec2(44 * (index + 1), 24)),
          k.scale(0.5),
        ]);
        hearts.push(h);
      });
    });
    drawScore();
  };

  const spawnPipe = (
    pos: "top" | "bottom",
    config?: { width?: number; height: number }
  ) => {
    const getBlockSize = () => {
      const sizes = [
        [k.width() / 7, k.height() / 2.5],
        [k.width() / 7, k.height() / 2],
      ];
      const index = Math.floor(Math.random() * sizes.length);
      return {
        width: config?.width || sizes[index][0],
        height: config?.height || sizes[index][1],
      };
    };
    let block: GameObj;
    const size = getBlockSize();
    if (pos === "top") {
      const y = 0;
      block = k.add([
        "block",
        k.sprite("top-block", size),
        k.pos(k.width(), y),
        k.move(k.LEFT, MOVEMENT * 10),
        k.area(),
        k.offscreen({ destroy: true }),
      ]);
      pipes.push(block);
    } else if (pos === "bottom") {
      const n = [5, 6][Math.floor(Math.random() * 2)];
      const y = (config?.height || 0) + k.height() / n;
      block = k.add([
        "block",
        k.sprite("bottom-block", getBlockSize()),
        k.pos(k.width(), y),
        k.move(k.LEFT, MOVEMENT * 10),
        k.area(),
        k.offscreen({ destroy: true }),
      ]);
    }
    return size;
  };

  const spawnBlocks = () => {
    const firstSize = spawnPipe("top");
    spawnPipe("bottom", { height: firstSize.height });
    k.wait(k.rand(1.5, 3), () => {
      k.destroy(floor);
      k.destroy(floor2);
      spawnBlocks();
    });
    const floor = k.add([
      "floor",
      k.sprite("floor", { width: k.width(), height: 68 }),
      k.pos(0, k.height() - 68),
      k.body({ isStatic: true }),
      k.move(k.LEFT, MOVEMENT * 10),
    ]);
    const floor2 = k.add([
      "floor",
      k.sprite("floor", { width: k.width(), height: 68 }),
      k.pos(k.width(), k.height() - 68),
      k.body({ isStatic: true }),
      k.move(k.LEFT, MOVEMENT * 10),
    ]);
  };

  const removeHearts = () => {
    hearts.forEach((h) => h.destroy());
  };

  const handleIsGameOverOrReduceHearts = () => {
    lives -= 1;
    removeHearts();
    if (lives < 0) {
      console.log("Score? ", score.value);
      k.go("game_over", { lastScore: score.value });
    }
  };

  const drawFloor = () => {
    k.add([
      "floor",
      k.sprite("floor", { width: k.width(), height: 68 }),
      k.pos(0, k.height() - 68),
      k.area(),
      k.body({ isStatic: true }),
    ]);
  };

  let bgPosX = 0;
  let bg2: GameObj; // Declare bg2 outside to avoid implicit any

  const bgEffect = () => {
    k.onUpdate("bg", (bg: GameObj) => {
      // Changed from any to GameObj
      if (bg.pos.x < -k.width()) {
        bg.pos.x = 0;
        if (bg2) {
          bg2.pos.x = k.width();
        }
      }
      bgPosX = bg.pos.x;
    });
    k.add([
      "bg",
      k.sprite("bg", { width: k.width(), height: k.height() }),
      k.pos(bgPosX, -32),
      k.move(k.LEFT, MOVEMENT),
    ]);
    bg2 = k.add([
      "bg2",
      k.sprite("bg", { width: k.width(), height: k.height() }),
      k.pos(k.width() + bgPosX, -32),
      k.move(k.LEFT, MOVEMENT),
    ]);
    drawFloor();
  };

  k.scene("idle", () => {
    playback = k.play("loop", { volume: 0.2 });
    bgEffect();
    drawUi();

    // Add "Tap to play" text at the top
    k.add([
      "gameText",
      k.text("Tap to play", { size: 32, width: 320, font: "sans-serif" }),
      k.color(k.Color.WHITE),
      k.pos(k.width() / 2 - 90, 100),
    ]);

    // Add rocket, inclined 30 degrees (in radians: Math.PI / 6)
    k.add([
      "rocketIdle",
      k.scale(0.2),
      k.sprite("rocket", { anim: "fly" }),
      k.pos(200, k.height() / 2),
      k.rotate(-30), // 30 degrees inclination
      k.anchor("center"),
    ]);

    k.onKeyDown("space", () => {
      if (currentScene !== "game") {
        k.go("game");
        currentScene = "game";
      }
    });
    k.onClick(() => {
      k.go("game");
      currentScene = "game";
    });
  });

  k.scene("game_over", ({ lastScore = 0 }: { lastScore: number }) => {
    if (playback) {
      playback.stop();
    }
    bgEffect();
    k.add([
      k.text("GAME OVER", { size: 40 }),
      k.color(k.Color.WHITE),
      k.pos(k.width() / 2 - 120, k.height() / 6),
    ]);
    drawScore(k.width() / 2 - 100, k.height() / 3, lastScore);
    drawFloor();
    k.add([
      "rocket",
      k.scale(0.3),
      k.sprite("astronaut", { anim: "astro" }),
      k.pos(200, k.height() / 1.24),
    ]);
    const record = localStorage.getItem("record")
      ? Number(localStorage.getItem("record"))
      : 0;
    if (lastScore > record) {
      localStorage.setItem("record", String(lastScore));
    }
    score = k.add([
      k.text(`Record: ${record}`, { size: 20 }),
      k.color(k.Color.WHITE),
      k.pos(k.width() / 2 - 100, k.height() / 4),
      { value: 0 },
    ]);

    k.play("game_over");
    setTimeout(() => setStarted(false), 5000);
  });

  k.scene("game", () => {
    if (playback) {
      playback.stop();
    }
    playback = k.play("action", { volume: 0.3 });
    bgEffect();
    k.setGravity(1000);
    if (flappy) {
      flappy.destroy();
    }
    flappy = k.add([
      "rocket",
      k.stay(),
      k.scale(0.2),
      k.sprite("rocket", { anim: "fly" }),
      k.pos(140, k.height() / 2),
      k.area(),
      k.body(),
      k.rotate(0),
      k.anchor("center"),
    ]);
    spawnBlocks();
    drawUi();
    flappy.onUpdate(() => {
      if (flappy.angle < 90) {
        flappy.angle += 120 * k.dt();
      }
      const limit = flappy.pos.x;
      pipes = pipes.filter((block) => {
        if (block.pos.x + block.width < limit) {
          score.value += 1;
          score.text = "Blocks: " + score.value;
          return false;
        }
        return true;
      });
    });
    flappy.onCollide("block", () => {
      k.addKaboom(flappy.pos, { scale: 0.5, speed: 1.5 });
      k.shake(4);
      handleIsGameOverOrReduceHearts();
      k.play("punch");
    });
    k.onKeyDown("space", () => {
      flappy.jump(220);
      flappy.angle = -45;
      k.play("jump", { volume: 0.1 });
    });
    k.onClick(() => {
      flappy.jump(220);
      flappy.angle = -45;
      k.play("jump", { volume: 0.1 });
    });
  });

  // --- Start the game ---
  k.go("idle");

  // Return cleanup function
  return () => {
    // Cleanup logic if needed
  };
}
