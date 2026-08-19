import React, { useEffect, useMemo, useState } from 'react';
import './hgss-map.css';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export default function HGSSViewport({ name = 'Route 29', connections = [], onChange }) {
  const [catalog, setCatalog] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [status, setStatus] = useState('Chargement des données HGSS…');
  const [selected, setSelected] = useState(null);

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
        : `Données extraites · ${name} · correspondance graphique à compléter`);
    });
    return () => { alive = false; };
  }, [name]);

  const meta = useMemo(
    () => Object.values(catalog?.maps || {}).find(x => x?.name === name) || null,
    [catalog, name]
  );

  const width = matrix?.width || 47;
  const height = matrix?.height || 17;
  const cells = useMemo(() => {
    const map = new Map();
    for (const [x, y, id] of matrix?.nonZero || []) map.set(`${x}:${y}`, id);
    return map;
  }, [matrix]);

  return (
    <section className="hgss-play">
      <div className="hgss-head">
        <b>{name}</b>
        <span>{status}</span>
      </div>

      {meta && (
        <div className="hgss-meta">
          <b>MAP {Object.entries(catalog.maps).find(([, v]) => v === meta)?.[0] || '—'}</b>
          <span>Matrice : {meta.matrix?.join(' × ') || '—'}</span>
          <span>Taille : {meta.dimensions?.join(' × ') || '—'}</span>
          <span>Terrain : {meta.terrain || '—'}</span>
        </div>
      )}

      <div className="hgss-real-map">
        <div
          className="hgss-map-surface"
          style={{ '--w': width, '--h': height }}
        >
          <div className="hgss-map-label">
            {name}
            <small>STRUCTURE EXTRAITE DE LA ROM · LECTURE SEULE</small>
          </div>
          <div className="hgss-map-grid">
            {Array.from({ length: width * height }, (_, i) => {
              const x = i % width;
              const y = Math.floor(i / width);
              const id = cells.get(`${x}:${y}`);
              const active = selected?.[0] === x && selected?.[1] === y;
              return (
                <button
                  type="button"
                  key={`${x}:${y}`}
                  className={`hgss-map-cell ${id != null ? 'occupied' : ''} ${active ? 'selected' : ''}`}
                  onClick={() => setSelected([x, y, id])}
                  title={id != null ? `Cellule ${x},${y} · map ${id}` : `Cellule ${x},${y}`}
                >
                  {id != null && <span>{id}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div className="hgss-map-info">
          <b>Cellule {selected[0]} × {selected[1]}</b>
          <span>{selected[2] != null ? ` · entrée matrice ${selected[2]}` : ' · vide'}</span>
        </div>
      )}

      <div className="hgss-nav">
        {connections.map(c => (
          <button key={c.id} type="button" onClick={() => onChange?.(c)}>
            → {c.name}
          </button>
        ))}
      </div>
    </section>
  );
}
