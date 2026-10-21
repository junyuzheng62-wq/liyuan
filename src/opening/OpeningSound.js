// Opening-only procedural ambience. No recorded voices or unlicensed sound files.
export default class OpeningSound{
 constructor(){this.ctx=null;this.muted=false;this.mix=0;this.rang=false;}
 start(){
  try{
   if(!this.ctx){
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    this.ctx=new Audio();const c=this.ctx;
    this.master=c.createGain();this.master.gain.value=.15;this.master.connect(c.destination);
    const buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0);
    let previous=0;for(let i=0;i<data.length;i++){previous=(previous+Math.random()*.04-.02)/1.02;data[i]=previous*3;}
    const noise=c.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const street=c.createBiquadFilter();street.type='lowpass';street.frequency.value=360;
    const wind=c.createBiquadFilter();wind.type='bandpass';wind.frequency.value=1100;wind.Q.value=.4;
    this.modern=c.createGain();this.past=c.createGain();this.modern.gain.value=.16;this.past.gain.value=0;
    noise.connect(street);noise.connect(wind);street.connect(this.modern);wind.connect(this.past);this.modern.connect(this.master);this.past.connect(this.master);noise.start();this.noise=noise;
   }
   this.rang=false;this.ctx.resume().catch(()=>{});
  }catch{this.ctx=null;}
 }
 blend(value){
  this.mix=value;if(!this.ctx)return;const c=this.ctx,t=c.currentTime;
  this.modern.gain.setTargetAtTime((1-value)*.16,t,.2);this.past.gain.setTargetAtTime(value*.12,t,.2);
  if(value>.85&&!this.rang){this.rang=true;this.bell();}
 }
 bell(){
  const c=this.ctx,t=c.currentTime;
  for(const frequency of [1568,2093]){const o=c.createOscillator(),g=c.createGain();o.frequency.value=frequency;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+.9);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+1);o.onended=()=>{o.disconnect();g.disconnect();};}
 }
 mute(value){this.muted=value;if(this.ctx)this.master.gain.setTargetAtTime(value?0:.15,this.ctx.currentTime,.1);}
 snapshot(){return {state:this.ctx?.state||'unavailable',muted:this.muted,mix:this.mix};}
 dispose(){if(this.ctx){try{this.noise.stop();this.ctx.close().catch(()=>{});}catch{}this.ctx=null;}}
}
