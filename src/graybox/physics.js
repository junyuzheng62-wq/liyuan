import RAPIER from '@dimforge/rapier3d-compat';
import layout from '../../design/blockout/layout.json' with {type:'json'};
let ready;
export const initPhysics=()=>ready??=RAPIER.init();
const HALF=.69, IDENTITY={x:0,y:0,z:0,w:1};
export class GrayboxPhysics{
  constructor(){
    this.world=new RAPIER.World({x:0,y:-16,z:0});this.doors=new Map();
    for(const b of layout.boxes)if(b.collider)this.box(b.id,b.p,b.s);
    for(const r of layout.ramps){
      const points=[];
      for(const x of [r.x-r.width/2,r.x+r.width/2])for(const [z,y] of [[r.z0,r.y0],[r.z1,r.y1]])for(const h of [y-.18,y])points.push(x,h,z);
      this.world.createCollider(RAPIER.ColliderDesc.convexHull(new Float32Array(points))).userData={id:r.id};
      const angle=-Math.atan((r.y1-r.y0)/(r.z1-r.z0));
      for(const side of [-1,1])this.box(`${r.id}-guard-${side}`,[r.x+side*.75,(r.y0+r.y1)/2+.45,(r.z0+r.z1)/2],[.07,.9,Math.hypot(r.z1-r.z0,r.y1-r.y0)],{x:Math.sin(angle/2),y:0,z:0,w:Math.cos(angle/2)});
    }
    for(const door of layout.doors){
      const col=this.box(door.id,[door.p[0]+door.width/2,door.p[1]+door.height/2,door.p[2]],[door.width,door.height,.12]);this.doors.set(door.id,{...door,col,angle:0});
    }
    for(const m of layout.markers.filter(m=>m.kind==='npc'))this.box(m.id,[m.p[0],m.p[1]+.65,m.p[2]],[.42,1.3,.42]);
    this.body=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,HALF+.04,-11));
    this.collider=this.world.createCollider(RAPIER.ColliderDesc.capsule(HALF-.24,.24),this.body);
    this.controller=this.world.createCharacterController(.018);this.controller.enableAutostep(.2,.18,false);this.controller.setSlideEnabled(true);this.controller.enableSnapToGround(.25);this.controller.setMaxSlopeClimbAngle(.65);this.controller.setMinSlopeSlideAngle(.8);
    this.velocityY=0;this.grounded=false;this.accumulator=0;this.respawns=0;this.lastSafe=[0,.04,-11];this.world.step();
  }
  box(id,p,s,rotation=IDENTITY){const c=this.world.createCollider(RAPIER.ColliderDesc.cuboid(...s.map(n=>n/2)).setTranslation(...p).setRotation(rotation));c.userData={id};return c;}
  get position(){const p=this.body.translation();return [p.x,p.y-HALF,p.z];}
  setDoor(id,angle){const d=this.doors.get(id);if(!d)return;d.angle=angle;d.col.setTranslation({x:d.p[0]+Math.cos(angle)*d.width/2,y:d.p[1]+d.height/2,z:d.p[2]-Math.sin(angle)*d.width/2});d.col.setRotation({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)});}
  step(x,z,dt=1/60){
    this.world.timestep=dt;this.velocityY=this.grounded?-1:Math.max(-18,this.velocityY-16*dt);
    this.controller.computeColliderMovement(this.collider,{x:x*dt,y:this.velocityY*dt,z:z*dt});const d=this.controller.computedMovement(),p=this.body.translation();
    this.body.setNextKinematicTranslation({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});this.grounded=this.controller.computedGrounded();this.world.step();
    const feet=this.position;if(this.grounded)this.lastSafe=[...feet];
    if(!feet.every(Number.isFinite)||feet[1]<-4||Math.abs(feet[0])>16||Math.abs(feet[2])>18){this.teleport(this.lastSafe);this.respawns++;}
    return this.position;
  }
  advance(x,z,dt){this.accumulator+=Math.min(dt,.1);while(this.accumulator>=1/60){this.step(x,z);this.accumulator-=1/60;}return this.position;}
  teleport(p){this.body.setTranslation({x:p[0],y:p[1]+HALF,z:p[2]},true);this.body.setNextKinematicTranslation(this.body.translation());this.velocityY=0;this.accumulator=0;this.world.step();}
  // Camera-centre ray: nearest blocking collider wins, including doors and floors.
  visible(from,to,ignoreId){const v={x:to[0]-from[0],y:to[1]-from[1],z:to[2]-from[2]},length=Math.hypot(v.x,v.y,v.z);if(length<.01)return true;
    const ray=new RAPIER.Ray({x:from[0],y:from[1],z:from[2]},{x:v.x/length,y:v.y/length,z:v.z/length});
    const hit=this.world.castRay(ray,Math.max(0,length-.07),true,undefined,undefined,this.collider,undefined,c=>c.userData?.id!==ignoreId);
    return !hit;
  }
  dispose(){this.world.free();}
}
