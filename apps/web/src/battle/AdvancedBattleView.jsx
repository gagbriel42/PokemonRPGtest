import React from'react';
import BattlePersistent,{GmBattlePersistent}from'./BattlePersistent.jsx';
export default function AdvancedBattleView({onExit}){return <BattlePersistent onExit={onExit}/>}
export function GmAdvancedBattleView({onExit}){return <GmBattlePersistent onExit={onExit}/>}
