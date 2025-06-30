import * as THREE from 'three';

export class CursorCameraMovement {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  
  // Movement settings for smooth floating effect
  public enabled: boolean = true;
  public intensity: number = 4; // Much lower intensity for subtle effect
  public smoothness: number = 0.08; // Smooth movement
  public maxOffset: number = 1.5; // Small max offset for subtle effect
  
  // Internal state
  private mousePosition: { x: number; y: number } = { x: 0.5, y: 0.5 }; // Normalized (0-1)
  private targetOffset: THREE.Vector3 = new THREE.Vector3();
  private currentOffset: THREE.Vector3 = new THREE.Vector3();
  private basePosition: THREE.Vector3 = new THREE.Vector3();
  private baseTarget: THREE.Vector3 = new THREE.Vector3(0, 5, 0);
  private originalPosition: THREE.Vector3 = new THREE.Vector3();
  
  private isInitialized: boolean = false;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Store initial camera position
    this.basePosition.copy(camera.position);
    this.originalPosition.copy(camera.position);
    
    this.setupEventListeners();
    this.isInitialized = true;
    console.log('Cursor camera movement initialized');
  }

  private setupEventListeners(): void {
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);

    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseleave', this.onMouseLeave);
    this.domElement.addEventListener('mouseenter', this.onMouseEnter);
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.enabled) return;
    
    // Normalize mouse position to 0-1 range
    this.mousePosition.x = event.clientX / window.innerWidth;
    this.mousePosition.y = event.clientY / window.innerHeight;
    
    // Calculate target offset based on mouse position
    // Center is (0.5, 0.5), so we subtract 0.5 to get -0.5 to 0.5 range
    const normalizedX = (this.mousePosition.x - 0.5) * 2; // -1 to 1
    const normalizedY = (this.mousePosition.y - 0.5) * 2; // -1 to 1
    
    // Apply intensity and max offset for pronounced floating effect
    this.targetOffset.x = normalizedX * this.intensity * this.maxOffset;
    this.targetOffset.y = -normalizedY * this.intensity * this.maxOffset * 0.3; // Reduced from 0.7 to 0.3 for more subtle Y movement
    this.targetOffset.z = 0; // Keep Z constant
    
    // Debug: Log only when there's significant movement
    if (Math.abs(this.targetOffset.x) > 0.5 || Math.abs(this.targetOffset.y) > 0.5) {
      console.log('Significant cursor movement:', { x: this.targetOffset.x, y: this.targetOffset.y });
    }
  }

  private onMouseLeave(): void {
    // Smoothly reset to center when mouse leaves
    this.targetOffset.set(0, 0, 0);
  }

  private onMouseEnter(): void {
    // Mouse entered, movement will resume on next move
  }

  // Public update method to be called from main render loop
  public update(): void {
    if (!this.enabled || !this.isInitialized) return;
    
    // Very smooth interpolation for floating effect
    this.currentOffset.lerp(this.targetOffset, this.smoothness);
    
    // Store the current camera position (which might have been set by camera controls)
    const currentCameraPosition = this.camera.position.clone();
    
    // Calculate the camera's forward direction from current position to target
    const cameraDirection = new THREE.Vector3()
      .subVectors(this.baseTarget, currentCameraPosition)
      .normalize();
    
    // Calculate right and up vectors for the camera
    const cameraRight = new THREE.Vector3()
      .crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0))
      .normalize();
    const cameraUp = new THREE.Vector3()
      .crossVectors(cameraRight, cameraDirection)
      .normalize();
    
    // Apply offset in camera space for smooth floating effect
    const offsetInWorldSpace = new THREE.Vector3()
      .addScaledVector(cameraRight, this.currentOffset.x)
      .addScaledVector(cameraUp, this.currentOffset.y);
    
    // Add subtle Z movement for depth effect
    const zOffset = Math.sin(Date.now() * 0.001) * 0.1; // Reduced from 0.5 to 0.1
    offsetInWorldSpace.z = zOffset;
    
    // Apply offset as an overlay to current camera position
    const newPosition = currentCameraPosition.clone().add(offsetInWorldSpace);
    this.camera.position.copy(newPosition);
    
    // Debug: Log only when there's significant camera movement
    if (Math.abs(this.currentOffset.x) > 0.3 || Math.abs(this.currentOffset.y) > 0.3) {
      console.log('Significant camera movement:', { x: this.currentOffset.x, y: this.currentOffset.y });
    }
    
    // Keep looking at the same target
    this.camera.lookAt(this.baseTarget);
  }

  // Public methods to control the effect
  public setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(20, intensity)); // Clamp between 0-20
  }

  public setSmoothness(smoothness: number): void {
    this.smoothness = Math.max(0.01, Math.min(1, smoothness)); // Clamp between 0.01-1
  }

  public setMaxOffset(maxOffset: number): void {
    this.maxOffset = Math.max(0.1, maxOffset); // Minimum 0.1
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
    // Reset to base position when disabled
    this.targetOffset.set(0, 0, 0);
    this.currentOffset.set(0, 0, 0);
    this.camera.position.copy(this.originalPosition);
    this.camera.lookAt(this.baseTarget);
  }

  public updateBasePosition(): void {
    // Call this when the camera's base position changes
    this.basePosition.copy(this.camera.position);
  }

  public setBaseTarget(target: THREE.Vector3): void {
    this.baseTarget.copy(target);
  }

  public dispose(): void {
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseleave', this.onMouseLeave);
    this.domElement.removeEventListener('mouseenter', this.onMouseEnter);
  }
} 