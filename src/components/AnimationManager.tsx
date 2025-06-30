import { TextureManager } from './TextureManager';
import * as THREE from 'three';
import { MutableRefObject } from 'react';

// Define PathRenderer interface to match the actual class
// Using a more flexible approach that doesn't require index signature
interface PathRendererLike {
  dispose?(): void;
  // Add other commonly used methods as they're discovered
  initializeFloatingText?(scene: unknown): void;
  createDottedPath?(): void;
}

export class AnimationManager {
  private dotsArrayRef: MutableRefObject<THREE.Mesh[]>;
  private textMeshesRef: MutableRefObject<THREE.Mesh[]>;
  private positionRef: MutableRefObject<number>;
  private cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>;
  private textureManager: TextureManager;
  private onCameraPositionChange?: () => void;
  
  // Speed control properties - optimized for GSAP
  private scrollSpeed: number = 0.01; // Reduced since GSAP handles smoothing
  private autoScroll: boolean = false; // Keep disabled for manual control
  
  // Performance optimization
  private frameCount: number = 0;
  private skipFrames: number = 1; // Reduced skipping for smoother animations
  
  // PathRenderer reference for floating text updates
  private pathRendererRef: MutableRefObject<PathRendererLike | null> | null = null;
  
  // Animation state tracking
  private lastPosition: number = 0;
  private positionVelocity: number = 0;
  private smoothedVelocity: number = 0;

  constructor(
    dotsArrayRef: MutableRefObject<THREE.Mesh[]>,
    textMeshesRef: MutableRefObject<THREE.Mesh[]>,
    positionRef: MutableRefObject<number>,
    cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>,
    onCameraPositionChange?: () => void
  ) {
    this.dotsArrayRef = dotsArrayRef;
    this.textMeshesRef = textMeshesRef;
    this.positionRef = positionRef;
    this.cameraRef = cameraRef;
    this.onCameraPositionChange = onCameraPositionChange;
    this.textureManager = new TextureManager();
    this.lastPosition = positionRef.current;
  }

  // Method to set PathRenderer reference for floating text updates
  setPathRenderer(pathRendererRef: MutableRefObject<PathRendererLike | null>): void {
    this.pathRendererRef = pathRendererRef;
  }

  animate(): void {
    this.frameCount++;
    
    // Calculate velocity for motion-based effects
    const currentPosition = this.positionRef.current;
    this.positionVelocity = currentPosition - this.lastPosition;
    this.lastPosition = currentPosition;
    
    // Smooth velocity for more stable effects
    this.smoothedVelocity = this.smoothedVelocity * 0.8 + this.positionVelocity * 0.2;
    
    // Auto-scroll functionality (if enabled)
    if (this.autoScroll) {
      this.positionRef.current += this.scrollSpeed;
    }
    
    // Animate elements with motion-responsive frequency
    const isMoving = Math.abs(this.smoothedVelocity) > 0.01;
    const animationFrequency = isMoving ? 1 : 3; // Animate every frame when moving, every 3rd when still
    
    if (this.frameCount % animationFrequency === 0) {
      this.animateBlinking();
      this.animateFloatingText();
    }
    
    // Camera motion effects based on velocity
    this.updateCameraMotionEffects();
  }

  // Camera motion effects for enhanced visual feedback
  private updateCameraMotionEffects(): void {
    if (!this.cameraRef.current) return;
    
    const camera = this.cameraRef.current;
    const velocityIntensity = Math.min(Math.abs(this.smoothedVelocity) * 2, 1);
    
    // Subtle camera shake based on movement speed
    if (velocityIntensity > 0.1) {
      const shakeIntensity = velocityIntensity * 0.05;
      const time = Date.now() * 0.01;
      
      camera.position.x += Math.sin(time * 2) * shakeIntensity;
      camera.position.z += Math.cos(time * 1.5) * shakeIntensity * 0.5;
    }
    
    // Dynamic FOV based on velocity for speed sensation
    const baseFOV = 75;
    const fovVariation = velocityIntensity * 2;
    camera.fov = baseFOV + fovVariation;
    camera.updateProjectionMatrix();

    if (this.onCameraPositionChange) {
      this.onCameraPositionChange();
    }
  }

