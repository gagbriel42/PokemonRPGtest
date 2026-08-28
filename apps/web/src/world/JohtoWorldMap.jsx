import React from 'react';
import './johto-world-map.css';
import HGSSViewport from './HGSSViewport.jsx';
import { LOCATIONS } from './locations.js';

// The regional map and the playable map use the same location table.
// eventIndex is the HGSS map identifier used by the extracted Johto matrix
// for the locations represented in this application.
const BY_NAME=new Map(LOCATIONS.map(x=>[x.name,x]));

export default function JohtoWorldMap({location,onChange}){
  const current=location||BY_NAME.get('Route 29');
  const connections=(current?.connections||[]).map(name=>{
    const target=BY_NAME.get(name);
    return target?{id:target.id,name:target.name,mapId:target.eventIndex}:null;
  }).filter(Boolean);
  return (
    <section className="jwm">
      <header>
        <div>
          <b>JOHTO · CARTE SOULSILVER</b>
          <small>Carte reconstruite depuis les données HGSS extraites</small>
        </div>
      </header>
      <HGSSViewport
        name={current?.name || 'Route 29'}
        connections={connections}
        onChange={(next)=>{
          const target=BY_NAME.get(next.name);
          onChange?.(target||next);
        }}
      />
      <footer className="jwm-current">
        <b>POSITION : {current?.name || 'Johto'}</b>
      </footer>
    </section>
  );
}
