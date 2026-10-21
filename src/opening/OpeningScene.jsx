import React,{useRef,useMemo,useEffect} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Box,PersonModel,BirdModel} from '../CharacterModels.jsx';
import Courtyard from '../Courtyard.jsx';
import {sampleOpening,FILM_END,CROSS_END,smooth} from './timeline.js';

function Sign({text,position,width=2.6,color='#e6decb',ink='#4b5b54'}){
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(0,0,512,128);c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.font='600 44px serif';c.fillText(text,256,66,490);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;return t;},[text,color,ink]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group position={position}><Box s={[width,.7,.16]} c="#6c705e"/><mesh position={[0,0,.09]}><planeGeometry args={[width-.06,.62]}/><meshStandardMaterial map={texture} roughness={1}/></mesh></group>;
}
function ModernStreet(){
 return <group name="2026-commercial-street">
  <Box p={[0,-.16,18]} s={[34,.3,24]} c="#a6aaa2"/>
  {[-8,-4,4,8].map((x,i)=><group key={x}>
   <Box p={[x,3.7,9]} s={[3.8,7.4,1.8]} c={i%2?'#d3d0be':'#b9bcad'}/>
   <Box p={[x,1.5,10]} s={[2.9,2.9,.14]} c="#536b68"/>
   <Box p={[x,1.5,10.1]} s={[.07,2.9,.06]} c="#d1c8ad"/>
   <Box p={[x,4.9,10]} s={[1.2,1.7,.12]} c="#67817d"/>
   <Box p={[x,7.5,9.4]} s={[4,.16,2.8]} c="#9c5e45" rotation={[.1,0,0]}/>
   <Sign text={['里院文创','咖啡 COFFEE','街角书店','青岛记忆'][i]} position={[x,3.35,10.2]} width={3.1}/>
   <Box p={[x,.23,11]} s={[2.4,.4,.65]} c="#737f69"/>
   {[0,1,2].map(j=><mesh key={j} position={[x-.7+j*.7,.65,11]}><icosahedronGeometry args={[.4,0]}/><meshStandardMaterial color="#7f956c"/></mesh>)}
  </group>)}
  {[-1,1].map(side=><group key={side} position={[side*12,0,18]}><Box p={[0,3.5,0]} s={[1.4,7,14]} c="#c4c2ad"/>{[0,3,6].map((z,i)=><Box key={i} p={[-side*.78,2,z-3]} s={[.08,2.8,1.8]} c="#667e78"/>)}</group>)}
  <Sign text="大鲍岛 · 老街" position={[0,4.15,10]} width={3}/>
  <Box p={[-2.8,.5,13.7]} s={[.3,1,.3]} c="#88795d"/><Box p={[-2.3,.45,13]} s={[1.5,.14,.55]} c="#8e7960"/><Box p={[-2.8,.2,13]} s={[.1,.4,.45]} c="#4e594d"/><Box p={[-1.8,.2,13]} s={[.1,.4,.45]} c="#4e594d"/>
 </group>;
}
function Gate({door,light}){
 return <group name="old-courtyard-gate">
  <Box p={[-1.35,1.9,10]} s={[.65,3.8,.7]} c="#9b9d87"/>
  <Box p={[1.35,1.9,10]} s={[.65,3.8,.7]} c="#9b9d87"/>
  <Box p={[0,3.5,10]} s={[3.3,.38,.85]} c="#a77754"/>
  <Sign text="里 院" position={[0,3.2,10.42]} width={1.4} color="#b6a786"/>
  <group ref={door} position={[-.91,0,10.08]}>
   <Box p={[.91,1.52,0]} s={[1.82,3.04,.16]} c="#586e5b"/>
   {[0,.3,.6,.9,1.2,1.5,1.8].map(x=><Box key={x} p={[x,1.52,.095]} s={[.027,3.02,.025]} c="#465a49"/>)}
   <Box p={[1.48,1.45,.16]} s={[.1,.15,.08]} c="#b1a06c"/>
  </group>
  <mesh ref={light} position={[0,1.5,9.98]}><planeGeometry args={[1.8,3]}/><meshBasicMaterial color="#f4d89c" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide}/></mesh>
 </group>;
}
function Extra({position,index,past=false,control}){
 const rig=useRef(),limbs=useRef();
 useFrame(({clock})=>{if(!rig.current||!limbs.current)return;const t=clock.elapsedTime;const travel=past?0:Math.sin(t*.19+index)*1.1;rig.current.position.set(position[0]+travel,position[1],position[2]);rig.current.rotation.y=past?(index%2?-.8:.8):index%2?1.57:-1.57;rig.current.scale.setScalar(.8);limbs.current.children.forEach((l,i)=>l.rotation.x=past?(i>1?-.65+Math.sin(t*2+index)*.15:0):Math.sin(t*3+i*Math.PI)*.22);});
 return <PersonModel group={rig} limbs={limbs} adult/>;
}
function Steam(){const group=useRef();useFrame(({clock})=>{group.current.children.forEach((m,i)=>{const f=(clock.elapsedTime*.25+i*.3)%1;m.position.y=1.2+f*.9;m.position.x=7+Math.sin(f*4+i)*.12;m.scale.setScalar(.11+f*.15);m.material.opacity=(1-f)*.18;});});return <group ref={group}>{[0,1,2].map(i=><mesh key={i} position={[7,1.2,.7]}><icosahedronGeometry args={[1,0]}/><meshBasicMaterial color="#f0e6cc" transparent opacity={.12} depthWrite={false}/></mesh>)}</group>;}
function materials(group){const set=new Set();group?.traverse(o=>{if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.transparent=true;set.add(m);}}});return [...set];}
function fade(list,value){for(const m of list){m.opacity=value;m.depthWrite=value>.97;}}

