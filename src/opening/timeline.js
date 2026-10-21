export const FILM_END=40;
export const CROSS_END=15;
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*smooth(t));
const CUES=[
 [0,5,'我是一只活了很久很久的海鸥。'],
 [5,11,'我出生在青岛一座里院的屋顶上，和一个小男孩一起长大。'],
 [11,15,'很多年过去了，我们终于又回到了这里。'],
 [15,20,'可是……这里怎么变得不一样了？'],
 [20,25,'以前的邻居呢？那些每天在院子里玩耍的小伙伴呢？'],
 [25,30,'房子好像还在，可那些熟悉的声音却不见了。'],
 [30,34,'要是能再回到以前就好了……'],
 [34,37,'等等！这扇门，我还记得！'],
 [37,41,'我们回家看看吧！'],
];
export function sampleOpening(mode,time=0,cross=0){
 const t=Math.max(0,Math.min(FILM_END,time)),u=Math.max(0,Math.min(CROSS_END,cross));
 let actor,camera,look,walking=false,heading=-Math.PI/2,head=0;
 if(t<15){
  actor=mix([-8.5,0,15],[-1.5,0,14.5],t/15);walking=mode!=='title';heading=Math.PI/2;
  if(t<9){camera=mix([-12,6.4,25],[-7,3.3,20],t/9);look=mix([-6,1.2,14],[-4,1.35,14.5],t/9);}
  else{camera=mix([-7,3.3,20],[3,2.1,17.8],(t-9)/6);look=mix([-4,1.35,14.5],[-1.5,1.35,14.5],(t-9)/6);}
 }else if(t<30){
  actor=[-1.5,0,14.5];heading=Math.PI/2-(Math.sin((t-15)/15*Math.PI)*.65);head=Math.sin((t-15)*.45)*.55*Math.sin((t-15)/15*Math.PI);
  camera=mix([3,2.1,17.8],[4.8,3.4,18.2],(t-15)/15);look=mix([-1.5,1.35,14.5],[.5,2.1,11.8],(t-15)/15);
 }else{
  actor=mix([-1.5,0,14.5],[0,0,10.65],(t-30)/10);walking=t<39.5&&mode==='film';heading=Math.PI/2+Math.PI/2*smooth((t-30)/3);
  camera=mix([4.8,3.4,18.2],[.4,2.45,15.2],(t-30)/10);look=mix([.5,2.1,11.8],[0,1.65,10.1],(t-30)/10);
 }
 let blend=0,door=0,child=0,push=0;
 if(mode==='crossing'||mode==='ready'){
  const p=mode==='ready'?CROSS_END:u;
  actor=mix([0,0,10.65],[0,0,5],(p-1.5)/8.5);walking=p>2&&p<10;
  push=smooth(p/.9)*(1-smooth((p-2)/1.8));heading=Math.PI;
  door=smooth((p-.4)/2.8)*1.42;blend=smooth((p-2)/7);child=smooth((p-4.8)/3.3);
  if(p<5){camera=mix([.4,2.45,15.2],[0,2.2,8.6],p/5);look=mix([0,1.65,10.1],[0,1.2,6],p/5);}
  else if(p<10){camera=mix([0,2.2,8.6],[6,5.8,11],(p-5)/5);look=mix([0,1.2,6],[0,2.4,-.5],(p-5)/5);}
  else{camera=mix([6,5.8,11],[1.643,3.644,9.502],(p-10)/5);look=mix([0,2.4,-.5],[0,1.15,5],(p-10)/5);}
 }
 const landed=t>=24&&t<31&&mode!=='crossing'&&mode!=='ready';
 let bird=landed?[-2.8,1.1,13.7]:[actor[0]+Math.cos(t*.8)*1.1,2.65+Math.sin(t*1.6)*.18,actor[2]+Math.sin(t*.8)*.8];
 if(mode==='crossing'||mode==='ready')bird=[actor[0]+1.1,2.3+Math.sin(u*1.5)*.12,actor[2]+.7];
 const cue=(mode==='crossing'||mode==='ready')?(u>7||mode==='ready'?'我们……真的回来了！':'风里，又传来了熟悉的声音。'):(CUES.find(([a,b])=>t>=a&&t<b)?.[2]||'我们回家看看吧！');
 return {actor,camera,look,walking,heading,head,bird,landed,blend,door,child,push,cue,act:mode==='crossing'||mode==='ready'?4:t<15?1:t<30?2:3};
}
