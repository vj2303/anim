import { MutableRefObject } from 'react';
import * as THREE from 'three';

interface SectionConfig {
  position: number;
  type: 'agent' | 'milestone' | 'shape' | 'decorative';
  priority: number; // Higher priority = more likely to snap to
}

export class SmoothSectionScroller {
  private positionRef: MutableRefObject<number>;
  private pathRendererRef: MutableRefObject<any>;
  private sceneManagerRef: MutableRefObject<any>;
  private currentAgentRef: MutableRefObject<number>;
  private animationManagerRef: MutableRefObject<any>;
  
  // Scrolling state
  private isScrolling: boolean = false;
  private isSnapping: boolean = false;
  private scrollVelocity: number = 0;
  private scrollAccumulator: number = 0;
  private lastScrollTime: number = 0;
  private scrollDirection: number = 0;
  
  // Section definitions
  private sections: SectionConfig[] = [];
  private readonly AGENT_SPACING = 60;
  private readonly MILESTONE_SPACING = 40;
  private readonly SHAPE_SPACING = 15;
  private readonly DECORATIVE_SPACING = 8;
  
  // Scroll sensitivity and timing
  private readonly SCROLL_SENSITIVITY = 0.8;
  private readonly SNAP_THRESHOLD = 0.1; // Velocity threshold for snapping
  private readonly SCROLL_TIMEOUT = 200; // ms to wait before snapping
  private readonly MIN_SNAP_DISTANCE = 5; // Minimum distance to trigger snap
  
  // Animation properties
  private scrollTimeoutId: NodeJS.Timeout | null = null;
  private currentTween: any = null;
  
  constructor(
    positionRef: MutableRefObject<number>,
    pathRendererRef: MutableRefObject<any>,
    sceneManagerRef: MutableRefObject<any>,
    currentAgentRef: MutableRefObject<number>,
    animationManagerRef: MutableRefObject<any>
  ) {
    this.positionRef = positionRef;
    this.pathRendererRef = pathRendererRef;
    this.sceneManagerRef = sceneManagerRef;
    this.currentAgentRef = currentAgentRef;
    this.animationManagerRef = animationManagerRef;
    
    this.generateSections();
    this.setupEventListeners();
  }
  
  private generateSections(): void {
    this.sections = [];
    
    // Generate sections up to position 2000 (reasonable range)
    for (let pos = 0; pos <= 2000; pos++) {
      if (pos % this.AGENT_SPACING === 0 && pos > 0) {
        this.sections.push({ position: pos, type: 'agent', priority: 100 });
      } else if (pos % this.MILESTONE_SPACING === 0 && pos > 0 && pos % this.AGENT_SPACING !== 0) {
        this.sections.push({ position: pos, type: 'milestone', priority: 80 });
      } else if (pos % this.SHAPE_SPACING === 0 && pos > 0 && pos % this.AGENT_SPACING !== 0 && pos % this.MILESTONE_SPACING !== 0) {
        this.sections.push({ position: pos, type: 'shape', priority: 60 });
      } else if (pos % this.DECORATIVE_SPACING === 0 && pos > 0 && pos % this.AGENT_SPACING !== 0 && pos % this.MILESTONE_SPACING !== 0 && pos % this.SHAPE_SPACING !== 0) {
        this.sections.push({ position: pos, type: 'decorative', priority: 40 });
      }
    }
    
    // Sort by position for efficient searching
    this.sections.sort((a, b) => a.position - b.position);
  }
  
  private setupEventListeners(): void {
    // Mouse wheel
    document.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    
    // Keyboard
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Touch events
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    
    // Mouse events for section navigation
    document.addEventListener('click', this.handleClick.bind(this));
  }
  
