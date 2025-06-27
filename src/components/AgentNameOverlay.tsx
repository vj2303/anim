import * as THREE from 'three';
import { MutableRefObject } from 'react';

// Type for GSAP timeline
interface GSAPTimeline {
  set: (target: unknown, vars: unknown) => GSAPTimeline;
  to: (target: unknown, vars: unknown, position?: number | string) => GSAPTimeline;
}

// Type for GSAP object
interface GSAP {
  timeline: (options?: {
    onComplete?: () => void;
    onStart?: () => void;
    onUpdate?: () => void;
    delay?: number;
    repeat?: number;
    yoyo?: boolean;
  }) => GSAPTimeline;
}

export class AgentNameOverlay {
  private sceneRef: MutableRefObject<THREE.Scene | null>;
  private cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>;
  private positionRef: MutableRefObject<number>;
  private currentAgentRef: MutableRefObject<number>;
  private overlayGroup: THREE.Group | null = null;
  private currentOverlayText: THREE.Mesh | null = null;
  private isAnimating = false;
  private lastAgentIndex = -1;

  constructor(
    sceneRef: MutableRefObject<THREE.Scene | null>,
    cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>,
    positionRef: MutableRefObject<number>,
    currentAgentRef: MutableRefObject<number>
  ) {
    this.sceneRef = sceneRef;
    this.cameraRef = cameraRef;
    this.positionRef = positionRef;
    this.currentAgentRef = currentAgentRef;
  }

  // Initialize the overlay system
  public initialize(): void {
    if (!this.sceneRef.current) return;

    // Create overlay group
    this.overlayGroup = new THREE.Group();
    this.overlayGroup.name = 'AgentNameOverlay';
    this.sceneRef.current.add(this.overlayGroup);
  }

  // Update the overlay based on current position
  public update(): void {
    if (!this.sceneRef.current || !this.cameraRef.current || !this.overlayGroup) return;

    const currentAgent = this.currentAgentRef.current;
    
    // Check if we've moved to a new agent section
    if (currentAgent !== this.lastAgentIndex) {
      this.lastAgentIndex = currentAgent;
      this.showAgentName(currentAgent);
    }

    // Update overlay position to always be in front of camera
    this.updateOverlayPosition();
  }

  // Show agent name with animation
  private showAgentName(agentIndex: number): void {
    if (this.isAnimating) return;

    const agentNames = [
      'Claude', 'GPT-4', 'Gemini', 'Llama', 'Mistral', 'PaLM', 'Bard', 'Copilot',
      'Assistant', 'Helper', 'Guide', 'Mentor', 'Advisor', 'Expert', 'Specialist', 'Pro',
      'Master', 'Guru', 'Wizard', 'Sage'
    ];

    const agentName = agentNames[agentIndex] || `Agent ${agentIndex + 1}`;
    
    // Remove previous overlay
    this.removeCurrentOverlay();
    
    // Create new overlay text with agent-specific color
    this.createOverlayText(agentName, agentIndex);
    
    // Animate the overlay in
    this.animateOverlayIn();
  }

