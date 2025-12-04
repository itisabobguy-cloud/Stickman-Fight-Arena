
import React, { useState, useRef, useEffect } from 'react';
import { Target, Swords } from 'lucide-react';
import { PlayerInput } from '../types';

interface MobileControlsProps {
  playerId: 1 | 2;
  onInputChange: (playerId: 1 | 2, input: Partial<PlayerInput>) => void;
  color: string;
}

const MobileControls: React.FC<MobileControlsProps> = ({ playerId, onInputChange, color }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const isLeft = playerId === 1;

  // Joystick Logic
  const handleTouchStart = (e: React.TouchEvent) => {
    setActive(true);
    startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!active) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startPos.current.x;
    const dy = touch.clientY - startPos.current.y;
    
    // Clamp magnitude
    const distance = Math.sqrt(dx*dx + dy*dy);
    const maxDist = 40;
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(distance, maxDist);
    
    const x = Math.cos(angle) * clampedDist;
    const y = Math.sin(angle) * clampedDist;
    
    setJoystickPos({ x, y });
    
    // Calculate Inputs
    // Lower threshold for better sensitivity
    const threshold = 5; 
    onInputChange(playerId, {
      right: x > threshold,
      left: x < -threshold,
      down: y > threshold, // Drop through platform
      up: y < -threshold * 1.5, // Jump
    });
  };

  const handleTouchEnd = () => {
    setActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onInputChange(playerId, {
      right: false,
      left: false,
      down: false,
      up: false
    });
  };

  const handleAction = (key: keyof PlayerInput, pressed: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInputChange(playerId, { [key]: pressed });
  };

  const actionBtnClass = "w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg border-2 border-opacity-50 transition-transform active:scale-95 touch-none select-none";

  return (
    <div className={`fixed bottom-8 ${isLeft ? 'left-8' : 'right-8'} flex items-end gap-8 z-50 pointer-events-auto no-select`}>
      {/* Virtual Joystick (Left Side for both, or standard position) */}
      <div 
        ref={joystickRef}
        className="w-32 h-32 rounded-full bg-slate-800/50 border-2 border-white/20 backdrop-blur-sm relative touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {/* Joystick Handle */}
        <div 
          className="absolute w-12 h-12 rounded-full shadow-lg"
          style={{
            backgroundColor: color,
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
            transition: active ? 'none' : 'transform 0.1s ease-out'
          }}
        />
        {/* Label */}
        <div className="absolute -top-6 left-0 w-full text-center text-xs font-bold text-white/70">
          MOVE & JUMP
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 pb-2">
        <button
          className={`${actionBtnClass} bg-red-500/40 border-red-400 text-white`}
          onTouchStart={handleAction('shoot', true)}
          onTouchEnd={handleAction('shoot', false)}
          onMouseDown={handleAction('shoot', true)}
          onMouseUp={handleAction('shoot', false)}
        >
          <Target size={32} />
        </button>
      </div>

      <div className={`absolute -top-10 left-0 w-full text-center font-bold text-sm bg-black/50 rounded px-2`} style={{color}}>
        PLAYER {playerId}
      </div>
    </div>
  );
};

export default MobileControls;
