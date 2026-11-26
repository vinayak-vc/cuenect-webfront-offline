import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Konva from 'konva';
import {
  X,
  Type,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Download,
  Upload,
  Save,
  FolderOpen,
  Trash2,
  Lock,
  Unlock,
  MonitorUp,
  RefreshCw,
  Check,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  MousePointer,
  Eye,
  EyeOff,
  Cake,
  Baby,
  UserPlus,
  Award,
  Presentation,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Shapes,
  Square,
  Circle,
  Star,
  Heart,
  Bookmark,
  ChevronDown,
  Plus,
  Minus,
  Droplet
} from 'lucide-react';
import { KonvaCanvas } from './KonvaCanvas';
import { ConfiguratorContextMenu } from './ConfiguratorContextMenu';
import {
  ConfiguratorProject,
  ConfiguratorLayer,
  TextLayer,
  ImageLayer,
  ShapeLayer,
  ShapeType,
  RESOLUTION_PRESETS
} from './types';
import { generateProjectSVG } from './svgExporter';
import { parseFigmaSvg } from './figmaSvgImporter';
import { STARTER_TEMPLATES } from './templates';
import { useHistory } from './useHistory';
import { useStage } from '../../context/StageContext';
import { GeminiWishGenerator } from '../AI/GeminiWishGenerator';
import { GeminiBackgroundGenerator } from '../AI/GeminiBackgroundGenerator';

interface ConfiguratorStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialProject?: ConfiguratorProject;
}

const FONT_OPTIONS = [
  { id: 'Poppins', label: 'Poppins (Figma Modern)' },
  { id: 'Montserrat', label: 'Montserrat (Bold Clean)' },
  { id: 'Great Vibes', label: 'Great Vibes (Calligraphy / Script)' },
  { id: 'Dancing Script', label: 'Dancing Script (Playful Casual)' },
  { id: 'Playfair Display', label: 'Playfair Display (Editorial Serif)' },
  { id: 'Inter', label: 'Inter (Neutral Sans)' },
  { id: 'Oswald', label: 'Oswald (Condensed Display)' },
  { id: 'Arial', label: 'Arial (System Default)' }
];

const PRESET_COLORS = [
  '#FFFFFF', '#0D0131', '#1A0B45', '#E0458F', '#68D9D0',
  '#FACC15', '#38BDF8', '#34D399', '#F43F5E', '#0F172A'
];

const GRADIENT_PRESETS = [
  { id: 'sunset', label: 'Sunset Glow', start: '#FF512F', end: '#DD2476' },
  { id: 'hologram', label: 'Hologram Neon', start: '#0D99FF', end: '#68D9D0' },
  { id: 'gold', label: 'Luxury Gold', start: '#F7971E', end: '#FFD200' },
  { id: 'purple', label: 'Magic Purple', start: '#8A2387', end: '#E94057' },
  { id: 'cyan', label: 'Electric Cyan', start: '#00F2FE', end: '#4FACFE' },
  { id: 'pink', label: 'Pastel Rose', start: '#FF758C', end: '#FF7EB3' },
  { id: 'emerald', label: 'Emerald Mint', start: '#11998E', end: '#38EF7D' }
];

