import React from'react';
import BattleViewFixed,{GmBattleViewFixed}from'./BattleViewFixed.jsx';
export default function AdvancedBattleView({onExit}){return <BattleViewFixed onExit={onExit}/>}
export function GmAdvancedBattleView({onExit}){return <GmBattleViewFixed onExit={onExit}/>}
