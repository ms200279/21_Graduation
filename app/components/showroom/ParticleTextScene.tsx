"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ParticleTextScene.module.css";
import {
  getParticleDescription,
  INITIAL_PARTICLE_TEXT,
  type ParticleDescription,
} from "./particleTextContent";

const BACKGROUND_TRANSITION_MS = 700;
const INPUT_DELAY_MS = 1900;

type Point = {
  x: number;
  y: number;
};

type Particle = Point & {
  targetX: number;
  targetY: number;
  velocityX: number;
  velocityY: number;
  alpha: number;
  targetAlpha: number;
  radius: number;
  phase: number;
};

type TextBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

function collectParticleTargets(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const pixels = context.getImageData(0, 0, width, height).data;
  const sampleGap = 2;
  const points: Point[] = [];

  for (let y = 0; y < height; y += sampleGap) {
    for (let x = 0; x < width; x += sampleGap) {
      if (pixels[(y * width + x) * 4 + 3] > 96) {
        points.push({ x, y });
      }
    }
  }

  const limit = width < 768 ? 3400 : 6800;
  if (points.length <= limit) {
    return points;
  }

  const step = points.length / limit;
  return Array.from({ length: limit }, (_, index) => points[Math.floor(index * step)]);
}

function sampleTextPixels(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
  fontFamily: string,
) {
  if (!text) {
    return [];
  }

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";

  const maxTextWidth = width * (width < 768 ? 0.86 : 0.82);
  let fontSize = Math.min(width < 768 ? 50 : 96, width * 0.11);

  while (fontSize > 22) {
    context.font = `600 ${fontSize}px ${fontFamily}`;
    if (context.measureText(text).width <= maxTextWidth) {
      break;
    }
    fontSize -= 2;
  }

  context.fillText(text, width / 2, height * 0.47);
  return collectParticleTargets(context, width, height);
}

function sampleJellyfishPixels(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#ffffff";
  context.lineCap = "round";
  context.lineJoin = "round";

  const centerX = width / 2;
  const centerY = height * 0.39;
  const radius = Math.min(width * (width < 768 ? 0.2 : 0.14), height * 0.18);

  context.beginPath();
  context.moveTo(centerX - radius, centerY);
  context.bezierCurveTo(
    centerX - radius * 0.92,
    centerY - radius * 0.72,
    centerX - radius * 0.45,
    centerY - radius,
    centerX,
    centerY - radius,
  );
  context.bezierCurveTo(
    centerX + radius * 0.45,
    centerY - radius,
    centerX + radius * 0.92,
    centerY - radius * 0.72,
    centerX + radius,
    centerY,
  );
  context.lineTo(centerX + radius * 0.9, centerY + radius * 0.24);
  context.quadraticCurveTo(
    centerX + radius * 0.68,
    centerY + radius * 0.08,
    centerX + radius * 0.46,
    centerY + radius * 0.25,
  );
  context.quadraticCurveTo(
    centerX + radius * 0.23,
    centerY + radius * 0.08,
    centerX,
    centerY + radius * 0.25,
  );
  context.quadraticCurveTo(
    centerX - radius * 0.23,
    centerY + radius * 0.08,
    centerX - radius * 0.46,
    centerY + radius * 0.25,
  );
  context.quadraticCurveTo(
    centerX - radius * 0.68,
    centerY + radius * 0.08,
    centerX - radius * 0.9,
    centerY + radius * 0.24,
  );
  context.closePath();
  context.fill();

  const tentacleOffsets = [-0.7, -0.46, -0.23, 0, 0.23, 0.46, 0.7];
  context.lineWidth = Math.max(3, radius * 0.045);

  tentacleOffsets.forEach((offset, index) => {
    const startX = centerX + radius * offset;
    const startY = centerY + radius * 0.2;
    const direction = index % 2 === 0 ? -1 : 1;
    const endY = centerY + radius * (1.28 + (index % 3) * 0.15);

    context.beginPath();
    context.moveTo(startX, startY);
    context.bezierCurveTo(
      startX + radius * 0.18 * direction,
      centerY + radius * 0.58,
      startX - radius * 0.2 * direction,
      centerY + radius * 0.9,
      startX + radius * 0.12 * direction,
      endY,
    );
    context.stroke();
  });

  return collectParticleTargets(context, width, height);
}

function shufflePoints(points: Point[]) {
  for (let index = points.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [points[index], points[randomIndex]] = [points[randomIndex], points[index]];
  }
  return points;
}

