import React, { useRef, useState, useCallback } from 'react';

interface MobileJoystickProps {
  onMove: (dx: number, dy: number) => void;
  disabled?: boolean;
}

export const MobileJoystick: React.FC<MobileJoystickProps> = ({ onMove, disabled }) => {
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      setActive(true);
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!active || touchIdRef.current === null || !baseRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          const rect = baseRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const rawDx = touch.clientX - centerX;
          const rawDy = touch.clientY - centerY;
          const maxRadius = 45;
          const dist = Math.hypot(rawDx, rawDy);
          const angle = Math.atan2(rawDy, rawDx);
          const clampedDist = Math.min(dist, maxRadius);

          const px = Math.cos(angle) * clampedDist;
          const py = Math.sin(angle) * clampedDist;
          setKnobPos({ x: px, y: py });

          // Normalized output -1 to 1 (invert Y for 3D forward)
          const normX = px / maxRadius;
          const normY = -py / maxRadius;
          onMove(normX, normY);
          break;
        }
      }
    },
    [active, onMove]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setActive(false);
          setKnobPos({ x: 0, y: 0 });
          onMove(0, 0);
          break;
        }
      }
    },
    [onMove]
  );

  return (
    <div
      ref={baseRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative w-28 h-28 rounded-full border-2 transition-opacity ${
        disabled
          ? 'opacity-30 border-slate-700 pointer-events-none'
          : 'border-cyan-400/40 bg-slate-950/60 backdrop-blur-md shadow-2xl'
      } flex items-center justify-center touch-none select-none`}
    >
      {/* Outer directional ticks */}
      <div className="absolute inset-2 rounded-full border border-dashed border-cyan-500/20" />
      {/* Knob */}
      <div
        className="w-12 h-12 rounded-full bg-gradient-to-b from-cyan-400 to-teal-600 shadow-lg border border-cyan-200 flex items-center justify-center transition-transform"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-white/40" />
      </div>
    </div>
  );
};
