import { STEP } from './config.js';

function targetEnemy(state) {
  let best=null, distance=Infinity;
  for(const e of state.enemies){
    const d=(e.x-state.player.x)**2+(e.y-state.player.y)**2;
    if(d<distance){distance=d;best=e;}
  }
  return best;
}
function autopilot(state, mode) {
  const p=state.player,e=targetEnemy(state);
  if(mode==='end')return {move:{x:0,y:0},aim:{x:p.x,y:p.y+100},fire:false};
  const targetX=e?e.x:640;
  const drift=Math.sin(state.time*.85)*180;
  const x=targetX*.5+320+drift*.4;
  const y=570;
  return {move:{x:Math.sign(x-p.x)* (Math.abs(x-p.x)>12),y:Math.sign(y-p.y)*(Math.abs(y-p.y)>12)},aim:e?{x:e.x+e.vx*.2,y:e.y+e.vy*.2}:{x:p.x,y:-100},fire:true};
}
export function stageShot(name, world) {
  world.reset();
  if(name==='start'){
    for(let i=0;i<90;i++)world.step(STEP,{fire:false});
    return;
  }
  world.start();
  const max=name==='end'?45:8.5;
  for(let i=0;i<max/STEP;i++){
    if(world.state.phase==='over')break;
    if(world.state.phase==='upgrade')world.choose(0);
    world.step(STEP,autopilot(world.state,name==='end'&&i>8.5/STEP?'end':'play'));
  }
}
