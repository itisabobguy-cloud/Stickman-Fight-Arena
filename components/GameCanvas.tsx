
import React, { useEffect, useRef } from 'react';
import { GameState, Entity, Player, WeaponType } from '../types';
import { TILE_SIZE, THEME_CONFIG, WEAPON_CONFIG } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  onReset: () => void;
  onExit: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onReset, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Camera smoothing
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });

  // Helper to draw specific weapon models
  const drawWeaponIcon = (ctx: CanvasRenderingContext2D, weapon: WeaponType, x: number, y: number, color: string, scale: number = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    
    switch (weapon) {
        case WeaponType.PISTOL:
            ctx.fillRect(-6, -2, 12, 4);
            ctx.fillRect(-6, 0, 4, 6); // Handle
            break;
        case WeaponType.SHOTGUN:
            ctx.fillRect(-8, -3, 16, 6);
            ctx.fillStyle = '#333';
            ctx.fillRect(8, -2, 2, 4); // Barrel Tip
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-8, 0, 6, 4); // Stock
            break;
        case WeaponType.ROCKET:
            // Launcher body
            ctx.fillStyle = '#555';
            ctx.fillRect(-10, -5, 20, 10);
            // Rocket tip
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.moveTo(10, -5);
            ctx.lineTo(15, 0);
            ctx.lineTo(10, 5);
            ctx.fill();
            break;
        case WeaponType.LASER:
            ctx.fillStyle = '#0ff';
            ctx.fillRect(-8, -2, 16, 4);
            // Coils
            ctx.fillStyle = '#fff';
            ctx.fillRect(-4, -3, 2, 6);
            ctx.fillRect(2, -3, 2, 6);
            break;
        case WeaponType.ANGEL_CANNON:
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI*2);
            ctx.fill();
            // Wing detail
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.lineTo(-8, -8);
            ctx.lineTo(-4, 0);
            ctx.fill();
            break;
        case WeaponType.NIMBUS_STAFF:
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(-8, 8);
             ctx.lineTo(8, -8);
             ctx.stroke();
             ctx.fillStyle = '#0ff';
             ctx.beginPath();
             ctx.arc(8, -8, 4, 0, Math.PI*2);
             ctx.fill();
            break;
        default:
            ctx.fillRect(-5, -5, 10, 10);
    }
    ctx.restore();
  };

  // Draw Background (Static + Simple Animation)
  useEffect(() => {
    const bg = bgCanvasRef.current;
    if (!bg) return;
    const ctx = bg.getContext('2d');
    if (!ctx) return;

    const theme = THEME_CONFIG[gameState.map.theme] || THEME_CONFIG["Cyberpunk City"];

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 0, bg.height);
    grad.addColorStop(0, theme.backgroundStart);
    grad.addColorStop(1, theme.backgroundEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, bg.width, bg.height);

    // Procedural Background Elements based on theme
    ctx.fillStyle = theme.particleColor;
    ctx.globalAlpha = 0.2;
    for(let i=0; i<50; i++) {
        const x = Math.random() * bg.width;
        const y = Math.random() * bg.height;
        const s = Math.random() * 3;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

  }, [gameState.map.theme]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Dynamic Camera Logic ---
    // CONSTRAINT: Only follow HUMAN players in Solo/Coop to avoid bots dragging screen
    // In PVP, follow both (assumed human or important).
    // In Solo/Coop, ignore bots.
    const targets = gameState.players.filter(p => !p.isDead && (gameState.mode === 'PVP' || !p.isBot));
    
    // If all humans dead, fallback to showing everyone or center
    const activeTargets = targets.length > 0 ? targets : gameState.players.filter(p => !p.isDead);

    let minX = 0, minY = 0, maxX = gameState.map.width * TILE_SIZE, maxY = gameState.map.height * TILE_SIZE;

    if (activeTargets.length > 0) {
        minX = Math.min(...activeTargets.map(p => p.pos.x));
        maxX = Math.max(...activeTargets.map(p => p.pos.x + p.size.x));
        minY = Math.min(...activeTargets.map(p => p.pos.y));
        maxY = Math.max(...activeTargets.map(p => p.pos.y + p.size.y));
    } else {
        // Fallback to center if everyone dead
        minX = 0; maxX = gameState.map.width * TILE_SIZE;
        minY = 0; maxY = gameState.map.height * TILE_SIZE;
    }

    // Add padding
    const paddingX = 300; 
    const paddingY = 200;
    
    // Determine view rectangle
    let viewW = (maxX - minX) + paddingX * 2;
    let viewH = (maxY - minY) + paddingY * 2;

    // CONSTRAINT: Minimum view size to prevent rapid zooming when players are close
    const minViewW = 800; // Minimum width of the camera view
    const minViewH = 500; // Minimum height of the camera view
    
    viewW = Math.max(viewW, minViewW);
    viewH = Math.max(viewH, minViewH);
    
    // Center point
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate target scaling
    const scaleX = canvas.width / viewW;
    const scaleY = canvas.height / viewH;
    let targetScale = Math.min(scaleX, scaleY);
    
    // Clamp scale
    targetScale = Math.min(Math.max(targetScale, 0.6), 1.5);
    
    const renderW = canvas.width / targetScale;
    const renderH = canvas.height / targetScale;
    
    // Top-left of target camera
    let targetCamX = centerX - renderW / 2;
    let targetCamY = centerY - renderH / 2;
    
    // Clamp camera to map bounds
    targetCamX = Math.max(0, Math.min(targetCamX, gameState.map.width * TILE_SIZE - renderW));
    targetCamY = Math.max(0, Math.min(targetCamY, gameState.map.height * TILE_SIZE - renderH));
    
    // Smooth Camera (Lerp)
    cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.05;
    cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.05;
    cameraRef.current.scale += (targetScale - cameraRef.current.scale) * 0.05;

    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    const scale = cameraRef.current.scale;

    // Apply Transform
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-camX, -camY);

    const theme = THEME_CONFIG[gameState.map.theme] || THEME_CONFIG["Cyberpunk City"];

    // Helper: Draw Tile with Variation
    const drawTile = (x: number, y: number, type: number) => {
      const tx = x * TILE_SIZE;
      const ty = y * TILE_SIZE;
      
      // Optimization: Only draw visible tiles
      if (tx + TILE_SIZE < camX || tx > camX + renderW || ty + TILE_SIZE < camY || ty > camY + renderH) return;

      if (type === 1) { // Solid
        // Draw base rect first so collision is always visible
        ctx.fillStyle = theme.tileColor;
        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
        
        ctx.strokeStyle = theme.tileDetail;
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

        ctx.fillStyle = theme.tileDetail;
        
        if (theme.style === 'tech') {
           // Circuit lines
           ctx.beginPath();
           ctx.moveTo(tx + 5, ty + 5);
           ctx.lineTo(tx + 20, ty + 5);
           ctx.lineTo(tx + 20, ty + 20);
           ctx.stroke();
           ctx.fillRect(tx + 18, ty + 18, 4, 4);
        } else if (theme.style === 'brick') {
           // Brick pattern
           ctx.fillRect(tx, ty + 15, TILE_SIZE, 2);
           ctx.fillRect(tx + 15, ty, 2, 15);
           ctx.fillRect(tx + 8, ty + 17, 2, 15);
        } else if (theme.style === 'organic') {
           // Blobs
           ctx.beginPath();
           ctx.arc(tx + 10, ty + 10, 5, 0, Math.PI * 2);
           ctx.arc(tx + 22, ty + 20, 6, 0, Math.PI * 2);
           ctx.fill();
        } else if (theme.style === 'crystal') {
           // Shards
           ctx.beginPath();
           ctx.moveTo(tx + 16, ty + 4);
           ctx.lineTo(tx + 24, ty + 16);
           ctx.lineTo(tx + 16, ty + 28);
           ctx.lineTo(tx + 8, ty + 16);
           ctx.fill();
        } else if (theme.style === 'clouds') {
           ctx.beginPath();
           ctx.arc(tx+8, ty+8, 8, 0, Math.PI*2);
           ctx.arc(tx+24, ty+8, 8, 0, Math.PI*2);
           ctx.arc(tx+16, ty+24, 8, 0, Math.PI*2);
           ctx.fill();
        }
      } else if (type === 2) { // Platform
        ctx.fillStyle = theme.tileDetail;
        ctx.fillRect(tx, ty, TILE_SIZE, 8);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(tx + 2, ty + 8, TILE_SIZE - 4, 4);
        ctx.globalAlpha = 1.0;
      } else if (type === 3) { // Spike
        ctx.fillStyle = '#ef4444'; 
        ctx.beginPath();
        // Draw 3 smaller spikes for better look
        for(let i=0; i<3; i++) {
           const sx = tx + (i * (TILE_SIZE/3));
           ctx.moveTo(sx, ty + TILE_SIZE);
           ctx.lineTo(sx + (TILE_SIZE/6), ty);
           ctx.lineTo(sx + (TILE_SIZE/3), ty + TILE_SIZE);
        }
        ctx.fill();
      }
    };

    // Draw Map
    gameState.map.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile !== 0) drawTile(x, y, tile);
      });
    });

    // Draw Items
    gameState.items.forEach(item => {
        if (item.isDead) return;
        const cy = item.pos.y + Math.sin(item.bobOffset) * 5;
        
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = item.color;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(item.pos.x + 10, cy + 10, 18, 0, Math.PI * 2);
        ctx.fill();

        // Draw Icon instead of text
        drawWeaponIcon(ctx, item.weapon, item.pos.x + 10, cy + 10, item.color, 1.5);
        
        ctx.shadowBlur = 0;
    });

    // Draw Players (Advanced Stickman with Animations)
    gameState.players.forEach(p => {
      if (p.isDead) return;
      
      const cx = p.pos.x + p.size.x / 2;
      const cy = p.pos.y;
      
      // Angel Wings Effect & Halo
      if (p.weapon === WeaponType.ANGEL_CANNON) {
          ctx.save();
          // Halo
          ctx.strokeStyle = '#FCD34D';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#FCD34D';
          ctx.beginPath();
          ctx.ellipse(cx, cy - 5, 12, 4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Wings
          ctx.translate(cx, cy + 20);
          ctx.scale(p.facingRight ? 1 : -1, 1);
          ctx.strokeStyle = '#FCD34D';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(252, 211, 77, 0.2)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-20, -30, -40, -10);
          ctx.quadraticCurveTo(-30, 10, 0, 10);
          ctx.stroke();
          ctx.fill();
          ctx.restore();
      }
      
      // Nimbus Aura
      if (p.weapon === WeaponType.NIMBUS_STAFF) {
         ctx.save();
         ctx.strokeStyle = '#E0F2FE';
         ctx.lineWidth = 1;
         ctx.globalAlpha = 0.5 + Math.random() * 0.5;
         ctx.beginPath();
         ctx.arc(cx, cy + 20, 25, 0, Math.PI * 2);
         ctx.stroke();
         ctx.restore();
      }

      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Head
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Body (Lean based on velocity and state)
      // Reduced lean so it doesn't look like they are thrusting too much
      let lean = p.vel.x * 0.8; 
      if (p.attackTimer > 0) lean -= (p.facingRight ? 5 : -5); // Recoil

      ctx.beginPath();
      ctx.moveTo(cx, cy + 12);
      ctx.lineTo(cx + lean, cy + 28);
      ctx.stroke();

      // Arms (Aiming & Recoil)
      const dir = p.facingRight ? 1 : -1;
      let shoulderX = cx + lean * 0.2;
      let shoulderY = cy + 14; 
      
      let armTargetX = shoulderX + (dir * 20);
      let armTargetY = shoulderY; 
      
      // Attack Recoil Animation
      if (p.attackTimer > 0) {
          const recoil = (p.attackTimer / 10) * 8; // 10 is max timer
          armTargetX -= (dir * recoil);
          armTargetY -= (recoil * 0.5);
      }

      ctx.beginPath();
      ctx.moveTo(shoulderX, shoulderY); 
      ctx.lineTo(armTargetX, armTargetY); 
      ctx.stroke();

      // Weapon Render
      drawWeaponIcon(ctx, p.weapon, armTargetX, armTargetY, WEAPON_CONFIG[p.weapon]?.color || '#fff', p.facingRight ? 1 : -1);

      // --- LEGS ANIMATION ---
      const hipX = cx + lean;
      const hipY = cy + 28;

      if (!p.grounded) {
          // AIRBORNE ANIMATIONS
          if (p.vel.y < 0) {
              // JUMP: Legs tucked
              ctx.beginPath();
              ctx.moveTo(hipX, hipY);
              ctx.lineTo(hipX + (p.facingRight ? -5 : 5), hipY + 8); // Knee
              ctx.lineTo(hipX + (p.facingRight ? 5 : -5), hipY + 12); // Foot
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(hipX, hipY);
              ctx.lineTo(hipX + (p.facingRight ? 5 : -5), hipY + 5); // Knee
              ctx.lineTo(hipX + (p.facingRight ? 10 : -10), hipY + 10); // Foot
              ctx.stroke();
          } else {
              // FALL: Legs straightish / flailing
              ctx.beginPath();
              ctx.moveTo(hipX, hipY);
              ctx.lineTo(hipX - 2, cy + 42); 
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(hipX, hipY);
              ctx.lineTo(hipX + 2, cy + 40); 
              ctx.stroke();
          }
      } else {
          // RUNNING / IDLE
          const leg1Offset = Math.sin(p.walkCycle) * 8;
          const leg2Offset = Math.sin(p.walkCycle + Math.PI) * 8;

          // Leg 1
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(cx - 2 + leg1Offset, cy + 40); // Foot
          ctx.stroke();

          // Leg 2
          ctx.beginPath();
          ctx.moveTo(hipX, hipY);
          ctx.lineTo(cx + 2 + leg2Offset, cy + 40); // Foot
          ctx.stroke();
      }

      // Health Bar
      ctx.fillStyle = 'red';
      ctx.fillRect(p.pos.x, p.pos.y - 12, p.size.x, 4);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(p.pos.x, p.pos.y - 12, p.size.x * (p.hp / p.maxHp), 4);
      
      // Ammo Bar
      if (p.ammo !== Infinity) {
         ctx.fillStyle = 'yellow';
         ctx.fillRect(p.pos.x, p.pos.y - 7, p.size.x * (p.ammo / WEAPON_CONFIG[p.weapon].ammo), 2);
      }

      // Name
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, p.pos.x + p.size.x/2, p.pos.y - 16);
    });

    // Draw Projectiles
    gameState.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.type === WeaponType.ANGEL_CANNON) {
          ctx.arc(p.pos.x, p.pos.y, p.size.x, 0, Math.PI * 2);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke(); 
      } else {
          ctx.arc(p.pos.x, p.pos.y, p.size.x, 0, Math.PI * 2);
          ctx.fill();
      }
    });

    // Draw Particles
    gameState.particles.forEach(p => {
       ctx.fillStyle = p.color;
       ctx.globalAlpha = p.lifeTime / p.maxLife;
       ctx.fillRect(p.pos.x, p.pos.y, p.size.x, p.size.y);
       ctx.globalAlpha = 1.0;
    });

    ctx.restore();

    // UI Overlay (Fixed Position)
    ctx.font = '20px "Press Start 2P"';
    if (gameState.mode === 'COOP') {
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText(`HUMAN SCORE: ${gameState.players[0].score + gameState.players[1].score}`, canvas.width/2, 40);
    } else {
        ctx.fillStyle = gameState.players[0].color;
        ctx.textAlign = 'left';
        ctx.fillText(`${gameState.players[0].name}: ${gameState.players[0].score}`, 20, 40);
        ctx.fillStyle = gameState.players[1].color;
        ctx.textAlign = 'right';
        ctx.fillText(`${gameState.players[1].name}: ${gameState.players[1].score}`, canvas.width - 20, 40);
    }

    if (gameState.winner) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFF00';
      ctx.font = '40px "Press Start 2P"';
      ctx.textAlign = 'center';
      
      let text = '';
      if (gameState.winner === 'DRAW') text = "DRAW!";
      else if (gameState.winner === 'HORDE') text = "THE HORDE CONSUMED YOU";
      else {
        const winnerName = gameState.players.find(p => p.id === gameState.winner)?.name;
        text = `${winnerName} WINS!`;
      }
      
      ctx.fillText(text, canvas.width/2, canvas.height/2);
      
      ctx.font = '20px "Press Start 2P"';
      ctx.fillStyle = 'white';
      ctx.fillText("Tap to Generate New Arena", canvas.width/2, canvas.height/2 + 60);
    }

  }, [gameState]);

  const handleInteraction = () => {
    if (gameState.winner) {
      onReset();
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
       <canvas 
        ref={bgCanvasRef} 
        width={1000} 
        height={600} 
        className="absolute inset-0 w-full h-full object-cover opacity-50"
       />
       <canvas 
        ref={canvasRef} 
        width={1000} 
        height={600}
        onClick={handleInteraction}
        onTouchEnd={handleInteraction}
        className="relative z-10 w-full h-full object-contain"
      />
      
      <button 
        onClick={onExit}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 px-3 py-1 text-xs rounded text-white opacity-50 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest z-50 pointer-events-auto"
      >
        Exit Match
      </button>

      {gameState.messages.length > 0 && (
         <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800/80 p-4 rounded-lg border border-cyan-500 text-cyan-400 font-mono text-sm max-w-md text-center animate-bounce z-20">
            <span className="font-bold text-white">Bot: </span>
            {gameState.messages[gameState.messages.length - 1]}
         </div>
      )}
    </div>
  );
};

export default GameCanvas;
