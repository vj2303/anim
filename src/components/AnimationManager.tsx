import { TextureManager } from './TextureManager';

export class AnimationManager {
  constructor(dotsArrayRef, textMeshesRef, positionRef, cameraRef) {
    this.dotsArrayRef = dotsArrayRef;
    this.textMeshesRef = textMeshesRef;
    this.positionRef = positionRef;
    this.cameraRef = cameraRef;
    this.textureManager = new TextureManager();
  }

  animate() {
    this.animateBlinking();
    this.animateFloatingText();
  }

  animateBlinking() {
    const time = Date.now() * 0.001;
    
    this.dotsArrayRef.current.forEach((dot, index) => {
      if (!dot || !dot.material) return;
      
      // Create staggered blinking effect
      const blinkOffset = index * 0.8;
      const blinkSpeed = 0.3;
      const blinkWave = Math.sin(time * blinkSpeed + blinkOffset);
      
      // Random occasional bright white blinks (very rare)
      const randomBlink = Math.random() < 0.0002;
      
      if (randomBlink) {
        // Bright white flash
        dot.material.color.setHex(0xffffff);
        dot.material.opacity = 1;
        dot.scale.setScalar(1.15);
      } else {
        // Normal pulsing between gray and slightly brighter
        const intensity = (blinkWave + 1) * 0.5;
        const grayValue = 0.65 + intensity * 0.15;
        dot.material.color.setRGB(grayValue, grayValue, grayValue);
        dot.scale.setScalar(1);
      }
    });
  }

  animateFloatingText() {
    const time = Date.now() * 0.001;
    const currentAgent = Math.floor(this.positionRef.current / 60);
    
    this.textMeshesRef.current.forEach((textMesh, index) => {
      if (!textMesh) return;
      
      const isActive = index === currentAgent;
      const agentPosition = index * 60;
      const distanceFromCurrent = Math.abs(this.positionRef.current - agentPosition);
      
      // Update texture based on active state
      if (textMesh.userData.isActive !== isActive) {
        textMesh.userData.isActive = isActive;
        textMesh.material.map = this.textureManager.createTextTexture(textMesh.userData.text, isActive);
        textMesh.material.needsUpdate = true;
      }
      
      // Bouncy animation for active text
      if (isActive) {
        const bounceTime = time * 3; // Faster bounce for active
        const bounce = Math.sin(bounceTime) * 0.5 + Math.sin(bounceTime * 2) * 0.2;
        textMesh.position.y = textMesh.userData.baseY + bounce;
        
        // Scale animation
        const scaleTime = time * 2;
        const scale = 1 + Math.sin(scaleTime) * 0.1;
        textMesh.scale.setScalar(scale);
        
        // Gentle rotation
        textMesh.rotation.y = Math.sin(time * 1.5) * 0.1;
      } else {
        // Gentle floating for inactive text
        const floatTime = time * 0.8 + index * 0.5;
        textMesh.position.y = textMesh.userData.baseY + Math.sin(floatTime) * 0.2;
        textMesh.scale.setScalar(1);
        textMesh.rotation.y = 0;
      }
      
      // Fade based on distance
      const fadeDistance = 120; // Start fading at 2 agents away
      const opacity = Math.max(0.1, 1 - Math.max(0, distanceFromCurrent - 60) / fadeDistance);
      textMesh.material.opacity = opacity;
    });
  }
}