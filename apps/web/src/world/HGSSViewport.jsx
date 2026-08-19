import React,{useEffect,useRef,useState}from'react';
import * as THREE from'three';
import {GLTFLoader} from'three/examples/jsm/loaders/GLTFLoader.js';

export default function HGSSViewport({mapId=30,name='Route 29',connections=[],onChange}){
 const ref=useRef(null),[status,setStatus]=useState('Chargement des données HGSS…');
 useEffect(()=>{
  const host=ref.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x11151b);
  const camera=new THREE.OrthographicCamera(-256,256,192,-192,1,10000);camera.position.set(0,900,0);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(host.clientWidth,host.clientHeight);host.appendChild(renderer.domElement);
  const loader=new GLTFLoader();let model=null;
  const base=import.meta.env.BASE_URL||'/';
  loader.load(`${base}assets/hgss/generated/maps/${mapId}/rendered/nsbmd.glb`,g=>{model=g.scene;model.rotation.x=0;scene.add(model);setStatus(`HGSS réel · ${name} · map ${mapId}`)},undefined,()=>setStatus(`Données HGSS extraites · ${name} · map ${mapId} — modèle GLB non généré`));
  const grid=new THREE.GridHelper(1024,32,0x333b45,0x20262d);grid.rotation.x=0;scene.add(grid);
  const light=new THREE.HemisphereLight(0xffffff,0x44505c,2);scene.add(light);
  const resize=()=>{camera.left=-host.clientWidth/2;camera.right=host.clientWidth/2;camera.top=host.clientHeight/2;camera.bottom=-host.clientHeight/2;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};window.addEventListener('resize',resize);resize();
  let raf=requestAnimationFrame(function tick(){renderer.render(scene,camera);raf=requestAnimationFrame(tick)});
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);renderer.dispose();host.removeChild(renderer.domElement);if(model)scene.remove(model)};
 },[mapId,name]);
 return <section className="hgss-play"><div className="hgss-head"><b>{name}</b><span>{status}</span></div><div className="hgss-canvas" ref={ref}/><div className="hgss-nav">{connections.map(c=><button key={c.id} onClick={()=>onChange?.(c)}>{c.name}</button>)}</div></section>
}
