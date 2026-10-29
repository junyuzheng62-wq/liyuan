export const SAVE_KEY='connect-liyuan-graybox-v1';
export const INITIAL={stage:0,items:[],memories:[],talked:[],doors:{},position:[-5,.04,6.7],yaw:Math.PI,pitch:0,settings:{quality:'low',sensitivity:1,reducedMotion:false}};
export const TASKS=['与院里的母亲聊聊','到公共水池旁拿起水桶','对准公共水龙头接水','把水送到家里的小桌上','拿上床边的书包','清晨准备好了 · 自由探索院落与二层'];
export function loadSave(storage=localStorage){try{const s=JSON.parse(storage.getItem(SAVE_KEY));if(!s||s.version!==1)return null;const p=s.state;if(!p||!Array.isArray(p.position)||p.position.length!==3||!p.position.every(Number.isFinite)||Math.abs(p.position[0])>12||p.position[1]<-.2||p.position[1]>3.3||p.position[2]<-13.5||p.position[2]>7.7)return null;return {...INITIAL,...p,stage:Math.max(0,Math.min(5,Math.floor(Number(p.stage)||0))),yaw:Number.isFinite(p.yaw)?p.yaw:Math.PI,pitch:Number.isFinite(p.pitch)?Math.max(-1.15,Math.min(1.15,p.pitch)):0,items:Array.isArray(p.items)?p.items.filter(x=>['水桶','一桶清水','书包'].includes(x)):[],memories:Array.isArray(p.memories)?p.memories.filter(x=>x==='铁皮水桶 · 清晨的院落'):[],talked:Array.isArray(p.talked)?p.talked.filter(x=>['mother','aunt','grandpa'].includes(x)):[],doors:p.doors&&typeof p.doors==='object'?p.doors:{},settings:{quality:p.settings?.quality==='standard'?'standard':'low',sensitivity:Number.isFinite(p.settings?.sensitivity)?Math.max(.4,Math.min(1.8,p.settings.sensitivity)):1,reducedMotion:!!p.settings?.reducedMotion}};}catch{return null;}}
export function saveProgress(state,storage=localStorage){try{storage.setItem(SAVE_KEY,JSON.stringify({version:1,state}));return true;}catch{return false;}}
const add=(list,value)=>list.includes(value)?list:[...list,value];
export function act(state,id){
  if(id==='talk_mother')return {state:{...state,stage:Math.max(1,state.stage),talked:add(state.talked,'mother')},text:'先拿水池旁的铁皮桶，接一桶水送到家里的小桌上。慢慢走，别着急。'};
  if(id==='talk_aunt')return {state:{...state,talked:add(state.talked,'aunt')},text:state.stage<3?'水龙头就在这儿。先拿桶，再接水，大家轮着用。':'这桶水接得真好。抬头看看，楼上的爷爷正等着你打招呼呢。'};
  if(id==='talk_grandpa')return {state:{...state,talked:add(state.talked,'grandpa')},text:'上楼累不累？以前这条外廊，谁家烧了好菜，整个院子都闻得到。下楼记得扶好栏杆。'};
  if(id==='pickup_bucket'){
    if(state.stage===0)return {state,text:'先和母亲打个招呼，问问今天要帮什么忙。'};
    if(state.items.includes('水桶'))return {state,text:'水桶已经拿在手里了。'};
    if(state.stage>3)return {state,text:'水已经送到家里了。'};
    return {state:{...state,stage:Math.max(2,state.stage),items:add(state.items,'水桶')},text:'拿起了铁皮水桶。对准水龙头就能接水。'};
  }
  if(id==='fill_bucket'){
    if(state.stage>=4)return {state,text:'水桶已经送回家。清凉的水洗去了手上的灰尘。',effect:'water'};
    if(!state.items.includes('水桶'))return {state,text:'先拿起旁边的水桶，再来接水。'};
    if(state.items.includes('一桶清水'))return {state,text:'水已经接满，可以送回家里的小桌。'};
    return {state:{...state,stage:3,items:add(state.items,'一桶清水')},text:'一桶清水接好了。把它送到家里的小桌上。',effect:'water'};
  }
  if(id==='deliver_water'){
    if(state.stage>=4)return {state,text:'水桶好好地放在这里。'};
    if(!state.items.includes('一桶清水'))return {state,text:'这里可以放水桶。先去公共水龙头接水吧。'};
    return {state:{...state,stage:4,items:state.items.filter(x=>!['水桶','一桶清水'].includes(x)),memories:add(state.memories,'铁皮水桶 · 清晨的院落')},text:'把水桶放在桌边，解锁记忆「清晨的院落」。床边还有你的书包。'};
  }
  if(id==='pickup_bag'){
    if(state.stage<4)return {state,text:'先帮母亲把水接回来，再拿书包。'};
    return {state:{...state,stage:5,items:add(state.items,'书包')},text:'背上书包。清晨的准备完成了！你还可以去二层和爷爷聊聊，或走出院门看看。'};
  }
  return {state,text:''};
}
export function targetFor(state){return ['mother','bucket','tap','delivery','bag','grandpa'][state.stage];}
