import { COLORS as C, FIELD } from './config.js';

const TAU = Math.PI * 2;
const font = (size, weight = 500) => `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { x: 0, y: 0, scale: 1 };
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }
  function label(text, x, y, size, color = C.white, align = 'left', weight = 500) {
    ctx.font = font(size, weight); ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.fillText(text, x, y);
  }
  function line(x1,y1,x2,y2,color,width=1) { ctx.strokeStyle=color; ctx.lineWidth=width; ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke(); }
  function poly(points, color, width = 2, fill = false) {
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for (let i=1;i<points.length;i++) ctx.lineTo(points[i][0],points[i][1]);
    ctx.closePath(); if (fill) {ctx.fillStyle=color;ctx.fill();} else {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  }
  function glow(color, blur) { ctx.shadowColor=color;ctx.shadowBlur=blur; }
  function grid(time) {
    ctx.fillStyle=C.dark;ctx.fillRect(0,0,FIELD.width,FIELD.height);
    const g=ctx.createLinearGradient(0,0,0,FIELD.height);g.addColorStop(0,'#0e172a');g.addColorStop(.55,'#091522');g.addColorStop(1,'#09131e');
    ctx.fillStyle=g;ctx.fillRect(0,0,FIELD.width,FIELD.height);
    ctx.save(); ctx.globalAlpha=.32;
    const offset=(time*24)%48;
    for(let y=-48+offset;y<FIELD.height+48;y+=48) line(0,y,FIELD.width,y,C.grid,1);
    for(let x=0;x<FIELD.width;x+=48) line(x,0,x,FIELD.height,C.grid,1);
    ctx.restore();
    const vignette=ctx.createRadialGradient(640,340,170,640,340,750);
    vignette.addColorStop(0,'#050a1200');vignette.addColorStop(1,'#02050bcc');ctx.fillStyle=vignette;ctx.fillRect(0,0,1280,720);
    line(26,26,1254,26,'#375468',1);line(26,694,1254,694,'#375468',1);
    line(26,26,26,694,'#375468',1);line(1254,26,1254,694,'#375468',1);
    for (const p of [[26,26],[1254,26],[26,694],[1254,694]]) {
      ctx.fillStyle=C.cyan;ctx.fillRect(p[0]-2,p[1]-2,4,4);
    }
  }
  function starfield(s) {
    ctx.save();
    for(const star of s.stars){ctx.globalAlpha=.25+.35*(.5+.5*Math.sin(s.time*2+star.phase));ctx.fillStyle=C.white;ctx.fillRect(star.x,star.y,star.r,star.r);}
    ctx.restore();
  }
  function ship(p, time, large=false) {
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+Math.PI/2);
    const size=large?2.6:1;ctx.scale(size,size);
    const flicker=p.invincible>0 && Math.floor(time*16)%2===0;
    if(flicker)ctx.globalAlpha=.42;
    glow(C.cyan,22);
    poly([[0,-24],[16,17],[0,11],[-16,17]],C.cyan,2.7,true);
    ctx.shadowBlur=0;poly([[0,-24],[16,17],[0,11],[-16,17]],'#d8ffff',1.8);
    poly([[0,-12],[6,7],[0,4],[-6,7]],'#072a38',1,true);
    ctx.fillStyle=C.gold;glow(C.gold,15);ctx.fillRect(-4,16,8,8+Math.sin(time*27)*3);
    ctx.restore();
    if(p.shield>0&&!large){ctx.save();ctx.strokeStyle='#52f5e766';ctx.lineWidth=2;glow(C.cyan,12);ctx.beginPath();ctx.arc(p.x,p.y,29+Math.sin(time*4)*2,0,TAU);ctx.stroke();ctx.restore();}
  }
  function enemy(e) {
    const color=[C.cyan,C.coral,C.gold][e.kind];
    ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.spin);glow(color,18);
    const sides=[4,3,6][e.kind], r=e.r;
    const points=[];for(let i=0;i<sides;i++){const a=i*TAU/sides-Math.PI/2;points.push([Math.cos(a)*r,Math.sin(a)*r]);}
    ctx.globalAlpha=.16;poly(points,color,1,true);ctx.globalAlpha=1;poly(points,color,2.2);
    ctx.rotate(-e.spin*1.7);ctx.globalAlpha=.7;
    ctx.beginPath();ctx.arc(0,0,r*.38,0,TAU);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
    if(e.maxHp>1){ctx.fillStyle='#1c3241';ctx.fillRect(e.x-e.r,e.y+e.r+8,e.r*2,3);ctx.fillStyle=color;ctx.fillRect(e.x-e.r,e.y+e.r+8,e.r*2*e.hp/e.maxHp,3);}
  }
  function entities(s) {
    for(const b of s.bullets){ctx.save();glow(C.cyan,17);ctx.strokeStyle=C.cyan;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x-b.vx*.011,b.y-b.vy*.011);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();}
    for(const e of s.enemies) enemy(e);
    for(const p of s.particles){ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);glow(p.color,11);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();ctx.restore();}
    ship(s.player,s.time);
  }
  function hud(s,best,muted) {
    ctx.fillStyle='#07111edb';ctx.fillRect(26,27,1228,77);line(26,104,1254,104,'#3b6676');
    label('LUMENFALL',48,52,20,C.cyan,'left',800);
    label('SCORE',270,49,13,C.muted,'left',700);label(String(s.score).padStart(6,'0'),270,77,25,C.white,'left',700);
    label('WAVE',490,49,13,C.muted,'left',700);label(String(s.wave).padStart(2,'0'),490,77,25,C.white,'left',700);
    label('COMBO',630,49,13,C.muted,'left',700);label(`x${s.combo}`,630,77,25,s.combo>=5?C.gold:C.white,'left',700);
    label('BEST',790,49,13,C.muted,'left',700);label(String(Math.max(best,s.score)).padStart(6,'0'),790,77,25,C.white,'left',700);
    label('HULL',1020,49,13,C.muted,'left',700);
    for(let i=0;i<s.player.maxHull;i++){ctx.fillStyle=i<s.player.hull?C.coral:'#31404b';ctx.fillRect(1020+i*22,72,16,9);}
    if(s.player.shield>0) label(`SHIELD ${s.player.shield}`,1175,79,13,C.cyan,'right',700);
    label(muted?'M  SOUND OFF':'M  SOUND ON',48,663,13,C.muted);
    label('P / ESC  PAUSE',1230,663,13,C.muted,'right');
    const progress=s.spawned?1-s.remaining/(6+s.wave*3):0;
    label(`${s.remaining} THREATS REMAIN`,640,650,13,C.muted,'center',700);
    ctx.fillStyle='#264251';ctx.fillRect(480,683,320,3);ctx.fillStyle=C.cyan;ctx.fillRect(480,683,Math.max(0,320*progress),3);
  }
  function overlay(alpha=.7){ctx.fillStyle=`rgba(3,8,16,${alpha})`;ctx.fillRect(0,0,1280,720);}
  function panel(x,y,w,h){ctx.fillStyle='#0c1827ed';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#4e8192';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.fillStyle=C.cyan;ctx.fillRect(x,y,60,3);ctx.fillRect(x+w-60,y+h-3,60,3);}
  function title(s,best) {
    overlay(.52);
    ctx.save();ctx.globalAlpha=.34;ship({x:640,y:335,angle:-Math.PI/2,invincible:0,shield:0},s.time,true);ctx.restore();
    label('LUMENFALL',640,193,88,C.white,'center',900);
    label('SURVIVE THE SWARM',640,257,20,C.cyan,'center',700);
    line(438,283,842,283,'#52f5e777');
    label('WASD / ARROWS  MOVE',640,452,18,C.white,'center',700);
    label('MOUSE  AIM    ·    AUTO-FIRE',640,484,18,C.white,'center',700);
    label('P / ESC  PAUSE    ·    M  MUTE',640,516,16,C.muted,'center');
    ctx.save();glow(C.cyan,14);label('CLICK OR PRESS SPACE TO LAUNCH',640,587,22,C.cyan,'center',800);ctx.restore();
    label(`BEST SCORE  ${String(best).padStart(6,'0')}`,640,642,14,C.muted,'center',700);
  }
  function paused() {overlay();panel(420,248,440,224);label('PAUSED',640,329,48,C.white,'center',800);label('P / ESC TO RESUME',640,408,19,C.cyan,'center',700);}
  function over(s,best) {
    overlay(.77);panel(375,177,530,370);
    label('SIGNAL LOST',640,267,46,C.coral,'center',900);
    label('FINAL SCORE',640,339,16,C.muted,'center',700);label(String(s.score).padStart(6,'0'),640,381,38,C.white,'center',800);
    label(`WAVE ${s.wave}     ·     BEST ${String(Math.max(best,s.score)).padStart(6,'0')}`,640,440,18,C.cyan,'center',700);
    label('CLICK OR PRESS R TO RESTART',640,505,17,C.white,'center',700);
  }
  function upgrade(s) {
    overlay(.82);label('WAVE CLEARED',640,166,48,C.white,'center',900);
    label('CHOOSE YOUR NEXT SYSTEM',640,211,17,C.cyan,'center',700);
    s.upgradeChoices.forEach((u,i)=>{
      const x=167+i*326,y=276,w=292,h=244;
      panel(x,y,w,h);ctx.fillStyle=u.color;ctx.fillRect(x+24,y+26,30,4);
      label(`0${i+1}`,x+25,y+72,35,u.color,'left',800);
      label(u.title,x+25,y+132,22,C.white,'left',800);
      label(u.detail,x+25,y+169,17,C.muted);
      label('SELECT',x+25,y+215,15,u.color,'left',800);
    });
    label('CLICK A SYSTEM OR PRESS 1 / 2 / 3',640,585,16,C.muted,'center');
  }
  function draw(s,best,muted) {
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=C.dark;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(view.scale,0,0,view.scale,view.x,view.y);
    ctx.save();
    if(s.shake>0 && s.phase==='play')ctx.translate(Math.sin(s.time*99)*s.shake*.45,Math.cos(s.time*83)*s.shake*.45);
    grid(s.time);starfield(s);
    if(s.phase!=='title') {entities(s);hud(s,best,muted);}
    else { for(const e of s.enemies) enemy(e); }
    ctx.restore();
    if(s.flash>0){ctx.fillStyle=`rgba(255,108,118,${s.flash*.35})`;ctx.fillRect(0,0,1280,720);}
    if(s.phase==='title')title(s,best);
    if(s.phase==='paused')paused();
    if(s.phase==='upgrade')upgrade(s);
    if(s.phase==='over')over(s,best);
  }
  resize();window.addEventListener('resize',resize);
  return {draw,view};
}
