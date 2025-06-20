import * as THREE from 'three';

export class CameraControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Control settings
    this.enabled = true;
    this.target = new THREE.Vector3(0, 5, 0);
    this.minDistance = 15;
    this.maxDistance = 50;
    this.minPolarAngle = Math.PI * 0.2;
    this.maxPolarAngle = Math.PI * 0.8;
    this.enablePan = false;
    this.enableZoom = true;
    this.enableRotate = true;
    this.rotateSpeed = 0.3;
    this.zoomSpeed = 0.5;
    this.dampingFactor = 0.1;

    // Internal state
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    
    // Set initial camera position
    this.spherical.setFromVector3(this.camera.position.clone().sub(this.target));

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);

    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel);
  }

  onMouseDown(event) {
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  onMouseMove(event) {
    if (!this.isDragging) return;

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

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(event) {
    if (event.ctrlKey) return; // Let path navigation handle this
    
    const scale = event.deltaY > 0 ? 1.05 : 0.95;
    const newDistance = this.spherical.radius * scale;
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, newDistance));
  }

  update() {
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    
    // Apply angle constraints
    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
    
    this.camera.position.setFromSpherical(this.spherical).add(this.target);
    this.camera.lookAt(this.target);
    
    // Apply damping for smooth movement
    this.sphericalDelta.theta *= (1 - this.dampingFactor);
    this.sphericalDelta.phi *= (1 - this.dampingFactor);
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}