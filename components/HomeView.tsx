
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { Stars, Sky, Text, PerspectiveCamera, Line } from '@react-three/drei';
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

interface HomeViewProps {
  state: CelestialState;
}

// Simple 3D Character made with basic shapes
const Character3D: React.FC = () => {
  const { camera } = useThree();
  const characterRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const [currentDirection, setCurrentDirection] = useState<string>('south');

  const positionRef = useRef(new THREE.Vector3(0, -10, 0));
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetRotation = useRef(0);
  const walkTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!characterRef.current) return;

    const moveSpeed = 20;
    velocityRef.current.set(0, 0, 0);
    let isMoving = false;

    // WASD movement
    if (keysPressed.current['w']) {
      velocityRef.current.z -= moveSpeed * delta;
      targetRotation.current = 0;
      isMoving = true;
    }
    if (keysPressed.current['s']) {
      velocityRef.current.z += moveSpeed * delta;
      targetRotation.current = Math.PI;
      isMoving = true;
    }
    if (keysPressed.current['a']) {
      velocityRef.current.x -= moveSpeed * delta;
      targetRotation.current = Math.PI / 2;
      isMoving = true;
    }
    if (keysPressed.current['d']) {
      velocityRef.current.x += moveSpeed * delta;
      targetRotation.current = -Math.PI / 2;
      isMoving = true;
    }

    // Walking animation
    if (isMoving) {
      walkTime.current += delta * 10;

      // Arm swing
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(walkTime.current) * 0.5;
        rightArmRef.current.rotation.x = Math.sin(walkTime.current + Math.PI) * 0.5;
      }

      // Leg swing
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(walkTime.current) * 0.5;
        rightLegRef.current.rotation.x = Math.sin(walkTime.current + Math.PI) * 0.5;
      }
    } else {
      // Reset to idle pose
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }

    // Update position
    positionRef.current.add(velocityRef.current);

    // Check boundaries and switch direction
    const boundary = 200;
    if (positionRef.current.x < -boundary) {
      positionRef.current.x = boundary;
      setCurrentDirection(prev => prev === 'south' ? 'east' : prev === 'east' ? 'west' : 'south');
    }
    if (positionRef.current.x > boundary) {
      positionRef.current.x = -boundary;
      setCurrentDirection(prev => prev === 'south' ? 'west' : prev === 'west' ? 'east' : 'south');
    }
    if (positionRef.current.z < -boundary) {
      positionRef.current.z = boundary;
    }
    if (positionRef.current.z > boundary) {
      positionRef.current.z = -boundary;
    }

    // Smooth rotation
    characterRef.current.rotation.y = THREE.MathUtils.lerp(
      characterRef.current.rotation.y,
      targetRotation.current,
      0.1
    );

    // Update character position
    characterRef.current.position.copy(positionRef.current);

    // Camera follows character (RPG style)
    const cameraOffset = new THREE.Vector3(0, 8, 15);
    const rotatedOffset = cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterRef.current.rotation.y);
    const targetCameraPos = positionRef.current.clone().add(rotatedOffset);

    camera.position.lerp(targetCameraPos, 0.1);

    const lookAtTarget = positionRef.current.clone();
    lookAtTarget.y += 2;
    camera.lookAt(lookAtTarget);
  });

  return (
    <group ref={characterRef} position={[0, -10, 0]}>
      {/* Head */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Body */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.5, 2, 0.8]} />
        <meshStandardMaterial color="#4a90e2" />
      </mesh>

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-1, 2, 0]}>
        <boxGeometry args={[0.4, 1.8, 0.4]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[1, 2, 0]}>
        <boxGeometry args={[0.4, 1.8, 0.4]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.4, -0.5, 0]}>
        <boxGeometry args={[0.5, 2, 0.5]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>

      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.4, -0.5, 0]}>
        <boxGeometry args={[0.5, 2, 0.5]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </group>
  );
};

