import React from 'react';
import './johto-world-map.css';
import HGSSViewport from './HGSSViewport.jsx';

/**
 * The regional screen must never use a downloaded/fan-made Johto image.
 * It deliberately reuses the exact same ROM-derived HGSS viewport as the
 * playable overworld, so the visual map and the collision/navigation map
 * cannot drift apart.
 */
export default function JohtoWorldMap({location,onChange}){
  return (
    <section className="jwm">
      <header>
        <div>
          <b>JOHTO · CARTE SOULSILVER</b>
          <small>Carte reconstruite exclusivement depuis les données de la ROM HGSS</small>
        </div>
      </header>
      <HGSSViewport
        name={location?.name || 'Route 29'}
        connections={[]}
        onChange={onChange}
      />
      <footer className="jwm-current">
        <b>POSITION : {location?.name || 'Johto'}</b>
      </footer>
    </section>
  );
}
