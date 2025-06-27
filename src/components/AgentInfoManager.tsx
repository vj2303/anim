import * as THREE from 'three';
import { MutableRefObject } from 'react';
import gsap from 'gsap';

interface AgentInfo {
  name: string;
  description: string;
}

export class AgentInfoManager {
  private sceneRef: MutableRefObject<THREE.Scene | null>;
  private cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>;
  private controlsRef: MutableRefObject<any | null>;
  private agentInfoGroup: THREE.Group | null = null;
  private isShowingInfo: boolean = false;
  private originalCameraPosition: THREE.Vector3 | null = null;
  private originalCameraTarget: THREE.Vector3 | null = null;
  private backButtonElement: HTMLButtonElement | null = null;
  private cleanupHoverEffect: (() => void) | null = null;

  constructor(
    sceneRef: MutableRefObject<THREE.Scene | null>,
    cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>,
    controlsRef: MutableRefObject<any | null>
  ) {
    this.sceneRef = sceneRef;
    this.cameraRef = cameraRef;
    this.controlsRef = controlsRef;
  }

  public showAgentInfo(agent: AgentInfo): void {
    if (this.isShowingInfo || !this.sceneRef.current || !this.cameraRef.current) return;

    this.isShowingInfo = true;

    // Store original camera position and target
    this.originalCameraPosition = this.cameraRef.current.position.clone();
    this.originalCameraTarget = new THREE.Vector3(0, 0, 0);

    // Create agent info group
    this.createAgentInfoGroup(agent);

    // --- Center the card in front of the camera ---
    // Place the card a fixed distance in front of the camera, always facing the camera
    const camera = this.cameraRef.current;
    const distance = 30; // Distance in front of camera
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const cardPosition = camera.position.clone().add(cameraDirection.multiplyScalar(distance));
    if (this.agentInfoGroup) {
      this.agentInfoGroup.position.copy(cardPosition);
      this.agentInfoGroup.lookAt(camera.position);
    }

    // --- Disable all controls and interactions ---
    // Disable camera controls
    if (this.controlsRef.current) {
      this.controlsRef.current.enabled = false;
    }
    // Disable scrolling and pointer events on the canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.pointerEvents = 'none';
      canvas.style.filter = 'blur(2px)';
    }
    // Optionally, disable scrolling on the body
    document.body.style.overflow = 'hidden';

