
import React from 'react';
import { GameMode } from '../types';
import { Gamepad2, Users, Bot, Skull } from 'lucide-react';
import { THEMES } from '../constants';

interface MainMenuProps {
  onStart: (mode: 'PVP' | 'SOLO' | 'COOP', theme: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const [selectedTheme, setSelectedTheme] = React.useState(THEMES[0]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white relative overflow-hidden">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="z-10 text-center space-y-8 p-6 max-w-md w-full">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold pixel-font text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-sm">
            PIXEL DUEL
          </h1>
          <h2 className="text-xl md:text-2xl font-bold pixel-font text-yellow-400">
            ARENA
          </h2>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-xl border border-slate-700 shadow-xl space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-slate-400 font-bold uppercase tracking-wider">Select Arena Theme</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto scrollbar-hide">
              {THEMES.map(theme => (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className={`px-3 py-2 text-xs rounded transition-all ${
                    selectedTheme === theme 
                      ? 'bg-cyan-600 text-white shadow-lg scale-105' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
             <button
              onClick={() => onStart('SOLO', selectedTheme)}
              className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg border-b-4 border-blue-800 hover:border-blue-700"
            >
              <Bot className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="text-lg leading-none">SOLO VS BOT</span>
                <span className="text-xs opacity-75 font-normal">Train against Gemini AI</span>
              </div>
            </button>

            <button
              onClick={() => onStart('PVP', selectedTheme)}
              className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg border-b-4 border-purple-800 hover:border-purple-700"
            >
              <Gamepad2 className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="text-lg leading-none">LOCAL DUEL</span>
                <span className="text-xs opacity-75 font-normal">Split Screen PvP</span>
              </div>
            </button>
            
            <button
              onClick={() => onStart('COOP', selectedTheme)}
              className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg border-b-4 border-red-800 hover:border-red-700"
            >
              <Skull className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="text-lg leading-none">HORDE MODE</span>
                <span className="text-xs opacity-75 font-normal">Co-op Survival</span>
              </div>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          <p>P1: WASD + Q (Shoot) | P2: Arrows + / (Shoot)</p>
          <p>Mobile: Landscape Mode Required</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
