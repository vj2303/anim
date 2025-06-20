import * as THREE from 'three';

export class SceneManager {
  createScene() {
    const scene = new THREE.Scene();
    
    // Create gradient background
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#1a1a1a'); // Dark gray at top
    gradient.addColorStop(0.5, '#0f0f0f'); // Darker in middle
    gradient.addColorStop(1, '#000000'); // Pure black at bottom
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    
    const backgroundTexture = new THREE.CanvasTexture(canvas);
    const backgroundGeometry = new THREE.SphereGeometry(500, 32, 32);
    const backgroundMaterial = new THREE.MeshBasicMaterial({ 
      map: backgroundTexture, 
      side: THREE.BackSide 
    });
    const backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    scene.add(backgroundSphere);
    
    scene.fog = new THREE.Fog(0x000000, 50, 200);
    
    return scene;
  }

  setupLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
  }
}