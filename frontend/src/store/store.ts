import { create } from 'zustand';

interface PracticeState {
  // Playback settings
  isPlaying: boolean;
  playbackRate: number;
  isLooping: boolean;
  
  // Stats tracker for the current segment
  replayCount: number;
  backJumpCount: number;
  typingDuration: number;
  
  // Timer state
  timerActive: boolean;

  // Actions
  setIsPlaying: (playing: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLooping: () => void;
  incrementReplay: () => void;
  incrementBackJump: () => void;
  incrementDuration: () => void;
  resetStats: () => void;
  startTimer: () => void;
  stopTimer: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  isPlaying: false,
  playbackRate: 1.0,
  isLooping: false,
  
  replayCount: 0,
  backJumpCount: 0,
  typingDuration: 0,
  timerActive: false,

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackRate: (rate) => set({ playbackRate: Math.max(0.5, Math.min(2.0, Number(rate.toFixed(1)))) }),
  toggleLooping: () => set((state) => ({ isLooping: !state.isLooping })),
  incrementReplay: () => set((state) => ({ replayCount: state.replayCount + 1 })),
  incrementBackJump: () => set((state) => ({ backJumpCount: state.backJumpCount + 1 })),
  incrementDuration: () => set((state) => ({ typingDuration: state.typingDuration + 1 })),
  resetStats: () => set({ replayCount: 0, backJumpCount: 0, typingDuration: 0 }),
  startTimer: () => set({ timerActive: true }),
  stopTimer: () => set({ timerActive: false }),
}));
