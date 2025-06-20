import * as THREE from 'three';

export class TextureManager {
  constructor() {
    this.gradientColors = [
      ['#667eea', '#764ba2'], // Purple-blue
      ['#f093fb', '#f5576c'], // Pink-red
      ['#4facfe', '#00f2fe'], // Blue-cyan
      ['#43e97b', '#38f9d7'], // Green-cyan
      ['#fa709a', '#fee140'], // Pink-yellow
      ['#a8edea', '#fed6e3'], // Mint-pink
      ['#ffecd2', '#fcb69f'], // Peach
      ['#ff9a9e', '#fecfef'], // Rose
    ];
  }

  getGradientColors() {
    return this.gradientColors;
  }

  createTextTexture(text, isActive = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, 512, 128);
    
    if (isActive) {
      // Glassmorphism background for active state
      const gradient = ctx.createLinearGradient(0, 0, 512, 128);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      ctx.fillStyle = gradient;
      
      // Rounded rectangle
      const radius = 20;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(512 - radius, 0);
      ctx.quadraticCurveTo(512, 0, 512, radius);
      ctx.lineTo(512, 128 - radius);
      ctx.quadraticCurveTo(512, 128, 512 - radius, 128);
      ctx.lineTo(radius, 128);
      ctx.quadraticCurveTo(0, 128, 0, 128 - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fill();
      
      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Inner glow
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // Text styling
    ctx.font = isActive ? 'bold 32px Arial' : 'bold 28px Arial';
    ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text shadow for better readability
    if (!isActive) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    // Draw text
    ctx.fillText(text, 256, 64);
    
    return new THREE.CanvasTexture(canvas);
  }

  createBoxTexture(agentName, agentIndex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
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
    
    return new THREE.CanvasTexture(canvas);
  }
}



