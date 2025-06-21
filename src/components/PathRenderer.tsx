import * as THREE from 'three';
import { MutableRefObject } from 'react';
import { TextureManager } from './TextureManager';
import { AIAgents } from '../constants/AIAgents';
import { SimpleFloatingText3D } from './FloatingText3D';
import { ShapeManager } from './ShapeManager';

export class PathRenderer {
  private dotsGroupRef: MutableRefObject<THREE.Group | null>;
  private cardsGroupRef: MutableRefObject<THREE.Group | null>;
  private textGroupRef: MutableRefObject<THREE.Group | null>;
  private dotsArrayRef: MutableRefObject<THREE.Mesh[]>;
  private textMeshesRef: MutableRefObject<THREE.Mesh[]>;
  private positionRef: MutableRefObject<number>;
  private cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>;
  private textureManager: TextureManager;
  private floatingText3D: SimpleFloatingText3D;
  private shapeManager: ShapeManager;
  
  // Track milestone text objects like AI agents
  private milestoneTextMeshes: Map<number, THREE.Group> = new Map();

  constructor(
    dotsGroupRef: MutableRefObject<THREE.Group | null>,
    cardsGroupRef: MutableRefObject<THREE.Group | null>,
    textGroupRef: MutableRefObject<THREE.Group | null>,
    dotsArrayRef: MutableRefObject<THREE.Mesh[]>,
    textMeshesRef: MutableRefObject<THREE.Mesh[]>,
    positionRef: MutableRefObject<number>,
    cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>
  ) {
    this.dotsGroupRef = dotsGroupRef;
    this.cardsGroupRef = cardsGroupRef;
    this.textGroupRef = textGroupRef;
    this.dotsArrayRef = dotsArrayRef;
    this.textMeshesRef = textMeshesRef;
    this.positionRef = positionRef;
    this.cameraRef = cameraRef;
    this.textureManager = new TextureManager();
    this.floatingText3D = new SimpleFloatingText3D();
    this.shapeManager = new ShapeManager(cameraRef);
  }

  public initializeFloatingText(scene: THREE.Scene): void {
    // No longer needed - we'll create milestone texts directly in the scene like AI agents
  }

  public checkMilestoneText(): void {
    // This method is no longer needed since we create milestone texts in createDottedPath like AI agents
  }

  // Simplified floating text position update - milestone texts are handled in createDottedPath like AI agents
  public updateFloatingTextPosition(): void {
    // No longer needed since milestone texts are created in the visible range like AI agents
  }

  // Add cleanup method
  public dispose(): void {
    this.milestoneTextMeshes.clear();
    this.shapeManager.dispose();
  }

  // Updated createDottedPath method using ShapeManager
  createDottedPath(): void {
    if (!this.dotsGroupRef.current || !this.cardsGroupRef.current || !this.textGroupRef.current) return;

    // Clear existing objects
    this.dotsGroupRef.current.clear();
    this.cardsGroupRef.current.clear();
    this.textGroupRef.current.clear();
    this.dotsArrayRef.current = [];
    this.textMeshesRef.current = [];

    const visibleRange = 30; // REDUCED from 50 for better performance
    
    // Create smaller 2D dot geometry (reduced from 0.4 to 0.2)
    const dotGeometry = new THREE.CircleGeometry(0.2, 8); // REDUCED segments from 16 to 8

    // Create dots
    for (let i = -visibleRange; i < visibleRange; i++) {
      const globalRowIndex = Math.floor(this.positionRef.current) + i;
      if (globalRowIndex < 0) continue;

      // INCREASED spacing between rows (from 5 to 8 for more vertical gap)
      const distance = i * 8;
      const progress = Math.abs(i) / visibleRange;
      const opacity = Math.max(0.1, 1 - (progress * 0.8));
      
      // Calculate rounded curve with smooth transitions
      const curveOffset = this.calculateRoundedCurve(globalRowIndex);
      
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

      // Add milestone text every 40 dots - using ShapeManager
      if (globalRowIndex > 0 && globalRowIndex % 40 === 0) {
        const milestoneText = this.shapeManager.createMilestoneText(globalRowIndex, curveOffset, distance);
        this.textGroupRef.current.add(milestoneText);
      }

      // Add AI agent boxes every 60 dots - using ShapeManager
      if (globalRowIndex > 0 && globalRowIndex % 60 === 0) {
        const agentBox = this.shapeManager.createAgentBox(globalRowIndex, curveOffset, distance);
        this.cardsGroupRef.current.add(agentBox);
      }

      // Add various 3D shapes every 15 dots for more variety - using ShapeManager
      if (globalRowIndex > 0 && globalRowIndex % 15 === 0 && globalRowIndex % 60 !== 0) {
        const variousShape = this.shapeManager.createVariousShapes(globalRowIndex, curveOffset, distance);
        this.cardsGroupRef.current.add(variousShape);
      }

      // Add smaller decorative shapes every 8 dots - using ShapeManager
      if (globalRowIndex > 0 && globalRowIndex % 8 === 0 && globalRowIndex % 15 !== 0) {
        const decorativeShape = this.shapeManager.createDecorativeShapes(globalRowIndex, curveOffset, distance);
        this.cardsGroupRef.current.add(decorativeShape);
      }
    }
  }

