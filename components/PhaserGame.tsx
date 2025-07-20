import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { EventBus } from "./game/EventBus";
import StartGame from "./game/main";

export interface IRefPhaserGame {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
}

interface Score {
  _id: string;
  username: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

interface IProps {
  currentActiveScene?: (scene_instance: Phaser.Scene) => void;
  onPaymentRequested: () => Promise<void>;
  isProcessing: React.RefObject<boolean>;
  errorRef: React.RefObject<string>;
  showGameRef: React.RefObject<boolean>;
  endGame: () => void;
  scoresRef: React.RefObject<{
    userScore: Score | null;
    topScores: Score[] | null;
  }>;
  handleAddUserScore: (score: number) => Promise<void>;
  shareScore: (score: number) => Promise<void>;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(
  function PhaserGame(
    {
      currentActiveScene,
      onPaymentRequested,
      isProcessing,
      errorRef,
      showGameRef,
      endGame,
      scoresRef,
      handleAddUserScore,
      shareScore,
    },
    ref
  ) {
    const game = useRef<Phaser.Game | null>(null!);

    useLayoutEffect(() => {
      if (game.current === null) {
        game.current = StartGame("game-container", {
          onPaymentRequested,
          isProcessing,
          errorRef,
          showGameRef,
          endGame,
          scoresRef,
          handleAddUserScore,
          shareScore,
        });

        if (typeof ref === "function") {
          ref({ game: game.current, scene: null });
        } else if (ref) {
          ref.current = { game: game.current, scene: null };
        }
      }

      return () => {
        if (game.current) {
          game.current.destroy(true);
          if (game.current !== null) {
            game.current = null;
          }
        }
      };
    }, [ref]);

    useEffect(() => {
      EventBus.on("current-scene-ready", (scene_instance: Phaser.Scene) => {
        if (currentActiveScene && typeof currentActiveScene === "function") {
          currentActiveScene(scene_instance);
        }

        if (typeof ref === "function") {
          ref({ game: game.current, scene: scene_instance });
        } else if (ref) {
          ref.current = {
            game: game.current,
            scene: scene_instance,
          };
        }
      });
      return () => {
        EventBus.removeListener("current-scene-ready");
      };
    }, [currentActiveScene, ref]);

    return <div id="game-container"></div>;
  }
);
