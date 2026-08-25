import React from'react';
import BattleSystemV2,{GmBattleSystemV2}from'./BattleSystemV2.jsx';
import'./hgss-battle-ui.css';
export default function AdvancedBattleView({onExit}){return <div className="hgss-battle-shell"><BattleSystemV2 onExit={onExit}/></div>}
export function GmAdvancedBattleView({onExit}){return <div className="hgss-battle-shell"><GmBattleSystemV2 onExit={onExit}/></div>}
