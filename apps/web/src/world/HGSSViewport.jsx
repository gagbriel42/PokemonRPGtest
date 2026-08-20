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
      setStatus(entry
        ? `Données ROM · ${entry.name} · matrice ${entry.matrix?.join(' × ') || '—'}`
        : `Données extraites · ${name}`);
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
    scene.background = new THREE.Color(0x78a06b);
    const camera = new THREE.OrthographicCamera(-16, 16, 10, -10, 0.1, 2000);
    camera.position.set(0, 40, 0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const ambient = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambient);

    const player = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 16),
      new THREE.MeshBasicMaterial({ color: 0xe53935, depthTest: false })
    );
    player.rotation.x = -Math.PI / 2;
    player.position.set(0, 0.35, 0);
    player.renderOrder = 50;
    scene.add(player);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    playerRef.current = player;

    const loader = new GLTFLoader();
    const url = `${MODEL_ROOT}/${meta.id}/rendered/nsbmd.glb`;
    setModelState('loading');
    loader.load(url, gltf => {
      const model = gltf.scene;
      model.traverse(obj => {
        if (obj.isMesh) {
          obj.frustumCulled = false;
          if (obj.material) obj.material.side = THREE.DoubleSide;
        }
      });
      model.rotation.x = -Math.PI / 2;
      model.position.set(0, 0, 0);
      scene.add(model);
      modelRef.current = model;
      setModelState('ready');
      setStatus(`MAP ${meta.id} · ${name} · modèle HGSS chargé`);
    }, undefined, () => {
      setModelState('missing');
      setStatus(`MAP ${meta.id} · ${name} · modèle non généré localement`);
    });

    const resize = () => {
      const w = canvas.clientWidth || 800;
      const h = canvas.clientHeight || 500;
      const aspect = w / h;
      const size = 22;
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
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key.toLowerCase());
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
        camera.position.z = playerRef.current.position.z;
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
      if (modelRef.current) scene.remove(modelRef.current);
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
      <div className="hgss-head">
        <b>{name}</b>
        <span>{status}</span>
      </div>

      {meta && (
        <div className="hgss-meta">
          <b>MAP {meta.id}</b>
          <span>Matrice : {meta.matrix?.join(' × ') || '—'}</span>
          <span>Taille : {meta.dimensions?.join(' × ') || '—'}</span>
          <span>Terrain : {meta.terrain || '—'}</span>
          <span className={`hgss-model-status ${modelState}`}>{modelState === 'ready' ? 'MODÈLE HGSS' : modelState === 'missing' ? 'MODÈLE À GÉNÉRER' : 'CHARGEMENT'}</span>
        </div>
      )}

      <div className="hgss-canvas-wrap">
        <canvas ref={canvasRef} className="hgss-canvas" tabIndex={0} />
        <div className="hgss-controls">↑ ↓ ← → / WASD · caméra centrée sur le joueur</div>
        {modelState === 'missing' && (
          <div className="hgss-model-missing">
            <b>DONNÉES HGSS PRÊTES</b>
            <span>Le fichier GLB de cette map doit être généré depuis NSBMD avant affichage du terrain réel.</span>
          </div>
        )}
      </div>

      <div className="hgss-matrix">
        <div className="hgss-matrix-title">MATRICE HGSS · aperçu des zones réelles</div>
        <div className="hgss-matrix-grid" style={{ gridTemplateColumns: `repeat(${width}, minmax(18px, 1fr))` }}>
          {Array.from({ length: width * height }, (_, i) => {
            const x = i % width;
            const y = Math.floor(i / width);
            const id = cells.get(`${x}:${y}`);
            const active = selected?.[0] === x && selected?.[1] === y;
            return (
              <button type="button" key={`${x}:${y}`} className={`hgss-cell ${id != null ? 'filled' : ''} ${active ? 'selected' : ''}`} onClick={() => setSelected([x, y, id])} title={id != null ? `Cellule ${x},${y} · map ${id}` : `Cellule ${x},${y}`}>
                {id != null ? id : ''}
              </button>
            );
          })}
        </div>
      </div>

      {selected && <div className="hgss-map-info"><b>Cellule {selected[0]} × {selected[1]}</b><span>{selected[2] != null ? ` · entrée matrice ${selected[2]}` : ' · vide'}</span></div>}

      <div className="hgss-nav">
        {connections.map(c => <button key={c.id} type="button" onClick={() => onChange?.(c)}>→ {c.name}</button>)}
      </div>
    </section>
  );
}
