"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { dhatus, type Dhatu } from "@/lib/games/dhatus";

const ROOT_COLOR = "#c4956a";
const DERIVED_COLOR = "#6a7a9a";
const PLAYER_COLOR = "#e8c547";
const VALID_HOVER = "#4ade80";

// Ambient drifting particles
function ParticleField() {
  const count = 120;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3] += Math.sin(state.clock.elapsedTime + i * 0.1) * 0.002;
      pos.array[i * 3 + 1] += Math.cos(state.clock.elapsedTime * 0.7 + i * 0.2) * 0.002;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#c4b5fd"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// Burst particles on successful hop
function HopBurst({ position, onComplete }: { position: [number, number, number]; onComplete: () => void }) {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const count = 40;
  const velocities = useRef<Float32Array>(
    (() => {
      const v = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.08 + Math.random() * 0.06;
        v[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        v[i * 3 + 1] = Math.cos(phi) * speed;
        v[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
      }
      return v;
    })()
  );

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = position[0];
      p[i * 3 + 1] = position[1];
      p[i * 3 + 2] = position[2];
    }
    return p;
  }, [position]);

  const life = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current || !matRef.current) return;
    life.current += delta;
    if (life.current > 0.6) {
      onComplete();
      return;
    }
    matRef.current.opacity = 1 - life.current / 0.6;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3] += velocities.current[i * 3];
      pos.array[i * 3 + 1] += velocities.current[i * 3 + 1];
      pos.array[i * 3 + 2] += velocities.current[i * 3 + 2];
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.12}
        color={VALID_HOVER}
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Platform({
  label,
  isRoot,
  position,
  onClick,
  isPlayerOn,
  isValidTarget,
}: {
  label: string;
  isRoot: boolean;
  position: [number, number, number];
  onClick: () => void;
  isPlayerOn: boolean;
  isValidTarget: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const bobOffset = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    bobOffset.current = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.04;
    meshRef.current.position.y = bobOffset.current;
  });

  const pulse = isValidTarget || hovered ? 1.08 : 1;
  const color = isPlayerOn ? VALID_HOVER : hovered ? VALID_HOVER : isRoot ? ROOT_COLOR : DERIVED_COLOR;
  const emissive = (isValidTarget || hovered) ? VALID_HOVER : undefined;

  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
        scale={[pulse, pulse, pulse]}
      >
        <boxGeometry args={[isRoot ? 2 : 1.2, 0.3, isRoot ? 2 : 1.2]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.3}
          emissive={emissive}
          emissiveIntensity={emissive ? 0.25 : 0}
        />
      </mesh>
      <Float speed={3} floatIntensity={0.15}>
        <Text
          position={[0, 0.55, 0]}
          fontSize={isRoot ? 0.28 : 0.16}
          color="#fef3c7"
          anchorX="center"
          anchorY="middle"
          maxWidth={isRoot ? 1.8 : 1}
          textAlign="center"
          outlineWidth={0.02}
          outlineColor="#0a0612"
        >
          {label}
        </Text>
      </Float>
    </group>
  );
}

function PlayerSphere({
  targetPos,
  onLand,
}: {
  targetPos: [number, number, number];
  onLand: (pos: [number, number, number]) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const landed = useRef(true);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = new THREE.Vector3(...targetPos);
    const diff = target.clone().sub(meshRef.current.position);

    if (diff.length() < 0.02) {
      if (!landed.current) {
        landed.current = true;
        const p = meshRef.current.position;
        onLand([p.x, p.y, p.z]);
      }
      meshRef.current.position.copy(target);
      velocity.current.set(0, 0, 0);
      return;
    }

    landed.current = false;
    const spring = 12;
    const damp = 0.7;
    velocity.current.add(diff.multiplyScalar(spring * delta));
    velocity.current.multiplyScalar(Math.pow(damp, 60 * delta));
    meshRef.current.position.add(velocity.current.clone().multiplyScalar(delta * 60));
  });

  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[0.4, 24, 24]} />
      <meshStandardMaterial
        ref={matRef}
        color={PLAYER_COLOR}
        emissive={PLAYER_COLOR}
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.6}
      />
    </mesh>
  );
}

function getRootPosition(d: Dhatu): [number, number, number] {
  const i = dhatus.indexOf(d);
  const angle = (i / 5) * Math.PI * 0.8 + Math.PI * 0.1;
  return [
    Math.cos(angle) * 4,
    0.5 + Math.sin(angle) * 2,
    Math.sin(angle) * 4,
  ];
}

