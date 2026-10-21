import React,{useRef,useState,useCallback,useEffect} from 'react';
import {Canvas} from '@react-three/fiber';
import OpeningScene from './OpeningScene.jsx';
import './opening.css';
import OpeningSound from './OpeningSound.js';
const ACTS=['重返青岛','熟悉又陌生','推开旧院门','穿越回童年'];
export default function Opening({onExplore}){
 const sound=useRef(null);const [muted,setMuted]=useState(false);
 useEffect(()=>()=>sound.current?.dispose(),[]);
 const control=useRef({mode:'title',time:0,cross:0});
 const [beat,setBeat]=useState({mode:'title',act:1,cue:''});
 const onBeat=useCallback(b=>setBeat(b),[]);
 const play=()=>{sound.current??=new OpeningSound();sound.current.start();sound.current.mute(muted);control.current={mode:'film',time:0,cross:0};setBeat({mode:'film',act:1,cue:'我是一只活了很久很久的海鸥。'});};
 const skip=()=>{control.current={mode:'ready',time:40,cross:15};setBeat({mode:'ready',act:4,cue:'我们……真的回来了！'});};
 const open=()=>{if(control.current.mode!=='door')return;control.current.mode='crossing';control.current.cross=0;setBeat({mode:'crossing',act:4,cue:'风里，又传来了熟悉的声音。'});};
 const title=beat.mode==='title',ready=beat.mode==='ready';
 return <main className="opening" data-opening-phase={beat.mode}>
  <Canvas shadows dpr={[1,1.5]} camera={{position:[-12,6.4,25],fov:55,near:.08,far:100}} gl={{antialias:true}} fallback={<p className="opening-fallback">请使用支持 WebGL 的 Safari 或 Chrome 打开游戏。</p>}><OpeningScene control={control} onBeat={onBeat} sound={sound}/></Canvas>
  <div className="opening-vignette"/><div className="paper-grain"/>
  {title?<div className="opening-title"><span>青岛 · 大鲍岛 / 2026</span><h1>里院旧时光</h1><p>一扇门，一只海鸥，一段回家的路。</p><button className="opening-primary" onClick={play}>开始游戏 <b>→</b></button><small>3D 开场 · 建议横屏 · 角色为临时低模模型</small></div>:<>
   <header className="opening-heading"><div><small>里院旧时光</small><h2>0{beat.act} / {ACTS[beat.act-1]}</h2></div><span>{beat.act===4?'约 1996 · 记忆中的里院':'2026 · 重返故乡'}</span></header>
   <button className="opening-audio" aria-label={muted?'打开环境声音':'关闭环境声音'} onClick={()=>{sound.current?.mute(!muted);setMuted(!muted)}}>{muted?'声音 关':'声音 开'}</button>
   {!ready&&<button className="opening-skip" onClick={skip}>跳过开场 ›</button>}
   <div className="opening-captions" aria-live="polite"><small>海鸥</small><p>{beat.cue}</p></div>
   {beat.mode==='door'&&<div className="opening-choice"><button className="opening-primary" onClick={open}>推开门 <small>Open the Door</small><b>→</b></button></div>}
   {ready&&<div className="opening-choice"><button className="opening-primary" onClick={onExplore}>开始探索 <small>Explore</small><b>→</b></button><button className="opening-rewatch" onClick={play}>重新观看开场</button></div>}
  </>}
 </main>;
}
