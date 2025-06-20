import * as THREE from 'three';
import { TextureManager } from './TextureManager';
import { AIAgents } from '../constants/AIAgents';

export class PathRenderer {
  constructor(dotsGroupRef, cardsGroupRef, textGroupRef, dotsArrayRef, textMeshesRef, positionRef, cameraRef) {
    this.dotsGroupRef = dotsGroupRef;
    this.cardsGroupRef = cardsGroupRef;
    this.textGroupRef = textGroupRef;
    this.dotsArrayRef = dotsArrayRef;
    this.textMeshesRef = textMeshesRef;
    this.positionRef = positionRef;
    this.cameraRef = cameraRef;
    this.textureManager = new TextureManager();
  }

 // Updated createDottedPath method with increased vertical spacing
createDottedPath() {
    if (!this.dotsGroupRef.current || !this.cardsGroupRef.current || !this.textGroupRef.current) return;

    // Clear existing objects
    this.dotsGroupRef.current.clear();
    this.cardsGroupRef.current.clear();
    this.textGroupRef.current.clear();
    this.dotsArrayRef.current = [];
    this.textMeshesRef.current = [];

    const visibleRange = 50;
    
    // Create smaller 2D dot geometry (reduced from 0.4 to 0.2)
    const dotGeometry = new THREE.CircleGeometry(0.2, 16);

    // Create dots
    for (let i = -visibleRange; i < visibleRange; i++) {
      const globalRowIndex = Math.floor(this.positionRef.current) + i;
      if (globalRowIndex < 0) continue;

      // INCREASED spacing between rows (from 5 to 8 for more vertical gap)
      const distance = i * 8;
      const progress = Math.abs(i) / visibleRange;
      const opacity = Math.max(0.1, 1 - (progress * 0.8));
      
      // Calculate advanced alternating curve with smooth transitions
      const curveOffset = this.calculateAdvancedAlternatingCurve(globalRowIndex);
      
      // Create 6 dots per row spread across full screen width
      for (let col = 0; col < 6; col++) {
        const dotMaterial = new THREE.MeshBasicMaterial({ 
          color: this.getDotColor(globalRowIndex, curveOffset),
          transparent: true,
          opacity: opacity
        });
        
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        
        // Make dots face up (lay flat on ground)
        dot.rotation.x = -Math.PI / 2;
        
        // Calculate screen width based on camera FOV and distance
        const cameraDistance = 25; // Camera Z position from main file
        const fov = 75; // Camera FOV from main file
        const screenWidth = 2 * Math.tan((fov * Math.PI / 180) / 2) * cameraDistance;
        
        // Spread dots across full screen width (left edge to right edge)
        const xPos = (col / 5) * screenWidth - (screenWidth / 2) + curveOffset;
        const zPos = -distance;
        
        dot.position.set(xPos, 0.01, zPos);
        
        // Store additional data for enhanced animations
        dot.userData = {
          originalColor: this.getDotColor(globalRowIndex, curveOffset),
          globalRowIndex: globalRowIndex,
          curveOffset: curveOffset
        };
        
        // Store dot in array for blinking animation
        this.dotsArrayRef.current.push(dot);
        
        this.dotsGroupRef.current.add(dot);
      }

      // Add AI agent boxes every 60 dots
      if (globalRowIndex > 0 && globalRowIndex % 60 === 0) {
        this.createAgentBox(globalRowIndex, curveOffset, distance);
      }

      // Add transition markers at curve change points
      if (globalRowIndex > 0 && globalRowIndex % 60 === 30) {
        this.createTransitionMarker(globalRowIndex, curveOffset, distance);
      }
    }
  }

// Updated calculateAdvancedAlternatingCurve method with enhanced curve for first 2 dots
calculateAdvancedAlternatingCurve(globalRowIndex) {
    // Calculate screen dimensions for proper scaling
    const cameraDistance = 25;
    const fov = 75;
    const screenWidth = 2 * Math.tan((fov * Math.PI / 180) / 2) * cameraDistance;
    
    // Row 0: Keep straight (no curve)
    if (globalRowIndex === 0) {
        return 0;
    }
    
    // Row 1: First curved dot - make it more pronounced
    if (globalRowIndex === 1) {
        const enhancedCurve = screenWidth * 0.15; // Strong initial curve
        const organicVariation = Math.sin(globalRowIndex * 0.1) * (screenWidth * 0.03);
        return -enhancedCurve + organicVariation; // Start curving left
    }
    
    // Row 2: Second curved dot - continue the pronounced curve
    if (globalRowIndex === 2) {
        const enhancedCurve = screenWidth * 0.25; // Even stronger curve
        const organicVariation = Math.sin(globalRowIndex * 0.1) * (screenWidth * 0.03);
        return -enhancedCurve + organicVariation; // Continue curving left
    }
    
    // Handle curved sections in groups of 80 dots each (starting from row 3)
    const sectionSize = 80;
    const adjustedIndex = globalRowIndex - 3; // Start counting from row 3 (after the first 2 enhanced dots)
    const sectionNumber = Math.floor(adjustedIndex / sectionSize);
    const positionInSection = adjustedIndex % sectionSize;
    
    // Calculate progress within current section (0 to 1)
    const progress = positionInSection / (sectionSize - 1);
    
    // Determine curve direction based on section number
    const isLeftToRight = sectionNumber % 2 === 0; // Even sections: left-to-right, Odd sections: right-to-left
    
    // Create pronounced curve using sine function
    const curveIntensity = 1.5;
    const curvedProgress = Math.sin(progress * Math.PI * curveIntensity) / Math.sin(Math.PI * curveIntensity);
    
    // Define centered curve range
    const curveRange = screenWidth * 0.25;
    
    // Calculate the main curved path based on direction, centered around 0
    let xPosition;
    if (isLeftToRight) {
        // Left to right curve: start at -curveRange, end at +curveRange
        xPosition = -curveRange + (2 * curveRange) * curvedProgress;
    } else {
        // Right to left curve: start at +curveRange, end at -curveRange
        xPosition = curveRange - (2 * curveRange) * curvedProgress;
    }
    
    // Add additional curvature using sine wave overlay (centered)
    const additionalCurveAmount = screenWidth * 0.08;
    const additionalCurve = Math.sin(progress * Math.PI) * additionalCurveAmount;
    if (isLeftToRight) {
        xPosition += additionalCurve;
    } else {
        xPosition -= additionalCurve;
    }
    
    // Add vertical influence to create more pronounced horizontal curve (centered)
    const verticalInfluenceAmount = screenWidth * 0.04;
    const verticalInfluence = Math.cos(progress * Math.PI * 2) * verticalInfluenceAmount;
    if (isLeftToRight) {
        xPosition += verticalInfluence;
    } else {
        xPosition -= verticalInfluence;
    }
    
    // Add organic variation for natural feel (smaller amounts)
    const organicVariation = Math.sin(globalRowIndex * 0.03) * (screenWidth * 0.01) +
                            Math.cos(globalRowIndex * 0.07) * (screenWidth * 0.008);
    
    // Handle section transitions for smooth continuity
    const transitionZone = 5;
    let transitionMultiplier = 1;
    
    // Smooth transition at the beginning of each section (except the first)
    if (sectionNumber > 0 && positionInSection < transitionZone) {
        const t = positionInSection / transitionZone;
        transitionMultiplier = this.smoothStep(t);
        
        // Calculate the end position of the previous section for smooth transition
        const prevSectionIsLeftToRight = (sectionNumber - 1) % 2 === 0;
        const prevSectionEndProgress = 1.0;
        const prevCurvedProgress = Math.sin(prevSectionEndProgress * Math.PI * curveIntensity) / Math.sin(Math.PI * curveIntensity);
        
        let prevSectionEndX;
        if (prevSectionIsLeftToRight) {
            prevSectionEndX = -curveRange + (2 * curveRange) * prevCurvedProgress;
            prevSectionEndX += Math.sin(prevSectionEndProgress * Math.PI) * additionalCurveAmount;
            prevSectionEndX += Math.cos(prevSectionEndProgress * Math.PI * 2) * verticalInfluenceAmount;
        } else {
            prevSectionEndX = curveRange - (2 * curveRange) * prevCurvedProgress;
            prevSectionEndX -= Math.sin(prevSectionEndProgress * Math.PI) * additionalCurveAmount;
            prevSectionEndX -= Math.cos(prevSectionEndProgress * Math.PI * 2) * verticalInfluenceAmount;
        }
        
        // Blend between previous section end and current section start
        const currentSectionStartProgress = 0.0;
        const currentCurvedProgress = Math.sin(currentSectionStartProgress * Math.PI * curveIntensity) / Math.sin(Math.PI * curveIntensity);
        
        let currentSectionStartX;
        if (isLeftToRight) {
            currentSectionStartX = -curveRange + (2 * curveRange) * currentCurvedProgress;
        } else {
            currentSectionStartX = curveRange - (2 * curveRange) * currentCurvedProgress;
        }
        
        // Interpolate for smooth transition
        const blendedStart = prevSectionEndX + (currentSectionStartX - prevSectionEndX) * transitionMultiplier;
        xPosition = blendedStart + (xPosition - currentSectionStartX) * transitionMultiplier;
    }
    
    // Handle smooth transition from the enhanced second dot to the regular curve pattern
    if (sectionNumber === 0 && positionInSection < transitionZone) {
        const t = positionInSection / transitionZone;
        const smoothT = this.smoothStep(t);
        
        // The enhanced second dot position
        const secondDotPosition = -screenWidth * 0.25;
        
        // Blend from second dot position to regular curve start
        const regularCurveStart = -curveRange;
        const blendedStart = secondDotPosition + (regularCurveStart - secondDotPosition) * smoothT;
        xPosition = blendedStart + (xPosition - regularCurveStart) * smoothT;
    }
    
    // Ensure the final position stays centered by clamping extreme values
    const maxOffset = screenWidth * 0.35;
    xPosition = Math.max(-maxOffset, Math.min(maxOffset, xPosition));
    
    return xPosition + organicVariation;
}


