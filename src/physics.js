import RAPIER from '@dimforge/rapier3d-compat';
import {LAYOUT} from './worldLayout.js';
import {buildArchitecture} from './architectureData.js';
import * as THREE from 'three';
let ready;
export function initPhysics(){return ready??=RAPIER.init();}
const HEIGHT=.79, IDENTITY={x:0,y:0,z:0,w:1};
function rotation([x,y,z]){
  const sx=Math.sin(x/2),cx=Math.cos(x/2),sy=Math.sin(y/2),cy=Math.cos(y/2),sz=Math.sin(z/2),cz=Math.cos(z/2);
  return {x:sx*cy*cz+cx*sy*sz,y:cx*sy*cz-sx*cy*sz,z:cx*cy*sz+sx*sy*cz,w:cx*cy*cz-sx*sy*sz};
}
export class CourtyardPhysics{
  constructor(){
    this.world=new RAPIER.World({x:0,y:-18,z:0});this.static=[];
    for(const b of LAYOUT.boxes){
      const collider=this.world.createCollider(RAPIER.ColliderDesc.cuboid(...b.s.map(v=>v/2)).setTranslation(...b.p).setRotation(rotation(b.rotation)).setFriction(.8));
      collider.userData={id:b.id,camera:b.camera!==false};this.static.push(collider);
    }
    for(const r of LAYOUT.ramps){
      const points=[];
      for(const x of [r.x-r.width/2,r.x+r.width/2])for(const [z,y] of [[r.z0,r.y0],[r.z1,r.y1]])for(const h of [y-.18,y])points.push(x,h,z);
      const desc=RAPIER.ColliderDesc.convexHull(new Float32Array(points));
      if(!desc)throw new Error('Invalid ramp '+r.id);
      const collider=this.world.createCollider(desc);collider.userData={id:r.id,camera:true};this.static.push(collider);
    }
    // Camera-only triangles match every roof, column, window and brace that is rendered.
    // They do not obstruct the character with decorative seams or duplicate stair treads.
    const vertices=[],indices=[],v=new THREE.Vector3();
    const faces=[0,2,1,1,2,3,4,5,6,5,7,6,0,1,4,1,5,4,2,6,3,3,6,7,0,4,2,2,4,6,1,3,5,3,7,5];
    for(const box of buildArchitecture()){
      const base=vertices.length/3,q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...box.r));
      for(const x of [-.5,.5])for(const y of [-.5,.5])for(const z of [-.5,.5]){
        v.set(x*box.s[0],y*box.s[1],z*box.s[2]).applyQuaternion(q).add(new THREE.Vector3(...box.p));vertices.push(v.x,v.y,v.z);
      }
      for(let i=0;i<faces.length;i+=3)indices.push(base+faces[i],base+faces[i+2],base+faces[i+1]);
    }
    const visualCollider=this.world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(vertices),new Uint32Array(indices)));
    visualCollider.userData={id:'architectural-camera-mesh',camera:true,character:false};
    this.body=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,HEIGHT+.08,5));
    this.collider=this.world.createCollider(RAPIER.ColliderDesc.capsule(.52,.27),this.body);
    this.controller=this.world.createCharacterController(.018);
    this.controller.setSlideEnabled(true);this.controller.enableAutostep(.21,.15,false);
    this.controller.setMaxSlopeClimbAngle(.7);this.controller.setMinSlopeSlideAngle(.8);this.controller.enableSnapToGround(.3);
    this.velocityY=0;this.grounded=false;this.accumulator=0;this.respawns=0;this.lastSafe={x:0,y:.08,z:5};
    this.world.step();
  }
  get position(){const p=this.body.translation();return {x:p.x,y:p.y-HEIGHT,z:p.z};}
  step(x,z,dt=1/60){
    this.world.timestep=dt;
    this.velocityY=this.grounded?-1:Math.max(-20,this.velocityY-18*dt);
    this.controller.computeColliderMovement(this.collider,{x:x*dt,y:this.velocityY*dt,z:z*dt},undefined,undefined,c=>c.userData?.character!==false);
    const d=this.controller.computedMovement(),p=this.body.translation();
    this.body.setNextKinematicTranslation({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});
    this.grounded=this.controller.computedGrounded();this.world.step();
    const feet=this.position;
    if(this.grounded&&Math.abs(feet.z)>7.7&&Math.abs(feet.x)<9.7)this.lastSafe={...feet};
    if(!Number.isFinite(feet.y)||feet.y<-4||Math.abs(feet.x)>30||Math.abs(feet.z)>30)this.respawn();
    return this.position;
  }
  advance(x,z,delta){
    this.accumulator+=Math.min(delta,.1);
    while(this.accumulator>=1/60){this.step(x,z);this.accumulator-=1/60;}
    return this.position;
  }
  respawn(){
    const p=this.lastSafe;this.body.setTranslation({x:p.x,y:p.y+HEIGHT+.03,z:p.z},true);this.body.setNextKinematicTranslation(this.body.translation());this.velocityY=0;this.accumulator=0;this.respawns++;this.world.step();
  }
  cameraPosition(focus,desired){
    const v={x:desired.x-focus.x,y:desired.y-focus.y,z:desired.z-focus.z};
    const hit=this.world.castShape(focus,IDENTITY,v,new RAPIER.Ball(.22),.03,1,true,undefined,undefined,this.collider,undefined,c=>c.userData?.camera!==false);
    const t=hit?Math.max(0,hit.time_of_impact-.015):1;
    return {x:focus.x+v.x*t,y:focus.y+v.y*t,z:focus.z+v.z*t};
  }
  dispose(){this.world.free();}
}
