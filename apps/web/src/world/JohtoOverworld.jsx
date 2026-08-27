import React from 'react';
import HGSSViewport from './HGSSViewport';

export default function JohtoOverworld({items=[],selected,setSelected,lang='fr',onBattle,gm=false}) {
  const current=selected||items[0]||{name:'Route 29',connections:[]};
  const connections=(current.connections||[]).map(name=>items.find(x=>x.name===name)).filter(Boolean);
  return <HGSSViewport name={current.name||'Route 29'} connections={connections} onChange={next=>setSelected?.(next)} onBattle={onBattle} gm={gm} lang={lang}/>;
}
