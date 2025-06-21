import * as THREE from 'three';

export class TextureManager {
  private gradientColors: string[][];

  constructor() {
    this.gradientColors = [
      ['#ff006e', '#ff6b35'], // Bright pink to orange
      ['#00ff88', '#00d4ff'], // Bright green to cyan
      ['#ff00ff', '#ffff00'], // Magenta to yellow
      ['#00ffff', '#ff0080'], // Cyan to hot pink
      ['#ff8800', '#ff0088'], // Bright orange to pink
      ['#8800ff', '#00ff88'], // Purple to green
      ['#ff0080', '#8000ff'], // Hot pink to purple
      ['#00ff00', '#ff0000'], // Bright green to red
    ];
  }

  getGradientColors(): string[][] {
    return this.gradientColors;
  }

  // Updated method - NO GLASSMORPHISM, clean and simple text
  createTextTexture(text: string, isActive: boolean = false): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, 512, 128);
    
    // NO background shapes or glassmorphism effects - just text
    
    // Text styling - clean and readable
    const fontSize = isActive ? 36 : 32;
    const fontWeight = isActive ? 'bold' : 'normal';
    ctx.font = `${fontWeight} ${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better readability against any background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Set text color based on active state
    ctx.fillStyle = isActive ? '#ffffff' : '#e5e7eb';
    
    // Draw the text
    ctx.fillText(text, 256, 64);
    
    // Create and return texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Keep the box texture method unchanged for the 3D boxes
  createBoxTexture(agentName: string, agentIndex: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }
    
    const colorIndex = agentIndex % this.gradientColors.length;
    const gradient = ctx.createLinearGradient(0, 0, 512, 256);
    gradient.addColorStop(0, this.gradientColors[colorIndex][0]);
    gradient.addColorStop(1, this.gradientColors[colorIndex][1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    
    // Add subtle pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(i * 60, 0, 20, 256);
    }
    
    // Add border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 250);
    
    // Add AI Agent text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText('AI AGENT', 256, 80);
    
    // Add agent name (split into lines if too long)
    const words = agentName.split(' ');
    if (words.length > 2) {
      ctx.font = 'bold 28px Arial';
      ctx.fillText(words.slice(0, 2).join(' '), 256, 140);
      ctx.fillText(words.slice(2).join(' '), 256, 180);
    } else {
      ctx.font = 'bold 32px Arial';
      ctx.fillText(agentName, 256, 160);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
}