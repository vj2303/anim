'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SimpleAudioManagerProps {
  audioSrc?: string;
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
  showControls?: boolean;
}

export class SimpleAudioManager {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.5;
  private isMuted: boolean = false;
  private previousVolume: number = 0.5;

  constructor(
    private audioSrc: string = '/bg-music.mp3',
    private autoPlay: boolean = true,
    private loop: boolean = true,
    private initialVolume: number = 0.5
  ) {
    this.volume = initialVolume;
    this.previousVolume = initialVolume;
    this.initializeAudio();
  }

  private initializeAudio(): void {
    try {
      this.audio = new Audio(this.audioSrc);
      this.audio.loop = this.loop;
      this.audio.volume = this.volume;
      this.audio.preload = 'auto';

      // Add event listeners
      this.audio.addEventListener('canplaythrough', () => {
        if (this.autoPlay) {
          this.play();
        }
      });

      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
      });

      this.audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
      });

      // Handle user interaction requirement for autoplay
      const handleUserInteraction = () => {
        if (this.autoPlay && this.audio && !this.isPlaying) {
          this.play();
        }
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      };

      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);

    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  public play(): void {
    if (this.audio && !this.isPlaying) {
      this.audio.play().then(() => {
        this.isPlaying = true;
      }).catch((error) => {
        console.error('Failed to play audio:', error);
      });
    }
  }

  public pause(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  public stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public mute(): void {
    if (!this.isMuted) {
      this.previousVolume = this.volume;
      this.setVolume(0);
      this.isMuted = true;
    }
  }

  public unmute(): void {
    if (this.isMuted) {
      this.setVolume(this.previousVolume);
      this.isMuted = false;
    }
  }

  public toggleMute(): void {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  public isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  public isAudioMuted(): boolean {
    return this.isMuted;
  }

  public destroy(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }
}

// React Hook for using the SimpleAudioManager
export const useSimpleAudioManager = (
  audioSrc: string = '/bg-music.mp3',
  autoPlay: boolean = true,
  loop: boolean = true,
  initialVolume: number = 0.5
) => {
  const audioManagerRef = useRef<SimpleAudioManager | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    audioManagerRef.current = new SimpleAudioManager(audioSrc, autoPlay, loop, initialVolume);

    // Update state when audio manager changes
    const updateState = () => {
      if (audioManagerRef.current) {
        setIsPlaying(audioManagerRef.current.isAudioPlaying());
        setVolume(audioManagerRef.current.getVolume());
        setIsMuted(audioManagerRef.current.isAudioMuted());
      }
    };

    // Poll for state updates
    const interval = setInterval(updateState, 100);

    return () => {
      clearInterval(interval);
      if (audioManagerRef.current) {
        audioManagerRef.current.destroy();
      }
    };
  }, [audioSrc, autoPlay, loop, initialVolume]);

  const play = useCallback(() => {
    audioManagerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioManagerRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    audioManagerRef.current?.stop();
  }, []);

  const setVolumeCallback = useCallback((newVolume: number) => {
    audioManagerRef.current?.setVolume(newVolume);
  }, []);

  const toggleMute = useCallback(() => {
    audioManagerRef.current?.toggleMute();
  }, []);

  return {
    play,
    pause,
    stop,
    setVolume: setVolumeCallback,
    toggleMute,
    isPlaying,
    volume,
    isMuted,
  };
};

// React Component for Audio Controls UI
export const AudioControls: React.FC<{
  audioManager: ReturnType<typeof useSimpleAudioManager>;
  className?: string;
}> = ({ audioManager, className = '' }) => {
  const { play, pause, setVolume, toggleMute, isPlaying, volume, isMuted } = audioManager;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className={`fixed top-4 right-4 z-50 bg-black/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 ${className}`}>
      <button
        onClick={handlePlayPause}
        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <button
        onClick={handleMuteToggle}
        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.793a1 1 0 011.414.076zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.793a1 1 0 011.414.076z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.793a1 1 0 011.414.076z" clipRule="evenodd" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          title="Volume"
        />
      </div>
    </div>
  );
};

// Main Audio Manager Component
export const SimpleAudioManagerComponent: React.FC<SimpleAudioManagerProps> = ({
  audioSrc = '/bg-music.mp3',
  autoPlay = true,
  loop = true,
  volume = 0.5,
  showControls = true,
}) => {
  const audioManager = useSimpleAudioManager(audioSrc, autoPlay, loop, volume);

  return (
    <>
      {showControls && <AudioControls audioManager={audioManager} />}
    </>
  );
};

export default SimpleAudioManagerComponent; 