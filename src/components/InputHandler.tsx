import { useEffect, useRef } from 'react';

export function InputHandler({ snapToAgent, isSnappingRef }) {
  const touchStartYRef = useRef(0);
  const touchDeltaRef = useRef(0);

  // Handle scroll with snapping
  const handleScroll = (event) => {
    if (!event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      
      if (isSnappingRef.current) return;
      
      const scrollDirection = event.deltaY > 0 ? 1 : -1;
      snapToAgent(scrollDirection);
    }
  };

  // Keyboard controls with snapping
  const handleKeyDown = (event) => {
    if (isSnappingRef.current) return;
    
    switch(event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        snapToAgent(-1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        snapToAgent(1);
        break;
    }
  };

  // Touch controls with snapping
  const handleTouchStart = (event) => {
    if (event.touches.length === 1) {
      touchStartYRef.current = event.touches[0].clientY;
      touchDeltaRef.current = 0;
    }
  };

  const handleTouchMove = (event) => {
    if (event.touches.length === 1 && !isSnappingRef.current) {
      const touchY = event.touches[0].clientY;
      touchDeltaRef.current = touchStartYRef.current - touchY;
    }
  };

  const handleTouchEnd = (event) => {
    if (Math.abs(touchDeltaRef.current) > 50 && !isSnappingRef.current) {
      const direction = touchDeltaRef.current > 0 ? 1 : -1;
      snapToAgent(direction);
    }
    touchDeltaRef.current = 0;
  };

  useEffect(() => {
    // Add event listeners
    document.addEventListener('wheel', handleScroll, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('wheel', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleKeyDown, handleScroll, handleTouchEnd, handleTouchMove]);

  return null; // This component only handles events
}