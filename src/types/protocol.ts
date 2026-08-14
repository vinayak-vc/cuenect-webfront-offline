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
  Pan = 1,
  Spotlight = 2,
  Magnifier = 3
}

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
  CameraOrthographicAction: 'CameraOrthographicActionKey',
  DeleteAsset: 'DeleteAsset'
} as const;

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
