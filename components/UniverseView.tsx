
import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame, ThreeElements } from '@react-three/fiber';
import { Stars, Html, Line, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialState } from '../types.ts';

// Fix for JSX intrinsic elements in React Three Fiber by extending the global JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// Also augment the React namespace's JSX for compatibility with different TypeScript/React versions
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface UniverseViewProps {
  state: CelestialState;
  onChange: (state: Partial<CelestialState>) => void;
  miniMap?: boolean;
}

const InteractionPlane: React.FC<{
  onDrag: (point: THREE.Vector3) => void;
  onEnd: () => void;
  isDragging: boolean;
}> = ({ onDrag, onEnd, isDragging }) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={(e) => {
        if (isDragging) {
          e.stopPropagation();
          onDrag(e.point);
        }
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        onEnd();
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        onEnd();
      }}
    >
      <planeGeometry args={[10000, 10000]} />
      <meshBasicMaterial transparent opacity={0} visible={false} />
    </mesh>
  );
};

const EarthSystem: React.FC<{
  state: CelestialState;
  orbitDist: number;
  moonDist: number;
  onStartDragEarth?: (e: any) => void;
  onStartDragMoon?: (e: any) => void;
  isMobile: boolean;
  miniMap: boolean;
}> = ({ state, orbitDist, moonDist, onStartDragEarth, onStartDragMoon, isMobile, miniMap }) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);

  const earthX = Math.cos(state.earthOrbitProgress * Math.PI * 2) * orbitDist;
  const earthZ = -Math.sin(state.earthOrbitProgress * Math.PI * 2) * orbitDist; // 반시계 방향
  const angleToSun = Math.atan2(-earthZ, -earthX);
  const moonAngle = angleToSun + (state.moonOrbitProgress * Math.PI * 2);

  const timeAngle = (state.time / 24) * Math.PI * 2;
  const userLocalX = Math.cos(angleToSun + timeAngle) * (isMobile ? 35 : 30);
  const userLocalZ = Math.sin(angleToSun + timeAngle) * (isMobile ? 35 : 30);

  const earthRadius = isMobile ? 35 : 25;
  const moonRadius = isMobile ? 20 : 12;

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.5;
    if (moonRef.current) moonRef.current.rotation.y += delta * 0.2;
  });

  return (
    <group position={[earthX, 0, earthZ]}>
      {/* Earth Mesh */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[earthRadius, 32, 32]} />
        <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.5} roughness={0.5} />
      </mesh>

      {!miniMap && (
        <mesh
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartDragEarth?.(e);
          }}
          onPointerEnter={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'grab';
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[earthRadius * 2, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} visible={false} />
        </mesh>
      )}
      
      {!miniMap && (
        <group position={[0, earthRadius + 15, 0]}>
          <Html center>
            <div className="text-white font-bold text-[10px] md:text-sm whitespace-nowrap select-none opacity-80 bg-black/40 px-2 rounded">지구 (Earth)</div>
          </Html>
        </group>
      )}

      {/* User 시점 Indicator */}
      <group position={[userLocalX, 0, userLocalZ]}>
        <mesh position={[0, earthRadius + 5, 0]}>
          <cylinderGeometry args={[2, 2, earthRadius * 2 + 10, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.0} />
        </mesh>
        {!miniMap && (
          <group position={[0, earthRadius + 50, 0]}>
            <Html center>
              <div className="text-red-500 font-black text-[10px] md:text-xs whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-lg select-none">시점 (VIEW)</div>
            </Html>
          </group>
        )}
      </group>

      <Line
        points={new Array(65).fill(0).map((_, i) => [
          Math.cos(i / 64 * Math.PI * 2) * moonDist,
          0,
          Math.sin(i / 64 * Math.PI * 2) * moonDist
        ])}
        color="white"
        lineWidth={1}
        transparent
        opacity={0.2}
      />

      {/* Moon Mesh */}
      <mesh ref={moonRef} position={[Math.cos(moonAngle) * moonDist, 0, -Math.sin(moonAngle) * moonDist]}>
        <sphereGeometry args={[moonRadius, 32, 32]} />
        <meshStandardMaterial color="#d1d5db" emissive="#ffffff" emissiveIntensity={0.1} />
        {!miniMap && (
          <group position={[0, moonRadius + 15, 0]}>
            <Html center>
              <div className="text-gray-300 font-bold text-[10px] whitespace-nowrap select-none bg-black/40 px-2 rounded">달 (Moon)</div>
            </Html>
          </group>
        )}
      </mesh>

      {!miniMap && (
        <mesh
          position={[Math.cos(moonAngle) * moonDist, 0, -Math.sin(moonAngle) * moonDist]}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartDragMoon?.(e);
          }}
          onPointerEnter={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'grab';
          }}
          onPointerLeave={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[moonRadius * 2.5, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} visible={false} />
        </mesh>
      )}
    </group>
  );
};

