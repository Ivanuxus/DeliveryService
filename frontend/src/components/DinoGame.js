import React, { useEffect, useRef, useState } from "react";

const DinoGame = ({ isActive, onClose }) => {
  const canvasRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // refs для актуальных значений
  const gameStartedRef = useRef(gameStarted);
  const gameOverRef = useRef(gameOver);
  const scoreRef = useRef(0);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (!isActive) {
      setGameStarted(false);
      setGameOver(false);
      setScore(0);
      scoreRef.current = 0;
    }
  }, [isActive]);

  const gameStateRef = useRef({
    dino: {
      x: 50,
      y: 200,
      width: 40,
      height: 60,
      jumping: false,
      velocity: 0,
      frame: 0,
      frameCount: 0,
    },
    obstacles: [],
    gameSpeed: 6,
    gravity: 1.2,
    jumpForce: -20,
    lastObstacleTime: 0,
    obstacleInterval: 1500,
    groundY: 200,
    clouds: [],
    backgroundOffset: 0,
  });

  const resetGame = () => {
    gameStateRef.current = {
      dino: {
        x: 50,
        y: 200,
        width: 40,
        height: 60,
        jumping: false,
        velocity: 0,
        frame: 0,
        frameCount: 0,
      },
      obstacles: [],
      gameSpeed: 6,
      gravity: 1.2,
      jumpForce: -20,
      lastObstacleTime: 0,
      obstacleInterval: 1500,
      groundY: 200,
      clouds: Array(5)
        .fill()
        .map(() => ({
          x: Math.random() * 800,
          y: Math.random() * 100 + 20,
          width: Math.random() * 60 + 40,
          speed: Math.random() * 0.5 + 0.1,
        })),
      backgroundOffset: 0,
    };
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    setGameStarted(false);
    gameStartedRef.current = false;
    gameOverRef.current = false;
  };

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const drawCloud = (cloud) => {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.width / 3, 0, Math.PI * 2);
      ctx.arc(
        cloud.x + cloud.width / 4,
        cloud.y - cloud.width / 6,
        cloud.width / 4,
        0,
        Math.PI * 2
      );
      ctx.arc(
        cloud.x + cloud.width / 2,
        cloud.y,
        cloud.width / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const drawBackground = () => {
      // Небо
      ctx.fillStyle = "#87CEEB";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Солнце
      ctx.save();
      ctx.beginPath();
      ctx.arc(80, 80, 40, 0, Math.PI * 2);
      ctx.fillStyle = "#ffe066";
      ctx.shadowColor = "#ffe066";
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Облака
      gameStateRef.current.clouds.forEach((cloud) => {
        drawCloud(cloud);
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
          cloud.x = canvas.width;
          cloud.y = Math.random() * 100 + 20;
        }
      });

      // Кусты
      for (let i = 0; i < canvas.width / 180; i++) {
        const x =
          (i * 180 + gameStateRef.current.backgroundOffset * 0.7) %
          canvas.width;
        ctx.save();
        ctx.fillStyle = "#228B22";
        ctx.beginPath();
        ctx.arc(x + 30, gameStateRef.current.groundY + 70, 18, 0, Math.PI * 2);
        ctx.arc(x + 45, gameStateRef.current.groundY + 70, 14, 0, Math.PI * 2);
        ctx.arc(x + 60, gameStateRef.current.groundY + 70, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Камни
      for (let i = 0; i < canvas.width / 250; i++) {
        const x =
          (i * 250 + gameStateRef.current.backgroundOffset * 1.2) %
          canvas.width;
        ctx.save();
        ctx.fillStyle = "#b0a18f";
        ctx.beginPath();
        ctx.ellipse(
          x + 80,
          gameStateRef.current.groundY + 90,
          10,
          5,
          Math.PI / 8,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }

      // Земля
      ctx.fillStyle = "#90EE90";
      ctx.fillRect(
        0,
        gameStateRef.current.groundY + 50,
        canvas.width,
        canvas.height - gameStateRef.current.groundY - 50
      );

      // Полоски на земле
      ctx.fillStyle = "#228B22";
      for (let i = 0; i < canvas.width / 50; i++) {
        const x =
          (i * 50 + gameStateRef.current.backgroundOffset) % canvas.width;
        ctx.fillRect(x, gameStateRef.current.groundY + 50, 2, 20);
      }
      gameStateRef.current.backgroundOffset -= gameStateRef.current.gameSpeed;
    };

    const drawDino = () => {
      const { dino } = gameStateRef.current;
      // Тело
      ctx.fillStyle = "#4A4A4A";
      ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
      // Голова
      ctx.fillRect(dino.x + dino.width - 10, dino.y - 20, 30, 30);
      // Глаз (только белок и зрачок, с анимацией)
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(dino.x + dino.width + 10, dino.y - 10, 5, 0, Math.PI * 2);
      ctx.fill();
      // Зрачок (анимируемый)
      let pupilOffsetY = 0;
      if (dino.jumping) {
        if (dino.velocity < -2) {
          pupilOffsetY = 4; // прыжок вверх — глаза вниз
        } else if (dino.velocity > 2) {
          pupilOffsetY = -4; // падение — глаза вверх
        }
      }
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(
        dino.x + dino.width + 10,
        dino.y - 10 + pupilOffsetY,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Ноги
      if (!dino.jumping) {
        const legOffset = Math.sin(dino.frameCount * 0.3) * 10;
        ctx.fillRect(dino.x + 10, dino.y + dino.height, 8, 20 + legOffset);
        ctx.fillRect(
          dino.x + dino.width - 15,
          dino.y + dino.height,
          8,
          20 - legOffset
        );
      } else {
        ctx.fillRect(dino.x + 10, dino.y + dino.height, 8, 15);
        ctx.fillRect(dino.x + dino.width - 15, dino.y + dino.height, 8, 15);
      }
      dino.frameCount++;
    };

    const drawObstacles = () => {
      ctx.fillStyle = "#8B4513";
      gameStateRef.current.obstacles.forEach((obstacle) => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.fillRect(obstacle.x - 10, obstacle.y + 20, 10, 8);
        ctx.fillRect(obstacle.x + obstacle.width, obstacle.y + 15, 10, 8);
      });
    };

    const drawScore = () => {
      ctx.fillStyle = "#000";
      ctx.font = "bold 24px Arial";
      ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);
    };

    const drawGameOver = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#FFF";
      ctx.font = "bold 48px Arial";
      ctx.fillText(
        "Game Over!",
        canvas.width / 2 - 120,
        canvas.height / 2 - 50
      );

      ctx.font = "24px Arial";
      ctx.fillText(
        `Final Score: ${scoreRef.current}`,
        canvas.width / 2 - 70,
        canvas.height / 2
      );
      ctx.fillText(
        "Press Space to Restart",
        canvas.width / 2 - 110,
        canvas.height / 2 + 50
      );
    };

    const updateDino = () => {
      const { dino, gravity, groundY } = gameStateRef.current;

      if (dino.jumping) {
        dino.velocity += gravity;
        dino.y += dino.velocity;

        if (dino.y > groundY) {
          dino.y = groundY;
          dino.jumping = false;
          dino.velocity = 0;
        }
      }
    };

    const updateObstacles = () => {
      const { obstacles, gameSpeed, groundY } = gameStateRef.current;
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        if (obstacles[i].x + obstacles[i].width < 0) {
          obstacles.splice(i, 1);
          scoreRef.current += 1;
          setScore(scoreRef.current);
          gameStateRef.current.gameSpeed += 0.1;
        }
      }
      if (
        Date.now() - gameStateRef.current.lastObstacleTime >
        gameStateRef.current.obstacleInterval
      ) {
        const height = Math.random() * 40 + 40; // кактус всегда высокий
        obstacles.push({
          x: canvas.width,
          width: 20,
          height,
          y: groundY + 50 - height, // кактус стоит на земле
        });
        gameStateRef.current.lastObstacleTime = Date.now();
        gameStateRef.current.obstacleInterval = Math.max(
          1000,
          gameStateRef.current.obstacleInterval - 10
        );
      }
    };

    const checkCollision = () => {
      const { dino, obstacles } = gameStateRef.current;
      return obstacles.some((obstacle) => {
        // Точная коллизия по реальным координатам
        const dinoLeft = dino.x + 10;
        const dinoRight = dino.x + dino.width - 10;
        const dinoTop = dino.y + 10;
        const dinoBottom = dino.y + dino.height;
        const obsLeft = obstacle.x;
        const obsRight = obstacle.x + obstacle.width;
        const obsTop = obstacle.y;
        const obsBottom = obstacle.y + obstacle.height;
        return (
          dinoRight > obsLeft &&
          dinoLeft < obsRight &&
          dinoBottom > obsTop &&
          dinoTop < obsBottom
        );
      });
    };

    const gameLoop = () => {
      if (!gameStartedRef.current || gameOverRef.current) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBackground();
      updateDino();
      updateObstacles();

      if (checkCollision()) {
        setGameOver(true);
        gameOverRef.current = true;
        return;
      }

      drawDino();
      drawObstacles();
      drawScore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();

        if (gameOverRef.current) {
          resetGame();
          setGameStarted(true);
          gameStartedRef.current = true;
          gameOverRef.current = false;
          requestAnimationFrame(gameLoop);
          return;
        }

        if (!gameStartedRef.current) {
          setGameStarted(true);
          gameStartedRef.current = true;
          requestAnimationFrame(gameLoop);
          return;
        }

        const { dino } = gameStateRef.current;
        if (!dino.jumping) {
          dino.jumping = true;
          dino.velocity = gameStateRef.current.jumpForce;
        }
      }
    };

    canvas.width = 800;
    canvas.height = 400;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawDino();

    if (!gameStartedRef.current) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#FFF";
      ctx.font = "24px Arial";
      ctx.fillText(
        "Press Space to Start",
        canvas.width / 2 - 100,
        canvas.height / 2
      );
    }

    if (gameOverRef.current) {
      drawGameOver();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <canvas
          ref={canvasRef}
          style={{
            border: "3px solid #333",
            borderRadius: "8px",
            boxShadow: "0 0 20px rgba(0,0,0,0.3)",
          }}
          tabIndex={0}
          onKeyDown={(e) => e.preventDefault()}
        />
        <button
          onClick={() => {
            resetGame();
            onClose();
          }}
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            background: "none",
            border: "none",
            color: "#FFF",
            fontSize: "32px",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default DinoGame;
