export interface Point {
  x: number;
  y: number;
}

export enum DifficultyLevel {
  Intro = 'INTRO',
  Advanced = 'ADVANCED',
  Challenge = 'CHALLENGE',
  Hell = 'HELL'
}

export interface GameConfig {
  id: DifficultyLevel;
  name: string;
  description: string;
  xRange: [number, number];
  yRange: [number, number];
  gridStep: number; // For rendering grid lines
  majorGridStep?: number; // For thicker lines (e.g., every 10 or 100)
  labelStep: number; // For rendering text numbers
  targetStep: number; // Targets will be multiples of this (e.g., 1, 5, 10)
  tolerance: number; // How "forgiving" the click detection is in logical units
  themeColor: string;
  originPos: 'center' | 'bottom-left';
}