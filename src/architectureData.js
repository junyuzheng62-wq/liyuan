import * as THREE from 'three';
import {LAYOUT,ROOM} from './worldLayout.js';
export function buildArchitecture(){
  const boxes=[];
  const add=(p,s,c,r=[0,0,0])=>boxes.push({p,s,c,r});
  const transform=(p,origin,angle)=>[origin[0]+Math.cos(angle)*p[0]+Math.sin(angle)*p[2],p[1],origin[1]-Math.sin(angle)*p[0]+Math.cos(angle)*p[2]];
  const wings=[[[0,-10],0],[[-10,0],Math.PI/2],[[10,0],-Math.PI/2]];
  wings.forEach(([origin,angle],wing)=>{
    const box=(p,s,c,r=[0,0,0])=>{const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)));const e=new THREE.Euler().setFromQuaternion(q);add(transform(p,origin,angle),s,c,[e.x,e.y,e.z]);};
    if(wing===0){
      box([0,1.5,-1.1],[20.5,3,2.2],'#ada18a');
      box([0,7.6,-1.1],[20.5,3.2,2.2],'#ada18a');
      box([-4.645,4.58,-1.1],[11.21,2.84,2.2],'#ada18a');
      box([6.305,4.58,-1.1],[7.89,2.84,2.2],'#ada18a');
      box([ROOM.x,5.83,-1.1],[1.4,.34,2.2],'#ada18a');
    }else box([0,4.6,-1.1],[20.5,9.2,2.2],['#ada18a','#aaa391','#c5ba9e'][wing]);
    box([0,.35,.03],[20.5,.7,.12],'#666e61');
    // Three storeys of narrow doors, heterogeneous windows and shared access galleries.
    for(let level=0;level<3;level++){
      const y=level*3;
      box([0,y+.08,.6],[20.6,.16,1.55],'#7e8071');
      if(wing===0||level===0)box([0,y+.2,1.35],[20.6,.12,.12],'#454e49');
      if(level>0){
        const open=x=>wing===1?((x>1.1&&x<2.7)||x>8.6):wing===2?((x>-2.7&&x<-1.1)||x< -8.6):Math.abs(x)>8.6;
        for(let i=0;i<51;i++){
          const x=-10+i*.4;if(open(x))continue;
          [0.35,1.05].forEach(h=>box([x,y+h,1.35],[.4,.045,.045],'#383e38'));
          box([x,y+.69,1.35],[.025,.9,.025],'#424a42');
        }
      }
      for(let unit=0;unit<6;unit++){
        const x=-8.3+unit*3.32;
        const door=['#315c50','#614c37','#466c68','#694b3c','#394d47','#6e6850'][(unit+level+wing)%6];
        const openDoor=wing===0&&level===1&&unit===3;
        if(!openDoor){
        box([x,y+1.2,.065],[1.08,2.4,.14],'#746e5b');
        box([x,y+1.16,.15],[.9,2.26,.1],door);
        [0.5,1.15,1.85].forEach(h=>box([x,y+h,.212],[.73,.035,.025],'#242e27'));
        box([x+.32,y+1.12,.24],[.055,.09,.04],'#c3b28a');
        }else{
          box([x-.8,y+1.2,-.5],[.1,2.3,.9],'#315c50');
          box([x-.72,y+.25,-1],[.09,.5,.09],'#ad5f46');
        }
        box([x,y+2.57,.09],[1.12,.28,.08],'#d0c3a4');
        for(let k=0;k<4;k++)box([x-.36+k*.24,y+2.57,.14],[.055,.2,.04],'#4c5d50');
        const wx=x+1.16;
        box([wx,y+1.65,.1],[.9,1.2,.14],'#dbd0b2');
        box([wx,y+1.65,.2],[.71,1,.06],(unit+level)%2?'#3b5855':'#646e60');
        for(let k=0;k<3;k++)box([wx-.27+k*.27,y+1.65,.25],[.025,1,.035],'#a3aa92');
        box([wx,y+1.65,.25],[.76,.035,.035],'#b2b298');
        box([wx,y+1,.23],[1.05,.1,.38],'#817f6c');
        // Meter boxes, exposed conduit and red paper by selected doors.
        box([x-.78,y+1.85,.16],[.2,.3,.16],'#b1ad96');
        box([x-.78,y+2.25,.12],[.025,.6,.03],'#52584a');
        if((unit+level)%3===0){
          box([x-.57,y+1.45,.22],[.1,.9,.025],'#9f4533');
          box([x+.57,y+1.45,.22],[.1,.9,.025],'#a54832');
          box([x,y+2.36,.23],[1.15,.12,.025],'#a24836');
        }
        // Deterministic, uneven plaster loss rather than a repeating clean facade.
        for(let patch=0;patch<4;patch++){
          const px=x-.5+((patch*17+unit*7+level*3)%19)/10;
          const py=y+.3+((patch*7+unit*3)%11)/7;
          if(px>x-.6&&px<x+.62)continue;
          box([px,py,.03],[.22+(patch%2)*.2,.16+(unit%3)*.06,.035],['#8b8b76','#bbae90','#757b68'][patch%3]);
        }
      }
    }
    // Continuous red posts and Y braces are the strongest motif in the supplied photo.
    for(let i=0;i<9;i++){
      const x=-10+i*2.5;
      box([x,4.65,1.24],[.13,9.3,.13],'#8b4132');
      box([x+.03,1.2,1.32],[.04,1.8,.025],'#bc7452');
      for(let level=1;level<=3;level++){
        box([x-.25,level*3-.28,1.24],[.075,.77,.075],'#934a35',[0,0,-.7]);
        box([x+.25,level*3-.28,1.24],[.075,.77,.075],'#934a35',[0,0,.7]);
      }
    }
    box([0,9.28,.7],[21,.14,.18],'#693f30');
    box([0,9.8,-.1],[21,.13,2.15],'#a36549',[.38,0,0]);
    box([0,9.8,-2.1],[21,.13,2.15],'#98583f',[-.38,0,0]);
    box([0,10.22,-1.1],[21,.12,.16],'#bd8260');
    for(let t=0;t<58;t++){
      box([-10.3+t*.36,9.81,-.1],[.035,.04,2.16],t%3?'#b27556':'#82513e',[.38,0,0]);
      box([-10.3+t*.36,9.81,-2.1],[.035,.04,2.16],'#a66d50',[-.38,0,0]);
    }
    // Exposed brickwork close to the damp ground line.
    for(let row=0;row<4;row++)for(let col=0;col<9;col++)box([-6.3+col*.25+(row%2)*.11,.55+row*.12,.1],[.23,.1,.04],(row+col)%3?'#9f7155':'#b18464');
  });
  // Shared physical layout provides the tread positions, landings and the sample room.
  for(const v of LAYOUT.visuals)add(v.p,v.s,v.c,v.rotation);
  // Small foreground utility shed, leaving the central play route open.
  add([4.8,.85,5.8],[3,1.7,2.2],'#aaa184');
  add([4.8,2.1,5.14],[3.4,.12,1.55],'#ad6145',[.53,0,0]);
  add([4.8,2.1,6.46],[3.4,.12,1.55],'#a3583e',[-.53,0,0]);
  add([4.8,2.5,5.8],[3.5,.12,.14],'#cf8b62');
  add([5.3,2.7,5.6],[.48,1.3,.5],'#bab195');
  add([4.2,.8,4.67],[.75,1.6,.09],'#5b6958');
  for(let i=0;i<12;i++)add([3.2+i*.29,2.14,5.14],[.035,.035,1.55],'#ce8961',[.53,0,0]);
  // A side washing station with individual enamel basins and a drain.
  add([7.4,.7,.7],[1.9,.12,.8],'#898e7a');
  for(const x of [6.65,8.15])add([x,.34,.7],[.13,.7,.6],'#777f6b');
  add([7.4,.83,.7],[1.65,.14,.65],'#d0d0b8');
  add([7.4,.91,.7],[1.4,.025,.46],'#677e76');
  add([7.7,1.3,.95],[.045,.65,.045],'#666b5c');
  add([7.7,1.59,.83],[.045,.045,.28],'#666b5c');
  for(let i=0;i<30;i++)add([-8+i*.55,.045,7.7],[.42,.025,.16],'#777a68');
  return boxes;
}