export default function ParticleTextScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const morphTextRef = useRef<(text: string, immediate?: boolean) => void>(() => {});
  const descriptionIdRef = useRef(0);
  const hasFocusedInputRef = useRef(false);
  const [inputValue, setInputValue] = useState(INITIAL_PARTICLE_TEXT);
  const [renderedText, setRenderedText] = useState(INITIAL_PARTICLE_TEXT);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [activeDescription, setActiveDescription] =
    useState<ParticleDescription | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!context || !sampleContext) {
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let resizeFrame = 0;
    let hasStarted = false;
    let currentText = INITIAL_PARTICLE_TEXT;
    let textBounds: TextBounds | null = null;
    let fontsReady = false;
    let isDisposed = false;
    const pointer = {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      lastMovedAt: 0,
      active: false,
    };
    let fontFamily = window.getComputedStyle(document.body).fontFamily;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      sampleCanvas.width = width;
      sampleCanvas.height = height;

      if (hasStarted) {
        morphTextRef.current(currentText, false);
      }
    };

    const morphText = (text: string, immediate = false) => {
      currentText = text;

      if (!fontsReady) {
        return;
      }

      const targets = shufflePoints(
        text === "해파리"
          ? sampleJellyfishPixels(sampleContext, width, height)
          : sampleTextPixels(sampleContext, width, height, text, fontFamily),
      );

      textBounds = targets.length
        ? targets.reduce<TextBounds>(
            (bounds, point) => ({
              minX: Math.min(bounds.minX, point.x),
              maxX: Math.max(bounds.maxX, point.x),
              minY: Math.min(bounds.minY, point.y),
              maxY: Math.max(bounds.maxY, point.y),
            }),
            {
              minX: Number.POSITIVE_INFINITY,
              maxX: Number.NEGATIVE_INFINITY,
              minY: Number.POSITIVE_INFINITY,
              maxY: Number.NEGATIVE_INFINITY,
            },
          )
        : null;

      if (!textBounds) {
        pointer.active = false;
      }

      while (particles.length < targets.length) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(width, height) * (0.22 + Math.random() * 0.28);
        particles.push({
          x: width / 2 + Math.cos(angle) * distance,
          y: height * 0.47 + Math.sin(angle) * distance,
          targetX: width / 2,
          targetY: height * 0.47,
          velocityX: 0,
          velocityY: 0,
          alpha: immediate ? 0.88 : 0,
          targetAlpha: 0.88,
          radius: 0.65 + Math.random() * 0.85,
          phase: Math.random() * Math.PI * 2,
        });
      }

      particles.forEach((particle, index) => {
        const target = targets[index];
        if (target) {
          particle.targetX = target.x;
          particle.targetY = target.y;
          particle.targetAlpha = 0.9;
          if (immediate) {
            particle.x = target.x;
            particle.y = target.y;
            particle.velocityX = 0;
            particle.velocityY = 0;
            particle.alpha = particle.targetAlpha;
          }
        } else {
          particle.targetAlpha = 0;
        }
      });

      setRenderedText(text);
    };

    morphTextRef.current = morphText;

    const prepareFont = async () => {
      fontFamily = window.getComputedStyle(document.body).fontFamily;

      try {
        await document.fonts.load(`600 16px ${fontFamily}`, "가Aa");
        await document.fonts.ready;
      } catch {
        // Keep the scene usable if the bundled font cannot be loaded.
      } finally {
        if (isDisposed) {
          return;
        }

        fontsReady = true;
        fontFamily = window.getComputedStyle(document.body).fontFamily;

        if (hasStarted) {
          morphText(currentText, false);
        }
      }
    };

    void prepareFont();

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const nextX = event.clientX - rect.left;
      const nextY = event.clientY - rect.top;
      const padding = 18;
      const isInsideText =
        textBounds !== null &&
        nextX >= textBounds.minX - padding &&
        nextX <= textBounds.maxX + padding &&
        nextY >= textBounds.minY - padding &&
        nextY <= textBounds.maxY + padding;

      if (isInsideText) {
        pointer.velocityX = Math.max(-20, Math.min(20, nextX - pointer.x));
        pointer.velocityY = Math.max(-20, Math.min(20, nextY - pointer.y));
        pointer.lastMovedAt = performance.now();
      } else {
        pointer.velocityX = 0;
        pointer.velocityY = 0;
      }

      pointer.x = nextX;
      pointer.y = nextY;
      pointer.active = isInsideText;
    };

    const deactivatePointer = () => {
      pointer.active = false;
      pointer.velocityX = 0;
      pointer.velocityY = 0;
    };

    const animate = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      const pointerIsMoving =
        pointer.active && performance.now() - pointer.lastMovedAt < 90;
      const animationTime = performance.now() * 0.018;
      const motionScale = reducedMotionQuery.matches ? 0.4 : 1;

      particles.forEach((particle) => {
        particle.velocityX +=
          (particle.targetX - particle.x) *
          0.014 *
          (0.65 + motionScale * 0.35);
        particle.velocityY +=
          (particle.targetY - particle.y) *
          0.014 *
          (0.65 + motionScale * 0.35);

        if (pointerIsMoving) {
          const deltaX = particle.x - pointer.x;
          const deltaY = particle.y - pointer.y;
          const distanceSquared = deltaX * deltaX + deltaY * deltaY;
          const influenceRadius = 45;

          if (
            distanceSquared > 0 &&
            distanceSquared < influenceRadius * influenceRadius
          ) {
            const distance = Math.sqrt(distanceSquared);
            const influence = 1 - distance / influenceRadius;
            const pointerSpeed = Math.min(
              1,
              Math.hypot(pointer.velocityX, pointer.velocityY) / 14,
            );
            const particleDirection = Math.sin(particle.phase + animationTime);
            const tangentX = -deltaY / distance;
            const tangentY = deltaX / distance;

            particle.velocityX +=
              pointer.velocityX * influence * 0.01 * motionScale +
              tangentX *
                particleDirection *
                influence *
                pointerSpeed *
                2 *
                motionScale;
            particle.velocityY +=
              pointer.velocityY * influence * 0.01 * motionScale +
              tangentY *
                particleDirection *
                influence *
                pointerSpeed *
                2 *
                motionScale;
          }
        }

        particle.velocityX *= 0.76;
        particle.velocityY *= 0.76;
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.alpha += (particle.targetAlpha - particle.alpha) * 0.045;

        if (particle.alpha < 0.01) {
          return;
        }

        context.globalAlpha = particle.alpha;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      context.globalAlpha = 1;
      animationFrame = window.requestAnimationFrame(animate);
    };

    resizeCanvas();
    animationFrame = window.requestAnimationFrame(animate);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", deactivatePointer);

    const introTimer = window.setTimeout(() => {
      hasStarted = true;
      morphText(INITIAL_PARTICLE_TEXT, false);
    }, BACKGROUND_TRANSITION_MS);

    const inputTimer = window.setTimeout(
      () => setIsInputVisible(true),
      BACKGROUND_TRANSITION_MS + (reducedMotionQuery.matches ? 250 : INPUT_DELAY_MS),
    );

    const resizeObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resizeCanvas);
    });
    resizeObserver.observe(canvas);

    return () => {
      isDisposed = true;
      window.clearTimeout(introTimer);
      window.clearTimeout(inputTimer);
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", deactivatePointer);
      resizeObserver.disconnect();
      morphTextRef.current = () => {};
    };
  }, []);

  return (
    <main className={styles.scene}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        {renderedText}
      </p>
      {activeDescription ? (
        <aside
          key={activeDescription.id}
          className={styles.particleDescription}
          aria-live="polite"
        >
          <strong>{activeDescription.title}</strong>
          {activeDescription.category ? (
            <span>{activeDescription.category}</span>
          ) : null}
          <p>{activeDescription.description}</p>
        </aside>
      ) : null}
      <div
        className={`${styles.inputWrap} ${isInputVisible ? styles.inputWrapVisible : ""}`}
      >
        <form
          className={styles.inputForm}
          onSubmit={(event) => {
            event.preventDefault();
            const submittedText = inputValue.trim();
            morphTextRef.current(submittedText);
            const specialDescription = getParticleDescription(submittedText);

            if (specialDescription) {
              descriptionIdRef.current += 1;
              setActiveDescription({
                id: descriptionIdRef.current,
                ...specialDescription,
              });
            } else {
              setActiveDescription(null);
            }
          }}
        >
          <label htmlFor="showroom-particle-text" className="sr-only">
            Particle text
          </label>
          <input
            id="showroom-particle-text"
            className={styles.input}
            type="text"
            value={inputValue}
            maxLength={56}
            autoComplete="off"
            spellCheck="false"
            onFocus={() => {
              if (
                !hasFocusedInputRef.current &&
                inputValue === INITIAL_PARTICLE_TEXT
              ) {
                setInputValue("");
              }

              hasFocusedInputRef.current = true;
            }}
            onChange={(event) => setInputValue(event.target.value)}
          />
        </form>
        <aside className={styles.inputGuide} aria-live="polite">
          <p>
            여러분의 감각을 적어보세요.
            <br />
            촉각, 시각, 청각, 미각, 후각은 특별한 설명이 제공됩니다.
          </p>
        </aside>
      </div>
    </main>
  );
}
