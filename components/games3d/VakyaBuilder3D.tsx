"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";

const SENTENCES = [
  { meaning: "Rāma goes to the forest", words: ["rāmaḥ", "vanam", "gacchati"] },
  { meaning: "The teacher gives knowledge", words: ["guruḥ", "jñānam", "dadāti"] },
  { meaning: "Sītā sees the moon", words: ["sītā", "candram", "paśyati"] },
];

export function VakyaBuilder3D() {
  const [currentSentence, setCurrentSentence] = useState(0);
  const [order, setOrder] = useState<number[]>([]);

  const sent = SENTENCES[currentSentence % SENTENCES.length];
  const words = order.length === sent.words.length
    ? order.map((i) => sent.words[i])
    : [...sent.words].sort(() => Math.random() - 0.5);

  const handleNext = () => {
    setCurrentSentence((c) => c + 1);
    setOrder([]);
  };

  return (
    <div className="space-y-4">
      <div className="px-4">
        <h2 className="text-lg font-semibold text-amber-200">Vākya Builder</h2>
        <p className="text-sm text-slate-400">Meaning: {sent.meaning}</p>
      </div>
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-[#0a0612]">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <OrbitControls makeDefault enableZoom />

          {/* Sentence slots - 3D bar */}
          <group position={[0, 0.5, 0]}>
            <mesh>
              <boxGeometry args={[5, 0.5, 0.8]} />
              <meshStandardMaterial
                color="#1e1b2e"
                roughness={0.9}
                transparent
                opacity={0.6}
              />
            </mesh>
            {words.map((w, i) => (
              <Text
                key={`${w}-${i}`}
                position={[-2 + i * 2, 0, 0.45]}
                fontSize={0.22}
                color="#c4b5fd"
                anchorX="center"
                anchorY="middle"
              >
                {w}
              </Text>
            ))}
          </group>

          {/* Word blocks below - click to add to sentence */}
          {sent.words.map((w, i) => (
            <group key={w} position={[-1.5 + i * 1.5, -1.5, 0]}>
              <mesh>
                <boxGeometry args={[1, 0.35, 0.5]} />
                <meshStandardMaterial color="#6b5b95" roughness={0.5} metalness={0.2} />
              </mesh>
              <Text position={[0, 0, 0.28]} fontSize={0.15} color="#e9d5ff" anchorX="center" anchorY="middle">
                {w}
              </Text>
            </group>
          ))}
        </Canvas>
      </div>
      <div className="flex justify-between px-4">
        <p className="text-sm text-slate-500">Arrange words into the sentence (3D preview)</p>
        <button
          onClick={handleNext}
          className="text-sm text-primary hover:underline"
        >
          Next sentence →
        </button>
      </div>
    </div>
  );
}
