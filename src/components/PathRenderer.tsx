import * as THREE from 'three';
import { MutableRefObject } from 'react';
import { TextureManager } from './TextureManager';
import { AIAgents } from '../constants/AIAgents';
import { SimpleFloatingText3D } from './FloatingText3D';
import { ShapeManager } from './ShapeManager';
import Spline from '@splinetool/react-spline';

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

  // Method to create Spline object at specified position
  private createSplineObject(globalRowIndex: number, curveOffset: number, distance: number, elevation: number): THREE.Group {
    const splineGroup = new THREE.Group();
    
    // Create a placeholder geometry for the Spline object
    const placeholderGeometry = new THREE.BoxGeometry(8, 8, 8);
    const placeholderMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });
    
    const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    
    // Add glow effect
    const glowGeometry = new THREE.BoxGeometry(10, 10, 10);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    
    splineGroup.add(placeholderMesh);
    splineGroup.add(glowMesh);
    
    // Position the group
    splineGroup.position.set(curveOffset, elevation, -distance);
    
    // Store metadata for the Spline object
    splineGroup.userData = {
      isSplineObject: true,
      splineSceneUrl: 'https://prod.spline.design/PBQQBw8bfXDhBo7w/scene.splinecode',
      globalRowIndex,
      curveOffset,
      distance,
      elevation,
      shapeType: 'spline',
      shapeName: `3D Spline Scene ${globalRowIndex}`,
      isClickable: true
    };
    
    // Add floating animation
    this.addSplineAnimation(placeholderMesh, globalRowIndex);
    
    return splineGroup;
  }

  // Add floating animation to Spline placeholder
  private addSplineAnimation(mesh: THREE.Mesh, globalRowIndex: number): void {
    const originalY = mesh.position.y;
    
    const animate = () => {
      const time = Date.now() * 0.001;
      const floatOffset = Math.sin(time * 0.6 + globalRowIndex * 0.15) * 0.8;
      const rotationSpeed = 0.4;
      
      mesh.position.y = originalY + floatOffset;
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.015;
      mesh.rotation.z += 0.008;
      
      // Add pulsing glow effect
      const pulseScale = 1 + Math.sin(time * 2 + globalRowIndex * 0.3) * 0.1;
      mesh.scale.setScalar(pulseScale);
      
      requestAnimationFrame(animate);
    };
    
    animate();
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
      
      // Calculate elevation for helix effect
      const elevation = this.calculateHelixElevation(globalRowIndex);
      
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
        const yPos = elevation; // Add elevation for helix effect
        
        dot.position.set(xPos, yPos, zPos);
        
        // Store additional data for enhanced animations
        dot.userData = {
          isClickable: true,
          shapeType: 'dot',
          shapeName: `Dot ${globalRowIndex}-${col}`,
          originalColor: this.getDotColor(globalRowIndex, curveOffset),
          globalRowIndex: globalRowIndex,
          curveOffset: curveOffset,
          columnIndex: col
        };
        
        // Store dot in array for blinking animation
        this.dotsArrayRef.current.push(dot);
        
        this.dotsGroupRef.current.add(dot);
      }

      // Add milestone text every 40 dots - using ShapeManager
      if (globalRowIndex > 0 && globalRowIndex % 40 === 0) {
        const milestoneText = this.shapeManager.createMilestoneText(globalRowIndex, curveOffset, distance);
        // Apply elevation to milestone text
        milestoneText.position.y = elevation;
        this.textGroupRef.current.add(milestoneText);
      }

    
      if (globalRowIndex > 0 && globalRowIndex % 60 === 0) {
        const agentBox = this.shapeManager.createAgentBox(globalRowIndex, curveOffset, distance);
        // Apply elevation to agent box
        agentBox.position.y = elevation;
        this.cardsGroupRef.current.add(agentBox);
      }

      // Add various 3D shapes every 15 dots for more variety - using ShapeManager
      if (globalRowIndex > 0 && globalRowIndex % 15 === 0 && globalRowIndex % 60 !== 0) {
        const variousShape = this.shapeManager.createVariousShapes(globalRowIndex, curveOffset, distance);
        // Apply elevation to various shapes
        variousShape.position.y = elevation;
        this.cardsGroupRef.current.add(variousShape);
      }

      // Add breakable cubes on both sides every 50 dots
      if (globalRowIndex > 0 && globalRowIndex % 50 === 0 && this.cardsGroupRef.current) {
        const breakableCubes = this.shapeManager.createBreakableCubesBothSides(globalRowIndex, curveOffset, distance);
        breakableCubes.forEach(cube => {
          cube.position.y = elevation;
          this.cardsGroupRef.current!.add(cube);
        });
      }

      // Add smaller decorative shapes every 8 dots - using ShapeManager
      if (globalRowIndex > 0 && globalRowIndex % 8 === 0 && globalRowIndex % 15 !== 0) {
        const decorativeShape = this.shapeManager.createDecorativeShapes(globalRowIndex, curveOffset, distance);
        // Apply elevation to decorative shapes
        decorativeShape.position.y = elevation;
        this.cardsGroupRef.current.add(decorativeShape);
      }

      // Add Spline 3D object every 45 dots
      if (globalRowIndex > 0 && globalRowIndex % 45 === 0) {
        const splineGroup = this.createSplineObject(globalRowIndex, curveOffset, distance, elevation + 2);
        this.cardsGroupRef.current.add(splineGroup);
      }
    }
  }

  private calculateRoundedCurve(globalRowIndex: number): number {
    // Calculate screen dimensions for proper scaling
    const cameraDistance = 25;
    const fov = 75;
    const screenWidth = 2 * Math.tan((fov * Math.PI / 180) / 2) * cameraDistance;
    
    // Create a helix-like structure starting immediately
    // Parameters for the helix
    const helixRadius = screenWidth * 0.25; // Radius of the helix
    const helixPitch = 0.3; // How tight the helix is (smaller = tighter)
    const helixSpeed = 0.1; // Speed of rotation along the helix
    
    // Calculate the angle for the helix - start immediately from row 0
    const angle = globalRowIndex * helixSpeed;
    
    // Create the main helix curve
    const xOffset = Math.cos(angle) * helixRadius;
    
    // Add a secondary wave for more organic movement
    const secondaryWave = Math.sin(angle * 2) * (screenWidth * 0.05);
    
    // Add a tertiary wave for even more complexity
    const tertiaryWave = Math.cos(angle * 3) * (screenWidth * 0.02);
    
    // Combine all waves for the final helix effect
    const helixOffset = xOffset + secondaryWave + tertiaryWave;
    
    // Add some organic variation for natural feel
    const organicVariation = Math.sin(globalRowIndex * 0.015) * (screenWidth * 0.01) +
                            Math.cos(globalRowIndex * 0.025) * (screenWidth * 0.005);
    
    // Apply smooth easing for natural transitions - start immediately
    const progress = Math.min(1, globalRowIndex / 10); // Faster transition over first 10 rows
    const easedProgress = this.smoothStep(progress);
    
    return helixOffset * easedProgress + organicVariation;
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

  // Calculate elevation for helix effect
  private calculateHelixElevation(globalRowIndex: number): number {
    // Parameters for the helix elevation
    const elevationAmplitude = 3; // Height variation in units
    const elevationSpeed = 0.15; // Speed of vertical movement
    
    // Calculate the elevation angle - start immediately from row 0
    const elevationAngle = globalRowIndex * elevationSpeed;
    
    // Create the main elevation wave
    const mainElevation = Math.sin(elevationAngle) * elevationAmplitude;
    
    // Add a secondary elevation wave for more complex movement
    const secondaryElevation = Math.cos(elevationAngle * 2) * (elevationAmplitude * 0.3);
    
    // Add some organic variation
    const organicVariation = Math.sin(globalRowIndex * 0.02) * 0.5;
    
    // Apply smooth easing for natural transitions - start immediately
    const progress = Math.min(1, globalRowIndex / 10); // Faster transition over first 10 rows
    const easedProgress = this.smoothStep(progress);
    
    // Start from ground level and gradually apply elevation
    const baseHeight = 0.01; // Slight elevation from ground
    return baseHeight + (mainElevation + secondaryElevation + organicVariation) * easedProgress;
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

  // Expose floatingText3D instance
  public getFloatingText3D(): SimpleFloatingText3D {
    return this.floatingText3D;
  }

  // Show agent description in FloatingText3D at a given position
  public showAgentDescriptionFloatingText(agent: { name: string; description: string }, position: { x: number, y: number, z: number } = { x: 0, y: 20, z: -30 }): void {
    // Remove previous floating text from scene
    if (this.textGroupRef.current) {
      this.textGroupRef.current.remove(this.floatingText3D.getGroup());
    }
    // Create new floating text
    this.floatingText3D.createFloatingText([
      agent.name,
      agent.description
    ], position, this.cameraRef);
    // Add to scene
    if (this.textGroupRef.current) {
      this.textGroupRef.current.add(this.floatingText3D.getGroup());
    }
    this.floatingText3D.updateVisibility(true);
  }

  // Hide the floating text
  public hideAgentDescriptionFloatingText(): void {
    this.floatingText3D.clearText();
    if (this.textGroupRef.current) {
      this.textGroupRef.current.remove(this.floatingText3D.getGroup());
    }
  }
}


