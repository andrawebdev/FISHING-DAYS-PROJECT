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
      className={`relative w-28 h-28 rounded-full border-4 transition-opacity ${
        disabled
          ? 'opacity-30 border-[#444444] pointer-events-none'
          : 'border-white bg-black/80 shadow-[4px_4px_0px_0px_#ffffff]'
      } flex items-center justify-center touch-none select-none`}
    >
      {/* Outer directional ticks */}
      <div className="absolute inset-2 rounded-full border border-dashed border-white/40" />

      {/* Center crosshair */}
      <div className="absolute w-2 h-0.5 bg-white/50" />
      <div className="absolute h-2 w-0.5 bg-white/50" />

      {/* High contrast Chunky Knob */}
      <div
        className="w-12 h-12 rounded-full bg-white text-black border-2 border-black flex items-center justify-center shadow-lg transition-transform"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-black" />
      </div>
    </div>
  );
};
