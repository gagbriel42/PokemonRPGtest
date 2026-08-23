import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './hgss-map.css';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const MODEL_ROOT = `${BASE}/assets/hgss/generated/maps`;

function findMapId(catalog, name) {
  const entry = Object.entries(catalog?.maps || {}).find(([, value]) => value?.name === name);
  return entry?.[0] || null;
}

function makeMat(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

function addBox(group, x, y, z, sx, sy, sz, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, y, z);
  group.add(mesh);
  return mesh;
}

function buildVisibleFallback(meta) {
  const group = new THREE.Group();
  const [w, h] = meta?.dimensions || [32, 32];
  const tile = 1;
  const ground = makeMat(0x78a968);
  const path = makeMat(0xc8b47b);
  const water = makeMat(0x6da9c5);
  const tree = makeMat(0x356b3b);
  const trunk = makeMat(0x795638);
  const roof = makeMat(0x9b4e3f);
  const wall = makeMat(0xd8c99a);
  const road = makeMat(0xbba878);

  addBox(group, 0, -0.35, 0, w, 0.5, h, ground);

  const pathWidth = Math.max(3, Math.floor(w * 0.16));
  for (let z = -h / 2 + 2; z < h / 2 - 1; z += tile) {
    addBox(group, 0, -0.04, z, pathWidth, 0.12, 0.92, path);
  }
  for (let x = -w / 2 + 1; x < w / 2; x += tile) {
    addBox(group, x, -0.02, 0, 0.92, 0.12, 4, road);
  }

  for (let i = -Math.floor(w / 2) + 2; i < Math.floor(w / 2) - 1; i += 2) {
    if (Math.abs(i) < pathWidth / 2 + 2) continue;
    addBox(group, i, -0.02, -h / 2 + 3, 1.1, 0.1, 1.1, water);
  }

  const houseXs = [-w * 0.30, w * 0.30];
  houseXs.forEach((x, i) => {
    addBox(group, x, 1.0, -h * 0.28 + i * 4, 5.5, 2.1, 4.5, wall);
    addBox(group, x, 2.5, -h * 0.28 + i * 4, 6.2, 1.2, 5.1, roof);
  });

  for (let x = -w / 2 + 1; x < w / 2; x += 3) {
    for (let z = -h / 2 + 1; z < h / 2; z += 3) {
      if (Math.abs(x) < pathWidth / 2 + 2 || Math.abs(z) < 3) continue;
      if ((Math.round(x) + Math.round(z)) % 5 !== 0) continue;
      addBox(group, x, 0.55, z, 0.35, 1.1, 0.35, trunk);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.8, 6), tree);
      crown.position.set(x, 1.55, z);
      group.add(crown);
    }
  }

  group.userData.fallback = true;
  return group;
}

