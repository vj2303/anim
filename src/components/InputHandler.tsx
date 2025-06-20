import { useEffect, useRef, useCallback, MutableRefObject } from 'react';

interface InputHandlerProps {
  snapToAgent: (direction: number) => void;
  isSnappingRef: MutableRefObject<boolean>;
}

export function InputHandler({ snapToAgent, isSnappingRef }: InputHandlerProps) {
  const touchStartYRef = useRef<number>(0);
  const touchDeltaRef = useRef<number>(0);

  // Handle scroll with snapping
  const handleScroll = useCallback((event: WheelEvent): void => {
    if (!event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      
      if (isSnappingRef.current) return;
      
      const scrollDirection = event.deltaY > 0 ? 1 : -1;
      snapToAgent(scrollDirection);
    }
  }, [snapToAgent, isSnappingRef]);

  // Keyboard controls with snapping
  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
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
  }, [snapToAgent, isSnappingRef]);

  // Touch controls with snapping
  const handleTouchStart = useCallback((event: TouchEvent): void => {
    if (event.touches.length === 1) {
      touchStartYRef.current = event.touches[0].clientY;
      touchDeltaRef.current = 0;
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent): void => {
    if (event.touches.length === 1 && !isSnappingRef.current) {
      const touchY = event.touches[0].clientY;
      touchDeltaRef.current = touchStartYRef.current - touchY;
    }
  }, [isSnappingRef]);

  const handleTouchEnd = useCallback((): void => {
    if (Math.abs(touchDeltaRef.current) > 50 && !isSnappingRef.current) {
      const direction = touchDeltaRef.current > 0 ? 1 : -1;
      snapToAgent(direction);
    }
    touchDeltaRef.current = 0;
  }, [snapToAgent, isSnappingRef]);

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
  }, [handleScroll, handleKeyDown, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return null; // This component only handles events
}