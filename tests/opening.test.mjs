import assert from 'node:assert/strict';
import {sampleOpening} from '../src/opening/timeline.js';
for(const t of [9,15,30,40]){
 const a=sampleOpening('film',t-.00001),b=sampleOpening('film',t);
 assert.ok(Math.hypot(...a.camera.map((v,i)=>v-b.camera[i]))<.01,`Camera discontinuity ${t}`);
 assert.ok(Math.hypot(...a.actor.map((v,i)=>v-b.actor[i]))<.01,`Actor discontinuity ${t}`);
}
const door=sampleOpening('door',40),start=sampleOpening('crossing',40,0);
assert.ok(Math.hypot(...door.camera.map((v,i)=>v-start.camera[i]))<1e-8);assert.equal(start.door,0);assert.equal(start.child,0);
const end=sampleOpening('ready',40,15);assert.equal(end.child,1);assert.equal(end.blend,1);assert.ok(end.door>1.3);assert.deepEqual(end.actor,[0,0,5]);
for(let u=0;u<=15;u+=.1){const p=sampleOpening('crossing',40,u);assert.ok([...p.camera,...p.actor,...p.bird].every(Number.isFinite));}
console.log('Timeline: continuous cameras, actor paths, closed/open gate, adult/child and modern/past endpoints PASS');
