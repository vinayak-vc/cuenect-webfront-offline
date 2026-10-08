// Wire-contract tests (B-012). They load the REAL src/types/protocol.ts and src/services/socketService.ts (TypeScript
// transpiled in memory, nothing built) and check what is emitted against docs/PROTOCOL.md in the Unity project:
//  - an absent field means "not specified" to the stage, so a seek must not carry isPlaying / isStop / isLooping;
//  - one command is emitted exactly once when no specific stage is selected (the relay re-broadcasts a direct event);
//  - a controller without the lock emits nothing;
//  - the Custom quality tier carries its profile, the presets never do, and a bad profile cannot get out of range.
// Run: npm test   (node >= 18, no extra packages)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function load(relative, stubs = {}) {
  const source = readFileSync(path.join(root, relative), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  });
  const module = { exports: {} };
  const requireStub = (name) => {
    if (name in stubs) return stubs[name];
    throw new Error(`unexpected import ${name} from ${relative}`);
  };
  try {
    new Function('module', 'exports', 'require', outputText)(module, module.exports, requireStub);
  } catch (error) {
    // socketService builds its singleton at the bottom of the module; the class is exported before that line runs.
    if (!module.exports.StageSocketService && !Object.keys(module.exports).length) throw error;
  }
  return module.exports;
}

const protocol = load('src/types/protocol.ts');

/** A recording stand-in for the socket.io client socket. */
function fakeSocket() {
  const sent = [];
  return {
    connected: true,
    sent,
    emit(event, data) {
      sent.push({ event, data });
    },
    on() {},
    off() {},
    once() {}
  };
}

function makeService() {
  const stubs = {
    'socket.io-client': { io: () => fakeSocket() },
    './storage': { StorageService: new Proxy({}, { get: () => () => undefined }) },
    '../types/protocol': protocol
  };
  const { StageSocketService } = load('src/services/socketService.ts', stubs);
  assert.ok(StageSocketService, 'the real StageSocketService class must load');
  const service = Object.create(StageSocketService.prototype);
  service.socket = fakeSocket();
  service.hasStageControl = true;
  service.stages = [];
  service.selectedStageIds = new Set();
  service.blockedHandler = null;
  return service;
}

test('a video seek carries no playback-state keys', () => {
  const service = makeService();
  service.sendVideoControl({ seekTime: 12.5 });
  const [{ event, data }] = service.socket.sent;
  assert.equal(event, 'hologram-video-action');
  assert.equal(data.seekTime, 12.5);
  assert.equal(data.backForwardSeconds, 12.5);
  for (const key of ['isPlaying', 'isStop', 'isLooping', 'isLoop', 'isMute', 'mute', 'volume']) {
    assert.ok(!(key in data), `seek must not carry "${key}"`);
  }
});

test('a mutating command is emitted exactly once, directly, when no stage is selected', () => {
  const service = makeService();
  service.sendLoadAsset({ AssetID: 'SCU.00060', ModelPath: 'SCU.00060.glb' });
  assert.equal(service.socket.sent.length, 1);
  assert.equal(service.socket.sent[0].event, 'hologram-asset-action');
  assert.deepEqual(service.socket.sent[0].data, { AssetID: 'SCU.00060', ModelPath: 'SCU.00060.glb' });
});

test('a controller without the lock sends nothing and says why', () => {
  const service = makeService();
  service.hasStageControl = false;
  const blocked = [];
  service.blockedHandler = (name) => blocked.push(name);
  service.sendLoadAsset({ AssetID: 'x' });
  assert.equal(service.socket.sent.length, 0);
  assert.deepEqual(blocked, ['hologram-asset-action']);
});

test('read-only traffic is not blocked without the lock', () => {
  const service = makeService();
  service.hasStageControl = false;
  service.emitEvent('message', 'ReqAsset');
  assert.equal(service.socket.sent.length, 1);
});

test('preset quality tiers never carry a custom profile', () => {
  const service = makeService();
  service.sendQualityTier(protocol.QualityTier.High, { ...protocol.DEFAULT_CUSTOM_PROFILE });
  const { data } = service.socket.sent[0];
  assert.equal(data.tier, protocol.QualityTier.High);
  assert.equal(data.tierName, 'high');
  assert.ok(!('custom' in data) && !('hasCustom' in data));
});

test('the Custom tier carries its profile', () => {
  const service = makeService();
  const profile = { ...protocol.DEFAULT_CUSTOM_PROFILE, moteCount: 1250 };
  service.sendQualityTier(protocol.QualityTier.Custom, profile);
  const { event, data } = service.socket.sent[0];
  assert.equal(event, 'hologram-quality-tier-action');
  assert.equal(data.tier, protocol.QualityTier.Custom);
  assert.equal(data.tierName, 'custom');
  assert.equal(data.hasCustom, true);
  assert.equal(data.custom.moteCount, 1250);
});

test('a bad custom profile is clamped, rounded and defaulted', () => {
  const clean = protocol.sanitizeCustomProfile({
    moteCount: 99999.4,
    pointCloudCount: 10,
    pointCloudCoverage: 5,
    renderScale: 0.1,
    upscaler: 1.6,
    nebula: 'yes',
    causticFloor: false,
    unknownField: 7
  });
  assert.equal(clean.moteCount, 8000);
  assert.equal(clean.pointCloudCount, 10000);
  assert.equal(clean.pointCloudCoverage, 0.95);
  assert.equal(clean.renderScale, 0.5);
  assert.equal(clean.upscaler, 2);
  assert.equal(clean.nebula, protocol.DEFAULT_CUSTOM_PROFILE.nebula, 'a wrong type falls back to the base value');
  assert.equal(clean.causticFloor, false);
  assert.ok(!('unknownField' in clean));
  assert.deepEqual(Object.keys(clean).sort(), Object.keys(protocol.DEFAULT_CUSTOM_PROFILE).sort());
});

test('a tier report without the flag has no custom profile', () => {
  assert.equal(protocol.parseCustomProfile({ custom: { moteCount: 5 } }), null);
  assert.equal(protocol.parseCustomProfile(null), null);
  assert.equal(protocol.parseCustomProfile({ hasCustom: true, custom: { moteCount: 500 } }).moteCount, 500);
});

test('a stage diagnostics report is parsed and bad values cannot reach the screen', () => {
  const report = protocol.parseStageDiagnostics({
    fps: 59.7, frameMs: 16.7, worstFrameMs: 21, gpu: 'NVIDIA GeForce RTX 3060', graphicsApi: 'Direct3D11',
    width: 1920, height: 1080, displayMode: 'Mono2D', qualityTier: 'Medium', memoryMb: 741, uptimeSeconds: 123, version: '3.0.0'
  }, 1000);
  assert.equal(report.fps, 59.7);
  assert.equal(report.gpu, 'NVIDIA GeForce RTX 3060');
  assert.equal(report.receivedAt, 1000);

  const bad = protocol.parseStageDiagnostics({ fps: 30, frameMs: -5, worstFrameMs: NaN, gpu: 42, width: 'wide' }, 1);
  assert.equal(bad.frameMs, 0);
  assert.equal(bad.worstFrameMs, 0);
  assert.equal(bad.gpu, '');
  assert.equal(bad.width, 0);

  assert.equal(protocol.parseStageDiagnostics(null), null);
  assert.equal(protocol.parseStageDiagnostics({ frameMs: 16 }), null, 'a report without a frame rate is not a report');
});
