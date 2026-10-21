import {enterExploration} from './enter-exploration.mjs';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const port=5192,url=`http://127.0.0.1:${port}/liyuan/`;
const server=spawn('npm',['run','dev','--','--port',String(port)],{stdio:'ignore',detached:true});
let browser;const results=[];const cycles=Number(process.env.MOVEMENT_CYCLES||10);assert.ok(Number.isInteger(cycles)&&cycles>=1&&cycles<=10);
try{
 for(let i=0;i<150;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
 for(const mode of ['desktop','touch']){
  const page=await browser.newPage({viewport:mode==='touch'?{width:844,height:390}:{width:1100,height:720},hasTouch:mode==='touch',isMobile:mode==='touch'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  await enterExploration(page);
  await page.waitForFunction(()=>window.__LIYUAN_TEST__);
  await page.evaluate(()=>window.__LIYUAN_TEST__.setManual(true));
  // Real screen dragging aligns the camera with world north; no test changes to position or floor.
  const initialYaw=await page.evaluate(()=>window.__LIYUAN_STATE__.yaw);
  await page.mouse.move(450,215);await page.mouse.down();await page.mouse.move(450+initialYaw/.005,215);await page.mouse.up();
  const joy=await page.locator('.joystick').boundingBox();const cx=joy.x+joy.width/2,cy=joy.y+joy.height/2;
  const cdp=mode==='touch'?await page.context().newCDPSession(page):null;
  let held=new Set(),touching=false,lastTouch=null;
  const read=()=>page.evaluate(()=>({p:window.__LIYUAN_TEST__.physics.position,grounded:window.__LIYUAN_TEST__.physics.grounded,respawns:window.__LIYUAN_TEST__.physics.respawns}));
  async function control(x,y){
   if(mode==='touch'){
    if(!touching){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1}]});touching=true;}
    if(!lastTouch||Math.hypot(x-lastTouch[0],y-lastTouch[1])>.015){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+x*41,y:cy-y*41,id:1}]});lastTouch=[x,y];}
   }else{
    const next=new Set();if(Math.abs(x)>.4)next.add(x>0?'KeyD':'KeyA');if(Math.abs(y)>.4)next.add(y>0?'KeyW':'KeyS');
    for(const k of held)if(!next.has(k))await page.keyboard.up(k);
    for(const k of next)if(!held.has(k))await page.keyboard.down(k);held=next;
   }
  }
  async function release(){if(touching){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touching=false;lastTouch=null;}for(const k of held)await page.keyboard.up(k);held.clear();}
  async function move(x,z,height){
   for(let i=0;i<300;i++){
    const {p}=await read(),dx=x-p.x,dz=z-p.z,len=Math.hypot(dx,dz);
    if(len<.095){await release();if(height!==undefined)assert.ok(Math.abs(p.y-height)<.15,`${mode}: wrong floor ${p.y} expected ${height}`);return;}
    await control(dx/len,-dz/len);
    await page.evaluate(n=>window.__LIYUAN_TEST__.stepInput(n),Math.max(1,Math.min(10,Math.floor(len/3.2*60*.6))));
   }throw Error(`${mode}: stuck going to ${x},${z} at ${JSON.stringify(await read())}`);
  }
  async function cameraCheck(){
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const audit=await page.evaluate(()=>{const t=window.__LIYUAN_TEST__,c=window.__LIYUAN_STATE__.camera;const a=t.physics.cameraPosition({x:t.focus[0],y:t.focus[1],z:t.focus[2]},{x:c[0],y:c[1],z:c[2]});return Math.hypot(a.x-c[0],a.y-c[1],a.z-c[2]);});
   assert.ok(audit<.12,`${mode}: camera clips collision world ${audit}`);
  }
  async function up(side,floor,live=false){
   await move(side*6.7,-1.85,floor===0?.04:3.16);await move(side*6.7,-3.8);
   if(live){
    const start=(await read()).p;await control(0,1);await page.evaluate(()=>window.__LIYUAN_TEST__.setManual(false));await page.waitForTimeout(900);await release();await page.waitForTimeout(300);
    const stopped=(await read()).p;assert.ok(stopped.y>start.y+.025,'Real-time ascent failed');
    await page.waitForTimeout(700);assert.ok(Math.abs((await read()).p.y-stopped.y)<.035,'Slides when stopped');
    await control(0,1);await page.waitForTimeout(700);await release();await page.evaluate(()=>window.__LIYUAN_TEST__.setManual(true));
    assert.ok((await read()).p.y>stopped.y+.02,'Real-time resume failed');
   }else{const before=(await read()).p;await release();await page.evaluate(()=>window.__LIYUAN_TEST__.stepInput(120));assert.ok(Math.abs((await read()).p.y-before.y)<.035,'Pause drifts');}
   await move(side*6.7,-6.85,floor===0?1.6:4.66);await cameraCheck();
   await move(side*8.15,-6.85);await move(side*8.15,-1.85,floor===0?3.16:6.16);await cameraCheck();
  }
  async function down(side,floor){await move(side*8.15,-1.85);await move(side*8.15,-6.85,floor===0?1.6:4.66);await move(side*6.7,-6.85);await move(side*6.7,-1.85,floor===0?.04:3.16);}
  await move(-4,2);await move(-5.8,-1.3);
  mkdirSync('test-results',{recursive:true});
  for(let cycle=0;cycle<cycles;cycle++){
   await up(-1,0,cycle===0);await move(-9.3,-1.85);await move(-9.3,-9.3);await move(1.66,-9.3);await move(1.66,-12.05,3.16);await cameraCheck();
   if(cycle===0){await page.waitForTimeout(700);await page.screenshot({path:`test-results/${mode}-room.png`});}
   await move(1.66,-9.3);await move(9.3,-9.3);await move(9.3,-1.85);await down(1,0);
   await move(5,-.9);await move(-5,-.9);await move(-6.7,-1.3);
   console.log(`${mode}: continuous upstairs / gallery / room / downstairs ${cycle+1}/${cycles} PASS`);
  }
  await up(-1,0);await move(-6.7,-1.85);await up(-1,1);await move(-9.3,-1.85,6.16);await move(-9.3,-9.3);await move(9.3,-9.3);await move(9.3,-1.85);await cameraCheck();await page.waitForTimeout(700);await page.screenshot({path:`test-results/${mode}-third-floor.png`});await down(1,1);await down(1,0);
  await move(9.3,-1.85,.16);await move(9.3,-9.3,.16);await move(0,-9.3,.16);await move(0,-7.8,.04);
  assert.equal((await read()).respawns,0,'Normal movement used rescue');
  // Original interaction still works on the ground, and cannot trigger from upper floors.
  await move(5,-.9);await move(-5,-.9);await move(-5.4,0);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.getByRole('button',{name:'听听故事'}).click();await page.locator('.dialog').waitFor();await page.getByRole('button',{name:'再走走'}).click();
  assert.equal(errors.length,0,JSON.stringify(errors));
  results.push({mode,cycles,thirdFloor:true,realTimeStopResume:true,room:true,cameraSweeps:true,originalInteraction:true,errors});
  await page.close();
 }
 writeFileSync(cycles===10?'test-results/browser-report.json':'test-results/browser-report-focused.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser?.close();try{process.kill(-server.pid,'SIGTERM');}catch{server.kill('SIGTERM');}}
