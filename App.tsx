
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import MobileControls from './components/MobileControls';
import { GameMode, GameState, PlayerInput, GameMap } from './types';
import { initialGameState, updateGame } from './utils/gameLogic';
import { generateGameMap, getBotCommentary } from './services/geminiService';
import { DEFAULT_MAP, THEMES } from './constants';
import { Loader2 } from 'lucide-react';
import { initAudio } from './utils/audioUtils';

export default function App() {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [inputs, setInputs] = useState<{ [key: string]: PlayerInput }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  
  const reqRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      // Check for touch capability AND screen size
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobile(hasTouch && isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      
      // P1: WASD + Q (Shoot)
      if (e.code === 'KeyA') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), left: true} as PlayerInput}));
      if (e.code === 'KeyD') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), right: true} as PlayerInput}));
      if (e.code === 'KeyW') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), up: true} as PlayerInput}));
      if (e.code === 'KeyS') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), down: true} as PlayerInput}));
      if (e.code === 'KeyQ') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), shoot: true} as PlayerInput}));

      // P2: Arrows + Slash (Shoot)
      if (e.code === 'ArrowLeft') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), left: true} as PlayerInput}));
      if (e.code === 'ArrowRight') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), right: true} as PlayerInput}));
      if (e.code === 'ArrowUp') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), up: true} as PlayerInput}));
      if (e.code === 'ArrowDown') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), down: true} as PlayerInput}));
      if (e.code === 'Slash' || e.code === 'NumpadDivide') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), shoot: true} as PlayerInput}));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
       // P1
      if (e.code === 'KeyA') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), left: false} as PlayerInput}));
      if (e.code === 'KeyD') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), right: false} as PlayerInput}));
      if (e.code === 'KeyW') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), up: false} as PlayerInput}));
      if (e.code === 'KeyS') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), down: false} as PlayerInput}));
      if (e.code === 'KeyQ') setInputs(prev => ({...prev, p1: {...(prev.p1 || {}), shoot: false} as PlayerInput}));

      // P2
      if (e.code === 'ArrowLeft') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), left: false} as PlayerInput}));
      if (e.code === 'ArrowRight') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), right: false} as PlayerInput}));
      if (e.code === 'ArrowUp') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), up: false} as PlayerInput}));
      if (e.code === 'ArrowDown') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), down: false} as PlayerInput}));
      if (e.code === 'Slash' || e.code === 'NumpadDivide') setInputs(prev => ({...prev, p2: {...(prev.p2 || {}), shoot: false} as PlayerInput}));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMobileInput = (playerId: 1 | 2, input: Partial<PlayerInput>) => {
    const pid = `p${playerId}`;
    setInputs(prev => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), ...input } as PlayerInput
    }));
  };

  const startGame = async (gameMode: 'PVP' | 'SOLO' | 'COOP', theme: string) => {
    // Initialize Audio Context on user gesture
    initAudio();
    
    setMode(GameMode.LOADING);
    setLoadingText(`Constructing ${theme} Arena...`);

    // Generate Map
    let map = DEFAULT_MAP;
    try {
      const generatedMap = await generateGameMap(theme);
      if (generatedMap) map = generatedMap;
    } catch (e) {
      console.error("Failed to gen map", e);
    }
    
    setGameState(initialGameState(gameMode, map));
    setMode(GameMode.PLAYING);
  };

  const gameLoop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    
    // Cap at ~60FPS
    if (delta > 16) {
      setGameState(prevState => {
        if (!prevState || prevState.winner) return prevState;
        return updateGame(prevState, inputs);
      });
      lastTimeRef.current = time;
    }

    reqRef.current = requestAnimationFrame(gameLoop);
  }, [inputs]);

  // Handle Bot Taunts when someone wins
  useEffect(() => {
    if (gameState?.winner && gameState.mode === 'SOLO') {
       const winnerName = gameState.players.find(p => p.id === gameState.winner)?.name || 'Unknown';
       const loserName = gameState.players.find(p => p.id !== gameState.winner)?.name || 'Unknown';
       
       getBotCommentary('MATCH_END', winnerName, loserName).then(msg => {
          setGameState(prev => prev ? {...prev, messages: [...prev.messages, msg]} : null);
       });
    }
  }, [gameState?.winner]);

  // Start/Stop Loop
  useEffect(() => {
    if (mode === GameMode.PLAYING) {
      reqRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [mode, gameLoop]);


  const resetMatch = async () => {
    if (!gameState) return;
    
    const p1Score = gameState.players[0].score;
    const p2Score = gameState.players[1].score;
    const currentMode = gameState.mode;
    
    setMode(GameMode.LOADING);
    setLoadingText("Generating Random Arena for Rematch...");

    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    
    let newMap = DEFAULT_MAP;
    try {
      const generatedMap = await generateGameMap(randomTheme);
      if (generatedMap) newMap = generatedMap;
    } catch (e) {
      console.error("Failed to gen map", e);
    }

    const newCtx = initialGameState(currentMode, newMap);
    newCtx.players[0].score = p1Score;
    newCtx.players[1].score = p2Score;
    
    setGameState(newCtx);
    setMode(GameMode.PLAYING);
  };

  const exitToMenu = () => {
    setMode(GameMode.MENU);
    setGameState(null);
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none">
      {mode === GameMode.MENU && (
        <MainMenu onStart={startGame} />
      )}

      {mode === GameMode.LOADING && (
        <div className="flex flex-col items-center justify-center h-full space-y-4 text-cyan-400">
           <Loader2 className="w-12 h-12 animate-spin" />
           <p className="font-mono text-sm animate-pulse">{loadingText}</p>
        </div>
      )}

      {mode === GameMode.PLAYING && gameState && (
        <>
          <GameCanvas 
            gameState={gameState} 
            onReset={resetMatch} 
            onExit={exitToMenu}
          />
          
          {/* Mobile Controls Overlay */}
          {isMobile && (
            <>
              <MobileControls playerId={1} onInputChange={handleMobileInput} color={gameState.players[0].color} />
              {/* Only show P2 controls in PVP or if P2 exists */}
              {(gameState.mode === 'PVP' || gameState.players.length > 1) && (
                <MobileControls playerId={2} onInputChange={handleMobileInput} color={gameState.players[1].color} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
