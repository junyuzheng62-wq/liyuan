import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const port=5196,url=`http://127.0.0.1:${port}/liyuan/`;
const server=spawn('npm',['run','dev','--','--port',String(port)],{stdio:'ignore',detached:true});let browser;
try{
 for(let i=0;i<150;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.getByRole('heading',{name:'里院旧时光',exact:true}).waitFor();await page.waitForFunction(()=>window.__OPENING_TEST__);
 assert.equal(await page.locator('.joystick').count(),0,'Gameplay controls leaked into film');
 await page.getByRole('button',{name:'开始游戏'}).tap();
 const pose=()=>page.evaluate(()=>window.__OPENING_TEST__.pose());
 await page.waitForFunction(()=>window.__OPENING_TEST__.state().time>2);const first=await pose();
 await page.waitForFunction(()=>window.__OPENING_TEST__.state().time>5);const moved=await pose();
 assert.ok(Math.abs(moved.adult[0]-first.adult[0])>.2,'Actor did not walk');assert.ok(Math.hypot(...moved.camera.map((v,i)=>v-first.camera[i]))>.2,'Camera did not move');assert.notDeepEqual(first.bird,moved.bird);assert.equal(moved.sound.state,'running','Web Audio did not resume after gesture');
 mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/opening-act1.png'});console.log('Act 1: title, start, moving 3D adult, bird and camera PASS');
 await page.waitForFunction(()=>window.__OPENING_TEST__.state().time>26,{},{timeout:70000});const stopped=await pose();assert.ok(stopped.bird[1]<1.5,'Bird did not perch');
 await page.screenshot({path:'test-results/opening-act2.png'});console.log('Act 2: modern street, stop, orbit and perch PASS');
 await page.getByRole('button',{name:'推开门'}).waitFor({timeout:60000});const closed=await pose();assert.equal(closed.door,0);assert.equal(await page.getByRole('button',{name:'开始探索'}).count(),0);
 await page.waitForTimeout(1200);assert.equal((await page.evaluate(()=>window.__OPENING_TEST__.state())).time,40,'Door wait auto-advanced');
 await page.getByRole('button',{name:'推开门'}).tap();
 await page.waitForFunction(()=>window.__OPENING_TEST__.state().cross>1&&window.__OPENING_TEST__.state().cross<2,{},{timeout:10000});const pushing=await pose();assert.ok(pushing.door>.05);assert.ok(pushing.armPush<-.7,'No push action');
 await page.screenshot({path:'test-results/opening-door.png'});console.log('Act 3: explicit click, animated hand push and hinged wood door PASS');
 await page.waitForFunction(()=>window.__OPENING_TEST__.state().cross>6.2&&window.__OPENING_TEST__.state().cross<7.5,{},{timeout:20000});const dissolve=await pose();assert.ok(dissolve.adultOpacity>0&&dissolve.adultOpacity<1);assert.ok(dissolve.childOpacity>0&&dissolve.childOpacity<1);assert.ok(dissolve.pastOpacity>.3);assert.equal(dissolve.birdId,first.birdId);assert.ok(dissolve.sound.mix>.3,'Ambient mix did not transition');
 await page.getByRole('button',{name:'开始探索'}).waitFor({timeout:25000});await page.waitForTimeout(200);const past=await pose();assert.equal(past.adultVisible,false);assert.equal(past.childVisible,true);assert.equal(past.pastOpacity,1);assert.ok(past.door>1.3);
 await page.screenshot({path:'test-results/opening-past.png'});console.log('Act 4: actual courtyard materials, adult/child dissolve, same bird and Explore gate PASS');
 await page.getByRole('button',{name:'开始探索'}).tap();await page.waitForFunction(()=>window.__LIYUAN_STATE__,{},{timeout:45000});assert.equal(await page.locator('.opening').count(),0);
 const before=await page.evaluate(()=>window.__LIYUAN_STATE__.player);const box=await page.locator('.joystick').boundingBox();const cdp=await page.context().newCDPSession(page);const x=box.x+box.width/2,y=box.y+box.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-37,id:1}]});await page.waitForTimeout(900);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await page.evaluate(()=>window.__LIYUAN_STATE__.player);assert.ok(Math.hypot(after[0]-before[0],after[1]-before[1])>.1,'Game handoff cannot move');console.log('Explore handoff: existing Rapier game and real touch movement PASS');
 await page.reload();await page.getByRole('button',{name:'开始游戏'}).tap();await page.getByRole('button',{name:'跳过开场'}).tap();await page.getByRole('button',{name:'开始探索'}).waitFor();
 await page.getByRole('button',{name:'重新观看开场'}).tap();await page.getByRole('button',{name:'跳过开场'}).tap();await page.getByRole('button',{name:'开始探索'}).waitFor();
 await page.getByRole('button',{name:'关闭环境声音'}).tap();assert.equal((await pose()).sound.muted,true);
 for(const [width,height] of [[844,390],[568,320],[390,664],[320,568]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(200);
  const fit=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('.opening button')].map(x=>x.getBoundingClientRect().toJSON())}));assert.ok(fit.sw<=fit.w&&fit.buttons.every(r=>r.x>=0&&r.y>=0&&r.right<=fit.w&&r.bottom<=fit.h));
 }
 assert.deepEqual(errors,[]);writeFileSync('test-results/opening-report.json',JSON.stringify({fullRealtimePlayback:true,title:true,adultAndBirdMotion:true,doorClickAndPush:true,environmentAndAgeTransition:true,exploreAndTouchMovement:true,skipAndReplay:true,mobileLayouts:4,errors},null,2));console.log('Skip, replay, four mobile layouts and console errors PASS');
}finally{await browser?.close();try{process.kill(-server.pid,'SIGTERM');}catch{server.kill('SIGTERM');}}
