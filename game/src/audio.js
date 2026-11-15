export function createAudio() {
  let context=null, muted=false, pulseTime=0;
  function init(){if(!context){const AudioContext=window.AudioContext||window.webkitAudioContext;if(AudioContext)context=new AudioContext();}if(context?.state==='suspended')context.resume();}
  function tone(freq,duration,type='sine',volume=.06,slide=0,delay=0){
    if(muted||!context)return;
    const now=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(20,freq),now);
    if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),now+duration);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain).connect(context.destination);osc.start(now);osc.stop(now+duration+.01);
  }
  function play(event){
    if(event==='shoot')tone(510,.07,'triangle',.025,-220);
    if(event==='hit')tone(280,.09,'square',.025,-170);
    if(event==='explode'){tone(145,.22,'sawtooth',.075,-110);tone(70,.28,'triangle',.06,-40);}
    if(event==='hurt'||event==='shield')tone(200,.3,'sawtooth',.09,-130);
    if(event==='clear'){[330,440,550,660].forEach((f,i)=>tone(f,.2,'triangle',.06,80,i*.09));}
    if(event==='upgrade'){tone(420,.2,'sine',.08,220);tone(680,.25,'triangle',.05,280,.12);}
    if(event==='over')tone(180,.6,'sawtooth',.08,-130);
  }
  function tick(time,playing){if(playing&&time-pulseTime>.72){pulseTime=time;tone(55,.17,'sine',.012,-20);}}
  return {init,play,tick,toggle(){muted=!muted;return muted;},get muted(){return muted;}};
}
