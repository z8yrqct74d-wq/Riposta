// The Riposta crest — the real 3D brand mark (fencing mask, crossed sabres and
// the RIPOSTA wordmark), rendered with three.js on an expo-gl surface and spun
// by dragging it.
//
// Deliberately hand-rolled rather than built on expo-three: the only thing that
// package would give us here is the canvas shim below, and it lags three
// releases badly. react-three-fiber would be a second reconciler for one static
// model and one gesture.
//
// The GLB has no textures and no animations, which is why this works at all on
// React Native — GLTFLoader never reaches its image-decoding path, the one part
// of three.js that has no native equivalent.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { GLView } from 'expo-gl';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const CREST = require('../../assets/brand/riposta-crest.glb');

// ── Look ─────────────────────────────────────────────────────
// The crest's brass and steel materials sit at metalness 0.4+, so they are lit
// almost entirely by the environment map — these are the knobs to turn if the
// metals read flat or blown out on a real screen.
const EXPOSURE = 1.15;
const KEY_LIGHT = { color: 0xfff2da, intensity: 2.2, at: [2.5, 3, 4] } as const;
const RIM_LIGHT = { color: 0x8fb3e0, intensity: 1.1, at: [-3, 1.5, -2.5] } as const;
const AMBIENT = { color: 0xb8c9e0, intensity: 0.25 } as const;

// ── Feel ─────────────────────────────────────────────────────
const YAW_PER_PX = 0.01;
const PITCH_PER_PX = 0.008;
const PITCH_LIMIT = 0.55; // radians — never let the crest tip past legible
const FRICTION = 0.94;
const REST_EPSILON = 1e-4;
const VELOCITY_SCALE = 0.00022; // gesture px/s → radians/frame
const ENTRANCE_YAW = -0.45; // one-time settle so it reads as an object, not a picture
const ENTRANCE_MS = 1200;
const LOAD_TIMEOUT_MS = 8000;

interface Spin {
  yaw: number;
  pitch: number;
  vYaw: number;
  vPitch: number;
  dragging: boolean;
}

interface Props {
  /** Square side, in dp. */
  size: number;
  /** True when the crest is off-screen — stops the render loop dead. */
  paused?: boolean;
  /** Shown instead of the model if GL or the load fails. */
  fallback?: React.ReactNode;
  /** Finger down. The caller uses this to stop a parent pager stealing the drag. */
  onGrab?: () => void;
  /** Finger up or gesture cancelled. */
  onRelease?: () => void;
}

/**
 * `Asset.localUri` is a bundle `file://` path on native, where `fetch` is not
 * dependable; on web it is an http URL and expo-file-system does not exist.
 */
async function loadGlbBytes(): Promise<ArrayBuffer> {
  const asset = Asset.fromModule(CREST);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;

  if (Platform.OS === 'web') return await (await fetch(uri)).arrayBuffer();

  const bytes = await new File(uri).bytes();
  // The Uint8Array may be a view into a larger buffer — GLTFLoader wants exactly
  // the GLB and nothing else.
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** three.js insists on a canvas; expo-gl hands us a bare context. */
function canvasShim(gl: ExpoWebGLRenderingContext): HTMLCanvasElement {
  return {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    clientWidth: gl.drawingBufferWidth,
    clientHeight: gl.drawingBufferHeight,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => gl,
  } as unknown as HTMLCanvasElement;
}

/** Frame the model from its own bounds, so nothing about the GLB is assumed. */
function fitCamera(camera: THREE.PerspectiveCamera, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
  const vFit = radius / Math.sin((camera.fov * Math.PI) / 360);
  // A portrait viewport runs out of width first.
  const distance = Math.max(vFit, vFit / Math.min(1, camera.aspect));
  camera.position.set(0, 0, distance * 1.12);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => material?.dispose());
  });
  scene.environment?.dispose();
  scene.clear();
}

