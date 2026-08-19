import React,{useEffect,useRef,useState}from'react';
import * as THREE from'three';
import {GLTFLoader} from'three/examples/jsm/loaders/GLTFLoader.js';
import './hgss-map.css';

const BASE=(import.meta.env.BASE_URL||'/').replace(/\/$/,'');

export default function HGSSViewport({mapId=30,name='Route 29',connections=[],onChange}){
 const ref=useRef(null),[status,setStatus]=useState('Chargement des données HGSS…'),[meta,setMeta]=useState(null),[matrix,setMatrix]=useState(null);
 useEffect(()=>{
  let alive=true;
  Promise.all([
   fetch(`${BASE}/assets/hgss/map-catalog.json`).then(r=>r.ok?r.json():null).catch(()=>null),
   fetch(`${BASE}/assets/hgss/johto-matrix.json`).then(r=>r.ok?r.json():null).catch(()=>null)
  ]).then(([catalog,m])=>{
   if(!alive)return;
   const found=catalog?.maps?.[String(mapId)]||null;
   setMeta(found);
   setMatrix(m||null);
   if(found)setStatus(`Données ROM · ${found.name} · map ${mapId} · matrice ${found.matrix?.join(', ')||'—'}`);
   else setStatus(`Données HGSS · ${name} · map ${mapId}`);
  });
  return()=>{alive=false};
 },[mapId,name]);

 useEffect(()=>{
  const host=ref.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x11151b);
  const camera=new THREE.OrthographicCamera(-256,256,192,-192,1,10000);camera.position.set(0,900,0);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);host.appendChild(renderer.domElement);
  const loader=new GLTFLoader();let model=null;
  const modelPath=meta?.model?`${BASE}/assets/hgss/generated/maps/${mapId}/rendered/${meta.model.replace(/\.nsbmd$/i,'.glb')}`:null;
  if(modelPath){loader.load(modelPath,g=>{model=g.scene;scene.add(model);setStatus(`HGSS réel · ${meta.name} · map ${mapId}`)},undefined,()=>{});}
  const grid=new THREE.GridHelper(1024,32,0x333b45,0x20262d);scene.add(grid);
  const light=new THREE.HemisphereLight(0xffffff,0x44505c,2);scene.add(light);
  const resize=()=>{camera.left=-host.clientWidth/2;camera.right=host.clientWidth/2;camera.top=host.clientHeight/2;camera.bottom=-host.clientHeight/2;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};window.addEventListener('resize',resize);resize();
  let raf=requestAnimationFrame(function tick(){renderer.render(scene,camera);raf=requestAnimationFrame(tick)});
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);renderer.dispose();if(host.contains(renderer.domElement))host.removeChild(renderer.domElement);if(model)scene.remove(model)};
 },[mapId,meta]);

 const cells=matrix?.nonZero||[];
 const maxX=matrix?.width||47,maxY=matrix?.height||17;
 const selectedCell=meta?.matrix;
 return <section className="hgss-play">
   <div className="hgss-head"><b>{name}</b><span>{status}</span></div>
   {meta&&<div className="hgss-meta"><b>MAP {mapId}</b><span>Matrice : {meta.matrix?.join(' × ')||'—'}</span><span>Taille : {meta.dimensions?.join(' × ')||'—'}</span><span>Terrain : {meta.terrain||'—'}</span></div>}
   <div className="hgss-canvas" ref={ref}/>
   {matrix&&<div className="hgss-matrix" aria-label="Matrice HGSS extraite de la ROM">
     <div className="hgss-matrix-title">MATRICE JOHTO EXTRAITE · {maxX} × {maxY}</div>
     <div className="hgss-matrix-grid" style={{gridTemplateColumns:`repeat(${maxX},1fr)`}}>
       {Array.from({length:maxX*maxY},(_,i)=>{
         const x=i%maxX,y=Math.floor(i/maxX),hit=cells.find(c=>c[0]===x&&c[1]===y),selected=selectedCell?.[0]===x&&selectedCell?.[1]===y;
         return <div key={i} className={`hgss-cell ${hit?'filled':''} ${selected?'selected':''}`} title={hit?`cellule ${x},${y} · map ${hit[2]}`:`cellule ${x},${y}`}>{hit?hit[2]:''}</div>;
       })}
     </div>
   </div>}
   <div className="hgss-nav">{connections.map(c=><button key={c.id} onClick={()=>onChange?.(c)}>{c.name}</button>)}</div>
 </section>
}
