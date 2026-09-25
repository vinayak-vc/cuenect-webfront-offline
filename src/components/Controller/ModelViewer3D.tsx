import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AssetInformation, JoyStickDirection } from '../../types/protocol';
import { useStage } from '../../context/StageContext';
import { stageSocket } from '../../services/socketService';
import {
  RotateCcw,
  AlertCircle,
  Loader2,
  Orbit,
  Move,
  Plus,
  Minus
} from 'lucide-react';

interface ModelViewer3DProps {
  asset: AssetInformation;
  isVisible?: boolean;
  forceLoad?: boolean;
  onSwitchToDpad?: () => void;
}

export const ModelViewer3D: React.FC<ModelViewer3DProps> = ({ asset, isVisible = true, forceLoad = false, onSwitchToDpad }) => {
  const {
    resetModelTransform,
    syncModelTransform,
    stopAutoRotate,
    stageModelTransform,
    sendModelJoystick
  } = useStage();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isStageSync, setIsStageSync] = useState<boolean>(true);
  const [viewDragMode, setViewDragMode] = useState<'orbit' | 'pan'>('orbit');
  const [activeGesture, setActiveGesture] = useState<'rotate' | 'pan' | 'zoom' | 'pan-zoom' | null>(null);
  const [showGestureHint, setShowGestureHint] = useState<boolean>(true);

  // Auto-dismiss gesture hint after 4 seconds
  useEffect(() => {
    const hintTimer = window.setTimeout(() => {
      setShowGestureHint(false);
    }, 4000);
    return () => window.clearTimeout(hintTimer);
  }, []);

  // Auto-rotation active until user interacts
  const isAutoRotatingRef = useRef<boolean>(true);

  // Dirty rendering flag: only render when needed to reduce GPU/CPU/battery usage to 0% when idle
  const needsRenderRef = useRef<boolean>(true);
  const requestRender = useCallback(() => {
    needsRenderRef.current = true;
  }, []);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Synchronized transform hierarchy matching Unity:
  // panRoot (position & scale) -> yawGroup (rotation.y) -> pitchGroup (rotation.x) -> model (centered)
  const panRootRef = useRef<THREE.Group | null>(null);
  const yawGroupRef = useRef<THREE.Group | null>(null);
  const pitchGroupRef = useRef<THREE.Group | null>(null);
  const modelPivotRef = useRef<THREE.Group | null>(null);

  // Real-time pose state
  const MIN_ZOOM_RATIO = 0.25;
  const MAX_ZOOM_RATIO = 25.0;
  const currentYawDegRef = useRef<number>(0);
  const currentPitchDegRef = useRef<number>(0);
  const currentScaleRef = useRef<number>(1.0);
  const targetScaleRef = useRef<number>(1.0);
  const framedScaleRef = useRef<number>(1.0);
  const minScaleRef = useRef<number>(0.25);
  const maxScaleRef = useRef<number>(25.0);
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const maxPanXRef = useRef<number>(1.2);
  const maxPanYRef = useRef<number>(0.9);
  const isInteractingRef = useRef<boolean>(false);

  // Sync state reference to avoid stale closures in event handlers
  const isStageSyncRef = useRef<boolean>(isStageSync);
  useEffect(() => {
    isStageSyncRef.current = isStageSync;
  }, [isStageSync]);

  // Track visibility to pause animation loop when D-Pad is showing
  const isVisibleRef = useRef<boolean>(isVisible);
  useEffect(() => {
    isVisibleRef.current = isVisible;
    if (isVisible) {
      requestRender();
      if (rendererRef.current && containerRef.current && cameraRef.current) {
        const w = containerRef.current.clientWidth || 320;
        const h = containerRef.current.clientHeight || 320;
        if (w > 0 && h > 0) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    }
  }, [isVisible, requestRender]);

  // Synchronize incoming stage transform from Unity (when user is not actively interacting)
  useEffect(() => {
    if (!stageModelTransform || isInteractingRef.current) return;

    if (typeof stageModelTransform.yaw === 'number') {
      currentYawDegRef.current = stageModelTransform.yaw;
      if (yawGroupRef.current) {
        yawGroupRef.current.rotation.y = -(stageModelTransform.yaw * Math.PI) / 180;
      }
    }

    if (typeof stageModelTransform.pitch === 'number') {
      const clampedPitch = Math.max(-85, Math.min(85, stageModelTransform.pitch));
      currentPitchDegRef.current = clampedPitch;
      if (pitchGroupRef.current) {
        pitchGroupRef.current.rotation.x = (clampedPitch * Math.PI) / 180;
      }
    }

    if (typeof stageModelTransform.maxScale === 'number' && stageModelTransform.maxScale > 0.001) {
      maxScaleRef.current = stageModelTransform.maxScale;
      framedScaleRef.current = stageModelTransform.maxScale / MAX_ZOOM_RATIO;
    }
    if (typeof stageModelTransform.minScale === 'number' && stageModelTransform.minScale > 0.001) {
      minScaleRef.current = stageModelTransform.minScale;
      if (!stageModelTransform.maxScale) {
        framedScaleRef.current = stageModelTransform.minScale / MIN_ZOOM_RATIO;
      }
    }

    if (typeof stageModelTransform.scale === 'number' && stageModelTransform.scale > 0.001) {
      const baseRatio = framedScaleRef.current > 0 ? stageModelTransform.scale / framedScaleRef.current : 1;
      const clampedRatio = Math.max(MIN_ZOOM_RATIO, Math.min(MAX_ZOOM_RATIO, baseRatio));
      currentScaleRef.current = clampedRatio;
      targetScaleRef.current = clampedRatio;
      if (panRootRef.current) {
        panRootRef.current.scale.set(clampedRatio, clampedRatio, clampedRatio);
      }
    }

    if (typeof stageModelTransform.posX === 'number' && typeof stageModelTransform.posY === 'number') {
      const UNITY_MAX_PAN_X = 9.0;
      const UNITY_MAX_PAN_Y = 5.0;
      const normX = Math.max(-1, Math.min(1, stageModelTransform.posX / UNITY_MAX_PAN_X));
      const normY = Math.max(-1, Math.min(1, stageModelTransform.posY / UNITY_MAX_PAN_Y));
      const webX = normX * maxPanXRef.current;
      const webY = normY * maxPanYRef.current;
      currentPosRef.current = { x: webX, y: webY };
      if (panRootRef.current) {
        panRootRef.current.position.set(webX, webY, 0);
      }
    }

    requestRender();
  }, [stageModelTransform, requestRender]);

  // Gesture tracking references
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const lastTwoFingerCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const isDoubleTapPanRef = useRef<boolean>(false);
  const syncThrottleRef = useRef<number>(0);
  const zoomHoldIntervalRef = useRef<number | null>(null);



  const handleZoomButtonDown = (zoomVal: number) => {
    setShowGestureHint(false);
    if (isAutoRotatingRef.current) {
      isAutoRotatingRef.current = false;
      stopAutoRotate();
    }
    sendModelJoystick(JoyStickDirection.Scale, 0, 0, zoomVal);

    if (zoomHoldIntervalRef.current) {
      window.clearInterval(zoomHoldIntervalRef.current);
    }
    zoomHoldIntervalRef.current = window.setInterval(() => {
      sendModelJoystick(JoyStickDirection.Scale, 0, 0, zoomVal);
    }, 150);
  };

  const handleZoomButtonUp = useCallback(() => {
    if (zoomHoldIntervalRef.current) {
      window.clearInterval(zoomHoldIntervalRef.current);
      zoomHoldIntervalRef.current = null;
    }
    sendModelJoystick(JoyStickDirection.End, 0, 0);
    sendModelJoystick(JoyStickDirection.Move, 0, 0);
  }, [sendModelJoystick]);

  useEffect(() => {
    const handleGlobalZoomRelease = () => {
      if (zoomHoldIntervalRef.current) {
        handleZoomButtonUp();
      }
    };
    window.addEventListener('pointerup', handleGlobalZoomRelease);
    window.addEventListener('pointercancel', handleGlobalZoomRelease);
    window.addEventListener('mouseup', handleGlobalZoomRelease);
    window.addEventListener('touchend', handleGlobalZoomRelease);
    window.addEventListener('blur', handleGlobalZoomRelease);
    return () => {
      window.removeEventListener('pointerup', handleGlobalZoomRelease);
      window.removeEventListener('pointercancel', handleGlobalZoomRelease);
      window.removeEventListener('mouseup', handleGlobalZoomRelease);
      window.removeEventListener('touchend', handleGlobalZoomRelease);
      window.removeEventListener('blur', handleGlobalZoomRelease);
    };
  }, [handleZoomButtonUp]);

  // Clean reset function
  const handleReset = useCallback(() => {
    isAutoRotatingRef.current = false;
    stopAutoRotate();
    setViewDragMode('orbit');
    currentYawDegRef.current = 0;
    currentPitchDegRef.current = 0;
    currentScaleRef.current = 1.0;
    targetScaleRef.current = 1.0;
    currentPosRef.current = { x: 0, y: 0 };

    if (yawGroupRef.current) {
      yawGroupRef.current.rotation.set(0, 0, 0);
    }
    if (pitchGroupRef.current) {
      pitchGroupRef.current.rotation.set(0, 0, 0);
    }
    if (panRootRef.current) {
      panRootRef.current.position.set(0, 0, 0);
      panRootRef.current.scale.set(1.0, 1.0, 1.0);
    }
    requestRender();

    if (isStageSyncRef.current) {
      resetModelTransform();
    }
  }, [resetModelTransform, stopAutoRotate, requestRender]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 100);
    camera.position.set(0, 0, 3.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x64c5be, 1.2);
    fillLight.position.set(-3, -2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 1.0);
    rimLight.position.set(0, -4, 3);
    scene.add(rimLight);

    // Build hierarchy matching Unity
    const panRoot = new THREE.Group();
    const yawGroup = new THREE.Group();
    const pitchGroup = new THREE.Group();
    const modelPivot = new THREE.Group();

    panRoot.add(yawGroup);
    yawGroup.add(pitchGroup);
    pitchGroup.add(modelPivot);
    scene.add(panRoot);

    panRootRef.current = panRoot;
    yawGroupRef.current = yawGroup;
    pitchGroupRef.current = pitchGroup;
    modelPivotRef.current = modelPivot;

    // Render loop: auto-rotates model on load matching Unity (10 deg/s), drops to on-demand dirty rendering (0% CPU/GPU) when idle
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!isVisibleRef.current) return;

      if (isAutoRotatingRef.current && !isInteractingRef.current) {
        // Auto-rotate yaw at 10 deg/sec matching Unity
        const dt = Math.min(deltaTime, 0.1);
        currentYawDegRef.current = (currentYawDegRef.current + 10 * dt) % 360;
        if (yawGroupRef.current) {
          yawGroupRef.current.rotation.y = -(currentYawDegRef.current * Math.PI) / 180;
        }
        needsRenderRef.current = true;
      }

      // Smooth scale lerp toward targetScaleRef
      if (Math.abs(currentScaleRef.current - targetScaleRef.current) > 0.001) {
        currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetScaleRef.current, 0.22);
        if (panRootRef.current) {
          panRootRef.current.scale.set(
            currentScaleRef.current,
            currentScaleRef.current,
            currentScaleRef.current
          );
        }
        needsRenderRef.current = true;
      }

      if (needsRenderRef.current) {
        needsRenderRef.current = false;
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // 2. Load GLB Model
    setIsLoading(true);
    setLoadProgress(0);
    setLoadError(null);

    const baseUrl = stageSocket.getHttpBaseUrl();
    const modelParam = asset.ModelPath || asset.AssetName;
    const forceParam = forceLoad ? '&force=true' : '';
    const modelUrl = `${baseUrl}/api/model?file=${encodeURIComponent(modelParam)}${forceParam}&ngrok-skip-browser-warning=true`;

    const loader = new GLTFLoader();
    loader.setRequestHeader({
      'ngrok-skip-browser-warning': 'true'
    });

    loader.load(
      modelUrl,
      (gltf) => {
        setIsLoading(false);
        // Clean any existing model
        while (modelPivot.children.length > 0) {
          modelPivot.remove(modelPivot.children[0]);
        }

        const model = gltf.scene;

        // Auto-center and frame model in the modelPivot group
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Center pivot
        model.position.sub(center);
        modelPivot.add(model);

        // Compute optimal camera distance so model fits neatly
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.35;
        cameraDistance = Math.max(cameraDistance, 0.5);

        camera.position.set(0, 0, cameraDistance);
        camera.near = cameraDistance / 50;
        camera.far = cameraDistance * 50;
        camera.updateProjectionMatrix();

        // Calculate web pan bounds at this camera distance to keep the model inside the viewport
        const viewHalfHeight = cameraDistance * Math.tan(fov / 2);
        const aspect = (container.clientWidth || 320) / (container.clientHeight || 320);
        const viewHalfWidth = viewHalfHeight * aspect;
        maxPanXRef.current = Math.max(0.6, viewHalfWidth * 0.65);
        maxPanYRef.current = Math.max(0.45, viewHalfHeight * 0.65);

        // Initialize pose & enable auto-rotation on load matching Unity
        currentYawDegRef.current = 0;
        currentPitchDegRef.current = 0;
        currentScaleRef.current = 1.0;
        targetScaleRef.current = 1.0;
        currentPosRef.current = { x: 0, y: 0 };
        isAutoRotatingRef.current = true;

        yawGroup.rotation.set(0, 0, 0);
        pitchGroup.rotation.set(0, 0, 0);
        panRoot.position.set(0, 0, 0);
        panRoot.scale.set(1.0, 1.0, 1.0);

        // Pre-warm / compile shaders to eliminate frame drop violations
        renderer.compile(scene, camera);
        requestRender();
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadProgress(pct);
        }
      },
      (err: unknown) => {
        setIsLoading(false);
        const errMsg = err instanceof Error ? err.message : String(err || 'Network error');
        setLoadError(`Failed to stream 3D model: ${errMsg}`);
      }
    );

    // 3. Resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
          requestRender();
        }
      }
    });
    resizeObserver.observe(container);

    // Non-passive wheel handler to prevent page scrolling and zoom the 3D model
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAutoRotatingRef.current) {
        isAutoRotatingRef.current = false;
        stopAutoRotate();
      }
      const zoomFactor = e.deltaY > 0 ? 0.94 : 1.06;
      targetScaleRef.current = Math.max(MIN_ZOOM_RATIO, Math.min(MAX_ZOOM_RATIO, targetScaleRef.current * zoomFactor));
      currentScaleRef.current = targetScaleRef.current;
      if (panRootRef.current) {
        panRootRef.current.scale.set(targetScaleRef.current, targetScaleRef.current, targetScaleRef.current);
      }
      requestRender();

      if (isStageSyncRef.current) {
        const unityScale = framedScaleRef.current * targetScaleRef.current;
        const UNITY_MAX_PAN_X = 9.0;
        const UNITY_MAX_PAN_Y = 5.0;
        const normX = Math.max(-1, Math.min(1, currentPosRef.current.x / (maxPanXRef.current || 1)));
        const normY = Math.max(-1, Math.min(1, currentPosRef.current.y / (maxPanYRef.current || 1)));
        syncModelTransform(
          currentYawDegRef.current,
          currentPitchDegRef.current,
          unityScale,
          normX * UNITY_MAX_PAN_X,
          normY * UNITY_MAX_PAN_Y
        );
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });

    // Prevent iOS Safari page-level pinch gestures
    const preventGesture = (e: Event) => e.preventDefault();
    container.addEventListener('gesturestart', preventGesture, { passive: false });
    container.addEventListener('gesturechange', preventGesture, { passive: false });

    // Cleanup
    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('gesturestart', preventGesture);
      container.removeEventListener('gesturechange', preventGesture);
      resizeObserver.disconnect();
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [asset.AssetID, asset.ModelPath, asset.AssetName, forceLoad, syncModelTransform, stopAutoRotate, requestRender]);

  // ---- Touch & Mouse Gestures Handling ---------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    isInteractingRef.current = true;
    setShowGestureHint(false);

    // Stop auto-rotation immediately when user begins interaction
    if (isAutoRotatingRef.current) {
      isAutoRotatingRef.current = false;
      stopAutoRotate();
    }

    // Double tap detection for Pan mode
    const now = Date.now();
    const isDoubleTap = pointersRef.current.size === 1 && now - lastTapTimeRef.current < 300;
    if (isDoubleTap) {
      isDoubleTapPanRef.current = true;
      setActiveGesture('pan');
    } else {
      isDoubleTapPanRef.current = false;
      const isPan = viewDragMode === 'pan' || e.buttons === 2 || e.shiftKey;
      setActiveGesture(isPan ? 'pan' : 'rotate');
    }
    lastTapTimeRef.current = now;

    if (pointersRef.current.size === 2) {
      setActiveGesture('pan-zoom');
      const pts = Array.from(pointersRef.current.values());
      lastPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      lastTwoFingerCenterRef.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2
      };
    }
    requestRender();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;

    // --- Gesture: Two-Finger Simultaneous Pan & Pinch-Zoom ---
    if (pointersRef.current.size === 2) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = Array.from(pointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const currentCenter = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2
      };

      let hasChanged = false;

      // 1. Pinch Zoom
      if (lastPinchDistRef.current !== null && lastPinchDistRef.current > 0) {
        const pinchDelta = currentDist - lastPinchDistRef.current;
        if (Math.abs(pinchDelta) > 0.5) {
          const zoomSpeed = 0.006;
          const zoomMultiplier = 1 + pinchDelta * zoomSpeed;
          targetScaleRef.current = Math.max(MIN_ZOOM_RATIO, Math.min(MAX_ZOOM_RATIO, targetScaleRef.current * zoomMultiplier));
          currentScaleRef.current = targetScaleRef.current;

          if (panRootRef.current) {
            panRootRef.current.scale.set(
              currentScaleRef.current,
              currentScaleRef.current,
              currentScaleRef.current
            );
          }
          hasChanged = true;
        }
      }

      // 2. Two-Finger Pan
      if (lastTwoFingerCenterRef.current !== null) {
        const centerDx = currentCenter.x - lastTwoFingerCenterRef.current.x;
        const centerDy = currentCenter.y - lastTwoFingerCenterRef.current.y;

        if (Math.abs(centerDx) > 0.3 || Math.abs(centerDy) > 0.3) {
          const containerWidth = containerRef.current?.clientWidth || 320;
          const containerHeight = containerRef.current?.clientHeight || 320;
          const panSensitivityX = (maxPanXRef.current * 1.8) / containerWidth;
          const panSensitivityY = (maxPanYRef.current * 1.8) / containerHeight;

          const nextX = Math.max(-maxPanXRef.current, Math.min(maxPanXRef.current, currentPosRef.current.x + centerDx * panSensitivityX));
          const nextY = Math.max(-maxPanYRef.current, Math.min(maxPanYRef.current, currentPosRef.current.y - centerDy * panSensitivityY));
          currentPosRef.current = { x: nextX, y: nextY };

          if (panRootRef.current) {
            panRootRef.current.position.set(nextX, nextY, 0);
          }
          hasChanged = true;
        }
      }

      lastPinchDistRef.current = currentDist;
      lastTwoFingerCenterRef.current = currentCenter;

      if (hasChanged) {
        setActiveGesture('pan-zoom');
        requestRender();
        if (isStageSyncRef.current) {
          const now = Date.now();
          if (now - syncThrottleRef.current > 40) {
            syncThrottleRef.current = now;
            const unityScale = framedScaleRef.current * currentScaleRef.current;
            const UNITY_MAX_PAN_X = 9.0;
            const UNITY_MAX_PAN_Y = 5.0;
            const normX = Math.max(-1, Math.min(1, currentPosRef.current.x / (maxPanXRef.current || 1)));
            const normY = Math.max(-1, Math.min(1, currentPosRef.current.y / (maxPanYRef.current || 1)));
            syncModelTransform(
              currentYawDegRef.current,
              currentPitchDegRef.current,
              unityScale,
              normX * UNITY_MAX_PAN_X,
              normY * UNITY_MAX_PAN_Y
            );
          }
        }
      }
      return;
    }

    // --- Gesture: Single Pointer Drag (Rotate or Pan) ---
    const prevPos = pointersRef.current.get(e.pointerId)!;
    const dx = e.clientX - prevPos.x;
    const dy = e.clientY - prevPos.y;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const isPanMode = viewDragMode === 'pan' || isDoubleTapPanRef.current || e.buttons === 2 || e.shiftKey;

    if (isPanMode) {
      setActiveGesture('pan');
      const containerWidth = containerRef.current?.clientWidth || 320;
      const containerHeight = containerRef.current?.clientHeight || 320;
      const panSensitivityX = (maxPanXRef.current * 1.8) / containerWidth;
      const panSensitivityY = (maxPanYRef.current * 1.8) / containerHeight;

      // Restrict pan inside Web 3D viewport bounds so model cannot fly out of screen
      const nextX = Math.max(-maxPanXRef.current, Math.min(maxPanXRef.current, currentPosRef.current.x + dx * panSensitivityX));
      const nextY = Math.max(-maxPanYRef.current, Math.min(maxPanYRef.current, currentPosRef.current.y - dy * panSensitivityY));
      currentPosRef.current = { x: nextX, y: nextY };

      if (panRootRef.current) {
        panRootRef.current.position.set(nextX, nextY, 0);
      }
      requestRender();

      if (isStageSyncRef.current) {
        const now = Date.now();
        if (now - syncThrottleRef.current > 40) {
          syncThrottleRef.current = now;
          const unityScale = framedScaleRef.current * currentScaleRef.current;
          const UNITY_MAX_PAN_X = 9.0;
          const UNITY_MAX_PAN_Y = 5.0;
          const normX = Math.max(-1, Math.min(1, nextX / (maxPanXRef.current || 1)));
          const normY = Math.max(-1, Math.min(1, nextY / (maxPanYRef.current || 1)));
          syncModelTransform(
            currentYawDegRef.current,
            currentPitchDegRef.current,
            unityScale,
            normX * UNITY_MAX_PAN_X,
            normY * UNITY_MAX_PAN_Y
          );
        }
      }
    } else {
      // Gesture: Single Finger Drag -> ROTATE (Yaw & Pitch)
      setActiveGesture('rotate');
      const rotSpeed = 0.45; // degrees per pixel
      currentYawDegRef.current = (currentYawDegRef.current - dx * rotSpeed) % 360;
      currentPitchDegRef.current = Math.max(-85, Math.min(85, currentPitchDegRef.current + dy * rotSpeed));

      if (yawGroupRef.current) {
        yawGroupRef.current.rotation.y = -(currentYawDegRef.current * Math.PI) / 180;
      }
      if (pitchGroupRef.current) {
        pitchGroupRef.current.rotation.x = (currentPitchDegRef.current * Math.PI) / 180;
      }
      requestRender();

      if (isStageSyncRef.current) {
        const now = Date.now();
        if (now - syncThrottleRef.current > 35) {
          syncThrottleRef.current = now;
          const unityScale = framedScaleRef.current * currentScaleRef.current;
          const UNITY_MAX_PAN_X = 9.0;
          const UNITY_MAX_PAN_Y = 5.0;
          const normX = Math.max(-1, Math.min(1, currentPosRef.current.x / (maxPanXRef.current || 1)));
          const normY = Math.max(-1, Math.min(1, currentPosRef.current.y / (maxPanYRef.current || 1)));
          syncModelTransform(
            currentYawDegRef.current,
            currentPitchDegRef.current,
            unityScale,
            normX * UNITY_MAX_PAN_X,
            normY * UNITY_MAX_PAN_Y
          );
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
      lastTwoFingerCenterRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      setActiveGesture(null);
      isDoubleTapPanRef.current = false;
      isInteractingRef.current = false;
      requestRender();

      // Flush final exact transform to stage
      if (isStageSyncRef.current) {
        const unityScale = framedScaleRef.current * currentScaleRef.current;
        const UNITY_MAX_PAN_X = 9.0;
        const UNITY_MAX_PAN_Y = 5.0;
        const normX = Math.max(-1, Math.min(1, currentPosRef.current.x / (maxPanXRef.current || 1)));
        const normY = Math.max(-1, Math.min(1, currentPosRef.current.y / (maxPanYRef.current || 1)));
        syncModelTransform(
          currentYawDegRef.current,
          currentPitchDegRef.current,
          unityScale,
          normX * UNITY_MAX_PAN_X,
          normY * UNITY_MAX_PAN_Y
        );
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 8, alignItems: 'center' }}>
      {/* 3D Canvas Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          height: 320,
          borderRadius: 'var(--radius-md, 12px)',
          background: 'radial-gradient(circle at 50% 50%, rgba(13, 27, 42, 0.9) 0%, rgba(7, 10, 19, 0.98) 100%)',
          border: '1px solid var(--border-glass, rgba(100, 197, 190, 0.25))',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(100, 197, 190, 0.05)',
          overflow: 'hidden',
          touchAction: 'none'
        }}
      >
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: '100%',
            height: '100%',
            cursor: activeGesture === 'pan' || viewDragMode === 'pan' ? 'grabbing' : activeGesture === 'rotate' ? 'crosshair' : 'grab'
          }}
        />

        {/* Top-Left: 1-Thumb Mode Switcher (Orbit vs Pan) */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'flex',
            background: 'rgba(7, 10, 19, 0.78)',
            borderRadius: 20,
            border: '1px solid rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(8px)',
            padding: 2,
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}
        >
          <button
            type="button"
            onClick={() => setViewDragMode('orbit')}
            title="Single-finger drag rotates model"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 16,
              fontSize: '0.68rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: viewDragMode === 'orbit' ? 'rgba(0, 229, 255, 0.22)' : 'transparent',
              color: viewDragMode === 'orbit' ? '#00e5ff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            <Orbit size={12} />
            Orbit
          </button>
          <button
            type="button"
            onClick={() => setViewDragMode('pan')}
            title="Single-finger drag pans model"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 16,
              fontSize: '0.68rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: viewDragMode === 'pan' ? 'rgba(0, 229, 255, 0.22)' : 'transparent',
              color: viewDragMode === 'pan' ? '#00e5ff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            <Move size={12} />
            Pan
          </button>
        </div>

        {/* Top-Right: Quick Reset Button */}
        <button
          type="button"
          onClick={handleReset}
          title="Reset orientation, framing, and position"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(7, 10, 19, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(8px)',
            color: '#f8fafc',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.15s ease'
          }}
        >
          <RotateCcw size={13} />
        </button>

        {/* Bottom-Right: Floating Zoom Pill (Tap or Hold) */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 10,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(7, 10, 19, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 12,
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
            zIndex: 10,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
          }}
        >
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              handleZoomButtonDown(1);
            }}
            onPointerUp={handleZoomButtonUp}
            onPointerLeave={handleZoomButtonUp}
            onPointerCancel={handleZoomButtonUp}
            title="Zoom In (Tap or hold)"
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              handleZoomButtonDown(0);
            }}
            onPointerUp={handleZoomButtonUp}
            onPointerLeave={handleZoomButtonUp}
            onPointerCancel={handleZoomButtonUp}
            title="Zoom Out (Tap or hold)"
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            <Minus size={15} />
          </button>
        </div>

        {/* Bottom-Left: Transient Gesture Hint or Active Status */}
        {activeGesture ? (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 10,
              padding: '4px 12px',
              borderRadius: 16,
              background: 'rgba(7, 10, 19, 0.85)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              backdropFilter: 'blur(6px)',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: '#00e5ff',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 2px 10px rgba(0, 229, 255, 0.15)'
            }}
          >
            {activeGesture === 'rotate' && 'Orbiting Model & Stage...'}
            {activeGesture === 'pan' && 'Panning Model...'}
            {activeGesture === 'zoom' && 'Scaling Model...'}
            {activeGesture === 'pan-zoom' && 'Panning & Scaling...'}
          </div>
        ) : showGestureHint ? (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 16,
              background: 'rgba(7, 10, 19, 0.82)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(6px)',
              fontSize: '0.67rem',
              color: '#94a3b8',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <span>1-Finger: Drag • 2-Finger: Pan/Pinch • [+][−] Zoom</span>
          </div>
        ) : null}

        {/* Loading Overlay */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(7, 10, 19, 0.85)',
              backdropFilter: 'blur(6px)',
              gap: 12,
              zIndex: 20
            }}
          >
            <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary-bright, #00e5ff)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary, #f8fafc)', fontWeight: 500 }}>
              Streaming 3D Model {loadProgress > 0 ? `(${loadProgress}%)` : ''}...
            </span>
          </div>
        )}

        {/* Error Overlay */}
        {loadError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(7, 10, 19, 0.92)',
              padding: 24,
              textAlign: 'center',
              gap: 12,
              zIndex: 20
            }}
          >
            <AlertCircle size={32} style={{ color: 'var(--color-danger, #ef4444)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary, #f8fafc)' }}>{loadError}</span>
            {onSwitchToDpad && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onSwitchToDpad}
                style={{ padding: '6px 14px', fontSize: '0.8rem', marginTop: 6 }}
              >
                Use Classic D-Pad
              </button>
            )}
          </div>
        )}
      </div>

      {/* Viewport Control Strip (Outside the model area) */}
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 2px'
        }}
      >
        {/* Real-time Sync Toggle */}
        <button
          type="button"
          onClick={() => setIsStageSync(!isStageSync)}
          title={isStageSync ? 'Broadcasting live in real-time' : 'Local preview only'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: isStageSync
              ? '1px solid rgba(34, 197, 94, 0.4)'
              : '1px solid rgba(148, 163, 184, 0.25)',
            background: isStageSync
              ? 'rgba(34, 197, 94, 0.12)'
              : 'rgba(148, 163, 184, 0.08)',
            color: isStageSync ? 'var(--color-success, #22c55e)' : 'var(--text-muted, #94a3b8)',
            transition: 'all 0.15s ease'
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isStageSync ? 'var(--color-success, #22c55e)' : 'var(--text-muted, #94a3b8)',
              boxShadow: isStageSync ? '0 0 8px #22c55e' : 'none'
            }}
          />
          {isStageSync ? 'Sync ON' : 'Preview Only'}
        </button>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            title="Reset model pose and framing"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 11px',
              fontSize: '0.74rem',
              borderRadius: 20
            }}
          >
            <RotateCcw size={13} />
            Reset
          </button>

          {onSwitchToDpad && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onSwitchToDpad}
              title="Switch to directional button pad"
              style={{
                fontSize: '0.74rem',
                padding: '5px 10px',
                borderRadius: 20,
                color: 'var(--color-primary-bright, #00e5ff)'
              }}
            >
              D-Pad
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
