import React,{useEffect,useMemo,useRef,Suspense} from 'react';
import {useFrame,useLoader} from '@react-three/fiber';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Box,PersonModel,BirdModel} from '../CharacterModels.jsx';
import {GrayboxPhysics,initPhysics} from './physics.js';
import {targetFor} from './progress.js';
import layout from '../../design/blockout/layout.json' with {type:'json'};
const v=new THREE.Vector3(),gaze=new THREE.Vector3();
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const mix=(a,b,t)=>a.map((n,i)=>THREE.MathUtils.lerp(n,b[i],smooth(t)));
export function Label({text,position,size=1.6}){
  const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#233942';x.fillRect(0,0,512,128);x.fillStyle='#f1ede1';x.font='500 40px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;},[text]);
  useEffect(()=>()=>texture.dispose(),[texture]);return <sprite position={position} scale={[size,size/4,1]}><spriteMaterial map={texture} depthTest /></sprite>;
}
function Architecture(){
  const gltf=useLoader(GLTFLoader,`${import.meta.env.BASE_URL}graybox/liyuan-phase1.glb`);
  const batches=useMemo(()=>{gltf.scene.updateMatrixWorld(true);const groups=new Map();gltf.scene.traverse(o=>{if(o.isMesh){const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,geometries:[]});groups.get(key).geometries.push(o.geometry.clone().applyMatrix4(o.matrixWorld));}});return [...groups.values()].map(g=>{const geometry=mergeGeometries(g.geometries,false);g.geometries.forEach(x=>x.dispose());return {geometry,material:g.material};});},[gltf]);
  useEffect(()=>()=>batches.forEach(b=>b.geometry.dispose()),[batches]);return <group name="blender-architecture">{batches.map((b,i)=><mesh key={i} geometry={b.geometry} material={b.material}/>)}</group>;
}
function Resident({marker,near}){
  const arm=useRef();useFrame(({clock})=>{if(arm.current)arm.current.rotation.z=Math.sin(clock.elapsedTime*(marker.id==='aunt'?2:1))*.16;});
  return <group position={marker.p} name={marker.id}><mesh position={[0,.68,0]}><capsuleGeometry args={[.22,.7,4,8]}/><meshLambertMaterial color={near?'#ffe0ac':'#d39a5d'}/></mesh><mesh position={[0,1.33,0]}><sphereGeometry args={[.21,8,6]}/><meshLambertMaterial color="#dbc8aa"/></mesh><group ref={arm} position={[.25,1,0]}><Box p={[0,-.2,0]} s={[.1,.4,.12]} c="#d39a5d"/></group><Label text={marker.label} position={[0,1.8,0]} size={1.2}/></group>;
}
function Bucket({position,water=false}){return <group position={position}><mesh><cylinderGeometry args={[.2,.16,.38,10,1,true]}/><meshLambertMaterial color="#7aa68d" side={THREE.DoubleSide}/></mesh><mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.19,.21,12]}/><meshLambertMaterial color="#b8cac2" side={THREE.DoubleSide}/></mesh>{water&&<mesh position={[0,.13,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.18,12]}/><meshLambertMaterial color="#69b8d3"/></mesh>}</group>;}
function Interactives({state,near,waterUntil}){
  const stream=useRef();const kettle=useRef();useFrame(({clock})=>{if(stream.current){stream.current.visible=performance.now()<waterUntil;stream.current.scale.x=.85+Math.sin(clock.elapsedTime*30)*.15;}if(kettle.current)kettle.current.position.y=1.4+(clock.elapsedTime*.22%1)*.4;});
  return <group>
    {layout.markers.filter(m=>m.kind==='npc').map(m=><Resident key={m.id} marker={m} near={near===m.id}/>)}
    {!state.items.includes('水桶')&&state.stage<4&&<Bucket position={[1.9,.22,2.6]}/>}
    {state.stage>=4&&<Bucket position={[-3.85,.22,6.9]} water/>}
    {!state.items.includes('书包')&&<Box p={[-6.5,.7,6.7]} s={[.38,.4,.18]} c={near==='bag'?'#bef3cb':'#69a67b'}/>}
    <Box p={[3,.96,2.7]} s={[.1,.1,.44]} c={near==='tap'?'#d4ffcc':'#69a67b'}/>
    <mesh ref={stream} position={[3,.74,2.5]} visible={false}><cylinderGeometry args={[.035,.05,.38,6]}/><meshBasicMaterial color="#9ed5e7"/></mesh>
    {near&&layout.markers.find(m=>m.id===near)&&<mesh position={layout.markers.find(m=>m.id===near).p.map((n,i)=>n+(i===1?.4:0))}><sphereGeometry args={[.25,8,6]}/><meshBasicMaterial color="#d9edbe" wireframe/></mesh>}
    <mesh ref={kettle} position={[4.2,1.5,4.7]}><sphereGeometry args={[.1,5,4]}/><meshLambertMaterial color="#d2d9d6" transparent opacity={.4}/></mesh>
    <Label text="公共水池" position={[3,1.9,2.9]} size={1.5}/><Label text="二层外廊" position={[-7.5,4.8,-3.2]} size={1.6}/><Label text="沧口路里院 · 灰盒" position={[0,3,-8.25]} size={2.5}/>
  </group>;
}
const CAPTIONS=['2026年，青岛。你和海鸥走过修缮后的街区。','“跟我来，那个院门……我还记得。”','手掌贴上木门，熟悉的声音渐渐回来了。','街道褪去新装，时间回到童年的清晨。','1980年代，青岛。欢迎回到里院。'];
export default function Scene({mode,control,stateRef,state,near,onNear,onReady,onIntroEnd,onCaption,waterUntil}){
  const engine=useRef(),doorRefs=useRef({}),adult=useRef(),limbs=useRef(),bird=useRef(),wings=useRef(),modern=useRef(),clock=useRef(0),previousMode=useRef(),previousNear=useRef(''),cue=useRef(-1),manual=useRef(false),guidePath=useRef([]),lastGuide=useRef(0);
  const introMaterials=useRef([]),sun=useRef();
  useEffect(()=>{let canceled=false;initPhysics().then(()=>{if(canceled)return;engine.current=new GrayboxPhysics();onReady(engine.current);}).catch(error=>{console.error(error);onReady(null,error);});return()=>{canceled=true;engine.current?.dispose();if(import.meta.env.DEV)delete window.__GRAYBOX_TEST__;};},[onReady]);
  useEffect(()=>{introMaterials.current=[];[adult.current,modern.current].forEach(group=>group?.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;introMaterials.current.push(o.material);}}));return()=>introMaterials.current.forEach(m=>m.dispose());},[]);
  useFrame(({camera,clock:sceneClock},rawDt)=>{
    const sim=engine.current;if(!sim)return;const dt=Math.min(rawDt,.05),t=sceneClock.elapsedTime;
    if(previousMode.current!==mode){previousMode.current=mode;clock.current=0;control.x=control.y=0;control.keys={};previousNear.current='';if(mode==='play'){sim.teleport(stateRef.current.position);control.yaw=stateRef.current.yaw;control.pitch=stateRef.current.pitch;}}
    if(mode==='intro'&&!document.hidden)clock.current+=dt;
    const it=clock.current;
    for(const d of layout.doors){const obj=doorRefs.current[d.id];if(!obj)continue;const open=mode==='intro'&&d.id==='courtyard-door'?smooth((it-8)/3):stateRef.current.doors[d.id]?1:0;const angle=THREE.MathUtils.damp(obj.rotation.y,open*Math.PI/2*(d.id==='courtyard-door'?1:-1),8,dt);obj.rotation.y=angle;sim.setDoor(d.id,angle);}
    if(mode==='scan'||mode==='exit'){camera.position.set(15,12,-19);camera.lookAt(0,1,0);}
    if(mode==='intro'){
      const reduced=stateRef.current.settings.reducedMotion;
      const blend=smooth((it-10)/6),a=it<8?mix([-5,0,-11],[0,0,-8.7],it/8):[0,0,-8.7];adult.current.position.fromArray(a);adult.current.rotation.y=it<4?1.2:0;adult.current.visible=it<16;
      limbs.current.children.forEach((l,i)=>l.rotation.x=it<8?Math.sin(t*8+i*Math.PI)*.3:0);if(it>=8&&it<12)limbs.current.children[3].rotation.x=-1.3*smooth((it-8)/1.5);
      const pos=it<5?mix([4,3.2,-15],[-3,2.4,-12],it/5):it<11?mix([-3,2.4,-12],[0,1.65,-10],(it-5)/6):it<16?mix([0,1.65,-10],[0,1.2,-5],(it-11)/5):mix([0,1.2,-5],[-5,1.24,6.7],(it-16)/4);
      const look=it<11?mix([-3,1,-10],[0,1.2,-8],it/11):it<16?[0,1.2,1]:mix([0,1.2,1],[-5,1.24,5],(it-16)/4);
      camera.position.fromArray(reduced?mix([0,2,-13],[-5,1.24,6.7],it/20):pos);camera.lookAt(...look);
      modern.current.visible=blend<.99;introMaterials.current.forEach(m=>m.opacity=1-blend);
      bird.current.position.set(it<8?a[0]+1:1.1,1.9+Math.sin(t*2)*.1,it<8?a[2]+1:-6.5);bird.current.rotation.y=0;
      sun.current.color.set(blend>.5?'#ffedd0':'#e4edf3');
      const index=Math.min(4,Math.floor(it/4));if(index!==cue.current){cue.current=index;onCaption(CAPTIONS[index]);}
      if(it>=20)onIntroEnd();
    }else{adult.current.visible=false;modern.current.visible=false;}
    if(mode==='play'){
      const k=control.keys;let x=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0)+control.x,z=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0)+control.y;const len=Math.max(1,Math.hypot(x,z));x/=len;z/=len;
      const velocity=control.locked?[0,0]:[(-x*Math.cos(control.yaw)+z*Math.sin(control.yaw))*2.15,(x*Math.sin(control.yaw)+z*Math.cos(control.yaw))*2.15];
      const p=manual.current?sim.position:sim.advance(...velocity,dt);control.position=p;
      camera.position.set(p[0],p[1]+1.2,p[2]);camera.rotation.order='YXZ';camera.rotation.set(control.pitch,control.yaw+Math.PI,0);camera.getWorldDirection(gaze);
      if(control.guideUntil!==lastGuide.current){lastGuide.current=control.guideUntil;const target=layout.markers.find(m=>m.id===targetFor(stateRef.current));const needsUpper=target.p[1]>1&&p[1]<2.7;const needsDown=target.p[1]<1&&p[1]>2.7;guidePath.current=needsUpper?layout.routes.stairs.slice(0,-1).map(pt=>[pt[0],pt[1]+1.65,pt[2]]):needsDown?[...layout.routes.stairs].reverse().slice(1).map(pt=>[pt[0],pt[1]+1.65,pt[2]]):[];
        // Leave home through its doorway before flying to the shared courtyard.
        if(p[2]>5.5&&p[0]<-2.5)guidePath.current.unshift([-5,p[1]+1.65,5.4],[-5,p[1]+1.65,4.3]);
        if(target.id==='delivery'||target.id==='bag')guidePath.current.push([-5,1.65,4.5],[-5,1.65,5.4]);
        guidePath.current.push([target.p[0],target.p[1]+1.8,target.p[2]]);
      }
      const guide=performance.now()<control.guideUntil&&guidePath.current.length;
      const follow=[p[0]+Math.sin(control.yaw+.95)*3.2,p[1]+1.9,p[2]+Math.cos(control.yaw+.95)*3.2];const goal=guide?guidePath.current[0]:follow;
      v.fromArray(goal);v.y+=Math.sin(t*2)*.08;bird.current.position.lerp(v,1-Math.exp(-dt*(guide?1.5:2.7)));if(guide&&bird.current.position.distanceTo(v)<.25&&guidePath.current.length>1)guidePath.current.shift();bird.current.rotation.y=control.yaw;const separation=bird.current.position.distanceTo(camera.position);if(separation<1.65){v.copy(bird.current.position).sub(camera.position);if(v.lengthSq()<.01)v.set(1,1,0);bird.current.position.copy(camera.position).add(v.normalize().multiplyScalar(1.65));}
      let best=null,bestDot=.91;const eye=camera.position.toArray();
      if(!control.locked){const candidates=[...layout.markers.filter(m=>!(m.id==='bucket'&&(stateRef.current.items.includes('水桶')||stateRef.current.stage>=4))&&!(m.id==='bag'&&stateRef.current.items.includes('书包'))).map(m=>({...m,point:[m.p[0],m.p[1]+(m.kind==='npc'?1:.1),m.p[2]]})),...layout.doors.map(d=>{const a=sim.doors.get(d.id).angle;return {id:d.id,label:stateRef.current.doors[d.id]?'关门':'开门',action:'door',point:[d.p[0]+Math.cos(a)*d.width/2,d.p[1]+1.05,d.p[2]-Math.sin(a)*d.width/2]};})];
      for(const candidate of candidates){v.fromArray(candidate.point).sub(camera.position);const dist=v.length(),dot=v.normalize().dot(gaze);if(dist<=2&&dot>bestDot&&sim.visible(eye,candidate.point,candidate.action==='door'?candidate.id:candidate.kind==='npc'?candidate.id:candidate.id==='tap'?'tap-post':undefined)){best=candidate;bestDot=dot;}}}
      const key=best?`${best.id}|${best.label}`:'';if(previousNear.current!==key){previousNear.current=key;onNear(best);}
    }
    wings.current.children.forEach((w,i)=>w.rotation.z=(i?1:-1)*(.15+Math.sin(t*8)*.35));
    if(import.meta.env.DEV)window.__GRAYBOX_TEST__={state:()=>({mode,time:it,player:sim.position,camera:camera.position.toArray(),yaw:control.yaw,pitch:control.pitch,near:previousNear.current.split('|')[0],grounded:sim.grounded,respawns:sim.respawns,adult:adult.current.position.toArray(),bird:bird.current.position.toArray(),doors:Object.fromEntries([...sim.doors].map(([id,d])=>[id,d.angle])),progress:stateRef.current}),setManual:value=>manual.current=value,stepInput:n=>{const k=control.keys;let x=(k.KeyD?1:0)-(k.KeyA?1:0)+control.x,z=(k.KeyW?1:0)-(k.KeyS?1:0)+control.y;const len=Math.max(1,Math.hypot(x,z));for(let i=0;i<n;i++)sim.step((-x*Math.cos(control.yaw)+z*Math.sin(control.yaw))/len*2.15,(x*Math.sin(control.yaw)+z*Math.cos(control.yaw))/len*2.15);return sim.position;},physics:sim};
  });
  return <><color attach="background" args={['#c6d5d8']}/><fog attach="fog" args={['#c6d5d8',30,65]}/><ambientLight intensity={1.1}/><hemisphereLight args={['#d4e2e6','#889394',1.2]}/><directionalLight ref={sun} position={[-8,15,-4]} intensity={2} color="#ffedd0"/>
  <Suspense fallback={null}><Architecture/></Suspense>
  {layout.doors.map(d=><group key={d.id} ref={el=>doorRefs.current[d.id]=el} position={d.p}><Box p={[d.width/2,d.height/2,0]} s={[d.width,d.height,.12]} c={near===d.id?'#e1f6d1':'#91bfbb'}/><Box p={[d.width-.12,1,-.09]} s={[.04,.13,.07]} c="#4e6768"/></group>)}
  <Interactives state={state} near={near} waterUntil={waterUntil}/>
  <PersonModel group={adult} limbs={limbs} adult/><BirdModel group={bird} wings={wings}/>
  <group ref={modern}><Box p={[-6,1.7,-9]} s={[3,3.4,.4]} c="#697b83"/><Label text="COFFEE" position={[-6,2.7,-9.4]} size={2}/><Box p={[6,1.7,-9]} s={[3,3.4,.4]} c="#a5b6b4"/><Label text="文创商店" position={[6,2.7,-9.4]} size={2}/></group>
  </>;
}
