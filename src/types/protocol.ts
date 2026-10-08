// Protocol types matching ClassTemplates.cs, Constants.cs, and Signaling.cs

export enum DataType {
  Model = 0,
  Image = 1,
  Video = 2
}

export interface MetadataDetailItem {
  label: string;
  value: string;
}

export interface ModelMetadata {
  title?: string;
  museum?: string;
  creator?: string;
  date?: string;
  collection?: string;
  place?: string;
  medium?: string;
  dimensions?: string;
  creditLine?: string;
  identifier?: string;
  taxonomy?: string;
  annotations?: string;
  description?: string;
  details?: MetadataDetailItem[];
  license?: string;
  sourceUrl?: string;
}

export interface SmithsonianExploreModel {
  smithsonianId: string;
  packageUuid: string;
  title: string;
  thumbnailUrl: string;
  modelUrl: string;
  fileSizeBytes: number;
  fileSizeMB: number;
  dracoCompressed: boolean;
  isDownloaded: boolean;
  downloadedAssetId?: string | null;
  metadata: ModelMetadata;
}

export interface ExploreDownloadProgress {
  smithsonianId: string;
  title: string;
  status: 'downloading' | 'completed' | 'error';
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  error?: string | null;
}

export interface MetadataActionPayload {
  visible: boolean;
  fullScreen?: boolean;
  assetId?: string;
  title?: string;
  metadata?: ModelMetadata | null;
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
  fileSizeBytes?: number;
  fileSizeMB?: number;
  triangleCount?: number;
  vertexCount?: number;
  meshCount?: number;
  dimensions?: { x: number; y: number; z: number } | null;
  isWebPreviewable?: boolean;
  rejectionReason?: string | null;
  smithsonianId?: string;
  metadata?: ModelMetadata | null;
}

export function cleanMetadataDescription(desc?: string | null): string {
  if (!desc) return '';
  const trimmed = desc.trim();
  if (/^3D digitized artifact from the /i.test(trimmed)) return '';
  return trimmed;
}

export function hasModelMetadata(asset?: Partial<AssetInformation> | null): boolean {
  if (!asset || !asset.metadata) return false;
  const m = asset.metadata;
  const desc = cleanMetadataDescription(m.description);
  return Boolean(
    (m.museum && m.museum.trim()) ||
    (m.creator && m.creator.trim()) ||
    (m.date && m.date.trim()) ||
    (m.collection && m.collection.trim()) ||
    (m.place && m.place.trim()) ||
    (m.medium && m.medium.trim()) ||
    (m.dimensions && m.dimensions.trim()) ||
    (m.creditLine && m.creditLine.trim()) ||
    (m.identifier && m.identifier.trim()) ||
    (m.taxonomy && m.taxonomy.trim()) ||
    (m.annotations && m.annotations.trim()) ||
    desc ||
    (Array.isArray(m.details) && m.details.length > 0)
  );
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
  videoAction?: string;
  seekTime?: number;
  backForwardSeconds?: number;
  isMute?: boolean;
  mute?: boolean;
  volume?: number;
  isLoop?: boolean;
  isPlaying?: string;
  isStop?: string;
  isLooping?: string;
}

export interface CameraOrthographic {
  isOrthographic: boolean;
}

export interface StereoAdjustSettings {
  ipd: number;            // Inter-pupillary distance (in meters, e.g. 0.065 = 65mm)
  zeroParallax: number;   // Zero parallax plane distance (in meters, e.g. 3.0)
  zeroParallaxDistance?: number;
  fov: number;            // Camera FOV (degrees, e.g. 60.0)
  fieldOfView?: number;
  enableToeIn: boolean;   // Inward convergence rotation
  isStereo: boolean;      // Stereoscopic SBS active vs Mono 2D
  lightBrightness: number;// Directional light intensity (e.g. 0.8)
  lightIntensity?: number;
}

/**
 * Stage display path. Mirrors HoloDisplayMode in
 * Scripts/HoloWall/HoloDisplayModeController.cs on the Unity side.
 */
export enum DisplayMode {
  Mono2D = 0,
  StereoSbs = 1,
  HoloDevice = 2,
  KmaxDevice = 3
}

