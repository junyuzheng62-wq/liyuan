import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
const url=process.env.GRAYBOX_URL||'http://127.0.0.1:5185/liyuan/graybox/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const page=await context.newPage(),errors=[],badAssets=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&/\.(glb|js|css|wasm)/.test(r.url()))badAssets.push(r.url());});mkdirSync('test-results',{recursive:true});
const state=()=>page.evaluate(()=>window.__GRAYBOX_TEST__.state());
const delay=ms=>page.waitForTimeout(ms);
async function aim(point){
 for(let i=0;i<8;i++){
  const s=await state(),dx=point[0]-s.camera[0],dy=point[1]-s.camera[1],dz=point[2]-s.camera[2],yaw=Math.atan2(dx,dz),pitch=Math.atan2(dy,Math.hypot(dx,dz));
  let a=yaw-s.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));const b=pitch-s.pitch;if(Math.abs(a)+Math.abs(b)<.015)return;
  const px=Math.max(-260,Math.min(260,-a/.004)),py=Math.max(-90,Math.min(90,-b/.004));
  await page.mouse.move(530,180);await page.mouse.down();await page.mouse.move(530+px,180+py,{steps:3});await page.mouse.up();await delay(45);
 }
}
async function move(x,z,expected){
 await page.evaluate(()=>window.__GRAYBOX_TEST__.setManual(true));
 let previousDistance=Infinity;
 for(let i=0;i<35;i++){
  const s=await state(),dx=x-s.player[0],dz=z-s.player[2],dist=Math.hypot(dx,dz);
  if(dist<.09){if(expected!==undefined)assert.ok(Math.abs(s.player[1]-expected)<.13,`wrong floor ${s.player}`);return;}
  if(i>5&&Math.abs(previousDistance-dist)<.0001)throw Error(`Stuck ${x},${z}: ${s.player}`);
  previousDistance=dist;await aim([x,s.camera[1],z]);await page.keyboard.down('KeyW');await page.evaluate(n=>window.__GRAYBOX_TEST__.stepInput(n),Math.max(1,Math.min(80,Math.floor(dist/2.15*60))));await page.keyboard.up('KeyW');await delay(30);
 }
 throw Error(`Failed moving to ${x},${z}: ${JSON.stringify(await state())}`);
}
async function interact(id,point){await aim(point);await page.waitForFunction(id=>window.__GRAYBOX_TEST__.state().near===id,id,{timeout:3500});await page.locator('.gb-interaction button').click();await delay(200);}
try{
 await page.goto(url);await page.getByRole('heading',{name:'交织里院',exact:true}).waitFor();await page.getByRole('button',{name:'开启摄像头',exact:true}).click();await page.getByText('未开启摄像头。使用示范地图也能完整进入原型。').waitFor({timeout:12000});
 await page.getByRole('button',{name:'跳过扫描，使用示范地图'}).click();await page.waitForFunction(()=>window.__GRAYBOX_TEST__?.state().time>2);const film=await state();await page.waitForFunction(()=>window.__GRAYBOX_TEST__?.state().time>6);const film2=await state();assert.notDeepEqual(film.adult,film2.adult);assert.notDeepEqual(film.bird,film2.bird);assert.notDeepEqual(film.camera,film2.camera);
 await page.waitForFunction(()=>window.__GRAYBOX_TEST__?.state().mode==='play',{},{timeout:45000});await delay(500);assert.ok(Math.abs((await state()).camera[1]-(await state()).player[1]-1.2)<.01);console.log('Camera rejection fallback, real 3D intro and first-person handoff PASS');
 // First real door interaction, then actual two-finger joystick and camera drag.
 await interact('room-door-0-0',[-5,1.05,5.6]);await delay(700);
 const before=(await state()).player;const joy=await page.locator('.gb-joystick').boundingBox(),cx=joy.x+joy.width/2,cy=joy.y+joy.height/2,cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},{x:620,y:210,id:2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy-30,id:1},{x:640,y:210,id:2}]});await delay(800);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await state();assert.ok(Math.hypot(after.player[0]-before[0],after.player[2]-before[2])>.3);assert.ok(Math.abs(after.yaw-Math.PI)>.03);console.log('Actual simultaneous touch movement + look, operable room door PASS');
 await move(-5,4,0);await interact('mother',[-5.7,1,4.7]);await page.getByRole('button',{name:'好，我来帮忙'}).click();assert.equal((await state()).progress.stage,1);
 await move(-4,3.7);await move(1.5,1.6);await interact('bucket',[1.9,.32,2.6]);assert.ok((await state()).progress.items.includes('水桶'));
 await move(3,1.4);await interact('tap',[3,1.02,2.55]);await page.getByRole('heading',{name:'清水流进铁皮桶'}).waitFor();await page.waitForFunction(()=>window.__GRAYBOX_TEST__.state().progress.stage===3);console.log('Mother dialogue, bucket pickup and timed water interaction PASS');
 await move(4.2,1.3);await interact('aunt',[4.2,1,2.6]);await page.getByRole('button',{name:'我记住了'}).click();
 await move(1.2,1.2);await move(-4,3.7);await move(-5,4.3);await move(-5,6.7);await move(-4.3,6.5);await interact('delivery',[-3.25,.98,6.9]);assert.equal((await state()).progress.stage,4);
 await move(-5,7.4);await interact('bag',[-6.5,.77,6.7]);assert.equal((await state()).progress.stage,5);assert.equal((await state()).progress.memories.length,1);
 await page.getByRole('button',{name:/背包/}).click();await page.getByRole('heading',{name:'背包与记忆'}).waitFor();await page.screenshot({path:'test-results/graybox-memory.png'});await page.getByRole('button',{name:'关闭面板'}).click();console.log('Water delivery, bag pickup, memory inventory and quest completion PASS');
 await move(-5,6.5);await move(-5,4);await move(-4,3);await move(-4,-3.3);await move(-5.8,-3.3);await move(-5.8,-.5);const mid=(await state()).player;
 await page.evaluate(()=>window.__GRAYBOX_TEST__.setManual(false));await delay(1200);assert.ok(Math.abs((await state()).player[1]-mid[1])<.04);
 await move(-5.8,2.7,1.5);await move(-7.4,2.7,1.5);await move(-7.4,-3.2,3);await move(-9,-3.2,3);await move(-9,4.6,3);await move(0,4.6,3);
 await interact('room-door-1-1',[0,4.05,5.6]);await delay(650);await move(0,6.7,3);await move(0,4.6,3);await interact('grandpa',[1,4,4.7]);await page.getByRole('button',{name:'我记住了'}).click();assert.equal((await state()).progress.talked.length,3);
 await aim([-4,3.5,0]);await page.screenshot({path:'test-results/graybox-gallery.png'});await page.getByRole('button',{name:'海鸥指引'}).click();
 await page.getByRole('button',{name:'地图',exact:true}).click();await page.getByRole('img',{name:'里院地图与当前位置'}).waitFor();await page.screenshot({path:'test-results/graybox-map.png'});await page.getByRole('button',{name:'关闭面板'}).click();
 await page.getByRole('button',{name:'暂停',exact:true}).click();const saved=(await state()).player;await page.getByRole('button',{name:'保存并退出'}).click();await page.getByRole('button',{name:'继续上次探索'}).waitFor();await page.reload();await page.getByRole('button',{name:'继续上次探索'}).click();await page.waitForFunction(()=>window.__GRAYBOX_TEST__?.state().mode==='play');await delay(400);const restored=await state();assert.ok(Math.hypot(...restored.player.map((n,i)=>n-saved[i]))<.1);assert.equal(restored.progress.stage,5);assert.equal(restored.progress.talked.length,3);console.log('Upper room + 3 NPCs + map + gull + save/reload/continue PASS');
 await move(-9,4.6,3);await move(-9,-3.2,3);await move(-7.4,-3.2,3);await move(-7.4,2.7,1.5);await move(-5.8,2.7,1.5);await move(-5.8,-3.3,0);await move(-4,-3.3);await move(0,-3.3);await move(0,-11,0);await aim([0,1.2,0]);await page.screenshot({path:'test-results/graybox-street.png'});assert.equal((await state()).respawns,0);console.log('Continuous upstairs / stop / room / downstairs / outdoor street PASS');
 for(const [width,height] of [[844,390],[568,320],[390,664],[320,568]]){
  await page.setViewportSize({width,height});await delay(120);const fits=await page.evaluate(()=>[...document.querySelectorAll('.gb-header button,.gb-joystick,.gb-interaction button')].every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));assert.ok(fits,`Overflow ${width}x${height}`);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(badAssets,[]);writeFileSync('test-results/graybox-report.json',JSON.stringify({cameraDeniedFallback:true,realtimeIntro:true,touchMovementAndLook:true,doors:true,waterQuest:true,threeNPCs:true,stairsAndRooms:true,saveResume:true,layouts:4,errors,badAssets},null,2));console.log('4 viewport controls + console + asset paths PASS');
}finally{await browser.close();}
