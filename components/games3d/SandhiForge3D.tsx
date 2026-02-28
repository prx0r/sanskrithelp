"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import sandhiRules from "@/data/sandhi-rules.json";

interface SandhiExample {
  input: string[];
  output: string;
  annotation: string;
}

const rules = sandhiRules as Array<{
  id: string;
  examples: SandhiExample[];
}>;

const flatExamples = rules.flatMap((r) =>
  r.examples.map((ex) => ({ ...ex, ruleId: r.id }))
);

export function SandhiForge3D() {
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const ex = flatExamples[idx % flatExamples.length];

  useEffect(() => {
    setShowAnswer(false);
  }, [idx]);

  useEffect(() => {
    if (!showAnswer) return;
    setScore((s) => s + 10);
    const t = setTimeout(() => {
      setIdx((i) => i + 1);
    }, 3500);
    return () => clearTimeout(t);
  }, [showAnswer]);

  useEffect(() => {
    if (showAnswer) return;
    const t = setTimeout(() => setShowAnswer(true), 2500);
    return () => clearTimeout(t);
  }, [idx, showAnswer]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-lg font-semibold text-amber-200">Sandhi Forge — Predict the junction</h2>
        <span className="text-slate-400">Score: {score}</span>
      </div>
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-[#0a0612]">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          {/* Left block */}
          <group position={[-2.5, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[1.5, 1, 1]} />
              <meshStandardMaterial color="#6b5b95" roughness={0.5} metalness={0.2} />
            </mesh>
            <Text position={[0, 0, 0.56]} fontSize={0.2} color="#e9d5ff" anchorX="center" anchorY="middle">
              {ex.input[0]}
            </Text>
          </group>

          {/* Plus sign */}
          <Text position={[0, 0, 0]} fontSize={0.3} color="#94a3b8" anchorX="center" anchorY="middle">
            +
          </Text>

          {/* Right block */}
          <group position={[2.5, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[1.5, 1, 1]} />
              <meshStandardMaterial color="#6b5b95" roughness={0.5} metalness={0.2} />
            </mesh>
            <Text position={[0, 0, 0.56]} fontSize={0.2} color="#e9d5ff" anchorX="center" anchorY="middle">
              {ex.input[1] || ""}
            </Text>
          </group>

          {/* Result block - fuse effect when revealed */}
          <group position={[0, -2, 0]} scale={showAnswer ? 1 : 0.5}>
            <mesh castShadow>
              <boxGeometry args={[2.5, 0.8, 1]} />
              <meshStandardMaterial
                color={showAnswer ? "#4ade80" : "#4a5568"}
                roughness={0.4}
                metalness={0.3}
              />
            </mesh>
            <Text
              position={[0, 0, 0.56]}
              fontSize={0.22}
              color={showAnswer ? "#dcfce7" : "#64748b"}
              anchorX="center"
              anchorY="middle"
            >
              {showAnswer ? ex.output : "?"}
            </Text>
          </group>

          {showAnswer && (
            <Text
              position={[0, -3.2, 0]}
              fontSize={0.12}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
              maxWidth={8}
              textAlign="center"
            >
              {ex.annotation}
            </Text>
          )}
        </Canvas>
      </div>
      <p className="text-sm text-slate-500 px-2">
        Two words merge at their boundary. Answer reveals after 2.5s.
      </p>
    </div>
  );
}
