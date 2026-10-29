import {spawn,execFileSync} from 'node:child_process';
const production=process.argv.includes('--production'),port=production?4216:5197;
const url=`http://127.0.0.1:${port}/liyuan/graybox/`;
if(!production)execFileSync('node',['tests/graybox/physics.mjs'],{stdio:'inherit'});
const server=spawn('npm',['run',production?'preview':'dev','--','--port',String(port),'--strictPort'],{stdio:'ignore',detached:true});
try{
 let available=false;for(let i=0;i<150;i++){try{if((await fetch(url)).ok){available=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
 if(!available)throw Error('Preview server failed to start');
 await new Promise((resolve,reject)=>{const p=spawn('node',[production?'tests/graybox/production.mjs':'tests/graybox/browser.mjs'],{stdio:'inherit',env:{...process.env,GRAYBOX_URL:url}});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(`Browser tests exited ${code}`)));});
}finally{try{process.kill(-server.pid,'SIGTERM');}catch{server.kill();}}