  // Create overlay text mesh
  private createOverlayText(agentName: string, agentIndex: number): void {
    if (!this.overlayGroup) return;

    // Create large text geometry
    const textGeometry = new THREE.PlaneGeometry(20, 6); // Very large for front screen display
    
    // Create canvas for text texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 2048; // Very high resolution
    canvas.height = 512;

    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Set text properties for very large, bold text
    const fontSize = 120; // Very large font size
    const fontWeight = 'bold';
    
    // Get agent-specific color scheme
    const colorScheme = this.getAgentColorScheme(agentIndex);
    
    // Create gradient text effect with mixed white and agent-specific colors
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ffffff'); // Start with white
    gradient.addColorStop(0.3, colorScheme.primary); // Transition to agent color
    gradient.addColorStop(0.5, colorScheme.secondary); // Middle with secondary color
    gradient.addColorStop(0.7, colorScheme.primary); // Back to primary color
    gradient.addColorStop(1, '#ffffff'); // End with white

    // Draw text with gradient and bold effect
    context.fillStyle = gradient;
    context.font = `${fontWeight} ${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Add multiple text shadows for glowing effect with mixed colors
    context.shadowColor = colorScheme.glow;
    context.shadowBlur = 20;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    
    // Draw the agent name
    context.fillText(agentName, canvas.width / 2, canvas.height / 2);

    // Add outer glow with mixed white and agent color
    context.shadowColor = '#ffffff';
    context.shadowBlur = 30;
    context.fillText(agentName, canvas.width / 2, canvas.height / 2);
    
    // Add final glow layer with agent color
    context.shadowColor = colorScheme.glow;
    context.shadowBlur = 15;
    context.fillText(agentName, canvas.width / 2, canvas.height / 2);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create material with texture
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0, // Start invisible
      side: THREE.DoubleSide,
      alphaTest: 0.1
    });

    this.currentOverlayText = new THREE.Mesh(textGeometry, material);
    // Add userData for click interaction
    this.currentOverlayText.userData = {
      isClickable: true,
      shapeType: 'agent_overlay',
      agentIndex: agentIndex
    };
    this.overlayGroup.add(this.currentOverlayText);
  }

  // Get agent-specific color scheme
  private getAgentColorScheme(agentIndex: number): { primary: string; secondary: string; glow: string } {
    const colorSchemes = [
      { primary: '#ff006e', secondary: '#ff0080', glow: '#ff006e' }, // Bright Pink
      { primary: '#00ff88', secondary: '#00ff00', glow: '#00ff88' }, // Bright Green
      { primary: '#ff00ff', secondary: '#ff0080', glow: '#ff00ff' }, // Magenta
      { primary: '#00ffff', secondary: '#0080ff', glow: '#00ffff' }, // Cyan
      { primary: '#ff8800', secondary: '#ff6600', glow: '#ff8800' }, // Bright Orange
      { primary: '#8800ff', secondary: '#6600ff', glow: '#8800ff' }, // Purple
      { primary: '#ff0080', secondary: '#ff006e', glow: '#ff0080' }, // Hot Pink
      { primary: '#00ff00', secondary: '#80ff00', glow: '#00ff00' }, // Bright Green
      { primary: '#ff1493', secondary: '#ff69b4', glow: '#ff1493' }, // Deep Pink
      { primary: '#00ced1', secondary: '#20b2aa', glow: '#00ced1' }, // Dark Turquoise
      { primary: '#ff4500', secondary: '#ff6347', glow: '#ff4500' }, // Orange Red
      { primary: '#9370db', secondary: '#8a2be2', glow: '#9370db' }, // Medium Purple
      { primary: '#32cd32', secondary: '#228b22', glow: '#32cd32' }, // Lime Green
      { primary: '#ff69b4', secondary: '#ff1493', glow: '#ff69b4' }, // Hot Pink
      { primary: '#00bfff', secondary: '#1e90ff', glow: '#00bfff' }, // Deep Sky Blue
      { primary: '#ffd700', secondary: '#ffa500', glow: '#ffd700' }, // Gold
      { primary: '#da70d6', secondary: '#ba55d3', glow: '#da70d6' }, // Orchid
      { primary: '#20b2aa', secondary: '#48d1cc', glow: '#20b2aa' }, // Light Sea Green
      { primary: '#ff6347', secondary: '#ff4500', glow: '#ff6347' }, // Tomato
      { primary: '#7b68ee', secondary: '#9370db', glow: '#7b68ee' }  // Medium Slate Blue
    ];

    return colorSchemes[agentIndex % colorSchemes.length];
  }

  // Animate overlay text in
  private animateOverlayIn(): void {
    if (!this.currentOverlayText) return;
    
    // Type assertion for GSAP
    const gsap = (window as unknown as { gsap?: GSAP }).gsap;
    if (!gsap) return;

    this.isAnimating = true;

    const timeline = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        // Auto-hide after 3 seconds
        setTimeout(() => {
          this.animateOverlayOut();
        }, 3000);
      }
    });

    // Scale and fade in animation
    timeline
      .set(this.currentOverlayText.scale, {
        x: 0.1,
        y: 0.1,
        z: 0.1
      })
      .to(this.currentOverlayText.material, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
      })
      .to(this.currentOverlayText.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.2,
        ease: "elastic.out(1, 0.5)"
      }, 0.2)
      .to(this.currentOverlayText.rotation, {
        y: Math.PI * 0.1,
        duration: 0.6,
        ease: "power2.inOut"
      }, 0.4)
      .to(this.currentOverlayText.rotation, {
        y: 0,
        duration: 0.6,
        ease: "power2.inOut"
      }, 1.0);
  }

  // Animate overlay text out
  private animateOverlayOut(): void {
    if (!this.currentOverlayText) return;
    
    // Type assertion for GSAP
    const gsap = (window as unknown as { gsap?: GSAP }).gsap;
    if (!gsap) return;

    this.isAnimating = true;

    const timeline = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        this.removeCurrentOverlay();
      }
    });

    // Scale and fade out animation
    timeline
      .to(this.currentOverlayText.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.4,
        ease: "power2.out"
      })
      .to(this.currentOverlayText.material, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut"
      }, 0.2)
      .to(this.currentOverlayText.scale, {
        x: 0.1,
        y: 0.1,
        z: 0.1,
        duration: 0.4,
        ease: "power2.inOut"
      }, 0.4);
  }

  // Update overlay position to always be in front of camera
  private updateOverlayPosition(): void {
    if (!this.cameraRef.current || !this.overlayGroup) return;

    const camera = this.cameraRef.current;
    
    // Position overlay in front of camera
    const distance = 15; // Distance in front of camera
    this.overlayGroup.position.copy(camera.position);
    this.overlayGroup.position.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(distance));
    
    // Make overlay face camera
    this.overlayGroup.lookAt(camera.position);
  }

  // Remove current overlay
  private removeCurrentOverlay(): void {
    if (this.currentOverlayText && this.overlayGroup) {
      this.overlayGroup.remove(this.currentOverlayText);
      this.currentOverlayText.geometry.dispose();
      // Ensure we dispose of the texture and material properly
      const material = this.currentOverlayText.material as THREE.MeshBasicMaterial;
      if (material.map) {
        material.map.dispose();
      }
      material.dispose();
      this.currentOverlayText = null;
    }
  }

  // Cleanup
  public dispose(): void {
    this.removeCurrentOverlay();
    if (this.overlayGroup && this.sceneRef.current) {
      this.sceneRef.current.remove(this.overlayGroup);
      this.overlayGroup = null;
    }
  }

  public getOverlayGroup(): THREE.Group | null {
    return this.overlayGroup;
  }
}