export function RiposteCrest3D({ size, paused = false, fallback = null, onGrab, onRelease }: Props) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'failed'>('loading');

  // Everything three.js touches lives in refs: a drag must never re-render React.
  const spin = useRef<Spin>({ yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, dragging: false });
  const pivot = useRef<THREE.Group | null>(null);
  const renderFrame = useRef<(() => void) | null>(null);
  const rafId = useRef<number | null>(null);
  const teardown = useRef<(() => void) | null>(null);
  const entranceStart = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const fail = useCallback((reason: string, error?: unknown) => {
    console.warn(`[RiposteCrest3D] falling back to the flat mark: ${reason}`, error);
    setPhase('failed');
  }, []);

  // ── The loop ───────────────────────────────────────────────
  // Runs only while there is something to show for it: a finger is down, inertia
  // is still bleeding off, or the entrance is playing. Otherwise it stops
  // scheduling entirely — expo-gl leaves the last presented frame on screen, so
  // a settled crest stays visible at zero cost.
  const tick = useCallback(() => {
    rafId.current = null;
    const draw = renderFrame.current;
    const group = pivot.current;
    if (!draw || !group || pausedRef.current) return;

    const s = spin.current;

    if (entranceStart.current !== null) {
      const t = Math.min(1, (Date.now() - entranceStart.current) / ENTRANCE_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      s.yaw = ENTRANCE_YAW * (1 - eased);
      if (t >= 1) entranceStart.current = null;
    } else if (!s.dragging) {
      s.yaw += s.vYaw;
      s.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, s.pitch + s.vPitch));
      s.vYaw *= FRICTION;
      s.vPitch *= FRICTION;
      if (Math.abs(s.vYaw) < REST_EPSILON) s.vYaw = 0;
      if (Math.abs(s.vPitch) < REST_EPSILON) s.vPitch = 0;
    }

    group.rotation.set(s.pitch, s.yaw, 0);
    draw();

    const busy = s.dragging || s.vYaw !== 0 || s.vPitch !== 0 || entranceStart.current !== null;
    if (busy) rafId.current = requestAnimationFrame(tick);
  }, []);

  const wake = useCallback(() => {
    if (rafId.current === null && !pausedRef.current) rafId.current = requestAnimationFrame(tick);
  }, [tick]);

  // ── GL ─────────────────────────────────────────────────────
  const onContextCreate = useCallback(
    async (gl: ExpoWebGLRenderingContext) => {
      let renderer: THREE.WebGLRenderer | undefined;
      let scene: THREE.Scene | undefined;
      const watchdog = setTimeout(() => fail('model did not load within 8s'), LOAD_TIMEOUT_MS);

      try {
        const { drawingBufferWidth: w, drawingBufferHeight: h } = gl;

        renderer = new THREE.WebGLRenderer({
          canvas: canvasShim(gl),
          context: gl,
          antialias: true,
          alpha: true,
        });
        renderer.setSize(w, h, false);
        renderer.setPixelRatio(1); // the drawing buffer is already in device pixels
        renderer.setClearColor(0x000000, 0); // transparent — the panel gradient shows through
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = EXPOSURE;

        scene = new THREE.Scene();

        // Metals with no environment map render as near-black. Generating the
        // environment procedurally keeps it to a one-off GPU cost and ships no
        // extra asset.
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        pmrem.dispose();

        const key = new THREE.DirectionalLight(KEY_LIGHT.color, KEY_LIGHT.intensity);
        key.position.set(...KEY_LIGHT.at);
        const rim = new THREE.DirectionalLight(RIM_LIGHT.color, RIM_LIGHT.intensity);
        rim.position.set(...RIM_LIGHT.at);
        scene.add(key, rim, new THREE.AmbientLight(AMBIENT.color, AMBIENT.intensity));

        // A long-ish lens keeps the wordmark from keystoning.
        const camera = new THREE.PerspectiveCamera(35, w / h, 0.01, 100);

        const buffer = await loadGlbBytes();
        const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
          new GLTFLoader().parse(buffer, '', resolve, reject);
        });

        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        model.position.sub(bounds.getCenter(new THREE.Vector3()));

        const group = new THREE.Group(); // rotate this, never the model itself
        group.add(model);
        scene.add(group);
        fitCamera(camera, group);

        const activeScene = scene;
        const activeRenderer = renderer;
        pivot.current = group;
        renderFrame.current = () => {
          activeRenderer.render(activeScene, camera);
          gl.endFrameEXP();
        };
        teardown.current = () => {
          disposeScene(activeScene);
          activeRenderer.dispose();
        };

        clearTimeout(watchdog);
        setPhase('ready');
        entranceStart.current = Date.now();
        wake();
      } catch (error) {
        clearTimeout(watchdog);
        if (scene) disposeScene(scene);
        renderer?.dispose();
        fail('could not initialise the GL scene', error);
      }
    },
    [fail, wake]
  );

  // ── Gesture ────────────────────────────────────────────────
  // The crest sits inside a horizontally-paging PagerView, which is a native
  // scroll container and wins the drag by default. onGrab fires on finger-down
  // (before activation) so the caller can suspend paging for the whole touch —
  // racing the two recognisers instead loses the first several pixels of every
  // drag and feels broken.
  const grab = useCallback(() => {
    spin.current.dragging = true;
    spin.current.vYaw = 0;
    spin.current.vPitch = 0;
    entranceStart.current = null; // a touch overrides the intro
    onGrab?.();
    wake();
  }, [onGrab, wake]);

  const drag = useCallback(
    (dx: number, dy: number) => {
      const s = spin.current;
      s.yaw += dx * YAW_PER_PX;
      s.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, s.pitch + dy * PITCH_PER_PX));
      wake();
    },
    [wake]
  );

  const release = useCallback(
    (vx: number, vy: number) => {
      const s = spin.current;
      s.dragging = false;
      s.vYaw = vx * VELOCITY_SCALE;
      s.vPitch = vy * VELOCITY_SCALE;
      onRelease?.();
      wake();
    },
    [onRelease, wake]
  );

  // runOnJS(true) rather than worklets: the render loop, the scene graph and the
  // spin state all live on the JS thread, so hopping to the UI thread would only
  // add an async round-trip back for every single frame of the drag.
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-6, 6])
        .activeOffsetY([-6, 6])
        .onBegin(grab)
        .onChange((e) => drag(e.changeX, e.changeY))
        .onFinalize((e) => release(e.velocityX ?? 0, e.velocityY ?? 0)),
    [grab, drag, release]
  );

  // Pausing (the panel scrolled away) parks the loop; unpausing resumes it.
  useEffect(() => {
    if (paused) {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    } else if (phase === 'ready') {
      wake();
    }
  }, [paused, phase, wake]);

  useEffect(
    () => () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      rafId.current = null;
      renderFrame.current = null;
      pivot.current = null;
      teardown.current?.();
      teardown.current = null;
    },
    []
  );

  if (phase === 'failed') return <>{fallback}</>;

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: size, height: size }}>
        <GLView style={{ flex: 1 }} msaaSamples={4} onContextCreate={onContextCreate} />
        {phase === 'loading' && (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator color="rgba(255,255,255,0.55)" />
          </View>
        )}
      </View>
    </GestureDetector>
  );
}
