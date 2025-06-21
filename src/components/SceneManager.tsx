import * as THREE from 'three';

export class SceneManager {
  private scene: THREE.Scene | null = null;
  private backgroundSphere: THREE.Mesh | null = null;
  private backgroundTexture: THREE.CanvasTexture | null = null;
  private currentGradientIndex: number = 0;
  
  // GSAP transition properties
  private transitionProgress: { value: number } = { value: 0 };
  private previousGradientCanvas: HTMLCanvasElement | null = null;
  private currentGradientCanvas: HTMLCanvasElement | null = null;

  createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    this.scene = scene;
        
    // Create initial gradient background
    this.createBackgroundGradient(scene, 0);
        
    return scene;
  }

  private createGradientCanvas(agentIndex: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 512; // Increased resolution for better quality
    canvas.height = 512;
    const context = canvas.getContext('2d');
        
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
        
    const gradient = context.createLinearGradient(0, 0, 0, 512);
        
    // Enhanced gradient colors for different agents
    const gradientColors = [
      { top: '#7EACF1', middle: '#9BC4F0', bottom: '#E8F4FD' }, // Agent 0 - Blue sky
      { top: '#FFB6C1', middle: '#FFC0CB', bottom: '#FFF0F5' }, // Agent 1 - Pink sunrise
      { top: '#98FB98', middle: '#90EE90', bottom: '#F0FFF0' }, // Agent 2 - Green nature
      { top: '#DDA0DD', middle: '#E6E6FA', bottom: '#F8F8FF' }, // Agent 3 - Purple twilight
      { top: '#F0E68C', middle: '#FFFACD', bottom: '#FFFFFE' }, // Agent 4 - Golden sunset
      { top: '#FFA07A', middle: '#FFB6C1', bottom: '#FFF5EE' }, // Agent 5 - Coral warmth
      { top: '#87CEEB', middle: '#B0E0E6', bottom: '#F0F8FF' }, // Agent 6 - Sky blue
      { top: '#D8BFD8', middle: '#E6E6FA', bottom: '#F8F8FF' }, // Agent 7 - Thistle
      { top: '#F5DEB3', middle: '#F5F5DC', bottom: '#FFFEF7' }, // Agent 8 - Wheat
      { top: '#FFE4E1', middle: '#FFF0F5', bottom: '#FFFAFA' }, // Agent 9 - Misty rose
      { top: '#E0FFFF', middle: '#F0FFFF', bottom: '#F8FFFF' }, // Agent 10 - Light cyan
      { top: '#FFEFD5', middle: '#FFF8DC', bottom: '#FFFFFE' }, // Agent 11 - Papaya whip
      { top: '#E6E6FA', middle: '#F0F0FF', bottom: '#F8F8FF' }, // Agent 12 - Lavender
      { top: '#F0FFF0', middle: '#F5FFF5', bottom: '#FAFFFA' }, // Agent 13 - Honeydew
      { top: '#FFF8DC', middle: '#FFFACD', bottom: '#FFFFFE' }, // Agent 14 - Cornsilk
    ];
        
    const colors = gradientColors[agentIndex % gradientColors.length];
        
    gradient.addColorStop(0, colors.top);
    gradient.addColorStop(0.6, colors.middle);
    gradient.addColorStop(1, colors.bottom);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    // Add subtle texture for more visual interest
    this.addSubtleTexture(context, agentIndex);
        
    return canvas;
  }

  private addSubtleTexture(context: CanvasRenderingContext2D, agentIndex: number): void {
    // Create very subtle noise texture
    const imageData = context.getImageData(0, 0, 512, 512);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Add very subtle noise (±2 to RGB values)
      const noise = (Math.random() - 0.5) * 4;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
    
    context.putImageData(imageData, 0, 0);
    
    // Add agent-specific subtle patterns
    context.globalAlpha = 0.03;
    context.fillStyle = '#ffffff';
    
    switch (agentIndex % 5) {
      case 0:
        // Diagonal lines
        for (let i = 0; i < 512; i += 40) {
          context.fillRect(i, 0, 1, 512);
        }
        break;
      case 1:
        // Dots pattern
        for (let x = 0; x < 512; x += 60) {
          for (let y = 0; y < 512; y += 60) {
            context.beginPath();
            context.arc(x, y, 2, 0, Math.PI * 2);
            context.fill();
          }
        }
        break;
      case 2:
        // Horizontal lines
        for (let i = 0; i < 512; i += 50) {
          context.fillRect(0, i, 512, 1);
        }
        break;
      case 3:
        // Circular pattern
        context.beginPath();
        context.arc(256, 256, 200, 0, Math.PI * 2);
        context.stroke();
        break;
      case 4:
        // Grid pattern
        for (let i = 0; i < 512; i += 80) {
          context.fillRect(i, 0, 1, 512);
          context.fillRect(0, i, 512, 1);
        }
        break;
    }
    
    context.globalAlpha = 1;
  }

  private createBackgroundGradient(scene: THREE.Scene, agentIndex: number): void {
    const canvas = this.createGradientCanvas(agentIndex);
        
    // Create or update background texture
    if (this.backgroundTexture) {
      this.backgroundTexture.dispose();
    }
    this.backgroundTexture = new THREE.CanvasTexture(canvas);
    this.backgroundTexture.needsUpdate = true;
        
    // Create or update background sphere
    if (this.backgroundSphere) {
      scene.remove(this.backgroundSphere);
      this.backgroundSphere.geometry.dispose();
      (this.backgroundSphere.material as THREE.MeshBasicMaterial).dispose();
    }
        
    const backgroundGeometry = new THREE.SphereGeometry(500, 64, 64); // Higher quality
    const backgroundMaterial = new THREE.MeshBasicMaterial({
      map: this.backgroundTexture,
      side: THREE.BackSide
    });
    this.backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    scene.add(this.backgroundSphere);
        
    // Update fog color to match the new gradient
    const gradientColors = [
      '#7EACF1', '#FFB6C1', '#98FB98', '#DDA0DD', '#F0E68C',
      '#FFA07A', '#87CEEB', '#D8BFD8', '#F5DEB3', '#FFE4E1',
      '#E0FFFF', '#FFEFD5', '#E6E6FA', '#F0FFF0', '#FFF8DC'
    ];
    
    const fogColor = new THREE.Color(gradientColors[agentIndex % gradientColors.length]);
    scene.fog = new THREE.Fog(fogColor.getHex(), 80, 300);
    
    this.currentGradientIndex = agentIndex;
  }

  // Smooth GSAP-powered background transition
  public updateBackgroundForAgent(agentIndex: number): void {
    if (!this.scene || agentIndex === this.currentGradientIndex) return;
    
    // Store current state for transition
    this.previousGradientCanvas = this.currentGradientCanvas;
    this.currentGradientCanvas = this.createGradientCanvas(agentIndex);
    
    // Use GSAP for smooth transition if available
    if (window.gsap) {
      this.transitionProgress.value = 0;
      
      window.gsap.to(this.transitionProgress, {
        value: 1,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => {
          this.updateTransitionFrame();
        },
        onComplete: () => {
          // Finalize transition
          this.createBackgroundGradient(this.scene!, agentIndex);
        }
      });
    } else {
      // Fallback: instant transition
      this.createBackgroundGradient(this.scene, agentIndex);
    }
  }

  private updateTransitionFrame(): void {
    if (!this.previousGradientCanvas || !this.currentGradientCanvas || !this.backgroundTexture) return;
    
    // Create transition canvas
    const transitionCanvas = document.createElement('canvas');
    transitionCanvas.width = 512;
    transitionCanvas.height = 512;
    const context = transitionCanvas.getContext('2d');
    
    if (!context) return;
    
    // Blend between previous and current gradients
    context.globalAlpha = 1 - this.transitionProgress.value;
    context.drawImage(this.previousGradientCanvas, 0, 0);
    
    context.globalAlpha = this.transitionProgress.value;
    context.drawImage(this.currentGradientCanvas, 0, 0);
    
    // Update texture
    const newTexture = new THREE.CanvasTexture(transitionCanvas);
    if (this.backgroundSphere && this.backgroundSphere.material) {
      (this.backgroundSphere.material as THREE.MeshBasicMaterial).map = newTexture;
      (this.backgroundSphere.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
  }

  public setupLighting(scene: THREE.Scene): void {
    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
    scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(15, 25, 10);
    directionalLight.castShadow = true;
    
    // Enhanced shadow settings
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    
    scene.add(directionalLight);
    
    // Add subtle fill light
    const fillLight = new THREE.DirectionalLight(0x9090ff, 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);
    
    // Add rim light for better depth
    const rimLight = new THREE.DirectionalLight(0xffff90, 0.2);
    rimLight.position.set(0, 5, -20);
    scene.add(rimLight);
  }

  // Method to get current gradient info for external systems
  public getCurrentGradientInfo(): { index: number; colors: string[] } {
    const gradientColors = [
      '#7EACF1', '#FFB6C1', '#98FB98', '#DDA0DD', '#F0E68C',
      '#FFA07A', '#87CEEB', '#D8BFD8', '#F5DEB3', '#FFE4E1',
      '#E0FFFF', '#FFEFD5', '#E6E6FA', '#F0FFF0', '#FFF8DC'
    ];
    
    return {
      index: this.currentGradientIndex,
      colors: gradientColors
    };
  }

  public dispose(): void {
    if (this.backgroundTexture) {
      this.backgroundTexture.dispose();
    }
    if (this.backgroundSphere) {
      this.backgroundSphere.geometry.dispose();
      (this.backgroundSphere.material as THREE.MeshBasicMaterial).dispose();
    }
    
    // Clean up transition canvases
    this.previousGradientCanvas = null;
    this.currentGradientCanvas = null;
  }
}

// Extend window interface for GSAP
declare global {
  interface Window {
    gsap?: {
      to: (target: any, vars: any) => void;
      killTweensOf: (target: any) => void;
    };
  }
}