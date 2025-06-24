import { useEffect, useRef, useCallback, MutableRefObject } from 'react';

interface InputHandlerProps {
  positionRef: MutableRefObject<number>;
  onScroll?: (delta: number) => void;
  snapToAgent?: (direction: number) => void;
  isSnappingRef?: MutableRefObject<boolean>;
}

export function InputHandler({ positionRef, onScroll, snapToAgent, isSnappingRef }: InputHandlerProps) {
  const touchStartYRef = useRef<number>(0);
  const touchDeltaRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const accumulatedDeltaRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);

  // Handle scroll with smooth GSAP animation and agent snapping
  const handleScroll = useCallback((event: WheelEvent): void => {
    if (!event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      
      // Prevent scrolling during agent snapping
      if (isSnappingRef?.current) return;
      
      const now = Date.now();
      const scrollDirection = event.deltaY > 0 ? 1 : -1;
      const scrollIntensity = Math.min(Math.abs(event.deltaY), 100); // Cap intensity
      
      // Accumulate scroll delta for smoother experience
      accumulatedDeltaRef.current += scrollDirection * (scrollIntensity / 50) * 8;
      
      // Throttle scroll updates for better performance
      if (now - lastScrollTimeRef.current > 16) { // ~60fps
        lastScrollTimeRef.current = now;
        
        if (onScroll) {
          onScroll(accumulatedDeltaRef.current);
          accumulatedDeltaRef.current = 0; // Reset accumulator
        }
      }
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to detect end of scrolling for potential agent snapping
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        
        // Optional: Auto-snap to nearest agent after scrolling stops
        if (snapToAgent && !isSnappingRef?.current) {
          const positionInAgent = positionRef.current % 60;
          
          // If we're close to an agent boundary, snap to it
          if (positionInAgent > 45) {
            snapToAgent(1); // Snap forward
          } else if (positionInAgent < 15) {
            snapToAgent(-1); // Snap backward
          }
        }
      }, 150);
      
      isScrollingRef.current = true;
    }
  }, [positionRef, onScroll, snapToAgent, isSnappingRef]);

  // Keyboard controls with smooth scrolling and agent snapping
  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    // Prevent input during snapping
    if (isSnappingRef?.current) return;
    
    switch(event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        const upAmount = event.shiftKey ? -30 : -15;
        if (onScroll) {
          onScroll(upAmount);
        }
        break;
        
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        const downAmount = event.shiftKey ? 30 : 15;
        if (onScroll) {
          onScroll(downAmount);
        }
        break;
        
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        if (snapToAgent) {
          snapToAgent(-1); // Snap to previous agent
        }
        break;
        
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault();
        if (snapToAgent) {
          snapToAgent(1); // Snap to next agent
        }
        break;
        
      case ' ': // Spacebar
        event.preventDefault();
        if (snapToAgent) {
          snapToAgent(1); // Snap to next agent
        }
        break;
    }
  }, [onScroll, snapToAgent, isSnappingRef]);

  // Touch controls with smooth scrolling
  const handleTouchStart = useCallback((event: TouchEvent): void => {
    if (event.touches.length === 1) {
      touchStartYRef.current = event.touches[0].clientY;
      touchDeltaRef.current = 0;
      isScrollingRef.current = false;
      
      // Prevent scrolling during snapping
      if (isSnappingRef?.current) {
        event.preventDefault();
      }
    }
  }, [isSnappingRef]);

  const handleTouchMove = useCallback((event: TouchEvent): void => {
    if (event.touches.length === 1 && !isSnappingRef?.current) {
      const touchY = event.touches[0].clientY;
      const rawDelta = touchStartYRef.current - touchY;
      
      // Apply touch sensitivity
      const touchSensitivity = 0.8;
      touchDeltaRef.current = rawDelta * touchSensitivity;
      
      // Smooth scrolling for touch with minimum threshold
      if (Math.abs(touchDeltaRef.current) > 3) {
        const scrollAmount = (touchDeltaRef.current / 50) * 12;
        
        if (onScroll) {
          onScroll(scrollAmount);
        }
        
        touchStartYRef.current = touchY; // Update start position for continuous movement
        isScrollingRef.current = true;
      }
    }
  }, [onScroll, isSnappingRef]);

  const handleTouchEnd = useCallback((): void => {
    const finalDelta = touchDeltaRef.current;
    touchDeltaRef.current = 0;
    
    // Detect swipe gestures for agent snapping
    if (Math.abs(finalDelta) > 30 && snapToAgent && !isSnappingRef?.current) {
      const swipeDirection = finalDelta > 0 ? 1 : -1;
      
      // Set timeout to allow for smooth transition to agent snapping
      setTimeout(() => {
        if (!isScrollingRef.current) {
          snapToAgent(swipeDirection);
        }
      }, 100);
    }
    
    // Mark scrolling as ended after a delay
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 200);
  }, [snapToAgent, isSnappingRef]);

  // Mouse click handlers for agent navigation
  const handleMouseClick = useCallback((event: MouseEvent): void => {
    if (isSnappingRef?.current || !snapToAgent) return;
    
    const clickX = event.clientX;
    const screenWidth = window.innerWidth;
    
    // Divide screen into left and right halves for navigation
    if (clickX < screenWidth * 0.3) {
      snapToAgent(-1); // Left side - previous agent
    } else if (clickX > screenWidth * 0.7) {
      snapToAgent(1); // Right side - next agent
    }
  }, [snapToAgent, isSnappingRef]);

  useEffect(() => {
    // Add event listeners with proper options
    const wheelOptions = { passive: false };
    const touchOptions = { passive: false };
    
    document.addEventListener('wheel', handleScroll, wheelOptions);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, touchOptions);
    document.addEventListener('touchmove', handleTouchMove, touchOptions);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('click', handleMouseClick);

    // Cleanup
    return () => {
      document.removeEventListener('wheel', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('click', handleMouseClick);
      
      // Clear any pending timeouts
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll, handleKeyDown, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseClick]);

  return null; // This component only handles events
}