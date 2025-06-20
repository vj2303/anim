import { useEffect, useRef, useState } from 'react';

export function SimpleAudioManager() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Create audio element
    const audio = new Audio('/bg-music.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    // Auto-play after user interaction
    const handleFirstInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        // Auto-start music on first interaction
        setTimeout(() => {
          playAudio();
        }, 500);
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      audio.pause();
    };
  }, [hasUserInteracted]);

  const playAudio = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('Failed to play audio:', error);
      }
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '12px',
      borderRadius: '8px',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <button
        onClick={togglePlayPause}
        disabled={!hasUserInteracted}
        style={{
          background: isPlaying ? '#ef4444' : '#22c55e',
          border: 'none',
          borderRadius: '6px',
          color: 'white',
          padding: '8px 16px',
          fontSize: '12px',
          cursor: hasUserInteracted ? 'pointer' : 'not-allowed',
          opacity: hasUserInteracted ? 1 : 0.5,
          fontWeight: 'bold'
        }}
      >
        {isPlaying ? '⏸️ Pause' : '▶️ Play'}
      </button>
      
      {!hasUserInteracted && (
        <div style={{ 
          fontSize: '10px', 
          color: '#ffaa00',
          marginTop: '4px',
          textAlign: 'center'
        }}>
          Click anywhere to enable
        </div>
      )}
    </div>
  );
}