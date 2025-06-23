import * as THREE from 'three';

export class SceneManager {
  private scene: THREE.Scene | null = null;
  private backgroundSphere: THREE.Mesh | null = null;
  private backgroundTexture: THREE.CanvasTexture | null = null;
  private currentGradientIndex: number = 0;
  private baseColor: string = '#3b82f6'; // Blue base color
  private whiteGradientColor: string = '#ffffff'; // White gradient color
  
  // GSAP transition properties
  private transitionProgress: { value: number } = { value: 0 };
  private previousGradientCanvas: HTMLCanvasElement | null = null;
  private currentGradientCanvas: HTMLCanvasElement | null = null;

  // Agent-specific color schemes (light, pastel colors)
  private static agentColorSchemes = [
    { primary: '#ffd6e0', secondary: '#fff0f5', glow: '#ffd6e0' }, // Light Pink
    { primary: '#d0fff6', secondary: '#e0fff9', glow: '#d0fff6' }, // Light Aqua
    { primary: '#e0eaff', secondary: '#f0f8ff', glow: '#e0eaff' }, // Light Blue
    { primary: '#eaffd0', secondary: '#f5ffe0', glow: '#eaffd0' }, // Light Green
    { primary: '#fffad0', secondary: '#fffbe0', glow: '#fffad0' }, // Light Yellow
    { primary: '#ffe0d6', secondary: '#fff5f0', glow: '#ffe0d6' }, // Light Peach
    { primary: '#e0fff6', secondary: '#f0fffa', glow: '#e0fff6' }, // Light Mint
    { primary: '#f6e0ff', secondary: '#f9e0ff', glow: '#f6e0ff' }, // Light Lavender
    { primary: '#e0fff0', secondary: '#e0fff7', glow: '#e0fff0' }, // Light Teal
    { primary: '#fff0e0', secondary: '#fff7e0', glow: '#fff0e0' }, // Light Apricot
    { primary: '#e0f7ff', secondary: '#e0faff', glow: '#e0f7ff' }, // Light Sky
    { primary: '#f0ffe0', secondary: '#f7ffe0', glow: '#f0ffe0' }, // Light Lime
    { primary: '#ffe0f7', secondary: '#ffe0fa', glow: '#ffe0f7' }, // Light Rose
    { primary: '#e0f0ff', secondary: '#e0f7ff', glow: '#e0f0ff' }, // Light Periwinkle
    { primary: '#f0e0ff', secondary: '#f7e0ff', glow: '#f0e0ff' }, // Light Violet
    { primary: '#e0fff5', secondary: '#e0fff9', glow: '#e0fff5' }, // Light Seafoam
    { primary: '#fffbe0', secondary: '#fffde0', glow: '#fffbe0' }, // Light Cream
    { primary: '#e0ffe6', secondary: '#e0fff0', glow: '#e0ffe6' }, // Light Mint Green
    { primary: '#e0e0ff', secondary: '#f0f0ff', glow: '#e0e0ff' }, // Light Lilac
    { primary: '#f5e0ff', secondary: '#f9e0ff', glow: '#f5e0ff' }  // Light Orchid
  ];

  createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    this.scene = scene;
        
    // Create initial gradient background
    this.createBackgroundGradient(scene, 0);
        