export function DhatuDash3D() {
  const [currentRoot, setCurrentRoot] = useState<Dhatu>(dhatus[0]);
  const [playerPlatform, setPlayerPlatform] = useState<string>(dhatus[0].id);
  const [playerPos, setPlayerPos] = useState<[number, number, number]>(() =>
    getRootPosition(dhatus[0])
  );
  const [score, setScore] = useState(0);
  const [bursts, setBursts] = useState<Array<{ id: number; pos: [number, number, number] }>>([]);
  const burstIdRef = useRef(0);
  const [flash, setFlash] = useState(false);

  const getDerivedForms = useCallback((d: Dhatu): string[] => {
    const forms: string[] = [];
    for (const df of d.derivedForms || []) {
      if (df.form) forms.push(df.form);
    }
    for (const name of d.derivesTo || []) {
      if (name && !forms.includes(name)) forms.push(name);
    }
    return forms.slice(0, 6);
  }, []);

  const getValidTargets = useCallback(() => {
    if (!playerPlatform) return [] as string[];
    const plat = playerPlatform.startsWith("derived_");
    if (plat) {
      return [currentRoot.id, ...getDerivedForms(currentRoot).map((f) => `derived_${f}`)].filter(
        (id) => id !== playerPlatform
      );
    }
    return getDerivedForms(currentRoot).map((f) => `derived_${f}`);
  }, [playerPlatform, currentRoot, getDerivedForms]);

  const tryHopTo = useCallback(
    (targetId: string) => {
      const valid = getValidTargets();
      if (!valid.includes(targetId)) return;

      const isRoot = !targetId.startsWith("derived_");
      let targetPos: [number, number, number];

      if (isRoot) {
        const d = dhatus.find((r) => r.id === targetId);
        if (!d) return;
        targetPos = getRootPosition(d);
        setCurrentRoot(d);
      } else {
        const forms = getDerivedForms(currentRoot);
        const idx = forms.indexOf(targetId.replace("derived_", ""));
        const angle = (idx / Math.max(forms.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const dist = 3;
        targetPos = [Math.cos(angle) * dist, -0.5, Math.sin(angle) * dist];
      }

      setPlayerPlatform(targetId);
      setPlayerPos(targetPos);
      setScore((s) => s + 10);
    },
    [getValidTargets, getDerivedForms, currentRoot]
  );

  const removeBurst = useCallback((id: number) => {
    setBursts((b) => b.filter((x) => x.id !== id));
  }, []);

  const rootPlats = dhatus.slice(0, 5);
  const forms = getDerivedForms(currentRoot);
  const validTargets = getValidTargets();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-lg font-semibold text-amber-200">
          √{currentRoot.iast} — {currentRoot.meaning}
        </h2>
        <span className="text-emerald-400 font-mono">Score: {score}</span>
      </div>
      <div
        className={`w-full aspect-video rounded-xl overflow-hidden border border-amber-500/30 bg-[#0a0612] relative transition-colors duration-75 ${
          flash ? "ring-2 ring-emerald-400/60" : ""
        }`}
      >
        <Canvas camera={{ position: [0, 2, 12], fov: 45 }} shadows>
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1.3}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-5, 5, 5]} intensity={0.6} color={ROOT_COLOR} />
          <pointLight position={[0, 0, 5]} intensity={0.3} color="#c4b5fd" />

          <ParticleField />

          {bursts.map((b) => (
            <HopBurst key={b.id} position={b.pos} onComplete={() => removeBurst(b.id)} />
          ))}

          {rootPlats.map((d, i) => {
            const angle = (i / rootPlats.length) * Math.PI * 0.8 + Math.PI * 0.1;
            const x = Math.cos(angle) * 4;
            const z = Math.sin(angle) * 4;
            const y = 0.5 + Math.sin(angle) * 2;
            return (
              <Platform
                key={d.id}
                label={d.iast}
                isRoot
                position={[x, y, z]}
                onClick={() => tryHopTo(d.id)}
                isPlayerOn={playerPlatform === d.id}
                isValidTarget={validTargets.includes(d.id)}
              />
            );
          })}

          {forms.map((f, i) => {
            const angle = (i / Math.max(forms.length, 1)) * Math.PI * 2 - Math.PI / 2;
            const dist = 3;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            return (
              <Platform
                key={`derived_${f}`}
                label={f}
                isRoot={false}
                position={[x, -0.5, z]}
                onClick={() => tryHopTo(`derived_${f}`)}
                isPlayerOn={playerPlatform === `derived_${f}`}
                isValidTarget={validTargets.includes(`derived_${f}`)}
              />
            );
          })}

          <PlayerSphere
            targetPos={playerPos}
            onLand={(pos) => {
              setBursts((b) => [...b, { id: burstIdRef.current++, pos }]);
              setFlash(true);
              setTimeout(() => setFlash(false), 120);
            }}
          />

          <OrbitControls
            makeDefault
            enableZoom
            enablePan={false}
            minDistance={8}
            maxDistance={20}
            rotateSpeed={0.8}
          />
        </Canvas>
      </div>
      <p className="text-sm text-slate-500 px-2">
        Click platforms to hop. Valid targets glow. Land on roots to switch realms.
      </p>
    </div>
  );
}
