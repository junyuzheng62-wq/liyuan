import assert from 'node:assert/strict';
import {initPhysics,CourtyardPhysics} from '../src/physics.js';
await initPhysics();
const sim=new CourtyardPhysics();let steps=0,maxChange=0;const trace=[];
function move(x,z,expectedY){
  let previous=sim.position;
  for(let i=0;i<1400;i++){
    const p=sim.position,dx=x-p.x,dz=z-p.z,len=Math.hypot(dx,dz);
    if(len<.065){if(expectedY!==undefined)assert.ok(Math.abs(p.y-expectedY)<.15,`Wrong floor ${JSON.stringify(p)}, expected ${expectedY}`);trace.push({...p});return;}
    const speed=Math.min(3.2,len*20),q=sim.step(dx/len*speed,dz/len*speed);
    maxChange=Math.max(maxChange,Math.abs(q.y-previous.y));assert.ok(Math.abs(q.y-previous.y)<.19,'Unnatural height jump');previous=q;steps++;
  }
  console.log(Array.from({length:sim.controller.numComputedCollisions()},(_,i)=>{const c=sim.controller.computedCollision(i);return {id:c.collider?.userData,normal:c.normal1}}));
  throw new Error(`Stuck toward ${x},${z}: ${JSON.stringify(sim.position)}`);
}
function up(side,floor){
  move(side*6.7,-1.85,floor===0?.04:3.16);
  move(side*6.7,-4.1);const before=sim.position;
  for(let i=0;i<120;i++)sim.step(0,0);
  assert.ok(Math.abs(sim.position.y-before.y)<.03,'Drifts while stopped halfway');
  move(side*6.7,-6.85,(floor===0?1.6:4.66));
  move(side*8.15,-6.85);move(side*8.15,-1.85,floor===0?3.16:6.16);
}
function down(side,floor){
  move(side*8.15,-1.85);move(side*8.15,-6.85,floor===0?1.6:4.66);
  move(side*6.7,-6.85);move(side*6.7,-1.85,floor===0?.04:3.16);
}
try{
 move(-4,2);move(-5.8,-1.3);
 for(let cycle=0;cycle<10;cycle++){
  up(-1,0);move(-9.3,-1.85);move(-9.3,-9.3);move(1.66,-9.3);move(1.66,-12.05,3.16);
  move(1.66,-9.3);move(9.3,-9.3);move(9.3,-1.85);down(1,0);
  move(5,-.9);move(-5,-.9);move(-6.7,-1.3);
  console.log(`Ground → 2F → room → other stairs → ground: ${cycle+1}/10 PASS`);
 }
 up(-1,0);move(-6.7,-1.85);up(-1,1);move(-9.3,-1.85,6.16);move(-9.3,-9.3);move(9.3,-9.3);move(9.3,-1.85);down(1,1);down(1,0);
 move(9.3,-1.85,.16);move(9.3,-9.3,.16);move(0,-9.3,.16);move(0,-7.8,.04);
 assert.equal(sim.respawns,0,'Normal route must not use respawn');
 // Side guards resist walking off a third-floor gallery; vertical filtering prevents floor teleporting.
 move(5,-.9);move(-5,-.9);up(-1,0);move(-9.3,-1.85);move(-9.3,-4);
 for(let i=0;i<90;i++)sim.step(3.2,0);
 assert.ok(sim.position.x<-8.85&&sim.position.y>3,'Crossed gallery guard');
 // Floor/rail ray sweeps use the same collision world as the character.
 const focus={x:-9.3,y:4.3,z:-4};const cam=sim.cameraPosition(focus,{x:-13,y:5,z:-4});
 assert.ok(cam.x>-9.8,'Camera crossed west wall');
 assert.ok(sim.cameraPosition({x:9.3,y:7.3,z:-2},{x:9.3,y:11,z:-2}).y<9.2,'Camera crossed actual roof');
 assert.ok(sim.cameraPosition({x:9.3,y:7.3,z:-2.5},{x:8,y:7.3,z:-2.5}).x>9.05,'Camera crossed red column');
 // Test recovery by injecting a fall only in this isolated unit test.
 sim.body.setTranslation({x:0,y:-8,z:0},true);sim.body.setNextKinematicTranslation(sim.body.translation());sim.step(0,0);
 assert.equal(sim.respawns,1);assert.ok(sim.position.y>-1);
 console.log(JSON.stringify({steps,maxFrameHeightChange:maxChange,thirdFloor:'PASS',pauseOnRamp:'PASS',rail:'PASS',camera:'PASS',recovery:'PASS'}));
}finally{sim.dispose();}