export const DisplayModeNames: Record<DisplayMode, string> = {
  [DisplayMode.Mono2D]: '2d',
  [DisplayMode.StereoSbs]: 'sbs',
  [DisplayMode.HoloDevice]: 'holo',
  [DisplayMode.KmaxDevice]: 'kmax'
};

/**
 * Resolve a display mode from whatever the stage reports. The stage echoes both
 * the numeric mode and the wire name; either is accepted, and anything
 * unrecognised returns null so a bad payload cannot silently flip the UI.
 */
export function parseDisplayMode(payload: { mode?: unknown; modeName?: unknown } | null | undefined): DisplayMode | null {
  if (!payload) return null;

  if (typeof payload.mode === 'number' && DisplayMode[payload.mode] !== undefined) {
    return payload.mode as DisplayMode;
  }

  if (typeof payload.modeName === 'string') {
    const name = payload.modeName.trim().toLowerCase();
    if (name === 'fmax' || name === 'fmaxdevice' || name === 'kmax' || name === 'kmaxdevice') {
      return DisplayMode.KmaxDevice;
    }
    const match = (Object.keys(DisplayModeNames) as unknown as DisplayMode[])
      .find((key) => DisplayModeNames[key] === name);
    if (match !== undefined) return Number(match) as DisplayMode;
  }

  return null;
}

/** Abbreviated labels for tight surfaces (header pill, status strip). */
export const DisplayModeShortLabels: Record<DisplayMode, string> = {
  [DisplayMode.Mono2D]: '2D',
  [DisplayMode.StereoSbs]: 'SBS',
  [DisplayMode.HoloDevice]: 'HOLO',
  [DisplayMode.KmaxDevice]: 'FMAX'
};

export const DisplayModeLabels: Record<DisplayMode, string> = {
  [DisplayMode.Mono2D]: '2D',
  [DisplayMode.StereoSbs]: 'Stereoscopic (SBS)',
  [DisplayMode.HoloDevice]: 'HOLO Stereoscopic',
  [DisplayMode.KmaxDevice]: 'FMAX Stereoscopic'
};

/**
 * Payload for `hologram-display-mode-action`.
 * Unity accepts either field; `modeName` wins when both are present.
 */
export interface DisplayModePayload {
  mode: DisplayMode;
  modeName: string;
}

export const DEFAULT_DISPLAY_MODE: DisplayMode = DisplayMode.Mono2D;

/**
 * Stage environment preset. Mirrors EnvironmentPreset in
 * Scripts/StageEnvironment/StageEnvironment.cs on the Unity side.
 *
 * The numbering is part of the wire contract; do not renumber.
 */
export enum EnvironmentPreset {
  Void = 0,
  Space = 1
}

export const EnvironmentPresetNames: Record<EnvironmentPreset, string> = {
  [EnvironmentPreset.Void]: 'void',
  [EnvironmentPreset.Space]: 'space'
};

/**
 * Resolve a preset from whatever the stage reports. The stage echoes both the
 * numeric preset and the wire name; either is accepted, and anything
 * unrecognised returns null so a bad payload cannot silently flip the UI.
 *
 * Deliberately NOT `EnvironmentPreset[payload.preset] !== undefined` on its own:
 * a numeric enum in TypeScript has a reverse map, so that test passes for any
 * value that happens to be a member index and would let 2 through today and
 * break the moment a third preset is added.
 */
export function parseEnvironmentPreset(
  payload: { preset?: unknown; presetName?: unknown } | null | undefined
): EnvironmentPreset | null {
  if (!payload) return null;

  if (typeof payload.preset === 'number' && EnvironmentPresetNames[payload.preset as EnvironmentPreset] !== undefined) {
    return payload.preset as EnvironmentPreset;
  }

  if (typeof payload.presetName === 'string') {
    const name = payload.presetName.trim().toLowerCase();
    const match = (Object.keys(EnvironmentPresetNames) as unknown as EnvironmentPreset[])
      .find((key) => EnvironmentPresetNames[key] === name);
    if (match !== undefined) return Number(match) as EnvironmentPreset;
  }

  return null;
}

/** Abbreviated labels for tight surfaces (header pill, status strip). */
export const EnvironmentPresetShortLabels: Record<EnvironmentPreset, string> = {
  [EnvironmentPreset.Void]: 'Void',
  [EnvironmentPreset.Space]: 'Space'
};

