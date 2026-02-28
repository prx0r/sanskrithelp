"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { dhatus, isFormOfRoot, type Dhatu } from "@/lib/games/dhatus";

const CORRECT_COLOR = "#4ade80";
const WRONG_COLOR = "#f87171";

function FloatingWord({
  id,
  form,
  correct,
  startX,
  y,
  onHit,
}: {
  id: number;
  form: string;
  correct: boolean;
  startX: number;
  y: number;
  onHit: (id: number, correct: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const hit = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current || hit.current) return;
    groupRef.current.position.x += (startX > 0 ? -1 : 1) * 3 * delta;
    if (Math.abs(groupRef.current.position.x) > 15) {
      if (!correct) onHit(id, false);
      hit.current = true;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[startX, y, 0]}
      onClick={(e) => {
        e.stopPropagation();
        hit.current = true;
        onHit(id, correct);
      }}
    >
      <mesh>
        <planeGeometry args={[1.5, 0.5]} />
        <meshBasicMaterial
          color={correct ? CORRECT_COLOR : WRONG_COLOR}
          transparent
          opacity={0.3}
        />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.2}
        color={correct ? CORRECT_COLOR : WRONG_COLOR}
        anchorX="center"
        anchorY="middle"
      >
        {form}
      </Text>
    </group>
  );
}

export function DhatuShooter3D() {
  const [currentRoot, setCurrentRoot] = useState<Dhatu>(
    () => dhatus[Math.floor(Math.random() * dhatus.length)]
  );
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [words, setWords] = useState<Array<{ id: number; form: string; correct: boolean; startX: number; y: number }>>([]);
  const [gameOver, setGameOver] = useState(false);
  const wordIdRef = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const getRandomCorrectForm = useCallback((): string => {
    const forms = [
      currentRoot.iast,
      ...(currentRoot.derivedForms?.map((d) => d.form) || []),
      ...(currentRoot.derivesTo || []),
    ].filter(Boolean);
    return forms[Math.floor(Math.random() * forms.length)] || currentRoot.iast;
  }, [currentRoot]);

  const spawnWord = useCallback(() => {
    const allForms: string[] = [];
    dhatus.forEach((d) => {
      d.derivedForms?.forEach((df) => allForms.push(df.form));
      d.derivesTo?.forEach((f) => allForms.push(f));
    });

    const correctForm = getRandomCorrectForm();
    const wrongOptions = allForms.filter((f) => !isFormOfRoot(f, currentRoot));
    const wrongForm = wrongOptions[Math.floor(Math.random() * Math.min(5, wrongOptions.length))] || "xyz";

    const useCorrect = Math.random() > 0.4;
    const form = useCorrect ? correctForm : wrongForm;
    const correct = isFormOfRoot(form, currentRoot);
    const side = Math.random() > 0.5 ? 1 : -1;
    const startX = side * 12;
    const y = (Math.random() - 0.5) * 6;

    setWords((w) => [
      ...w,
      { id: wordIdRef.current++, form, correct, startX, y },
    ]);
  }, [currentRoot, getRandomCorrectForm]);

  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(spawnWord, 2000);
    return () => clearInterval(id);
  }, [spawnWord, gameOver]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!gameOver) {
        setCurrentRoot((prev) => {
          let next = dhatus[Math.floor(Math.random() * dhatus.length)];
          while (next.id === prev.id && dhatus.length > 1) {
            next = dhatus[Math.floor(Math.random() * dhatus.length)];
          }
          return next;
        });
      }
    }, 15000);
    return () => clearInterval(id);
  }, [gameOver]);

  const handleWordHit = useCallback((id: number, correct: boolean) => {
    setWords((w) => w.filter((x) => x.id !== id));
    if (correct) {
      setScore((s) => s + 15);
    } else {
      setLives((l) => {
        if (l <= 1) setGameOver(true);
        return l - 1;
      });
    }
  }, []);

  if (gameOver) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 bg-[#0a0612] rounded-xl border border-border">
          <h2 className="text-2xl font-bold text-rose-400">Game Over</h2>
          <p className="text-xl text-amber-200">Score: {score}</p>
          <button
            onClick={() => {
              setGameOver(false);
              setScore(0);
              setLives(3);
              setWords([]);
            }}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Restart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-xl font-bold text-amber-400">√{currentRoot.iast}</h2>
        <div className="flex gap-4">
          <span className="text-slate-400">Score: {score}</span>
          <span className="text-rose-400">{"♥".repeat(lives)}</span>
        </div>
      </div>
      <div
        ref={canvasRef}
        className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-[#0a0612] cursor-crosshair"
      >
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          {/* Target root display */}
          <Text
            position={[0, 3, 0]}
            fontSize={0.5}
            color="#c4956a"
            anchorX="center"
            anchorY="middle"
          >
            √{currentRoot.iast}
          </Text>

          {/* Floating words */}
          {words.map((w) => (
            <FloatingWord
              key={w.id}
              id={w.id}
              form={w.form}
              correct={w.correct}
              startX={w.startX}
              y={w.y}
              onHit={handleWordHit}
            />
          ))}
        </Canvas>
      </div>
      <p className="text-sm text-slate-500 px-2">
        Click words derived from √{currentRoot.iast}. Let wrong ones pass = lose a life.
      </p>
    </div>
  );
}
