"""Metres, Unity coordinates (X right, Y up, Z north). No historical scale claim.
Single blockout source for Blender visuals, Unity colliders, markers and test routes.
"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
boxes, ramps, doors, markers = [], [], [], []
colors = {'building':'#c4c8cb','blocked':'#5d6269','entry':'#a5d6d3','interactive':'#69a67b','npc':'#d39a5d','walk':'#849db0','closed':'#aa6b68'}
def box(id,p,s,kind='building',collider=True,visible=True):
    boxes.append(dict(id=id,p=p,s=s,kind=kind,collider=collider,visible=visible))
def rail(id,p,s):
    box(id,p,s,'blocked',True,False)
    along_x=s[0]>s[2]; length=s[0] if along_x else s[2]
    bar=[s[0],.06,s[2]]
    box(id+'-top',[p[0],p[1]+s[1]/2-.03,p[2]],bar,'blocked',False)
    count=max(1,int(length/.8))
    for n in range(count+1):
        offset=(n/count-.5)*length
        box(id+'-post-'+str(n),[p[0]+(offset if along_x else 0),p[1],p[2]+(0 if along_x else offset)],[.055,s[1],.055],'blocked',False)
def facade(id,x,z,width,y=0):
    gap=1.4
    for sign in [-1,1]:
        box(id+str(sign),[x+sign*(width+gap)/4,y+1.4,z],[(width-gap)/2,2.8,.18])
    box(id+'-lintel',[x,y+2.55,z],[gap,.5,.18])
def door(id,x,y,z):
    doors.append(dict(id=id,p=[x-.68,y,z],width=1.36,height=2.2,angle=0))
def marker(id,kind,p,label,action):
    markers.append(dict(id=id,kind=kind,p=p,label=label,action=action))
box('street',[0,-.16,-11],[26,.3,6],'blocked')
box('courtyard-ground',[0,-.16,0],[20,.3,16],'walk')
# Boundaries enclose the small Phase 1 test street, without a false usable road.
for x in [-13,13]:box('street-end-'+str(x),[x,.6,-11],[.2,1.2,6],'closed')
box('street-south-boundary',[0,.6,-14],[26,1.2,.2],'closed')
for x in [-10,10]:box('outer-wall-'+str(x),[x,3,0],[.2,6,16])
box('outer-north',[0,3,8],[20,6,.2])
for x in [-5.7,5.7]:box('outer-south-'+str(x),[x,3,-8],[8.6,6,.2])
box('gate-lintel',[0,4.2,-8],[2.8,3.6,.3])
for x in [-1.5,1.5]:box('gate-passage-'+str(x),[x,1.4,-6.8],[.2,2.8,2.4])
door('courtyard-door',0,0,-8)
for x in [-1.04,1.04]:box('gate-jamb-'+str(x),[x,1.2,-8],[.72,2.4,.3])
# Four galleries. A stairwell is intentionally left open through the slab.
for id,p,s in [('north',[0,2.91,4.6],[19.6,.18,1.8]),('south',[0,2.91,-4.6],[19.6,.18,1.8]),('west',[-9,2.91,0],[1.6,.18,7.4]),('east',[6.8,2.91,0],[1.8,.18,7.4])]:
    box('gallery-'+id,p,s,'walk')
rail('north-gallery-rail',[-1.1,3.48,3.72],[14.04,.96,.08])
rail('south-gallery-rail',[0,3.48,-3.72],[10,.96,.08])
rail('east-gallery-rail',[5.92,3.48,0],[.08,.96,7.4])
rail('west-gallery-rail',[-8.12,3.48,.6],[.08,.96,6])
# Three ground rooms and two upper rooms with 1.4 m openings.
for level in [0,1]:
    y=level*3
    for i,x in enumerate([-5,0,5]):
        facade(f'room-front-{level}-{i}',x,5.6,5,y)
        box(f'room-floor-{level}-{i}',[x,y-.09,6.8],[5,.18,2.4],'entry')
        box(f'room-roof-{level}-{i}',[x,y+2.9,6.8],[5,.2,2.4])
        box(f'room-partition-{level}-{i}',[x-2.5,y+1.4,6.8],[.16,2.8,2.4])
        door(f'room-door-{level}-{i}',x,y,5.6)
    box('rooms-east-end-'+str(level),[7.5,y+1.4,6.8],[.16,2.8,2.4])
    # East rooms, with one real entrance in the middle.
    for z in [-2.25,2.25]:box(f'east-front-{level}-{z}',[7.8,y+1.4,z],[.18,2.8,3])
    box('east-lintel-'+str(level),[7.8,y+2.55,0],[.18,.5,1.5])
    box('east-floor-'+str(level),[8.9,y-.09,0],[2.2,.18,7.4],'entry')
    box('east-roof-'+str(level),[8.9,y+2.9,0],[2.2,.2,7.4])
    # South wings retain the entrance passage.
    for x in [-5.7,5.7]:
        facade(f'south-front-{level}-{x}',x,-5.6,8.6,y)
        box(f'south-floor-{level}-{x}',[x,y-.09,-6.8],[8.6,.18,2.4],'entry')
        box(f'south-roof-{level}-{x}',[x,y+2.9,-6.8],[8.6,.2,2.4])
# Two flights, 1.4 m clear width. 1.4 m deep landings allow child capsule to turn.
for i,(x,z0,z1,y0,y1) in enumerate([(-5.8,-2.5,2,0,1.5),(-7.4,2,-2.5,1.5,3)]):
    ramps.append(dict(id='stair-ramp-'+str(i),x=x,width=1.4,z0=z0,z1=z1,y0=y0,y1=y1))
    for n in range(10):
        t=(n+.5)/10;h=y0+(y1-y0)*(n+1)/10
        box(f'stair-tread-{i}-{n}',[x,h-.075,z0+(z1-z0)*t],[1.4,.15,abs(z1-z0)/10+.005],'walk',False)
    for side in [-1,1]:
        # Simple pillars and bars are visual only; tilted box colliders generated separately.
        for n in range(11):
            t=n/10
            box(f'rail-post-{i}-{side}-{n}',[x+side*.75,y0+(y1-y0)*t+.45,z0+(z1-z0)*t],[.05,.9,.05],'blocked',False)
box('stair-mid-landing',[-6.6,1.41,2.7],[3,.18,1.4],'walk')
rail('stair-mid-guard',[-6.6,1.98,3.4],[3,.96,.08])
box('stair-top-landing',[-7.5,2.91,-3.2],[4.6,.18,1.4],'walk')
rail('stair-top-guard',[-5.16,3.48,-3.2],[.08,.96,1.4])
# Minimal everyday stations, each with a meaningful interaction marker.
box('water-sink',[3,.35,2.6],[1.4,.7,.7],'interactive')
box('tap-post',[3,1,2.9],[.08,.7,.08],'interactive')
box('home-bed',[-6.5,.25,6.9],[1.2,.5,1.7],'blocked')
box('delivery-table',[-3.25,.4,6.9],[1,.8,1],'interactive')
box('upper-table',[1.5,3.4,6.8],[1,.8,.8],'blocked')
box('stove',[4.2,.4,4.7],[.6,.8,.6],'interactive')
marker('mother','npc',[-5.7,0,4.7],'母亲','talk_mother')
marker('aunt','npc',[4.2,0,2.6],'邻居阿姨','talk_aunt')
marker('grandpa','npc',[1,3,4.7],'楼上的爷爷','talk_grandpa')
marker('bucket','prop',[1.9,.22,2.6],'铁皮水桶','pickup_bucket')
marker('tap','prop',[3,.92,2.55],'公共水龙头','fill_bucket')
marker('delivery','prop',[-3.25,.88,6.9],'放下水桶','deliver_water')
marker('bag','prop',[-6.5,.67,6.7],'书包','pickup_bag')
data=dict(version=1,title='交织里院 Connect with LiYuan',units='metres',footprint=[20,16],floorHeight=3,eyeHeight=1.2,colors=colors,boxes=boxes,ramps=ramps,doors=doors,markers=markers,
          spawn=[0,.04,-11],home=[-5,.04,6.7],routes={'stairs':[[-5.8,0,-3.2],[-5.8,0,-2.5],[-5.8,1.5,2.7],[-7.4,1.5,2.7],[-7.4,3,-3.2],[-9,3,-3.2],[-9,3,4.6],[0,3,4.6],[0,3,6.7]],'entry':[[0,0,-11],[0,0,-8.8],[0,0,-6.8],[0,0,0]]})
out=ROOT/'design/blockout/layout.json'
out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(f'{len(boxes)} blocks, {len(ramps)} flights, {len(doors)} doors, {len(markers)} interactions -> {out}')