  // Enhanced smoothStep function for better transitions
  smoothStep(t) {
    // Enhanced smooth step function for more natural transitions
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  // Optional: Add a method to get the current angle for debugging or other purposes
  getCurrentCircleAngle(globalRowIndex) {
    const totalAgents = 20;
    const anglePerAgent = (2 * Math.PI) / totalAgents;
    
    // Handle the very beginning (before first agent)
    if (globalRowIndex < 60) {
      const startAngle = -Math.PI / 2; // Start at top of circle
      const firstAgentAngle = 0; // First agent at 3 o'clock
      const progress = globalRowIndex / 60;
      const smoothProgress = this.smoothStep(progress);
      return startAngle + ((firstAgentAngle - startAngle) * smoothProgress);
    }
    
    const agentSection = Math.floor(globalRowIndex / 60);
    const positionInSection = globalRowIndex % 60;
    const currentAgentAngle = (agentSection - 1) * anglePerAgent;
    const nextAgentAngle = agentSection * anglePerAgent;
    const sectionProgress = positionInSection / 60;
    const smoothProgress = this.smoothStep(sectionProgress);
    
    if (agentSection === totalAgents) {
      const lastAgentAngle = (totalAgents - 1) * anglePerAgent;
      const backToStartAngle = 2 * Math.PI;
      return lastAgentAngle + ((backToStartAngle - lastAgentAngle) * smoothProgress);
    } else {
      let angleDiff = nextAgentAngle - currentAgentAngle;
      if (angleDiff > Math.PI) {
        angleDiff -= 2 * Math.PI;
      } else if (angleDiff < -Math.PI) {
        angleDiff += 2 * Math.PI;
      }
      return currentAgentAngle + (angleDiff * smoothProgress);
    }
  }
  
  // Optional: Method to calculate Y position if you want elevation changes
  calculateCircularElevation(globalRowIndex) {
    const totalAgents = 20;
    const agentSection = Math.floor(globalRowIndex / 60);
    const positionInSection = globalRowIndex % 60;
    const anglePerAgent = (2 * Math.PI) / totalAgents;
    const currentAngle = this.getCurrentCircleAngle(globalRowIndex);
    
    // Create gentle elevation changes around the circle
    // This creates a subtle "hill and valley" effect
    const elevationAmplitude = 2; // Height variation in units
    const elevationFrequency = 3; // Number of hills/valleys around the circle
    
    return Math.sin(currentAngle * elevationFrequency) * elevationAmplitude;
  }

 

  getDotColor(globalRowIndex, curveOffset) {
    // Color dots based on their curve position and agent section
    const agentSection = Math.floor(globalRowIndex / 60);
    const normalizedCurve = Math.abs(curveOffset) / 15; // Normalize curve offset
    
    // Base colors for different sections
    const sectionColors = [
      0x4ade80, // Green
      0x3b82f6, // Blue  
      0xf59e0b, // Orange
      0xef4444, // Red
      0x8b5cf6, // Purple
      0x06b6d4, // Cyan
      0xf97316, // Orange-red
      0x10b981  // Emerald
    ];
    
    const baseColor = sectionColors[agentSection % sectionColors.length];
    
    // Interpolate with white based on curve position for visual effect
    const intensity = 0.7 + (normalizedCurve * 0.3);
    const r = ((baseColor >> 16) & 255) / 255 * intensity;
    const g = ((baseColor >> 8) & 255) / 255 * intensity;
    const b = (baseColor & 255) / 255 * intensity;
    
    return new THREE.Color(r, g, b).getHex();
  }

  createTransitionMarker(globalRowIndex, curveOffset, distance) {
    // Create a special marker at the middle of each section to show direction change
    const markerGeometry = new THREE.ConeGeometry(1, 3, 6);
    const agentSection = Math.floor(globalRowIndex / 60);
    const isLeftToRight = agentSection % 2 === 0;
    
    const markerMaterial = new THREE.MeshLambertMaterial({ 
      color: isLeftToRight ? 0x00ff00 : 0xff0000,
      transparent: true,
      opacity: 0.6
    });
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Position marker
    marker.position.set(curveOffset, 2, -distance);
    
    // Rotate marker to show direction
    marker.rotation.z = isLeftToRight ? Math.PI / 4 : -Math.PI / 4;
    
    // Add floating animation
    const time = Date.now() * 0.001;
    marker.position.y += Math.sin(time + globalRowIndex) * 0.5;
    
    this.dotsGroupRef.current.add(marker);
  }

  createAgentBox(globalRowIndex, curveOffset, distance) {
    // Get AI agent name based on milestone number
    const agentIndex = (Math.floor(globalRowIndex / 60) - 1) % AIAgents.length;
    const agentName = AIAgents[agentIndex];
    
    // Create 3D box geometry - make it larger for better visibility
    const boxGeometry = new THREE.BoxGeometry(8, 5, 3);
    
    // Create texture for the box with section indicator
    const texture = this.textureManager.createBoxTexture(agentName, agentIndex);
    
    // Create materials for each face
    const gradientColors = this.textureManager.getGradientColors();
    const colorIndex = agentIndex % gradientColors.length;
    
    // Calculate circular position data for better visual indicators
    const totalAgents = 20;
    const agentSection = Math.floor(globalRowIndex / 60) - 1;
    const anglePerAgent = (2 * Math.PI) / totalAgents;
    const currentAngle = agentSection * anglePerAgent;
    
    // Determine direction of movement around the circle
    const nextAngle = ((agentSection + 1) % totalAgents) * anglePerAgent;
    let isClockwise = true;
    
    // Handle wrap-around case
    if (agentSection === totalAgents - 1) {
      isClockwise = nextAngle < currentAngle;
    } else {
      isClockwise = nextAngle > currentAngle;
    }
    
    const directionColor = isClockwise ? 0x00ff88 : 0xff8800;
    
    const materials = [
      new THREE.MeshLambertMaterial({ map: texture }), // Right
      new THREE.MeshLambertMaterial({ map: texture }), // Left
      new THREE.MeshLambertMaterial({ color: directionColor }), // Top - shows direction
      new THREE.MeshLambertMaterial({ color: gradientColors[colorIndex][0] }), // Bottom
      new THREE.MeshLambertMaterial({ map: texture }), // Front
      new THREE.MeshLambertMaterial({ map: texture })  // Back
    ];
    
    const box = new THREE.Mesh(boxGeometry, materials);
    box.castShadow = true;
    box.receiveShadow = true;
    
    // Position box high above dots with curve offset
    // Optionally add circular elevation
    const baseY = 22;
    const circularElevation = this.calculateCircularElevation ? this.calculateCircularElevation(globalRowIndex) : 0;
    box.position.set(curveOffset, baseY + circularElevation, -distance);
    
    // Add floating animation with circular motion influence
    const time = Date.now() * 0.001;
    box.position.y += Math.sin(time * 0.5 + globalRowIndex) * 0.6;
    
    // Rotate based on circular position and direction
    const rotationOffset = currentAngle * 0.3; // Subtle rotation based on circle position
    box.rotation.y = Math.sin(time * 0.3 + globalRowIndex) * 0.15 + rotationOffset;
    box.rotation.x = Math.sin(time * 0.2 + globalRowIndex) * 0.08;
    
    // Make the box face slightly toward the center of the circle
    const facingAngle = currentAngle + Math.PI; // Face inward
    box.rotation.y += facingAngle * 0.1; // Subtle inward facing
    
    this.cardsGroupRef.current.add(box);
  
    // Create floating text with circular direction indicator
    this.createFloatingText(agentName, globalRowIndex, curveOffset, distance, isClockwise, currentAngle);
  }
  
  // Updated createFloatingText to handle circular path
  createFloatingText(agentName, globalRowIndex, curveOffset, distance, isClockwise, currentAngle) {
    const textGeometry = new THREE.PlaneGeometry(14, 3.5);
    const currentAgent = Math.floor(this.positionRef.current / 60);
    const isActive = Math.floor(globalRowIndex / 60) - 1 === currentAgent;
    
    // Add circular direction indicator to text
    const directionIcon = isClockwise ? "↻" : "↺"; // Circular arrows
    const displayText = `${directionIcon} ${agentName}`;
    
    const textTexture = this.textureManager.createTextTexture(displayText, isActive);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      opacity: 1,
      alphaTest: 0.1
    });
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    
    // Position text in front of the card with circular elevation
    const textBaseY = 27;
    const circularElevation = this.calculateCircularElevation ? this.calculateCircularElevation(globalRowIndex) : 0;
    textMesh.position.set(curveOffset, textBaseY + circularElevation, -distance + 10);
    
    // Store data for animation
    textMesh.userData = {
      text: displayText,
      baseY: textBaseY,
      isActive: isActive,
      isClockwise: isClockwise,
      circleAngle: currentAngle
    };
    
    // Make text face the camera with slight angle based on circular position
    textMesh.lookAt(this.cameraRef.current.position);
    textMesh.rotation.z += Math.sin(currentAngle) * 0.1; // Slight tilt based on circle position
    
    this.textGroupRef.current.add(textMesh);
    this.textMeshesRef.current[Math.floor(globalRowIndex / 60) - 1] = textMesh;
  }

}


