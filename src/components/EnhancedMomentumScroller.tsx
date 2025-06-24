import { MutableRefObject } from 'react';

interface MomentumScrollerConfig {
  friction: number;
  snapStrength: number;
  snapRadius: number;
  minSnapVelocity: number;
  maxSnapVelocity: number;
}

interface ScrollSection {
  position: number;
  type: 'agent' | 'milestone' | 'shape' | 'decorative' | 'micro';
  magnetism: number; // How strongly it attracts scroll
  snapDuration: number;
}

// Interface for PathRenderer-like objects
interface PathRendererLike {
  createDottedPath?(): void;
  dispose?(): void;
}

// Interface for SceneManager-like objects
interface SceneManagerLike {
  updateBackgroundForAgent?(agentIndex: number): void;
  dispose?(): void;
}

// Interface for AnimationManager-like objects
interface AnimationManagerLike {
  optimizeForGSAPAnimation?(isAnimating: boolean): void;
  dispose?(): void;
}

// Interface for GSAP tween
interface GSAPTween {
  kill(): void;
}

// Interface for GSAP
interface GSAP {
  to: (target: unknown, vars: unknown) => GSAPTween;
}

export class EnhancedMomentumScroller {
  private positionRef: MutableRefObject<number>;
  private pathRendererRef: MutableRefObject<PathRendererLike | null>;
  private sceneManagerRef: MutableRefObject<SceneManagerLike | null>;
  private currentAgentRef: MutableRefObject<number>;
  private animationManagerRef: MutableRefObject<AnimationManagerLike | null>;
  
  // Momentum physics
  private velocity: number = 0;
  private acceleration: number = 0;
  private friction: number = 0.02;
  private maxVelocity: number = 20;
  private minVelocity: number = 0.05;
  
  // Scrolling state
  private isScrolling: boolean = false;
  private isSnapping: boolean = false;
  private lastUpdateTime: number = 0;
  private accumulatedDelta: number = 0;
  
  // Section management
  private sections: ScrollSection[] = [];
  private nearestSection: ScrollSection | null = null;
  private lastTargetSection: ScrollSection | null = null;
  
  // Input handling
  private inputAccumulator: number = 0;
  private inputTimeout: NodeJS.Timeout | null = null;
  private lastInputTime: number = 0;
  
  // Touch handling
  private touchState = {
    startY: 0,
    lastY: 0,
    startTime: 0,
    isActive: false,
    velocity: 0
  };
  
  // GSAP references
  private currentTween: GSAPTween | null = null;
  private momentumTween: GSAPTween | null = null;
  
  // Configuration
  private config: MomentumScrollerConfig = {
    friction: 0.92,
    snapStrength: 1.5,
    snapRadius: 25,
    minSnapVelocity: 0.1,
    maxSnapVelocity: 20
  };
  
  private lastPlayedAgentIndex: number | null = null;
  
  private isPhysicsPaused: boolean = false;
  private physicsLoopId: number | null = null;
  
  constructor(
    positionRef: MutableRefObject<number>,
    pathRendererRef: MutableRefObject<PathRendererLike | null>,
    sceneManagerRef: MutableRefObject<SceneManagerLike | null>,
    currentAgentRef: MutableRefObject<number>,
    animationManagerRef: MutableRefObject<AnimationManagerLike | null>
  ) {
    this.positionRef = positionRef;
    this.pathRendererRef = pathRendererRef;
    this.sceneManagerRef = sceneManagerRef;
    this.currentAgentRef = currentAgentRef;
    this.animationManagerRef = animationManagerRef;
    
    this.generateSections();
    this.setupEventListeners();
    this.startPhysicsLoop();
  }
  
  private generateSections(): void {
    this.sections = [];
    
    // Generate comprehensive section map
    for (let pos = 0; pos <= 3000; pos++) {
      if (pos === 0) {
        this.sections.push({ position: 0, type: 'agent', magnetism: 100, snapDuration: 1.5 });
      } else if (pos % 60 === 0) {
        // AI Agents - highest priority
        this.sections.push({ position: pos, type: 'agent', magnetism: 100, snapDuration: 1.8 });
      } else if (pos % 40 === 0) {
        // Milestone markers - high priority
        this.sections.push({ position: pos, type: 'milestone', magnetism: 85, snapDuration: 1.4 });
      } else if (pos % 15 === 0) {
        // Shape sections - medium priority
        this.sections.push({ position: pos, type: 'shape', magnetism: 70, snapDuration: 1.0 });
      } else if (pos % 8 === 0) {
        // Decorative elements - lower priority
        this.sections.push({ position: pos, type: 'decorative', magnetism: 55, snapDuration: 0.8 });
      } else if (pos % 3 === 0) {
        // Micro sections for ultra-smooth scrolling
        this.sections.push({ position: pos, type: 'micro', magnetism: 30, snapDuration: 0.4 });
      }
    }
    
    // Sort by position for efficient searching
    this.sections.sort((a, b) => a.position - b.position);
  }
  
