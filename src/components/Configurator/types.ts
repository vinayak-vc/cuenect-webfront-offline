export interface ResolutionPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: '1080p_landscape', name: '1080p Stage Landscape', width: 1920, height: 1080, aspectRatio: '16:9' },
  { id: '4k_landscape', name: '4K Stage Landscape', width: 3840, height: 2160, aspectRatio: '16:9' },
  { id: '1080p_portrait', name: '1080p Stage Pillar', width: 1080, height: 1920, aspectRatio: '9:16' },
  { id: 'square', name: 'Square Display', width: 1080, height: 1080, aspectRatio: '1:1' },
  { id: 'custom', name: 'Custom Resolution', width: 1920, height: 1080, aspectRatio: 'Custom' }
];

export type LayerType = 'text' | 'image' | 'shape';

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  isLocked: boolean;
  isEditable?: boolean;
  editableLabel?: string;
  isTemplateField?: boolean;
  templateLabel?: string;
  enableAI?: boolean; // Default true: shows AI generation button in template customizer
  cornerRadius?: number;
  // Stroke styling (Figma style)
  stroke?: string;
  strokeWidth?: number;
  strokePosition?: 'inside' | 'center' | 'outside';
  strokeOpacity?: number;
  strokeEnabled?: boolean;
  // Shadow & Effects (Figma style)
  shadowEnabled?: boolean;
  shadowType?: 'drop-shadow' | 'inner-shadow' | 'layer-blur';
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fillType?: 'solid' | 'linear';
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  align: 'left' | 'center' | 'right';
  fontStyle: 'normal' | 'bold' | 'italic' | 'bold italic';
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  shadowColor?: string;
  shadowBlur?: number;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  width: number;
  height: number;
  borderWidth?: number;
  borderColor?: string;
  shadowColor?: string;
  shadowBlur?: number;
}

export type ShapeType = 'rectangle' | 'rounded-rect' | 'circle' | 'star' | 'heart' | 'badge' | 'ribbon';

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: ShapeType;
  width: number;
  height: number;
  fill: string;
  fillType?: 'solid' | 'linear';
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  shadowColor?: string;
  shadowBlur?: number;
}

export type ConfiguratorLayer = TextLayer | ImageLayer | ShapeLayer;

export interface BackgroundSettings {
  type: 'color' | 'image';
  color: string;
  imageUrl?: string;
  fit?: 'cover' | 'contain' | 'stretch';
  opacity?: number;
}

export interface ConfiguratorProject {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  width: number;
  height: number;
  background: BackgroundSettings;
  layers: ConfiguratorLayer[];
}