  private handleWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) return;
    
    event.preventDefault();
    
    if (this.isSnapping) return;
    
    const now = Date.now();
    const deltaY = event.deltaY;
    const scrollIntensity = Math.min(Math.abs(deltaY), 100);
    const direction = deltaY > 0 ? 1 : -1;
    
    // Update scroll state
    this.scrollDirection = direction;
    this.scrollVelocity = scrollIntensity / 100;
    this.lastScrollTime = now;
    this.isScrolling = true;
    
    // Accumulate scroll for smoother movement
    this.scrollAccumulator += direction * scrollIntensity * this.SCROLL_SENSITIVITY * 0.15;
    
    // Apply immediate smooth movement
    this.applyImmediateScroll();
    
    // Clear existing timeout
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
    }
    
    // Set timeout for section snapping
    this.scrollTimeoutId = setTimeout(() => {
      this.handleScrollEnd();
    }, this.SCROLL_TIMEOUT);
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isSnapping) return;
    
    let targetSection: SectionConfig | null = null;
    
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        targetSection = this.findNearestSection(this.positionRef.current, -1, event.shiftKey ? 'agent' : 'any');
        break;
        
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        targetSection = this.findNearestSection(this.positionRef.current, 1, event.shiftKey ? 'agent' : 'any');
        break;
        
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        targetSection = this.findNearestSection(this.positionRef.current, -1, 'agent');
        break;
        
      case 'ArrowRight':
      case 'd':
      case 'D':
      case ' ':
        event.preventDefault();
        targetSection = this.findNearestSection(this.positionRef.current, 1, 'agent');
        break;
    }
    
    if (targetSection) {
      this.snapToSection(targetSection.position, this.getSnapDuration(targetSection.type));
    }
  }
  
  private touchStartY: number = 0;
  
  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.touchStartY = event.touches[0].clientY;
    }
  }
  
  private handleTouchMove(event: TouchEvent): void {
    if (this.isSnapping || event.touches.length !== 1) return;
    
    const touchY = event.touches[0].clientY;
    const deltaY = this.touchStartY - touchY;
    
    if (Math.abs(deltaY) > 5) {
      const direction = deltaY > 0 ? 1 : -1;
      this.scrollAccumulator += direction * Math.abs(deltaY) * 0.1;
      this.applyImmediateScroll();
      this.touchStartY = touchY;
    }
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    setTimeout(() => {
      this.handleScrollEnd();
    }, 100);
  }
  
  private handleClick(event: MouseEvent): void {
    if (this.isSnapping) return;
    
    const clickX = event.clientX;
    const screenWidth = window.innerWidth;
    
    let targetSection: SectionConfig | null = null;
    
    if (clickX < screenWidth * 0.2) {
      // Left edge - previous agent
      targetSection = this.findNearestSection(this.positionRef.current, -1, 'agent');
    } else if (clickX > screenWidth * 0.8) {
      // Right edge - next agent
      targetSection = this.findNearestSection(this.positionRef.current, 1, 'agent');
    } else if (clickX < screenWidth * 0.4) {
      // Left middle - previous section
      targetSection = this.findNearestSection(this.positionRef.current, -1, 'any');
    } else if (clickX > screenWidth * 0.6) {
      // Right middle - next section
      targetSection = this.findNearestSection(this.positionRef.current, 1, 'any');
    }
    
    if (targetSection) {
      this.snapToSection(targetSection.position, this.getSnapDuration(targetSection.type));
    }
  }
  
  private applyImmediateScroll(): void {
    if (Math.abs(this.scrollAccumulator) > 0.1) {
      const movement = this.scrollAccumulator * 0.3;
      const newPosition = Math.max(0, this.positionRef.current + movement);
      
      // Kill any existing tween
      if (this.currentTween && window.gsap) {
        this.currentTween.kill();
      }
      
      // Apply smooth immediate movement
      if (window.gsap) {
        this.currentTween = window.gsap.to(this.positionRef, {
          current: newPosition,
          duration: 0.1,
          ease: "power2.out",
          onUpdate: () => {
            this.updateScene();
          }
        });
      } else {
        this.positionRef.current = newPosition;
        this.updateScene();
      }
      
      this.scrollAccumulator *= 0.7; // Damping
    }
  }
  
  private handleScrollEnd(): void {
    if (this.isSnapping) return;
    
    this.isScrolling = false;
    this.scrollVelocity = 0;
    
    // Find the best section to snap to
    const nearestSection = this.findBestSnapTarget();
    
    if (nearestSection) {
      const distance = Math.abs(nearestSection.position - this.positionRef.current);
      
      // Only snap if we're close enough or if it's a high-priority section
      if (distance <= this.MIN_SNAP_DISTANCE || nearestSection.priority >= 80) {
        this.snapToSection(nearestSection.position, this.getSnapDuration(nearestSection.type));
      }
    }
  }
  
  private findBestSnapTarget(): SectionConfig | null {
    const currentPos = this.positionRef.current;
    const searchRange = 30; // Look within this range
    
    const nearSections = this.sections.filter(section => 
      Math.abs(section.position - currentPos) <= searchRange
    );
    
    if (nearSections.length === 0) return null;
    
    // Sort by priority and distance
    nearSections.sort((a, b) => {
      const aDist = Math.abs(a.position - currentPos);
      const bDist = Math.abs(b.position - currentPos);
      const aPriority = a.priority;
      const bPriority = b.priority;
      
      // Prioritize by section priority, then by distance
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return aDist - bDist;
    });
    
    return nearSections[0];
  }
  
  private findNearestSection(fromPosition: number, direction: number, type: 'agent' | 'milestone' | 'shape' | 'decorative' | 'any'): SectionConfig | null {
    const filteredSections = type === 'any' 
      ? this.sections 
      : this.sections.filter(s => s.type === type);
    
    let targetSection: SectionConfig | null = null;
    
    if (direction > 0) {
      // Find next section
      targetSection = filteredSections.find(s => s.position > fromPosition) || null;
    } else {
      // Find previous section
      const reverseSections = [...filteredSections].reverse();
      targetSection = reverseSections.find(s => s.position < fromPosition) || null;
    }
    
    return targetSection;
  }
  
  private snapToSection(targetPosition: number, duration: number = 1.0): void {
    if (this.isSnapping || targetPosition === this.positionRef.current) return;
    
    this.isSnapping = true;
    this.isScrolling = false;
    this.scrollAccumulator = 0;
    
    // Kill any existing tween
    if (this.currentTween && window.gsap) {
      this.currentTween.kill();
    }
    
    if (!window.gsap) {
      this.positionRef.current = targetPosition;
      this.updateScene();
      this.isSnapping = false;
      return;
    }
    
    // Calculate distance for easing selection
    const distance = Math.abs(targetPosition - this.positionRef.current);
    const ease = distance > 100 ? "power2.inOut" : "power3.out";
    
    // Notify animation manager about snapping
    if (this.animationManagerRef.current) {
      this.animationManagerRef.current.optimizeForGSAPAnimation(true);
    }
    
    this.currentTween = window.gsap.to(this.positionRef, {
      current: targetPosition,
      duration: duration,
      ease: ease,
      onUpdate: () => {
        this.updateScene();
      },
      onComplete: () => {
        this.isSnapping = false;
        if (this.animationManagerRef.current) {
          this.animationManagerRef.current.optimizeForGSAPAnimation(false);
        }
      }
    });
  }
  
  private getSnapDuration(sectionType: string): number {
    switch (sectionType) {
      case 'agent': return 1.5;
      case 'milestone': return 1.2;
      case 'shape': return 0.8;
      case 'decorative': return 0.6;
      default: return 1.0;
    }
  }
  
  private updateScene(): void {
    // Update path
    if (this.pathRendererRef.current) {
      this.pathRendererRef.current.createDottedPath();
    }
    
    // Update background
    const currentAgent = Math.floor(this.positionRef.current / 60);
    if (currentAgent !== this.currentAgentRef.current && this.sceneManagerRef.current) {
      this.currentAgentRef.current = currentAgent;
      this.sceneManagerRef.current.updateBackgroundForAgent(currentAgent);
    }
  }
  
  public update(): void {
    // Called every frame to handle any continuous updates
    if (this.isScrolling && Math.abs(this.scrollAccumulator) > 0.01) {
      this.applyImmediateScroll();
    }
  }
  
  public dispose(): void {
    // Clean up event listeners
    document.removeEventListener('wheel', this.handleWheel.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('click', this.handleClick.bind(this));
    
    // Clear timeouts
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
    }
    
    // Kill any active tweens
    if (this.currentTween && window.gsap) {
      this.currentTween.kill();
    }
  }
}