const Constellations: React.FC<{ state: CelestialState }> = ({ state }) => {
  const isDay = state.time >= 6 && state.time < 18; // 6시~17시59분까지만 낮

  if (isDay) return null; // 낮에는 별자리가 보이지 않음

  const month = state.date.getMonth() + 1; // 1-12
  const hourAngle = (state.time / 24) * Math.PI * 2; // 시간에 따른 회전
  const yearProgress = state.earthOrbitProgress; // 연중 위치
  const baseAzimuth = yearProgress * Math.PI * 2;

  const radius = 400; // 더 가까이
  const height = 150; // 더 낮게

  // 별자리 데이터
  const constellations = useMemo(() => {
    return [
      // 3월 - 사자자리 (Leo)
      {
        name: "사자자리 (Leo)",
        visible: month >= 2 && month <= 5,
        stars: [
          // 물음표 모양 (사자의 머리와 갈기)
          [0, 0, 0], [1, 1.5, 0], [2, 2, 0], [2.5, 1.5, 0], [2.5, 0, 0], [3, -1, 0],
          // 삼각형 (사자의 몸)
          [3, -1, 0], [5, -1.5, 0], [4, -3, 0], [3, -1, 0]
        ],
        baseAngle: Math.PI / 2,
      },
      // 6월 - 북두칠성 (Big Dipper)
      {
        name: "북두칠성 (Big Dipper)",
        visible: month >= 4 && month <= 8,
        stars: [
          // 국자 손잡이
          [0, 0, 0], [1.5, -0.5, 0], [3, -0.8, 0], [4.5, -0.5, 0],
          // 국자 몸통
          [4.5, -0.5, 0], [5.5, 1, 0], [6.5, 1.2, 0], [7, -0.3, 0], [5.5, 1, 0]
        ],
        baseAngle: Math.PI * 1.5,
      },
      // 9월 - 페가수스 (Pegasus) - 가을의 대사각형
      {
        name: "페가수스 (Pegasus)",
        visible: month >= 8 && month <= 11,
        stars: [
          // 큰 정사각형
          [0, 0, 0], [0, 3, 0], [3, 3, 0], [3, 0, 0], [0, 0, 0],
          // 날개
          [0, 3, 0], [-1, 4, 0], [-1.5, 5, 0]
        ],
        baseAngle: Math.PI,
      },
      // 12월 - 카시오페아 (Cassiopeia)
      {
        name: "카시오페아 (Cassiopeia)",
        visible: month >= 10 || month <= 2,
        stars: [
          // W 모양
          [0, 0, 0], [1, -1.5, 0], [2, 0, 0], [3, -1.5, 0], [4, 0, 0]
        ],
        baseAngle: 0,
      }
    ];
  }, [month]);

  return (
    <group>
      {constellations.map((constellation, idx) => {
        if (!constellation.visible) return null;

        const azimuth = constellation.baseAngle + baseAzimuth - hourAngle;
        const x = Math.sin(azimuth) * radius;
        const z = -Math.cos(azimuth) * radius;

        return (
          <group key={idx} position={[x, height, z]}>
            {/* 별자리 선 */}
            <Line
              points={constellation.stars.map(([sx, sy, sz]) => [sx * 20, sy * 20, sz * 20])}
              color="#ffeb3b"
              lineWidth={3}
              transparent
              opacity={0.9}
            />

            {/* 별자리 별들 */}
            {constellation.stars.map((star, starIdx) => (
              <mesh key={starIdx} position={[star[0] * 20, star[1] * 20, star[2] * 20]}>
                <sphereGeometry args={[2.5, 16, 16]} />
                <meshBasicMaterial color="#ffeb3b" />
                <pointLight intensity={8} distance={40} color="#ffeb3b" />
              </mesh>
            ))}

            {/* 별자리 이름 */}
            <Text
              position={[0, -40, 0]}
              fontSize={16}
              color="#ffeb3b"
              outlineWidth={1}
              outlineColor="#000000"
            >
              {constellation.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

const Environment: React.FC<{ time: number }> = ({ time }) => {
  const isDay = time >= 6 && time < 18;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
        <planeGeometry args={[5000, 5000]} />
        <meshStandardMaterial color={isDay ? "#080c08" : "#020202"} roughness={1} />
      </mesh>
      <gridHelper args={[2000, 100, 0x222222, 0x111111]} position={[0, -9.9, 0]} />
      <ambientLight intensity={isDay ? 0.4 : 0.15} />
    </group>
  );
};

const SkyContent: React.FC<{ state: CelestialState }> = ({ state }) => {
  const { camera, viewport } = useThree();
  const radius = 600; 
  const isMobile = viewport.width < 5;
  
  const sunAzimuth = (state.time - 12) * (Math.PI / 12);
  const sunX = Math.sin(sunAzimuth) * radius; 
  const sunZ = -Math.cos(sunAzimuth) * radius;
  const sunY = Math.cos(sunAzimuth) * 350; 
  const sunPos = useMemo(() => new THREE.Vector3(sunX, sunY, sunZ), [sunX, sunY, sunZ]);

  const moonOrbitAngle = state.moonOrbitProgress * Math.PI * 2;
  const moonAzimuth = sunAzimuth + moonOrbitAngle; 
  
  const moonX = Math.sin(moonAzimuth) * (radius - 50);
  const moonZ = -Math.cos(moonAzimuth) * (radius - 50);
  const moonY = Math.cos(moonAzimuth) * 280 + 50;
  const moonPos = useMemo(() => new THREE.Vector3(moonX, moonY, moonZ), [moonX, moonY, moonZ]);

  const isDay = state.time >= 6 && state.time < 18;

  const moonRef = useRef<THREE.Mesh>(null);
  const moonLightRef = useRef<THREE.DirectionalLight>(null);

  const moonPhaseText = useMemo(() => {
    const prog = ((state.moonOrbitProgress % 1) + 1) % 1;
    if (prog < 0.03 || prog > 0.97) return "삭 (New Moon)";
    if (prog >= 0.03 && prog < 0.22) return "초승달 (Waxing Crescent)";
    if (prog >= 0.22 && prog < 0.28) return "상현달 (First Quarter)";
    if (prog >= 0.28 && prog < 0.47) return "상현망 (Waxing Gibbous)";
    if (prog >= 0.47 && prog < 0.53) return "보름달 (Full Moon)";
    if (prog >= 0.53 && prog < 0.72) return "하현망 (Waning Gibbous)";
    if (prog >= 0.72 && prog < 0.78) return "하현달 (Last Quarter)";
    if (prog >= 0.78 && prog < 0.97) return "그믐달 (Waning Crescent)";
    return "";
  }, [state.moonOrbitProgress]);

  useFrame(() => {
    if (moonLightRef.current && moonRef.current) {
      const p = ((state.moonOrbitProgress % 1) + 1) % 1;
      const sunToMoonDir = new THREE.Vector3().subVectors(sunPos, moonPos).normalize();
      let finalLightPos = sunToMoonDir.clone().multiplyScalar(100);

      const distFromNew = Math.min(p, 1 - p);
      
      if (distFromNew < 0.25) {
        const worldMoonPos = moonRef.current.getWorldPosition(new THREE.Vector3());
        const camToMoon = new THREE.Vector3().subVectors(worldMoonPos, camera.position).normalize();
        const thinningPower = Math.pow(1 - (distFromNew / 0.25), 0.6);
        const pushScale = 1.15 * thinningPower;
        finalLightPos.add(camToMoon.clone().multiplyScalar(pushScale * 100));
      }

      moonLightRef.current.position.copy(finalLightPos);
      moonLightRef.current.target = moonRef.current;
      
      if (distFromNew < 0.005) {
        moonLightRef.current.intensity = 0; 
      } else if (distFromNew < 0.1) {
        moonLightRef.current.intensity = 80;
      } else {
        moonLightRef.current.intensity = 30;
      }
    }
  });

  return (
    <group>
      <Sky
        sunPosition={sunPos}
        turbidity={0.05}
        rayleigh={1.2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {!isDay && <Stars radius={1000} depth={60} count={12000} factor={6} saturation={0} fade />}
      {!isDay && <Constellations state={state} />}

      <group position={[0, -5, 0]}>
        <Text position={[0, 20, -400]} fontSize={isMobile ? 60 : 50} color="#ffd700" outlineWidth={1}>SOUTH (남)</Text>
        <Text position={[-400, 20, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={isMobile ? 50 : 40} color="white" fillOpacity={0.3}>EAST (동)</Text>
        <Text position={[400, 20, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={isMobile ? 50 : 40} color="white" fillOpacity={0.3}>WEST (서)</Text>
      </group>

      <group position={sunPos}>
        <mesh>
          <sphereGeometry args={[22, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {isDay && <pointLight intensity={20} distance={2000} color="#fffcf0" decay={1.5} />}
      </group>

      <group position={moonPos}>
        {(() => {
          const prog = ((state.moonOrbitProgress % 1) + 1) % 1;
          // 삭 (New Moon) - 달이 보이지 않음
          const isNewMoon = prog < 0.03 || prog > 0.97;

          // 초승달 (Waxing Crescent) - 18시~24시(0시)에만 보임
          const isWaxingCrescent = prog >= 0.03 && prog < 0.22;
          const hour = state.time;
          const isWaxingCrescentVisible = isWaxingCrescent && hour >= 18 && hour < 24;

          if (isNewMoon || (isWaxingCrescent && !isWaxingCrescentVisible)) {
            // 삭이거나 초승달 시간대가 아니면 숨김
            return (
              <>
                <mesh ref={moonRef} visible={false}>
                  <sphereGeometry args={[18, 512, 512]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
                <directionalLight ref={moonLightRef} intensity={0} />
              </>
            );
          }

          return (
            <>
              <mesh ref={moonRef} castShadow receiveShadow>
                <sphereGeometry args={[18, 512, 512]} />
                <meshStandardMaterial
                  color="#ffffff"
                  roughness={1.0}
                  metalness={0}
                  emissive="#111"
                  emissiveIntensity={0.1}
                />
              </mesh>

              {/* 달 모양 효과 */}
              {(() => {
                // 초승달 (Waxing Crescent) - 3~22% (오른쪽이 약간 밝음)
                if (prog >= 0.03 && prog < 0.22) {
                  return (
                    <mesh position={[-13, 0, 0]}>
                      <sphereGeometry args={[18, 32, 32, 0, Math.PI]} />
                      <meshBasicMaterial color="#000000" side={2} />
                    </mesh>
                  );
                }
                // 상현달 (First Quarter) - 22~28% (오른쪽이 밝은 달 - 왼쪽을 가림)
                if (prog >= 0.22 && prog < 0.28) {
                  return (
                    <mesh position={[-9, 0, 0]}>
                      <sphereGeometry args={[18, 32, 32, 0, Math.PI]} />
                      <meshBasicMaterial color="#000000" side={2} />
                    </mesh>
                  );
                }
                // 하현달 (Last Quarter) - 72~78% (왼쪽이 밝은 달 - 오른쪽을 가림)
                if (prog >= 0.72 && prog < 0.78) {
                  return (
                    <mesh position={[9, 0, 0]}>
                      <sphereGeometry args={[18, 32, 32, Math.PI, Math.PI]} />
                      <meshBasicMaterial color="#000000" side={2} />
                    </mesh>
                  );
                }
                // 그믐달 (Waning Crescent) - 78~97% (왼쪽이 약간 밝음)
                if (prog >= 0.78 && prog < 0.97) {
                  return (
                    <mesh position={[13, 0, 0]}>
                      <sphereGeometry args={[18, 32, 32, Math.PI, Math.PI]} />
                      <meshBasicMaterial color="#000000" side={2} />
                    </mesh>
                  );
                }
                return null;
              })()}

              <directionalLight
                ref={moonLightRef}
                intensity={20}
                color="#ffffff"
              />

              {moonPhaseText !== "" && (
                <Text
                  position={[0, 50, 0]}
                  fontSize={isMobile ? 22 : 16}
                  color="#ffffcc"
                  outlineWidth={0.5}
                  outlineColor="#000000"
                >
                  {moonPhaseText}
                </Text>
              )}
            </>
          );
        })()}
      </group>
    </group>
  );
};

const HomeView: React.FC<HomeViewProps> = ({ state }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        gl={{
          antialias: !isMobile,
          powerPreference: 'high-performance',
          toneMapping: 4,
          alpha: false,
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        performance={{ min: 0.5 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <PerspectiveCamera
          makeDefault
          fov={65}
          position={[0, 15, 25]}
        />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <SkyContent state={state} />
        <Environment time={state.time} />
        <Character3D />
      </Canvas>

      {/* Controls UI */}
      <div className="absolute bottom-4 right-4 text-white/80 text-xs md:text-sm font-mono pointer-events-none z-20 bg-black/60 px-3 py-2 rounded">
        <p className="font-bold text-yellow-300">WASD - Move Character</p>
        <p className="text-white/60">RPG Camera Follow</p>
      </div>
    </div>
  );
};

export default HomeView;
