
import { GameState, Player, Projectile, GameMap, PlayerInput, WeaponType, Entity, Vector2, ItemDrop } from '../types';
import { GRAVITY, FRICTION, MOVE_SPEED, JUMP_FORCE, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, WEAPON_CONFIG, TERMINAL_VELOCITY, MAX_JUMPS, FALLING_WEAPON_CHANCE, WAVE_DELAY, MAX_ENEMIES_PER_WAVE } from '../constants';
import { playSound } from './audioUtils';

export const initialGameState = (mode: 'PVP' | 'SOLO' | 'COOP', map: GameMap): GameState => {
  const p1: Player = {
    id: 'p1',
    name: 'Player 1',
    pos: { x: map.spawns[0].x * TILE_SIZE, y: map.spawns[0].y * TILE_SIZE },
    vel: { x: 0, y: 0 },
    size: { x: 20, y: 40 }, 
    color: '#00FFFF', 
    hp: 100,
    maxHp: 100,
    facingRight: true,
    grounded: false,
    jumpCount: MAX_JUMPS,
    wasJumpPressed: false,
    weapon: WeaponType.PISTOL,
    ammo: Infinity,
    canShoot: true,
    shootTimer: 0,
    attackTimer: 0,
    isBot: false,
    isDead: false,
    score: 0,
    team: 1,
    walkCycle: 0
  };

  const p2: Player = {
    id: 'p2',
    name: mode === 'SOLO' ? 'Bot 2.5' : 'Player 2',
    pos: { x: map.spawns[1].x * TILE_SIZE, y: map.spawns[1].y * TILE_SIZE },
    vel: { x: 0, y: 0 },
    size: { x: 20, y: 40 },
    color: mode === 'COOP' ? '#00FF00' : '#FF00FF', 
    hp: 100,
    maxHp: 100,
    facingRight: false,
    grounded: false,
    jumpCount: MAX_JUMPS,
    wasJumpPressed: false,
    weapon: WeaponType.PISTOL,
    ammo: Infinity,
    canShoot: true,
    shootTimer: 0,
    attackTimer: 0,
    isBot: mode === 'SOLO',
    isDead: false,
    score: 0,
    team: mode === 'COOP' ? 1 : 2,
    walkCycle: 0
  };

  return {
    players: mode === 'SOLO' || mode === 'PVP' ? [p1, p2] : [p1, p2],
    projectiles: [],
    particles: [],
    items: [],
    map,
    winner: null,
    mode,
    messages: [],
    wave: 1,
    waveTimer: 0
  };
};

// --- Physics Helpers ---

const checkCollision = (rect1: Entity, rect2: Entity): boolean => {
  return (
    rect1.pos.x < rect2.pos.x + rect2.size.x &&
    rect1.pos.x + rect1.size.x > rect2.pos.x &&
    rect1.pos.y < rect2.pos.y + rect2.size.y &&
    rect1.pos.y + rect1.size.y > rect2.pos.y
  );
};

