import React, { useState, useEffect, useCallback } from 'react';
import { DifficultyLevel, Point } from './types';
import { GAME_MODES, UNLOCK_THRESHOLD } from './constants';
import CoordinateCanvas from './components/CoordinateCanvas';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  // Persistent Progress State
  const [progress, setProgress] = useState<Record<DifficultyLevel, number>>(() => {
    const saved = localStorage.getItem('coordinate_game_progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse progress", e);
      }
    }
    return {
      [DifficultyLevel.Intro]: 0,
      [DifficultyLevel.Advanced]: 0,
      [DifficultyLevel.Challenge]: 0,
      [DifficultyLevel.Hell]: 0
    };
  });

  const [mode, setMode] = useState<DifficultyLevel>(DifficultyLevel.Intro);
  const [target, setTarget] = useState<Point>({ x: 3, y: 5 });
  const [hoverPos, setHoverPos] = useState<Point>({ x: 0, y: 0 });
  const [score, setScore] = useState(0); // Session score
  const [feedback, setFeedback] = useState<string>("请点击画面寻找坐标！");
  const [lastResult, setLastResult] = useState<{ success: boolean; clickPos: Point; timestamp: number } | null>(null);

  const config = GAME_MODES[mode];

  // Persist progress changes
  useEffect(() => {
    localStorage.setItem('coordinate_game_progress', JSON.stringify(progress));
  }, [progress]);

  // Lock Logic
  const getLockStatus = (m: DifficultyLevel): { isLocked: boolean; reqText: string } => {
    if (m === DifficultyLevel.Intro) return { isLocked: false, reqText: '' };
    
    if (m === DifficultyLevel.Advanced) {
      const current = progress[DifficultyLevel.Intro];
      return { 
        isLocked: current < UNLOCK_THRESHOLD, 
        reqText: `需入门模式完成 ${current}/${UNLOCK_THRESHOLD} 次` 
      };
    }
    
    if (m === DifficultyLevel.Challenge) {
      const current = progress[DifficultyLevel.Advanced];
      return { 
        isLocked: current < UNLOCK_THRESHOLD, 
        reqText: `需进阶模式完成 ${current}/${UNLOCK_THRESHOLD} 次` 
      };
    }
    
    if (m === DifficultyLevel.Hell) {
      const current = progress[DifficultyLevel.Challenge];
      return { 
        isLocked: current < UNLOCK_THRESHOLD, 
        reqText: `需挑战模式完成 ${current}/${UNLOCK_THRESHOLD} 次` 
      };
    }

    return { isLocked: true, reqText: 'Locked' };
  };

  // Helper to generate random integer within range and step
  const getRandomCoord = useCallback((min: number, max: number, step: number) => {
    const steps = Math.floor((max - min) / step);
    const randomStep = Math.floor(Math.random() * (steps + 1));
    return min + randomStep * step;
  }, []);

  const generateNewTarget = useCallback(() => {
    const newX = getRandomCoord(config.xRange[0], config.xRange[1], config.targetStep);
    const newY = getRandomCoord(config.yRange[0], config.yRange[1], config.targetStep);
    
    // Avoid (0,0) if possible in advanced modes just to be interesting, but it's allowed
    setTarget({ x: newX, y: newY });
  }, [config, getRandomCoord]);

  // Reset when mode changes
  useEffect(() => {
    generateNewTarget();
    setScore(0);
    setLastResult(null);
    setFeedback("新游戏开始！请找到目标位置。");
  }, [mode, generateNewTarget]);

  const handleCanvasClick = (clickPos: Point) => {
    // Calculate Euclidean distance in LOGICAL units
    const dx = clickPos.x - target.x;
    const dy = clickPos.y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const isSuccess = distance <= config.tolerance;

    if (isSuccess) {
      // Success Logic
      setScore(s => s + 1);
      
      // Update persistent progress
      setProgress(prev => ({
        ...prev,
        [mode]: (prev[mode] || 0) + 1
      }));

      setFeedback("太棒了！找到啦！🎉");
      setLastResult({ success: true, clickPos: target, timestamp: Date.now() }); // Snap visual to target on success
      
      // Confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Delay next target slightly
      setTimeout(() => {
        generateNewTarget();
        setLastResult(null);
        setFeedback("请寻找下一个坐标！");
      }, 1500);

    } else {
      // Failure Logic
      setFeedback(`哎呀偏了！你点到了 (${Math.round(clickPos.x)}, ${Math.round(clickPos.y)}) 😅`);
      setLastResult({ success: false, clickPos: clickPos, timestamp: Date.now() });
    }
  };

  const renderModeButton = (m: DifficultyLevel) => {
    const { isLocked, reqText } = getLockStatus(m);
    const isActive = mode === m;
    const modeConfig = GAME_MODES[m];

    // Base classes
    let classes = "flex flex-col items-center justify-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 border-2 min-w-[120px] ";
    
    if (isLocked) {
      classes += "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75 grayscale";
    } else if (isActive) {
      classes += `transform scale-105 shadow-md -translate-y-1 bg-${modeConfig.themeColor}-100 border-${modeConfig.themeColor}-500 text-${modeConfig.themeColor}-700`;
    } else {
      classes += "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300";
    }

    return (
      <button
        key={m}
        onClick={() => !isLocked && setMode(m)}
        disabled={isLocked}
        className={classes}
        title={isLocked ? reqText : modeConfig.description}
      >
        <div className="flex items-center gap-2">
          {isLocked && <span>🔒</span>}
          <span>{modeConfig.name}</span>
        </div>
        {isLocked && (
          <span className="text-[10px] font-normal mt-1 text-slate-400">{reqText}</span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 px-4">
      
      {/* Header & Mode Switcher */}
      <header className="w-full max-w-4xl mb-6">
        <h1 className="text-3xl md:text-4xl text-center text-slate-800 mb-6 fun-font tracking-wide">
          🗺️ 坐标寻宝大冒险
        </h1>
        
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
          {(Object.keys(GAME_MODES) as DifficultyLevel[]).map(renderModeButton)}
        </div>
        
        <div className="mt-2 text-center text-slate-500 text-sm">
          {config.description}
        </div>
      </header>

      {/* Main Game Area */}
      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Info Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4 order-2 lg:order-1">
          
          {/* Target Card */}
          <div className={`bg-white rounded-2xl shadow-lg border-b-4 border-${config.themeColor}-500 p-6 flex flex-col items-center justify-center min-h-[160px]`}>
            <span className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">当前目标</span>
            <div className={`text-5xl font-black text-${config.themeColor}-600 fun-font`}>
              ({target.x}, {target.y})
            </div>
          </div>

          {/* Mouse Observer */}
          <div className="bg-slate-800 text-slate-100 rounded-xl p-4 shadow-md">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-mono text-slate-400">MOUSE_POS</span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            </div>
            <div className="text-2xl font-mono tracking-wider">
              x: {Math.round(hoverPos.x)}
              <span className="mx-2 text-slate-600">|</span>
              y: {Math.round(hoverPos.y)}
            </div>
          </div>

          {/* Score & Feedback */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex-grow flex flex-col justify-center text-center">
            <div className="text-sm text-slate-400 font-bold mb-1">本局得分 SCORE</div>
            <div className="text-3xl font-black text-slate-700 mb-2">{score}</div>
            
            {/* Progress Bar for Current Level */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
               <div 
                 className={`h-2.5 rounded-full bg-${config.themeColor}-500 transition-all duration-500`} 
                 style={{ width: `${Math.min((progress[mode] / UNLOCK_THRESHOLD) * 100, 100)}%` }}
               ></div>
            </div>
            <div className="text-xs text-slate-400 mb-4">
              当前模式累计完成: {progress[mode]} / {UNLOCK_THRESHOLD} (解锁下一级)
            </div>

            <div className={`text-lg font-bold ${lastResult?.success ? 'text-green-600' : lastResult ? 'text-rose-500' : 'text-slate-600'}`}>
              {feedback}
            </div>
          </div>

        </div>

        {/* Right: Canvas */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <CoordinateCanvas
            config={config}
            target={target}
            lastResult={lastResult}
            onHover={setHoverPos}
            onClick={handleCanvasClick}
          />
          <div className="mt-2 text-center text-xs text-slate-400">
            {mode === DifficultyLevel.Hell ? "Scratch 舞台大小: 480x360" : "点击网格交叉点寻找宝藏"}
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;