export default function HGSSViewport({ name = 'Route 29', connections = [], onChange }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const playerRef = useRef(null);
  const keysRef = useRef(new Set());
  const [catalog, setCatalog] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [status, setStatus] = useState('Chargement des données HGSS…');
  const [selected, setSelected] = useState(null);
  const [modelState, setModelState] = useState('checking');

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${BASE}/assets/hgss/map-catalog.json`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${BASE}/assets/hgss/johto-matrix.json`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([c, m]) => {
      if (!alive) return;
      setCatalog(c);
      setMatrix(m);
      const entry = Object.values(c?.maps || {}).find(x => x?.name === name);
      setStatus(entry ? `Données ROM · ${entry.name}` : `Données extraites · ${name}`);
    });
    return () => { alive = false; };
  }, [name]);

  const meta = useMemo(() => {
    const id = findMapId(catalog, name);
    return id ? { id, ...catalog.maps[id] } : null;
  }, [catalog, name]);

  const width = matrix?.width || 47;
  const height = matrix?.height || 17;
  const cells = useMemo(() => {
    const map = new Map();
    for (const [x, y, id] of matrix?.nonZero || []) map.set(`${x}:${y}`, id);
    return map;
  }, [matrix]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !meta?.id) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fc0d0);
    const camera = new THREE.OrthographicCamera(-16, 16, 10, -10, 0.1, 2000);
    camera.position.set(0, 28, 24);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene.add(new THREE.HemisphereLight(0xd9f2ff, 0x496044, 2.4));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-20, 35, 15);
    scene.add(sun);

    const player = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.9, 8), makeMat(0xe53935));
    player.position.set(0, 0.5, 6);
    scene.add(player);
    playerRef.current = player;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const fallback = buildVisibleFallback(meta);
    scene.add(fallback);
    modelRef.current = fallback;
    setModelState('fallback');
    setStatus(`MAP ${meta.id} · ${name} · rendu 3D actif`);

    const loader = new GLTFLoader();
    const candidates = [
      `${MODEL_ROOT}/${meta.id}/rendered/nsbmd.glb`,
      `${MODEL_ROOT}/${meta.id}/${String(meta.model || '').replace(/\.nsbmd$/i, '.glb')}`,
      `${MODEL_ROOT}/${meta.id}/${String(meta.id)}.glb`
    ].filter(Boolean);
    let loadedReal = false;
    const tryLoad = index => {
      if (index >= candidates.length || loadedReal) return;
      loader.load(candidates[index], gltf => {
        if (loadedReal) return;
        loadedReal = true;
        scene.remove(fallback);
        const model = gltf.scene;
        model.traverse(obj => {
          if (obj.isMesh) {
            obj.frustumCulled = false;
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach(m => { if (m) m.side = THREE.DoubleSide; });
          }
        });
        model.scale.setScalar(1);
        scene.add(model);
        modelRef.current = model;
        setModelState('ready');
        setStatus(`MAP ${meta.id} · ${name} · modèle HGSS réel chargé`);
      }, undefined, () => tryLoad(index + 1));
    };
    tryLoad(0);

    const resize = () => {
      const w = canvas.clientWidth || 800;
      const h = canvas.clientHeight || 500;
      const aspect = w / h;
      const size = 18;
      camera.left = -size * aspect;
      camera.right = size * aspect;
      camera.top = size;
      camera.bottom = -size;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const onKeyDown = e => {
      const key = e.key.toLowerCase();
      if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)) {
        e.preventDefault();
        keysRef.current.add(key);
      }
    };
    const onKeyUp = e => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let raf = 0;
    const tick = () => {
      const keys = keysRef.current;
      const speed = 0.11;
      if (playerRef.current) {
        if (keys.has('arrowup') || keys.has('w')) playerRef.current.position.z -= speed;
        if (keys.has('arrowdown') || keys.has('s')) playerRef.current.position.z += speed;
        if (keys.has('arrowleft') || keys.has('a')) playerRef.current.position.x -= speed;
        if (keys.has('arrowright') || keys.has('d')) playerRef.current.position.x += speed;
        camera.position.x = playerRef.current.position.x;
        camera.position.z = playerRef.current.position.z + 24;
        camera.lookAt(playerRef.current.position.x, 0, playerRef.current.position.z);
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.dispose();
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach(m => m.dispose?.());
        }
      });
    };
  }, [meta?.id, name]);

  return (
    <section className="hgss-play">
      <div className="hgss-head"><b>{name}</b><span>{status}</span></div>
      {meta && <div className="hgss-meta"><b>MAP {meta.id}</b><span>Matrice : {meta.matrix?.join(' × ') || '—'}</span><span>Taille : {meta.dimensions?.join(' × ') || '—'}</span><span>Terrain : {meta.terrain || '—'}</span><span className={`hgss-model-status ${modelState}`}>{modelState === 'ready' ? 'MODÈLE HGSS RÉEL' : modelState === 'fallback' ? '3D HGSS · EN ATTENTE DU GLB' : 'CHARGEMENT'}</span></div>}
      <div className="hgss-canvas-wrap">
        <canvas ref={canvasRef} className="hgss-canvas" tabIndex={0} />
        <div className="hgss-controls">↑ ↓ ← → / WASD · déplacement · caméra 3D</div>
      </div>
      <div className="hgss-matrix">
        <div className="hgss-matrix-title">MATRICE HGSS · zones réelles extraites</div>
        <div className="hgss-matrix-grid" style={{ gridTemplateColumns: `repeat(${width}, minmax(18px, 1fr))` }}>
          {Array.from({ length: width * height }, (_, i) => {
            const x = i % width; const y = Math.floor(i / width); const id = cells.get(`${x}:${y}`); const active = selected?.[0] === x && selected?.[1] === y;
            return <button type="button" key={`${x}:${y}`} className={`hgss-cell ${id != null ? 'filled' : ''} ${active ? 'selected' : ''}`} onClick={() => setSelected([x, y, id])} title={id != null ? `Cellule ${x},${y} · map ${id}` : `Cellule ${x},${y}`}>{id != null ? id : ''}</button>;
          })}
        </div>
      </div>
      {selected && <div className="hgss-map-info"><b>Cellule {selected[0]} × {selected[1]}</b><span>{selected[2] != null ? ` · entrée matrice ${selected[2]}` : ' · vide'}</span></div>}
      <div className="hgss-nav">{connections.map(c => <button key={c.id} type="button" onClick={() => onChange?.(c)}>→ {c.name}</button>)}</div>
    </section>
  );
}