export const ConfiguratorStudio: React.FC<ConfiguratorStudioProps> = ({ isOpen, onClose, initialProject }) => {
  const { loadAsset, addToast } = useStage();

  // Undo / Redo History Hook
  const {
    state: project,
    setState: setProject,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetProjectHistory
  } = useHistory(initialProject || STARTER_TEMPLATES[0]);

  useEffect(() => {
    if (initialProject && isOpen) {
      resetProjectHistory(initialProject);
    }
  }, [initialProject, isOpen, resetProjectHistory]);

  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(['hanging-polaroid']);
  const [activeLeftTab, setActiveLeftTab] = useState<'occasions' | 'layers'>('occasions');
  const [activeTool, setActiveTool] = useState<'select' | 'hand'>('select');
  const [isShapesMenuOpen, setIsShapesMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isEffectsMenuOpen, setIsEffectsMenuOpen] = useState(false);
  const effectsMenuRef = useRef<HTMLDivElement>(null);

  // Resolution State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('1080p_landscape');

  // Viewport Pan & Zoom State (Figma Style)
  const [stageScale, setStageScale] = useState<number>(0.65);
  const [stagePosition, setStagePosition] = useState<{ x: number; y: number }>({ x: 80, y: 50 });
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 1000, height: 700 });

  // Push to stage status
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushSuccess, setPushSuccess] = useState<boolean>(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Hidden File Inputs
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const addImageInputRef = useRef<HTMLInputElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const loadProjectInputRef = useRef<HTMLInputElement>(null);
  const svgFileInputRef = useRef<HTMLInputElement>(null);

  // Designer Context Menu State
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    targetLayerId: string | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    targetLayerId: null
  });
  const [triggerEditTextId, setTriggerEditTextId] = useState<string | null>(null);

  // Fit canvas nicely in viewport
  const handleFitToScreen = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const w = canvasContainerRef.current.clientWidth;
    const h = canvasContainerRef.current.clientHeight;
    const pad = 80;
    const scale = Math.min((w - pad) / project.width, (h - pad) / project.height);
    const posX = Math.round((w - project.width * scale) / 2);
    const posY = Math.round((h - project.height * scale) / 2);
    setStageScale(Number(scale.toFixed(3)));
    setStagePosition({ x: posX, y: posY });
  }, [project.width, project.height]);

  // Measure viewport size on open and resize
  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      if (canvasContainerRef.current) {
        setViewportSize({
          width: canvasContainerRef.current.clientWidth,
          height: canvasContainerRef.current.clientHeight
        });
      }
    };
    updateSize();
    handleFitToScreen();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen, handleFitToScreen]);

  // Close Export Dropdown on outside click
  useEffect(() => {
    if (!isExportMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isExportMenuOpen]);

  // Close Effects Dropdown on outside click
  useEffect(() => {
    if (!isEffectsMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (effectsMenuRef.current && !effectsMenuRef.current.contains(e.target as Node)) {
        setIsEffectsMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isEffectsMenuOpen]);

  // Delete all selected layers
  const handleDeleteSelectedLayers = useCallback(() => {
    if (selectedLayerIds.length === 0) return;
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => !selectedLayerIds.includes(l.id))
    }), true);
    setSelectedLayerIds([]);
  }, [selectedLayerIds, setProject]);

  const selectedLayer = useMemo(() => {
    if (selectedLayerIds.length === 1) {
      return project.layers.find((l) => l.id === selectedLayerIds[0]) || null;
    }
    return null;
  }, [project.layers, selectedLayerIds]);

  const contextMenuTargetLayer = useMemo(() => {
    if (contextMenuState.targetLayerId) {
      return project.layers.find((l) => l.id === contextMenuState.targetLayerId) || null;
    }
    if (selectedLayerIds.length === 1) {
      return project.layers.find((l) => l.id === selectedLayerIds[0]) || null;
    }
    return null;
  }, [project.layers, contextMenuState.targetLayerId, selectedLayerIds]);

  // Update a Layer with Undo/Redo Record
  const handleUpdateLayer = (layerId: string, updates: Partial<ConfiguratorLayer>, recordHistory = true) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: Date.now(),
      layers: prev.layers.map((l) => (l.id === layerId ? ({ ...l, ...updates } as ConfiguratorLayer) : l))
    }), recordHistory);
  };

  // Update Multiple Layers in a Single Undo Step
  const handleUpdateMultipleLayers = (
    updates: { id: string; updates: Partial<ConfiguratorLayer> }[],
    recordHistory = true
  ) => {
    setProject((prev) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.updates]));
      return {
        ...prev,
        updatedAt: Date.now(),
        layers: prev.layers.map((l) => {
          const u = updateMap.get(l.id);
          return u ? ({ ...l, ...u } as ConfiguratorLayer) : l;
        })
      };
    }, recordHistory);
  };

  // Alignment Tools (Figma Style: relative to canvas if single, relative to selection bounds if multiple)
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedLayerIds.length === 0) return;

    if (selectedLayerIds.length === 1) {
      const id = selectedLayerIds[0];
      const layer = project.layers.find((l) => l.id === id);
      if (!layer) return;
      const w = (layer as any).width || 200;
      const h = (layer as any).height || (layer as any).fontSize || 60;
      let updates: Partial<ConfiguratorLayer> = {};
      if (type === 'left') updates = { x: 0 };
      else if (type === 'center') updates = { x: Math.round((project.width - w) / 2) };
      else if (type === 'right') updates = { x: project.width - w };
      else if (type === 'top') updates = { y: 0 };
      else if (type === 'middle') updates = { y: Math.round((project.height - h) / 2) };
      else if (type === 'bottom') updates = { y: project.height - h };
      handleUpdateLayer(id, updates, true);
      return;
    }

    const selected = project.layers.filter((l) => selectedLayerIds.includes(l.id));
    if (selected.length === 0) return;

    let updates: { id: string; updates: Partial<ConfiguratorLayer> }[] = [];

    if (type === 'left') {
      const minX = Math.min(...selected.map((l) => l.x));
      updates = selected.map((l) => ({ id: l.id, updates: { x: minX } }));
    } else if (type === 'center') {
      const avgCenterX = Math.round(
        selected.reduce((acc, l) => acc + (l.x + ((l as any).width || 200) / 2), 0) / selected.length
      );
      updates = selected.map((l) => ({
        id: l.id,
        updates: { x: Math.round(avgCenterX - ((l as any).width || 200) / 2) }
      }));
    } else if (type === 'right') {
      const maxRight = Math.max(...selected.map((l) => l.x + ((l as any).width || 200)));
      updates = selected.map((l) => ({
        id: l.id,
        updates: { x: maxRight - ((l as any).width || 200) }
      }));
    } else if (type === 'top') {
      const minY = Math.min(...selected.map((l) => l.y));
      updates = selected.map((l) => ({ id: l.id, updates: { y: minY } }));
    } else if (type === 'middle') {
      const avgCenterY = Math.round(
        selected.reduce((acc, l) => acc + (l.y + ((l as any).height || 60) / 2), 0) / selected.length
      );
      updates = selected.map((l) => ({
        id: l.id,
        updates: { y: Math.round(avgCenterY - ((l as any).height || 60) / 2) }
      }));
    } else if (type === 'bottom') {
      const maxBottom = Math.max(...selected.map((l) => l.y + ((l as any).height || 60)));
      updates = selected.map((l) => ({
        id: l.id,
        updates: { y: maxBottom - ((l as any).height || 60) }
      }));
    }

    if (updates.length > 0) {
      handleUpdateMultipleLayers(updates, true);
    }
  };

  // Add New Text Layer
  const handleAddText = (defaultText = 'Type your message') => {
    const newId = `text_${Date.now()}`;
    const newLayer: TextLayer = {
      id: newId,
      name: defaultText,
      type: 'text',
      text: defaultText,
      x: Math.round(project.width / 2 - 180),
      y: Math.round(project.height / 2 - 30),
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      isLocked: false,
      fontSize: 48,
      fontFamily: 'Poppins',
      fill: '#FFFFFF',
      align: 'center',
      fontStyle: 'bold'
    };
    setProject((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));
    setSelectedLayerIds([newId]);
    setActiveTool('select');
  };

  // Add Geometric / Sample Vector Shape
  const handleAddShape = (shapeType: ShapeType) => {
    const newId = `shape_${Date.now()}`;
    const defaultW = shapeType === 'ribbon' ? 320 : shapeType === 'circle' ? 220 : 260;
    const defaultH = shapeType === 'ribbon' ? 100 : shapeType === 'circle' ? 220 : 180;

    const newShape: ShapeLayer = {
      id: newId,
      name: `${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} Shape`,
      type: 'shape',
      shapeType,
      x: Math.round(project.width / 2 - defaultW / 2),
      y: Math.round(project.height / 2 - defaultH / 2),
      width: defaultW,
      height: defaultH,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      isLocked: false,
      fill: shapeType === 'heart' ? '#E0458F' : shapeType === 'star' ? '#FACC15' : '#0D99FF',
      fillType: 'solid',
      stroke: '#FFFFFF',
      strokeWidth: 0,
      cornerRadius: 16
    };

    setProject((prev) => ({
      ...prev,
      layers: [...prev.layers, newShape]
    }));
    setSelectedLayerIds([newId]);
    setActiveTool('select');
    setIsShapesMenuOpen(false);
  };

  // Add Image from File
  const handleFileAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        const aspect = img.width / img.height;
        const targetW = 350;
        const targetH = Math.round(targetW / aspect);
        const newId = `img_${Date.now()}`;
        const newLayer: ImageLayer = {
          id: newId,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: 'image',
          src: dataUrl,
          x: Math.round(project.width / 2 - targetW / 2),
          y: Math.round(project.height / 2 - targetH / 2),
          width: targetW,
          height: targetH,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          isLocked: false,
          isTemplateField: true,
          templateLabel: file.name,
          borderWidth: 10,
          borderColor: '#FFFFFF',
          shadowColor: 'rgba(0,0,0,0.25)',
          shadowBlur: 20
        };
        setProject((prev) => ({
          ...prev,
          layers: [...prev.layers, newLayer]
        }));
        setSelectedLayerIds([newId]);
        setActiveTool('select');
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Replace Selected Image while preserving position and rotation
  const handleReplaceImageFile = (e: React.ChangeEvent<HTMLInputElement>, targetLayerId?: string) => {
    const targetId = targetLayerId || (selectedLayerIds.length === 1 ? selectedLayerIds[0] : undefined);
    if (!targetId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleUpdateLayer(targetId, { src: dataUrl } as Partial<ImageLayer>, true);
      if (addToast) {
        addToast('Photo Replaced', `Loaded "${file.name}"`, 'success');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Background Image Upload
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProject((prev) => ({
        ...prev,
        background: {
          ...prev.background,
          type: 'image',
          imageUrl: dataUrl
        }
      }));
      if (addToast) {
        addToast('Background Set', 'Updated background graphic', 'info');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Resolution Preset Change
  const handleResolutionChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = RESOLUTION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setProject((prev) => ({
      ...prev,
      width: preset.width,
      height: preset.height
    }));
    setTimeout(handleFitToScreen, 50);
  };

  // Delete Layer
  const handleDeleteLayer = (layerId: string) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== layerId)
    }));
    setSelectedLayerIds((prev) => prev.filter((id) => id !== layerId));
  };

  // Reorder Layer (Bring Forward, Send Backward, Bring to Front, Send to Back)
  const handleMoveLayer = (layerId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setProject((prev) => {
      const idx = prev.layers.findIndex((l) => l.id === layerId);
      if (idx < 0) return prev;
      const newLayers = [...prev.layers];
      const [removed] = newLayers.splice(idx, 1);
      let targetIdx = idx;
      if (direction === 'up') targetIdx = Math.min(newLayers.length, idx + 1);
      else if (direction === 'down') targetIdx = Math.max(0, idx - 1);
      else if (direction === 'top') targetIdx = newLayers.length;
      else if (direction === 'bottom') targetIdx = 0;
      newLayers.splice(targetIdx, 0, removed);
      return { ...prev, layers: newLayers };
    }, true);
  };

  // Duplicate Layer (Ctrl+D / Context Menu)
  const handleDuplicateLayer = (layerId?: string) => {
    const targetId = layerId || selectedLayerIds[0];
    if (!targetId) return;
    const target = project.layers.find((l) => l.id === targetId);
    if (!target) return;

    const newId = `${target.type}_${Date.now()}`;
    const newLayer: ConfiguratorLayer = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      name: `${target.name || target.type} Copy`,
      x: target.x + 20,
      y: target.y + 20
    };

    setProject((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }), true);
    setSelectedLayerIds([newId]);
    if (addToast) {
      addToast('Duplicated Layer', `Created copy of ${target.name || target.type}`, 'info');
    }
  };

  // Toggle Lock (Ctrl+L / Context Menu)
  const handleToggleLock = (layerId?: string) => {
    const targetId = layerId || selectedLayerIds[0];
    if (!targetId) return;
    const target = project.layers.find((l) => l.id === targetId);
    if (!target) return;
    handleUpdateLayer(targetId, { isLocked: !target.isLocked }, true);
  };

  // Flip Layer (Horizontal / Vertical)
  const handleFlipLayer = (direction: 'horizontal' | 'vertical', layerId?: string) => {
    const targetId = layerId || selectedLayerIds[0];
    if (!targetId) return;
    const target = project.layers.find((l) => l.id === targetId);
    if (!target) return;

    if (direction === 'horizontal') {
      const curScale = target.scaleX ?? 1;
      const w = (target as any).width || 100;
      const newScale = -curScale;
      const newX = curScale > 0 ? target.x + w : target.x - w;
      handleUpdateLayer(targetId, { scaleX: newScale, x: newX }, true);
    } else {
      const curScale = target.scaleY ?? 1;
      const h = (target as any).height || (target as any).fontSize || 100;
      const newScale = -curScale;
      const newY = curScale > 0 ? target.y + h : target.y - h;
      handleUpdateLayer(targetId, { scaleY: newScale, y: newY }, true);
    }
  };

  // Global Keyboard Shortcuts (Figma Standard: Undo, Redo, Duplicate, Delete, Layer Order, Lock, Tools)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (!isInput) {
          e.preventDefault();
          undo();
        }
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (!isInput) {
          e.preventDefault();
          redo();
        }
      }
      // Duplicate: Ctrl+D
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (!isInput && selectedLayerIds.length > 0) {
          e.preventDefault();
          handleDuplicateLayer();
        }
      }
      // Select All: Ctrl+A
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        if (!isInput) {
          e.preventDefault();
          setSelectedLayerIds(project.layers.map((l) => l.id));
        }
      }
      // Toggle Lock: Ctrl+L
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        if (!isInput && selectedLayerIds.length > 0) {
          e.preventDefault();
          handleToggleLock();
        }
      }
      // Bring Forward: Ctrl+] / Send Backward: Ctrl+[
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === ']' || e.key === '[')) {
        if (!isInput && selectedLayerIds.length > 0) {
          e.preventDefault();
          handleMoveLayer(selectedLayerIds[0], e.key === ']' ? 'up' : 'down');
        }
      }
      // Bring to Front: Ctrl+Shift+] / Send to Back: Ctrl+Shift+[
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === '}' || e.key === '{' || e.key === ']' || e.key === '[')) {
        if (!isInput && selectedLayerIds.length > 0) {
          e.preventDefault();
          handleMoveLayer(selectedLayerIds[0], e.key === '}' || e.key === ']' ? 'top' : 'bottom');
        }
      }
      // Delete selected layer(s)
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          handleDeleteSelectedLayers();
        }
      }
      // Quick tools
      else if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'v') setActiveTool('select');
        else if (k === 'h') setActiveTool('hand');
        else if (k === 't') handleAddText();
        else if (k === 'f') handleFitToScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    undo,
    redo,
    selectedLayerIds,
    project.layers,
    handleDeleteSelectedLayers,
    handleFitToScreen
  ]);

  // Save Project Template
  const handleSaveProject = () => {
    const savedList = JSON.parse(localStorage.getItem('cuenect_saved_projects') || '[]');
    const existingIdx = savedList.findIndex((p: ConfiguratorProject) => p.id === project.id);
    const updatedProject = { ...project, updatedAt: Date.now() };
    if (existingIdx >= 0) {
      savedList[existingIdx] = updatedProject;
    } else {
      savedList.unshift(updatedProject);
    }
    localStorage.setItem('cuenect_saved_projects', JSON.stringify(savedList));

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(updatedProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.title.replace(/\s+/g, '_')}.cuenect-project.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (addToast) {
      addToast('Project Saved', `Saved "${project.title}" template.`, 'success');
    }
  };

  // Load Project JSON
  const handleLoadProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loaded = JSON.parse(event.target?.result as string);
        if (loaded && loaded.width && Array.isArray(loaded.layers)) {
          resetProjectHistory(loaded);
          setSelectedLayerIds(loaded.layers[0] ? [loaded.layers[0].id] : []);
          setTimeout(handleFitToScreen, 50);
          if (addToast) {
            addToast('Project Opened', `Loaded "${loaded.title || file.name}"`, 'success');
          }
        }
      } catch (err: any) {
        if (addToast) {
          addToast('Invalid Template', err.message, 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Import Figma SVG File (Preserving exact 1:1 resolution & placement)
  const handleImportFigmaSvgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const svgContent = event.target?.result as string;
        if (svgContent) {
          const imported = parseFigmaSvg(svgContent, file.name.replace(/\.[^/.]+$/, ''));
          if (imported && imported.layers.length > 0) {
            resetProjectHistory(imported);
            setSelectedLayerIds(imported.layers[0] ? [imported.layers[0].id] : []);
            setTimeout(handleFitToScreen, 50);
            if (addToast) {
              addToast('Figma Design Imported', `Loaded ${imported.layers.length} elements from ${file.name} (1:1 Resolution & Placement)`, 'success');
            }
          } else {
            if (addToast) addToast('Import Notice', 'No recognizable layers found in SVG file', 'info');
          }
        }
      } catch (err: any) {
        if (addToast) addToast('Import Failed', err.message || 'Error parsing SVG', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Global Paste Handler: Paste elements directly copied from Figma (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      const text = e.clipboardData?.getData('text/plain') || e.clipboardData?.getData('image/svg+xml');
      if (text && text.includes('<svg')) {
        const imported = parseFigmaSvg(text, 'Pasted Figma Element');
        if (imported && imported.layers.length > 0) {
          if (imported.layers.length === 1) {
            // Append single element to canvas
            setProject((prev) => ({
              ...prev,
              layers: [...prev.layers, imported.layers[0]]
            }), true);
            setSelectedLayerIds([imported.layers[0].id]);
          } else {
            // Full frame paste
            resetProjectHistory(imported);
            setSelectedLayerIds(imported.layers[0] ? [imported.layers[0].id] : []);
            setTimeout(handleFitToScreen, 50);
          }
          if (addToast) {
            addToast('Pasted from Figma', `Added ${imported.layers.length} element(s) from Figma clipboard`, 'success');
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, handleFitToScreen, addToast, resetProjectHistory, setProject]);

  // Helper to generate full original resolution export data URL
  const generateExportDataUrl = (): string | null => {
    if (!stageRef.current) return null;
    // Export at exact target dimensions (project.width x project.height)
    return stageRef.current.toDataURL({
      x: stagePosition.x,
      y: stagePosition.y,
      width: project.width * stageScale,
      height: project.height * stageScale,
      pixelRatio: 1 / stageScale
    });
  };

  // Export High-Res PNG
  const handleExportPNG = () => {
    const dataUrl = generateExportDataUrl();
    if (!dataUrl) return;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataUrl);
    downloadAnchor.setAttribute('download', `${project.title.replace(/\s+/g, '_')}.png`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export Scalable Vector SVG (Fully compatible with CorelDRAW, Illustrator & laser cutters)
  const handleExportSVG = () => {
    const svgContent = generateProjectSVG(project);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${project.title.replace(/\s+/g, '_')}.svg`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    if (addToast) {
      addToast('Vector SVG Exported', 'Compatible with CorelDRAW, Illustrator & laser cutters', 'success');
    }
  };

  // Push Directly to Hologram Stage Exe
  const handlePushToStage = async () => {
    if (isPushing) return;
    const dataUrl = generateExportDataUrl();
    if (!dataUrl) return;

    setIsPushing(true);
    setPushSuccess(false);

    try {
      const payload = {
        assetName: project.title || 'Configured Graphic',
        fileName: `${project.title.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_')}.png`,
        imageData: dataUrl,
        category: 1, // DataType.Image
        playlistName: 'Occasions',
        loadImmediately: true,
        projectData: project,
        width: project.width,
        height: project.height
      };

      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.ok && result.asset) {
        setPushSuccess(true);
        if (loadAsset) {
          loadAsset(result.asset);
        }
        if (addToast) {
          addToast(
            'Live on Stage!',
            `"${result.asset.AssetName}" is now displayed on the Hologram Exe.`,
            'success'
          );
        }
        setTimeout(() => setPushSuccess(false), 4000);
      } else {
        throw new Error(result.error || 'Server rejected upload');
      }
    } catch (err: any) {
      if (addToast) {
        addToast('Upload Failed', err.message || 'Could not reach server', 'error');
      }
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-configurator-studio="true"
      className="configurator-studio"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#141414',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#E0E0E0',
        fontFamily: 'Poppins, Inter, system-ui, sans-serif'
      }}
    >
      {/* ── TOP FIGMA-STYLE HEADER BAR ── */}
      <header
        style={{
          height: 48,
          background: '#242424',
          borderBottom: '1px solid #333333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          gap: 12,
          flexShrink: 0
        }}
      >
        {/* Brand & Project Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #0D99FF 0%, #E0458F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <Sparkles size={16} />
          </div>

          <input
            type="text"
            value={project.title}
            onChange={(e) =>
              setProject((prev) => ({ ...prev, title: e.target.value }), true)
            }
            placeholder="Untitled Occasion"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: 4,
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              padding: '3px 8px',
              outline: 'none',
              maxWidth: 240
            }}
            onFocus={(e) => (e.target.style.borderColor = '#0D99FF')}
            onBlur={(e) => (e.target.style.borderColor = 'transparent')}
          />
        </div>

        {/* Undo / Redo & Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl + Z)"
            style={{
              background: 'transparent',
              border: 'none',
              color: canUndo ? '#FFFFFF' : '#666666',
              padding: 6,
              borderRadius: 4,
              cursor: canUndo ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Undo2 size={16} />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl + Y or Ctrl + Shift + Z)"
            style={{
              background: 'transparent',
              border: 'none',
              color: canRedo ? '#FFFFFF' : '#666666',
              padding: 6,
              borderRadius: 4,
              cursor: canRedo ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Redo2 size={16} />
          </button>

          <div style={{ width: 1, height: 16, background: '#383838', margin: '0 4px' }} />

          {/* Zoom In / Out / Fit */}
          <button
            onClick={() => {
              const newScale = Math.min(3.0, stageScale * 1.15);
              setStageScale(Number(newScale.toFixed(3)));
            }}
            title="Zoom In"
            style={{ background: 'transparent', border: 'none', color: '#CCCCCC', padding: 6, cursor: 'pointer' }}
          >
            <ZoomIn size={15} />
          </button>

          <span style={{ fontSize: 11, fontWeight: 600, color: '#999999', minWidth: 38, textAlign: 'center' }}>
            {Math.round(stageScale * 100)}%
          </span>

          <button
            onClick={() => {
              const newScale = Math.max(0.15, stageScale * 0.85);
              setStageScale(Number(newScale.toFixed(3)));
            }}
            title="Zoom Out"
            style={{ background: 'transparent', border: 'none', color: '#CCCCCC', padding: 6, cursor: 'pointer' }}
          >
            <ZoomOut size={15} />
          </button>

          <button
            onClick={handleFitToScreen}
            title="Fit to Screen (F)"
            style={{ background: 'transparent', border: 'none', color: '#0D99FF', padding: 6, cursor: 'pointer' }}
          >
            <Maximize2 size={14} />
          </button>
        </div>

        {/* Resolution & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={selectedPresetId}
            onChange={(e) => handleResolutionChange(e.target.value)}
            style={{
              background: '#1A1A1A',
              color: '#CCCCCC',
              border: '1px solid #383838',
              padding: '5px 8px',
              borderRadius: 5,
              fontSize: 12,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {RESOLUTION_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.width}x{p.height})
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveProject}
            title="Save Template JSON"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#2E2E2E',
              border: '1px solid #3E3E3E',
              color: '#E0E0E0',
              padding: '5px 10px',
              borderRadius: 5,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            <Save size={13} />
            <span>Save</span>
          </button>

          <button
            onClick={() => loadProjectInputRef.current?.click()}
            title="Open Template JSON"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#2E2E2E',
              border: '1px solid #3E3E3E',
              color: '#E0E0E0',
              padding: '5px 10px',
              borderRadius: 5,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            <FolderOpen size={13} />
            <span>Open</span>
          </button>

          <button
            onClick={() => svgFileInputRef.current?.click()}
            title="Import SVG from Figma (Exact 1:1 resolution & placement)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#1A2E3B',
              border: '1px solid #0D99FF55',
              color: '#0D99FF',
              padding: '5px 10px',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Upload size={13} />
            <span>Figma SVG</span>
          </button>

          {/* Export Split Dropdown: PNG by default, arrow opens SVG / CorelDRAW */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={exportMenuRef}>
            <button
              onClick={handleExportPNG}
              title="Download PNG to PC"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: '#2E2E2E',
                border: '1px solid #3E3E3E',
                borderRight: 'none',
                color: '#E0E0E0',
                padding: '5px 9px',
                borderTopLeftRadius: 5,
                borderBottomLeftRadius: 5,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <Download size={13} />
              <span>PNG</span>
            </button>
            <button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              title="Export format options (PNG, SVG, CorelDRAW)"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#2E2E2E',
                border: '1px solid #3E3E3E',
                color: isExportMenuOpen ? '#0D99FF' : '#A0A0A0',
                padding: '5px 6px',
                borderTopRightRadius: 5,
                borderBottomRightRadius: 5,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <ChevronDown size={13} />
            </button>

            {/* Dropdown Menu */}
            {isExportMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  background: '#1F1F1F',
                  border: '1px solid #3E3E3E',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  zIndex: 2000,
                  minWidth: 210,
                  padding: '4px 0',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleExportPNG();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: '#E0E0E0',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Download size={13} color="#0D99FF" />
                  <div>
                    <div style={{ fontWeight: 600 }}>PNG Image</div>
                    <div style={{ fontSize: 10, color: '#888' }}>Standard raster image (.png)</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleExportSVG();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    color: '#E0E0E0',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Download size={13} color="#38BDF8" />
                  <div>
                    <div style={{ fontWeight: 600 }}>SVG / CorelDRAW</div>
                    <div style={{ fontSize: 10, color: '#888' }}>Vector file (.svg) for Corel & Illustrator</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Primary Action: Push to Hologram Stage */}
          <button
            onClick={handlePushToStage}
            disabled={isPushing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: pushSuccess ? '#37D17F' : '#0D99FF',
              color: '#FFFFFF',
              fontWeight: 600,
              border: 'none',
              padding: '5px 14px',
              borderRadius: 5,
              fontSize: 12,
              cursor: isPushing ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(13,153,255,0.3)'
            }}
          >
            {isPushing ? (
              <>
                <RefreshCw size={13} className="u-spin" />
                <span>Uploading...</span>
              </>
            ) : pushSuccess ? (
              <>
                <Check size={14} />
                <span>Live on Exe!</span>
              </>
            ) : (
              <>
                <MonitorUp size={13} />
                <span>Push to Stage</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888888',
              padding: 6,
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ── MAIN STUDIO BODY: LEFT SIDEBAR + INFINITE CANVAS + RIGHT INSPECTOR ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* LEFT PANEL: Occasions (Pages) & Layers Tree */}
        <div
          style={{
            width: 250,
            background: '#1E1E1E',
            borderRight: '1px solid #2B2B2B',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}
        >
          {/* Tabs: Occasions / Layers */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #2B2B2B',
              background: '#181818'
            }}
          >
            <button
              onClick={() => setActiveLeftTab('occasions')}
              style={{
                flex: 1,
                padding: '9px 0',
                background: activeLeftTab === 'occasions' ? '#1E1E1E' : 'transparent',
                border: 'none',
                color: activeLeftTab === 'occasions' ? '#0D99FF' : '#888888',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
                letterSpacing: 0.4
              }}
            >
              OCCASIONS
            </button>
            <button
              onClick={() => setActiveLeftTab('layers')}
              style={{
                flex: 1,
                padding: '9px 0',
                background: activeLeftTab === 'layers' ? '#1E1E1E' : 'transparent',
                border: 'none',
                color: activeLeftTab === 'layers' ? '#0D99FF' : '#888888',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
                letterSpacing: 0.4
              }}
            >
              LAYERS ({project.layers.length})
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {/* OCCASIONS (Figma Pages from video) */}
            {activeLeftTab === 'occasions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#777777', textTransform: 'uppercase', marginBottom: 4 }}>
                  Select Event Template:
                </span>
                {STARTER_TEMPLATES.map((tmpl) => {
                  const isCurrent = project.id === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => {
                        resetProjectHistory({ ...tmpl, id: tmpl.id });
                        setSelectedLayerIds(tmpl.layers[1] ? [tmpl.layers[1].id] : []);
                        setTimeout(handleFitToScreen, 50);
                      }}
                      style={{
                        padding: '9px 10px',
                        borderRadius: 6,
                        background: isCurrent ? 'rgba(13,153,255,0.14)' : '#262626',
                        border: `1px solid ${isCurrent ? '#0D99FF' : '#333333'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      {tmpl.id.includes('baby') && <Baby size={15} color="#E0458F" />}
                      {tmpl.id.includes('birthday') && <Cake size={15} color="#FACC15" />}
                      {tmpl.id.includes('joinee') && <UserPlus size={15} color="#38BDF8" />}
                      {tmpl.id.includes('anniversary') && <Award size={15} color="#F59E0B" />}
                      {tmpl.id.includes('welcome') && <Presentation size={15} color="#68D9D0" />}

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isCurrent ? '#0D99FF' : '#E0E0E0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tmpl.title}
                        </div>
                        <div style={{ fontSize: 10, color: '#777777' }}>
                          {tmpl.width}x{tmpl.height}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LAYERS TREE */}
            {activeLeftTab === 'layers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {project.layers
                  .slice()
                  .reverse()
                  .map((layer) => {
                    const isSelected = selectedLayerIds.includes(layer.id);
                    return (
                      <div
                        key={layer.id}
                        onClick={(e) => {
                          if (e.shiftKey) {
                            setSelectedLayerIds((prev) =>
                              prev.includes(layer.id) ? prev.filter((id) => id !== layer.id) : [...prev, layer.id]
                            );
                          } else {
                            setSelectedLayerIds([layer.id]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 8px',
                          borderRadius: 4,
                          background: isSelected ? '#0D99FF' : '#262626',
                          color: isSelected ? '#FFFFFF' : '#CCCCCC',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        {layer.type === 'image' ? (
                          <ImageIcon size={13} />
                        ) : layer.type === 'shape' ? (
                          <Shapes size={13} />
                        ) : (
                          <Type size={13} />
                        )}
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {layer.name}
                        </span>

                        {(layer.isEditable || layer.isTemplateField) && (
                          <span
                            title={`Editable field: ${layer.editableLabel || layer.templateLabel || layer.name}`}
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: 3,
                              background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(13,153,255,0.25)',
                              color: isSelected ? '#FFFFFF' : '#0D99FF',
                              letterSpacing: '0.4px',
                              flexShrink: 0
                            }}
                          >
                            EDITABLE
                          </span>
                        )}

                        {/* Visibility Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateLayer(layer.id, { visible: !layer.visible }, true);
                          }}
                          style={{ background: 'transparent', border: 'none', color: isSelected ? '#FFFFFF' : '#888888', padding: 2, cursor: 'pointer' }}
                        >
                          {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>

                        {/* Lock Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateLayer(layer.id, { isLocked: !layer.isLocked }, true);
                          }}
                          style={{ background: 'transparent', border: 'none', color: isSelected ? '#FFFFFF' : '#888888', padding: 2, cursor: 'pointer' }}
                        >
                          {layer.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* CENTER VIEWPORT (Pannable & Zoomable Figma Workspace) */}
        <div ref={canvasContainerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <KonvaCanvas
            project={project}
            selectedLayerIds={selectedLayerIds}
            onSelectLayers={setSelectedLayerIds}
            onUpdateLayer={handleUpdateLayer}
            onUpdateMultipleLayers={handleUpdateMultipleLayers}
            stageRef={stageRef}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
            activeTool={activeTool}
            stageScale={stageScale}
            stagePosition={stagePosition}
            onViewportChange={(newScale, newPos) => {
              setStageScale(newScale);
              setStagePosition(newPos);
            }}
            onContextMenu={(e, targetLayerId) => {
              setContextMenuState({
                isOpen: true,
                position: { x: e.clientX, y: e.clientY },
                targetLayerId
              });
            }}
            triggerEditTextId={triggerEditTextId}
          />

          {/* Quick Figma Shortcuts & Measurement Hint Pill */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(26, 26, 26, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 20,
              padding: '4px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 11,
              color: '#AAAAAA',
              zIndex: 10,
              pointerEvents: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)'
            }}
          >
            <span>📏 Hold <strong style={{ color: '#0D99FF' }}>Alt</strong> to inspect distances</span>
            <span style={{ color: '#444444' }}>•</span>
            <span>✋ <strong style={{ color: '#0D99FF' }}>Space + Drag</strong> to pan</span>
            <span style={{ color: '#444444' }}>•</span>
            <span>🔲 Drag box or <strong style={{ color: '#0D99FF' }}>Shift+Click</strong> multi-select</span>
          </div>

          {/* FLOATING BOTTOM TOOLBAR (Figma Dock) */}
          <div
            style={{
              position: 'absolute',
              bottom: 18,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#2B2B2B',
              border: '1px solid #3E3E3E',
              borderRadius: 8,
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 10
            }}
          >
            <button
              onClick={() => setActiveTool('select')}
              title="Move / Select (V)"
              style={{
                background: activeTool === 'select' ? '#0D99FF' : 'transparent',
                border: 'none',
                color: activeTool === 'select' ? '#FFFFFF' : '#CCCCCC',
                padding: '6px 8px',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              <MousePointer size={16} />
            </button>

            <button
              onClick={() => setActiveTool('hand')}
              title="Hand / Pan Canvas (H or hold Spacebar)"
              style={{
                background: activeTool === 'hand' ? '#0D99FF' : 'transparent',
                border: 'none',
                color: activeTool === 'hand' ? '#FFFFFF' : '#CCCCCC',
                padding: '6px 8px',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              <Hand size={16} />
            </button>

            <div style={{ width: 1, height: 16, background: '#444444', margin: '0 2px' }} />

            <button
              onClick={() => handleAddText()}
              title="Add Text (T)"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#CCCCCC',
                padding: '6px 8px',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              <Type size={16} />
            </button>

            <button
              onClick={() => addImageInputRef.current?.click()}
              title="Upload New Photo"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#CCCCCC',
                padding: '6px 8px',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              <ImageIcon size={16} />
            </button>

            {/* Shapes Flyout Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsShapesMenuOpen((prev) => !prev)}
                title="Add Vector Shape"
                style={{
                  background: isShapesMenuOpen ? '#0D99FF' : 'transparent',
                  border: 'none',
                  color: isShapesMenuOpen ? '#FFFFFF' : '#CCCCCC',
                  padding: '6px 8px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <Shapes size={16} />
              </button>

              {isShapesMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 10,
                    background: '#242424',
                    border: '1px solid #3E3E3E',
                    borderRadius: 8,
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    width: 160,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    zIndex: 50
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#888', padding: '2px 6px', textTransform: 'uppercase' }}>
                    Vector Shapes
                  </span>
                  {[
                    { type: 'rectangle' as const, label: 'Rectangle', icon: <Square size={13} /> },
                    { type: 'rounded-rect' as const, label: 'Rounded Card', icon: <Bookmark size={13} /> },
                    { type: 'circle' as const, label: 'Circle / Ellipse', icon: <Circle size={13} /> },
                    { type: 'star' as const, label: '5-Point Star', icon: <Star size={13} /> },
                    { type: 'heart' as const, label: 'Love Heart', icon: <Heart size={13} /> },
                    { type: 'ribbon' as const, label: 'Banner Ribbon', icon: <Award size={13} /> },
                    { type: 'badge' as const, label: 'Sunburst Badge', icon: <Sparkles size={13} /> }
                  ].map((s) => (
                    <button
                      key={s.type}
                      onClick={() => handleAddShape(s.type)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#E0E0E0',
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#333333')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {s.icon}
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => bgFileInputRef.current?.click()}
              title="Set Background Image"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#CCCCCC',
                padding: '6px 8px',
                borderRadius: 5,
                cursor: 'pointer'
              }}
            >
              <Palette size={16} />
            </button>
          </div>
        </div>

        {/* RIGHT INSPECTOR PANEL: Simplified Context Properties */}
        <div
          style={{
            width: 290,
            background: '#1E1E1E',
            borderLeft: '1px solid #2B2B2B',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
            padding: 16
          }}
        >
          {selectedLayerIds.length > 1 ? (
            /* MULTIPLE SELECTION INSPECTOR */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0D99FF', textTransform: 'uppercase' }}>
                  Multiple Selected ({selectedLayerIds.length})
                </span>
                <button
                  onClick={handleDeleteSelectedLayers}
                  title="Delete selected elements"
                  style={{ background: 'transparent', border: 'none', color: '#F43F5E', cursor: 'pointer' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Align Horizontal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#AAAAAA' }}>Align Horizontal</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                  <button
                    onClick={() => handleAlign('left')}
                    title="Align Left"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    <AlignLeft size={13} />
                    <span>Left</span>
                  </button>
                  <button
                    onClick={() => handleAlign('center')}
                    title="Align Center"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    <AlignCenter size={13} />
                    <span>Center</span>
                  </button>
                  <button
                    onClick={() => handleAlign('right')}
                    title="Align Right"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    <AlignRight size={13} />
                    <span>Right</span>
                  </button>
                </div>
              </div>

              {/* Align Vertical */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#AAAAAA' }}>Align Vertical</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                  <button
                    onClick={() => handleAlign('top')}
                    title="Align Top"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    <AlignStartVertical size={13} />
                    <span>Top</span>
                  </button>
                  <button
                    onClick={() => handleAlign('middle')}
                    title="Align Middle"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    <AlignCenterVertical size={13} />
                    <span>Middle</span>
                  </button>
                  <button
                    onClick={() => handleAlign('bottom')}
                    title="Align Bottom"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    <AlignEndVertical size={13} />
                    <span>Bottom</span>
                  </button>
                </div>
              </div>

              {/* Nudge / Move All Elements Together */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #2B2B2B', paddingTop: 12 }}>
                <span style={{ fontSize: 11, color: '#AAAAAA' }}>Nudge Selected (Move Together)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button
                    onClick={() => {
                      const updates = project.layers
                        .filter((l) => selectedLayerIds.includes(l.id))
                        .map((l) => ({ id: l.id, updates: { x: l.x - 10 } }));
                      handleUpdateMultipleLayers(updates, true);
                    }}
                    style={{
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    ← Left 10px
                  </button>
                  <button
                    onClick={() => {
                      const updates = project.layers
                        .filter((l) => selectedLayerIds.includes(l.id))
                        .map((l) => ({ id: l.id, updates: { x: l.x + 10 } }));
                      handleUpdateMultipleLayers(updates, true);
                    }}
                    style={{
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Right 10px →
                  </button>
                  <button
                    onClick={() => {
                      const updates = project.layers
                        .filter((l) => selectedLayerIds.includes(l.id))
                        .map((l) => ({ id: l.id, updates: { y: l.y - 10 } }));
                      handleUpdateMultipleLayers(updates, true);
                    }}
                    style={{
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    ↑ Up 10px
                  </button>
                  <button
                    onClick={() => {
                      const updates = project.layers
                        .filter((l) => selectedLayerIds.includes(l.id))
                        .map((l) => ({ id: l.id, updates: { y: l.y + 10 } }));
                      handleUpdateMultipleLayers(updates, true);
                    }}
                    style={{
                      padding: '6px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Down 10px ↓
                  </button>
                </div>
              </div>

              {/* Multi-Selection Help */}
              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 6,
                  background: 'rgba(13,153,255,0.08)',
                  border: '1px solid rgba(13,153,255,0.2)',
                  fontSize: 11,
                  color: '#93C5FD',
                  lineHeight: 1.4
                }}
              >
                💡 <b>Move together:</b> Drag any selected element or transform box on canvas to move all elements together.
              </div>
            </div>
          ) : selectedLayer ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0D99FF', textTransform: 'uppercase' }}>
                  {selectedLayer.type === 'text'
                    ? 'Text Typography'
                    : selectedLayer.type === 'shape'
                    ? `${((selectedLayer as ShapeLayer).shapeType || 'Vector').toUpperCase()} SHAPE`
                    : 'Photo Frame'}
                </span>
                <button
                  onClick={() => handleDeleteLayer(selectedLayer.id)}
                  title="Delete element"
                  style={{ background: 'transparent', border: 'none', color: '#F43F5E', cursor: 'pointer' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* EDITABLE TEMPLATE FIELD TOGGLE */}
              <div
                style={{
                  background: (selectedLayer.isEditable || selectedLayer.isTemplateField) ? 'rgba(13, 153, 255, 0.08)' : '#222222',
                  border: `1px solid ${(selectedLayer.isEditable || selectedLayer.isTemplateField) ? '#0D99FF' : '#333333'}`,
                  borderRadius: 6,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: (selectedLayer.isEditable || selectedLayer.isTemplateField) ? '#0D99FF' : '#CCCCCC' }}>
                      Editable in Template
                    </span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6, margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedLayer.isEditable || selectedLayer.isTemplateField)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        handleUpdateLayer(
                          selectedLayer.id,
                          {
                            isEditable: checked,
                            isTemplateField: checked,
                            editableLabel: selectedLayer.editableLabel || selectedLayer.templateLabel || selectedLayer.name
                          },
                          true
                        );
                      }}
                      style={{ cursor: 'pointer', accentColor: '#0D99FF', width: 14, height: 14 }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 600, color: (selectedLayer.isEditable || selectedLayer.isTemplateField) ? '#0D99FF' : '#777777' }}>
                      {(selectedLayer.isEditable || selectedLayer.isTemplateField) ? 'Editable' : 'Locked'}
                    </span>
                  </label>
                </div>

                {Boolean(selectedLayer.isEditable || selectedLayer.isTemplateField) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 10, color: '#999999' }}>Field Prompt (displayed in quick form):</span>
                    <input
                      type="text"
                      value={selectedLayer.editableLabel ?? selectedLayer.templateLabel ?? selectedLayer.name}
                      onChange={(e) => {
                        handleUpdateLayer(
                          selectedLayer.id,
                          {
                            editableLabel: e.target.value,
                            templateLabel: e.target.value
                          },
                          true
                        );
                      }}
                      placeholder="e.g. Baby Photo, Employee Name..."
                      style={{
                        background: '#1A1A1A',
                        border: '1px solid #3E3E3E',
                        borderRadius: 4,
                        padding: '4px 8px',
                        color: '#FFFFFF',
                        fontSize: 11,
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Exact Position (X & Y) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#AAAAAA' }}>Position</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '3px 8px' }}>
                    <span style={{ fontSize: 11, color: '#888888', marginRight: 6, fontWeight: 700 }}>X</span>
                    <input
                      type="number"
                      value={Math.round(selectedLayer.x)}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { x: Number(e.target.value) }, true)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 12, outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '3px 8px' }}>
                    <span style={{ fontSize: 11, color: '#888888', marginRight: 6, fontWeight: 700 }}>Y</span>
                    <input
                      type="number"
                      value={Math.round(selectedLayer.y)}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { y: Number(e.target.value) }, true)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 12, outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* IMAGE / PHOTO PROPERTIES */}
              {selectedLayer.type === 'image' && (
                <>
                  {/* Exact Dimensions (W & H) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#AAAAAA' }}>Dimensions</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '3px 8px' }}>
                        <span style={{ fontSize: 11, color: '#888888', marginRight: 6, fontWeight: 700 }}>W</span>
                        <input
                          type="number"
                          value={Math.round((selectedLayer as ImageLayer).width * (selectedLayer.scaleX || 1))}
                          onChange={(e) => {
                            const newW = Number(e.target.value);
                            if (newW > 0) handleUpdateLayer(selectedLayer.id, { width: newW, scaleX: 1 }, true);
                          }}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 12, outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '3px 8px' }}>
                        <span style={{ fontSize: 11, color: '#888888', marginRight: 6, fontWeight: 700 }}>H</span>
                        <input
                          type="number"
                          value={Math.round((selectedLayer as ImageLayer).height * (selectedLayer.scaleY || 1))}
                          onChange={(e) => {
                            const newH = Number(e.target.value);
                            if (newH > 0) handleUpdateLayer(selectedLayer.id, { height: newH, scaleY: 1 }, true);
                          }}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 12, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Big Friendly Replace Photo Button */}
                  <button
                    onClick={() => replaceImageInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: '#0D99FF',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(13,153,255,0.3)'
                    }}
                  >
                    <RefreshCw size={14} />
                    <span>Replace Photo</span>
                  </button>

                  {/* AI Generate Matching Pastel Background Button (Directly below Replace Photo) */}
                  <GeminiBackgroundGenerator
                    targetWidth={(selectedLayer as ImageLayer).width * (selectedLayer.scaleX || 1)}
                    targetHeight={(selectedLayer as ImageLayer).height * (selectedLayer.scaleY || 1)}
                    onApplyImage={(generatedImageSrc) => {
                      handleUpdateLayer(selectedLayer.id, { src: generatedImageSrc }, true);
                    }}
                  />

                  {/* Frame Border Width (Editable Number Input + Slider) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#AAAAAA' }}>Frame Border Width</span>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '1px 6px' }}>
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={(selectedLayer as ImageLayer).borderWidth || 0}
                          onChange={(e) =>
                            handleUpdateLayer(selectedLayer.id, { borderWidth: Math.max(0, Number(e.target.value)) }, true)
                          }
                          style={{
                            width: 36,
                            background: 'transparent',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: 600,
                            textAlign: 'right',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#888888', marginLeft: 2 }}>px</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={(selectedLayer as ImageLayer).borderWidth || 0}
                      onChange={(e) =>
                        handleUpdateLayer(selectedLayer.id, { borderWidth: Number(e.target.value) }, true)
                      }
                    />
                  </div>

                  {/* Frame Color */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#AAAAAA' }}>Frame Color</span>
                    <input
                      type="color"
                      value={(selectedLayer as ImageLayer).borderColor || '#ffffff'}
                      onChange={(e) =>
                        handleUpdateLayer(selectedLayer.id, { borderColor: e.target.value }, true)
                      }
                      style={{ width: 34, height: 26, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                  </div>
                </>
              )}

              {/* TEXT PROPERTIES */}
              {selectedLayer.type === 'text' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: '#AAAAAA' }}>Text Content</label>
                    <textarea
                      rows={2}
                      value={(selectedLayer as TextLayer).text}
                      onChange={(e) =>
                        handleUpdateLayer(selectedLayer.id, { text: e.target.value }, false)
                      }
                      onBlur={() => handleUpdateLayer(selectedLayer.id, {}, true)}
                      style={{
                        background: '#2B2B2B',
                        border: '1px solid #3E3E3E',
                        color: '#FFFFFF',
                        padding: '6px 8px',
                        borderRadius: 4,
                        fontSize: 13,
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />

                    {/* AI Generation applied directly to this Text Content */}
                    <div style={{ marginTop: 4 }}>
                      <GeminiWishGenerator
                        triggerButtonText="AI Generate Wish for Text"
                        onApplyText={(aiText) => {
                          handleUpdateLayer(
                            selectedLayer.id,
                            {
                              text: aiText,
                              name: aiText.length > 25 ? `${aiText.slice(0, 25)}...` : aiText
                            },
                            true
                          );
                        }}
                      />
                    </div>
                  </div>

                  {/* Font Family */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: '#AAAAAA' }}>Font Family</label>
                    <select
                      value={(selectedLayer as TextLayer).fontFamily}
                      onChange={(e) =>
                        handleUpdateLayer(selectedLayer.id, { fontFamily: e.target.value }, true)
                      }
                      style={{
                        background: '#2B2B2B',
                        border: '1px solid #3E3E3E',
                        color: '#FFFFFF',
                        padding: '6px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size (Editable Number Input + Slider) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#AAAAAA' }}>Font Size</span>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '1px 6px' }}>
                        <input
                          type="number"
                          min={8}
                          max={250}
                          value={(selectedLayer as TextLayer).fontSize}
                          onChange={(e) =>
                            handleUpdateLayer(selectedLayer.id, { fontSize: Math.max(8, Number(e.target.value)) }, true)
                          }
                          style={{
                            width: 40,
                            background: 'transparent',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: 600,
                            textAlign: 'right',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#888888', marginLeft: 2 }}>px</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={120}
                      value={(selectedLayer as TextLayer).fontSize}
                      onChange={(e) =>
                        handleUpdateLayer(selectedLayer.id, { fontSize: Number(e.target.value) }, true)
                      }
                    />
                  </div>

                  {/* Fill Type: Solid vs Linear Gradient */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: '#AAAAAA' }}>Fill Type</label>
                    <div style={{ display: 'flex', background: '#242424', borderRadius: 5, padding: 2, border: '1px solid #383838' }}>
                      <button
                        onClick={() => handleUpdateLayer(selectedLayer.id, { fillType: 'solid' }, true)}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          borderRadius: 4,
                          background: (selectedLayer as TextLayer).fillType !== 'linear' ? '#0D99FF' : 'transparent',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        Solid
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateLayer(
                            selectedLayer.id,
                            {
                              fillType: 'linear',
                              gradientStart: (selectedLayer as TextLayer).fill || '#0D99FF',
                              gradientEnd: (selectedLayer as TextLayer).gradientEnd || '#E0458F',
                              gradientAngle: (selectedLayer as TextLayer).gradientAngle || 0
                            },
                            true
                          )
                        }
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          borderRadius: 4,
                          background: (selectedLayer as TextLayer).fillType === 'linear' ? '#0D99FF' : 'transparent',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        Gradient
                      </button>
                    </div>
                  </div>

                  {/* If Solid Fill */}
                  {(selectedLayer as TextLayer).fillType !== 'linear' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, color: '#AAAAAA' }}>Color Palette</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {PRESET_COLORS.map((c) => (
                          <div
                            key={c}
                            onClick={() => handleUpdateLayer(selectedLayer.id, { fill: c }, true)}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              background: c,
                              border: (selectedLayer as TextLayer).fill === c ? '2px solid #0D99FF' : '1px solid #444',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                        <input
                          type="color"
                          value={(selectedLayer as TextLayer).fill}
                          onChange={(e) =>
                            handleUpdateLayer(selectedLayer.id, { fill: e.target.value }, true)
                          }
                          style={{ width: 22, height: 20, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* If Linear Gradient */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#AAAAAA' }}>Gradient Colors</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="color"
                            value={(selectedLayer as TextLayer).gradientStart || (selectedLayer as TextLayer).fill || '#0D99FF'}
                            onChange={(e) =>
                              handleUpdateLayer(selectedLayer.id, { gradientStart: e.target.value }, true)
                            }
                            style={{ width: 26, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: 11, color: '#888' }}>to</span>
                          <input
                            type="color"
                            value={(selectedLayer as TextLayer).gradientEnd || '#E0458F'}
                            onChange={(e) =>
                              handleUpdateLayer(selectedLayer.id, { gradientEnd: e.target.value }, true)
                            }
                            style={{ width: 26, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          />
                        </div>
                      </div>

                      {/* Direction */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#AAAAAA' }}>Direction</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[
                            { angle: 0, label: '→ Right' },
                            { angle: 90, label: '↓ Down' },
                            { angle: 45, label: '↘ Diag' }
                          ].map((dir) => (
                            <button
                              key={dir.angle}
                              onClick={() => handleUpdateLayer(selectedLayer.id, { gradientAngle: dir.angle }, true)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: ((selectedLayer as TextLayer).gradientAngle || 0) === dir.angle ? '#0D99FF' : '#2B2B2B',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: 10,
                                cursor: 'pointer'
                              }}
                            >
                              {dir.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gradient Presets */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: '#888' }}>Preset Gradients</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                          {GRADIENT_PRESETS.map((g) => (
                            <div
                              key={g.id}
                              title={g.label}
                              onClick={() =>
                                handleUpdateLayer(
                                  selectedLayer.id,
                                  { gradientStart: g.start, gradientEnd: g.end, fillType: 'linear' },
                                  true
                                )
                              }
                              style={{
                                height: 22,
                                borderRadius: 4,
                                background: `linear-gradient(135deg, ${g.start}, ${g.end})`,
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.2)'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alignment */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => handleUpdateLayer(selectedLayer.id, { align }, true)}
                        style={{
                          flex: 1,
                          padding: '5px 0',
                          borderRadius: 4,
                          background: (selectedLayer as TextLayer).align === align ? '#0D99FF' : '#2B2B2B',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: 11,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* SHAPE PROPERTIES */}
              {selectedLayer.type === 'shape' && (
                <>
                  {/* Shape Dimensions W & H */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#AAAAAA' }}>Shape Dimensions (Stretchable)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '3px 8px' }}>
                        <span style={{ fontSize: 11, color: '#888888', marginRight: 6, fontWeight: 700 }}>W</span>
                        <input
                          type="number"
                          value={Math.round((selectedLayer as ShapeLayer).width * (selectedLayer.scaleX || 1))}
                          onChange={(e) => {
                            const newW = Number(e.target.value);
                            if (newW > 0) handleUpdateLayer(selectedLayer.id, { width: newW, scaleX: 1 }, true);
                          }}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 12, outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '3px 8px' }}>
                        <span style={{ fontSize: 11, color: '#888888', marginRight: 6, fontWeight: 700 }}>H</span>
                        <input
                          type="number"
                          value={Math.round((selectedLayer as ShapeLayer).height * (selectedLayer.scaleY || 1))}
                          onChange={(e) => {
                            const newH = Number(e.target.value);
                            if (newH > 0) handleUpdateLayer(selectedLayer.id, { height: newH, scaleY: 1 }, true);
                          }}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 12, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>



                  {/* Fill Type: Solid vs Linear Gradient */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: '#AAAAAA' }}>Fill Type</label>
                    <div style={{ display: 'flex', background: '#242424', borderRadius: 5, padding: 2, border: '1px solid #383838' }}>
                      <button
                        onClick={() => handleUpdateLayer(selectedLayer.id, { fillType: 'solid' }, true)}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          borderRadius: 4,
                          background: (selectedLayer as ShapeLayer).fillType !== 'linear' ? '#0D99FF' : 'transparent',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        Solid
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateLayer(
                            selectedLayer.id,
                            {
                              fillType: 'linear',
                              gradientStart: (selectedLayer as ShapeLayer).fill || '#0D99FF',
                              gradientEnd: (selectedLayer as ShapeLayer).gradientEnd || '#E0458F',
                              gradientAngle: 0
                            },
                            true
                          )
                        }
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          borderRadius: 4,
                          background: (selectedLayer as ShapeLayer).fillType === 'linear' ? '#0D99FF' : 'transparent',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        Gradient
                      </button>
                    </div>
                  </div>

                  {/* If Solid Fill */}
                  {(selectedLayer as ShapeLayer).fillType !== 'linear' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, color: '#AAAAAA' }}>Color Palette</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {PRESET_COLORS.map((c) => (
                          <div
                            key={c}
                            onClick={() => handleUpdateLayer(selectedLayer.id, { fill: c }, true)}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              background: c,
                              border: (selectedLayer as ShapeLayer).fill === c ? '2px solid #0D99FF' : '1px solid #444',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                        <input
                          type="color"
                          value={(selectedLayer as ShapeLayer).fill}
                          onChange={(e) => handleUpdateLayer(selectedLayer.id, { fill: e.target.value }, true)}
                          style={{ width: 22, height: 20, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  ) : (
                    /* If Linear Gradient */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#AAAAAA' }}>Gradient Colors</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="color"
                            value={(selectedLayer as ShapeLayer).gradientStart || (selectedLayer as ShapeLayer).fill || '#0D99FF'}
                            onChange={(e) =>
                              handleUpdateLayer(selectedLayer.id, { gradientStart: e.target.value }, true)
                            }
                            style={{ width: 26, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: 11, color: '#888' }}>to</span>
                          <input
                            type="color"
                            value={(selectedLayer as ShapeLayer).gradientEnd || '#E0458F'}
                            onChange={(e) =>
                              handleUpdateLayer(selectedLayer.id, { gradientEnd: e.target.value }, true)
                            }
                            style={{ width: 26, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          />
                        </div>
                      </div>

                      {/* Direction */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: '#AAAAAA' }}>Direction</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[
                            { angle: 0, label: '→ Right' },
                            { angle: 90, label: '↓ Down' },
                            { angle: 45, label: '↘ Diag' }
                          ].map((dir) => (
                            <button
                              key={dir.angle}
                              onClick={() => handleUpdateLayer(selectedLayer.id, { gradientAngle: dir.angle }, true)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: ((selectedLayer as ShapeLayer).gradientAngle || 0) === dir.angle ? '#0D99FF' : '#2B2B2B',
                                color: '#FFFFFF',
                                border: 'none',
                                fontSize: 10,
                                cursor: 'pointer'
                              }}
                            >
                              {dir.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gradient Presets */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: '#888' }}>Preset Gradients</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                          {GRADIENT_PRESETS.map((g) => (
                            <div
                              key={g.id}
                              title={g.label}
                              onClick={() =>
                                handleUpdateLayer(
                                  selectedLayer.id,
                                  { gradientStart: g.start, gradientEnd: g.end, fillType: 'linear' },
                                  true
                                )
                              }
                              style={{
                                height: 22,
                                borderRadius: 4,
                                background: `linear-gradient(135deg, ${g.start}, ${g.end})`,
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.2)'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </>
              )}

              {/* FIGMA-STYLE APPEARANCE SECTION */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #2B2B2B', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#E0E0E0' }}>Appearance</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handleUpdateLayer(selectedLayer.id, { visible: !(selectedLayer.visible ?? true) }, true)}
                      title={selectedLayer.visible === false ? 'Show layer' : 'Hide layer'}
                      style={{ background: 'transparent', border: 'none', color: selectedLayer.visible === false ? '#666666' : '#CCCCCC', cursor: 'pointer', padding: 2, display: 'flex' }}
                    >
                      {selectedLayer.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <Droplet size={13} style={{ color: '#888888' }} />
                  </div>
                </div>

                {/* Opacity & Corner Radius Inputs Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: (selectedLayer.type === 'shape' || selectedLayer.type === 'image') ? '1fr 1fr' : '1fr', gap: 8 }}>
                  {/* Opacity */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 10, color: '#888888' }}>Opacity</span>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '3px 8px', height: 28 }}>
                      <Square size={11} style={{ color: '#888888', marginRight: 6, flexShrink: 0 }} />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round((selectedLayer.opacity ?? 1) * 100)}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value)));
                          handleUpdateLayer(selectedLayer.id, { opacity: Number((val / 100).toFixed(2)) }, true);
                        }}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 12, fontWeight: 600, outline: 'none' }}
                      />
                      <span style={{ fontSize: 11, color: '#888888', marginLeft: 2 }}>%</span>
                    </div>
                  </div>

                  {/* Corner Radius (for shapes and images) */}
                  {(selectedLayer.type === 'shape' || selectedLayer.type === 'image') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#888888' }}>Corner radius</span>
                        <span title="Independent corners" style={{ display: 'flex', alignItems: 'center' }}>
                          <Maximize2 size={10} style={{ color: '#666666' }} />
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '3px 8px', height: 28 }}>
                        <div style={{ width: 11, height: 11, border: '1.5px dashed #888888', borderRadius: 3, marginRight: 6, flexShrink: 0 }} />
                        <input
                          type="number"
                          min={0}
                          max={200}
                          value={(selectedLayer as any).cornerRadius ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            handleUpdateLayer(selectedLayer.id, { cornerRadius: val }, true);
                          }}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 12, fontWeight: 600, outline: 'none' }}
                        />
                        <span style={{ fontSize: 11, color: '#888888', marginLeft: 2 }}>px</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FIGMA-STYLE STROKE SECTION */}
              {(selectedLayer.type === 'shape' || selectedLayer.type === 'text') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #2B2B2B', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#E0E0E0' }}>Stroke</span>
                    <button
                      onClick={() => {
                        const hasStroke = Boolean((selectedLayer as any).strokeWidth && (selectedLayer as any).strokeWidth > 0);
                        if (hasStroke) {
                          handleUpdateLayer(selectedLayer.id, { strokeWidth: 0, strokeEnabled: false }, true);
                        } else {
                          handleUpdateLayer(selectedLayer.id, { stroke: (selectedLayer as any).stroke || '#000000', strokeWidth: 1, strokeEnabled: true, strokePosition: 'inside' }, true);
                        }
                      }}
                      title={Boolean((selectedLayer as any).strokeWidth && (selectedLayer as any).strokeWidth > 0) ? 'Remove stroke' : 'Add stroke'}
                      style={{ background: 'transparent', border: 'none', color: '#CCCCCC', cursor: 'pointer', padding: 2, display: 'flex', borderRadius: 4 }}
                    >
                      {Boolean((selectedLayer as any).strokeWidth && (selectedLayer as any).strokeWidth > 0) ? <Minus size={13} /> : <Plus size={13} />}
                    </button>
                  </div>

                  {Boolean((selectedLayer as any).strokeWidth && (selectedLayer as any).strokeWidth > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#242424', padding: 8, borderRadius: 6, border: '1px solid #333333' }}>
                      {/* Row 1: Swatch + Hex + Opacity + Visibility + Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* Swatch & Color input */}
                        <div style={{ position: 'relative', width: 22, height: 22, borderRadius: 4, overflow: 'hidden', border: '1px solid #444', flexShrink: 0 }}>
                          <input
                            type="color"
                            value={(selectedLayer as any).stroke || '#000000'}
                            onChange={(e) => handleUpdateLayer(selectedLayer.id, { stroke: e.target.value, strokeEnabled: true }, true)}
                            style={{ position: 'absolute', top: -4, left: -4, width: 32, height: 32, cursor: 'pointer', border: 'none', padding: 0 }}
                          />
                        </div>

                        {/* Hex display/input */}
                        <div style={{ flex: 1, background: '#1E1E1E', border: '1px solid #3A3A3A', borderRadius: 4, padding: '2px 6px', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={((selectedLayer as any).stroke || '#000000').replace('#', '').toUpperCase()}
                            onChange={(e) => {
                              const hex = `#${e.target.value.trim()}`;
                              handleUpdateLayer(selectedLayer.id, { stroke: hex, strokeEnabled: true }, true);
                            }}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 11, fontFamily: 'monospace', outline: 'none' }}
                          />
                        </div>

                        {/* Opacity */}
                        <div style={{ width: 48, background: '#1E1E1E', border: '1px solid #3A3A3A', borderRadius: 4, padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={Math.round(((selectedLayer as any).strokeOpacity ?? 1) * 100)}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, Number(e.target.value)));
                              handleUpdateLayer(selectedLayer.id, { strokeOpacity: Number((val / 100).toFixed(2)) }, true);
                            }}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 11, textAlign: 'right', outline: 'none' }}
                          />
                          <span style={{ fontSize: 10, color: '#777', marginLeft: 1 }}>%</span>
                        </div>

                        {/* Visibility Eye */}
                        <button
                          onClick={() => handleUpdateLayer(selectedLayer.id, { strokeEnabled: (selectedLayer as any).strokeEnabled === false ? true : false }, true)}
                          style={{ background: 'transparent', border: 'none', color: (selectedLayer as any).strokeEnabled !== false ? '#CCCCCC' : '#666666', cursor: 'pointer', padding: 2, display: 'flex' }}
                          title="Toggle stroke visibility"
                        >
                          {(selectedLayer as any).strokeEnabled !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>

                        {/* Remove (-) */}
                        <button
                          onClick={() => handleUpdateLayer(selectedLayer.id, { strokeWidth: 0, strokeEnabled: false }, true)}
                          style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer', padding: 2, display: 'flex' }}
                          title="Remove stroke"
                        >
                          <Minus size={13} />
                        </button>
                      </div>

                      {/* Row 2: Position & Weight */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 10, color: '#888888' }}>Position</span>
                          <select
                            value={(selectedLayer as any).strokePosition || 'inside'}
                            onChange={(e) => handleUpdateLayer(selectedLayer.id, { strokePosition: e.target.value as any }, true)}
                            style={{
                              background: '#1E1E1E',
                              border: '1px solid #3A3A3A',
                              borderRadius: 4,
                              color: '#FFFFFF',
                              fontSize: 11,
                              padding: '3px 6px',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="inside">Inside</option>
                            <option value="center">Center</option>
                            <option value="outside">Outside</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 10, color: '#888888' }}>Weight</span>
                          <div style={{ display: 'flex', alignItems: 'center', background: '#1E1E1E', border: '1px solid #3A3A3A', borderRadius: 4, padding: '3px 6px' }}>
                            <span style={{ fontSize: 10, color: '#888888', marginRight: 4 }}>≡</span>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={(selectedLayer as any).strokeWidth || 1}
                              onChange={(e) => handleUpdateLayer(selectedLayer.id, { strokeWidth: Math.max(1, Number(e.target.value)), strokeEnabled: true }, true)}
                              style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 11, fontWeight: 600, outline: 'none' }}
                            />
                            <span style={{ fontSize: 10, color: '#777', marginLeft: 2 }}>px</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FIGMA-STYLE EFFECTS SECTION */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #2B2B2B', paddingTop: 12, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#E0E0E0' }}>Effects</span>
                  <div style={{ position: 'relative' }} ref={effectsMenuRef}>
                    <button
                      onClick={() => setIsEffectsMenuOpen(!isEffectsMenuOpen)}
                      title="Add Effect"
                      style={{ background: '#2A2A2A', border: '1px solid #3A3A3A', color: '#CCCCCC', cursor: 'pointer', padding: '2px 5px', display: 'flex', alignItems: 'center', borderRadius: 4 }}
                    >
                      <Plus size={13} />
                    </button>

                    {/* FIGMA-STYLE EFFECTS DROPDOWN MENU */}
                    {isEffectsMenuOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 24,
                          width: 170,
                          background: '#1E1E1E',
                          border: '1px solid #333333',
                          borderRadius: 8,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                          zIndex: 1000,
                          padding: '4px 0',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        {[
                          { id: 'drop-shadow', label: 'Drop shadow', icon: '⧉' },
                          { id: 'inner-shadow', label: 'Inner shadow', icon: '❐' },
                          { id: 'layer-blur', label: 'Layer blur', icon: '▦' },
                          { id: 'background-blur', label: 'Background blur', icon: '▤' },
                          { id: 'noise', label: 'Noise', icon: '▩' },
                          { id: 'texture', label: 'Texture', icon: '▧' },
                          { id: 'glass', label: 'Glass', icon: '◯' }
                        ].map((effect) => (
                          <button
                            key={effect.id}
                            onClick={() => {
                              if (effect.id === 'drop-shadow') {
                                handleUpdateLayer(selectedLayer.id, {
                                  shadowEnabled: true,
                                  shadowType: 'drop-shadow',
                                  shadowColor: (selectedLayer as any).shadowColor || '#000000',
                                  shadowBlur: (selectedLayer as any).shadowBlur || 8,
                                  shadowOffsetX: (selectedLayer as any).shadowOffsetX ?? 0,
                                  shadowOffsetY: (selectedLayer as any).shadowOffsetY ?? 4,
                                  shadowOpacity: (selectedLayer as any).shadowOpacity ?? 0.35
                                }, true);
                              } else if (effect.id === 'inner-shadow') {
                                handleUpdateLayer(selectedLayer.id, {
                                  shadowEnabled: true,
                                  shadowType: 'inner-shadow',
                                  shadowColor: (selectedLayer as any).shadowColor || '#000000',
                                  shadowBlur: (selectedLayer as any).shadowBlur || 6,
                                  shadowOffsetX: (selectedLayer as any).shadowOffsetX ?? 0,
                                  shadowOffsetY: (selectedLayer as any).shadowOffsetY ?? 3,
                                  shadowOpacity: (selectedLayer as any).shadowOpacity ?? 0.3
                                }, true);
                              } else {
                                handleUpdateLayer(selectedLayer.id, {
                                  shadowEnabled: true,
                                  shadowType: 'layer-blur',
                                  shadowBlur: (selectedLayer as any).shadowBlur || 12,
                                  shadowOffsetX: 0,
                                  shadowOffsetY: 0,
                                  shadowOpacity: 0.5
                                }, true);
                              }
                              setIsEffectsMenuOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '7px 12px',
                              background: (selectedLayer as any).shadowType === effect.id && (selectedLayer as any).shadowEnabled ? '#0D99FF22' : 'transparent',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: 12,
                              textAlign: 'left',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#2A2A2A')}
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                (selectedLayer as any).shadowType === effect.id && (selectedLayer as any).shadowEnabled
                                  ? '#0D99FF22'
                                  : 'transparent')
                            }
                          >
                            <span style={{ fontSize: 13, color: '#AAAAAA' }}>{effect.icon}</span>
                            <span>{effect.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Effect Card (Drop Shadow / Inner Shadow / Blur) */}
                {Boolean((selectedLayer as any).shadowEnabled || (selectedLayer as any).shadowBlur) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#242424', padding: 8, borderRadius: 6, border: '1px solid #333333' }}>
                    {/* Top Row: Name + Visibility + Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: '#0D99FF' }}>
                          {(selectedLayer as any).shadowType === 'inner-shadow'
                            ? '❐'
                            : (selectedLayer as any).shadowType === 'layer-blur'
                            ? '▦'
                            : '⧉'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#E0E0E0', textTransform: 'capitalize' }}>
                          {((selectedLayer as any).shadowType || 'drop-shadow').replace('-', ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => handleUpdateLayer(selectedLayer.id, { shadowEnabled: (selectedLayer as any).shadowEnabled === false ? true : false }, true)}
                          style={{ background: 'transparent', border: 'none', color: (selectedLayer as any).shadowEnabled !== false ? '#CCCCCC' : '#666666', cursor: 'pointer', padding: 2, display: 'flex' }}
                          title="Toggle effect visibility"
                        >
                          {(selectedLayer as any).shadowEnabled !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          onClick={() => handleUpdateLayer(selectedLayer.id, { shadowEnabled: false, shadowBlur: 0 }, true)}
                          style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer', padding: 2, display: 'flex' }}
                          title="Remove effect"
                        >
                          <Minus size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Effect Color & Opacity (for shadow types) */}
                    {(selectedLayer as any).shadowType !== 'layer-blur' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ position: 'relative', width: 22, height: 22, borderRadius: 4, overflow: 'hidden', border: '1px solid #444', flexShrink: 0 }}>
                          <input
                            type="color"
                            value={(selectedLayer as any).shadowColor || '#000000'}
                            onChange={(e) => handleUpdateLayer(selectedLayer.id, { shadowColor: e.target.value, shadowEnabled: true }, true)}
                            style={{ position: 'absolute', top: -4, left: -4, width: 32, height: 32, cursor: 'pointer', border: 'none', padding: 0 }}
                          />
                        </div>

                        <div style={{ flex: 1, background: '#1E1E1E', border: '1px solid #3A3A3A', borderRadius: 4, padding: '2px 6px', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={((selectedLayer as any).shadowColor || '#000000').replace('#', '').toUpperCase()}
                            onChange={(e) => {
                              const hex = `#${e.target.value.trim()}`;
                              handleUpdateLayer(selectedLayer.id, { shadowColor: hex, shadowEnabled: true }, true);
                            }}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 11, fontFamily: 'monospace', outline: 'none' }}
                          />
                        </div>

                        <div style={{ width: 48, background: '#1E1E1E', border: '1px solid #3A3A3A', borderRadius: 4, padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={Math.round(((selectedLayer as any).shadowOpacity ?? 0.35) * 100)}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(100, Number(e.target.value)));
                              handleUpdateLayer(selectedLayer.id, { shadowOpacity: Number((val / 100).toFixed(2)), shadowEnabled: true }, true);
                            }}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 11, textAlign: 'right', outline: 'none' }}
                          />
                          <span style={{ fontSize: 10, color: '#777', marginLeft: 1 }}>%</span>
                        </div>
                      </div>
                    )}

                    {/* Offsets & Blur Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: (selectedLayer as any).shadowType === 'layer-blur' ? '1fr' : '1fr 1fr 1fr', gap: 6 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 9, color: '#888888' }}>Blur</span>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#1E1E1E', border: '1px solid #3A3A3A', borderRadius: 4, padding: '2px 4px' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={(selectedLayer as any).shadowBlur ?? 8}
                            onChange={(e) => handleUpdateLayer(selectedLayer.id, { shadowBlur: Math.max(0, Number(e.target.value)), shadowEnabled: true }, true)}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 11, outline: 'none' }}
                          />
                          <span style={{ fontSize: 9, color: '#666' }}>px</span>
                        </div>
                      </div>

                      {(selectedLayer as any).shadowType !== 'layer-blur' && (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 9, color: '#888888' }}>X</span>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#1E1E1E', border: '1px solid #3A3A3A', borderRadius: 4, padding: '2px 4px' }}>
                              <input
                                type="number"
                                min={-100}
                                max={100}
                                value={(selectedLayer as any).shadowOffsetX ?? 0}
                                onChange={(e) => handleUpdateLayer(selectedLayer.id, { shadowOffsetX: Number(e.target.value), shadowEnabled: true }, true)}
                                style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 11, outline: 'none' }}
                              />
                              <span style={{ fontSize: 9, color: '#666' }}>px</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 9, color: '#888888' }}>Y</span>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#1E1E1E', border: '1px solid #3A3A3A', borderRadius: 4, padding: '2px 4px' }}>
                              <input
                                type="number"
                                min={-100}
                                max={100}
                                value={(selectedLayer as any).shadowOffsetY ?? 4}
                                onChange={(e) => handleUpdateLayer(selectedLayer.id, { shadowOffsetY: Number(e.target.value), shadowEnabled: true }, true)}
                                style={{ width: '100%', background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: 11, outline: 'none' }}
                              />
                              <span style={{ fontSize: 9, color: '#666' }}>px</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ROTATION & POSITION */}
              <div
                style={{
                  borderTop: '1px solid #2B2B2B',
                  paddingTop: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                {/* Rotation (Editable Number Input + Slider) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#AAAAAA' }}>Rotation</span>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#2B2B2B', border: '1px solid #3E3E3E', borderRadius: 4, padding: '1px 6px' }}>
                      <input
                        type="number"
                        min={-360}
                        max={360}
                        value={selectedLayer.rotation || 0}
                        onChange={(e) =>
                          handleUpdateLayer(selectedLayer.id, { rotation: Number(e.target.value) }, true)
                        }
                        style={{
                          width: 44,
                          background: 'transparent',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: 'right',
                          outline: 'none'
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#888888', marginLeft: 2 }}>°</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selectedLayer.rotation || 0}
                    onChange={(e) =>
                      handleUpdateLayer(selectedLayer.id, { rotation: Number(e.target.value) }, true)
                    }
                  />
                </div>

                {/* Layer Stacking Order */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <button
                    onClick={() => handleMoveLayer(selectedLayer.id, 'up')}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Bring Forward
                  </button>
                  <button
                    onClick={() => handleMoveLayer(selectedLayer.id, 'down')}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      background: '#2B2B2B',
                      border: '1px solid #3E3E3E',
                      color: '#CCCCCC',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Send Backward
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* DEFAULT / BACKGROUND PROPERTIES (When clicking empty canvas) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0D99FF', textTransform: 'uppercase' }}>
                Canvas Properties
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, color: '#AAAAAA' }}>Background Color</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['#FFF7FA', '#0F172A', '#0A1120', '#111827', '#06090F', '#FFFFFF'].map((c) => (
                    <div
                      key={c}
                      onClick={() =>
                        setProject((prev) => ({
                          ...prev,
                          background: { ...prev.background, color: c }
                        }), true)
                      }
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: c,
                        border: project.background.color === c ? '2px solid #0D99FF' : '1px solid #444',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={project.background.color}
                    onChange={(e) =>
                      setProject((prev) => ({
                        ...prev,
                        background: { ...prev.background, color: e.target.value }
                      }), true)
                    }
                    style={{ width: 24, height: 22, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                <label style={{ fontSize: 11, color: '#AAAAAA' }}>Background Graphic</label>
                <button
                  onClick={() => bgFileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: '#2B2B2B',
                    border: '1px solid #3E3E3E',
                    color: '#CCCCCC',
                    padding: '8px 12px',
                    borderRadius: 5,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={13} />
                  <span>Upload BG Image</span>
                </button>

                {/* AI Generate Canvas Background (Cloudflare Flux) */}
                <GeminiBackgroundGenerator
                  targetWidth={project.width || 1920}
                  targetHeight={project.height || 1080}
                  triggerButtonText="Generate AI BG Image (Flux)"
                  onApplyImage={(generated) => {
                    setProject((prev) => ({
                      ...prev,
                      background: { ...prev.background, imageUrl: generated }
                    }), true);
                  }}
                />

                {project.background.imageUrl && (
                  <button
                    onClick={() =>
                      setProject((prev) => ({
                        ...prev,
                        background: { ...prev.background, imageUrl: undefined }
                      }), true)
                    }
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#F43F5E',
                      fontSize: 11,
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '4px 0'
                    }}
                  >
                    Remove BG Image
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input type="file" ref={bgFileInputRef} onChange={handleBgImageUpload} accept="image/*" style={{ display: 'none' }} />
      <input type="file" ref={addImageInputRef} onChange={handleFileAddImage} accept="image/*" style={{ display: 'none' }} />
      <input type="file" ref={replaceImageInputRef} onChange={handleReplaceImageFile} accept="image/*" style={{ display: 'none' }} />
      <input type="file" ref={loadProjectInputRef} onChange={handleLoadProjectFile} accept=".json" style={{ display: 'none' }} />
      <input type="file" ref={svgFileInputRef} onChange={handleImportFigmaSvgFile} accept=".svg" style={{ display: 'none' }} />

      {/* Designer Context Menu */}
      <ConfiguratorContextMenu
        isOpen={contextMenuState.isOpen}
        position={contextMenuState.position}
        targetLayer={contextMenuTargetLayer}
        selectedCount={selectedLayerIds.length}
        onClose={() => setContextMenuState((prev) => ({ ...prev, isOpen: false }))}
        onBringForward={() => handleMoveLayer(contextMenuState.targetLayerId || selectedLayerIds[0], 'up')}
        onSendBackward={() => handleMoveLayer(contextMenuState.targetLayerId || selectedLayerIds[0], 'down')}
        onBringToFront={() => handleMoveLayer(contextMenuState.targetLayerId || selectedLayerIds[0], 'top')}
        onSendToBack={() => handleMoveLayer(contextMenuState.targetLayerId || selectedLayerIds[0], 'bottom')}
        onDuplicate={() => handleDuplicateLayer(contextMenuState.targetLayerId || selectedLayerIds[0])}
        onToggleLock={() => handleToggleLock(contextMenuState.targetLayerId || selectedLayerIds[0])}
        onDelete={() => handleDeleteSelectedLayers()}
        onFlipHorizontal={() => handleFlipLayer('horizontal', contextMenuState.targetLayerId || selectedLayerIds[0])}
        onFlipVertical={() => handleFlipLayer('vertical', contextMenuState.targetLayerId || selectedLayerIds[0])}
        onAlign={handleAlign}
        onReplacePhoto={() => replaceImageInputRef.current?.click()}
        onEditText={() => {
          const id = contextMenuState.targetLayerId || selectedLayerIds[0];
          if (id) {
            setTriggerEditTextId(id);
            setTimeout(() => setTriggerEditTextId(null), 100);
          }
        }}
        onAddText={() => handleAddText()}
        onAddShape={(type) => handleAddShape(type)}
        onChangeBackground={() => bgFileInputRef.current?.click()}
        onFitToScreen={handleFitToScreen}
        onZoomIn={() => {
          const newScale = Math.min(3, Number((stageScale * 1.15).toFixed(3)));
          setStageScale(newScale);
        }}
        onZoomOut={() => {
          const newScale = Math.max(0.15, Number((stageScale / 1.15).toFixed(3)));
          setStageScale(newScale);
        }}
        onSelectAll={() => setSelectedLayerIds(project.layers.map((l) => l.id))}
      />
    </div>
  );
};