  private setupEventListeners(): void {
    document.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('click', this.handleClick.bind(this));
  }
  
  private handleWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    
    const now = Date.now();
    const delta = event.deltaY;
    const intensity = Math.min(Math.abs(delta), 120);
    const direction = Math.sign(delta);
    
    // Add input to accumulator with momentum
    this.inputAccumulator += direction * intensity * 0.008;
    this.lastInputTime = now;
    this.isScrolling = true;
    
    // Apply immediate momentum
    this.velocity += direction * intensity * 0.012;
    this.velocity = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.velocity));
    
    // Clear existing input timeout
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }
    
    // Set timeout to detect scroll end
    this.inputTimeout = setTimeout(() => {
      this.handleInputEnd();
    }, 150);
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    if (this.isSnapping) return;
    
    let targetSection: ScrollSection | null = null;
    let snapType: 'agent' | 'any' = 'any';
    
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        snapType = event.shiftKey ? 'agent' : 'any';
        targetSection = this.findTargetSection(-1, snapType);
        break;
        
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        snapType = event.shiftKey ? 'agent' : 'any';
        targetSection = this.findTargetSection(1, snapType);
        break;
        
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        targetSection = this.findTargetSection(-1, 'agent');
        break;
        
      case 'ArrowRight':
      case 'd':
      case 'D':
      case ' ':
        event.preventDefault();
        targetSection = this.findTargetSection(1, 'agent');
        break;
    }
    
    if (targetSection) {
      this.snapToSection(targetSection);
    }
  }
  
  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchState = {
        startY: touch.clientY,
        lastY: touch.clientY,
        startTime: Date.now(),
        isActive: true,
        velocity: 0
      };
      
      // Stop any ongoing momentum
      this.killAllTweens();
      this.velocity = 0;
    }
  }
  
  private handleTouchMove(event: TouchEvent): void {
    if (!this.touchState.isActive || event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    const currentY = touch.clientY;
    const deltaY = this.touchState.lastY - currentY;
    const now = Date.now();
    const timeDelta = now - this.touchState.startTime;
    
    if (Math.abs(deltaY) > 2) {
      // Calculate touch velocity
      this.touchState.velocity = deltaY / Math.max(timeDelta, 1) * 50;
      
      // Apply immediate movement
      this.velocity += deltaY * 0.15;
      this.velocity = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.velocity));
      
      this.touchState.lastY = currentY;
      this.isScrolling = true;
    }
  }
  
  private handleTouchEnd(): void {
    if (!this.touchState.isActive) return;
    
    // Apply final momentum from touch gesture
    const finalVelocity = Math.max(-30, Math.min(30, this.touchState.velocity));
    this.velocity += finalVelocity * 0.3;
    
    this.touchState.isActive = false;
    
    setTimeout(() => {
      this.handleInputEnd();
    }, 100);
  }
  
  private handleClick(event: MouseEvent): void {
    if (this.isSnapping) return;
    
    // Check if click is on audio controls (top-right area)
    const clickX = event.clientX;
    const clickY = event.clientY;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Define audio controls area (top-right corner)
    const audioControlsArea = {
      x: screenWidth - 200, // 200px from right edge
      y: 0,
      width: 200,
      height: 100 // 100px from top
    };
    
    // Check if click is within audio controls area
    if (clickX >= audioControlsArea.x && 
        clickY <= audioControlsArea.height) {
      return; // Ignore clicks on audio controls
    }
    
    let targetSection: ScrollSection | null = null;
    
    if (clickX < screenWidth * 0.15) {
      targetSection = this.findTargetSection(-1, 'agent');
    } else if (clickX > screenWidth * 0.85) {
      targetSection = this.findTargetSection(1, 'agent');
    } else if (clickX < screenWidth * 0.35) {
      targetSection = this.findTargetSection(-1, 'any');
    } else if (clickX > screenWidth * 0.65) {
      targetSection = this.findTargetSection(1, 'any');
    }
    
    if (targetSection) {
      this.snapToSection(targetSection);
    }
  }
  
  private startPhysicsLoop(): void {
    const updatePhysics = () => {
      if (!this.isPhysicsPaused) {
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime || 16;
        this.lastUpdateTime = now;
        this.updateMomentum(deltaTime);
        this.updatePosition();
        this.checkForAutoSnap();
      }
      this.physicsLoopId = requestAnimationFrame(updatePhysics);
    };
    updatePhysics();
  }
  
  private updateMomentum(deltaTime: number): void {
    if (this.isSnapping) return;
    
    // Apply friction
    this.velocity *= Math.pow(this.friction, deltaTime / 16);
    
    // Apply input accumulator
    if (Math.abs(this.inputAccumulator) > 0.001) {
      this.velocity += this.inputAccumulator * 0.5;
      this.inputAccumulator *= 0.85; // Smooth decay
    }
    
    // Apply magnetic forces from nearby sections
    this.applyMagneticForces();
    
    // Clamp velocity
    if (Math.abs(this.velocity) < this.minVelocity) {
      this.velocity = 0;
    } else {
      this.velocity = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.velocity));
    }
  }
  
  private applyMagneticForces(): void {
    if (Math.abs(this.velocity) > 5) return; // Only apply when slowing down
    
    const currentPos = this.positionRef.current;
    const nearSections = this.sections.filter(s => 
      Math.abs(s.position - currentPos) <= this.config.snapRadius
    );
    
    for (const section of nearSections) {
      const distance = section.position - currentPos;
      const absDistance = Math.abs(distance);
      
      if (absDistance > 0.5 && absDistance <= this.config.snapRadius) {
        const force = (section.magnetism / 100) * (1 - absDistance / this.config.snapRadius);
        const magneticForce = Math.sign(distance) * force * 0.02;
        this.velocity += magneticForce;
      }
    }
  }
  
  private updatePosition(): void {
    if (Math.abs(this.velocity) > 0.01) {
      const newPosition = Math.max(0, this.positionRef.current + this.velocity);
      
      if (newPosition !== this.positionRef.current) {
        this.positionRef.current = newPosition;
        this.updateScene();
      }
    }
  }
  
  private checkForAutoSnap(): void {
    if (this.isSnapping || this.isScrolling) return;
    
    const currentVel = Math.abs(this.velocity);
    
    if (currentVel > 0.1 && currentVel < 2) {
      // Find best snap target based on current velocity and position
      const targetSection = this.findBestSnapTarget();
      
      if (targetSection) {
        const distance = Math.abs(targetSection.position - this.positionRef.current);
        const shouldSnap = distance <= this.config.snapRadius && 
                          targetSection.magnetism >= 55;
        
        if (shouldSnap) {
          this.snapToSection(targetSection);
        }
      }
    }
  }
  
  private findBestSnapTarget(): ScrollSection | null {
    const currentPos = this.positionRef.current;
    const velocityDirection = Math.sign(this.velocity);
    
    // Look ahead in velocity direction
    const searchAhead = velocityDirection * Math.min(Math.abs(this.velocity) * 2, 20);
    const predictedPos = currentPos + searchAhead;
    
    const candidates = this.sections.filter(s => {
      const distance = Math.abs(s.position - predictedPos);
      return distance <= this.config.snapRadius * 1.5;
    });
    
    if (candidates.length === 0) return null;
    
    // Score candidates based on distance, magnetism, and velocity alignment
    const scored = candidates.map(section => {
      const distance = Math.abs(section.position - currentPos);
      const predictedDistance = Math.abs(section.position - predictedPos);
      const magnetismScore = section.magnetism / 100;
      const proximityScore = 1 - (distance / this.config.snapRadius);
      const predictionScore = 1 - (predictedDistance / (this.config.snapRadius * 1.5));
      
      return {
        section,
        score: magnetismScore * 0.4 + proximityScore * 0.4 + predictionScore * 0.2
      };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.section || null;
  }
  
  private findTargetSection(direction: number, type: 'agent' | 'any'): ScrollSection | null {
    const currentPos = this.positionRef.current;
    const candidates = type === 'agent' 
      ? this.sections.filter(s => s.type === 'agent')
      : this.sections.filter(s => s.magnetism >= 55); // Skip micro sections for manual navigation
    
    if (direction > 0) {
      return candidates.find(s => s.position > currentPos + 1) || null;
    } else {
      return [...candidates].reverse().find(s => s.position < currentPos - 1) || null;
    }
  }
  
  private playTransitionSound(): void {
    const audio = new Audio('/transition.wav');
    audio.volume = 0.9;
    audio.play().catch(() => {}); // Ignore play errors (e.g., user gesture required)
  }
  
  private snapToSection(targetSection: ScrollSection): void {
    if (this.isSnapping) return;
    
    this.isSnapping = true;
    this.isScrolling = false;
    this.velocity = 0;
    this.inputAccumulator = 0;
    
    this.killAllTweens();
    
    // Type assertion for GSAP
    const gsap = (window as unknown as { gsap?: GSAP }).gsap;
    if (!gsap) {
      this.positionRef.current = targetSection.position;
      this.updateScene();
      this.isSnapping = false;
      return;
    }
    
    const distance = Math.abs(targetSection.position - this.positionRef.current);
    const baseDuration = targetSection.snapDuration;
    const adjustedDuration = Math.min(baseDuration * (1 + distance / 100), baseDuration * 2);
    
    // Notify animation manager
    if (this.animationManagerRef.current) {
      this.animationManagerRef.current.optimizeForGSAPAnimation?.(true);
    }
    
    this.currentTween = gsap.to(this.positionRef, {
      current: targetSection.position,
      duration: adjustedDuration,
      ease: "power2.out",
      onUpdate: () => {
        this.updateScene();
      },
      onComplete: () => {
        this.isSnapping = false;
        this.lastTargetSection = targetSection;
        
        if (this.animationManagerRef.current) {
          this.animationManagerRef.current.optimizeForGSAPAnimation?.(false);
        }
      }
    });
    
    // Play sound if snapping to an agent
    if (targetSection.type === 'agent') {
      this.playTransitionSound();
    }
  }
  
  private handleInputEnd(): void {
    this.isScrolling = false;
    this.inputAccumulator *= 0.5; // Reduce remaining input
    
    // Let momentum carry for a bit before checking for auto-snap
    setTimeout(() => {
      if (!this.isScrolling && !this.isSnapping) {
        this.checkForAutoSnap();
      }
    }, 200);
  }
  
  private killAllTweens(): void {
    // Type assertion for GSAP
    const gsap = (window as unknown as { gsap?: GSAP }).gsap;
    if (gsap) {
      if (this.currentTween) {
        this.currentTween.kill();
        this.currentTween = null;
      }
      if (this.momentumTween) {
        this.momentumTween.kill();
        this.momentumTween = null;
      }
    }
  }
  
  private updateScene(): void {
    if (this.pathRendererRef.current) {
      this.pathRendererRef.current.createDottedPath?.();
    }
    const currentAgent = Math.floor(this.positionRef.current / 60);
    if (currentAgent !== this.currentAgentRef.current && this.sceneManagerRef.current) {
      this.currentAgentRef.current = currentAgent;
      this.sceneManagerRef.current.updateBackgroundForAgent?.(currentAgent);
    }
    // Play transition sound when passing through a new agent section
    if (currentAgent !== this.lastPlayedAgentIndex) {
      this.lastPlayedAgentIndex = currentAgent;
      if (currentAgent > 0) { // Only play for valid agent indices
        this.playTransitionSound();
      }
    }
  }
  
  public update(): void {
    // Called every frame - physics loop handles updates automatically
  }
  
  public getState(): { isScrolling: boolean; velocity: number; nearestSection: string | null } {
    const nearest = this.findBestSnapTarget();
    return {
      isScrolling: this.isScrolling || this.isSnapping,
      velocity: this.velocity,
      nearestSection: nearest ? `${nearest.type}:${nearest.position}` : null
    };
  }
  
  public dispose(): void {
    document.removeEventListener('wheel', this.handleWheel.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    document.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    document.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    document.removeEventListener('click', this.handleClick.bind(this));
    
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }
    
    this.killAllTweens();
  }
  
  public pausePhysicsLoop(): void {
    this.isPhysicsPaused = true;
  }
  
  public resumePhysicsLoop(): void {
    this.isPhysicsPaused = false;
  }
}