export default function OpeningScene({control,onBeat,sound}){
 const modern=useRef(),past=useRef(),adult=useRef(),child=useRef(),adultLimbs=useRef(),childLimbs=useRef(),head=useRef(),bird=useRef(),wings=useRef(),door=useRef(),gold=useRef(),sun=useRef(),ambient=useRef();
 const cached=useRef(null),lastKey=useRef(''),idle=useRef(0);
 const {camera,scene,size}=useThree();
 useEffect(()=>{camera.fov=size.width<size.height?68:55;camera.updateProjectionMatrix();},[camera,size.width,size.height]);
 useEffect(()=>{if(import.meta.env.DEV){window.__OPENING_TEST__={state:()=>({...control.current}),pose:()=>({adult:adult.current.position.toArray(),adultVisible:adult.current.visible,childVisible:child.current.visible,adultOpacity:cached.current?.adult[0]?.opacity,childOpacity:cached.current?.child[0]?.opacity,armPush:adultLimbs.current.children[3].rotation.x,birdId:bird.current.uuid,bird:bird.current.position.toArray(),door:door.current.rotation.y,camera:camera.position.toArray(),sound:sound.current?.snapshot(),pastOpacity:cached.current?.past[0]?.opacity})};}return()=>{if(import.meta.env.DEV)delete window.__OPENING_TEST__;};},[camera,control]);
 useFrame((_,rawDelta)=>{
  const c=control.current,dt=document.hidden?0:Math.min(rawDelta,.25);idle.current+=dt;
  if(c.mode==='film'){c.time=Math.min(FILM_END,c.time+dt);if(c.time===FILM_END)c.mode='door';}
  if(c.mode==='crossing'){c.cross=Math.min(CROSS_END,c.cross+dt);if(c.cross===CROSS_END)c.mode='ready';}
  const p=sampleOpening(c.mode,c.time,c.cross),t=idle.current;
  if(!cached.current)cached.current={modern:materials(modern.current),past:materials(past.current),adult:materials(adult.current),child:materials(child.current)};
  modern.current.visible=p.blend<.999;past.current.visible=p.blend>.001;
  fade(cached.current.modern,1-p.blend);fade(cached.current.past,p.blend);
  adult.current.visible=p.child<.999;child.current.visible=p.child>.001;
  fade(cached.current.adult,1-p.child);fade(cached.current.child,p.child);
  for(const rig of [adult.current,child.current]){rig.position.set(...p.actor);rig.rotation.y=p.heading;}
  head.current.rotation.y=p.head;
  for(const ref of [adultLimbs,childLimbs])ref.current.children.forEach((l,i)=>{l.rotation.x=p.walking?Math.sin(t*6+i*Math.PI)*.32:Math.sin(t*.8)*.018;});
  adultLimbs.current.children[3].rotation.x-=p.push*1.35;
  bird.current.position.lerp(new THREE.Vector3(...p.bird),1-Math.exp(-dt*3));
  bird.current.rotation.y=p.landed?-.4:p.heading;
  wings.current.children.forEach((w,i)=>w.rotation.z=(i?1:-1)*(p.landed?.08:.18+Math.sin(t*7)*.4));
  door.current.rotation.y=p.door;
  gold.current.material.opacity=c.mode==='crossing'?Math.sin(Math.PI*Math.min(1,c.cross/10))*.24:0;
  camera.position.set(...p.camera);camera.lookAt(new THREE.Vector3(...p.look));
  scene.background.set('#c3cece').lerp(new THREE.Color('#cad7cf'),p.blend);
  scene.fog.color.copy(scene.background);ambient.current.intensity=.75+p.blend*.1;
  sun.current.color.set('#f1eee0').lerp(new THREE.Color('#ffe2aa'),p.blend);
  if(c.mode==='ready'||c.mode==='crossing')sun.current.color.lerp(new THREE.Color('#ffffff'),smooth((c.cross-10)/5));
  sun.current.intensity=1.6+p.blend*.5;
  sound.current?.blend(p.blend);
  const key=`${c.mode}-${p.act}-${p.cue}`;
  if(key!==lastKey.current){lastKey.current=key;onBeat({mode:c.mode,act:p.act,cue:p.cue});}
 });
 return <>
  <color attach="background" args={['#c3cece']}/><fog attach="fog" args={['#c3cece',32,70]}/>
  <ambientLight ref={ambient} intensity={.75}/><hemisphereLight args={['#e8ecd9','#9d8c68',1.2]}/>
  <directionalLight ref={sun} position={[-7,15,8]} intensity={1.6} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={28} shadow-camera-bottom={-14} shadow-camera-far={70}/>
  <group ref={modern}><ModernStreet/>{[[-5,0,17],[4,0,16.5],[7,0,13.5],[-7,0,12.5]].map((p,i)=><Extra key={i} position={p} index={i} control={control}/>)}</group>
  <group ref={past}><Courtyard/>{[[-4,0,-1],[5.5,0,1],[-2.5,0,-4]].map((p,i)=><Extra key={i} position={p} index={i} past control={control}/>)}<Steam/></group>
  <Gate door={door} light={gold}/>
  <PersonModel group={adult} limbs={adultLimbs} head={head} adult/>
  <PersonModel group={child} limbs={childLimbs}/>
  <BirdModel group={bird} wings={wings}/>
 </>;
}