    return scene;
  }

  private createGradientCanvas(agentIndex: number): HTMLCanvasElement {
    // Use agent-specific color scheme
    const colorScheme = SceneManager.agentColorSchemes[agentIndex % SceneManager.agentColorSchemes.length];
    this.baseColor = colorScheme.primary;
    this.whiteGradientColor = colorScheme.secondary;
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Failed to get 2D context');
      return canvas;
    }
    
    // Clear canvas first
    context.clearRect(0, 0, 512, 512);
    
    // Create primary radial gradient with white center to colored edges
    const primaryGradient = context.createRadialGradient(256, 256, 0, 256, 256, 300);
    primaryGradient.addColorStop(0, this.whiteGradientColor); // Pure white center
    primaryGradient.addColorStop(0.2, this.blendColors(this.whiteGradientColor, this.baseColor, 0.8)); // Light blend
    primaryGradient.addColorStop(0.4, this.blendColors(this.whiteGradientColor, this.baseColor, 0.6)); // Medium blend
    primaryGradient.addColorStop(0.7, this.blendColors(this.whiteGradientColor, this.baseColor, 0.3)); // More color
    primaryGradient.addColorStop(1, this.baseColor); // Pure color edges
    
    // Apply the primary gradient
    context.fillStyle = primaryGradient;
    context.fillRect(0, 0, 512, 512);
    
    // Add secondary linear gradient overlay for depth
    const secondaryGradient = context.createLinearGradient(0, 0, 512, 512);
    secondaryGradient.addColorStop(0, this.hexToRgba(this.whiteGradientColor, 0.6)); // 60% opacity white
    secondaryGradient.addColorStop(0.3, this.hexToRgba(this.whiteGradientColor, 0.3)); // 30% opacity white
    secondaryGradient.addColorStop(0.7, this.hexToRgba(this.whiteGradientColor, 0.15)); // 15% opacity white
    secondaryGradient.addColorStop(1, this.hexToRgba(this.whiteGradientColor, 0)); // Transparent
    
    context.fillStyle = secondaryGradient;
    context.fillRect(0, 0, 512, 512);
    
    // Add tertiary vertical gradient for more depth
    const tertiaryGradient = context.createLinearGradient(0, 0, 0, 512);
    tertiaryGradient.addColorStop(0, this.hexToRgba(this.whiteGradientColor, 0.4)); // White at top
    tertiaryGradient.addColorStop(0.5, this.hexToRgba(this.whiteGradientColor, 0.2)); // Medium in middle
    tertiaryGradient.addColorStop(1, this.hexToRgba(this.baseColor, 0.2)); // Color tint at bottom
    
    context.fillStyle = tertiaryGradient;
    context.fillRect(0, 0, 512, 512);
    
    // Add additional white gradient overlays for more prominent effects
    this.addWhiteGradientOverlays(context, {
      primary: this.baseColor,
      secondary: this.whiteGradientColor,
      accent: this.blendColors(this.baseColor, this.whiteGradientColor, 0.5)
    });
    
    // Add dynamic texture patterns
    this.addDynamicTexturePattern(context, agentIndex, {
      primary: this.baseColor,
      secondary: this.whiteGradientColor,
      accent: this.blendColors(this.baseColor, this.whiteGradientColor, 0.3)
    });
    
    return canvas;
  }

  // Helper method to convert hex to rgba
  private hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Helper method to blend two colors
  private blendColors(color1: string, color2: string, ratio: number): string {
    // Remove # and ensure we have valid hex colors
    const hex1 = color1.replace('#', '').padEnd(6, '0');
    const hex2 = color2.replace('#', '').padEnd(6, '0');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 * ratio + r2 * (1 - ratio));
    const g = Math.round(g1 * ratio + g2 * (1 - ratio));
    const b = Math.round(b1 * ratio + b2 * (1 - ratio));
    
    // Ensure values are within bounds
    const rHex = Math.max(0, Math.min(255, r)).toString(16).padStart(2, '0');
    const gHex = Math.max(0, Math.min(255, g)).toString(16).padStart(2, '0');
    const bHex = Math.max(0, Math.min(255, b)).toString(16).padStart(2, '0');
    
    return `#${rHex}${gHex}${bHex}`;
  }

  // Enhanced method to add dynamic texture patterns
  private addDynamicTexturePattern(context: CanvasRenderingContext2D, agentIndex: number, colors: { primary: string; secondary: string; accent: string }): void {
    context.globalAlpha = 0.35;
    
    const patternTypes = ['gradient', 'stripes', 'dots', 'waves', 'grid', 'circles', 'diamonds', 'hexagons', 'spiral', 'stars'];
    const patternIndex = agentIndex % patternTypes.length;
    const pattern = patternTypes[patternIndex];
    
    switch (pattern) {
      case 'gradient':
        const overlayGradient = context.createRadialGradient(256, 256, 0, 256, 256, 300);
        overlayGradient.addColorStop(0, this.hexToRgba(colors.secondary, 0.6));
        overlayGradient.addColorStop(0.3, this.hexToRgba(colors.secondary, 0.4));
        overlayGradient.addColorStop(0.6, this.hexToRgba(colors.accent, 0.3));
        overlayGradient.addColorStop(1, this.hexToRgba(colors.primary, 0.2));
        context.fillStyle = overlayGradient;
        context.fillRect(0, 0, 512, 512);
        break;
        
      case 'stripes':
        context.strokeStyle = this.hexToRgba(colors.secondary, 0.4);
        context.lineWidth = 4;
        for (let i = -512; i < 1024; i += 50) {
          context.beginPath();
          context.moveTo(i, 0);
          context.lineTo(i + 512, 512);
          context.stroke();
        }
        context.strokeStyle = this.hexToRgba(colors.accent, 0.25);
        context.lineWidth = 2;
        for (let i = -512; i < 1024; i += 100) {
          context.beginPath();
          context.moveTo(i, 0);
          context.lineTo(i + 512, 512);
          context.stroke();
        }
        break;
        
      case 'dots':
        context.fillStyle = this.hexToRgba(colors.secondary, 0.5);
        for (let x = 0; x < 512; x += 70) {
          for (let y = 0; y < 512; y += 70) {
            context.beginPath();
            context.arc(x, y, 5, 0, Math.PI * 2);
            context.fill();
          }
        }
        context.fillStyle = this.hexToRgba(colors.accent, 0.3);
        for (let x = 35; x < 512; x += 70) {
          for (let y = 35; y < 512; y += 70) {
            context.beginPath();
            context.arc(x, y, 3, 0, Math.PI * 2);
            context.fill();
          }
        }
        break;
        
      case 'waves':
        context.strokeStyle = this.hexToRgba(colors.secondary, 0.35);
        context.lineWidth = 3;
        for (let i = 0; i < 512; i += 40) {
          context.beginPath();
          for (let x = 0; x < 512; x += 6) {
            const y = i + Math.sin(x * 0.02 + agentIndex * 0.1) * 30;
            if (x === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          }
          context.stroke();
        }
        break;
        
      case 'grid':
        context.strokeStyle = this.hexToRgba(colors.secondary, 0.3);
        context.lineWidth = 2;
        for (let i = 0; i < 512; i += 50) {
          context.beginPath();
          context.moveTo(i, 0);
          context.lineTo(i, 512);
          context.stroke();
        }
        for (let i = 0; i < 512; i += 50) {
          context.beginPath();
          context.moveTo(0, i);
          context.lineTo(512, i);
          context.stroke();
        }
        break;
        
      case 'circles':
        context.strokeStyle = this.hexToRgba(colors.secondary, 0.4);
        context.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          context.beginPath();
          context.arc(256, 256, 40 + i * 60, 0, Math.PI * 2);
          context.stroke();
        }
        break;
        
      case 'diamonds':
        context.fillStyle = this.hexToRgba(colors.secondary, 0.35);
        for (let x = 0; x < 512; x += 80) {
          for (let y = 0; y < 512; y += 80) {
            context.beginPath();
            context.moveTo(x, y - 40);
            context.lineTo(x + 40, y);
            context.lineTo(x, y + 40);
            context.lineTo(x - 40, y);
            context.closePath();
            context.fill();
          }
        }
        break;
        
      case 'hexagons':
        context.fillStyle = this.hexToRgba(colors.secondary, 0.3);
        for (let x = 0; x < 512; x += 80) {
          for (let y = 0; y < 512; y += 80) {
            this.drawHexagon(context, x, y, 35);
          }
        }
        break;
        
      case 'spiral':
        context.strokeStyle = this.hexToRgba(colors.secondary, 0.4);
        context.lineWidth = 3;
        context.beginPath();
        for (let angle = 0; angle < Math.PI * 10; angle += 0.08) {
          const radius = angle * 8;
          const x = 256 + radius * Math.cos(angle);
          const y = 256 + radius * Math.sin(angle);
          if (angle === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();
        break;
        
      case 'stars':
        context.fillStyle = this.hexToRgba(colors.secondary, 0.45);
        for (let i = 0; i < 25; i++) {
          const x = 60 + (i * 15) % 392;
          const y = 60 + Math.floor(i / 25) * 80;
          this.drawStar(context, x, y, 10);
        }
        break;
    }
    
    context.globalAlpha = 1.0;
  }

  private drawStar(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    context.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) {
        context.moveTo(px, py);
      } else {
        context.lineTo(px, py);
      }
    }
    context.closePath();
    context.fill();
  }

  private drawHexagon(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    context.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) {
        context.moveTo(px, py);
      } else {
        context.lineTo(px, py);
      }
    }
    context.closePath();
    context.fill();
  }

  private createBackgroundGradient(scene: THREE.Scene, agentIndex: number): void {
    console.log(`Creating background gradient for agent ${agentIndex}`);
    
    // Store current canvas for transitions
    this.currentGradientCanvas = this.createGradientCanvas(agentIndex);
    
    // Dispose of old texture
    if (this.backgroundTexture) {
      this.backgroundTexture.dispose();
    }
    
    // Create new texture from canvas
    this.backgroundTexture = new THREE.CanvasTexture(this.currentGradientCanvas);
    this.backgroundTexture.needsUpdate = true;
    this.backgroundTexture.wrapS = THREE.RepeatWrapping;
    this.backgroundTexture.wrapT = THREE.RepeatWrapping;
    
    // Remove old background sphere if it exists
    if (this.backgroundSphere) {
      scene.remove(this.backgroundSphere);
      this.backgroundSphere.geometry.dispose();
      if (this.backgroundSphere.material instanceof THREE.Material) {
        this.backgroundSphere.material.dispose();
      }
    }
    
    // Create new background sphere with proper material
    const backgroundGeometry = new THREE.SphereGeometry(500, 64, 64);
    const backgroundMaterial = new THREE.MeshBasicMaterial({
      map: this.backgroundTexture,
      side: THREE.BackSide,
      transparent: false,
      opacity: 1.0
    });
    
    this.backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    scene.add(this.backgroundSphere);
    
    // Update fog color to match the blended base color
    const fogColor = new THREE.Color(this.blendColors(this.baseColor, this.whiteGradientColor, 0.7));
    scene.fog = new THREE.Fog(fogColor.getHex(), 80, 300);
    
    this.currentGradientIndex = agentIndex;
    
    console.log(`Background gradient applied with colors:`, {
      base: this.baseColor,
      white: this.whiteGradientColor,
      fog: fogColor.getHexString()
    });
  }

  public updateBackgroundForAgent(agentIndex: number): void {
    if (!this.scene || agentIndex === this.currentGradientIndex) return;
    
    console.log(`Updating background for agent ${agentIndex}`);
    
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
    
    // Clear canvas
    context.clearRect(0, 0, 512, 512);
    
    // Blend between previous and current gradients
    context.globalAlpha = 1 - this.transitionProgress.value;
    context.drawImage(this.previousGradientCanvas, 0, 0);
    
    context.globalAlpha = this.transitionProgress.value;
    context.drawImage(this.currentGradientCanvas, 0, 0);
    
    context.globalAlpha = 1.0;
    
    // Update texture
    if (this.backgroundSphere && this.backgroundSphere.material instanceof THREE.MeshBasicMaterial) {
      const newTexture = new THREE.CanvasTexture(transitionCanvas);
      newTexture.needsUpdate = true;
      
      // Dispose old texture
      if (this.backgroundSphere.material.map) {
        this.backgroundSphere.material.map.dispose();
      }
      
      this.backgroundSphere.material.map = newTexture;
      this.backgroundSphere.material.needsUpdate = true;
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

  // Add additional white gradient overlays
  private addWhiteGradientOverlays(context: CanvasRenderingContext2D, colors: { primary: string; secondary: string; accent: string }): void {
    // First white gradient overlay - radial from center
    const whiteGradient1 = context.createRadialGradient(256, 256, 0, 256, 256, 200);
    whiteGradient1.addColorStop(0, this.hexToRgba(colors.secondary, 0.5));
    whiteGradient1.addColorStop(0.5, this.hexToRgba(colors.secondary, 0.25));
    whiteGradient1.addColorStop(1, this.hexToRgba(colors.secondary, 0));
    context.fillStyle = whiteGradient1;
    context.fillRect(0, 0, 512, 512);
    
    // Second white gradient overlay - linear from top
    const whiteGradient2 = context.createLinearGradient(0, 0, 0, 512);
    whiteGradient2.addColorStop(0, this.hexToRgba(colors.secondary, 0.4));
    whiteGradient2.addColorStop(0.3, this.hexToRgba(colors.secondary, 0.2));
    whiteGradient2.addColorStop(0.7, this.hexToRgba(colors.secondary, 0.1));
    whiteGradient2.addColorStop(1, this.hexToRgba(colors.secondary, 0));
    context.fillStyle = whiteGradient2;
    context.fillRect(0, 0, 512, 512);
    
    // Third white gradient overlay - diagonal
    const whiteGradient3 = context.createLinearGradient(0, 0, 512, 512);
    whiteGradient3.addColorStop(0, this.hexToRgba(colors.secondary, 0.3));
    whiteGradient3.addColorStop(0.5, this.hexToRgba(colors.secondary, 0.15));
    whiteGradient3.addColorStop(1, this.hexToRgba(colors.secondary, 0));
    context.fillStyle = whiteGradient3;
    context.fillRect(0, 0, 512, 512);
    
    // Fourth white gradient overlay - reverse diagonal
    const whiteGradient4 = context.createLinearGradient(512, 0, 0, 512);
    whiteGradient4.addColorStop(0, this.hexToRgba(colors.secondary, 0.25));
    whiteGradient4.addColorStop(0.5, this.hexToRgba(colors.secondary, 0.12));
    whiteGradient4.addColorStop(1, this.hexToRgba(colors.secondary, 0));
    context.fillStyle = whiteGradient4;
    context.fillRect(0, 0, 512, 512);
    
    // Fifth white gradient overlay - center radial burst
    const whiteGradient5 = context.createRadialGradient(256, 256, 50, 256, 256, 350);
    whiteGradient5.addColorStop(0, this.hexToRgba(colors.secondary, 0.35));
    whiteGradient5.addColorStop(0.4, this.hexToRgba(colors.accent, 0.2));
    whiteGradient5.addColorStop(0.8, this.hexToRgba(colors.primary, 0.15));
    whiteGradient5.addColorStop(1, this.hexToRgba(colors.secondary, 0));
    context.fillStyle = whiteGradient5;
    context.fillRect(0, 0, 512, 512);
  }

  public getCurrentGradientInfo(): { index: number; colors: string[] } {
    const gradientColors = [
      this.baseColor, 
      this.whiteGradientColor, 
      this.blendColors(this.baseColor, this.whiteGradientColor, 0.8),
      this.blendColors(this.baseColor, this.whiteGradientColor, 0.6),
      this.blendColors(this.baseColor, this.whiteGradientColor, 0.4),
      this.blendColors(this.baseColor, this.whiteGradientColor, 0.2)
    ];
    
    return {
      index: this.currentGradientIndex,
      colors: gradientColors
    };
  }

  public updateColors(baseColor: string, whiteGradientColor: string = '#ffffff'): void {
    console.log(`Updating colors: base=${baseColor}, white=${whiteGradientColor}`);
    this.baseColor = baseColor;
    this.whiteGradientColor = whiteGradientColor;
    
    // Regenerate the background with new colors
    if (this.scene) {
      this.createBackgroundGradient(this.scene, this.currentGradientIndex);
    }
  }

  public dispose(): void {
    if (this.backgroundTexture) {
      this.backgroundTexture.dispose();
    }
    if (this.backgroundSphere) {
      this.backgroundSphere.geometry.dispose();
      if (this.backgroundSphere.material instanceof THREE.Material) {
        this.backgroundSphere.material.dispose();
      }
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
      to: (target: any, vars: any) => any;
      from: (target: any, vars: any) => any;
      fromTo: (target: any, fromVars: any, toVars: any) => any;
      set: (target: any, vars: any) => any;
      killTweensOf: (target: any) => void;
      timeline: () => any;
    };
  }
}