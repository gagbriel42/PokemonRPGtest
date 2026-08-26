import React from'react';
import{BattleSystemV3}from'./BattleSystemV3.jsx';
export default function AdvancedBattleView({onExit}){return <BattleSystemV3 onExit={onExit} gm={false}/>}
export function GmAdvancedBattleView({onExit}){return <BattleSystemV3 onExit={onExit} gm/>}
