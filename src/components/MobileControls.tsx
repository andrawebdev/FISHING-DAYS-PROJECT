import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FishingState } from '../types';
import { RotateCw, X } from 'lucide-react';

interface MobileControlsProps {
  fishingState: FishingState;
  canFish: boolean;
  isPaused: boolean;
  disabled: boolean;
  onMove: (dx: number, dy: number) => void;
  onCameraRotate: (deltaYaw: number, deltaPitch: number) => void;
  onStartCastCharge: () => void;
  onReleaseCastCharge: () => void;
  onHookFish: () => void;
  onStartReel: () => void;
  onStopReel: () => void;
  onResetToIdle: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  fishingState,
  canFish,
  isPaused,
  disabled,
  onMove,
  onCameraRotate,
  onStartCastCharge,
  onReleaseCastCharge,
  onHookFish,
  onStartReel,
  onStopReel,
  onResetToIdle,
}) => {
  // 1. Orientation & Mobile Device Detection
  const [isLandscape, setIsLandscape] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      setIsTouchDevice(hasTouch);
    };

    const checkOrientation = () => {
      const landscape = window.innerWidth >= window.innerHeight;
      setIsLandscape(landscape);
    };

    checkTouch();
    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // 2. Dedicated Joystick State & Pointer Ownership
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickPointerIdRef = useRef<number | null>(null);

  const handleJoystickPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || isPaused) return;
      e.stopPropagation();
      e.preventDefault();
      joystickPointerIdRef.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
      setIsJoystickActive(true);

      if (!joystickBaseRef.current) return;
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rawDx = e.clientX - centerX;
      const rawDy = e.clientY - centerY;
      const maxRadius = 45;
      const dist = Math.hypot(rawDx, rawDy);
      const angle = Math.atan2(rawDy, rawDx);
      const clampedDist = Math.min(dist, maxRadius);
      const px = Math.cos(angle) * clampedDist;
      const py = Math.sin(angle) * clampedDist;
      setKnobPos({ x: px, y: py });
      onMove(px / maxRadius, -py / maxRadius);
    },
    [disabled, isPaused, onMove]
  );

  const handleJoystickPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (joystickPointerIdRef.current !== e.pointerId || !joystickBaseRef.current) return;
      e.stopPropagation();
      e.preventDefault();

      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rawDx = e.clientX - centerX;
      const rawDy = e.clientY - centerY;
      const maxRadius = 45;
      const dist = Math.hypot(rawDx, rawDy);
      const angle = Math.atan2(rawDy, rawDx);
      const clampedDist = Math.min(dist, maxRadius);

      const px = Math.cos(angle) * clampedDist;
      const py = Math.sin(angle) * clampedDist;
      setKnobPos({ x: px, y: py });
      onMove(px / maxRadius, -py / maxRadius);
    },
    [onMove]
  );

  const handleJoystickPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (joystickPointerIdRef.current === e.pointerId) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // Safe fallback
        }
        joystickPointerIdRef.current = null;
        setIsJoystickActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
      }
    },
    [onMove]
  );

  // 3. Dedicated Camera Touch Zone (Right Half of Screen)
  const cameraPointerIdRef = useRef<number | null>(null);
  const cameraLastPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleCameraPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignore if pointer belongs to joystick or action buttons
      if (joystickPointerIdRef.current === e.pointerId) return;
      cameraPointerIdRef.current = e.pointerId;
      cameraLastPosRef.current = { x: e.clientX, y: e.clientY };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    },
    []
  );

  const handleCameraPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (cameraPointerIdRef.current !== e.pointerId || !cameraLastPosRef.current) return;
      const dx = e.clientX - cameraLastPosRef.current.x;
      const dy = e.clientY - cameraLastPosRef.current.y;
      cameraLastPosRef.current = { x: e.clientX, y: e.clientY };

      // Rotate camera smoothly: yaw (X) and pitch (Y)
      const yawSpeed = 0.007;
      const pitchSpeed = 0.006;
      onCameraRotate(dx * yawSpeed, dy * pitchSpeed);
    },
    [onCameraRotate]
  );

  const handleCameraPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (cameraPointerIdRef.current === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
      cameraPointerIdRef.current = null;
      cameraLastPosRef.current = null;
    }
  }, []);

  // Show only if touch device or forced in small landscape view
  if (!isTouchDevice) {
    return null;
  }

  return (
    <>
      {/* --- A. ROTATION ADVISORY OVERLAY (PORTRAIT DETECTED) --- */}
      {!isLandscape && (
        <div
          id="portrait-rotation-warning"
          className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col items-center justify-center p-8 text-center select-none font-mono"
        >
          <div className="border-4 border-white p-6 max-w-sm bg-black shadow-[6px_6px_0px_0px_#ffffff] flex flex-col items-center gap-4">
            <RotateCw className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '4s' }} />
            <h2 className="text-xl font-black uppercase tracking-wider">ROTATE YOUR DEVICE</h2>
            <p className="text-xs text-[#888888] leading-relaxed">
              FISHING DAYS IS DESIGNED FOR LANDSCAPE ORIENTATION. ROTATE YOUR PHONE TO ACCESS JOYSTICK AND CONTROLS.
            </p>
          </div>
        </div>
      )}

      {/* --- B. CAMERA TOUCH ZONE (RIGHT HALF OF SCREEN) --- */}
      <div
        id="camera-touch-zone"
        onPointerDown={handleCameraPointerDown}
        onPointerMove={handleCameraPointerMove}
        onPointerUp={handleCameraPointerUp}
        onPointerCancel={handleCameraPointerUp}
        className="fixed top-14 bottom-0 right-0 w-[55%] z-10 touch-none select-none"
        style={{ pointerEvents: disabled ? 'none' : 'auto' }}
      />

      {/* --- C. MOBILE JOYSTICK (BOTTOM LEFT) --- */}
      <div
        id="mobile-joystick-container"
        className="fixed bottom-6 left-6 z-20 pointer-events-auto select-none touch-none"
      >
        <div
          ref={joystickBaseRef}
          onPointerDown={handleJoystickPointerDown}
          onPointerMove={handleJoystickPointerMove}
          onPointerUp={handleJoystickPointerUp}
          onPointerCancel={handleJoystickPointerUp}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 transition-all ${
            disabled
              ? 'opacity-30 border-[#444444] bg-black pointer-events-none'
              : isJoystickActive
              ? 'border-white bg-black shadow-[6px_6px_0px_0px_#ffffff]'
              : 'border-white/80 bg-black/90 shadow-[4px_4px_0px_0px_#ffffff]'
          } flex items-center justify-center cursor-pointer`}
        >
          {/* Outer dashed ring */}
          <div className="absolute inset-2 rounded-full border border-dashed border-white/40 pointer-events-none" />

          {/* Crosshair guidelines */}
          <div className="absolute w-3 h-0.5 bg-white/40 pointer-events-none" />
          <div className="absolute h-3 w-0.5 bg-white/40 pointer-events-none" />

          {/* High Contrast Knob (52px) */}
          <div
            className="w-13 h-13 rounded-full bg-white text-black border-2 border-black flex items-center justify-center shadow-lg transition-transform pointer-events-none"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-4 h-4 rounded-full bg-black" />
          </div>
        </div>
      </div>

      {/* --- D. LANDSCAPE MOBILE ACTION BUTTON (BOTTOM RIGHT) --- */}
      <div
        id="mobile-action-button-container"
        className="fixed bottom-6 right-6 z-20 pointer-events-auto flex items-center gap-2 select-none touch-none"
      >
        {fishingState === 'IDLE' && (
          <button
            id="mobile-btn-cast"
            disabled={!canFish || disabled || isPaused}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartCastCharge();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onReleaseCastCharge();
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              onReleaseCastCharge();
            }}
            className={`px-5 py-4 font-mono font-black text-sm uppercase tracking-widest border-4 transition-all shadow-[4px_4px_0px_0px_#ffffff] cursor-pointer ${
              canFish
                ? 'bg-white text-black border-white active:bg-black active:text-white'
                : 'bg-black text-[#555555] border-[#555555] cursor-not-allowed opacity-60'
            }`}
          >
            {canFish ? 'HOLD TO CAST' : 'OFF DOCK'}
          </button>
        )}

        {fishingState === 'CASTING' && (
          <button
            id="mobile-btn-casting"
            onPointerUp={(e) => {
              e.stopPropagation();
              onReleaseCastCharge();
            }}
            className="px-5 py-4 font-mono font-black text-sm uppercase tracking-widest border-4 border-white bg-black text-white shadow-[4px_4px_0px_0px_#ffffff] animate-pulse"
          >
            RELEASE TO CAST
          </button>
        )}

        {fishingState === 'WAITING' && (
          <div className="flex items-center gap-2">
            <div className="px-4 py-3 font-mono font-black text-xs uppercase tracking-widest border-2 border-white bg-black text-white shadow-[3px_3px_0px_0px_#ffffff]">
              WAITING FOR BITE...
            </div>
            <button
              id="mobile-btn-cancel"
              onClick={(e) => {
                e.stopPropagation();
                onResetToIdle();
              }}
              className="p-3 bg-black text-white border-2 border-white hover:bg-white hover:text-black cursor-pointer shadow-[3px_3px_0px_0px_#ffffff]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {fishingState === 'BITE' && (
          <button
            id="mobile-btn-hook"
            onClick={(e) => {
              e.stopPropagation();
              onHookFish();
            }}
            className="px-6 py-4 font-mono font-black text-base uppercase tracking-widest border-4 border-white bg-white text-black animate-bounce shadow-[6px_6px_0px_0px_#ffffff] cursor-pointer"
          >
            FISH ON! HOOK!
          </button>
        )}

        {(fishingState === 'HOOKED' || fishingState === 'REELING') && (
          <div className="flex items-center gap-2">
            <button
              id="mobile-btn-reel"
              onPointerDown={(e) => {
                e.stopPropagation();
                onStartReel();
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onStopReel();
              }}
              onPointerCancel={(e) => {
                e.stopPropagation();
                onStopReel();
              }}
              className="px-6 py-4 font-mono font-black text-sm uppercase tracking-widest border-4 border-white bg-white text-black active:bg-black active:text-white shadow-[4px_4px_0px_0px_#ffffff] cursor-pointer"
            >
              HOLD TO REEL
            </button>
            <button
              id="mobile-btn-cut-line"
              onClick={(e) => {
                e.stopPropagation();
                onResetToIdle();
              }}
              className="p-3.5 bg-black text-white border-2 border-white hover:bg-white hover:text-black cursor-pointer shadow-[3px_3px_0px_0px_#ffffff]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
