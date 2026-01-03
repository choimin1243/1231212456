
import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, CelestialState } from './types.ts';
import HomeView from './components/HomeView.tsx';
import UniverseView from './components/UniverseView.tsx';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.HOME);
  const [celestialState, setCelestialState] = useState<CelestialState>({
    time: 18.0,
    date: new Date(2025, 0, 1), // January 1, 2025
    earthOrbitProgress: 0, // 1월 1일 = 0%
    moonOrbitProgress: 0, // 1월 1일 = 0%
  });
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-advance time and orbits
  useEffect(() => {
    const timer = setInterval(() => {
      setCelestialState(prev => {
        const timeIncrement = 0.02; // Hours per 50ms (4x faster)

        // Calculate new time
        const newTime = prev.time + timeIncrement;

        // Check if we crossed midnight (24 hours)
        const newDate = new Date(prev.date);
        if (newTime >= 24) {
          newDate.setDate(newDate.getDate() + 1);
        }

        // Earth: 365 days to complete one orbit (1 year)
        const earthIncrement = timeIncrement / (24 * 365);

        // Moon: 28 days to complete one orbit (lunar month)
        const moonIncrement = timeIncrement / (24 * 28);

        return {
          ...prev,
          time: newTime % 24,
          date: newDate,
          earthOrbitProgress: (prev.earthOrbitProgress + earthIncrement) % 1,
          moonOrbitProgress: (prev.moonOrbitProgress + moonIncrement) % 1,
        };
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const toggleView = () => {
    setViewMode(prev => prev === ViewMode.HOME ? ViewMode.UNIVERSE : ViewMode.HOME);
  };

  const formatTime = (time: number) => {
    const h = Math.floor(time);
    const m = Math.floor((time % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatTimeForInput = (time: number) => {
    const h = Math.floor(time);
    const m = Math.floor((time % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9:]/g, ''); // 숫자와 : 만 허용
    const [hours, minutes] = value.split(':').map(Number);
    if (!isNaN(hours) && hours >= 0 && hours < 24 && !isNaN(minutes) && minutes >= 0 && minutes < 60) {
      const newTime = hours + (minutes / 60);
      setCelestialState(prev => ({ ...prev, time: newTime }));
    }
  };

  const handleTimeBlur = () => {
    setIsEditingTime(false);
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTime(false);
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      // Calculate days from reference date (2025-01-01)
      const referenceDate = new Date(2025, 0, 1);
      const daysDiff = Math.floor((newDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

      // Earth: 365 days to complete one orbit
      const newEarthProgress = (daysDiff / 365) % 1;

      // Moon: 28 days to complete one orbit
      const newMoonProgress = (daysDiff / 28) % 1;

      setCelestialState(prev => ({
        ...prev,
        date: newDate,
        earthOrbitProgress: newEarthProgress < 0 ? newEarthProgress + 1 : newEarthProgress,
        moonOrbitProgress: newMoonProgress < 0 ? newMoonProgress + 1 : newMoonProgress,
      }));
      setIsEditingDate(false);
    }
  };

  const moonPhaseName = useMemo(() => {
    const p = ((celestialState.moonOrbitProgress % 1) + 1) % 1;
    if (p < 0.03 || p > 0.97) return "삭 (New Moon)";
    if (p >= 0.03 && p < 0.22) return "그믐달 (Waning Crescent)";
    if (p >= 0.22 && p < 0.28) return "하현달 (Last Quarter)";
    if (p >= 0.28 && p < 0.47) return "하현망 (Waning Gibbous)";
    if (p >= 0.47 && p < 0.53) return "보름달 (Full Moon)";
    if (p >= 0.53 && p < 0.72) return "상현망 (Waxing Gibbous)";
    if (p >= 0.72 && p < 0.78) return "상현달 (First Quarter)";
    if (p >= 0.78 && p < 0.97) return "초승달 (Waxing Crescent)";
    return "달의 위상이 변화 중입니다";
  }, [celestialState.moonOrbitProgress]);

  // Fixed star positions for mini-map
  const miniMapStars = useMemo(() =>
    [...Array(50)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: Math.random() * 0.7 + 0.3,
    })),
  []);

  // Calculate positions matching UniverseView (3D coordinates converted to 2D rotation)
  const miniMapPositions = useMemo(() => {
    // Earth position - using UniverseView's exact calculation (반시계 방향)
    const earthX = Math.cos(celestialState.earthOrbitProgress * Math.PI * 2);
    const earthZ = -Math.sin(celestialState.earthOrbitProgress * Math.PI * 2); // 반시계 방향

    // Convert 3D position to 2D rotation angle
    // In 3D view from top: +X is right, +Z is down
    // In 2D CSS: 0deg is right, 90deg is down
    const earthAngle = Math.atan2(earthZ, earthX) * 180 / Math.PI;

    // Moon position - using UniverseView's exact calculation (반시계 방향)
    const angleToSun = Math.atan2(-earthZ, -earthX);
    const moonAngle3D = angleToSun + (celestialState.moonOrbitProgress * Math.PI * 2);
    // UniverseView uses Z = -sin(moonAngle), so 2D angle = -moonAngle3D
    const moonAngleDeg = -moonAngle3D * 180 / Math.PI;

    return { earthAngle, moonAngleDeg };
  }, [celestialState.earthOrbitProgress, celestialState.moonOrbitProgress]);

  return (
    <div className="relative w-full h-full text-white font-sans overflow-hidden bg-black select-none" style={{ touchAction: 'none' }}>
      {/* Main View */}
      <div className="absolute inset-0 z-0">
        {viewMode === ViewMode.HOME ? (
          <HomeView key="home-view" state={celestialState} />
        ) : (
          <UniverseView
            key="universe-view"
            state={celestialState}
            onChange={(newState) => setCelestialState(prev => ({...prev, ...newState}))}
          />
        )}
      </div>

      {/* Universe Mini-Map when in HOME mode - 2D CSS Version */}
      {viewMode === ViewMode.HOME && (
        <div
          className="absolute top-6 right-6 w-64 h-48 md:w-96 md:h-72 z-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gradient-to-br from-black via-blue-950/20 to-black group cursor-pointer transition-transform hover:scale-105 active:scale-95"
          onClick={toggleView}
        >
          {/* Star Background */}
          <div className="absolute inset-0 opacity-40">
            {miniMapStars.map((star, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                style={{
                  left: `${star.left}%`,
                  top: `${star.top}%`,
                  opacity: star.opacity,
                }}
              />
            ))}
          </div>

          {/* 2D Solar System */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Sun at Center */}
            <div className="absolute w-8 h-8 md:w-12 md:h-12 bg-yellow-400 rounded-full shadow-[0_0_30px_rgba(255,204,51,0.8)]" />

            {/* Earth Orbit Path */}
            <div className="absolute w-32 h-32 md:w-48 md:h-48 border border-blue-500/30 rounded-full" />

            {/* Earth */}
            <div
              className="absolute"
              style={{
                transform: `rotate(${miniMapPositions.earthAngle}deg) translateX(${isMobile ? '64px' : '96px'})`,
              }}
            >
              {/* Earth sphere */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 md:w-6 md:h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />

              {/* Moon orbiting Earth */}
              <div
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${miniMapPositions.moonAngleDeg - miniMapPositions.earthAngle}deg) translateX(${isMobile ? '38px' : '50px'})`,
                }}
              >
                <div
                  className="w-2 h-2 md:w-3 md:h-3 bg-gray-300 rounded-full shadow-[0_0_5px_rgba(209,213,219,0.6)]"
                  style={{
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Overlay Elements */}
          <div className="absolute inset-0 pointer-events-none z-10 border border-white/10 rounded-2xl"></div>
          <div className="absolute top-2 left-2 z-20 bg-black/60 px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
            Universe Live
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="absolute top-6 left-6 z-30">
        <h1 className="text-sm md:text-lg font-black tracking-tighter bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent uppercase pointer-events-none">
          Celestial Explorer
        </h1>
        {isEditingDate ? (
          <input
            type="date"
            value={formatDateForInput(celestialState.date)}
            onChange={handleDateChange}
            onBlur={() => setIsEditingDate(false)}
            autoFocus
            className="text-base md:text-2xl font-mono font-bold bg-black/60 text-blue-200 border border-blue-400 rounded px-2 py-1 pointer-events-auto"
          />
        ) : (
          <p
            onClick={() => setIsEditingDate(true)}
            className="text-base md:text-2xl font-mono font-bold drop-shadow-lg text-blue-200/90 cursor-pointer hover:text-blue-300 transition-colors pointer-events-auto"
          >
            {formatDate(celestialState.date)}
          </p>
        )}
        {isEditingTime ? (
          <input
            type="text"
            value={formatTimeForInput(celestialState.time)}
            onChange={handleTimeChange}
            onBlur={handleTimeBlur}
            onKeyDown={handleTimeKeyDown}
            autoFocus
            placeholder="HH:MM"
            maxLength={5}
            className="text-xl md:text-4xl font-mono font-bold bg-black/60 text-white border border-blue-400 rounded px-2 py-1 pointer-events-auto w-48"
          />
        ) : (
          <p
            onClick={() => setIsEditingTime(true)}
            className="text-xl md:text-4xl font-mono font-bold drop-shadow-lg cursor-pointer hover:text-blue-300 transition-colors pointer-events-auto"
          >
            {formatTime(celestialState.time)}
          </p>
        )}
        <p className="text-[10px] md:text-xs font-bold text-yellow-200/80 mt-1 drop-shadow-md pointer-events-none">{moonPhaseName}</p>
        <div className="text-[8px] md:text-[10px] font-mono text-white/40 mt-2 pointer-events-none">
          <p>지구 공전: {(celestialState.earthOrbitProgress * 100).toFixed(1)}%</p>
          <p>달 공전: {(celestialState.moonOrbitProgress * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-center items-center z-30 pointer-events-none">
        <button
          onClick={toggleView}
          className="bg-white text-black px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)] pointer-events-auto"
        >
          {viewMode === ViewMode.HOME ? '🚀 Open Universe' : '🏠 Return Home'}
        </button>
      </div>

      {viewMode === ViewMode.HOME && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-[10px] font-black opacity-30 pointer-events-none uppercase tracking-[0.2em]">
          Drag to look around
        </div>
      )}
    </div>
  );
};

export default App;
