"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Text, Float, OrbitControls } from "@react-three/drei";
import { dhatus } from "@/lib/games/dhatus";

export function PratyayaReactor3D() {
  const [d, setD] = useState(() => dhatus[Math.floor(Math.random() * dhatus.length)]);
  const [df, setDf] = useState<{ form: string; suffix: string } | null>(null);

  useEffect(() => {
    const root = dhatus[Math.floor(Math.random() * dhatus.length)];
    setD(root);
    const forms = root.derivedForms || [];
    const f = forms[Math.floor(Math.random() * Math.max(1, forms.length))];
    setDf(
      f
        ? { form: f.form, suffix: (f.suffix || "").replace(/[+\[\]]/g, "").trim() }
        : { form: root.iast, suffix: "-a" }
    );
  }, []);

  const targetWord = df?.form || d.iast;
  const parts = df ? [d.iast, df.suffix || "-a"] : [d.iast, "-a"];

  return (
    <div className="space-y-4">
      <div className="px-4">
        <h2 className="text-lg font-semibold text-amber-200">Pratyaya Reactor — Assemble the word</h2>
        <p className="text-sm text-violet-300">Build: {targetWord}</p>
      </div>
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-[#0a0612]">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-3, 2, 2]} intensity={0.5} color="#a78bfa" />
          <OrbitControls makeDefault enableZoom />

          {/* Reactor core */}
          <Float speed={1.5} floatIntensity={0.3}>
            <group position={[0, 0, 0]}>
              <mesh>
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshStandardMaterial
                  color="#4ade80"
                  emissive="#22c55e"
                  emissiveIntensity={0.2}
                  roughness={0.4}
                  metalness={0.3}
                />
              </mesh>
              <Text
                position={[0, 0, 0.85]}
                fontSize={0.25}
                color="#dcfce7"
                anchorX="center"
                anchorY="middle"
              >
                {targetWord}
              </Text>
            </group>
          </Float>

          {/* Input components */}
          <group position={[-1.5, 1, 1]}>
            <mesh>
              <boxGeometry args={[1, 0.4, 0.5]} />
              <meshStandardMaterial color="#6b5b95" roughness={0.5} />
            </mesh>
            <Text position={[0, 0, 0.28]} fontSize={0.18} color="#e9d5ff" anchorX="center" anchorY="middle">
              √{parts[0]}
            </Text>
          </group>

          <Text position={[0, 1, 1]} fontSize={0.2} color="#94a3b8" anchorX="center" anchorY="middle">
            +
          </Text>

          <group position={[1.5, 1, 1]}>
            <mesh>
              <boxGeometry args={[1, 0.4, 0.5]} />
              <meshStandardMaterial color="#6b5b95" roughness={0.5} />
            </mesh>
            <Text position={[0, 0, 0.28]} fontSize={0.18} color="#e9d5ff" anchorX="center" anchorY="middle">
              {parts[1]}
            </Text>
          </group>

          <Text
            position={[0, -1.8, 0]}
            fontSize={0.12}
            color="#64748b"
            anchorX="center"
            anchorY="middle"
          >
            Root √{d.iast} + suffix → word
          </Text>
        </Canvas>
      </div>
    </div>
  );
}
