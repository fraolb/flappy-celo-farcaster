"use client";

import kaplay, { AudioPlay, GameObj } from "kaplay";

interface Score {
  _id: string;
  username: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export function runGame(
  canvas: HTMLCanvasElement,
  PaymentFunction: () => Promise<void>,
  handleAddUserScore: (score: number) => Promise<void>,
  shareScore: (score: number) => Promise<void>,
  isProcessing: React.RefObject<boolean>,
  errorRef: React.RefObject<string | null>,
  showGameRef: React.RefObject<boolean>,
  endGame: () => void,
  scoresRef: React.RefObject<{
    scores: Score | null;
    topScores: Score[] | null;
  }>
) {
  // --- Game logic ---
  const k = kaplay({
    global: false,
    canvas: canvas,
  });

  // Load assets
  k.loadSprite("bg", "/assets/bg.webp");
  k.loadSprite("rocket", "/assets/rock.webp", {
    sliceX: 3,
    sliceY: 1,
    anims: {
      fly: { from: 0, to: 2, loop: true, speed: 6, pingpong: true },
    },
  });
  k.loadSprite("floor", "/assets/floor.webp");
  k.loadSprite("top-block", "/assets/block2.webp");
  k.loadSprite("bottom-block", "/assets/block.webp");
  k.loadSprite("astronaut", "/assets/astro.webp", {
    sliceX: 3,
    sliceY: 1,
    anims: {
      astro: { from: 0, to: 2, loop: true, speed: 2 },
    },
  });
  k.loadSprite("heart", "/assets/heart.png", {
    sliceX: 3,
    sliceY: 1,
    anims: {
      one: { from: 0, to: 0 },
    },
  });
  k.loadSprite("hand", "/assets/hand.webp", {
    sliceX: 4,
    sliceY: 1,
    anims: {
      touch: { from: 0, to: 3, loop: true, speed: 1, pingpong: true },
    },
  });
  k.loadSprite("mouse", "/assets/mouse.png", {
    sliceX: 2,
    sliceY: 1,
    anims: {
      touch: { from: 0, to: 1, loop: true, speed: 1, pingpong: true },
    },
  });
  k.loadSprite("gameInstruction1", "/assets/intro1.webp");
  k.loadSprite("gameInstruction2", "/assets/intro2.webp");
  k.loadSprite("gameInstruction3", "/assets/intro3.webp");

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
  let demoRocket: GameObj;

  const drawScore = (x = k.width() / 1.7, y = 30, lastScore = 0) => {
    score = k.add([
      k.text(`Blocks: ${lastScore}`, {
        size: 20,
        font: "vt323",
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
        [k.width() / 8, k.height() / 2.5],
        [k.width() / 8, k.height() / 2],
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
      const n = [7, 8][Math.floor(Math.random() * 2)];
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

  function addButton(
    txt = "start game",
    p = k.vec2(200, 100),
    f = () => k.debug.log("hello")
  ) {
    // add a parent background object
    const btn = k.add([
      "playBtn",
      k.rect(240, 80, { radius: 8 }),
      k.pos(p),
      k.area(),
      k.scale(1),
      k.anchor("center"),
      k.outline(4),
      k.color(255, 255, 255),
    ]);

    // add a child object that displays the text
    btn.add([
      k.text(txt, { font: "vt323" }),
      k.anchor("center"),
      k.color(0, 0, 0),
    ]);

    // onHoverUpdate() comes from area() component
    // it runs every frame when the object is being hovered
    btn.onHoverUpdate(() => {
      const t = k.time() * 10;
      btn.color = k.hsl2rgb((t / 10) % 1, 0.6, 0.7);
      btn.scale = k.vec2(1.2);
      k.setCursor("pointer");
    });

    if (isProcessing.current) {
      btn.color = k.rgb(180, 180, 180); // gray out
      // or btn.opacity = 0.5;
    }

    // onHoverEnd() comes from area() component
    // it runs once when the object stopped being hovered
    btn.onHoverEnd(() => {
      btn.scale = k.vec2(1);
      btn.color = k.rgb();
    });

    // onClick() comes from area() component
    // it runs once when the object is clicked
    btn.onClick(() => {
      if (!isProcessing.current) {
        f();
      }
    });

    return btn;
  }

  function skipButton(
    txt = "skip intro",
    p = k.vec2(200, 100),
    f = () => k.debug.log("hello")
  ) {
    // add a parent background object
    const btn = k.add([
      k.rect(150, 40, { radius: 8 }),
      k.pos(p),
      k.area(),
      k.scale(1),
      k.anchor("center"),
      k.outline(4),
      k.z(100),
      k.color(255, 255, 255),
    ]);

    // add a child object that displays the text
    btn.add([
      k.text(txt, { size: 20, font: "vt323" }),
      k.anchor("center"),
      k.color(0, 0, 0),
    ]);

    // onHoverUpdate() comes from area() component
    // it runs every frame when the object is being hovered
    btn.onHoverUpdate(() => {
      const t = k.time() * 10;
      btn.color = k.hsl2rgb((t / 10) % 1, 0.6, 0.7);
      btn.scale = k.vec2(1.2);
      k.setCursor("pointer");
    });

    // onHoverEnd() comes from area() component
    // it runs once when the object stopped being hovered
    btn.onHoverEnd(() => {
      btn.scale = k.vec2(1);
      btn.color = k.rgb();
    });

    // onClick() comes from area() component
    // it runs once when the object is clicked
    btn.onClick(() => {
      if (!isProcessing.current) {
        f();
      }
    });

    return btn;
  }

  function nextButton(
    txt = "next intro",
    p = k.vec2(200, 100),
    f = () => k.debug.log("hello")
  ) {
    // add a parent background object
    const btn = k.add([
      k.rect(150, 40, { radius: 8 }),
      k.pos(p),
      k.area(),
      k.scale(1),
      k.anchor("center"),
      k.outline(4),
      k.z(100),
      k.color(255, 255, 255),
    ]);

    // add a child object that displays the text
    btn.add([
      k.text(txt, { size: 20, font: "vt323" }),
      k.anchor("center"),
      k.color(0, 0, 0),
    ]);

    // onHoverUpdate() comes from area() component
    // it runs every frame when the object is being hovered
    btn.onHoverUpdate(() => {
      const t = k.time() * 10;
      btn.color = k.hsl2rgb((t / 10) % 1, 0.6, 0.7);
      btn.scale = k.vec2(1.2);
      k.setCursor("pointer");
    });

    // onHoverEnd() comes from area() component
    // it runs once when the object stopped being hovered
    btn.onHoverEnd(() => {
      btn.scale = k.vec2(1);
      btn.color = k.rgb();
    });

    // onClick() comes from area() component
    // it runs once when the object is clicked
    btn.onClick(() => {
      if (!isProcessing.current) {
        f();
      }
    });

    return btn;
  }

  function playAgainButton(
    txt = "start game",
    p = k.vec2(200, 100),
    f = () => k.debug.log("hello")
  ) {
    // add a parent background object
    const btn = k.add([
      k.rect(250, 80, { radius: 8 }),
      k.pos(p),
      k.area(),
      k.scale(1),
      k.anchor("center"),
      k.outline(4),
      k.color(255, 255, 255),
    ]);

    // add a child object that displays the text
    btn.add([
      k.text(txt, { size: 24, font: "vt323" }),
      k.anchor("center"),
      k.color(0, 0, 0),
    ]);

    // onHoverUpdate() comes from area() component
    // it runs every frame when the object is being hovered
    btn.onHoverUpdate(() => {
      const t = k.time() * 10;
      btn.color = k.hsl2rgb((t / 10) % 1, 0.6, 0.7);
      btn.scale = k.vec2(1.2);
      k.setCursor("pointer");
    });

    // onHoverEnd() comes from area() component
    // it runs once when the object stopped being hovered
    btn.onHoverEnd(() => {
      btn.scale = k.vec2(1);
      btn.color = k.rgb();
    });

    // onClick() comes from area() component
    // it runs once when the object is clicked
    btn.onClick(() => {
      if (!isProcessing.current) {
        f();
      }
    });

    return btn;
  }

  function shareButton(
    txt = "start game",
    p = k.vec2(200, 100),
    lastscore = 0
  ) {
    // add a parent background object
    const btn = k.add([
      k.rect(240, 60, { radius: 8 }),
      k.pos(p),
      k.area(),
      k.scale(1),
      k.anchor("center"),
      k.outline(4),
      k.color(255, 255, 255),
    ]);

    // add a child object that displays the text
    btn.add([
      k.text(txt, { size: 24, font: "vt323" }),
      k.anchor("center"),
      k.color(0, 0, 0),
    ]);

    // onHoverUpdate() comes from area() component
    // it runs every frame when the object is being hovered
    btn.onHoverUpdate(() => {
      const t = k.time() * 10;
      btn.color = k.hsl2rgb((t / 10) % 1, 0.6, 0.7);
      btn.scale = k.vec2(1.1);
      k.setCursor("pointer");
    });

    // onHoverEnd() comes from area() component
    // it runs once when the object stopped being hovered
    btn.onHoverEnd(() => {
      btn.scale = k.vec2(1);
      btn.color = k.rgb();
    });

    // onClick() comes from area() component
    // it runs once when the object is clicked
    btn.onClick(() => {
      shareScore(lastscore);
    });

    return btn;
  }

  k.scene("first", () => {
    playback = k.play("loop", { volume: 0.2 });
    bgEffect();
    drawUi();

    // Add "Tap to play" text at the top
    k.add([
      "gameText",
      k.text("Flappy Rocket", {
        size: 32,
        width: 320,
        font: "vt323",
        align: "center",
      }),
      k.color(k.Color.WHITE),
      k.pos(k.width() / 2, 200),
      k.anchor("center"),
    ]);

    addButton(
      isProcessing.current ? "Processing" : "Play",
      k.vec2(k.width() / 2, 310),
      PaymentFunction
    );

    k.add([
      k.text("Pay 0.1 CELO to play", {
        size: 15,
        width: 320,
        font: "vt323",
        align: "center",
      }),
      k.color(k.Color.WHITE),
      k.pos(k.width() / 2, 370),
      k.anchor("center"),
    ]);

    if (errorRef && errorRef.current) {
      k.add([
        "errorText",
        k.text(errorRef.current, {
          size: 18,
          font: "vt323",
          width: 320,
          align: "center",
        }),
        k.color(k.Color.RED),
        k.pos(k.width() / 2, 420),
        k.anchor("center"),
      ]);
    }

    // --- Display Top Scores ---
    const topScores = scoresRef.current?.topScores || [];
    const yStart = 430;
    k.add([
      k.text("Top 5 Scores", { size: 22, font: "vt323" }),
      k.color(k.Color.YELLOW),
      k.pos(k.width() / 2, yStart),
      k.anchor("center"),
    ]);
    topScores.slice(0, 5).forEach((score, idx) => {
      k.add([
        k.text(`${idx + 1}. ${score.username}: ${score.score}`, {
          size: 18,
          font: "vt323",
        }),
        k.color(k.Color.WHITE),
        k.pos(k.width() / 2, yStart + 30 + idx * 24),
        k.anchor("center"),
      ]);
    });

    // --- Display User Score ---
    const userScore = scoresRef.current?.scores;
    k.add([
      k.text(`Your Score: ${userScore ? userScore.score : "No score yet"}`, {
        size: 20,
        font: "vt323",
      }),
      k.color(k.Color.CYAN),
      k.pos(k.width() / 2, yStart + 170),
      k.anchor("center"),
    ]);

    k.loop(1, () => {
      if (showGameRef && showGameRef.current) {
        k.go("intro");
      }
    });
  });

  k.scene("intro", () => {
    bgEffect();
    let currentInstruction = 1;
    let instructionElements: GameObj[] = [];
    let collisionBlocks: GameObj[] = [];

    // Demo rocket (with collision area)
    demoRocket = k.add([
      "demoRocket",
      k.sprite("rocket", { anim: "fly" }),
      k.scale(0.2),
      k.pos(100, k.height() / 2),
      k.area(),
      k.anchor("center"),
    ]);

    // Add game title
    k.add([
      k.text("Game Play\nInstruction", { size: 32, width: 320, font: "vt323" }),
      k.color(k.Color.WHITE),
      k.pos(k.width() / 2 - 60, 100),
      k.z(100),
    ]);

    // Instruction controls
    const updateInstructions = () => {
      // Clear previous elements
      instructionElements.forEach((e) => e.destroy());
      collisionBlocks.forEach((b) => b.destroy());
      instructionElements = [];
      collisionBlocks = [];

      if (currentInstruction === 1 || currentInstruction === 2) {
        // For instructions 1 & 2, show normal blocks
        const blockX = 300;
        const blockGap = 200;

        collisionBlocks.push(
          k.add([
            k.sprite("top-block", {
              width: k.width() / 8,
              height: k.height() / 2.5,
            }),
            k.pos(blockX, 0),
            k.anchor("topleft"),
          ]),
          k.add([
            k.sprite("bottom-block", {
              width: k.width() / 8,
              height: k.height() / 3,
            }),
            k.pos(blockX, k.height() / 2 + blockGap / 3),
            k.anchor("topleft"),
          ])
        );
      }

      // Add current instruction
      if (currentInstruction === 1) {
        // Mobile controls
        const hand = k.add([
          k.sprite("hand", { anim: "touch" }),
          k.pos(k.width() / 2, k.height() / 2 + 80),
          k.anchor("center"),
          k.scale(0.5),
        ]);
        instructionElements.push(hand);

        instructionElements.push(
          k.add([
            "gameInstruction1",
            k.scale(0.5),
            k.sprite("gameInstruction1"),
            k.pos(k.width() / 2 + 80, k.height() / 2),
            k.anchor("center"),
          ])
        );
      } else if (currentInstruction === 2) {
        const mouse = k.add([
          k.sprite("mouse", { anim: "touch" }),
          k.pos(k.width() / 2, k.height() / 2 + 100),
          k.anchor("center"),
          k.scale(1),
        ]);
        instructionElements.push(mouse);

        instructionElements.push(
          k.add([
            "gameInstruction2",
            k.scale(0.5),
            k.sprite("gameInstruction2"),
            k.pos(k.width() / 2 + 80, k.height() / 2),
            k.anchor("center"),
          ])
        );
      } else if (currentInstruction === 3) {
        // For instruction 3, create collision blocks closer to rocket
        const crashX = 120; // Same X as rocket

        collisionBlocks.push(
          k.add([
            "block",
            k.sprite("top-block", {
              width: k.width() / 8,
              height: k.height() / 2.8,
            }),
            k.pos(crashX - 40, 0), // Overlap with rocket
            k.anchor("topleft"),
            k.area(),
            "block",
          ]),
          k.add([
            "block",
            k.sprite("bottom-block", {
              width: k.width() / 8,
              height: k.height() / 3.2,
            }),
            k.pos(crashX - 40, k.height() / 2 + 60), // Overlap with rocket
            k.anchor("topleft"),
            k.area(),
            "block",
          ])
        );

        instructionElements.push(
          k.add([
            "gameInstruction3",
            k.scale(0.5),
            k.sprite("gameInstruction3"),
            k.pos(k.width() / 2 + 80, k.height() / 2),
            k.anchor("center"),
          ])
        );

        // Trigger collision effect immediately

        demoRocket.onCollide("block", () => {
          k.addKaboom(demoRocket.pos, { scale: 0.5, speed: 1.5 });
          k.shake(2);
          k.play("punch", { volume: 0.2 });
        });
      }
    };

    // Next button
    nextButton("Next", k.vec2(k.width() / 2 - 90, k.height() - 60), () => {
      advanceInstruction();
    });
    // Close button
    skipButton("Skip Tutorial", k.vec2(k.width() - 90, k.height() - 60), () => {
      k.go("idle");
    });

    // Navigation handlers
    const advanceInstruction = () => {
      currentInstruction = currentInstruction < 3 ? currentInstruction + 1 : 1;
      updateInstructions();
    };

    k.onClick(() => {
      advanceInstruction();
    });

    // Initialize first instruction
    updateInstructions();

    // Rocket animation
    k.onUpdate(() => {
      const rocketY = k.height() / 2 + Math.sin(k.time() * 3.7) * 60;
      demoRocket.pos.y = rocketY;
    });
  });

  k.scene("idle", () => {
    // playback = k.play("loop", { volume: 0.2 });
    bgEffect();
    drawUi();

    // Add "Tap to play" text at the top
    k.add([
      "gameText",
      k.text("Tap to start", { size: 32, width: 320, font: "vt323" }),
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
      k.text("GAME OVER", { size: 40, font: "vt323" }),
      k.color(k.Color.WHITE),
      k.pos(k.width() / 2, k.height() / 4),
      k.anchor("center"),
    ]);
    //drawScore(k.width() / 2 - 100, k.height() / 3, lastScore);
    drawFloor();
    k.add([
      "rocket",
      k.scale(0.3),
      k.sprite("astronaut", { anim: "astro" }),
      k.pos(30, k.height() / 1.24),
    ]);

    score = k.add([
      k.text(`You scored: ${lastScore}`, { size: 25, font: "vt323" }),
      k.color(k.Color.WHITE),
      k.pos(k.width() / 2 - 60, k.height() / 3),
      { value: 0 },
    ]);
    // Play Again button
    playAgainButton(
      "▶ Play Again",
      k.vec2(k.width() / 2, k.height() / 2 + 40),
      () => {
        lives = 3;
        endGame();
        k.go("first");
      }
    );
    shareButton(
      "🎮 Share Score",
      k.vec2(k.width() / 2, k.height() / 2 + 140),
      lastScore
    );

    // Send user score to backend
    if (typeof handleAddUserScore === "function") {
      handleAddUserScore(lastScore);
    }

    k.play("game_over");
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
      flappy.jump(150);
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
  k.go("first");

  // Return cleanup function
  return () => {
    // Destroy all kaplay objects
    //if (typeof k.destroyAll === "function") k.destroyAll();
    // Optionally, quit kaplay if supported
    k.quit();
    if (canvas.parentNode) {
      while (canvas.parentNode.firstChild) {
        canvas.parentNode.removeChild(canvas.parentNode.firstChild);
      }
    }
    // Clear the canvas
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
