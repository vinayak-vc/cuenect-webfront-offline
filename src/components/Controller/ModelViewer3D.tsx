import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AssetInformation, JoyStickDirection, MoveableAssetType } from '../../types/protocol';
import { useStage } from '../../context/StageContext';
import { stageSocket } from '../../services/socketService';
import {
  RotateCcw,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ModelViewer3DProps {
  asset: AssetInformation;
  isVisible?: boolean;
  onSwitchToDpad?: () => void;
}

export const ModelViewer3D: React.FC<ModelViewer3DProps> = ({ asset, isVisible = true, onSwitchToDpad }) => {
  const { sendModelJoystick, resetModelTransform, currentMovableMode } = useStage();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isStageSync, setIsStageSync] = useState<boolean>(true);
  const [activeGesture, setActiveGesture] = useState<'rotate' | 'pan' | 'zoom' | null>(null);

  // Dirty rendering flag: only render when needed to reduce GPU/CPU/battery usage to 0% when idle
  const needsRenderRef = useRef<boolean>(true);
  const requestRender = useCallback(() => {
    needsRenderRef.current = true;
  }, []);

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

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Default camera/model pose for Reset
  const defaultDistRef = useRef<number>(3);
  const defaultRotRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Gesture tracking
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const isDoubleTapPanRef = useRef<boolean>(false);
  const syncThrottleRef = useRef<number>(0);
  const accumulatedYawDegRef = useRef<number>(0);
  const accumulatedPitchDegRef = useRef<number>(0);

  // Sync state reference to avoid stale closures in event handlers
  const isStageSyncRef = useRef<boolean>(isStageSync);
  useEffect(() => {
    isStageSyncRef.current = isStageSync;
  }, [isStageSync]);

  // Clean reset function
  const handleReset = useCallback(() => {
    if (modelGroupRef.current && cameraRef.current) {
      modelGroupRef.current.rotation.set(defaultRotRef.current.x, defaultRotRef.current.y, 0);
      modelGroupRef.current.position.set(0, 0, 0);
      cameraRef.current.position.set(0, 0, defaultDistRef.current);
      cameraRef.current.lookAt(0, 0, 0);
      requestRender();
    }
    if (isStageSyncRef.current) {
      resetModelTransform();
    }
  }, [resetModelTransform, requestRender]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 100);
    camera.position.set(0, 0, 3);
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

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Render loop: on-demand dirty rendering (0% CPU/GPU when idle)
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (isVisibleRef.current && needsRenderRef.current) {
        needsRenderRef.current = false;
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    };
    animate();

    // 2. Load GLB Model
    setIsLoading(true);
    setLoadProgress(0);
    setLoadError(null);

    const baseUrl = stageSocket.getHttpBaseUrl();
    const modelParam = asset.ModelPath || asset.AssetName;
    const modelUrl = `${baseUrl}/api/model?file=${encodeURIComponent(modelParam)}&ngrok-skip-browser-warning=true`;

    const loader = new GLTFLoader();
    loader.setRequestHeader({
      'ngrok-skip-browser-warning': 'true'
    });
    loader.load(
      modelUrl,
      (gltf) => {
        setIsLoading(false);
        // Clean any existing model
        while (modelGroup.children.length > 0) {
          modelGroup.remove(modelGroup.children[0]);
        }

        const model = gltf.scene;

        // Auto-center and frame model
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Center pivot
        model.position.sub(center);
        modelGroup.add(model);

        // Compute optimal camera distance
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.35;
        cameraDistance = Math.max(cameraDistance, 0.5);

        camera.position.set(0, 0, cameraDistance);
        camera.near = cameraDistance / 50;
        camera.far = cameraDistance * 50;
        camera.updateProjectionMatrix();

        defaultDistRef.current = cameraDistance;
        defaultRotRef.current = { x: 0, y: 0 };

        // Pre-warm / compile shaders to eliminate frame drop violation
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
      const camera = cameraRef.current;
      if (!camera) return;

      const zoomStep = e.deltaY > 0 ? 1.08 : 0.92;
      const newZ = camera.position.z * zoomStep;
      camera.position.z = Math.max(defaultDistRef.current * 0.2, Math.min(defaultDistRef.current * 4, newZ));
      requestRender();

      if (isStageSyncRef.current) {
        const zoomVal = e.deltaY > 0 ? -1 : 1;
        sendModelJoystick(JoyStickDirection.Scale, 0, 0, zoomVal);
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
  }, [asset.AssetID, asset.ModelPath, asset.AssetName, sendModelJoystick]);

  // ---- Touch & Mouse Gestures Handling ---------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Double tap detection for Pan mode
    const now = Date.now();
    if (pointersRef.current.size === 1 && now - lastTapTimeRef.current < 300) {
      isDoubleTapPanRef.current = true;
      setActiveGesture('pan');
    } else {
      isDoubleTapPanRef.current = false;
    }
    lastTapTimeRef.current = now;

    if (pointersRef.current.size === 1) {
      setActiveGesture(isDoubleTapPanRef.current ? 'pan' : 'rotate');
    } else if (pointersRef.current.size === 2) {
      setActiveGesture('zoom');
      const pts = Array.from(pointersRef.current.values());
      lastPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
    requestRender();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;

    const prevPos = pointersRef.current.get(e.pointerId)!;
    const dx = e.clientX - prevPos.x;
    const dy = e.clientY - prevPos.y;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const modelGroup = modelGroupRef.current;
    const camera = cameraRef.current;
    if (!modelGroup || !camera) return;

    const container = containerRef.current;
    const cWidth = container?.clientWidth || 320;
    const cHeight = container?.clientHeight || 320;

    // Gesture: Two-finger Pinch (Zoom)
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinchDistRef.current !== null && lastPinchDistRef.current > 0) {
        const pinchDelta = currentDist - lastPinchDistRef.current;
        const zoomSpeed = 0.01;
        const newZ = camera.position.z - pinchDelta * zoomSpeed * (camera.position.z * 0.1);
        camera.position.z = Math.max(defaultDistRef.current * 0.2, Math.min(defaultDistRef.current * 4, newZ));
        requestRender();

        // Sync zoom to stage
        if (isStageSyncRef.current) {
          const now = Date.now();
          if (now - syncThrottleRef.current > 120) {
            syncThrottleRef.current = now;
            const zoomDirection = pinchDelta > 0 ? 1 : -1;
            sendModelJoystick(JoyStickDirection.Scale, 0, 0, zoomDirection);
          }
        }
      }
      lastPinchDistRef.current = currentDist;
      return;
    }

    // Gesture: Pan mode, Right Click Drag, Two-Finger centroid, or Double Tap Drag -> PAN
    const isPanMode = currentMovableMode === MoveableAssetType.Pan || e.buttons === 2 || isDoubleTapPanRef.current;
    const isLightOrMagnifier = currentMovableMode === MoveableAssetType.Spotlight || currentMovableMode === MoveableAssetType.Magnifier;

    if (isLightOrMagnifier) {
      setActiveGesture('pan');
      if (isStageSyncRef.current) {
        const now = Date.now();
        if (now - syncThrottleRef.current > 60) {
          syncThrottleRef.current = now;
          const normX = Math.max(-1, Math.min(1, (dx / cWidth) * 3));
          const normY = Math.max(-1, Math.min(1, (dy / cHeight) * 3));
          sendModelJoystick(JoyStickDirection.Move, normX, normY);
        }
      }
    } else if (isPanMode) {
      setActiveGesture('pan');
      const panFactor = (camera.position.z / cHeight) * 1.2;
      modelGroup.position.x += dx * panFactor;
      modelGroup.position.y -= dy * panFactor;
      requestRender();

      if (isStageSyncRef.current) {
        const now = Date.now();
        if (now - syncThrottleRef.current > 80) {
          syncThrottleRef.current = now;
          const normX = Math.max(-1, Math.min(1, (dx / cWidth) * 4));
          const normY = Math.max(-1, Math.min(1, (-dy / cHeight) * 4));
          sendModelJoystick(JoyStickDirection.Move, normX, normY);
        }
      }
    } else {
      // Gesture: Single Finger Drag -> ROTATE
      setActiveGesture('rotate');
      const rotSpeed = 0.008;
      const deltaYawDeg = (dx * rotSpeed * 180) / Math.PI;
      const deltaPitchDeg = (dy * rotSpeed * 180) / Math.PI;

      modelGroup.rotation.y += dx * rotSpeed;
      modelGroup.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, modelGroup.rotation.x + dy * rotSpeed));
      requestRender();

      if (isStageSyncRef.current) {
        accumulatedYawDegRef.current += deltaYawDeg;
        accumulatedPitchDegRef.current += deltaPitchDeg;

        const now = Date.now();
        if (now - syncThrottleRef.current > 35) {
          syncThrottleRef.current = now;
          const sendYaw = accumulatedYawDegRef.current;
          const sendPitch = accumulatedPitchDegRef.current;
          accumulatedYawDegRef.current = 0;
          accumulatedPitchDegRef.current = 0;

          sendModelJoystick(JoyStickDirection.Move, sendYaw, sendPitch, undefined, 'delta');
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      setActiveGesture(null);
      isDoubleTapPanRef.current = false;
      requestRender();

      // Flush remaining rotation delta if any and stop stage velocity
      if (isStageSyncRef.current) {
        if (Math.abs(accumulatedYawDegRef.current) > 0.01 || Math.abs(accumulatedPitchDegRef.current) > 0.01) {
          sendModelJoystick(
            JoyStickDirection.Move,
            accumulatedYawDegRef.current,
            accumulatedPitchDegRef.current,
            undefined,
            'delta'
          );
          accumulatedYawDegRef.current = 0;
          accumulatedPitchDegRef.current = 0;
        }
        sendModelJoystick(JoyStickDirection.End, 0, 0);
        sendModelJoystick(JoyStickDirection.Move, 0, 0);
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
            cursor: activeGesture === 'pan' ? 'grabbing' : activeGesture === 'rotate' ? 'crosshair' : 'grab'
          }}
        />

        {/* Transient interaction hint (only shown during active gestures) */}
        {activeGesture && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '4px 14px',
              borderRadius: 20,
              background: 'rgba(7, 10, 19, 0.82)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(6px)',
              fontSize: '0.72rem',
              color: 'var(--text-primary, #f8fafc)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            {activeGesture === 'rotate' && 'Rotating Stage & Model...'}
            {activeGesture === 'pan' && 'Panning Model...'}
            {activeGesture === 'zoom' && 'Scaling Model...'}
          </div>
        )}

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
        {/* Stage Sync Toggle */}
        <button
          type="button"
          onClick={() => setIsStageSync(!isStageSync)}
          title={isStageSync ? 'Broadcasting live to Hologram Stage' : 'Local preview only'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: '0.74rem',
            fontWeight: 600,
            background: isStageSync ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
            color: isStageSync ? 'var(--color-success, #22c55e)' : 'var(--text-muted, #64748b)',
            border: `1px solid ${isStageSync ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isStageSync ? 'var(--color-success, #22c55e)' : 'var(--text-muted, #64748b)'
            }}
          />
          <span>{isStageSync ? 'Sync Stage ● ON' : 'Sync Stage ○ OFF'}</span>
        </button>

        {/* Subtle Metadata Readout */}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
          {asset.triangleCount ? `${(asset.triangleCount / 1000).toFixed(1)}k tris` : ''}
          {asset.triangleCount && asset.fileSizeMB ? ' · ' : ''}
          {asset.fileSizeMB ? `${asset.fileSizeMB} MB` : ''}
        </div>

        {/* Reset View Button */}
        <button
          type="button"
          onClick={handleReset}
          title="Reset 3D camera pose and stage model"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: '0.74rem',
            fontWeight: 500,
            background: 'var(--surface-input, rgba(255, 255, 255, 0.05))',
            color: 'var(--text-secondary, #94a3b8)',
            border: '1px solid var(--line-subtle, rgba(255, 255, 255, 0.1))',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={12} />
          <span>Reset View</span>
        </button>
      </div>

      {/* Subtle Hint Underneath */}
      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
        1-finger rotate · 2-finger pan · pinch zoom
      </div>
    </div>
  );
};
