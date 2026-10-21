import {useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {movementVelocity} from './movement.js';

export default function PlayerMotion({boy,input,targets,onNear,onStatus}){
  const engine=useRef(null),previous=useRef(''),look=useRef(new THREE.Vector3()),smooth=useRef(new THREE.Vector3());
  const initialized=useRef(false),manualTest=useRef(false);
  useEffect(()=>{
    let cancelled=false;
    import('./physics.js').then(async({initPhysics,CourtyardPhysics})=>{
      await initPhysics();if(cancelled)return;
      engine.current=new CourtyardPhysics();onStatus('ready');
    }).catch(error=>{console.error('Physics initialization failed',error);if(!cancelled)onStatus('error');});
    return()=>{cancelled=true;engine.current?.dispose();engine.current=null;if(import.meta.env.DEV)delete window.__LIYUAN_TEST__;};
  },[onStatus]);
  useFrame(({camera},delta)=>{
    const physics=engine.current;if(!physics||!boy.current)return;
    const {x:vx,z:vz,length:len}=movementVelocity(input);
    const p=manualTest.current?physics.position:physics.advance(vx,vz,delta);
    boy.current.position.set(p.x,p.y,p.z);
    if(len>.08&&!input.locked)boy.current.rotation.y=Math.atan2(vx,vz);
    const height=input.inspect?3.8:1.1,distance=input.inspect?9:5.4;
    // Focus is in world space and follows the character's actual floor height.
    look.current.copy(physics.cameraPosition({x:p.x,y:p.y+1.1,z:p.z},{x:p.x,y:p.y+height,z:p.z}));
    const wish=new THREE.Vector3(p.x+Math.sin(input.yaw)*distance*Math.cos(input.pitch),p.y+height+Math.sin(input.pitch)*distance,p.z+Math.cos(input.yaw)*distance*Math.cos(input.pitch));
    // Lower the preferred camera when a ceiling/roof is directly overhead.
    const headroom=physics.cameraPosition({x:p.x,y:p.y+1.1,z:p.z},{x:p.x,y:wish.y,z:p.z});
    wish.y=headroom.y;
    // First shorten the arm; then sweep the smoothed arm as well, so interpolation cannot cross a wall.
    const safe=physics.cameraPosition(look.current,wish);
    if(!initialized.current){smooth.current.copy(safe);initialized.current=true;}
    else smooth.current.lerp(safe,1-Math.exp(-Math.min(delta,.1)*9));
    const final=physics.cameraPosition(look.current,smooth.current);
    camera.position.set(final.x,final.y,final.z);camera.lookAt(look.current);
    camera.userData.followTarget??=new THREE.Vector3();
    camera.userData.followTarget.set(p.x,p.y+.9,p.z);
    const near=targets.filter(t=>Math.abs(p.y-t.pos[1])<1.1&&Math.hypot(p.x-t.pos[0],p.z-t.pos[2])<2.25)
      .sort((a,b)=>Math.hypot(p.x-a.pos[0],p.z-a.pos[2])-Math.hypot(p.x-b.pos[0],p.z-b.pos[2]))[0];
    if(previous.current!==(near?.id||'')){previous.current=near?.id||'';onNear(near||null);}
    if(import.meta.env.DEV){
      window.__LIYUAN_STATE__={player:[p.x,p.z],height:p.y,grounded:physics.grounded,respawns:physics.respawns,yaw:input.yaw,camera:camera.position.toArray(),bird:boy.current.parent.getObjectByName('seagull')?.position.toArray()};
      // Deterministic integration tests use the production controller, never a floor teleport.
      window.__LIYUAN_TEST__={physics,focus:look.current.toArray(),
        setManual:value=>{manualTest.current=value;physics.accumulator=0;},
        stepInput:count=>{const v=movementVelocity(input);for(let i=0;i<count;i++)physics.step(v.x,v.z);return physics.position;}
      };
    }
  });
  return null;
}
