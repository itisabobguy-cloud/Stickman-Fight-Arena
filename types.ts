
export type Vector2 = { x: number; y: number };

export enum GameMode {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum WeaponType {
  PISTOL = 'PISTOL',
  SHOTGUN = 'SHOTGUN',
  ROCKET = 'ROCKET',
  LASER = 'LASER',
  ANGEL_CANNON = 'ANGEL_CANNON',
  NIMBUS_STAFF = 'NIMBUS_STAFF'
}

export type PlayerInput = {
  left: boolean;
  right: boolean;
  up: boolean; // Jump
  down: boolean; // Drop platform / Cover
  shoot: boolean;
  action: boolean; // Special
};

export type Entity = {
  id: string;
  pos: Vector2;
  vel: Vector2;
  size: Vector2;
  color: string;
  isDead: boolean;
};

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  facingRight: boolean;
  grounded: boolean;
  jumpCount: number; // For double jump
  wasJumpPressed: boolean; // For input edge detection
  weapon: WeaponType;
  ammo: number;
  canShoot: boolean;
  shootTimer: number;
  attackTimer: number; // For recoil animation
  isBot: boolean;
  score: number;
  name: string;
  team: number; // 1 for Players, 2 for Horde
  walkCycle: number; // For animation
}

export interface Projectile extends Entity {
  ownerId: string;
  damage: number;
  type: WeaponType;
  lifeTime: number;
}

export interface Particle extends Entity {
  lifeTime: number;
  maxLife: number;
}

export interface ItemDrop extends Entity {
  weapon: WeaponType;
  bobOffset: number;
}

export interface GameMap {
  tiles: number[][]; // 0: empty, 1: wall, 2: platform, 3: spike
  width: number;
  height: number;
  tileSize: number;
  spawns: Vector2[];
  theme: string;
}

export type GameState = {
  players: Player[];
  projectiles: Projectile[];
  particles: Particle[];
  items: ItemDrop[];
  map: GameMap;
  winner: string | null;
  mode: 'PVP' | 'SOLO' | 'COOP';
  messages: string[]; // Bot chat log
  wave: number; // For Horde mode
  waveTimer: number;
};