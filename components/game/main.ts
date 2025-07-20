/* eslint-disable @typescript-eslint/no-explicit-any */

import { AUTO, Game, Scale } from "phaser";
import { GRAVITY_Y } from "./constants";
import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  backgroundColor: "#028af8",
  scale: {
    mode: Scale.RESIZE, // Use RESIZE for full responsiveness
    autoCenter: Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
    min: {
      width: 320,
      height: 480,
    },
    max: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: GRAVITY_Y },
    },
  },
  input: {
    touch: {
      target: "game-container",
      capture: true,
    },
  },
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

const StartGame = (parent: string, options?: any) => {
  return new Game({
    ...config,
    parent,
    scene: [
      Boot,
      Preloader,
      new MainMenu(
        options?.onPaymentRequested,
        options?.isProcessing,
        options?.errorRef,
        options?.showGameRef,
        options?.scoresRef
      ),
      new MainGame(options?.endGame, options?.handleAddUserScore),
      new GameOver(options?.shareScore),
    ],
  });
};

export default StartGame;