  // Enhanced blinking animation with motion responsiveness
  private animateBlinking(): void {
    const time = Date.now() * 0.001;
    const isMoving = Math.abs(this.smoothedVelocity) > 0.01;
    const motionMultiplier = isMoving ? 2 : 1; // Faster blinking when moving
        
    // Optimize: Only animate visible dots
    const maxDots = Math.min(this.dotsArrayRef.current.length, 150);
    
    for (let i = 0; i < maxDots; i++) {
      const dot = this.dotsArrayRef.current[i];
      if (!dot || !dot.material) continue;
            
      // Motion-responsive blinking effect
      const blinkOffset = i * 0.3;
      const blinkSpeed = (0.3 + this.smoothedVelocity * 0.5) * motionMultiplier;
      const blinkWave = Math.sin(time * blinkSpeed + blinkOffset);
            
      // Velocity-based random blink frequency
      const baseBlinkChance = isMoving ? 0.0003 : 0.0001;
      const velocityBlinkChance = Math.abs(this.smoothedVelocity) * 0.001;
      const randomBlink = Math.random() < (baseBlinkChance + velocityBlinkChance);
            
      if (randomBlink) {
        // Bright flash with velocity-based intensity
        const flashIntensity = 0.7 + Math.abs(this.smoothedVelocity) * 0.3;
        (dot.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
        (dot.material as THREE.MeshBasicMaterial).opacity = flashIntensity;
        
        // Scale effect based on motion
        const scaleEffect = 1 + Math.abs(this.smoothedVelocity) * 0.2;
        dot.scale.setScalar(Math.min(scaleEffect, 1.3));
      } else {
        // Standard pulsing with motion influence
        const intensity = (blinkWave + 1) * 0.5;
        const baseOpacity = isMoving ? 0.4 : 0.3;
        const opacity = baseOpacity + intensity * 0.6;
        
        (dot.material as THREE.MeshBasicMaterial).color.setHex(0x000000);
        (dot.material as THREE.MeshBasicMaterial).opacity = opacity;
        dot.scale.setScalar(1);
      }
    }
  }

  // Enhanced floating text animation with velocity effects
  private animateFloatingText(): void {
    const time = Date.now() * 0.001;
    const currentAgent = Math.floor(this.positionRef.current / 60);
    const isMoving = Math.abs(this.smoothedVelocity) > 0.01;
        
    this.textMeshesRef.current.forEach((textMesh, index) => {
      if (!textMesh) return;
            
      const isActive = index === currentAgent;
      const agentPosition = index * 60;
      const distanceFromCurrent = Math.abs(this.positionRef.current - agentPosition);
            
      // Update texture when state changes
      if (textMesh.userData.isActive !== isActive) {
        textMesh.userData.isActive = isActive;
        (textMesh.material as THREE.MeshBasicMaterial).map = this.textureManager.createTextTexture(
          textMesh.userData.text, 
          isActive
        );
        (textMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
            
      // Motion-responsive animations for active text
      if (isActive) {
        const motionIntensity = Math.abs(this.smoothedVelocity);
        
        // Enhanced bouncy animation with velocity response
        const bounceSpeed = 2 + motionIntensity * 3;
        const bounceIntensity = 0.4 + motionIntensity * 0.3;
        const bounce = Math.sin(time * bounceSpeed) * bounceIntensity;
        textMesh.position.y = textMesh.userData.baseY + bounce;
                
        // Dynamic scale animation
        const scaleSpeed = 1.8 + motionIntensity * 2;
        const scaleVariation = 0.08 + motionIntensity * 0.05;
        const scale = 1 + Math.sin(time * scaleSpeed) * scaleVariation;
        textMesh.scale.setScalar(scale);
                
        // Motion-based rotation
        const rotationIntensity = 0.08 + motionIntensity * 0.1;
        textMesh.rotation.y = Math.sin(time * 1.2) * rotationIntensity;
        
        // Velocity-based color shift for extra visual feedback
        if (isMoving && textMesh.material) {
          const material = textMesh.material as THREE.MeshBasicMaterial;
          const colorShift = Math.sin(time * 4) * 0.1;
          material.color.setRGB(1, 1 - colorShift, 1 - colorShift);
        }
      } else {
        // Gentle floating for inactive text with motion influence
        const floatSpeed = 0.8 + Math.abs(this.smoothedVelocity) * 0.5;
        const floatIntensity = 0.15 + Math.abs(this.smoothedVelocity) * 0.1;
        const floatTime = time * floatSpeed + index * 0.4;
        
        textMesh.position.y = textMesh.userData.baseY + Math.sin(floatTime) * floatIntensity;
        textMesh.scale.setScalar(1);
        textMesh.rotation.y = 0;
        
        // Restore normal color
        if (textMesh.material) {
          (textMesh.material as THREE.MeshBasicMaterial).color.setRGB(1, 1, 1);
        }
      }
            
      // Enhanced fade based on distance and motion
      const fadeDistance = isMoving ? 220 : 180;
      const baseFade = Math.max(0.2, 1 - Math.max(0, distanceFromCurrent - 60) / fadeDistance);
      
      // Motion-based opacity enhancement
      const motionOpacityBoost = isMoving ? Math.abs(this.smoothedVelocity) * 0.3 : 0;
      const finalOpacity = Math.min(1, baseFade + motionOpacityBoost);
      
      (textMesh.material as THREE.MeshBasicMaterial).opacity = finalOpacity;
    });
  }

  // Method to temporarily reduce animation intensity when near agents
  public reduceAnimationsNearAgent(): void {
    this.skipFrames = 2; // Slight reduction for better performance near agents
    this.scrollSpeed = Math.max(0.005, this.scrollSpeed * 0.8);
  }

  // Method to restore normal animation intensity
  public restoreNormalAnimations(): void {
    this.skipFrames = 1; // Back to normal frame processing
    this.scrollSpeed = 0.01; // Restore normal speed
  }

  // Method to get current motion state for external systems
  public getMotionState(): { isMoving: boolean; velocity: number; smoothedVelocity: number } {
    return {
      isMoving: Math.abs(this.smoothedVelocity) > 0.01,
      velocity: this.positionVelocity,
      smoothedVelocity: this.smoothedVelocity
    };
  }

  // Method to set scroll speed dynamically
  setScrollSpeed(speed: number): void {
    this.scrollSpeed = speed;
  }

  // Method to enable/disable auto-scrolling
  setAutoScroll(enabled: boolean): void {
    this.autoScroll = enabled;
  }

  // Method to get current scroll speed
  getScrollSpeed(): number {
    return this.scrollSpeed;
  }

  // Enhanced method for performance optimization during GSAP animations
  public optimizeForGSAPAnimation(isAnimating: boolean): void {
    if (isAnimating) {
      // Reduce animation frequency during GSAP tweens
      this.skipFrames = 2;
    } else {
      // Restore normal frequency when GSAP animation completes
      this.skipFrames = 1;
    }
  }

  // Dispose method for cleanup
  public dispose(): void {
    // Clean up any resources if needed
    this.pathRendererRef = null;
  }
}