export const EnvironmentPresetLabels: Record<EnvironmentPreset, string> = {
  [EnvironmentPreset.Void]: 'Void (black)',
  [EnvironmentPreset.Space]: 'Space'
};

export const EnvironmentPresetDescriptions: Record<EnvironmentPreset, string> = {
  [EnvironmentPreset.Void]: 'The object alone on black background.',
  [EnvironmentPreset.Space]: 'Drifting debris, dust and a starfield around the object.'
};

/**
 * Payload for `hologram-environment-action`.
 * Unity accepts either field; `presetName` wins when both are present.
 */
export interface EnvironmentPresetPayload {
  preset: EnvironmentPreset;
  presetName: string;
}

export const DEFAULT_ENVIRONMENT_PRESET: EnvironmentPreset = EnvironmentPreset.Space;

/**
 * Hologram stage graphics quality tier.
 * Mirrors HeavyEnvQualityTier in Scripts/HeavyEnvironment/HeavyEnvQuality.cs.
 * Persisted ordinals; do not renumber.
 */
export enum QualityTier {
  VeryLow = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Ultra = 4,
  Custom = 5
}

export const QualityTierNames: Record<QualityTier, string> = {
  [QualityTier.VeryLow]: 'verylow',
  [QualityTier.Low]: 'low',
  [QualityTier.Medium]: 'medium',
  [QualityTier.High]: 'high',
  [QualityTier.Ultra]: 'ultra',
  [QualityTier.Custom]: 'custom'
};

export const QualityTierShortLabels: Record<QualityTier, string> = {
  [QualityTier.VeryLow]: 'Very Low',
  [QualityTier.Low]: 'Low',
  [QualityTier.Medium]: 'Medium',
  [QualityTier.High]: 'High',
  [QualityTier.Ultra]: 'Ultra',
  [QualityTier.Custom]: 'Custom'
};

export const QualityTierLabels: Record<QualityTier, string> = {
  [QualityTier.VeryLow]: 'Very Low',
  [QualityTier.Low]: 'Low',
  [QualityTier.Medium]: 'Medium',
  [QualityTier.High]: 'High',
  [QualityTier.Ultra]: 'Ultra',
  [QualityTier.Custom]: 'Custom'
};

export const QualityTierDescriptions: Record<QualityTier, string> = {
  [QualityTier.VeryLow]: 'Bare stage, flat black, zero environment lighting. Fastest, byte-identical to 2D off.',
  [QualityTier.Low]: 'Nebula backdrop and caustic floor. Low-power PCs and integrated graphics.',
  [QualityTier.Medium]: 'Probe volume and reflection probe added. Baseline for budget dedicated GPUs.',
  [QualityTier.High]: 'Hero materials, motes, and point-cloud reveal on. Balanced for standard 60 fps kiosks.',
  [QualityTier.Ultra]: 'Full volumetric shafts, 6,000 motes, and HDR output. Max immersion on high-end GPUs.',
  [QualityTier.Custom]: 'Custom profile configured on the kiosk display settings.'
};

export interface QualityTierPayload {
  tier: QualityTier;
  tierName: string;
  /** True when `custom` carries a profile. The stage sends it with every tier report so the Custom panel shows live values. */
  hasCustom?: boolean;
  custom?: CustomGraphicsProfile;
}

/**
 * The graphics settings a controller may change through the Custom tier (HE-23). Field names are the stage's
 * (`CustomGraphicsPayload` in Constants.cs). Display settings - resolution, full screen, v-sync - are not here on
 * purpose: changing them from another machine can leave the kiosk without a picture.
 */
export interface CustomGraphicsProfile {
  loadEnvironment: boolean;
  probeVolume: boolean;
  reflectionProbe: boolean;
  heroMaterials: boolean;
  volumetricShafts: boolean;
  nebula: boolean;
  motes: boolean;
  moteCount: number;
  causticFloor: boolean;
  pointCloudReveal: boolean;
  pointCloudCount: number;
  pointCloudCoverage: number;
  pointCloudMaxPointSize: number;
  renderScale: number;
  upscaler: number;
  antiAliasing: number;
  shadowQuality: number;
  postProcessing: boolean;
  hdrOutput: boolean;
}