const Sun: React.FC<{ isMobile: boolean; miniMap: boolean }> = ({ isMobile, miniMap }) => {
  const sunRadius = isMobile ? 80 : 60;
  return (
    <group>
      <mesh>
        <sphereGeometry args={[sunRadius, 32, 32]} />
        <meshBasicMaterial color="#ffcc33" />
      </mesh>
      <pointLight intensity={2} distance={3000} />
      {!miniMap && (
        <group position={[0, sunRadius + 20, 0]}>
          <Html center>
            <div className="text-yellow-400 font-black text-sm md:text-xl whitespace-nowrap drop-shadow-[0_0_10px_rgba(255,204,51,0.8)] select-none uppercase tracking-tighter">태양 (Sun)</div>
          </Html>
        </group>
      )}
    </group>
  );
};

const Scene: React.FC<UniverseViewProps> = ({ state, onChange, miniMap = false }) => {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5;
  const EARTH_DIST = isMobile ? 450 : 350;
  const MOON_DIST = isMobile ? 150 : 110;

  const [dragTarget, setDragTarget] = useState<'earth' | 'moon' | null>(null);

  const handleDragUpdate = (point: THREE.Vector3) => {
    if (!dragTarget || miniMap) return;

    if (dragTarget === 'earth') {
      const angle = Math.atan2(point.z, point.x);
      let progress = angle / (Math.PI * 2);
      if (progress < 0) progress += 1;
      onChange({ earthOrbitProgress: progress });
    } else if (dragTarget === 'moon') {
      const earthX = Math.cos(state.earthOrbitProgress * Math.PI * 2) * EARTH_DIST;
      const earthZ = Math.sin(state.earthOrbitProgress * Math.PI * 2) * EARTH_DIST;

      const relX = point.x - earthX;
      const relZ = point.z - earthZ;
      const relAngle = Math.atan2(relZ, relX);

      const angleToSun = Math.atan2(-earthZ, -earthX);
      let progress = (relAngle - angleToSun) / (Math.PI * 2);
      while (progress < 0) progress += 1;
      while (progress >= 1) progress -= 1;
      onChange({ moonOrbitProgress: progress });
    }
  };

  const handleStartDragEarth = (e: any) => {
    if (miniMap) return;
    e.stopPropagation();
    setDragTarget('earth');
    document.body.style.cursor = 'grabbing';
  };

  const handleStartDragMoon = (e: any) => {
    if (miniMap) return;
    e.stopPropagation();
    setDragTarget('moon');
    document.body.style.cursor = 'grabbing';
  };

  const handleEndDrag = () => {
    setDragTarget(null);
    document.body.style.cursor = 'default';
  };

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, miniMap ? 800 : 1200, 0]} fov={miniMap ? 50 : (isMobile ? 60 : 45)} />
      {!miniMap && (
        <OrbitControls
          enablePan={true}
          enableRotate={false}
          enableZoom={true}
          enabled={!dragTarget}
          minDistance={400}
          maxDistance={2000}
          minPolarAngle={0}
          maxPolarAngle={0}
          minAzimuthAngle={0}
          maxAzimuthAngle={0}
          enableDamping={true}
          dampingFactor={0.05}
          zoomSpeed={1.2}
          touches={{
            ONE: 3,  // PAN
            TWO: 1   // DOLLY_PAN
          }}
        />
      )}
      <Stars radius={2000} depth={100} count={isMobile ? 3000 : 5000} factor={3} saturation={0} fade />
      <ambientLight intensity={0.6} />
      
      <Line
        points={new Array(129).fill(0).map((_, i) => [
          Math.cos(i / 128 * Math.PI * 2) * EARTH_DIST,
          0,
          Math.sin(i / 128 * Math.PI * 2) * EARTH_DIST
        ])}
        color="#3b82f6"
        lineWidth={1.5}
        transparent
        opacity={0.3}
      />

      <Sun isMobile={isMobile} miniMap={miniMap} />
      
      <EarthSystem
        state={state}
        orbitDist={EARTH_DIST}
        moonDist={MOON_DIST}
        onStartDragEarth={handleStartDragEarth}
        onStartDragMoon={handleStartDragMoon}
        isMobile={isMobile}
        miniMap={miniMap}
      />

      {!miniMap && (
        <InteractionPlane
          onDrag={handleDragUpdate}
          onEnd={handleEndDrag}
          isDragging={dragTarget !== null}
        />
      )}
    </>
  );
};

const UniverseView: React.FC<UniverseViewProps> = (props) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isMini = props.miniMap || false;

  return (
    <div className={`w-full h-full relative ${isMini ? '' : 'bg-[#00000a]'}`} style={{ touchAction: 'none' }}>
      <Canvas
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        performance={{ min: 0.5 }}
      >
        <Scene {...props} miniMap={isMini} />
      </Canvas>
      
      {/* Strictly hide UI text if miniMap is true */}
      {!isMini && (
        <div className="absolute top-28 left-6 pointer-events-none">
          <h2 className="text-base md:text-lg font-black text-white/90 tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Universe Map (2D View)
          </h2>
          <div className="bg-blue-500 h-1 w-24 mt-1 rounded-full" />
          <p className="text-[10px] mt-2 font-bold text-blue-400/60 uppercase tracking-tighter">
            {isMobile ? '행성 터치 드래그 | 핀치로 줌' : '행성 드래그로 위치 변경 | 마우스휠로 줌'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UniverseView;