const resolveMapCollision = (entity: Entity, map: GameMap, resolveX: boolean, resolveY: boolean) => {
  const startX = Math.floor(entity.pos.x / TILE_SIZE);
  const endX = Math.floor((entity.pos.x + entity.size.x) / TILE_SIZE);
  
  // Critical Fix: When moving horizontally (resolveX), shrink the vertical bounds slightly.
  // This prevents the player from "stubbing their toe" on the floor they are walking on.
  // If we don't do this, gravity pulls you into the floor, and the X-check sees that overlap as a wall.
  const yBuffer = resolveX ? 4 : 0; 
  const startY = Math.floor((entity.pos.y + yBuffer) / TILE_SIZE);
  const endY = Math.floor((entity.pos.y + entity.size.y - yBuffer) / TILE_SIZE);

  // Bounds check
  if (entity.pos.y > map.height * TILE_SIZE) {
    if ('hp' in entity) (entity as Player).isDead = true; // Fall off map
    return;
  }

  // Check Spikes - Instant Death
  if ('hp' in entity) {
      const feetX = Math.floor((entity.pos.x + entity.size.x / 2) / TILE_SIZE);
      const feetY = Math.floor((entity.pos.y + entity.size.y - 2) / TILE_SIZE);
      
      if (feetY >= 0 && feetY < map.height && feetX >= 0 && feetX < map.width) {
         if (map.tiles[feetY][feetX] === 3) {
             (entity as Player).hp = 0;
             (entity as Player).isDead = true;
         }
      }
  }

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (y >= 0 && y < map.height && x >= 0 && x < map.width) {
        const tile = map.tiles[y][x];
        
        // Solid Wall
        if (tile === 1) {
          const tileRect = { x: x * TILE_SIZE, y: y * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
          
          if (resolveY) {
              if (entity.vel.y > 0) { // Falling
                const overlap = (entity.pos.y + entity.size.y) - tileRect.y;
                 if (overlap < 20 && entity.pos.y < tileRect.y) {
                    entity.pos.y = tileRect.y - entity.size.y;
                    entity.vel.y = 0;
                    if ('grounded' in entity) (entity as Player).grounded = true;
                 }
              } else if (entity.vel.y < 0) { // Jumping up
                 const overlap = (tileRect.y + tileRect.h) - entity.pos.y;
                 if (overlap < 20) {
                     entity.pos.y = tileRect.y + tileRect.h;
                     entity.vel.y = 0;
                 }
              }
          }

          if (resolveX) {
              // Simple X resolution
              if (entity.vel.x > 0) { // Right
                  const overlap = (entity.pos.x + entity.size.x) - tileRect.x;
                  if (overlap < 15 && entity.pos.x < tileRect.x) {
                       entity.pos.x = tileRect.x - entity.size.x;
                       entity.vel.x = 0;
                  }
              } else if (entity.vel.x < 0) { // Left
                  const overlap = (tileRect.x + tileRect.w) - entity.pos.x;
                  if (overlap < 15 && entity.pos.x > tileRect.x) {
                      entity.pos.x = tileRect.x + tileRect.w;
                      entity.vel.x = 0;
                  }
              }
          }
        }

        // Platform (One way)
        if (tile === 2 && resolveY && entity.vel.y > 0) {
           const tileTop = y * TILE_SIZE;
           const oldY = entity.pos.y - entity.vel.y;
           // Only collide if we were previously above it
           if (oldY + entity.size.y <= tileTop + 5) { 
               if (entity.pos.y + entity.size.y > tileTop) {
                   entity.pos.y = tileTop - entity.size.y;
                   entity.vel.y = 0;
                   if ('grounded' in entity) (entity as Player).grounded = true;
               }
           }
        }
      }
    }
  }
};

// --- Update Function ---

