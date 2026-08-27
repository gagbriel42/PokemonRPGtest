import React,{useEffect,useRef,useState}from'react';
import'./hgss-map.css';
import*as THREE from'three';
import{GLTFLoader}from'three/examples/jsm/loaders/GLTFLoader.js';

const BASE=(import.meta.env.BASE_URL||'/').replace(/\/$/,'');
const CELL=100;
const GRID_W=47;
const GRID_H=17;

function mapIdFromName(name){
 const m=String(name||'').match(/(?:Route |Town|City|Road|Rage|Silver|Cave)?/);
 // In the HGSS location table, eventIndex is the field-map id for the Johto overworld entries.
 const known={
  'Route 29':30,'New Bark Town':57
 };
 return known[name]??null;
}

function findCell(matrix,id){
 const hit=(matrix?.nonZero||[]).find(([x,y,map])=>Number(map)===Number(id));
 return hit?{x:Number(hit[0]),y:Number(hit[1]),id:Number(hit[2])}:null;
}

function disposeObject(root){
 root.traverse(o=>{
  if(o.geometry)o.geometry.dispose();
  if(o.material){
   const mats=Array.isArray(o.material)?o.material:[o.material];
   mats.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose()});m.dispose()});
  }
 });
}

export default function HGSSViewport({name='Route 29',connections=[],onChange}){
 const host=useRef(null),sceneRef=useRef(null),cameraRef=useRef(null),rendererRef=useRef(null),worldRef=useRef(null),frameRef=useRef(null),matrixRef=useRef(null),mapObjectsRef=useRef(new Map());
 const[status,setStatus]=useState('Chargement des rendus HGSS…');
 const[loaded,setLoaded]=useState(0);
 const[zoom,setZoom]=useState(.62);
 const[player,setPlayer]=useState({mapId:30,x:16,y:16});
 const[follow,setFollow]=useState(false);
 const[blocked,setBlocked]=useState(null);
 const[permissions,setPermissions]=useState({});
 const drag=useRef(null);

 useEffect(()=>{
  let dead=false;
  Promise.all([
   fetch(`${BASE}/assets/hgss/johto-matrix.json`).then(r=>r.json()),
  ]).then(([matrix])=>{
   if(dead)return;
   matrixRef.current=matrix;
   const id=mapIdFromName(name);
   const cell=findCell(matrix,id)||{x:matrix.nonZero?.[0]?.[0]||0,y:matrix.nonZero?.[0]?.[1]||0,id:matrix.nonZero?.[0]?.[2]};
   setPlayer(p=>({...p,mapId:cell.id,x:16,y:16}));
  }).catch(()=>setStatus('Impossible de charger la matrice HGSS.'));
  return()=>{dead=true};
 },[name]);

 useEffect(()=>{
  if(!host.current)return;
  const el=host.current;
  const scene=new THREE.Scene();
  scene.background=null;
  const camera=new THREE.OrthographicCamera(-900,900,520,-520,1,10000);
  camera.position.set(GRID_W*CELL/2,2200,GRID_H*CELL/2);
  camera.lookAt(GRID_W*CELL/2,0,GRID_H*CELL/2);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  el.innerHTML='';el.appendChild(renderer.domElement);
  const ambient=new THREE.HemisphereLight(0xffffff,0x6b735e,2.2);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(700,1800,900);scene.add(sun);
  const world=new THREE.Group();scene.add(world);
  sceneRef.current=scene;cameraRef.current=camera;rendererRef.current=renderer;worldRef.current=world;
  const resize=()=>{const w=el.clientWidth||900,h=el.clientHeight||520;renderer.setSize(w,h,false);const aspect=w/h;const half=700/zoom;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix()};
  const wheel=e=>{e.preventDefault();setZoom(z=>Math.max(.22,Math.min(2.2,+(z+(e.deltaY<0?.08:-.08)).toFixed(2))))};
  const down=e=>{drag.current={x:e.clientX,y:e.clientY,cx:camera.position.x,cz:camera.position.z}};
  const move=e=>{if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;const scale=1/zoom;camera.position.x=drag.current.cx-dx*scale*1.7;camera.position.z=drag.current.cz-dy*scale*1.7;camera.updateProjectionMatrix()};
  const up=()=>{drag.current=null};
  el.addEventListener('wheel',wheel,{passive:false});el.addEventListener('pointerdown',down);window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);window.addEventListener('resize',resize);resize();
  const animate=()=>{frameRef.current=requestAnimationFrame(animate);renderer.render(scene,camera)};animate();
  return()=>{cancelAnimationFrame(frameRef.current);el.removeEventListener('wheel',wheel);el.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('resize',resize);mapObjectsRef.current.forEach(disposeObject);mapObjectsRef.current.clear();renderer.dispose();el.innerHTML=''};
 },[]);

 useEffect(()=>{
  const renderer=rendererRef.current,camera=cameraRef.current,el=host.current;
  if(!renderer||!camera||!el)return;
  const w=el.clientWidth||900,h=el.clientHeight||520,aspect=w/h,half=700/zoom;
  camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
 },[zoom]);

 useEffect(()=>{
  const matrix=matrixRef.current,world=worldRef.current;if(!matrix||!world)return;
  const ids=[...new Set((matrix.nonZero||[]).map(r=>Number(r[2])))].filter(Number.isFinite);
  const loader=new GLTFLoader();
  let cancelled=false;
  let count=0;
  setStatus(`Rendus HGSS : 0 / ${ids.length}`);
  ids.forEach(id=>{
   if(mapObjectsRef.current.has(id)){count++;return}
   const url=`${BASE}/assets/hgss/generated/maps/${id}/rendered/nsbmd.glb`;
   loader.load(url,gltf=>{
    if(cancelled)return;
    const root=gltf.scene;
    const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    const horizontal=Math.max(size.x,size.z,1);
    const scale=(CELL*.96)/horizontal;
    root.scale.setScalar(scale);
    root.position.x-=center.x*scale;
    root.position.z-=center.z*scale;
    root.position.y-=box.min.y*scale;
    const cells=(matrix.nonZero||[]).filter(r=>Number(r[2])===id);
    // The same HGSS field map can be referenced by several matrix cells; render each occurrence.
    cells.forEach(([gx,gy])=>{
      const instance=root.clone(true);
      instance.position.x+=Number(gx)*CELL+CELL/2;
      instance.position.z+=Number(gy)*CELL+CELL/2;
      world.add(instance);
      mapObjectsRef.current.set(`${id}:${gx}:${gy}`,instance);
    });
    count++;setLoaded(count);setStatus(`Rendus HGSS : ${count} / ${ids.length}`);
    if(count===ids.length)setStatus('Carte Johto HGSS assemblée depuis les maps de la ROM.');
   },undefined,()=>{count++;setLoaded(count);setStatus(`Rendus HGSS : ${count} / ${ids.length} · certains rendus sont absents`)});
  });
  return()=>{cancelled=true};
 },[matrixRef.current]);

 useEffect(()=>{
  const id=player.mapId;if(!id)return;
  let dead=false;
  if(permissions[id])return;
  fetch(`${BASE}/assets/hgss/generated/maps/${id}/permissions.json`).then(r=>r.ok?r.json():null).then(p=>{if(!dead&&p)setPermissions(x=>({...x,[id]:p}))}).catch(()=>{});
  return()=>{dead=true};
 },[player.mapId]);

 useEffect(()=>{
  if(!follow)return;
  const camera=cameraRef.current;if(!camera)return;
  const gx=(matrixRef.current?.nonZero||[]).find(r=>Number(r[2])===Number(player.mapId));
  const cell=gx?{x:Number(gx[0]),y:Number(gx[1])}:findCell(matrixRef.current,player.mapId);
  if(cell){camera.position.x=cell.x*CELL+(player.x/32)*CELL;camera.position.z=cell.y*CELL+(player.y/32)*CELL;camera.updateProjectionMatrix()}
 },[player,follow]);

 const isBlocked=(mapId,x,y)=>{
  const p=permissions[mapId];if(!p)return false;
  const c=p.cells?.find(v=>v.x===x&&v.y===y);return !!c?.blocked;
 };
 const move=dir=>{
  const dx=dir==='left'?-1:dir==='right'?1:0,dy=dir==='up'?-1:dir==='down'?1:0;
  setPlayer(p=>{
   let x=p.x+dx,y=p.y+dy,mapId=p.mapId;
   if(x>=0&&x<32&&y>=0&&y<32){if(isBlocked(mapId,x,y)){setBlocked('Case bloquée par les collisions HGSS');return p}setBlocked(null);return {...p,x,y}}
   const m=matrixRef.current;if(!m)return p;
   const cell=findCell(m,mapId);if(!cell)return p;
   const nx=cell.x+(x<0?-1:x>=32?1:0),ny=cell.y+(y<0?-1:y>=32?1:0);
   const target=(m.nonZero||[]).find(r=>Number(r[0])===nx&&Number(r[1])===ny);
   if(!target){setBlocked('Zone inaccessible : aucun rendu HGSS à cet endroit');return p}
   const tx=x<0?31:x>=32?0:x,ty=y<0?31:y>=32?0:y,tId=Number(target[2]);
   if(isBlocked(tId,tx,ty)){setBlocked('Passage bloqué par les collisions HGSS');return p}
   const next=connections.find(c=>mapIdFromName(c.name)===tId);if(next)onChange?.(next);
   setBlocked(null);return{mapId:tId,x:tx,y:ty};
  });
 };

 useEffect(()=>{const key=e=>{if(['INPUT','TEXTAREA','BUTTON'].includes(e.target?.tagName))return;const k=e.key.toLowerCase();const d=k==='arrowup'||k==='z'||k==='w'?'up':k==='arrowdown'||k==='s'?'down':k==='arrowleft'||k==='q'||k==='a'?'left':k==='arrowright'||k==='d'?'right':null;if(d){e.preventDefault();move(d)}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[permissions,connections]);

 return <section className="hgss-play"><div className="hgss-head"><div><b>{name}</b><span>OVERWORLD HGSS · maps de la ROM assemblées</span></div><div className="hgss-map-status">{status}</div></div><div className="hgss-canvas-wrap"><div className="hgss-real-map-stage"><div ref={host} className="hgss-gl-map"/><div className="hgss-map-grid-label">47 × 17 cellules de matrice · trous = zones absentes / inaccessibles</div><div className="hgss-player" style={{left:`${(((matrixRef.current?.nonZero||[]).find(r=>Number(r[2])===Number(player.mapId))?.[0]||0)+player.x/32)/GRID_W*100}%`,top:`${(((matrixRef.current?.nonZero||[]).find(r=>Number(r[2])===Number(player.mapId))?.[1]||0)+player.y/32)/GRID_H*100}%`}}><span/></div><div className="hgss-controls"><button type="button" onClick={()=>setFollow(false)}>Carte entière</button><button type="button" onClick={()=>setFollow(true)}>Suivre le joueur</button><span>↑ ↓ ← → · ZQSD/WASD</span></div><div className="hgss-map-label"><b>{name}</b><span>Map {player.mapId} · case {player.x},{player.y} · {Math.round(zoom*100)}%</span>{blocked&&<em>{blocked}</em>}</div></div></div><div className="hgss-nav">{connections.map(c=><button key={c.id} type="button" onClick={()=>onChange?.(c)}>→ {c.name}</button>)}</div></section>;
}