/** Ranges the stage enforces (GraphicsSettingsModel.SanitizeAndMigrate); the panel uses the same ones. */
export const CUSTOM_PROFILE_LIMITS = {
  moteCount: { min: 0, max: 8000, step: 250 },
  pointCloudCount: { min: 10000, max: 100000, step: 5000 },
  pointCloudCoverage: { min: 0.5, max: 0.95, step: 0.05 },
  pointCloudMaxPointSize: { min: 1, max: 6, step: 0.5 },
  renderScale: { min: 0.5, max: 1, step: 0.05 },
  upscaler: { min: 0, max: 2 },
  antiAliasing: { min: 0, max: 3 },
  shadowQuality: { min: 0, max: 3 }
} as const;

/** The High preset, which is where a Custom profile starts from. */
export const DEFAULT_CUSTOM_PROFILE: CustomGraphicsProfile = {
  loadEnvironment: true,
  probeVolume: true,
  reflectionProbe: true,
  heroMaterials: true,
  volumetricShafts: false,
  nebula: true,
  motes: true,
  moteCount: 3000,
  causticFloor: true,
  pointCloudReveal: true,
  pointCloudCount: 50000,
  pointCloudCoverage: 0.75,
  pointCloudMaxPointSize: 3,
  renderScale: 1,
  upscaler: 0,
  antiAliasing: 0,
  shadowQuality: 2,
  postProcessing: true,
  hdrOutput: false
};

const CUSTOM_BOOLEAN_KEYS: Array<keyof CustomGraphicsProfile> = [
  'loadEnvironment', 'probeVolume', 'reflectionProbe', 'heroMaterials', 'volumetricShafts', 'nebula',
  'motes', 'causticFloor', 'pointCloudReveal', 'postProcessing', 'hdrOutput'
];

const CUSTOM_NUMBER_KEYS = [
  'moteCount', 'pointCloudCount', 'pointCloudCoverage', 'pointCloudMaxPointSize',
  'renderScale', 'upscaler', 'antiAliasing', 'shadowQuality'
] as const;

/**
 * A complete, in-range profile from whatever was received or stored. A field that is missing or the wrong type falls
 * back to `base`, a number is clamped, and the integer fields are rounded, so a bad payload cannot put the panel (or the
 * stage) into a state it did not offer.
 */
export function sanitizeCustomProfile(
  raw: unknown,
  base: CustomGraphicsProfile = DEFAULT_CUSTOM_PROFILE
): CustomGraphicsProfile {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const result: CustomGraphicsProfile = { ...base };

  for (const key of CUSTOM_BOOLEAN_KEYS) {
    if (typeof source[key] === 'boolean') {
      (result as unknown as Record<string, unknown>)[key] = source[key];
    }
  }

  for (const key of CUSTOM_NUMBER_KEYS) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      const limit = CUSTOM_PROFILE_LIMITS[key];
      const clamped = Math.min(limit.max, Math.max(limit.min, value));
      const integer = key === 'moteCount' || key === 'pointCloudCount' || key === 'upscaler'
        || key === 'antiAliasing' || key === 'shadowQuality';
      (result as unknown as Record<string, unknown>)[key] = integer ? Math.round(clamped) : clamped;
    }
  }

  return result;
}

/** The custom profile in a quality-tier report, or null when the stage did not send one. */
export function parseCustomProfile(
  payload: { hasCustom?: unknown; custom?: unknown } | null | undefined,
  base: CustomGraphicsProfile = DEFAULT_CUSTOM_PROFILE
): CustomGraphicsProfile | null {
  if (!payload || payload.hasCustom !== true || !payload.custom) return null;
  return sanitizeCustomProfile(payload.custom, base);
}

export const DEFAULT_QUALITY_TIER: QualityTier = QualityTier.High;

/** The stage's live health, published every two seconds (B-015). Field names are the stage's `StageDiagnosticsPayload`. */
export interface StageDiagnostics {
  fps: number;
  frameMs: number;
  worstFrameMs: number;
  gpu: string;
  graphicsApi: string;
  width: number;
  height: number;
  displayMode: string;
  qualityTier: string;
  memoryMb: number;
  uptimeSeconds: number;
  version: string;
  /** Local time (ms) the report arrived, to tell a fresh report from a stale one. */
  receivedAt: number;
}