export const updateGame = (state: GameState, inputs: { [key: string]: PlayerInput }): GameState => {
  if (state.winner) return state;

  const newState = { ...state };
  
  // 1. Horde Mode Logic
  if (state.mode === 'COOP') {
      const activeEnemies = newState.players.filter(p => p.team === 2 && !p.isDead);
      
      if (activeEnemies.length === 0) {
          newState.waveTimer++;
          if (newState.waveTimer > WAVE_DELAY) {
              newState.wave++;
              newState.waveTimer = 0;
              // Spawn enemies
              const count = Math.min(newState.wave + 1, MAX_ENEMIES_PER_WAVE);
              for(let i=0; i<count; i++) {
                 const spawn = newState.map.spawns[Math.floor(Math.random() * newState.map.spawns.length)];
                 newState.players.push({
                     id: `bot_wave_${newState.wave}_${i}`,
                     name: `Horde ${i+1}`,
                     pos: { x: spawn.x * TILE_SIZE, y: 0 }, // Spawn from top
                     vel: { x: 0, y: 0 },
                     size: { x: 20, y: 40 },
                     color: '#ef4444',
                     hp: 30 + (newState.wave * 10),
                     maxHp: 30 + (newState.wave * 10),
                     facingRight: Math.random() > 0.5,
                     grounded: false,
                     jumpCount: 2,
                     wasJumpPressed: false,
                     weapon: Math.random() > 0.8 ? WeaponType.SHOTGUN : WeaponType.PISTOL,
                     ammo: Infinity,
                     canShoot: true,
                     shootTimer: 30, // Delay first shot
                     attackTimer: 0,
                     isBot: true,
                     isDead: false,
                     score: 0,
                     team: 2,
                     walkCycle: 0
                 });
              }
          }
      }
  }

  // 2. Supply Drops
  if (Math.random() < FALLING_WEAPON_CHANCE) {
      const types = Object.values(WeaponType);
      const randomWeapon = types[Math.floor(Math.random() * types.length)];
      newState.items.push({
          id: `item_${Date.now()}_${Math.random()}`,
          pos: { x: Math.random() * (newState.map.width * TILE_SIZE - 40) + 20, y: 0 },
          vel: { x: 0, y: 0 },
          size: { x: 20, y: 20 },
          color: WEAPON_CONFIG[randomWeapon].color,
          isDead: false,
          weapon: randomWeapon,
          bobOffset: Math.random() * Math.PI
      });
  }

  // 3. Update Players
  newState.players.forEach(p => {
    if (p.isDead) return;

    // Bot AI Input
    let input: PlayerInput = { left: false, right: false, up: false, down: false, shoot: false, action: false };
    
    if (p.isBot) {
        // Find target
        const targets = newState.players.filter(t => t.team !== p.team && !t.isDead);
        
        // Pick closest target
        let target = targets[0];
        let minDist = Infinity;
        targets.forEach(t => {
            const d = Math.abs(t.pos.x - p.pos.x) + Math.abs(t.pos.y - p.pos.y);
            if (d < minDist) {
                minDist = d;
                target = t;
            }
        });

        if (target) {
            // Distance check
            const dx = target.pos.x - p.pos.x;
            const dy = target.pos.y - p.pos.y;
            
            // Randomly pause or change mind (Humanize)
            if (Math.random() > 0.05) {
                // Move
                if (dx > 50) input.right = true;
                if (dx < -50) input.left = true;
                
                // Jump
                if (p.grounded && target.pos.y < p.pos.y - 50) input.up = true;
                if (Math.random() < 0.01 && p.grounded) input.up = true; // Random jump

                // Shoot with delay and chance
                if (Math.abs(dy) < 50 && Math.abs(dx) < 400) {
                    // Face target
                    if (dx > 0) p.facingRight = true;
                    else p.facingRight = false;
                    
                    // Don't shoot instantly every frame
                    if (Math.random() < 0.1) {
                         input.shoot = true;
                    }
                }
            }
        }
    } else {
        input = inputs[p.id] || input;
    }

    // Movement Physics
    if (input.left) {
      p.vel.x -= p.isBot ? MOVE_SPEED * 0.8 : MOVE_SPEED; // Bots slightly slower
      p.facingRight = false;
    }
    if (input.right) {
      p.vel.x += p.isBot ? MOVE_SPEED * 0.8 : MOVE_SPEED;
      p.facingRight = true;
    }

    p.vel.x *= FRICTION;

    // Update Walk Cycle based on movement
    if (Math.abs(p.vel.x) > 0.1 && p.grounded) {
        p.walkCycle += Math.abs(p.vel.x) * 0.2;
    } else if (p.grounded) {
        p.walkCycle = 0;
    }

    // Jump
    if (input.up && !p.wasJumpPressed) {
      if (p.grounded) {
        p.vel.y = JUMP_FORCE;
        p.grounded = false;
        p.jumpCount = MAX_JUMPS - 1;
        playSound('jump');
      } else if (p.jumpCount > 0) {
        p.vel.y = JUMP_FORCE * 0.9; // Second jump slightly weaker
        p.jumpCount--;
        playSound('jump');
        
        // Angel Cannon Effect: Fly a bit
        if (p.weapon === WeaponType.ANGEL_CANNON) {
            p.vel.y = JUMP_FORCE * 1.2;
        }
      }
    }
    p.wasJumpPressed = input.up;

    // Gravity
    p.vel.y += GRAVITY;
    
    // Angel Cannon Float
    if (p.weapon === WeaponType.ANGEL_CANNON && p.vel.y > 0 && input.up) {
        p.vel.y *= 0.5; // Glide
    }
    
    // Terminal Velocity
    p.vel.y = Math.min(p.vel.y, TERMINAL_VELOCITY);

    // Apply Velocity
    // Horizontal
    p.pos.x += p.vel.x;
    resolveMapCollision(p, newState.map, true, false);
    
    // Vertical
    p.pos.y += p.vel.y;
    p.grounded = false; // Assume false until resolved
    resolveMapCollision(p, newState.map, false, true);

    // Drop through platforms
    if (input.down && p.grounded) {
        p.pos.y += 1;
        p.grounded = false;
    }

    // Shooting
    if (p.shootTimer > 0) p.shootTimer--;
    if (p.attackTimer > 0) p.attackTimer--;

    if (input.shoot && p.canShoot && p.shootTimer <= 0) {
      const config = WEAPON_CONFIG[p.weapon];
      
      const fireProjectile = (angleOffset: number = 0) => {
        const dir = p.facingRight ? 1 : -1;
        // Basic angle calculation
        let vx = config.speed * dir;
        let vy = 0;

        // Add spread
        if (angleOffset !== 0) {
            vy = Math.sin(angleOffset) * config.speed;
            vx = Math.cos(angleOffset) * config.speed * dir;
        }

        newState.projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          pos: { x: p.pos.x + p.size.x/2, y: p.pos.y + p.size.y/2 },
          vel: { x: vx, y: vy },
          size: { x: config.size, y: config.size },
          color: config.color,
          isDead: false,
          ownerId: p.id,
          damage: config.damage,
          type: p.weapon,
          lifeTime: 100
        });
      };

      fireProjectile();
      
      // Shotgun spread
      if (p.weapon === WeaponType.SHOTGUN) {
          fireProjectile(0.2);
          fireProjectile(-0.2);
      }
      
      // Nimbus Staff: Lightning spread
      if (p.weapon === WeaponType.NIMBUS_STAFF) {
          fireProjectile(0.1);
          fireProjectile(-0.1);
      }

      p.shootTimer = config.cooldown;
      p.attackTimer = 10; // Animation frame count
      
      if (p.ammo !== Infinity) {
          p.ammo--;
          if (p.ammo <= 0) {
              p.weapon = WeaponType.PISTOL;
              p.ammo = Infinity;
          }
      }
      playSound('shoot');
    }
    
    // Pick up items
    newState.items.forEach(item => {
       if (!item.isDead && checkCollision(p, item)) {
           p.weapon = item.weapon;
           p.ammo = WEAPON_CONFIG[item.weapon].ammo;
           item.isDead = true;
           playSound('powerup');
       }
    });

  });

  // 4. Update Projectiles
  newState.projectiles.forEach(proj => {
    if (proj.isDead) return;

    proj.pos.x += proj.vel.x;
    proj.pos.y += proj.vel.y;
    proj.lifeTime--;

    if (proj.lifeTime <= 0) proj.isDead = true;

    // Map Collision
    const mx = Math.floor(proj.pos.x / TILE_SIZE);
    const my = Math.floor(proj.pos.y / TILE_SIZE);
    if (mx >= 0 && mx < newState.map.width && my >= 0 && my < newState.map.height) {
        if (newState.map.tiles[my][mx] === 1) {
            proj.isDead = true;
            // Particles
            for(let i=0; i<5; i++) {
                newState.particles.push({
                   id: `part_${Math.random()}`,
                   pos: { ...proj.pos },
                   vel: { x: (Math.random()-0.5)*5, y: (Math.random()-0.5)*5 },
                   size: { x: 2, y: 2 },
                   color: proj.color,
                   lifeTime: 20,
                   maxLife: 20,
                   isDead: false
                });
            }
        }
    }

    // Player Collision
    newState.players.forEach(p => {
        if (!p.isDead && p.id !== proj.ownerId && checkCollision(proj, p)) {
            // Team check
            if (p.team === newState.players.find(o => o.id === proj.ownerId)?.team) return;

            p.hp -= proj.damage;
            proj.isDead = true;
            playSound('hit');
            
            // KNOCKBACK
            // Calculate direction of impact
            const impactDir = proj.vel.x > 0 ? 1 : -1;
            p.vel.x += impactDir * 8; // Push back
            p.vel.y = -5; // Small pop up
            
            if (p.hp <= 0) {
                p.isDead = true;
                playSound('explosion');
                const killer = newState.players.find(k => k.id === proj.ownerId);
                if (killer) killer.score++;
                
                // Death particles
                for(let i=0; i<20; i++) {
                    newState.particles.push({
                        id: `blood_${Math.random()}`,
                        pos: { ...p.pos },
                        vel: { x: (Math.random()-0.5)*10, y: (Math.random()-0.5)*10 },
                        size: { x: 4, y: 4 },
                        color: p.color,
                        lifeTime: 40,
                        maxLife: 40,
                        isDead: false
                    });
                }
            }
        }
    });
  });

  // 5. Update Particles
  newState.particles.forEach(p => {
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.lifeTime--;
      if (p.lifeTime <= 0) p.isDead = true;
  });
  
  // 6. Update Items (Gravity)
  newState.items.forEach(item => {
      if (item.isDead) return;
      item.vel.y += GRAVITY * 0.5; // Floatier
      item.pos.y += item.vel.y;
      
      // Simple bounce
      const feetY = Math.floor((item.pos.y + item.size.y) / TILE_SIZE);
      const feetX = Math.floor((item.pos.x + item.size.x/2) / TILE_SIZE);
      if (feetY < newState.map.height && feetX < newState.map.width && feetX >= 0) {
          if (newState.map.tiles[feetY][feetX] === 1) {
              item.pos.y = feetY * TILE_SIZE - item.size.y;
              item.vel.y = 0;
          }
      }
      
      item.bobOffset += 0.1;
  });

  // Cleanup
  newState.projectiles = newState.projectiles.filter(p => !p.isDead);
  newState.particles = newState.particles.filter(p => !p.isDead);
  newState.items = newState.items.filter(i => !i.isDead);

  // Check Win Condition
  if (state.mode === 'COOP') {
      const humansAlive = newState.players.some(p => p.team === 1 && !p.isDead);
      if (!humansAlive) {
          newState.winner = 'HORDE';
          playSound('win');
      }
  } else {
      const alivePlayers = newState.players.filter(p => !p.isDead);
      if (alivePlayers.length <= 1 && newState.players.length > 1) {
          if (alivePlayers.length === 1) {
             newState.winner = alivePlayers[0].id;
             playSound('win');
          } else {
             // Draw (e.g. simultaneous kill)
             newState.winner = 'DRAW';
          }
      }
  }

  return newState;
};
