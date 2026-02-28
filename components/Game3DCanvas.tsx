"use client";

import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload } from "@react-three/drei";

interface Game3DCanvasProps {
  children: React.ReactNode;
  className?: string;
  orthographic?: boolean;
}

export function Game3DCanvas({ children, className, orthographic }: Game3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={className ?? "w-full aspect-video rounded-xl overflow-hidden border border-border bg-[#0a0612]"}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        orthographic={orthographic}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
          <pointLight position={[-5, -5, 5]} intensity={0.5} color="#c4956a" />
          {children}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
