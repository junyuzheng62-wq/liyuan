import React, {useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';

// Architectural details share one instanced draw, including the weathering patches.
function buildArchitecture(){
  const boxes=[];
  const add=(p,s,c,r=[0,0,0])=>boxes.push({p,s,c,r});
  const transform=(p,origin,angle)=>[origin[0]+Math.cos(angle)*p[0]+Math.sin(angle)*p[2],p[1],origin[1]-Math.sin(angle)*p[0]+Math.cos(angle)*p[2]];
  const wings=[[[0,-10],0],[[-10,0],Math.PI/2],[[10,0],-Math.PI/2]];
  wings.forEach(([origin,angle],wing)=>{
    const box=(p,s,c,r=[0,0,0])=>{const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)));const e=new THREE.Euler().setFromQuaternion(q);add(transform(p,origin,angle),s,c,[e.x,e.y,e.z]);};
    box([0,4.6,-1.1],[20.5,9.2,2.2],['#ada18a','#aaa391','#c5ba9e'][wing]);
    box([0,.35,.03],[20.5,.7,.12],'#666e61');
    // Three storeys of narrow doors, heterogeneous windows and shared access galleries.
    for(let level=0;level<3;level++){
      const y=level*3;
      box([0,y+.08,.6],[20.6,.16,1.55],'#7e8071');
      box([0,y+.2,1.35],[20.6,.12,.12],'#454e49');
      if(level>0){
        [0.35,1.05].forEach(h=>box([0,y+h,1.35],[20.5,.045,.045],'#383e38'));
        for(let i=0;i<51;i++)box([-10+i*.4,y+.69,1.35],[.025,.9,.025],'#424a42');
      }
      for(let unit=0;unit<6;unit++){
        const x=-8.3+unit*3.32;
        const door=['#315c50','#614c37','#466c68','#694b3c','#394d47','#6e6850'][(unit+level+wing)%6];
        box([x,y+1.2,.065],[1.08,2.4,.14],'#746e5b');
        box([x,y+1.16,.15],[.9,2.26,.1],door);
        [0.5,1.15,1.85].forEach(h=>box([x,y+h,.212],[.73,.035,.025],'#242e27'));
        box([x+.32,y+1.12,.24],[.055,.09,.04],'#c3b28a');
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
  // Left-hand switchback stairs: half-flights and landings reach both upper galleries.
  for(let floor=0;floor<2;floor++){
    for(let flight=0;flight<2;flight++){
      const x=flight===0?-7.2:-8.45;
      for(let step=0;step<10;step++){
        const y=floor*3+(flight*10+step+1)*.15;
        const z=flight===0?-2.6-step*.35:-5.75+step*.35;
        add([x,y-.08,z],[1.14,.16,.36],'#9b9b86');
        add([x+.59,y+.49,z],[.035,1.05,.035],'#484e43');
      }
      add([x+.59,floor*3+flight*1.5+1.35,-4.2],[.045,.045,3.85],'#754b3b',[flight===0?-.405:.405,0,0]);
    }
    add([-7.85,floor*3+1.45,-6.1],[2.55,.15,.6],'#898c78');
    add([-7.85,floor*3+2.95,-2.25],[2.55,.15,.6],'#898c78');
  }
  for(const x of [-8.95,-6.55])add([x,3.05,-6.25],[.2,6.1,.22],'#9d9b87');
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
function Clothes({position,color,index}){
  const ref=useRef();
  useFrame(({clock})=>{ref.current.rotation.x=Math.sin(clock.elapsedTime*1.1+index)*.055;});
  return <group position={position} ref={ref}><mesh position={[0,-.47,0]} castShadow><boxGeometry args={[index%3===0?1.1:.62,.92,.025]}/><meshStandardMaterial color={color} roughness={1}/></mesh><mesh position={[0,.02,0]}><boxGeometry args={[.09,.13,.06]}/><meshStandardMaterial color="#a38858"/></mesh></group>;
}
function Wire({points,color='#4f5b50'}){
  const geometry=useMemo(()=>{const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));},[points]);
  return <line geometry={geometry}><lineBasicMaterial color={color}/></line>;
}
export default function Architecture(){
  const boxes=useMemo(buildArchitecture,[]);const ref=useRef();
  useLayoutEffect(()=>{const o=new THREE.Object3D();boxes.forEach((b,i)=>{o.position.set(...b.p);o.rotation.set(...b.r);o.scale.set(...b.s);o.updateMatrix();ref.current.setMatrixAt(i,o.matrix);ref.current.setColorAt(i,new THREE.Color(b.c));});ref.current.instanceMatrix.needsUpdate=true;ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();},[boxes]);
  return <group name="photo-inspired-architecture"><instancedMesh ref={ref} args={[null,null,boxes.length]} castShadow receiveShadow><boxGeometry/><meshStandardMaterial roughness={.96}/></instancedMesh>
    {[3.9,6.8,8.1].map((y,i)=><Wire key={y} points={[[-8.6,y,-7+i*2],[0,y-.45,-6+i*2],[8.6,y+.2,-5+i*2]]}/>)}
    <Wire points={[[-8.7,7.8,-5],[-1,6.8,0],[8.7,7.2,5]]}/><Wire points={[[-8.7,5.5,4],[-1,5,2],[8.7,5.8,0]]}/>
    {Array.from({length:13},(_,i)=><Clothes key={i} index={i} position={[-6+i*.95, i<7?6.5:3.65,i<7?-3.7:-6.8]} color={['#e0ddd0','#5c8684','#c6b994','#8f6654','#d3d4c2','#566e77'][i%6]}/>)}
    <Wire points={[[-7,6.9,-3.7],[0,6.45,-3.7],[7,6.9,-3.7]]}/>
  </group>;
}
