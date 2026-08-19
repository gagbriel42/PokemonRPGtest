import React,{useEffect,useMemo,useRef,useState}from'react';
import * as THREE from'three';
import {GLTFLoader} from'three/examples/jsm/loaders/GLTFLoader.js';

const TILE=32,COLS=24,ROWS=18;

export default function HGSSViewport({mapId=30,name='Route 29',connections=[],onChange}){
 const ref=useRef(null),[status,setStatus]=useState('Chargement de la carte…'),[zoom,setZoom]=useState(1),[offset,setOffset]=useState({x:0,y:0});
 const seed=Number(mapId)||30;
 const tiles=useMemo(()=>Array.from({length:COLS*ROWS},(_,i)=>{
   const x=((seed*17+i*7)%8)*32;
   const y=((seed*31+i*13)%65)*32;
   return {x,y};
 }),[seed]);

 useEffect(()=>{
  const host=ref.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x718e68);
  const camera=new THREE.OrthographicCamera(-256,256,192,-192,1,10000);camera.position.set(0,900,0);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));host.appendChild(renderer.domElement);
  const loader=new GLTFLoader();let model=null;
  const base=import.meta.env.BASE_URL||'/';
  const url=`${base}assets/hgss/generated/maps/${seed}/rendered/nsbmd.glb`;
  loader.load(url,g=>{model=g.scene;scene.add(model);setStatus(`HGSS réel · ${name} · map ${seed}`)},undefined,()=>setStatus(`Aperçu carte actif · ${name} · map ${seed}`));
  const light=new THREE.HemisphereLight(0xffffff,0x44505c,2);scene.add(light);
  const resize=()=>{const w=host.clientWidth||640,h=host.clientHeight||480;camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();renderer.setSize(w,h)};
  resize();window.addEventListener('resize',resize);
  let raf=requestAnimationFrame(function tick(){renderer.render(scene,camera);raf=requestAnimationFrame(tick)});
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);renderer.dispose();if(host.contains(renderer.domElement))host.removeChild(renderer.domElement);if(model)scene.remove(model)};
 },[seed,name]);

 const move=(dx,dy)=>setOffset(o=>({x:o.x+dx,y:o.y+dy}));
 return <section className="hgss-play">
   <div className="hgss-head"><b>{name}</b><span>{status}</span></div>
   <div className="hgss-toolbar"><button onClick={()=>setZoom(z=>Math.max(.75,z-.25))}>−</button><b>{Math.round(zoom*100)}%</b><button onClick={()=>setZoom(z=>Math.min(2,z+.25))}>+</button><button onClick={()=>{setZoom(1);setOffset({x:0,y:0})}}>CENTRER</button></div>
   <div className="hgss-canvas" ref={ref} style={{transform:`translate(${offset.x}px,${offset.y}px) scale(${zoom})`}}/>
   <div className="hgss-fallback" aria-label="Aperçu de la carte HGSS">{tiles.map((t,i)=><i key={i} style={{backgroundImage:`url(${(import.meta.env.BASE_URL||'/')}assets/titleset1.png)`,backgroundPosition:`-${t.x}px -${t.y}px`}}/>)}<strong>{name}</strong></div>
   <div className="hgss-controls"><button onClick={()=>move(0,-64)}>▲</button><button onClick={()=>move(-64,0)}>◀</button><button onClick={()=>{setOffset({x:0,y:0});setZoom(1)}}>●</button><button onClick={()=>move(64,0)}>▶</button><button onClick={()=>move(0,64)}>▼</button></div>
   <div className="hgss-nav">{connections.map(c=><button key={c.id} onClick={()=>onChange?.(c)}>{c.name}</button>)}</div>
 </section>
}
