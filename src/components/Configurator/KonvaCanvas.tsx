import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
  Rect,
  Transformer,
  Group,
  Line,
  Ellipse,
  Star,
  Path
} from 'react-konva';
import Konva from 'konva';
import { ConfiguratorProject, ConfiguratorLayer, ImageLayer, TextLayer, ShapeLayer } from './types';

interface KonvaCanvasProps {
  project: ConfiguratorProject;
  selectedLayerIds: string[];
  onSelectLayers: (layerIds: string[]) => void;
  onUpdateLayer: (layerId: string, updates: Partial<ConfiguratorLayer>, recordHistory?: boolean) => void;
  onUpdateMultipleLayers: (updates: { id: string; updates: Partial<ConfiguratorLayer> }[], recordHistory?: boolean) => void;
  stageRef: React.RefObject<Konva.Stage>;
  viewportWidth: number;
  viewportHeight: number;
  activeTool: 'select' | 'hand';
  stageScale: number;
  stagePosition: { x: number; y: number };
  onViewportChange: (scale: number, position: { x: number; y: number }) => void;
  onContextMenu?: (e: MouseEvent, targetLayerId: string | null) => void;
  triggerEditTextId?: string | null;
}

interface SnapGuide {
  orientation: 'vertical' | 'horizontal';
  pos: number;
}

// Crisp Figma Size Badge (Pinned under selection, constant screen size)
const FigmaSizeBadge: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  stageScale: number;
}> = ({ x, y, width, height, stageScale }) => {
  const text = `${Math.round(width)} × ${Math.round(height)}`;
  const paddingX = 6;
  const badgeWidth = Math.max(54, text.length * 6.5 + paddingX * 2);
  const badgeHeight = 18;
  const scale = 1 / stageScale;

  return (
    <Group x={x} y={y} scaleX={scale} scaleY={scale} listening={false}>
      <Rect
        x={-badgeWidth / 2}
        y={-badgeHeight / 2}
        width={badgeWidth}
        height={badgeHeight}
        fill="#0D99FF"
        cornerRadius={3}
        shadowColor="rgba(0,0,0,0.35)"
        shadowBlur={4}
        shadowOffsetY={1}
      />
      <KonvaText
        x={-badgeWidth / 2}
        y={-badgeHeight / 2 + 3.5}
        width={badgeWidth}
        height={badgeHeight}
        text={text}
        fill="#FFFFFF"
        fontSize={10}
        fontFamily="Poppins, Inter, sans-serif"
        fontStyle="bold"
        align="center"
      />
    </Group>
  );
};

// Crisp Figma Distance Measurement Badge (Constant screen size)
const FigmaDistanceBadge: React.FC<{
  x: number;
  y: number;
  text: string;
  stageScale: number;
  color?: string;
}> = ({ x, y, text, stageScale, color = '#F24E1E' }) => {
  const paddingX = 5;
  const badgeWidth = Math.max(26, text.length * 6.8 + paddingX * 2);
  const badgeHeight = 16;
  const scale = 1 / stageScale;

  return (
    <Group x={x} y={y} scaleX={scale} scaleY={scale} listening={false}>
      <Rect
        x={-badgeWidth / 2}
        y={-badgeHeight / 2}
        width={badgeWidth}
        height={badgeHeight}
        fill={color}
        cornerRadius={3}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={4}
        shadowOffsetY={1}
      />
      <KonvaText
        x={-badgeWidth / 2}
        y={-badgeHeight / 2 + 3}
        width={badgeWidth}
        height={badgeHeight}
        text={text}
        fill="#FFFFFF"
        fontSize={10}
        fontFamily="Poppins, Inter, sans-serif"
        fontStyle="bold"
        align="center"
      />
    </Group>
  );
};

