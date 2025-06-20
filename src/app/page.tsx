'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SceneManager } from '../components/SceneManager';
import { CameraControls } from '../components/CameraControls';
import { PathRenderer } from '../components/PathRenderer';
import { AnimationManager } from '../components/AnimationManager';
import { InputHandler } from '../components/InputHandler';
import { SimpleAudioManager } from '../components/EnhancedAudioManager';
import { useGSAP } from '../hooks/useGSAP';

// Define types for GSAP on window
interface GSAPTarget {
  current: number;
}

interface GSAPVars {
  current: number;
  duration: number;
  ease: string;
  onUpdate?: () => void;
  onComplete?: () => void;
}

declare global {
  interface Window {
    gsap?: {
      to: (target: GSAPTarget, vars: GSAPVars) => void;
    };
  }
}

export default function DottedPath() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<CameraControls | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  // Path state
  const positionRef = useRef(0);
  const dotsGroupRef = useRef<THREE.Group | null>(null);
  const cardsGroupRef = useRef<THREE.Group | null>(null);
  const textGroupRef = useRef<THREE.Group | null>(null);
  const dotsArrayRef = useRef<THREE.Mesh[]>([]);
  const textMeshesRef = useRef<THREE.Mesh[]>([]);
  
  // GSAP and scroll snapping
  const isSnappingRef = useRef(false);
  const targetPositionRef = useRef(0);

  // Initialize GSAP
  useGSAP();

  // Initialize Three.js scene
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    const sceneManager = new SceneManager();
    const scene = sceneManager.createScene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    containerElement.appendChild(renderer.domElement);

    // Initialize camera controls
    const cameraControls = new CameraControls(camera, renderer.domElement);
    controlsRef.current = cameraControls;

    // Setup lighting
    sceneManager.setupLighting(scene);

    // Create groups
    const dotsGroup = new THREE.Group();
    const cardsGroup = new THREE.Group();
    const textGroup = new THREE.Group();
    scene.add(dotsGroup);
    scene.add(cardsGroup);
    scene.add(textGroup);
    
    dotsGroupRef.current = dotsGroup;
    cardsGroupRef.current = cardsGroup;
    textGroupRef.current = textGroup;

    // Initialize animation manager
    const animationManager = new AnimationManager(
      dotsArrayRef,
      textMeshesRef,
      positionRef,
      cameraRef
    );

    // Initialize path renderer
    const pathRenderer = new PathRenderer(
      dotsGroupRef,
      cardsGroupRef,
      textGroupRef,
      dotsArrayRef,
      textMeshesRef,
      positionRef,
      cameraRef
    );

    // Create initial path
    pathRenderer.createDottedPath();

    // Render loop
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      animationManager.animate();
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (controlsRef.current && controlsRef.current.dispose) {
        controlsRef.current.dispose();
      }
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerElement && renderer.domElement) {
        containerElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Snap to agent function
  const snapToAgent = (direction: number) => {
    if (isSnappingRef.current || !window.gsap) return;
    
    const currentAgent = Math.floor(positionRef.current / 60);
    let targetAgent: number;
    
    if (direction > 0) {
      targetAgent = currentAgent + 1;
    } else {
      targetAgent = Math.max(0, currentAgent - 1);
    }
    
    const targetPosition = targetAgent * 60;
    targetPositionRef.current = targetPosition;
    
    if (targetPosition === positionRef.current) return;
    
    isSnappingRef.current = true;
    
    window.gsap.to(positionRef, {
      current: targetPosition,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        // Recreate path on update
        if (dotsGroupRef.current && cardsGroupRef.current && textGroupRef.current) {
          const pathRenderer = new PathRenderer(
            dotsGroupRef,
            cardsGroupRef,
            textGroupRef,
            dotsArrayRef,
            textMeshesRef,
            positionRef,
            cameraRef
          );
          pathRenderer.createDottedPath();
        }
      },
      onComplete: () => {
        isSnappingRef.current = false;
      }
    });
  };

  return (
    <div style={{
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      background: '#000'
    }}>
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%'
        }}
      />
      
      <InputHandler 
        snapToAgent={snapToAgent}
        isSnappingRef={isSnappingRef}
      />
      
      <SimpleAudioManager />
    </div>
  );
}