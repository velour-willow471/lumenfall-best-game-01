import { BEST_KEY, STEP } from './config.js';
import { mulberry32 } from './random.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const params=new URLSearchParams(location.search);
const parsed=Number.parseInt(params.get('seed')??'',10);
const seed=Number.isInteger(parsed)?parsed:Math.floor(Math.random()*4294967296);
const canvas=document.getElementById('game'),status=document.getElementById('status');
const world=createWorld(mulberry32(seed)),renderer=createRenderer(canvas),audio=createAudio();
let best=0;
try{best=Number.parseInt(localStorage.getItem(BEST_KEY)??'0',10)||0;}catch{}
function saveBest(){if(world.state.score>best){best=world.state.score;try{localStorage.setItem(BEST_KEY,String(best));}catch{}}}
function announce(text){status.textContent=text;}
window.__gameState=world.state;
const shot=params.get('shot');
if(shot){
  stageShot(shot,world);
  best=world.state.phase==='over'?world.state.score:0;
  let paints=0;
  function paint(){renderer.draw(world.state,best,true);if(++paints<2)requestAnimationFrame(paint);else window.__shotReady=true;}
  requestAnimationFrame(paint);
}else{
  const input=createInput(canvas);
  let last=performance.now(),accumulator=0;
  function handle(){
    const action=input.take(),s=world.state;
    if(action.mute){audio.init();audio.toggle();}
    if(s.phase==='title'||s.phase==='over'){
      if(action.confirm){audio.init();world.start();announce('Wave 1. Pilot online.');}
      return;
    }
    if(s.phase==='paused'){if(action.pause||action.confirm){s.phase='play';announce('Resumed.');}return;}
    if(s.phase==='play'&&action.pause){s.phase='paused';announce('Paused.');return;}
    if(s.phase==='upgrade'){
      for(const click of action.clicks){
        const index=click.choice??(click.y>=276&&click.y<=520?Math.floor((click.x-167)/326):-1);
        if(index>=0&&index<3&&world.choose(index)){audio.init();audio.play('upgrade');announce(`Wave ${s.wave}.`);break;}
      }
    }
  }
  function frame(now){
    requestAnimationFrame(frame);
    accumulator+=Math.min((now-last)/1000,.25);last=now;
    handle();
    if(world.state.phase==='play'){
      while(accumulator>=STEP&&world.state.phase==='play'){
        const events=world.step(STEP,{move:input.move,aim:input.aim,fire:true});
        for(const event of events)audio.play(event);
        if(events.includes('clear'))announce(`Wave ${world.state.wave} cleared. Choose an upgrade.`);
        if(world.state.phase==='over'){saveBest();announce(`Game over. Score ${world.state.score}.`);}
        accumulator-=STEP;
      }
      audio.tick(world.state.time,true);
    }else{accumulator=0;}
    renderer.draw(world.state,best,audio.muted);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&world.state.phase==='play'){world.state.phase='paused';announce('Paused.');}});
  announce('LUMENFALL. Click or press Space to launch.');requestAnimationFrame(frame);
}
