import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameConfig, Point } from '../types';

interface CoordinateCanvasProps {
  config: GameConfig;
  target: Point;
  lastResult: { success: boolean; clickPos: Point; timestamp: number } | null;
  onHover: (pos: Point) => void;
  onClick: (pos: Point) => void;
}

const CoordinateCanvas: React.FC<CoordinateCanvasProps> = ({
  config,
  target,
  lastResult,
  onHover,
  onClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 450 });

  // Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        // Maintain a 4:3 aspect ratio closer to Scratch, or square for smaller modes
        const aspectRatio = config.id === 'INTRO' ? 1 : 4 / 3;
        setDimensions({
          width: clientWidth,
          height: clientWidth / aspectRatio
        });
      }
    };

    window.addEventListener('resize', updateSize);
    updateSize(); // Initial call

    return () => window.removeEventListener('resize', updateSize);
  }, [config.id]);

  // Coordinate Mapping Helpers
  // Logical Coordinate -> Canvas Pixel
  const toPixel = useCallback((p: Point): Point => {
    const { xRange, yRange } = config;
    const { width, height } = dimensions;
    
    // Add small padding (margin) so labels don't get cut off
    const padding = 40; 
    const drawW = width - padding * 2;
    const drawH = height - padding * 2;

    const xSpan = xRange[1] - xRange[0];
    const ySpan = yRange[1] - yRange[0];

    const px = padding + ((p.x - xRange[0]) / xSpan) * drawW;
    // Canvas Y is inverted (0 is top)
    const py = height - padding - ((p.y - yRange[0]) / ySpan) * drawH;

    return { x: px, y: py };
  }, [config, dimensions]);

  // Canvas Pixel -> Logical Coordinate
  const toLogical = useCallback((p: Point): Point => {
    const { xRange, yRange } = config;
    const { width, height } = dimensions;
    const padding = 40;
    const drawW = width - padding * 2;
    const drawH = height - padding * 2;

    const xSpan = xRange[1] - xRange[0];
    const ySpan = yRange[1] - yRange[0];

    const lx = ((p.x - padding) / drawW) * xSpan + xRange[0];
    const ly = ((height - padding - p.y) / drawH) * ySpan + yRange[0];

    return { x: Math.round(lx), y: Math.round(ly) };
  }, [config, dimensions]);


  // Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);
    // Needed for CSS scaling
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    // --- RENDER START ---

    // 1. Clear Background
    ctx.fillStyle = '#f8fafc'; // slate-50
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 2. Draw Grid
    const { xRange, yRange, gridStep, majorGridStep, labelStep } = config;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '12px "Noto Sans SC"';

    // Draw Vertical Lines (X)
    for (let x = xRange[0]; x <= xRange[1]; x += gridStep) {
      // Fix float precision issues (e.g. 0.3000000004)
      const cleanX = Math.round(x * 100) / 100;
      if (cleanX < xRange[0] || cleanX > xRange[1]) continue;

      const p1 = toPixel({ x: cleanX, y: yRange[0] });
      const p2 = toPixel({ x: cleanX, y: yRange[1] });

      ctx.beginPath();
      const isAxis = cleanX === 0;
      const isMajor = majorGridStep ? cleanX % majorGridStep === 0 : false;

      if (isAxis) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#334155'; // Dark Slate
      } else if (isMajor) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#94a3b8'; // Slate 400
      } else {
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#cbd5e1'; // Slate 300
      }
      
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Labels (skip 0 to avoid collision with origin)
      if (cleanX % labelStep === 0 && cleanX !== 0) {
        const textPos = toPixel({ x: cleanX, y: 0 });
        // If Y range doesn't include 0 (not possible in current modes but good for robustness), clamp logic needed.
        // For current modes, axis is always visible or at edge.
        // Move text slightly away from axis
        let textY = textPos.y + 15;
        
        // Special case for Intro mode where Y=0 is at bottom
        if (config.originPos === 'bottom-left') {
            textY = dimensions.height - 20;
        }

        ctx.fillStyle = '#64748b';
        ctx.fillText(cleanX.toString(), textPos.x, textY);
      }
    }

    // Draw Horizontal Lines (Y)
    for (let y = yRange[0]; y <= yRange[1]; y += gridStep) {
      const cleanY = Math.round(y * 100) / 100;
      if (cleanY < yRange[0] || cleanY > yRange[1]) continue;

      const p1 = toPixel({ x: xRange[0], y: cleanY });
      const p2 = toPixel({ x: xRange[1], y: cleanY });

      ctx.beginPath();
      const isAxis = cleanY === 0;
      const isMajor = majorGridStep ? cleanY % majorGridStep === 0 : false;

      if (isAxis) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#334155';
      } else if (isMajor) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#94a3b8';
      } else {
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#cbd5e1';
      }

      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

       // Labels (skip 0)
       if (cleanY % labelStep === 0 && cleanY !== 0) {
        const textPos = toPixel({ x: 0, y: cleanY });
        let textX = textPos.x - 20;

        if (config.originPos === 'bottom-left') {
            textX = 20;
        }

        ctx.fillStyle = '#64748b';
        ctx.fillText(cleanY.toString(), textX, textPos.y);
      }
    }

    // Origin Label (0,0)
    const originPx = toPixel({x:0, y:0});
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px sans-serif';
    if (config.originPos === 'bottom-left') {
        ctx.fillText("0", 15, dimensions.height - 15);
    } else {
        ctx.fillText("0", originPx.x - 10, originPx.y + 15);
    }

    // 3. Draw Axis Arrows
    // X Arrow
    const xEnd = toPixel({ x: xRange[1], y: 0 });
    ctx.beginPath();
    ctx.moveTo(xEnd.x, xEnd.y);
    ctx.lineTo(xEnd.x - 8, xEnd.y - 4);
    ctx.lineTo(xEnd.x - 8, xEnd.y + 4);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.fillText("X", xEnd.x - 15, xEnd.y - 15);

    // Y Arrow
    const yEnd = toPixel({ x: 0, y: yRange[1] });
    ctx.beginPath();
    ctx.moveTo(yEnd.x, yEnd.y);
    ctx.lineTo(yEnd.x - 4, yEnd.y + 8);
    ctx.lineTo(yEnd.x + 4, yEnd.y + 8);
    ctx.fill();
    ctx.fillText("Y", yEnd.x + 15, yEnd.y + 15);


    // 4. Draw Last Result Marker
    if (lastResult) {
      const p = toPixel(lastResult.clickPos);
      
      if (lastResult.success) {
        ctx.font = '40px serif';
        ctx.fillText("⭐", p.x, p.y);
      } else {
        // Draw X
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const size = 8;
        ctx.moveTo(p.x - size, p.y - size);
        ctx.lineTo(p.x + size, p.y + size);
        ctx.moveTo(p.x + size, p.y - size);
        ctx.lineTo(p.x - size, p.y + size);
        ctx.stroke();
      }
    }

  }, [config, dimensions, lastResult, toPixel]);

  // Event Handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to Logical
    const logical = toLogical({ x, y });
    onHover(logical);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const logical = toLogical({ x, y });
    // IMPORTANT: For checking correctness, we pass the EXACT logical point (even decimals)
    // The visualizer might round it for display, but calculations are precise
    onClick(logical);
  };

  return (
    <div ref={containerRef} className="w-full relative shadow-inner rounded-xl overflow-hidden border-2 border-slate-200 bg-white cursor-crosshair touch-none">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="block"
      />
    </div>
  );
};

export default CoordinateCanvas;