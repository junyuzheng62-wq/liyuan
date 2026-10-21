import React, {useLayoutEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {buildArchitecture} from './architectureData.js';

// Architectural details share one instanced draw, including the weathering patches.
function Clothes({position,color,index}){
  const ref=useRef(),fabric=useRef();
  const vectors=useMemo(()=>[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()],[]);
  useFrame(({clock,camera},dt)=>{
    ref.current.rotation.x=Math.sin(clock.elapsedTime*1.1+index)*.055;
    const target=camera.userData.followTarget;
    let blocks=false;
    if(target){
      const [line,point,nearest]=vectors;
      line.copy(target).sub(camera.position);ref.current.getWorldPosition(point);point.y-=.47;
      const t=nearest.copy(point).sub(camera.position).dot(line)/Math.max(line.lengthSq(),.001);
      nearest.copy(camera.position).addScaledVector(line,Math.max(0,Math.min(1,t)));
      blocks=t>0&&t<1.1&&nearest.distanceTo(point)<.85;
    }
    fabric.current.opacity=THREE.MathUtils.damp(fabric.current.opacity,blocks?.12:1,12,dt);
    fabric.current.depthWrite=fabric.current.opacity>.97;
  });
  return <group position={position} ref={ref}><mesh position={[0,-.47,0]} castShadow><boxGeometry args={[index%3===0?1.1:.62,.92,.025]}/><meshStandardMaterial ref={fabric} color={color} roughness={1} transparent/></mesh><mesh position={[0,.02,0]}><boxGeometry args={[.09,.13,.06]}/><meshStandardMaterial color="#a38858"/></mesh></group>;
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
