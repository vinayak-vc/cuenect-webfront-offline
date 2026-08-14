// Protocol types matching ClassTemplates.cs, Constants.cs, and Signaling.cs

export enum DataType {
  Model = 0,
  Image = 1,
  Video = 2
}

export interface AssetInformation {
  AssetID: string;
  AssetName: string;
  ThumbnailImagePath: string;
  ModelPath: string;
  PlaylistName: string;
  isloaded?: boolean;
  videoDuration?: number;
  Category: DataType;
}

export interface AssetInformationS {
  assetinformation: AssetInformation[];
}

export function resolveCategory(asset?: Partial<AssetInformation>): DataType {
  if (!asset) return DataType.Model;

  const cat = asset.Category as unknown;
  if (cat === DataType.Model || cat === 0 || cat === '0' || String(cat).toLowerCase() === 'model') {
    return DataType.Model;
  }
  if (cat === DataType.Video || cat === 2 || cat === '2' || String(cat).toLowerCase() === 'video') {
    return DataType.Video;
  }
  if (cat === DataType.Image || cat === 1 || cat === '1' || String(cat).toLowerCase() === 'image') {
    return DataType.Image;
  }

  // Fallback by path / file extension
  const path = (asset.ModelPath || asset.ThumbnailImagePath || asset.AssetName || '').toLowerCase();
  if (path.endsWith('.mp4') || path.endsWith('.mov') || path.endsWith('.webm') || path.includes('.mp4')) {
    return DataType.Video;
  }
  if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.webp')) {
    return DataType.Image;
  }
  if (path.endsWith('.glb') || path.endsWith('.gltf') || path.endsWith('.obj') || path.endsWith('.fbx') || path.includes('.glb')) {
    return DataType.Model;
  }

  return DataType.Model;
}

export enum JoyStickDirection {
  Move = 'Move',
  Scale = 'Scale',
  Reset = 'Reset',
  End = 'End'
}

export interface ModelControl {
  direction?: string;
  xPos?: number;
  yPos?: number;
  zoom?: number;
  action?: string;
  isAssetClose?: string;
}

export enum MoveableAssetType {
  Rotate = 0,
  Magnifier = 1,
  Pan = 2,
  Spotlight = 3
}

export const MovableModeActionNames: Record<MoveableAssetType, string> = {
  [MoveableAssetType.Rotate]: 'rotate',
  [MoveableAssetType.Magnifier]: 'magnifier',
  [MoveableAssetType.Pan]: 'pan',
  [MoveableAssetType.Spotlight]: 'spotlight'
};

export interface MovableActionEvent {
  action: string;
}

export interface VideoControl {
  videoAction: string;
  seekTime?: number;
  isMute?: boolean;
  volume?: number;
  isLoop?: boolean;
}

export interface CameraOrthographic {
  isOrthographic: boolean;
}

export interface StereoAdjustSettings {
  ipd: number;            // Inter-pupillary distance (in meters, e.g. 0.065 = 65mm)
  zeroParallax: number;   // Zero parallax plane distance (in meters, e.g. 3.0)
  fov: number;            // Camera FOV (degrees, e.g. 60.0)
  enableToeIn: boolean;   // Inward convergence rotation
  isStereo: boolean;      // Stereoscopic SBS active vs Mono 2D
  lightBrightness: number;// Directional light intensity (e.g. 0.8)
}

export const DEFAULT_STEREO_SETTINGS: StereoAdjustSettings = {
  ipd: 0.065,
  zeroParallax: 3.0,
  fov: 60.0,
  enableToeIn: false,
  isStereo: true,
  lightBrightness: 0.8
};

export const StaticStrings = {
  AppVersion: 'AppVersion',
  Reconnect: 'Reconnect',
  LoadModel: 'LoadModel',
  FullScreen: 'FullScreen',
  ReqAsset: 'ReqAsset',
  ReqAssetSize: 'ReqAssetSize',
  SendingAsset: 'SendingAssets',
  ModelThumbnailID: 'ModelImageRequest',
  ModelImageReceving: 'ModelImageReceving',
  ModelImageRequestDone: 'ModelImageRequestDone',
  SendModelControl: 'SendModelControl',
  MovableActionEvent: 'MovableActionEvent',
  ModelControlActionKey: 'ModelControlActionKey',
  VideoControlActionKey: 'VideoControlActionKey',
  StereoscopicKey: 'StereoscopicKey',
  StereoSettingsActionKey: 'StereoSettingsActionKey',
  CameraOrthographicAction: 'CameraOrthographicActionKey',
  DeleteAsset: 'DeleteAsset'
} as const;

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type SignalingType =
  | 'connect'
  | 'login'
  | 'leave'
  | 'message'
  | 'users'
  | 'newUser'
  | 'file'
  | 'error';

export type MessengerType = 'client' | 'server';

export interface User {
  name: string;
  id: number;
  address?: string;
}

export interface WebMessage {
  type: SignalingType;
  success?: boolean;
  messengertype?: MessengerType | string;
  name?: string;
  message?: string;
  users?: User[];
  chunkIndex?: number;
  totalChunks?: number;
  dataType?: DataType;
  base64Data?: string;
}
