import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const port=4212,url=`http://127.0.0.1:${port}/liyuan/`;
const server=spawn('npm',['run','preview','--','--port',String(port)],{stdio:'ignore',detached:true});let browser;
try{
 for(let i=0;i<150;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:390,height:664},hasTouch:true,isMobile:true});const errors=[],failedAssets=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&/\.(js|css|wasm)(\?|$)/.test(r.url()))failedAssets.push(r.url());});
 await page.goto(url);await page.getByRole('button',{name:'走进旧时光'}).click({timeout:45000});
 assert.equal(await page.evaluate(()=>typeof window.__LIYUAN_TEST__),'undefined','Test hooks leaked into production');
 for(const [width,height] of [[390,664],[844,390]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(300);
  const layout=await page.evaluate(()=>({game:document.querySelector('main').getBoundingClientRect().toJSON(),controls:[...document.querySelectorAll('.joystick,.actions,.overview')].map(x=>x.getBoundingClientRect().toJSON()),webgl:!!document.querySelector('canvas').getContext('webgl2')}));
  assert.ok(layout.webgl);assert.ok(Math.abs(layout.game.height-height)<1);assert.ok(layout.controls.every(r=>r.x>=0&&r.y>=0&&r.right<=width&&r.bottom<=height));
  console.log(`Production /liyuan/: ${width}x${height}, WebGL + WASM + controls PASS`);
 }
 await page.getByRole('button',{name:'看看整座里院'}).click();await page.waitForTimeout(600);await page.getByRole('button',{name:'回到男孩身后'}).click();
 mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/production-mobile.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);console.log('Production asset paths, initialization, overview toggle and hidden test hooks PASS');
}finally{await browser?.close();try{process.kill(-server.pid,'SIGTERM');}catch{server.kill('SIGTERM');}}
