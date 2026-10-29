import assert from 'node:assert/strict';
import {GrayboxPhysics,initPhysics} from '../../src/graybox/physics.js';
import {INITIAL,act,loadSave,saveProgress} from '../../src/graybox/progress.js';
await initPhysics();const p=new GrayboxPhysics();let steps=0,maxRise=0;
function move(x,z,y){for(let i=0;i<1500;i++){const prev=p.position,dx=x-prev[0],dz=z-prev[2],len=Math.hypot(dx,dz);if(len<.06){if(y!==undefined)assert.ok(Math.abs(p.position[1]-y)<.13,`Height at ${x},${z}: ${p.position}`);return;}const v=Math.min(2.15,len*15),next=p.step(dx/len*v,dz/len*v);maxRise=Math.max(maxRise,Math.abs(next[1]-prev[1]));assert.ok(Math.abs(next[1]-prev[1])<.16);steps++;}throw Error(`Stuck toward ${x},${z}; now ${p.position}`);}
try{
 for(let i=0;i<180;i++)p.step(0,2.15);assert.ok(p.position[2]<-8.2,'Closed gate did not block entry');
 assert.equal(p.visible([0,1.2,-9],[0,1.2,-7]),false,'Interacted through closed gate');
 for(const [id] of p.doors)p.setDoor(id,Math.PI/2*(id==='courtyard-door'?1:-1));
 move(0,0,0);assert.equal(p.visible([0,1.2,-9],[0,1.2,-7]),true);
 for(let cycle=0;cycle<10;cycle++){
  move(-4,0);move(-4,-3.3);move(-5.8,-3.3);move(-5.8,-.5);
  const stopped=p.position;for(let i=0;i<120;i++)p.step(0,0);assert.ok(Math.abs(p.position[1]-stopped[1])<.03,'Slides while stopped');
  move(-5.8,2.7,1.5);move(-7.4,2.7,1.5);move(-7.4,-3.2,3);move(-9,-3.2,3);move(-9,4.6,3);move(0,4.6,3);move(0,6.7,3);move(0,4.6,3);
  move(0,4.15,3);move(6.8,4.15,3);move(6.8,-4.6,3);move(-9,-4.6,3);move(-9,-3.2,3);move(-7.4,-3.2,3);move(-7.4,2.7,1.5);move(-5.8,2.7,1.5);move(-5.8,-3.3,0);move(-4,-3.3,0);move(-4,0,0);
  console.log(`Graybox stairs + galleries + room + return: ${cycle+1}/10 PASS`);
 }
 move(0,0);move(0,-11,0);assert.equal(p.respawns,0);
 assert.equal(p.visible([-4,1.2,4.8],[-4,1.2,6.4]),false,'Room front wall does not occlude interaction');
 assert.equal(p.visible([0,1.2,4.7],[0,4.2,4.7]),false,'Upper floor does not occlude interaction');
 let state=structuredClone(INITIAL);const blocked=act(state,'fill_bucket');assert.equal(blocked.state.stage,0);
 for(const id of ['talk_mother','pickup_bucket','fill_bucket','deliver_water','pickup_bag','talk_aunt','talk_grandpa'])state=act(state,id).state;
 assert.equal(state.stage,5);assert.deepEqual(state.items,['书包']);assert.equal(state.memories.length,1);assert.equal(state.talked.length,3);
 state=act(state,'deliver_water').state;assert.equal(state.memories.length,1,'Repeated interaction duplicates memory');
 const storage={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};assert.equal(saveProgress(state,storage),true);assert.deepEqual(loadSave(storage).items,['书包']);storage.value='bad JSON';assert.equal(loadSave(storage),null);
 console.log(JSON.stringify({steps,maxRise,closedDoor:true,occlusion:true,threeNPCs:true,waterQuest:true,save:true,respawns:p.respawns}));
}finally{p.dispose();}
