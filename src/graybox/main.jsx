import React,{Component,Suspense,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas} from '@react-three/fiber';
import Scene from './Scene.jsx';
import Scanner from './Scanner.jsx';
import TouchControls from './TouchControls.jsx';
import Map from './Map.jsx';
import {INITIAL,TASKS,act,loadSave,saveProgress} from './progress.js';
import layout from '../../design/blockout/layout.json' with {type:'json'};
import './style.css';
class ErrorBoundary extends Component{state={error:null};static getDerivedStateFromError(error){return {error};}render(){return this.state.error?<div className="gb-fatal">场景暂时无法加载。请检查网络后重试。<button onClick={()=>location.reload()}>重新加载</button></div>:this.props.children;}}
function App(){
  const [saved,setSaved]=useState(()=>loadSave()),[state,setState]=useState(()=>structuredClone(INITIAL)),stateRef=useRef(state);stateRef.current=state;
  const [mode,setMode]=useState('scan'),[ready,setReady]=useState(false),[failure,setFailure]=useState(''),[near,setNear]=useState(null),[modal,setModal]=useState(null),[toast,setToast]=useState(''),[caption,setCaption]=useState(''),[waterUntil,setWaterUntil]=useState(0),toastTimer=useRef(),waterTimer=useRef(),engine=useRef(),audio=useRef();
  const control=useMemo(()=>({x:0,y:0,keys:{},yaw:Math.PI,pitch:0,position:[...INITIAL.position],locked:true,sensitivity:1,guideUntil:0}),[]);
  control.locked=mode!=='play'||!!modal||!ready;control.sensitivity=state.settings.sensitivity;
  const update=useCallback(next=>{stateRef.current=next;setState(next);},[]);
  const notify=useCallback(text=>{setToast(text);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),4500);},[]);
  const snapshot=useCallback(()=>({...stateRef.current,position:[...control.position],yaw:control.yaw,pitch:control.pitch}),[control]);
  const persist=useCallback(()=>{const s=snapshot();const ok=saveProgress(s);if(ok)setSaved(s);return ok;},[snapshot]);
  useEffect(()=>{if(mode!=='play')return;const timer=setInterval(persist,5000);const save=()=>persist();window.addEventListener('pagehide',save);return()=>{clearInterval(timer);window.removeEventListener('pagehide',save);};},[mode,persist]);
  useEffect(()=>()=>{clearTimeout(toastTimer.current);clearTimeout(waterTimer.current);audio.current?.close();},[]);
  const onReady=useCallback((sim,error)=>{engine.current=sim;setReady(!!sim);if(error)setFailure('物理系统加载失败，请刷新重试。');},[]);
  const start=()=>{update(structuredClone(INITIAL));setMode('intro');};
  const enter=useCallback(()=>{update({...stateRef.current,doors:{...stateRef.current.doors,'courtyard-door':true}});setMode('play');},[update]);
  const continueGame=()=>{const latest=loadSave();if(latest){update(latest);setMode('play');}else notify('没有找到可用存档，请使用示范地图开始。');};
  function waterSound(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audio.current??=new C();audio.current.resume();const count=audio.current.sampleRate*2.2,buffer=audio.current.createBuffer(1,count,audio.current.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<count;i++)data[i]=(Math.random()*2-1)*.1;const source=audio.current.createBufferSource(),filter=audio.current.createBiquadFilter(),gain=audio.current.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1000;gain.gain.setValueAtTime(.13,audio.current.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.current.currentTime+2.2);source.connect(filter).connect(gain).connect(audio.current.destination);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};}catch{/* Audio is optional; water feedback also has visible geometry. */}}
  function interact(){if(control.locked||!near)return;
    if(near.action==='door'){const d=layout.doors.find(d=>d.id===near.id);const p=engine.current.position;if(state.doors[d.id]&&Math.hypot(p[0]-d.p[0]-.68,p[2]-d.p[2])<1.15){notify('先后退一点，再关门，别夹到自己。');return;}update({...state,doors:{...state.doors,[d.id]:!state.doors[d.id]}});notify(state.doors[d.id]?'门轻轻关上了。':'门开了，可以走过去。');return;}
    const result=act(state,near.action);
    if(near.action.startsWith('talk_')){setModal({type:'dialog',name:near.label,text:result.text,action:near.action});return;}
    if(result.effect==='water'){setWaterUntil(performance.now()+2600);waterSound();setModal({type:'water'});clearTimeout(waterTimer.current);waterTimer.current=setTimeout(()=>{update(result.state);setModal(null);notify(result.text);},2400);}
    else{update(result.state);notify(result.text);}
  }
  const open=type=>{setNear(null);setModal({type});};
  const close=()=>setModal(null);
  const confirmDialog=()=>{const result=act(stateRef.current,modal.action);update(result.state);close();notify('对话结束，可以继续走动。');};
  const setting=(key,value)=>update({...state,settings:{...state.settings,[key]:value}});
  return <main className="graybox"><ErrorBoundary><Canvas camera={{position:[15,12,-19],fov:70,near:.06,far:80}} dpr={state.settings.quality==='low'?1:[1,1.5]} gl={{antialias:false,powerPreference:'high-performance'}}><Suspense fallback={null}><Scene mode={mode} control={control} stateRef={stateRef} state={state} near={near?.id} onNear={setNear} onReady={onReady} onIntroEnd={enter} onCaption={setCaption} waterUntil={waterUntil}/></Suspense></Canvas></ErrorBoundary>
    {(mode==='scan'||mode==='exit')&&<Scanner key={mode} onStart={start} saved={saved} onContinue={continueGame}/>}
    {mode==='intro'&&<><div className="gb-film-top"><span>一扇门，一段旧时光</span><button onClick={enter}>跳过开场</button></div><div className="gb-caption">{caption||'等待场景加载…'}</div></>}
    {mode==='play'&&<><TouchControls control={control} locked={control.locked} onInteract={interact}/><header className="gb-header"><div className="gb-task"><span>交织里院 <b>07:00 · 清晨</b></span><strong>{TASKS[state.stage]}</strong></div><nav aria-label="探索工具"><button onClick={()=>open('map')}>地图</button><button onClick={()=>open('bag')}>背包 <em>{state.items.length}</em></button><button onClick={()=>{control.guideUntil=performance.now()+35000;notify('跟着海鸥走。目标：'+TASKS[state.stage]);}}>海鸥指引</button><button onClick={()=>open('pause')}>暂停</button></nav></header><div className={`gb-crosshair ${near?'active':''}`}/>{near&&!modal&&<div className="gb-interaction"><span>{near.label}</span><button onClick={interact}>{near.action==='door'?near.label:near.action.startsWith('talk_')?'交谈':'互动'} <small>E</small></button></div>}<footer className="gb-footer">PHASE 01 / 里院灰盒 <span>WASD 移动 · 拖动观察 · E 互动</span></footer>{state.items.includes('水桶')&&!modal&&<div className="gb-carry">{state.items.includes('一桶清水')?'▰ 一桶清水':'▱ 提着水桶'}</div>}</>}
    {modal&&<div className={`gb-modal-backdrop ${modal.type==='water'?'water':''}`}><section className={`gb-modal ${modal.type==='dialog'?'dialog':''}`} role="dialog" aria-modal="true" aria-label={modal.type}><button className="gb-close" onClick={modal.type==='water'?undefined:close} disabled={modal.type==='water'} aria-label="关闭面板">×</button>
      {modal.type==='dialog'&&<><span className="gb-kicker">院里的人</span><h2>{modal.name}</h2><p>{modal.text}</p><div className="gb-options"><button className="primary" onClick={confirmDialog}>{modal.action==='talk_mother'?'好，我来帮忙':'我记住了'}</button><button onClick={confirmDialog}>再去院里走走</button></div></>}
      {modal.type==='water'&&<><h2>清水流进铁皮桶</h2><div className="gb-fill"><span/></div><p>水声轻轻响着……</p></>}
      {modal.type==='map'&&<><h2>里院记忆地图</h2><Map position={control.position} stage={state.stage}/><p className="gb-map-task">当前目标：{TASKS[state.stage]}</p></>}
      {modal.type==='bag'&&<><h2>背包与记忆</h2><div className="gb-inventory">{state.items.length?state.items.map(x=><div key={x}><span>▧</span>{x}</div>):<p>背包空空的。生活中的小物件，会慢慢装进来。</p>}</div><h3>收集的记忆</h3>{state.memories.length?state.memories.map(x=><p className="gb-memory" key={x}>{x}<small>一桶清水，唤醒了整座院子。</small></p>):<p>帮母亲接水，留下第一段记忆。</p>}<small>已交谈的居民：{state.talked.length} / 3</small></>}
      {modal.type==='pause'&&<><span className="gb-kicker">歇一会儿</span><h2>院子一直在这里</h2><label>画质<select value={state.settings.quality} onChange={e=>setting('quality',e.target.value)}><option value="low">省电 · 低分辨率</option><option value="standard">标准</option></select></label><label>镜头灵敏度<input type="range" min=".4" max="1.8" step=".1" value={state.settings.sensitivity} onChange={e=>setting('sensitivity',Number(e.target.value))}/></label><label className="check"><input type="checkbox" checked={state.settings.reducedMotion} onChange={e=>setting('reducedMotion',e.target.checked)}/>减少开场镜头运动</label><p className="gb-muted">每 5 秒自动保存。当前版本只开放清晨的里院流程。</p><div className="gb-options"><button className="primary" onClick={close}>继续探索</button><button onClick={()=>notify(persist()?'进度已保存。':'浏览器暂时无法保存，请检查存储设置。')}>保存进度</button><button onClick={()=>{if(persist()){close();setMode('exit');notify('已保存。随时可以继续探索。');}else notify('保存失败，暂未退出。请检查浏览器存储设置。');}}>保存并退出</button></div><a className="gb-legacy" href="../">打开《里院旧时光》旧版</a></>}
    </section></div>}
    {toast&&<div className="gb-toast" role="status">{toast}</div>}
    {!ready&&mode!=='scan'&&mode!=='exit'&&<div className="gb-loading">{failure||'正在走进里院…'}</div>}
    <div className="gb-orientation">横过手机，可以看见更宽的院子</div>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
