"use client";

import { useState, useRef } from "react";
import { Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const KARAKAS = ["kartṛ", "karma", "karaṇa", "sampradāna", "apādāna", "adhikaraṇa"];
const SAMPLE_WORDS = ["rāmaḥ", "vanam", "śastreṇa", "sītāyai", "grāmāt", "aśve"];

function KarakaSlot({
  name,
  position,
  onDrop,
}: {
  name: string;
  position: [number, number, number];
  onDrop: (word: string) => void;
}) {
  const [droppedWord, setDroppedWord] = useState<string | null>(null);

  const handleDrop = (word: string) => {
    setDroppedWord(word);
    onDrop(word);
  };

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.2, 0.4, 0.6]} />
        <meshStandardMaterial
          color="#2d1b4e"
          roughness={0.8}
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.1}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
      {(droppedWord || "").length > 0 && (
        <Text
          position={[0, 0, 0.35]}
          fontSize={0.15}
          color="#c4b5fd"
          anchorX="center"
          anchorY="middle"
        >
          {droppedWord}
        </Text>
      )}
    </group>
  );
}

function DraggableWord({
  word,
  position,
  onDragEnd,
}: {
  word: string;
  position: [number, number, number];
  onDragEnd: (word: string, position: THREE.Vector3) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={() => setDragging(true)}
      onPointerUp={(e) => {
        setDragging(false);
        if (groupRef.current) {
          const p = groupRef.current.position.clone();
          onDragEnd(word, p);
        }
      }}
    >
      <mesh>
        <boxGeometry args={[1, 0.35, 0.3]} />
        <meshStandardMaterial
          color="#6b5b95"
          roughness={0.5}
          metalness={0.2}
          emissive={dragging ? "#a78bfa" : undefined}
          emissiveIntensity={dragging ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, 0.2]}
        fontSize={0.14}
        color="#e9d5ff"
        anchorX="center"
        anchorY="middle"
      >
        {word}
      </Text>
    </group>
  );
}

export function KarakaWeb3D() {
  const [score, setScore] = useState(0);
  const [slots, setSlots] = useState<Record<string, string>>({});

  const handleDrop = (word: string) => {
    setScore((s) => s + 5);
  };

  const rad = 2;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-lg font-semibold text-amber-200">Kāraka Web — Assign words to semantic slots</h2>
        <span className="text-slate-400">Score: {score}</span>
      </div>
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-[#0a0612]">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <OrbitControls makeDefault enableZoom minDistance={5} maxDistance={15} />

          {/* Verb at center-top */}
          <Text
            position={[0, 2, 0]}
            fontSize={0.3}
            color="#c4956a"
            anchorX="center"
            anchorY="middle"
          >
            gacchati (goes)
          </Text>

          {/* Kāraka slots in ring */}
          {KARAKAS.map((k, i) => {
            const angle = (i / KARAKAS.length) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * rad;
            const z = Math.sin(angle) * rad;
            return (
              <KarakaSlot
                key={k}
                name={k}
                position={[x, 0, z]}
                onDrop={handleDrop}
              />
            );
          })}

          {/* Draggable words at bottom */}
          {SAMPLE_WORDS.map((word, i) => (
            <DraggableWord
              key={word}
              word={word}
              position={[-2.5 + i * 1, -2.2, 0]}
              onDragEnd={() => {}}
            />
          ))}
        </Canvas>
      </div>
      <p className="text-sm text-slate-500 px-2">
        Drag words to kāraka slots (simplified: drop detection wired to score).
      </p>
    </div>
  );
}