// URL Image component
const URLImage: React.FC<{
  layer: ImageLayer;
  isSelected?: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: () => void;
}> = ({ layer, onSelect, onMouseEnter, onMouseLeave, onDragStart, onDragMove, onDragEnd, onTransformEnd }) => {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const shapeRef = useRef<Konva.Group>(null);

  useEffect(() => {
    let isMounted = true;
    const img = new window.Image();
    if (layer.src && !layer.src.startsWith('data:') && !layer.src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = layer.src;
    img.onload = () => {
      if (isMounted) setImageObj(img);
    };
    img.onerror = () => {
      if (isMounted) setImageObj(null);
    };
    return () => {
      isMounted = false;
    };
  }, [layer.src]);

  const sw = Math.round(layer.width * (layer.scaleX || 1));
  const sh = Math.round(layer.height * (layer.scaleY || 1));

  return (
    <Group
      id={layer.id}
      ref={shapeRef}
      x={layer.x}
      y={layer.y}
      width={sw}
      height={sh}
      rotation={layer.rotation || 0}
      scaleX={1}
      scaleY={1}
      draggable={!layer.isLocked}
      onClick={onSelect}
      onTap={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransform={(e) => {
        const group = e.target as Konva.Group;
        if (!group) return;
        const sx = group.scaleX();
        const sy = group.scaleY();
        if (sx && sy) {
          const imgNode = group.findOne('Image') as Konva.Image;
          if (imgNode) {
            imgNode.width(Math.max(5, sw * sx));
            imgNode.height(Math.max(5, sh * sy));
            imgNode.scaleX(1 / sx);
            imgNode.scaleY(1 / sy);
          }
          const borderRect = group.findOne('Rect') as Konva.Rect;
          if (borderRect) {
            const bw = layer.borderWidth || 0;
            borderRect.width(Math.max(5, sw * sx) + bw * 2);
            borderRect.height(Math.max(5, sh * sy) + bw * 2);
            borderRect.scaleX(1 / sx);
            borderRect.scaleY(1 / sy);
          }
        }
      }}
      onTransformEnd={onTransformEnd}
    >
      {Boolean(layer.borderWidth && layer.borderWidth > 0) && (
        <Rect
          x={-(layer.borderWidth || 0)}
          y={-(layer.borderWidth || 0)}
          width={sw + (layer.borderWidth || 0) * 2}
          height={sh + (layer.borderWidth || 0) * 2}
          fill={layer.borderColor || '#ffffff'}
          shadowColor={layer.shadowColor || 'rgba(0,0,0,0.25)'}
          shadowBlur={layer.shadowBlur || 15}
          shadowOffset={{ x: 0, y: 5 }}
          shadowOpacity={0.35}
          cornerRadius={layer.cornerRadius || 2}
        />
      )}

      {imageObj ? (
        <KonvaImage
          image={imageObj}
          width={sw}
          height={sh}
          opacity={layer.opacity}
          cornerRadius={layer.cornerRadius || 0}
          shadowColor={layer.shadowColor || '#000000'}
          shadowBlur={layer.shadowBlur || 0}
          shadowOffsetX={layer.shadowOffsetX ?? 0}
          shadowOffsetY={layer.shadowOffsetY ?? (layer.shadowBlur ? 4 : 0)}
          shadowOpacity={layer.shadowOpacity ?? 0.35}
          shadowEnabled={layer.shadowEnabled ?? Boolean(layer.shadowBlur || layer.shadowColor)}
        />
      ) : (
        <Rect
          width={layer.width}
          height={layer.height}
          fill="#334155"
          stroke="#64748b"
          strokeWidth={2}
          dash={[6, 4]}
        />
      )}
    </Group>
  );
};

// Interactive Text Component with Gradient & Double-Click Inline Editing Support
const KonvaTextLayer: React.FC<{
  layer: TextLayer;
  isSelected?: boolean;
  isEditingInline?: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: () => void;
}> = ({
  layer,
  isEditingInline,
  onSelect,
  onDblClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd
}) => {
  const textRef = useRef<Konva.Text>(null);

  const isGradient = layer.fillType === 'linear';
  const approxWidth = layer.width || Math.max(80, layer.text.length * (layer.fontSize * 0.62));
  const approxHeight = layer.fontSize * 1.35;
  const angle = layer.gradientAngle || 0;

  let endPoint = { x: approxWidth, y: 0 };
  if (angle === 90) endPoint = { x: 0, y: approxHeight };
  else if (angle === 45) endPoint = { x: approxWidth, y: approxHeight };

  return (
    <KonvaText
      id={layer.id}
      ref={textRef}
      text={layer.text}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      fontSize={layer.fontSize}
      fontFamily={layer.fontFamily}
      fill={isGradient ? undefined : layer.fill}
      fillPriority={isGradient ? 'linear-gradient' : 'color'}
      fillLinearGradientStartPoint={isGradient ? { x: 0, y: 0 } : undefined}
      fillLinearGradientEndPoint={isGradient ? endPoint : undefined}
      fillLinearGradientColorStops={
        isGradient
          ? [0, layer.gradientStart || layer.fill || '#0D99FF', 1, layer.gradientEnd || '#E0458F']
          : undefined
      }
      align={layer.align}
      fontStyle={layer.fontStyle}
      rotation={layer.rotation || 0}
      scaleX={layer.scaleX || 1}
      scaleY={layer.scaleY || 1}
      opacity={isEditingInline ? 0 : layer.opacity}
      draggable={!layer.isLocked && !isEditingInline}
      shadowColor={layer.shadowColor || '#000000'}
      shadowBlur={layer.shadowBlur || 0}
      shadowOffsetX={layer.shadowOffsetX ?? 0}
      shadowOffsetY={layer.shadowOffsetY ?? (layer.shadowBlur ? 4 : 0)}
      shadowOpacity={layer.shadowOpacity ?? 0.35}
      shadowEnabled={layer.shadowEnabled ?? Boolean(layer.shadowBlur || layer.shadowColor)}
      stroke={layer.strokeEnabled !== false ? layer.stroke : undefined}
      strokeWidth={layer.strokeEnabled !== false ? (layer.strokeWidth || 0) : 0}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
};

// Stretchable Shape Component (Rectangle, Rounded Card, Circle, Star, Heart, Ribbon, Badge)
const KonvaShapeLayer: React.FC<{
  layer: ShapeLayer;
  isSelected?: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: () => void;
}> = ({ layer, onSelect, onMouseEnter, onMouseLeave, onDragStart, onDragMove, onDragEnd, onTransformEnd }) => {
  const isGradient = layer.fillType === 'linear';
  // Absorb any scale into width and height so the coordinate space is always 1:1 and cornerRadius is never distorted
  const sw = Math.round(layer.width * (layer.scaleX || 1));
  const sh = Math.round(layer.height * (layer.scaleY || 1));
  const angle = layer.gradientAngle || 0;

  let endPoint = { x: sw, y: 0 };
  if (angle === 90) endPoint = { x: 0, y: sh };
  else if (angle === 45) endPoint = { x: sw, y: sh };

  const fillProps = isGradient
    ? {
        fillPriority: 'linear-gradient' as const,
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: endPoint,
        fillLinearGradientColorStops: [0, layer.gradientStart || layer.fill || '#0D99FF', 1, layer.gradientEnd || '#E0458F']
      }
    : { fill: layer.fill };

  const strokeColor = layer.strokeEnabled !== false && layer.stroke ? layer.stroke : undefined;
  const strokeWidth = layer.strokeEnabled !== false && layer.strokeWidth ? layer.strokeWidth : 0;
  const shadowEnabled = layer.shadowEnabled ?? Boolean(layer.shadowBlur || layer.shadowColor);

  const commonProps = {
    ...fillProps,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    strokeScaleEnabled: false,
    shadowEnabled: shadowEnabled,
    shadowColor: layer.shadowColor || '#000000',
    shadowBlur: layer.shadowBlur || 0,
    shadowOffsetX: layer.shadowOffsetX ?? 0,
    shadowOffsetY: layer.shadowOffsetY ?? (layer.shadowBlur ? 4 : 0),
    shadowOpacity: layer.shadowOpacity ?? 0.35,
    opacity: layer.opacity ?? 1
  };

  const renderShape = () => {
    switch (layer.shapeType) {
      case 'circle':
        return (
          <Ellipse
            radiusX={sw / 2}
            radiusY={sh / 2}
            x={sw / 2}
            y={sh / 2}
            {...commonProps}
          />
        );
      case 'rounded-rect':
        return (
          <Rect
            width={sw}
            height={sh}
            cornerRadius={layer.cornerRadius || 20}
            {...commonProps}
          />
        );
      case 'star':
        return (
          <Star
            x={sw / 2}
            y={sh / 2}
            numPoints={5}
            innerRadius={Math.min(sw, sh) / 4}
            outerRadius={Math.min(sw, sh) / 2}
            {...commonProps}
          />
        );
      case 'badge':
        return (
          <Star
            x={sw / 2}
            y={sh / 2}
            numPoints={16}
            innerRadius={Math.min(sw, sh) / 2.3}
            outerRadius={Math.min(sw, sh) / 2}
            {...commonProps}
          />
        );
      case 'heart':
        return (
          <Path
            data="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            scaleX={sw / 24}
            scaleY={sh / 24}
            {...commonProps}
          />
        );
      case 'ribbon':
        return (
          <Path
            data="M0 0 L100 0 L88 20 L100 40 L0 40 L12 20 Z"
            scaleX={sw / 100}
            scaleY={sh / 40}
            {...commonProps}
          />
        );
      default:
        // Rectangle
        return (
          <Rect
            width={sw}
            height={sh}
            cornerRadius={layer.cornerRadius || 0}
            {...commonProps}
          />
        );
    }
  };

  return (
    <Group
      id={layer.id}
      x={layer.x}
      y={layer.y}
      width={sw}
      height={sh}
      rotation={layer.rotation || 0}
      scaleX={1}
      scaleY={1}
      draggable={!layer.isLocked}
      onClick={onSelect}
      onTap={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onTransform={(e) => {
        const group = e.target as Konva.Group;
        if (!group) return;
        const sx = group.scaleX();
        const sy = group.scaleY();
        const rect = group.findOne('Rect') as Konva.Rect;
        if (rect && sx && sy) {
          rect.width(Math.max(5, sw * sx));
          rect.height(Math.max(5, sh * sy));
          rect.scaleX(1 / sx);
          rect.scaleY(1 / sy);
        }
      }}
      onTransformEnd={onTransformEnd}
    >
      {renderShape()}
    </Group>
  );
};

export const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  project,
  selectedLayerIds,
  onSelectLayers,
  onUpdateLayer,
  onUpdateMultipleLayers,
  stageRef,
  viewportWidth,
  viewportHeight,
  activeTool,
  stageScale,
  stagePosition,
  onViewportChange,
  onContextMenu,
  triggerEditTextId
}) => {
  const trRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bgImageObj, setBgImageObj] = useState<HTMLImageElement | null>(null);

  // Multi-drag synchronization state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragLeaderStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Spacebar pan state
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; startPosX: number; startPosY: number }>({
    x: 0,
    y: 0,
    startPosX: 0,
    startPosY: 0
  });

  // Marquee selection box state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState<boolean>(false);
  const [marqueeBox, setMarqueeBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Figma Alt-key distance inspection state
  const [isAltPressed, setIsAltPressed] = useState<boolean>(false);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

  // Smart snapping guides state
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

  // Inline Double-Click Text Editing state
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [inlineTextValue, setInlineTextValue] = useState<string>('');
  const [inlineTextCoords, setInlineTextCoords] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    rotation: number;
    align: 'left' | 'center' | 'right';
  } | null>(null);

  // Track spacebar and Alt keys for Figma shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if (e.key === 'Alt') {
        setIsAltPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
      if (e.key === 'Alt') {
        setIsAltPressed(false);
        setHoveredLayerId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Window mouseup listener for pan & marquee release
  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (isPanning) setIsPanning(false);
      if (isMarqueeSelecting) {
        setIsMarqueeSelecting(false);
        setMarqueeBox(null);
      }
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [isPanning, isMarqueeSelecting]);

  // Background image loader
  useEffect(() => {
    if ((project.background.type === 'image' || project.background.imageUrl) && project.background.imageUrl) {
      const img = new window.Image();
      if (!project.background.imageUrl.startsWith('data:') && !project.background.imageUrl.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = project.background.imageUrl;
      img.onload = () => setBgImageObj(img);
      img.onerror = () => setBgImageObj(null);
    } else {
      setBgImageObj(null);
    }
  }, [project.background.type, project.background.imageUrl]);

  // Attach transformer to all selected nodes (Multi-Node Transformer)
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;

    if (selectedLayerIds.length > 0) {
      const selectedNodes: Konva.Node[] = [];
      for (const id of selectedLayerIds) {
        const node = stageRef.current.findOne('#' + id);
        if (node) selectedNodes.push(node);
      }

      trRef.current.nodes(selectedNodes);
      trRef.current.getLayer()?.batchDraw();
      return;
    }

    trRef.current.nodes([]);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedLayerIds, project.layers]);

  // Compute AABB bounding box for any layer
  const getLayerBox = useCallback(
    (layer: ConfiguratorLayer) => {
      const node = stageRef.current?.findOne('#' + layer.id);
      if (node) {
        const parent = node.getParent();
        if (parent) {
          const clientRect = node.getClientRect({ relativeTo: parent });
          return {
            x: clientRect.x,
            y: clientRect.y,
            width: clientRect.width,
            height: clientRect.height
          };
        }
      }
      const w = (layer as any).width || 200;
      const h = (layer as any).height || 60;
      return {
        x: layer.x,
        y: layer.y,
        width: w * (layer.scaleX || 1),
        height: h * (layer.scaleY || 1)
      };
    },
    [stageRef]
  );

  // Compute union bounding box for all selected layers
  const selectedBox = useMemo(() => {
    if (selectedLayerIds.length === 0) return null;
    const boxes = project.layers
      .filter((l) => selectedLayerIds.includes(l.id))
      .map(getLayerBox);
    if (boxes.length === 0) return null;

    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + b.width));
    const maxY = Math.max(...boxes.map((b) => b.y + b.height));

    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY)
    };
  }, [selectedLayerIds, project.layers, getLayerBox]);

  // Non-passive wheel event listener to scroll & zoom canvas WITHOUT scrolling the website
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const pointer = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      if (e.ctrlKey || e.metaKey) {
        const oldScale = stageScale;
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const newScale = Math.max(0.15, Math.min(3.5, oldScale * zoomFactor));

        const mousePointTo = {
          x: (pointer.x - stagePosition.x) / oldScale,
          y: (pointer.y - stagePosition.y) / oldScale
        };

        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale
        };

        onViewportChange(newScale, newPos);
      } else {
        const newPos = {
          x: stagePosition.x - (e.shiftKey ? e.deltaY : e.deltaX),
          y: stagePosition.y - (e.shiftKey ? e.deltaX : e.deltaY)
        };
        onViewportChange(stageScale, newPos);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [stageScale, stagePosition, onViewportChange]);

  // Stage Mouse Down Handler (CORRECT Marquee trigger: only on empty space!)
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const evt = e.evt as MouseEvent;
    const isHandMode = activeTool === 'hand' || isSpacePressed || evt.button === 1;
    if (isHandMode) {
      evt.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: evt.clientX,
        y: evt.clientY,
        startPosX: stagePosition.x,
        startPosY: stagePosition.y
      };
      return;
    }

    // Check if clicked strictly on empty canvas / background
    const isBackground = e.target === e.target.getStage() || e.target.name() === 'background-rect';

    if (isBackground && activeTool === 'select') {
      if (!evt.shiftKey) {
        onSelectLayers([]);
      }

      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const stageX = (pointer.x - stagePosition.x) / stageScale;
      const stageY = (pointer.y - stagePosition.y) / stageScale;

      setIsMarqueeSelecting(true);
      setMarqueeBox({
        x1: stageX,
        y1: stageY,
        x2: stageX,
        y2: stageY
      });
    } else {
      // User clicked on an element, text, shape, or transformer handle: DO NOT start marquee!
      setIsMarqueeSelecting(false);
      setMarqueeBox(null);
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const evt = e.evt as MouseEvent;
    if (evt.altKey !== isAltPressed) {
      setIsAltPressed(evt.altKey);
    }

    if (isPanning) {
      const dx = evt.clientX - panStartRef.current.x;
      const dy = evt.clientY - panStartRef.current.y;
      onViewportChange(stageScale, {
        x: panStartRef.current.startPosX + dx,
        y: panStartRef.current.startPosY + dy
      });
      return;
    }

    if (isMarqueeSelecting && marqueeBox) {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const stageX = (pointer.x - stagePosition.x) / stageScale;
      const stageY = (pointer.y - stagePosition.y) / stageScale;

      setMarqueeBox((prev) => (prev ? { ...prev, x2: stageX, y2: stageY } : null));
    }
  };

  const handleStageMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isMarqueeSelecting && marqueeBox) {
      setIsMarqueeSelecting(false);
      const bx1 = Math.min(marqueeBox.x1, marqueeBox.x2);
      const bx2 = Math.max(marqueeBox.x1, marqueeBox.x2);
      const by1 = Math.min(marqueeBox.y1, marqueeBox.y2);
      const by2 = Math.max(marqueeBox.y1, marqueeBox.y2);

      if (Math.abs(bx2 - bx1) > 5 || Math.abs(by2 - by1) > 5) {
        const intersectingIds: string[] = [];
        for (const layer of project.layers) {
          if (!layer.visible || layer.isLocked) continue;
          const box = getLayerBox(layer);
          const lx1 = box.x;
          const lx2 = box.x + box.width;
          const ly1 = box.y;
          const ly2 = box.y + box.height;

          if (bx1 < lx2 && bx2 > lx1 && by1 < ly2 && by2 > ly1) {
            intersectingIds.push(layer.id);
          }
        }
        if (intersectingIds.length > 0) {
          onSelectLayers(intersectingIds);
        }
      }
      setMarqueeBox(null);
    }
  };

  // Start Inline Double-Click Text Editing
  const handleStartInlineEditing = (layerId: string) => {
    const layer = project.layers.find((l) => l.id === layerId) as TextLayer | undefined;
    if (!layer || layer.type !== 'text') return;

    const node = stageRef.current?.findOne('#' + layerId) as Konva.Text | undefined;
    if (!node) return;

    const absPos = node.getAbsolutePosition();
    const scale = stageScale * (node.scaleX() || 1);
    const nodeW = Math.max(160, node.width() * scale + 24);
    const nodeH = Math.max(48, node.height() * scale + 18);

    setInlineTextCoords({
      x: absPos.x,
      y: absPos.y,
      width: nodeW,
      height: nodeH,
      fontSize: Math.max(14, Math.round(layer.fontSize * scale)),
      fontFamily: layer.fontFamily,
      color: layer.fill,
      rotation: node.rotation(),
      align: layer.align
    });
    setInlineTextValue(layer.text);
    setEditingTextId(layerId);
  };

  const handleCommitInlineText = () => {
    if (editingTextId && inlineTextValue.trim() !== '') {
      onUpdateLayer(editingTextId, { text: inlineTextValue }, true);
    }
    setEditingTextId(null);
    setInlineTextCoords(null);
  };

  // Trigger inline text editing when requested externally (e.g. from context menu)
  useEffect(() => {
    if (triggerEditTextId) {
      handleStartInlineEditing(triggerEditTextId);
    }
  }, [triggerEditTextId]);

  // Designer Context Menu Trigger
  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();

    // Determine target layer under mouse cursor
    let targetNode: Konva.Node | null = e.target;
    let clickedLayerId: string | null = null;

    while (targetNode && targetNode !== stageRef.current) {
      const id = typeof targetNode.id === 'function' ? targetNode.id() : (targetNode as any).attrs?.id;
      if (id && project.layers.some((l) => l.id === id)) {
        clickedLayerId = id;
        break;
      }
      targetNode = targetNode.parent;
    }

    if (clickedLayerId) {
      if (!selectedLayerIds.includes(clickedLayerId)) {
        onSelectLayers([clickedLayerId]);
      }
    }

    if (onContextMenu) {
      onContextMenu(e.evt as unknown as MouseEvent, clickedLayerId);
    }
  };

  // Click on layer with Shift-key multi-selection
  const handleLayerSelect = (layerId: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true;
    const isShift = (e.evt as MouseEvent).shiftKey;

    if (isShift) {
      if (selectedLayerIds.includes(layerId)) {
        onSelectLayers(selectedLayerIds.filter((id) => id !== layerId));
      } else {
        onSelectLayers([...selectedLayerIds, layerId]);
      }
    } else {
      if (!selectedLayerIds.includes(layerId)) {
        onSelectLayers([layerId]);
      }
    }
  };

  // Multi-drag Start
  const handleLayerDragStart = (e: Konva.KonvaEventObject<DragEvent>, leaderId: string) => {
    setIsDragging(true);
    const leaderNode = (stageRef.current?.findOne('#' + leaderId) as Konva.Node) || e.currentTarget;
    if (leaderNode) {
      dragLeaderStartPosRef.current = { x: leaderNode.x(), y: leaderNode.y() };
    }
  };

  // Drag Move with Smart Snapping & Guides
  const handleLayerDragMove = (e: Konva.KonvaEventObject<DragEvent>, leaderId: string) => {
    const leaderNode = (stageRef.current?.findOne('#' + leaderId) as Konva.Node) || e.currentTarget;
    if (!leaderNode) return;
    const leaderLayer = project.layers.find((l) => l.id === leaderId);
    if (!leaderLayer) return;

    // Single-item Smart Snapping
    if (selectedLayerIds.length <= 1) {
      const snapDistance = 6 / stageScale;
      const guides: SnapGuide[] = [];

      const lw = (leaderLayer as any).width * (leaderNode.scaleX() || 1) || 200;
      const lh = (leaderLayer as any).height * (leaderNode.scaleY() || 1) || 60;
      let newX = leaderNode.x();
      let newY = leaderNode.y();

      // Canvas snap points
      const targetXs = [
        { pos: 0, label: 'canvas-left' },
        { pos: Math.round(project.width / 2), label: 'canvas-center' },
        { pos: project.width, label: 'canvas-right' }
      ];
      const targetYs = [
        { pos: 0, label: 'canvas-top' },
        { pos: Math.round(project.height / 2), label: 'canvas-middle' },
        { pos: project.height, label: 'canvas-bottom' }
      ];

      // Other layers' snap points
      for (const other of project.layers) {
        if (selectedLayerIds.includes(other.id) || !other.visible) continue;
        const b = getLayerBox(other);
        targetXs.push({ pos: Math.round(b.x), label: 'layer-left' });
        targetXs.push({ pos: Math.round(b.x + b.width / 2), label: 'layer-center' });
        targetXs.push({ pos: Math.round(b.x + b.width), label: 'layer-right' });

        targetYs.push({ pos: Math.round(b.y), label: 'layer-top' });
        targetYs.push({ pos: Math.round(b.y + b.height / 2), label: 'layer-middle' });
        targetYs.push({ pos: Math.round(b.y + b.height), label: 'layer-bottom' });
      }

      // Snap X coordinates
      const myLeft = newX;
      const myCenterX = newX + lw / 2;
      const myRight = newX + lw;

      for (const t of targetXs) {
        if (Math.abs(myLeft - t.pos) <= snapDistance) {
          newX = t.pos;
          guides.push({ orientation: 'vertical', pos: t.pos });
          break;
        }
        if (Math.abs(myCenterX - t.pos) <= snapDistance) {
          newX = t.pos - lw / 2;
          guides.push({ orientation: 'vertical', pos: t.pos });
          break;
        }
        if (Math.abs(myRight - t.pos) <= snapDistance) {
          newX = t.pos - lw;
          guides.push({ orientation: 'vertical', pos: t.pos });
          break;
        }
      }

      // Snap Y coordinates
      const myTop = newY;
      const myCenterY = newY + lh / 2;
      const myBottom = newY + lh;

      for (const t of targetYs) {
        if (Math.abs(myTop - t.pos) <= snapDistance) {
          newY = t.pos;
          guides.push({ orientation: 'horizontal', pos: t.pos });
          break;
        }
        if (Math.abs(myCenterY - t.pos) <= snapDistance) {
          newY = t.pos - lh / 2;
          guides.push({ orientation: 'horizontal', pos: t.pos });
          break;
        }
        if (Math.abs(myBottom - t.pos) <= snapDistance) {
          newY = t.pos - lh;
          guides.push({ orientation: 'horizontal', pos: t.pos });
          break;
        }
      }

      leaderNode.position({ x: newX, y: newY });
      setSnapGuides(guides);
    }

    // Crucial: keep Transformer bounding box in lockstep with the nodes
    trRef.current?.forceUpdate();
    trRef.current?.getLayer()?.batchDraw();
  };

  // Multi-drag End (Commit exact canvas positions with zero offset drift)
  const handleLayerDragEnd = (e: Konva.KonvaEventObject<DragEvent>, leaderId: string) => {
    setIsDragging(false);
    setSnapGuides([]);

    const idsToMove = selectedLayerIds.includes(leaderId) ? selectedLayerIds : [leaderId];

    if (idsToMove.length <= 1) {
      const leaderNode = (stageRef.current?.findOne('#' + leaderId) as Konva.Node) || e.currentTarget;
      onUpdateLayer(
        leaderId,
        {
          x: Math.round(leaderNode.x()),
          y: Math.round(leaderNode.y())
        },
        true
      );
      setTimeout(() => {
        trRef.current?.forceUpdate();
        trRef.current?.getLayer()?.batchDraw();
      }, 10);
      return;
    }

    // For multiple selected layers: Konva's Transformer proxy drag has moved all nodes in unison.
    // Read each node's exact position on canvas:
    const updates = idsToMove.map((id) => {
      const node = stageRef.current?.findOne('#' + id);
      if (node) {
        return {
          id,
          updates: {
            x: Math.round(node.x()),
            y: Math.round(node.y())
          }
        };
      }
      const l = project.layers.find((layer) => layer.id === id);
      return {
        id,
        updates: {
          x: l?.x ?? 0,
          y: l?.y ?? 0
        }
      };
    });

    onUpdateMultipleLayers(updates, true);
    setTimeout(() => {
      trRef.current?.forceUpdate();
      trRef.current?.getLayer()?.batchDraw();
    }, 10);
  };

  // Multi-transform End (Commit non-uniform stretched dimensions and normalize scales)
  const handleMultiTransformEnd = () => {
    if (selectedLayerIds.length === 0) return;

    const updates: { id: string; updates: Partial<ConfiguratorLayer> }[] = [];
    for (const id of selectedLayerIds) {
      const node = stageRef.current?.findOne('#' + id);
      const layer = project.layers.find((l) => l.id === id);
      if (node && layer) {
        const sx = node.scaleX();
        const sy = node.scaleY();

        if (layer.type === 'shape' || layer.type === 'image') {
          const baseW = Math.round((layer as any).width * (layer.scaleX || 1)) || 100;
          const baseH = Math.round((layer as any).height * (layer.scaleY || 1)) || 100;
          const newWidth = Math.max(5, Math.round(baseW * Math.abs(sx)));
          const newHeight = Math.max(5, Math.round(baseH * Math.abs(sy)));

          // Reset Konva node scales back to 1:1 so geometry absorbs the stretch directly
          node.scaleX(1);
          node.scaleY(1);

          const childRect = (node as any).findOne?.('Rect');
          if (childRect) {
            childRect.width(newWidth);
            childRect.height(newHeight);
            childRect.scaleX(1);
            childRect.scaleY(1);
            const cr = (layer as any).cornerRadius ?? ((layer as any).shapeType === 'rounded-rect' ? 20 : 0);
            if (cr > 0) {
              childRect.cornerRadius(cr);
            }
          }
          const childImg = (node as any).findOne?.('Image');
          if (childImg) {
            childImg.scaleX(1);
            childImg.scaleY(1);
          }

          updates.push({
            id,
            updates: {
              x: Math.round(node.x()),
              y: Math.round(node.y()),
              rotation: Math.round(node.rotation()),
              width: newWidth,
              height: newHeight,
              scaleX: 1,
              scaleY: 1
            }
          });
        } else {
          // Text layer: keep scaleX & scaleY
          updates.push({
            id,
            updates: {
              x: Math.round(node.x()),
              y: Math.round(node.y()),
              rotation: Math.round(node.rotation()),
              scaleX: Number(sx.toFixed(3)),
              scaleY: Number(sy.toFixed(3))
            }
          });
        }
      }
    }

    onUpdateMultipleLayers(updates, true);
    setTimeout(() => {
      trRef.current?.forceUpdate();
      trRef.current?.getLayer()?.batchDraw();
    }, 10);
  };

  const isHandCursor = activeTool === 'hand' || isSpacePressed;

  // Render Figma Alt-Key Measurements and annotations
  const renderAltMeasurement = () => {
    if (!isAltPressed || !selectedBox) return null;

    const sel = selectedBox;
    const strokeW = 1 / stageScale;
    const cx = sel.x + sel.width / 2;
    const cy = sel.y + sel.height / 2;

    // Case A: Hovering over another layer
    const hoveredLayer = project.layers.find(
      (l) => l.id === hoveredLayerId && !selectedLayerIds.includes(l.id) && l.visible
    );

    if (hoveredLayer) {
      const b = getLayerBox(hoveredLayer);
      const hGapLeft = sel.x - (b.x + b.width);
      const hGapRight = b.x - (sel.x + sel.width);
      const vGapTop = sel.y - (b.y + b.height);
      const vGapBottom = b.y - (sel.y + sel.height);

      const midY = Math.max(Math.min(cy, b.y + b.height - 4), b.y + 4);
      const midX = Math.max(Math.min(cx, b.x + b.width - 4), b.x + 4);

      return (
        <Group listening={false}>
          <Rect
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            stroke="#F24E1E"
            strokeWidth={1.5 / stageScale}
          />

          <Rect
            x={sel.x}
            y={sel.y}
            width={sel.width}
            height={sel.height}
            stroke="#F24E1E"
            strokeWidth={1.5 / stageScale}
          />

          <Line
            points={[Math.min(sel.x, b.x) - 30, sel.y, Math.max(sel.x + sel.width, b.x + b.width) + 30, sel.y]}
            stroke="#F24E1E"
            strokeWidth={strokeW}
            dash={[4 / stageScale, 4 / stageScale]}
            opacity={0.6}
          />
          <Line
            points={[
              Math.min(sel.x, b.x) - 30,
              sel.y + sel.height,
              Math.max(sel.x + sel.width, b.x + b.width) + 30,
              sel.y + sel.height
            ]}
            stroke="#F24E1E"
            strokeWidth={strokeW}
            dash={[4 / stageScale, 4 / stageScale]}
            opacity={0.6}
          />

          {hGapLeft > 0 && (
            <>
              <Line
                points={[b.x + b.width, midY, sel.x, midY]}
                stroke="#F24E1E"
                strokeWidth={1.5 / stageScale}
              />
              <FigmaDistanceBadge
                x={(b.x + b.width + sel.x) / 2}
                y={midY}
                text={`${Math.round(hGapLeft)}`}
                stageScale={stageScale}
              />
            </>
          )}

          {hGapRight > 0 && (
            <>
              <Line
                points={[sel.x + sel.width, midY, b.x, midY]}
                stroke="#F24E1E"
                strokeWidth={1.5 / stageScale}
              />
              <FigmaDistanceBadge
                x={(sel.x + sel.width + b.x) / 2}
                y={midY}
                text={`${Math.round(hGapRight)}`}
                stageScale={stageScale}
              />
            </>
          )}

          {vGapTop > 0 && (
            <>
              <Line
                points={[midX, b.y + b.height, midX, sel.y]}
                stroke="#F24E1E"
                strokeWidth={1.5 / stageScale}
              />
              <FigmaDistanceBadge
                x={midX}
                y={(b.y + b.height + sel.y) / 2}
                text={`${Math.round(vGapTop)}`}
                stageScale={stageScale}
              />
            </>
          )}

          {vGapBottom > 0 && (
            <>
              <Line
                points={[midX, sel.y + sel.height, midX, b.y]}
                stroke="#F24E1E"
                strokeWidth={1.5 / stageScale}
              />
              <FigmaDistanceBadge
                x={midX}
                y={(sel.y + sel.height + b.y) / 2}
                text={`${Math.round(vGapBottom)}`}
                stageScale={stageScale}
              />
            </>
          )}

          {hGapLeft <= 0 && hGapRight <= 0 && Math.abs(sel.x - b.x) > 1 && (
            <FigmaDistanceBadge
              x={Math.min(sel.x, b.x) + Math.abs(sel.x - b.x) / 2}
              y={Math.min(sel.y, b.y) - 12 / stageScale}
              text={`${Math.abs(Math.round(sel.x - b.x))}`}
              stageScale={stageScale}
            />
          )}
        </Group>
      );
    }

    // Case B: Hovering over Canvas Background (Distance to 4 Canvas Borders)
    const topDist = Math.max(0, Math.round(sel.y));
    const bottomDist = Math.max(0, Math.round(project.height - (sel.y + sel.height)));
    const leftDist = Math.max(0, Math.round(sel.x));
    const rightDist = Math.max(0, Math.round(project.width - (sel.x + sel.width)));

    return (
      <Group listening={false}>
        <Rect
          x={0}
          y={0}
          width={project.width}
          height={project.height}
          stroke="#F24E1E"
          strokeWidth={1.5 / stageScale}
        />

        <Rect
          x={sel.x}
          y={sel.y}
          width={sel.width}
          height={sel.height}
          stroke="#F24E1E"
          strokeWidth={1.5 / stageScale}
        />

        <Line
          points={[cx, 0, cx, sel.y]}
          stroke="#F24E1E"
          strokeWidth={1.5 / stageScale}
        />
        <FigmaDistanceBadge
          x={cx}
          y={sel.y / 2}
          text={`${topDist}`}
          stageScale={stageScale}
        />

        <Line
          points={[cx, sel.y + sel.height, cx, project.height]}
          stroke="#F24E1E"
          strokeWidth={1.5 / stageScale}
        />
        <FigmaDistanceBadge
          x={cx}
          y={sel.y + sel.height + bottomDist / 2}
          text={`${bottomDist}`}
          stageScale={stageScale}
        />

        <Line
          points={[0, cy, sel.x, cy]}
          stroke="#F24E1E"
          strokeWidth={1.5 / stageScale}
        />
        <FigmaDistanceBadge
          x={sel.x / 2}
          y={cy}
          text={`${leftDist}`}
          stageScale={stageScale}
        />

        <Line
          points={[sel.x + sel.width, cy, project.width, cy]}
          stroke="#F24E1E"
          strokeWidth={1.5 / stageScale}
        />
        <FigmaDistanceBadge
          x={sel.x + sel.width + rightDist / 2}
          y={cy}
          text={`${rightDist}`}
          stageScale={stageScale}
        />
      </Group>
    );
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#1E1E1E',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        cursor: isPanning ? 'grabbing' : isHandCursor ? 'grab' : 'default',
        userSelect: 'none'
      }}
    >
      <Stage
        ref={stageRef}
        width={viewportWidth}
        height={viewportHeight}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onContextMenu={handleContextMenu}
      >
        {/* Main Content Layer (Moving & Scaling with Pan/Zoom) */}
        <Layer
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={stageScale}
          scaleY={stageScale}
        >
          {/* Canvas Border Shadow (Figma Frame Shadow) */}
          <Rect
            x={-1}
            y={-1}
            width={project.width + 2}
            height={project.height + 2}
            stroke="#000000"
            strokeWidth={1}
            shadowColor="rgba(0, 0, 0, 0.45)"
            shadowBlur={40}
            shadowOffset={{ x: 0, y: 15 }}
          />

          {/* Background Layer */}
          <Rect
            name="background-rect"
            x={0}
            y={0}
            width={project.width}
            height={project.height}
            fill={project.background.color || '#FFFFFF'}
          />

          {bgImageObj && (
            <KonvaImage
              name="background-rect"
              image={bgImageObj}
              x={0}
              y={0}
              width={project.width}
              height={project.height}
              opacity={project.background.opacity ?? 1}
            />
          )}

          {/* Content Layers */}
          {project.layers
            .filter((l) => l.visible)
            .map((layer) => {
              const isSelected = selectedLayerIds.includes(layer.id);
              if (layer.type === 'image') {
                return (
                  <URLImage
                    key={layer.id}
                    layer={layer as ImageLayer}
                    isSelected={isSelected}
                    onSelect={(e) => {
                      if (!isHandCursor) handleLayerSelect(layer.id, e);
                    }}
                    onMouseEnter={() => setHoveredLayerId(layer.id)}
                    onMouseLeave={() => setHoveredLayerId((prev) => (prev === layer.id ? null : prev))}
                    onDragStart={(e) => handleLayerDragStart(e, layer.id)}
                    onDragMove={(e) => handleLayerDragMove(e, layer.id)}
                    onDragEnd={(e) => handleLayerDragEnd(e, layer.id)}
                    onTransformEnd={handleMultiTransformEnd}
                  />
                );
              }
              if (layer.type === 'text') {
                return (
                  <KonvaTextLayer
                    key={layer.id}
                    layer={layer as TextLayer}
                    isSelected={isSelected}
                    isEditingInline={editingTextId === layer.id}
                    onSelect={(e) => {
                      if (!isHandCursor) handleLayerSelect(layer.id, e);
                    }}
                    onDblClick={() => handleStartInlineEditing(layer.id)}
                    onMouseEnter={() => setHoveredLayerId(layer.id)}
                    onMouseLeave={() => setHoveredLayerId((prev) => (prev === layer.id ? null : prev))}
                    onDragStart={(e) => handleLayerDragStart(e, layer.id)}
                    onDragMove={(e) => handleLayerDragMove(e, layer.id)}
                    onDragEnd={(e) => handleLayerDragEnd(e, layer.id)}
                    onTransformEnd={handleMultiTransformEnd}
                  />
                );
              }
              if (layer.type === 'shape') {
                return (
                  <KonvaShapeLayer
                    key={layer.id}
                    layer={layer as ShapeLayer}
                    isSelected={isSelected}
                    onSelect={(e) => {
                      if (!isHandCursor) handleLayerSelect(layer.id, e);
                    }}
                    onMouseEnter={() => setHoveredLayerId(layer.id)}
                    onMouseLeave={() => setHoveredLayerId((prev) => (prev === layer.id ? null : prev))}
                    onDragStart={(e) => handleLayerDragStart(e, layer.id)}
                    onDragMove={(e) => handleLayerDragMove(e, layer.id)}
                    onDragEnd={(e) => handleLayerDragEnd(e, layer.id)}
                    onTransformEnd={handleMultiTransformEnd}
                  />
                );
              }
              return null;
            })}

          {/* Figma-Style Multi-Node Transformer (keepRatio=false allows free stretching!) */}
          <Transformer
            ref={trRef}
            rotateEnabled={!isHandCursor}
            resizeEnabled={!isHandCursor}
            keepRatio={false}
            anchorCornerRadius={2}
            anchorSize={9}
            anchorFill="#FFFFFF"
            anchorStroke="#0D99FF"
            anchorStrokeWidth={1.5}
            borderStroke="#0D99FF"
            borderStrokeWidth={1.5}
            rotateAnchorOffset={24}
            onTransformEnd={handleMultiTransformEnd}
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) return oldBox;
              return newBox;
            }}
          />

          {/* Figma Size Badge (Pinned right under selection: W x H) */}
          {selectedBox && !editingTextId && !isDragging && (
            <FigmaSizeBadge
              x={selectedBox.x + selectedBox.width / 2}
              y={selectedBox.y + selectedBox.height + 14 / stageScale}
              width={selectedBox.width}
              height={selectedBox.height}
              stageScale={stageScale}
            />
          )}

          {/* Figma Alt-Key Distance Measurement Lines & Badges */}
          {renderAltMeasurement()}

          {/* Active Smart Alignment Snapping Guide Lines during Drag */}
          {snapGuides.map((guide, idx) => {
            if (guide.orientation === 'vertical') {
              return (
                <Line
                  key={`snap_v_${idx}`}
                  points={[guide.pos, 0, guide.pos, project.height]}
                  stroke="#F24E1E"
                  strokeWidth={1 / stageScale}
                  listening={false}
                />
              );
            } else {
              return (
                <Line
                  key={`snap_h_${idx}`}
                  points={[0, guide.pos, project.width, guide.pos]}
                  stroke="#F24E1E"
                  strokeWidth={1 / stageScale}
                  listening={false}
                />
              );
            }
          })}

          {/* Marquee Selection Rectangle (Only active when dragging empty canvas!) */}
          {isMarqueeSelecting && marqueeBox && (
            <Rect
              x={Math.min(marqueeBox.x1, marqueeBox.x2)}
              y={Math.min(marqueeBox.y1, marqueeBox.y2)}
              width={Math.abs(marqueeBox.x2 - marqueeBox.x1)}
              height={Math.abs(marqueeBox.y2 - marqueeBox.y1)}
              fill="rgba(13, 153, 255, 0.15)"
              stroke="#0D99FF"
              strokeWidth={1 / stageScale}
            />
          )}
        </Layer>
      </Stage>

      {/* In-Place HTML Double-Click Text Editor Overlay */}
      {editingTextId && inlineTextCoords && (
        <textarea
          autoFocus
          value={inlineTextValue}
          onChange={(e) => setInlineTextValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleCommitInlineText();
            }
            if (e.key === 'Escape') {
              setEditingTextId(null);
              setInlineTextCoords(null);
            }
          }}
          onBlur={handleCommitInlineText}
          style={{
            position: 'absolute',
            left: inlineTextCoords.x,
            top: inlineTextCoords.y,
            width: inlineTextCoords.width,
            height: inlineTextCoords.height,
            fontSize: inlineTextCoords.fontSize,
            fontFamily: inlineTextCoords.fontFamily,
            color: inlineTextCoords.color,
            textAlign: inlineTextCoords.align,
            background: 'rgba(25, 25, 25, 0.92)',
            border: '2px solid #0D99FF',
            borderRadius: 4,
            padding: '4px 8px',
            outline: 'none',
            resize: 'both',
            lineHeight: 1.25,
            zIndex: 1000,
            transform: `rotate(${inlineTextCoords.rotation}deg)`,
            transformOrigin: 'top left',
            boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
          }}
        />
      )}
    </div>
  );
};
