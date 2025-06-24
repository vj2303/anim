import * as THREE from 'three';
import { MutableRefObject } from 'react';

class SimpleFloatingText3D {
  private textGroup: THREE.Group;
  private textMeshes: THREE.Mesh[] = [];
  private animationId: number | null = null;
  private startTime: number = Date.now();

  constructor() {
    this.textGroup = new THREE.Group();
  }

  getGroup(): THREE.Group {
    return this.textGroup;
  }

  createFloatingText(
    lines: string[],
    position: { x: number, y: number, z: number },
    cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>
  ): void {
    // Clear existing text
    this.clearText();

    const lineSpacing = 3;
    const totalHeight = (lines.length - 1) * lineSpacing;
    
    lines.forEach((line, index) => {
      const textMesh = this.createTextMesh(line, index);
      
      // Position each line with proper spacing
      const yOffset = (totalHeight / 2) - (index * lineSpacing);
      textMesh.position.set(
        position.x,
        position.y + yOffset,
        position.z
      );

      // Store original position for animation
      textMesh.userData = {
        originalY: position.y + yOffset,
        originalX: position.x,
        originalZ: position.z,
        lineIndex: index,
        radius: 8 + (index * 2), // Different radius for each line
        speed: 0.5 + (index * 0.2), // Different speed for each line
        phase: (index * Math.PI) / 2 // Phase offset for staggered motion
      };

      this.textMeshes.push(textMesh);
      this.textGroup.add(textMesh);
    });

    // Start animation
    this.startAnimation(cameraRef);
  }

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

    // Draw text background (optional glass effect)
    context.fillStyle = 'rgba(0, 0, 0, 0.1)';
    context.beginPath();
    context.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 15);
    context.fill();

    // Add subtle border
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 15);
    context.stroke();

    // Draw text
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

    // Create material with texture
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
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

  private startAnimation(cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>): void {
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - this.startTime) * 0.001; // Convert to seconds

      this.textMeshes.forEach((mesh) => {
        const userData = mesh.userData;
        
        // 360-degree circular floating motion
        const angle = elapsed * userData.speed + userData.phase;
        const floatHeight = Math.sin(elapsed * 0.8 + userData.phase) * 1.5;
        const bobbing = Math.sin(elapsed * 1.2 + userData.phase) * 0.3;
        
        // Calculate new position in circular motion
        const x = userData.originalX + Math.cos(angle) * userData.radius;
        const z = userData.originalZ + Math.sin(angle) * userData.radius;
        const y = userData.originalY + floatHeight + bobbing;
        
        mesh.position.set(x, y, z);
        
        // Add rotation for more dynamic effect
        mesh.rotation.y = angle * 0.3;
        mesh.rotation.x = Math.sin(elapsed * 0.6 + userData.phase) * 0.1;
        mesh.rotation.z = Math.cos(elapsed * 0.4 + userData.phase) * 0.05;
        
        // Make text face camera with slight offset for dynamic look
        if (cameraRef.current) {
          const direction = new THREE.Vector3();
          direction.subVectors(cameraRef.current.position, mesh.position);
          direction.normalize();
          
          // Create a rotation that faces the camera but with some artistic offset
          const targetRotation = new THREE.Euler();
          targetRotation.setFromVector3(direction);
          targetRotation.y += Math.sin(angle) * 0.2; // Add some sway
          
          // Smoothly interpolate to target rotation
          mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRotation.x, 0.1);
          mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRotation.y, 0.1);
        }
        
        // Pulsing opacity effect
        const opacity = 0.7 + Math.sin(elapsed * 2 + userData.phase) * 0.2;
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = opacity;
        }
      });

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  updateVisibility(isVisible: boolean): void {
    this.textGroup.visible = isVisible;
    
    // Update opacity smoothly
    this.textMeshes.forEach((mesh) => {
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        const targetOpacity = isVisible ? 0.9 : 0;
        mesh.material.opacity = THREE.MathUtils.lerp(mesh.material.opacity, targetOpacity, 0.1);
      }
    });
  }

  updatePosition(newPosition: { x: number, y: number, z: number }): void {
    // Update the original positions in userData without recreating text
    this.textMeshes.forEach((mesh, index) => {
      const lineSpacing = 3;
      const totalHeight = (this.textMeshes.length - 1) * lineSpacing;
      const yOffset = (totalHeight / 2) - (index * lineSpacing);
      
      if (mesh.userData) {
        mesh.userData.originalX = newPosition.x;
        mesh.userData.originalY = newPosition.y + yOffset;
        mesh.userData.originalZ = newPosition.z;
      }
    });
  }

  clearText(): void {
    // Stop animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Remove all text meshes
    this.textMeshes.forEach(mesh => {
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      this.textGroup.remove(mesh);
    });
    
    this.textMeshes = [];
  }

  dispose(): void {
    this.clearText();
    
    // Clean up the group
    if (this.textGroup.parent) {
      this.textGroup.parent.remove(this.textGroup);
    }
  }
}

export { SimpleFloatingText3D };