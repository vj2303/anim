'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SceneManager } from '../components/SceneManager';
import { CameraControls } from '../components/CameraControls';
import { PathRenderer } from '../components/PathRenderer';
import { AnimationManager } from '../components/AnimationManager';
import { EnhancedMomentumScroller } from '../components/EnhancedMomentumScroller';
import { InteractionManager } from '../components/InteractionManager';
import { AgentNameOverlay } from '../components/AgentNameOverlay';
import { AgentInfoManager } from '../components/AgentInfoManager';
import { useGSAP } from '../hooks/useGSAP';
import Parallax3DSpace from '@/components/Parallax3DSpace';
import SimpleAudioManagerComponent from '@/components/SimpleAudioManager';
import gsap from 'gsap';
import { Canvas } from '@react-three/fiber';
import { BreakableCube } from '../components/BreakableCube';
import { AIAgents } from '../constants/AIAgents';
import Spline from '@splinetool/react-spline';

if (typeof window !== 'undefined') {
  (window as any).gsap = gsap;
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
  
  // Component references
  const pathRendererRef = useRef<PathRenderer | null>(null);
  const animationManagerRef = useRef<AnimationManager | null>(null);
  const momentumScrollerRef = useRef<EnhancedMomentumScroller | null>(null);
  const interactionManagerRef = useRef<InteractionManager | null>(null);
  const agentNameOverlayRef = useRef<AgentNameOverlay | null>(null);
  const agentInfoManagerRef = useRef<AgentInfoManager | null>(null);
  
  // Background tracking
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const currentAgentRef = useRef(0);

  // Spline overlay state
  const [showSplineOverlay, setShowSplineOverlay] = useState(false);
  const [splineSceneUrl, setSplineSceneUrl] = useState('https://prod.spline.design/i8eNphGELT2tDQVT/scene.splinecode');

  // Initialize GSAP
  useGSAP();

  // Handler for Spline object click
  const handleSplineClick = (sceneUrl: string) => {
    setSplineSceneUrl(sceneUrl);
    setShowSplineOverlay(true);
  };

  // Initialize Three.js scene
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    const sceneManager = new SceneManager();
    const scene = sceneManager.createScene();
    sceneRef.current = scene;
    sceneManagerRef.current = sceneManager;

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

    // Initialize agent info manager
    const agentInfoManager = new AgentInfoManager(sceneRef, cameraRef, controlsRef);
    agentInfoManagerRef.current = agentInfoManager;

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
    pathRendererRef.current = pathRenderer;
    pathRenderer.initializeFloatingText(scene);
    pathRenderer.createDottedPath();

    // Initialize animation manager
    const animationManager = new AnimationManager(
      dotsArrayRef,
      textMeshesRef,
      positionRef,
      cameraRef
    );
    animationManagerRef.current = animationManager;
    animationManager.setPathRenderer(pathRendererRef);

    // Initialize enhanced momentum scroller
    const momentumScroller = new EnhancedMomentumScroller(
      positionRef,
      pathRendererRef,
      sceneManagerRef,
      currentAgentRef,
      animationManagerRef
    );
    momentumScrollerRef.current = momentumScroller;

    // Initialize interaction manager for 3D object touch/click animations
    const interactionManager = new InteractionManager(
      cameraRef,
      sceneRef,
      cardsGroupRef,
      textGroupRef,
      dotsGroupRef,
      handleAgentClick,
      handleSplineClick
    );
    interactionManagerRef.current = interactionManager;

    // Initialize agent name overlay for front-screen agent name display
    const agentNameOverlay = new AgentNameOverlay(
      sceneRef,
      cameraRef,
      positionRef,
      currentAgentRef
    );
    agentNameOverlayRef.current = agentNameOverlay;
    agentNameOverlay.initialize();

    // Add event listeners for 3D object interactions
    const handlePointerMove = (event: PointerEvent) => {
      interactionManager.handlePointerMove(event);
    };

    const handleTouchMove = (event: TouchEvent) => {
      interactionManager.handleTouchMove(event);
    };

    const handleClick = (event: MouseEvent) => {
      // Custom click handler to include overlayGroup
      if (interactionManager && agentNameOverlayRef.current) {
        const overlayGroup = agentNameOverlayRef.current.getOverlayGroup();
        interactionManager.handleClick(event, overlayGroup);
      } else {
        interactionManager.handleClick(event);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    renderer.domElement.addEventListener('click', handleClick);

    // Render loop
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      animationManager.animate();
      
      // Update momentum scroller
      if (momentumScrollerRef.current) {
        momentumScrollerRef.current.update();
      }

      // Update interaction manager
      if (interactionManagerRef.current) {
        interactionManagerRef.current.update();
      }

      // Update agent name overlay
      if (agentNameOverlayRef.current) {
        agentNameOverlayRef.current.update();
      }
      
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
      
      // Remove interaction event listeners
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('click', handleClick);
      
      // Type assertion for GSAP cleanup
      const windowWithGsap = window as unknown as { gsap?: { killTweensOf: (target: unknown) => void } };
      if (windowWithGsap.gsap) {
        windowWithGsap.gsap.killTweensOf(positionRef);
      }
      
      if (controlsRef.current?.dispose) {
        controlsRef.current.dispose();
      }
      
      if (pathRendererRef.current) {
        pathRendererRef.current.dispose();
      }
      
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose();
      }
      
      if (momentumScrollerRef.current) {
        momentumScrollerRef.current.dispose();
      }

      if (interactionManagerRef.current) {
        interactionManagerRef.current.dispose();
      }
      
      if (agentNameOverlayRef.current) {
        agentNameOverlayRef.current.dispose();
      }

      if (agentInfoManagerRef.current) {
        agentInfoManagerRef.current.dispose();
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

  // Handler for agent click
  const handleAgentClick = (agentIndex: number, position: THREE.Vector3) => {
    // Show agent info in a big card using AgentInfoManager
    if (agentInfoManagerRef.current) {
      agentInfoManagerRef.current.showAgentInfo(AIAgents[agentIndex]);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Existing Three.js scene is rendered here by appending renderer.domElement */}
      
      {/* Spline Overlay */}
      {showSplineOverlay && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Spline scene={splineSceneUrl} />
            <button
              onClick={() => setShowSplineOverlay(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                backdropFilter: 'blur(10px)',
                zIndex: 1001
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Audio Manager for Background Music */}
      {/* <SimpleAudioManagerComponent /> */}
    </div>
  );
}