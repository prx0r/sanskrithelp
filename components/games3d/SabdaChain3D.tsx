"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Text, Float, OrbitControls } from "@react-three/drei";

const CHAIN_WORDS = ["karma", "kārya", "kartṛ", "kriyā", "kṛta", "karoti", "saṃskāra", "kāraka"];

export function SabdaChain3D() {
  const [chain, setChain] = useState<string[]>([CHAIN_WORDS[0]]);
  const [timer, setTimer] = useState(10);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const options = CHAIN_WORDS.slice(1, 5);

  const addToChain = (word: string) => {
    setChain((c) => [...c, word]);
    setScore((s) => s + 10);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-lg font-semibold text-amber-200">Śabda Chain — Connect words by root/suffix</h2>
        <div className="flex gap-4">
          <span className="text-rose-400 font-mono">{timer}s</span>
          <span className="text-slate-400">Score: {score}</span>
        </div>
      </div>
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-[#0a0612]">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <OrbitControls makeDefault enableZoom />

          {/* Chain display - 3D linked nodes */}
          <group position={[0, 0.5, 0]}>
            {chain.map((word, i) => (
              <Float key={`${word}-${i}`} speed={2} floatIntensity={0.1}>
                <group position={[(-chain.length / 2 + i) * 0.8, 0, 0]}>
                  <mesh>
                    <boxGeometry args={[0.7, 0.35, 0.4]} />
                    <meshStandardMaterial
                      color="#6b5b95"
                      roughness={0.5}
                      metalness={0.2}
                      emissive={i === chain.length - 1 ? "#a78bfa" : undefined}
                      emissiveIntensity={i === chain.length - 1 ? 0.2 : 0}
                    />
                  </mesh>
                  <Text
                    position={[0, 0, 0.25]}
                    fontSize={0.12}
                    color="#e9d5ff"
                    anchorX="center"
                    anchorY="middle"
                  >
                    {word}
                  </Text>
                </group>
              </Float>
            ))}
          </group>

          {/* Options */}
          {options.map((word, i) => (
            <group key={word} position={[-1.5 + i * 1, -1.2, 0]}>
              <mesh onClick={() => addToChain(word)}>
                <boxGeometry args={[0.9, 0.4, 0.5]} />
                <meshStandardMaterial
                  color="#4a5568"
                  roughness={0.6}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <Text position={[0, 0, 0.28]} fontSize={0.14} color="#94a3b8" anchorX="center" anchorY="middle">
                {word}
              </Text>
            </group>
          ))}
        </Canvas>
      </div>
      {timer === 0 && (
        <p className="text-center text-emerald-400">Chain: {chain.length} links</p>
      )}
      <p className="text-sm text-slate-500 px-2">
        Click options to extend the chain. Words share root/suffix connections.
      </p>
    </div>
  );
}
