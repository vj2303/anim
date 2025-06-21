import * as THREE from 'three';
import { MutableRefObject } from 'react';
import { TextureManager } from './TextureManager';
import { AIAgents } from '../constants/AIAgents';

export class ShapeManager {
  private textureManager: TextureManager;
  private cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>;

  // Shape types for variety
  private shapeTypes = ['cube', 'sphere', 'cylinder', 'cone', 'octahedron', 'tetrahedron', 'torus', 'dodecahedron'];
  
  // Shape names/labels for different shapes
  private shapeLabels = [
    'Data Hub', 'Neural Core', 'Logic Gate', 'Process Node', 'Memory Bank', 
    'Compute Unit', 'Signal Boost', 'Cache Layer', 'Buffer Zone', 'Sync Point',
    'Code Block', 'Function Call', 'Class Method', 'Variable Store', 'Loop Iterator',
    'Condition Check', 'Array Index', 'Object Key', 'String Buffer', 'Number Calc'
  ];

  constructor(cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>) {
    this.cameraRef = cameraRef;
    this.textureManager = new TextureManager();
  }

  // Create different 3D geometries with increased sizes
  private createShapeGeometry(shapeType: string): THREE.BufferGeometry {
    const size = 6; // INCREASED base size from 3 to 6
    
    switch (shapeType) {
      case 'cube':
        return new THREE.BoxGeometry(size, size, size);
      
      case 'sphere':
        return new THREE.SphereGeometry(size * 0.8, 20, 20); // Increased segments for smoother look
      
      case 'cylinder':
        return new THREE.CylinderGeometry(size * 0.7, size * 0.7, size * 1.4, 16); // Increased segments
      
      case 'cone':
        return new THREE.ConeGeometry(size * 0.8, size * 1.6, 16); // Increased segments
      
      case 'octahedron':
        return new THREE.OctahedronGeometry(size * 0.9);
      
      case 'tetrahedron':
        return new THREE.TetrahedronGeometry(size);
      
      case 'torus':
        return new THREE.TorusGeometry(size * 0.7, size * 0.35, 12, 20); // Increased segments
      
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(size * 0.9);
      
      default:
        return new THREE.BoxGeometry(size, size, size);
    }
  }