  private calculateRoundedCurve(globalRowIndex: number): number {
    // Calculate screen dimensions for proper scaling
    const cameraDistance = 25;
    const fov = 75;
    const screenWidth = 2 * Math.tan((fov * Math.PI / 180) / 2) * cameraDistance;
    
    // Row 0-1: Keep straight (no curve)
    if (globalRowIndex <= 1) {
        return 0;
    }
    
    // Rows 2-40: Create smooth circular curved pattern
    if (globalRowIndex >= 2 && globalRowIndex <= 40) {
        const curveStartRow = 2;
        const curveEndRow = 40;
        const totalCurveRows = curveEndRow - curveStartRow + 1;
        
        // Calculate progress through the curve (0 to 1)
        const curveProgress = (globalRowIndex - curveStartRow) / (totalCurveRows - 1);
        
        // Create a circular arc - simulate traveling along a large circle's circumference
        const circleAngle = curveProgress * (Math.PI / 2); // 0 to 90 degrees
        
        // Define the radius of the virtual circle we're following
        const circleRadius = screenWidth * 0.8; // Large radius for gentle curve
        
        // Calculate position on the circle
        const circleX = Math.sin(circleAngle) * circleRadius;
        
        // Center the curve and scale appropriately
        const maxOffset = screenWidth * 0.35;
        const curveOffset = (circleX / circleRadius) * maxOffset;
        
        // Apply smooth easing for more natural feel
        const easedProgress = this.smoothStep(curveProgress);
        const smoothCurveOffset = curveOffset * easedProgress;
        
        // Add gentle secondary curve for more organic feel
        const secondaryRadius = screenWidth * 0.15;
        const secondaryAngle = curveProgress * Math.PI;
        const secondaryOffset = Math.sin(secondaryAngle) * secondaryRadius * 0.2;
        
        // Combine primary circular curve with subtle secondary wave
        const finalOffset = smoothCurveOffset + secondaryOffset;
        
        // REDUCED organic variation for smoother movement
        const organicVariation = Math.sin(globalRowIndex * 0.02) * (screenWidth * 0.003) +
                                Math.cos(globalRowIndex * 0.015) * (screenWidth * 0.002);
        
        // Progressive intensity
        const progressiveMultiplier = 0.7 + (curveProgress * 0.3);
        
        return (finalOffset * progressiveMultiplier) + organicVariation;
    }
    
    // After row 40: IMPROVED smooth alternating curve pattern
    const sectionSize = 80;
    const adjustedIndex = globalRowIndex - 41;
    
    // IMPROVED transition from rounded curve to alternating pattern
    if (adjustedIndex < 20) { // Extended transition zone
        const transitionProgress = adjustedIndex / 20; // Smoother transition
        const smoothTransition = this.smoothStep(transitionProgress);
        
        // Start from the end of the rounded curve
        const roundedEndOffset = screenWidth * 0.25; // Reduced for smoother transition
        
        // Calculate where the alternating pattern would start
        const sectionNumber = Math.floor(adjustedIndex / sectionSize);
        const positionInSection = adjustedIndex % sectionSize;
        const progress = positionInSection / (sectionSize - 1);
        const isLeftToRight = sectionNumber % 2 === 0;
        
        const curveRange = screenWidth * 0.2; // Reduced range for smoother movement
        let alternatingOffset: number;
        if (isLeftToRight) {
            alternatingOffset = -curveRange + (2 * curveRange) * this.smoothStep(progress);
        } else {
            alternatingOffset = curveRange - (2 * curveRange) * this.smoothStep(progress);
        }
        
        // Smooth transition from rounded curve end to alternating pattern
        return roundedEndOffset + (alternatingOffset - roundedEndOffset) * smoothTransition;
    }
    
    // Regular alternating curve pattern - IMPROVED smoothing
    const sectionNumber = Math.floor(adjustedIndex / sectionSize);
    const positionInSection = adjustedIndex % sectionSize;
    
    // Calculate progress within current section (0 to 1)
    const progress = positionInSection / (sectionSize - 1);
    
    // Determine curve direction based on section number
    const isLeftToRight = sectionNumber % 2 === 0;
    
    // IMPROVED: Smoother curve using enhanced sine function
    const curveIntensity = 1.2; // Reduced intensity for smoother movement
    const curvedProgress = this.smoothStep(progress); // Apply smooth step to progress
    
    // Define centered curve range
    const curveRange = screenWidth * 0.2; // Reduced range
    
    // Calculate the main curved path based on direction, centered around 0
    let xPosition: number;
    if (isLeftToRight) {
        xPosition = -curveRange + (2 * curveRange) * curvedProgress;
    } else {
        xPosition = curveRange - (2 * curveRange) * curvedProgress;
    }
    
    // REDUCED additional curvature for smoother movement
    const additionalCurveAmount = screenWidth * 0.04; // Reduced
    const additionalCurve = Math.sin(progress * Math.PI) * additionalCurveAmount;
    if (isLeftToRight) {
        xPosition += additionalCurve;
    } else {
        xPosition -= additionalCurve;
    }
    
    // REDUCED vertical influence for smoother movement
    const verticalInfluenceAmount = screenWidth * 0.02; // Reduced
    const verticalInfluence = Math.cos(progress * Math.PI * 2) * verticalInfluenceAmount;
    if (isLeftToRight) {
        xPosition += verticalInfluence;
    } else {
        xPosition -= verticalInfluence;
    }
    
    // REDUCED organic variation for ultra-smooth movement
    const organicVariation = Math.sin(globalRowIndex * 0.015) * (screenWidth * 0.005) +
                            Math.cos(globalRowIndex * 0.035) * (screenWidth * 0.003);
    
    // Ensure the final position stays centered
    const maxOffset = screenWidth * 0.3; // Reduced max offset
    xPosition = Math.max(-maxOffset, Math.min(maxOffset, xPosition));
    
    return xPosition + organicVariation;
  }

  // Enhanced smoothStep function for better transitions
  private smoothStep(t: number): number {
    // Enhanced smooth step function for more natural transitions
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  // Optional: Add a method to get the current angle for debugging or other purposes
  private getCurrentCircleAngle(globalRowIndex: number): number {
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
  private calculateCircularElevation(globalRowIndex: number): number {
    const currentAngle = this.getCurrentCircleAngle(globalRowIndex);
    
    // Create gentle elevation changes around the circle
    // This creates a subtle "hill and valley" effect
    const elevationAmplitude = 2; // Height variation in units
    const elevationFrequency = 3; // Number of hills/valleys around the circle
    
    return Math.sin(currentAngle * elevationFrequency) * elevationAmplitude;
  }

  private getDotColor(globalRowIndex: number, curveOffset: number): number {
    // Return black color for all dots
    return 0x000000;
  }

  private createTransitionMarker(globalRowIndex: number, curveOffset: number, distance: number): void {
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
    
    this.dotsGroupRef.current?.add(marker);
  }
}