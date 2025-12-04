
// Simple Retro Synth using Web Audio API

let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number = 0.1) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const playSound = (type: 'shoot' | 'jump' | 'explosion' | 'powerup' | 'hit' | 'win') => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  switch (type) {
    case 'shoot':
      // High pitch decay
      createOscillator('square', 400 + Math.random() * 200, 0.1, 0.05);
      createOscillator('sawtooth', 600, 0.05, 0.05);
      break;
    case 'jump':
      // Rising pitch
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      break;
    case 'explosion':
      // Noise buffer (simulated with chaotic saw)
      for(let i=0; i<5; i++) {
        createOscillator('sawtooth', 50 + Math.random() * 100, 0.3, 0.1);
        createOscillator('square', 30 + Math.random() * 50, 0.3, 0.1);
      }
      break;
    case 'powerup':
      // Arpeggio
      setTimeout(() => createOscillator('sine', 600, 0.1, 0.1), 0);
      setTimeout(() => createOscillator('sine', 800, 0.1, 0.1), 100);
      setTimeout(() => createOscillator('sine', 1200, 0.2, 0.1), 200);
      break;
    case 'hit':
      createOscillator('triangle', 150, 0.1, 0.1);
      break;
    case 'win':
      createOscillator('square', 500, 0.2, 0.1);
      setTimeout(() => createOscillator('square', 600, 0.2, 0.1), 200);
      setTimeout(() => createOscillator('square', 800, 0.4, 0.1), 400);
      break;
  }
};