/** A diagnostics report from whatever was received, or null when it is not one. Bad numbers become 0. */
export function parseStageDiagnostics(raw: unknown, now: number = Date.now()): StageDiagnostics | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  if (typeof source.fps !== 'number' || !Number.isFinite(source.fps)) return null;

  const number = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0);
  const text = (value: unknown): string => (typeof value === 'string' ? value.slice(0, 120) : '');

  return {
    fps: number(source.fps),
    frameMs: number(source.frameMs),
    worstFrameMs: number(source.worstFrameMs),
    gpu: text(source.gpu),
    graphicsApi: text(source.graphicsApi),
    width: Math.round(number(source.width)),
    height: Math.round(number(source.height)),
    displayMode: text(source.displayMode),
    qualityTier: text(source.qualityTier),
    memoryMb: Math.round(number(source.memoryMb)),
    uptimeSeconds: Math.round(number(source.uptimeSeconds)),
    version: text(source.version),
    receivedAt: now
  };
}

/**
 * Resolve a quality tier from whatever the stage reports. The stage echoes both the
 * numeric tier and the wire name; either is accepted, and anything
 * unrecognised returns null so a bad payload cannot silently flip the UI.
 */
export function parseQualityTier(
  payload: { tier?: unknown; tierName?: unknown } | null | undefined
): QualityTier | null {
  if (!payload) return null;

  if (typeof payload.tier === 'number' && QualityTierNames[payload.tier as QualityTier] !== undefined) {
    return payload.tier as QualityTier;
  }

  if (typeof payload.tierName === 'string') {
    const name = payload.tierName.trim().toLowerCase();
    const match = (Object.keys(QualityTierNames) as unknown as QualityTier[])
      .find((key) => QualityTierNames[key].toLowerCase() === name);
    if (match !== undefined) return Number(match) as QualityTier;
  }

  return null;
}


export const DEFAULT_STEREO_SETTINGS: StereoAdjustSettings = {
  ipd: 0.065,
  zeroParallax: 3.0,
  fov: 60.0,
  enableToeIn: false,
  isStereo: true,
  lightBrightness: 0.8
};

/** One connected operator, as reported by the bridge. */
export interface ControlLockOperator {
  name: string;
  hasControl: boolean;
}

/**
 * Who is allowed to drive the stage right now.
 *
 * The bridge is the only party that sees every client, so it arbitrates and
 * pushes this state. Older bridges never send it - the client then assumes it
 * has control, so an out-of-date server can never lock an operator out.
 */
export interface ControlLockState {
  holderName: string | null;
  youHaveControl: boolean;
  locked: boolean;
  operators: ControlLockOperator[];
}

export const DEFAULT_CONTROL_LOCK: ControlLockState = {
  holderName: null,
  youHaveControl: true,
  locked: false,
  operators: []
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
  DisplayModeActionKey: 'hologram-display-mode-action',
  DefaultDisplayModeActionKey: 'hologram-default-display-mode-action',
  EnvironmentActionKey: 'hologram-environment-action',
  QualityTierActionKey: 'hologram-quality-tier-action',
  ModelTransformActionKey: 'hologram-model-transform',
  MetadataActionKey: 'hologram-metadata-action',
  ControlLockState: 'control-lock-state',
  ControlRequest: 'control-request',
  ControlRelease: 'control-release',
  DeleteAsset: 'DeleteAsset',
  StageRegister: 'stage-register',
  StageRegistered: 'stage-registered',
  StageStateUpdate: 'stage-state-update',
  StageRosterUpdate: 'stage-roster-update',
  DispatchCommand: 'dispatch-command',
  GetStagesRoster: 'get-stages-roster'
} as const;

export interface StageNode {
  stageId: string;
  displayName: string;
  group: string;
  online: boolean;
  currentModel?: string | null;
  displayMode?: string;
  lastSeen?: number;
}

export interface StageRosterPayload {
  stages: StageNode[];
}

export interface DispatchEnvelope {
  targets: string[] | string;
  targetEvent?: string;
  event?: string;
  data: any;
}

export interface ModelTransformPayload {
  yaw: number;
  pitch: number;
  roll?: number;
  scale?: number;
  minScale?: number;
  maxScale?: number;
  posX?: number;
  posY?: number;
  posZ?: number;
}

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