    // Animate in
    this.agentInfoGroup.scale.set(0, 0, 0);
    gsap.to(this.agentInfoGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.6,
      ease: 'back.out(1.7)'
    });

    // Create back button
    this.createBackButton();
  }

  public hideAgentInfo(): void {
    if (!this.isShowingInfo) return;

    this.isShowingInfo = false;

    // --- Restore controls and interactions ---
    // Re-enable camera controls
    if (this.controlsRef.current) {
      this.controlsRef.current.enabled = true;
    }
    // Re-enable pointer events and remove blur
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.pointerEvents = '';
      canvas.style.filter = '';
    }
    // Restore scrolling
    document.body.style.overflow = '';

    // Animate out the agent info group
    if (this.agentInfoGroup) {
      gsap.to(this.agentInfoGroup.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.5,
        ease: 'power3.in',
        onComplete: () => {
          if (this.agentInfoGroup) {
            this.removeAgentInfoGroup();
          }
        }
      });
    }

    // Remove back button
    this.removeBackButton();
  }

  private createAgentInfoGroup(agent: AgentInfo): void {
    if (!this.sceneRef.current) return;

    this.agentInfoGroup = new THREE.Group();
    // Position the group in front of the camera
    this.agentInfoGroup.position.set(80, 0, -100);
    this.agentInfoGroup.rotation.set(0, 0, 0);
    this.sceneRef.current.add(this.agentInfoGroup);

    // --- Card with rounded corners and gradient background ---
    const cardWidth = 50;
    const cardHeight = 30;
    const cardTexture = this.createGradientRoundedRectTexture(cardWidth * 32, cardHeight * 32, 48, '#4a90e2', '#8f5cff');
    const cardGeometry = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const cardMaterial = new THREE.MeshBasicMaterial({ map: cardTexture, transparent: true });
    const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
    cardMesh.position.set(0, 0, 0);
    this.agentInfoGroup.add(cardMesh);

    // --- Agent name and description as before ---
    const nameFontSize = 180;
    const nameTexture = this.createSimpleTextTexture(agent.name, nameFontSize, '#000', cardWidth * 36, 400, false);
    const nameGeometry = new THREE.PlaneGeometry(cardWidth * 0.9, 5.5);
    const nameMaterial = new THREE.MeshBasicMaterial({ map: nameTexture, transparent: true });
    const nameMesh = new THREE.Mesh(nameGeometry, nameMaterial);
    nameMesh.position.set(0, 8, 0.01);
    this.agentInfoGroup.add(nameMesh);

    const descFontSize = 90;
    const descTexture = this.createSimpleTextTexture(agent.description, descFontSize, '#000', cardWidth * 32, 700, false);
    const descGeometry = new THREE.PlaneGeometry(cardWidth * 0.85, 13);
    const descMaterial = new THREE.MeshBasicMaterial({ map: descTexture, transparent: true });
    const descMesh = new THREE.Mesh(descGeometry, descMaterial);
    descMesh.position.set(0, -4, 0.01);
    this.agentInfoGroup.add(descMesh);

    // Animate in
    this.agentInfoGroup.scale.set(0, 0, 0);
    gsap.to(this.agentInfoGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.6,
      ease: 'back.out(1.7)'
    });
  }

  // Helper for simple text (no bold, no shadow, word wrap)
  private createSimpleTextTexture(text: string, fontSize: number, color: string, width: number, height: number, bold: boolean = false): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px Segoe UI, Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // No shadow

    // Word wrap logic
    const maxTextWidth = width * 0.9;
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Draw each line
    const lineHeight = fontSize * 1.25;
    const totalTextHeight = lines.length * lineHeight;
    let y = height / 2 - totalTextHeight / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], width / 2, y);
      y += lineHeight;
    }

    return new THREE.CanvasTexture(canvas);
  }

  // Helper to create a rounded rectangle gradient texture for the card background
  private createGradientRoundedRectTexture(width: number, height: number, radius: number, color1: string, color2: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    // Draw rounded rect (no shadow/blur)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
    // Draw border
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#222';
    ctx.stroke();
    return new THREE.CanvasTexture(canvas);
  }

  private createBackButton(): void {
    this.backButtonElement = document.createElement('button');
    this.backButtonElement.textContent = '← Back to Path';
    this.backButtonElement.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 80px;
      background: linear-gradient(135deg, #4a90e2, #357abd);
      border: none;
      color: #fff;
      font-size: 28px;
      font-weight: bold;
      border-radius: 40px;
      cursor: pointer;
      box-shadow: 0 8px 40px rgba(74, 144, 226, 0.6);
      padding: 20px 50px;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 2px;
      z-index: 5000;
      font-family: 'Segoe UI', Arial, sans-serif;
      min-width: 250px;
    `;

    this.backButtonElement.addEventListener('mouseenter', () => {
      this.backButtonElement!.style.transform = 'scale(1.15)';
      this.backButtonElement!.style.boxShadow = '0 10px 45px rgba(74, 144, 226, 0.8)';
      this.backButtonElement!.style.background = 'linear-gradient(135deg, #5ba0f2, #4a90e2)';
    });

    this.backButtonElement.addEventListener('mouseleave', () => {
      this.backButtonElement!.style.transform = 'scale(1)';
      this.backButtonElement!.style.boxShadow = '0 8px 40px rgba(74, 144, 226, 0.6)';
      this.backButtonElement!.style.background = 'linear-gradient(135deg, #4a90e2, #357abd)';
    });

    this.backButtonElement.addEventListener('click', () => {
      this.hideAgentInfo();
    });

    document.body.appendChild(this.backButtonElement);
  }

  private removeBackButton(): void {
    if (this.backButtonElement) {
      document.body.removeChild(this.backButtonElement);
      this.backButtonElement = null;
    }
  }

  private removeAgentInfoGroup(): void {
    if (this.agentInfoGroup && this.sceneRef.current) {
      this.sceneRef.current.remove(this.agentInfoGroup);
      this.agentInfoGroup = null;
    }
  }

  public dispose(): void {
    this.removeAgentInfoGroup();
    this.removeBackButton();
    if (this.cleanupHoverEffect) {
      this.cleanupHoverEffect();
    }
  }
} 