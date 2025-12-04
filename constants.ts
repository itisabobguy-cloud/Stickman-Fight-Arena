
import { WeaponType } from "./types";

export const GRAVITY = 0.6;
export const FRICTION = 0.80; // Reduced from 0.85 for less 'slide'
export const MOVE_SPEED = 1.5; // Increased from 1.2 for more responsiveness
export const JUMP_FORCE = -14;
export const TERMINAL_VELOCITY = 15;
export const MAX_JUMPS = 2;

export const TILE_SIZE = 32;
export const MAP_WIDTH = 25;
export const MAP_HEIGHT = 18;

// Horde Mode Config
export const WAVE_DELAY = 300; 
export const MAX_ENEMIES_PER_WAVE = 5;

export const THEMES = [
  "Cyberpunk City",
  "Volcanic Forge",
  "Frozen Tundra",
  "Jungle Ruins",
  "Space Station",
  "Neon Skylines",
  "Toxic Sewers",
  "Candy Kingdom",
  "Underwater Abyss",
  "Desert Temple",
  "Haunted Castle",
  "Cloud Sanctuary"
];

// Visual configuration for maps
export const THEME_CONFIG: {[key: string]: {
  backgroundStart: string, 
  backgroundEnd: string, 
  tileColor: string, 
  tileDetail: string,
  particleColor: string,
  style: 'tech' | 'brick' | 'organic' | 'crystal' | 'clouds' | 'basic'
}} = {
  "Cyberpunk City": { backgroundStart: '#0f172a', backgroundEnd: '#312e81', tileColor: '#1e293b', tileDetail: '#38bdf8', particleColor: '#22d3ee', style: 'tech' },
  "Volcanic Forge": { backgroundStart: '#450a0a', backgroundEnd: '#7f1d1d', tileColor: '#27272a', tileDetail: '#ef4444', particleColor: '#fca5a5', style: 'organic' },
  "Frozen Tundra": { backgroundStart: '#1e3a8a', backgroundEnd: '#bfdbfe', tileColor: '#e0f2fe', tileDetail: '#60a5fa', particleColor: '#ffffff', style: 'crystal' },
  "Jungle Ruins": { backgroundStart: '#064e3b', backgroundEnd: '#14532d', tileColor: '#365314', tileDetail: '#a3e635', particleColor: '#bef264', style: 'brick' },
  "Space Station": { backgroundStart: '#000000', backgroundEnd: '#1e293b', tileColor: '#334155', tileDetail: '#94a3b8', particleColor: '#ffffff', style: 'tech' },
  "Candy Kingdom": { backgroundStart: '#fdf2f8', backgroundEnd: '#fbcfe8', tileColor: '#f9a8d4', tileDetail: '#f472b6', particleColor: '#fda4af', style: 'organic' },
  "Underwater Abyss": { backgroundStart: '#020617', backgroundEnd: '#0c4a6e', tileColor: '#0f172a', tileDetail: '#0ea5e9', particleColor: '#38bdf8', style: 'organic' },
  "Desert Temple": { backgroundStart: '#fef3c7', backgroundEnd: '#fbbf24', tileColor: '#d97706', tileDetail: '#f59e0b', particleColor: '#fcd34d', style: 'brick' },
  "Haunted Castle": { backgroundStart: '#2e1065', backgroundEnd: '#4c1d95', tileColor: '#3b0764', tileDetail: '#a855f7', particleColor: '#d8b4fe', style: 'brick' },
  "Cloud Sanctuary": { backgroundStart: '#e0f2fe', backgroundEnd: '#bae6fd', tileColor: '#ffffff', tileDetail: '#7dd3fc', particleColor: '#f0f9ff', style: 'clouds' },
  "Neon Skylines": { backgroundStart: '#2e1065', backgroundEnd: '#db2777', tileColor: '#1e1b4b', tileDetail: '#f472b6', particleColor: '#f5d0fe', style: 'tech' },
  "Toxic Sewers": { backgroundStart: '#022c22', backgroundEnd: '#14532d', tileColor: '#1a2e05', tileDetail: '#84cc16', particleColor: '#a3e635', style: 'organic' }
};

export const WEAPON_CONFIG = {
  [WeaponType.PISTOL]: {
    damage: 10,
    speed: 12,
    cooldown: 20,
    color: '#FFFF00',
    size: 4,
    ammo: Infinity
  },
  [WeaponType.SHOTGUN]: {
    damage: 8,
    speed: 10,
    cooldown: 50,
    color: '#FFA500',
    size: 3,
    ammo: 15,
    spread: 3
  },
  [WeaponType.ROCKET]: {
    damage: 40,
    speed: 8,
    cooldown: 80,
    color: '#FF0000',
    size: 8,
    ammo: 5
  },
  [WeaponType.LASER]: {
    damage: 25,
    speed: 20,
    cooldown: 40,
    color: '#00FFFF',
    size: 2,
    ammo: 10
  },
  [WeaponType.ANGEL_CANNON]: {
    damage: 15,
    speed: 15,
    cooldown: 15,
    color: '#FCD34D', 
    size: 6,
    ammo: 30,
    effect: 'flight'
  },
  [WeaponType.NIMBUS_STAFF]: {
    damage: 50,
    speed: 25,
    cooldown: 60,
    color: '#E0F2FE', 
    size: 10,
    ammo: 8,
    effect: 'lightning'
  }
};

export const FALLING_WEAPON_CHANCE = 0.001;
export const DEFAULT_MAP = {
  width: 25,
  height: 18,
  tileSize: 32,
  theme: 'Industrial Zone',
  spawns: [{x: 2, y: 2}, {x: 22, y: 2}, {x: 12, y: 2}],
  tiles: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,1,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,1,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,1,1,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ]
};