  // Create texture for different shapes with larger canvas
  private createShapeTexture(shapeName: string, shapeIndex: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512; // INCREASED from 256 to 512 for better quality
    canvas.height = 512; // INCREASED from 256 to 512 for better quality

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Create gradient background
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    const colors = [
      ['#4ade80', '#22c55e'], // Green
      ['#3b82f6', '#1d4ed8'], // Blue
      ['#f59e0b', '#d97706'], // Orange
      ['#ef4444', '#dc2626'], // Red
      ['#8b5cf6', '#7c3aed'], // Purple
      ['#06b6d4', '#0891b2'], // Cyan
      ['#f97316', '#ea580c'], // Orange-red
      ['#10b981', '#059669'], // Emerald
    ];
    
    const colorPair = colors[shapeIndex % colors.length];
    gradient.addColorStop(0, colorPair[0]);
    gradient.addColorStop(1, colorPair[1]);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add border with increased thickness
    context.strokeStyle = '#ffffff';
    context.lineWidth = 8; // INCREASED from 4 to 8
    context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Add shape name text with larger font
    context.fillStyle = '#ffffff';
    context.font = 'bold 48px Arial'; // INCREASED from 24px to 48px
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Add text shadow with increased blur
    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 8; // INCREASED from 4 to 8
    context.shadowOffsetX = 4; // INCREASED from 2 to 4
    context.shadowOffsetY = 4; // INCREASED from 2 to 4
    
    // Split text into multiple lines if too long
    const words = shapeName.split(' ');
    const maxWidth = canvas.width - 80; // INCREASED margin from 40 to 80
    const lineHeight = 60; // INCREASED from 30 to 60
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = context.measureText(testLine).width;
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    // Draw text lines
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      context.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Create various 3D shapes at different positions around the path
  public createVariousShapes(globalRowIndex: number, curveOffset: number, distance: number): THREE.Mesh {
    const shapeIndex = Math.floor(globalRowIndex / 15) % this.shapeTypes.length;
    const shapeType = this.shapeTypes[shapeIndex];
    const shapeName = this.shapeLabels[shapeIndex % this.shapeLabels.length];
    
    // Create geometry based on shape type
    const geometry = this.createShapeGeometry(shapeType);
    
    // Create texture for the shape
    const texture = this.createShapeTexture(shapeName, shapeIndex);
    
    // Create material with texture and some transparency for variety - ENHANCED for clicks
    const material = new THREE.MeshLambertMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    
    const shape = new THREE.Mesh(geometry, material);
    shape.castShadow = true;
    shape.receiveShadow = true;
    
    // Add click interaction data
    shape.userData = {
      isClickable: true,
      shapeType: shapeType,
      shapeName: shapeName,
      shapeIndex: shapeIndex,
      globalRowIndex: globalRowIndex
    };
    
    // Calculate varied positioning around the path
    const positionData = this.calculateShapePosition(globalRowIndex, curveOffset, 'main');
    
    // Position the shape with calculated offset
    shape.position.set(positionData.x, positionData.y, -distance);
    
    // Add floating animation with unique timing
    const time = Date.now() * 0.001;
    const floatOffset = Math.sin(time * 0.4 + globalRowIndex * 0.12) * 0.6;
    shape.position.y += floatOffset;
    
    // Add rotation animation based on shape type
    switch (shapeType) {
      case 'cube':
        shape.rotation.x = time * 0.3 + globalRowIndex;
        shape.rotation.y = time * 0.2 + globalRowIndex;
        break;
      case 'sphere':
        shape.rotation.y = time * 0.5 + globalRowIndex * 0.1;
        break;
      case 'cylinder':
        shape.rotation.y = time * 0.6 + globalRowIndex * 0.05;
        break;
      case 'cone':
        shape.rotation.z = Math.sin(time * 0.3 + globalRowIndex) * 0.2;
        break;
      case 'torus':
        shape.rotation.x = time * 0.4 + globalRowIndex * 0.08;
        shape.rotation.z = time * 0.3 + globalRowIndex * 0.06;
        break;
      default:
        shape.rotation.y = time * 0.4 + globalRowIndex * 0.1;
    }
    
    return shape;
  }

  // Create smaller decorative shapes at varied positions with increased size
  public createDecorativeShapes(globalRowIndex: number, curveOffset: number, distance: number): THREE.Mesh {
    const decorativeShapes = ['tetrahedron', 'octahedron', 'sphere'];
    const shapeIndex = globalRowIndex % decorativeShapes.length;
    const shapeType = decorativeShapes[shapeIndex];
    
    // INCREASED size for decorative shapes
    const size = 3; // INCREASED from 1.5 to 3
    let geometry: THREE.BufferGeometry;
    
    switch (shapeType) {
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(size);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(size);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(size, 16, 16); // Increased segments
        break;
      default:
        geometry = new THREE.TetrahedronGeometry(size);
    }
    
    // Create simple colored material - ENHANCED for clicks
    const colors = [0x4ade80, 0x3b82f6, 0xf59e0b, 0xef4444, 0x8b5cf6, 0x06b6d4];
    const color = colors[shapeIndex % colors.length];
    
    const material = new THREE.MeshLambertMaterial({ 
      color: color,
      transparent: true,
      opacity: 0.7
    });
    
    const shape = new THREE.Mesh(geometry, material);
    
    // Add click interaction data
    shape.userData = {
      isClickable: true,
      shapeType: `decorative_${shapeType}`,
      shapeName: `Decorative ${shapeType}`,
      shapeIndex: shapeIndex,
      globalRowIndex: globalRowIndex
    };
    
    // Calculate varied positioning for decorative shapes
    const positionData = this.calculateShapePosition(globalRowIndex, curveOffset, 'decorative');
    
    // Position with calculated offset
    shape.position.set(positionData.x, positionData.y, -distance);
    
    // Add gentle floating animation
    const time = Date.now() * 0.001;
    const floatOffset = Math.sin(time * 0.8 + globalRowIndex * 0.2) * 0.5; // Slightly increased float
    shape.position.y += floatOffset;
    
    // Add slow rotation
    shape.rotation.x = time * 0.2 + globalRowIndex * 0.1;
    shape.rotation.y = time * 0.15 + globalRowIndex * 0.08;
    
    return shape;
  }

  // Create milestone text at varied positions
  public createMilestoneText(globalRowIndex: number, curveOffset: number, distance: number): THREE.Group {
    const milestoneCount = globalRowIndex / 40;
    const textLines = this.getMilestoneTextContent(milestoneCount);

    // Create a group to hold all text meshes for this milestone
    const textGroup = new THREE.Group();
    
    // Add click interaction data to the group
    textGroup.userData = {
      isClickable: true,
      shapeType: 'milestone_text',
      shapeName: `Milestone ${milestoneCount}`,
      milestoneCount: milestoneCount,
      globalRowIndex: globalRowIndex
    };
    
    const textHeight = 2.5;
    const lineSpacing = 3;
    const totalHeight = (textLines.length - 1) * lineSpacing;
    
    textLines.forEach((line, index) => {
      const textMesh = this.createTextMesh(line, index);
      
      // Add click data to individual text meshes too
      textMesh.userData = {
        isClickable: true,
        shapeType: 'milestone_text_line',
        shapeName: line,
        lineIndex: index,
        globalRowIndex: globalRowIndex
      };
      
      // Position each line with proper spacing
      const yOffset = (totalHeight / 2) - (index * lineSpacing);
      textMesh.position.set(0, yOffset, 0); // Position relative to group
      
      textGroup.add(textMesh);
    });

    // Get varied position for milestone text
    const positionData = this.calculateShapePosition(globalRowIndex, curveOffset, 'milestone');
    textGroup.position.set(positionData.x, positionData.y, -distance);
    
    // Add floating animation
    const time = Date.now() * 0.001;
    textGroup.position.y += Math.sin(time * 0.5 + globalRowIndex) * 0.8;
    
    // Make text face camera
    if (this.cameraRef.current) {
      textGroup.lookAt(this.cameraRef.current.position);
    }

    return textGroup;
  }

  // Create AI agent box
  public createAgentBox(globalRowIndex: number, curveOffset: number, distance: number): THREE.Mesh {
    // Get AI agent name based on milestone number
    const agentIndex = (Math.floor(globalRowIndex / 60) - 1) % AIAgents.length;
    const agentName = AIAgents[agentIndex];
    
    // INCREASED AI agent box size for better prominence
    const boxGeometry = new THREE.BoxGeometry(10, 7, 4.5); // INCREASED from 6, 4, 2.5
    
    // Create texture for the box with section indicator
    const texture = this.textureManager.createBoxTexture(agentName, agentIndex);
    
    // Create materials for each face with BRIGHT, VIBRANT colors
    const gradientColors = this.textureManager.getGradientColors();
    const colorIndex = agentIndex % gradientColors.length;
    
    // BRIGHT direction colors
    const agentSection = Math.floor(globalRowIndex / 60) - 1;
    const isClockwise = agentSection % 2 === 0;
    const directionColor = isClockwise ? 0x00ff00 : 0xff00ff; // Bright green or magenta
    
    // BRIGHT face colors
    const brightColors = [
      0xff006e, // Bright pink
      0x00ff88, // Bright green
      0xff00ff, // Magenta
      0x00ffff, // Cyan
      0xff8800, // Bright orange
      0x8800ff, // Purple
      0xff0080, // Hot pink
      0x00ff00, // Bright green
    ];
    
    const faceColor = brightColors[agentIndex % brightColors.length];
    
    const materials = [
      new THREE.MeshLambertMaterial({ color: faceColor }), // Right - bright color
      new THREE.MeshLambertMaterial({ color: faceColor }), // Left - bright color
      new THREE.MeshLambertMaterial({ color: directionColor }), // Top - shows direction
      new THREE.MeshLambertMaterial({ color: 0xffff00 }), // Bottom - bright yellow
      new THREE.MeshLambertMaterial({ map: texture }), // Front - texture
      new THREE.MeshLambertMaterial({ color: faceColor })  // Back - bright color
    ];
    
    const box = new THREE.Mesh(boxGeometry, materials);
    box.castShadow = true;
    box.receiveShadow = true;
    
    // Add click interaction data
    box.userData = {
      isClickable: true,
      shapeType: 'ai_agent',
      shapeName: agentName,
      agentIndex: agentIndex,
      globalRowIndex: globalRowIndex,
      isClockwise: isClockwise
    };
    
    // INCREASED base height for better visibility
    const baseY = 24; // INCREASED from 20 to 24
    box.position.set(curveOffset, baseY, -distance);
    
    // Enhanced animation with larger floating range
    const time = Date.now() * 0.001;
    const simpleFloat = Math.sin(time * 0.3 + globalRowIndex * 0.1) * 0.8; // INCREASED from 0.4 to 0.8
    box.position.y += simpleFloat;
    
    // Enhanced rotation
    box.rotation.y = Math.sin(time * 0.2 + globalRowIndex * 0.05) * 0.15; // INCREASED from 0.1 to 0.15
    
    return box;
  }

  // Create individual text mesh - SIMPLIFIED without glassmorphism
  private createTextMesh(text: string, lineIndex: number): THREE.Mesh {
    // Create plane geometry for text
    const textGeometry = new THREE.PlaneGeometry(12, 2.5);
    
    // Create canvas for text texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 128;

    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Set text properties based on line index
    const fontSize = lineIndex === 0 ? 36 : 28; // First line bigger
    const fontWeight = lineIndex === 0 ? 'bold' : 'normal';
    const textColor = this.getLineColor(lineIndex);

    // Draw text directly without background or borders
    context.fillStyle = textColor;
    context.font = `${fontWeight} ${fontSize}px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Add text shadow for better readability
    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // Create material with texture - ENHANCED for clicks
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0, // Full opacity for cleaner text
      side: THREE.DoubleSide,
      alphaTest: 0.1
    });

    return new THREE.Mesh(textGeometry, material);
  }

  private getLineColor(lineIndex: number): string {
    const colors = [
      '#ffffff', // White for main title
      '#4ade80', // Green for subtitle
      '#3b82f6'  // Blue for description
    ];
    return colors[lineIndex] || '#ffffff';
  }

  // Get text content based on milestone number
  private getMilestoneTextContent(milestoneCount: number): string[] {
    const milestoneTexts = [
      ["🎯 First Milestone!", "Path Foundation", "Journey Begins"],
      ["🚀 Second Milestone!", "Momentum Building", "Keep Moving Forward"],
      ["⭐ Third Milestone!", "Excellence Achieved", "Reaching New Heights"],
      ["🏆 Fourth Milestone!", "Master Level", "Outstanding Progress"],
      ["💎 Fifth Milestone!", "Diamond Achievement", "Legendary Status"],
      ["🌟 Sixth Milestone!", "Stellar Performance", "Beyond Expectations"],
      ["🔥 Seventh Milestone!", "On Fire!", "Unstoppable Force"],
      ["⚡ Eighth Milestone!", "Lightning Speed", "Power Unleashed"],
      ["🎊 Ninth Milestone!", "Celebration Time", "Almost There"],
      ["👑 Tenth Milestone!", "Royal Achievement", "Crown Jewel"]
    ];

    // Cycle through milestone texts, or create generic ones for higher numbers
    if (milestoneCount <= milestoneTexts.length) {
      return milestoneTexts[milestoneCount - 1];
    } else {
      return [
        `🌌 Milestone ${milestoneCount}!`,
        "Infinite Possibilities",
        "Beyond the Stars"
      ];
    }
  }

  private calculateShapePosition(globalRowIndex: number, curveOffset: number, shapeType: 'main' | 'decorative' | 'milestone'): { x: number, y: number } {
    // Calculate screen width for positioning
    const cameraDistance = 25;
    const fov = 75;
    const screenWidth = 2 * Math.tan((fov * Math.PI / 180) / 2) * cameraDistance;
    
    // Different positioning strategies based on shape type
    switch (shapeType) {
      case 'main':
        return this.getMainShapePosition(globalRowIndex, curveOffset, screenWidth);
      case 'decorative':
        return this.getDecorativeShapePosition(globalRowIndex, curveOffset, screenWidth);
      case 'milestone':
        return this.getMilestoneShapePosition(globalRowIndex, curveOffset, screenWidth);
      default:
        return { x: curveOffset, y: 12 };
    }
  }

  private getMainShapePosition(globalRowIndex: number, curveOffset: number, screenWidth: number): { x: number, y: number } {
    // Create patterns for main shapes positioning
    const positionIndex = Math.floor(globalRowIndex / 15) % 8; // 8 different position patterns
    
    let xOffset = 0;
    let yOffset = 12; // Base height
    
    switch (positionIndex) {
      case 0: // Left side of path
        xOffset = curveOffset - screenWidth * 0.15;
        yOffset = 10;
        break;
      case 1: // Right side of path
        xOffset = curveOffset + screenWidth * 0.15;
        yOffset = 14;
        break;
      case 2: // Far left
        xOffset = curveOffset - screenWidth * 0.25;
        yOffset = 8;
        break;
      case 3: // Far right
        xOffset = curveOffset + screenWidth * 0.25;
        yOffset = 16;
        break;
      case 4: // Slightly left, higher
        xOffset = curveOffset - screenWidth * 0.08;
        yOffset = 18;
        break;
      case 5: // Slightly right, lower
        xOffset = curveOffset + screenWidth * 0.08;
        yOffset = 6;
        break;
      case 6: // Center path (original position)
        xOffset = curveOffset;
        yOffset = 12;
        break;
      case 7: // Alternating sides with height variation
        const isLeft = globalRowIndex % 30 < 15;
        xOffset = curveOffset + (isLeft ? -screenWidth * 0.2 : screenWidth * 0.2);
        yOffset = isLeft ? 15 : 9;
        break;
    }
    
    // Add some organic variation
    const organicX = Math.sin(globalRowIndex * 0.1) * (screenWidth * 0.03);
    const organicY = Math.cos(globalRowIndex * 0.08) * 2;
    
    return {
      x: xOffset + organicX,
      y: yOffset + organicY
    };
  }

  private getDecorativeShapePosition(globalRowIndex: number, curveOffset: number, screenWidth: number): { x: number, y: number } {
    // More varied positioning for decorative shapes
    const positionIndex = globalRowIndex % 12; // 12 different decorative patterns
    
    let xOffset = 0;
    let yOffset = 6; // Lower base height
    
    switch (positionIndex) {
      case 0: // Close left
        xOffset = curveOffset - screenWidth * 0.1;
        yOffset = 4;
        break;
      case 1: // Close right
        xOffset = curveOffset + screenWidth * 0.1;
        yOffset = 8;
        break;
      case 2: // Medium left
        xOffset = curveOffset - screenWidth * 0.18;
        yOffset = 6;
        break;
      case 3: // Medium right
        xOffset = curveOffset + screenWidth * 0.18;
        yOffset = 10;
        break;
      case 4: // Far left, low
        xOffset = curveOffset - screenWidth * 0.3;
        yOffset = 3;
        break;
      case 5: // Far right, low
        xOffset = curveOffset + screenWidth * 0.3;
        yOffset = 3;
        break;
      case 6: // Left side, elevated
        xOffset = curveOffset - screenWidth * 0.12;
        yOffset = 12;
        break;
      case 7: // Right side, elevated
        xOffset = curveOffset + screenWidth * 0.12;
        yOffset = 12;
        break;
      case 8: // Scattered left pattern
        xOffset = curveOffset - screenWidth * (0.05 + Math.sin(globalRowIndex * 0.2) * 0.1);
        yOffset = 5 + Math.cos(globalRowIndex * 0.15) * 3;
        break;
      case 9: // Scattered right pattern
        xOffset = curveOffset + screenWidth * (0.05 + Math.cos(globalRowIndex * 0.25) * 0.1);
        yOffset = 7 + Math.sin(globalRowIndex * 0.18) * 4;
        break;
      case 10: // Random near path
        const randomSide = Math.sin(globalRowIndex * 0.3) > 0 ? 1 : -1;
        xOffset = curveOffset + randomSide * screenWidth * (0.06 + Math.abs(Math.sin(globalRowIndex * 0.12)) * 0.08);
        yOffset = 4 + Math.abs(Math.cos(globalRowIndex * 0.09)) * 6;
        break;
      case 11: // Floating above path center
        xOffset = curveOffset + Math.sin(globalRowIndex * 0.4) * screenWidth * 0.05;
        yOffset = 15 + Math.cos(globalRowIndex * 0.22) * 3;
        break;
    }
    
    // Add more random variation for decorative shapes
    const randomX = (Math.sin(globalRowIndex * 0.33) * 0.5 + Math.cos(globalRowIndex * 0.47) * 0.3) * screenWidth * 0.05;
    const randomY = Math.sin(globalRowIndex * 0.19) * 2;
    
    return {
      x: xOffset + randomX,
      y: Math.max(2, yOffset + randomY) // Ensure minimum height of 2
    };
  }

  private getMilestoneShapePosition(globalRowIndex: number, curveOffset: number, screenWidth: number): { x: number, y: number } {
    // Special positioning for milestone elements (keep them more visible)
    const milestoneIndex = Math.floor(globalRowIndex / 40) % 4;
    
    let xOffset = curveOffset;
    let yOffset = 25; // High base height for visibility
    
    switch (milestoneIndex) {
      case 0: // Center high
        xOffset = curveOffset;
        yOffset = 25;
        break;
      case 1: // Left elevated
        xOffset = curveOffset - screenWidth * 0.1;
        yOffset = 22;
        break;
      case 2: // Right elevated
        xOffset = curveOffset + screenWidth * 0.1;
        yOffset = 22;
        break;
      case 3: // Center very high
        xOffset = curveOffset;
        yOffset = 28;
        break;
    }
    
    return { x: xOffset, y: yOffset };
  }

  // Add cleanup method
  public dispose(): void {
    // Cleanup any resources if needed
  }
}