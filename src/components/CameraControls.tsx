import * as THREE from 'three';

export class CameraControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private onPositionChange?: () => void;
  
  // Control settings
  public enabled: boolean = true;
  public target: THREE.Vector3 = new THREE.Vector3(0, 5, 0);
  public minDistance: number = 15;
  public maxDistance: number = 50;
  public minPolarAngle: number = Math.PI * 0.2;
  public maxPolarAngle: number = Math.PI * 0.8;
  public enablePan: boolean = false;
  public enableZoom: boolean = true;
  public enableRotate: boolean = true;
  public rotateSpeed: number = 0.3;
  public zoomSpeed: number = 0.5;
  public dampingFactor: number = 0.1;

  // Internal state
  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private spherical: THREE.Spherical = new THREE.Spherical();
  private sphericalDelta: THREE.Spherical = new THREE.Spherical();

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, onPositionChange?: () => void) {
    this.camera = camera;
    this.domElement = domElement;
    this.onPositionChange = onPositionChange;
    
    // Set initial camera position
    this.spherical.setFromVector3(this.camera.position.clone().sub(this.target));

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);

    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel);
  }

  private onMouseDown(event: MouseEvent): void {
    if (!this.enabled) return;
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.enabled) return;

    const deltaMove = {
      x: event.clientX - this.previousMousePosition.x,
      y: event.clientY - this.previousMousePosition.y
    };

    const rotateAngle = 2 * Math.PI * deltaMove.x / window.innerWidth * this.rotateSpeed;
    const rotateAngleVertical = 2 * Math.PI * deltaMove.y / window.innerHeight * this.rotateSpeed;

    this.sphericalDelta.theta -= rotateAngle;
    this.sphericalDelta.phi -= rotateAngleVertical;

    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent): void {
    if (event.ctrlKey || !this.enabled) return; // Let path navigation handle this
    
    const scale = event.deltaY > 0 ? 1.05 : 0.95;
    const newDistance = this.spherical.radius * scale;
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, newDistance));
  }

  public update(): void {
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    
    // Apply angle constraints
    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
    
    this.camera.position.setFromSpherical(this.spherical).add(this.target);
    this.camera.lookAt(this.target);
    
    // Apply damping for smooth movement
    this.sphericalDelta.theta *= (1 - this.dampingFactor);
    this.sphericalDelta.phi *= (1 - this.dampingFactor);

    if (this.onPositionChange) {
      this.onPositionChange();
    }
  }

  public dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}