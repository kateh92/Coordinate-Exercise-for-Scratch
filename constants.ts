import { DifficultyLevel, GameConfig } from './types';

export const UNLOCK_THRESHOLD = 20;

export const GAME_MODES: Record<DifficultyLevel, GameConfig> = {
  [DifficultyLevel.Intro]: {
    id: DifficultyLevel.Intro,
    name: "🟢 入门模式",
    description: "数格子 (第一象限)",
    xRange: [0, 10],
    yRange: [0, 10],
    gridStep: 1,
    labelStep: 1,
    targetStep: 1,
    tolerance: 0.4,
    themeColor: "emerald",
    originPos: 'bottom-left'
  },
  [DifficultyLevel.Advanced]: {
    id: DifficultyLevel.Advanced,
    name: "🔵 进阶模式",
    description: "认识负数 (四象限)",
    xRange: [-10, 10],
    yRange: [-10, 10],
    gridStep: 1,
    labelStep: 2,
    targetStep: 1,
    tolerance: 0.4,
    themeColor: "blue",
    originPos: 'center'
  },
  [DifficultyLevel.Challenge]: {
    id: DifficultyLevel.Challenge,
    name: "🟠 挑战模式",
    description: "大跨度练习 (以10计数)",
    xRange: [-50, 50],
    yRange: [-50, 50],
    gridStep: 5,
    majorGridStep: 10,
    labelStep: 10,
    targetStep: 5,
    tolerance: 3.5,
    themeColor: "orange",
    originPos: 'center'
  },
  [DifficultyLevel.Hell]: {
    id: DifficultyLevel.Hell,
    name: "🔴 地狱模式",
    description: "Scratch 标准舞台",
    xRange: [-240, 240],
    yRange: [-180, 180],
    gridStep: 20,
    majorGridStep: 100,
    labelStep: 100,
    targetStep: 10,
    tolerance: 15,
    themeColor: "rose",
    originPos: 'center'
  }
};