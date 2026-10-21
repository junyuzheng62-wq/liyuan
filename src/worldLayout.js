// Metres, feet on floor. Visual stair treads and physical ramps derive from this data.
export const LEVELS = [0.04, 3.16, 6.16];
export const ROOM = { x: 1.66, doorMin: .96, doorMax: 2.36, floor: LEVELS[1] };
export const PROP_BOXES = [
  [-7,0,1.2,1.5,1.5], [1,-4,4,1.8,1.1], [-6,5,1.5,1.4,1.2],
  [4.9,-6.6,1.1,1.1,1.1], [6,4,1.2,1.4,1.2], [4.8,5.8,3,2.2,2.5], [7.4,.7,1.9,.8,1.1],
];
export const STAIRS = [-1,1].flatMap(side=>[0,1].map(floor=>({
  id:`${side<0?'west':'east'}-${floor}`,
  side,floor,innerX:side*6.7,outerX:side*8.15,width:1.3,
  nearZ:-2.5,farZ:-6.15,nearEdge:-1.2,farEdge:-7.45,
  bottom:LEVELS[floor],top:LEVELS[floor+1],mid:(LEVELS[floor]+LEVELS[floor+1])/2,
})));
export function createLayout(){
  const boxes=[], ramps=[], visuals=[];
  const add=(id,p,s,{color='#777f71',visual=false,rotation=[0,0,0],...flags}={})=>{
    const b={id,p,s,rotation,...flags};boxes.push(b);if(visual)visuals.push({...b,c:color});return b;
  };
  const guard=(id,x,y,z,width)=>{
    add(id,[x,y+.5,z],[width,1,.07]);
    for(const h of [.18,1])visuals.push({p:[x,y+h,z],s:[width,.045,.045],c:'#424a42',rotation:[0,0,0]});
    const count=Math.ceil(width/.27);
    for(let i=0;i<=count;i++)visuals.push({p:[x-width/2+i*width/count,y+.55,z],s:[.026,.9,.026],c:'#424a42',rotation:[0,0,0]});
  };
  add('ground',[0,-.11,0],[20,.3,20]);
  // Walls have a real doorway at level two; there is no solid backing behind it.
  add('west-wall',[-10.12,4.6,0],[.24,9.2,20]);
  add('east-wall',[10.12,4.6,0],[.24,9.2,20]);
  add('south-boundary',[0,4.6,10.12],[20.5,9.2,.24],{camera:false});
  add('north-ground',[0,1.5,-10.12],[20.5,3,.24]);
  add('north-third',[0,7.6,-10.12],[20.5,3.2,.24]);
  add('north-left',[-4.645,4.58,-10.12],[11.21,2.84,.24]);
  add('north-right',[6.305,4.58,-10.12],[7.89,2.84,.24]);
  add('door-lintel',[ROOM.x,5.83,-10.12],[1.4,.34,.24]);
  for(const y of [.16,...LEVELS.slice(1)]){
    add(`north-gallery-${y}`,[0,y-.08,-9.3],[20,.16,1.4]);
    for(const side of [-1,1]){
      add(`side-gallery-${side}-${y}`,[side*9.3,y-.08,0],[1.4,.16,20]);
      if(y<.2)continue;
      // Separate rail segments leave a continuous, 1.4m-wide stair landing opening.
      for(const [z,length] of [[-5.65,5.9],[4.4,11.2]])
        add(`rail-${side}-${y}-${z}`,[side*8.62,y+.51,z],[.08,1.02,length]);
      guard(`gallery-end-${side}-${y}`,side*9.3,y,9.95,1.4);
    }
    if(y>.2)add(`north-rail-${y}`,[0,y+.51,-8.62],[17.24,1.02,.08]);
  }
  for(const st of STAIRS){
    for(const [index,x,z0,z1,y0,y1] of [[0,st.innerX,st.nearZ,st.farZ,st.bottom,st.mid],[1,st.outerX,st.farZ,st.nearZ,st.mid,st.top]]){
      ramps.push({id:`${st.id}-ramp-${index}`,x,width:st.width,z0,z1,y0,y1});
      for(let i=0;i<12;i++){
        const t=(i+.5)/12,z=z0+(z1-z0)*t,y=y0+(y1-y0)*(i+1)/12;
        visuals.push({p:[x,y-.08,z],s:[st.width,.16,Math.abs(z1-z0)/12+.005],c:'#a4a38e',rotation:[0,0,0]});
      }
      // Long barriers on both sides follow the ramp, without closing the ends.
      const angle=-Math.atan((y1-y0)/(z1-z0));
      for(const sign of [-1,1]){
        const px=x+sign*(st.width/2+.045),midY=(y0+y1)/2;
        add(`${st.id}-side-${index}-${sign}`,[px,midY+.5,(z0+z1)/2],[.07,1,Math.hypot(z1-z0,y1-y0)],{rotation:[angle,0,0]});
        visuals.push({p:[px,midY+.98,(z0+z1)/2],s:[.055,.055,Math.hypot(z1-z0,y1-y0)],c:'#824c38',rotation:[angle,0,0]});
        for(let i=0;i<=12;i++){const t=i/12;visuals.push({p:[px,y0+(y1-y0)*t+.48,z0+(z1-z0)*t],s:[.035,.95,.035],c:'#414b41',rotation:[0,0,0]});}
      }
    }
    const center=st.side*7.8;
    add(`${st.id}-far-landing`,[st.side*7.45,st.mid-.08,(st.farZ+st.farEdge)/2],[2.9,.16,st.farZ-st.farEdge],{visual:true,color:'#929782'});
    add(`${st.id}-near-landing`,[center,st.top-.08,(st.nearZ+st.nearEdge)/2],[3.6,.16,st.nearEdge-st.nearZ],{visual:true,color:'#929782'});
    guard(`${st.id}-far-guard`,st.side*7.45,st.mid,st.farEdge-.02,2.9);
    // Guard the courtyard-facing landing edges, leaving both flights and gallery open.
    guard(`${st.id}-near-guard`,center,st.top,st.nearEdge+.02,3.6);
  }
  // A sample second-floor room, entered through the existing door position.
  add('room-floor',[ROOM.x,ROOM.floor-.08,-11.85],[3.4,.16,3.7],{visual:true,color:'#9b8466'});
  add('room-left',[ROOM.x-1.8,4.6,-11.9],[.2,2.9,3.8],{visual:true,color:'#c1b497'});
  add('room-right',[ROOM.x+1.8,4.6,-11.9],[.2,2.9,3.8],{visual:true,color:'#c1b497'});
  add('room-back',[ROOM.x,4.6,-13.75],[3.8,2.9,.2],{visual:true,color:'#c7bb9d'});
  add('room-ceiling',[ROOM.x,6.13,-11.9],[3.8,.14,3.9],{visual:true,color:'#aaa084'});
  add('bed',[.65,3.55,-12.7],[.85,.7,1.5],{visual:true,color:'#9a8161'});
  add('desk',[2.7,3.7,-12.95],[.8,1.05,.7],{visual:true,color:'#8c6f51'});
  // The ground props remain, with the one under the east stair moved out of its path.
  PROP_BOXES.forEach(([x,z,w,d,h],i)=>add(`prop-${i}`,[x,h/2,z],[w,h,d]));
  return {boxes,ramps,visuals};
}
export const LAYOUT=createLayout();
