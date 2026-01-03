
export enum ViewMode {
  HOME = 'HOME',
  UNIVERSE = 'UNIVERSE'
}

export interface CelestialState {
  time: number; // 0.0 to 23.9
  date: Date; // Current date
  earthOrbitProgress: number; // 0.0 to 1.0
  moonOrbitProgress: number; // 0.0 to 1.0 (relative to Earth-Sun line)
}
