import { useEffect, useRef, useState } from 'react';

export function SimpleAudioManager() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsUserAction, setNeedsUserAction] = useState(true);

  useEffect(() => {
    const audio = new Audio('/bg-music.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    // Handler to start audio on first user interaction
    const startAudio = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
        setNeedsUserAction(false);
      } catch (e) {
        // Still blocked, keep waiting for interaction
      }
    };

    // Listen for user interaction
    if (needsUserAction) {
      document.addEventListener('click', startAudio, { once: true });
      document.addEventListener('keydown', startAudio, { once: true });
      document.addEventListener('touchstart', startAudio, { once: true });
    }

    return () => {
      document.removeEventListener('click', startAudio);
      document.removeEventListener('keydown', startAudio);
      document.removeEventListener('touchstart', startAudio);
      audio.pause();
    };
  }, [needsUserAction]);

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const playAudio = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        setNeedsUserAction(true);
      }
    }
  };

  return (
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
      {needsUserAction && (
        <div style={{ color: 'orange', fontWeight: 'bold', marginBottom: 8 }}>
          Click anywhere to enable background music
        </div>
      )}
      <button
        onClick={isPlaying ? pauseAudio : playAudio}
        style={{
          background: isPlaying ? '#ef4444' : '#22c55e',
          border: 'none',
          borderRadius: '6px',
          color: 'white',
          padding: '8px 16px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
      >
        {isPlaying ? '⏸️ Pause' : '▶️ Play'}
      </button>
    </div>
  );
} 