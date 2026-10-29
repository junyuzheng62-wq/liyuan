"""Run: blender -b --python design/blockout/build_blender.py
Build the editable .blend, exported GLB and overview from the canonical layout.
"""
import bpy, json, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
data=json.loads((ROOT/'design/blockout/layout.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
materials={}
for key,h in data['colors'].items():
    rgb=tuple(int(h[i:i+2],16)/255 for i in (1,3,5))
    mat=bpy.data.materials.new(key);mat.diffuse_color=(*rgb,1);mat.use_nodes=True
    # Input RGBs are converted to linear so GLB renders with intended functional colors.
    linear=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)
    shader=mat.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*linear,1);shader.inputs['Roughness'].default_value=.9
    materials[key]=mat
collection=bpy.data.collections.new('01_ModularArchitecture');bpy.context.scene.collection.children.link(collection)
def cube(name,p,s,kind,angle=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));obj=bpy.context.object;obj.name=name
    obj.scale=(s[0],s[2],s[1]);obj.rotation_euler.x=angle
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(materials[kind]);obj['replaceable_module']=True
    for c in list(obj.users_collection):c.objects.unlink(obj)
    collection.objects.link(obj)
    return obj
for b in data['boxes']:
    if b['visible']:cube(b['id'],b['p'],b['s'],b['kind'])
for r in data['ramps']:
    angle=math.atan((r['y1']-r['y0'])/(r['z1']-r['z0']))
    for side in [-1,1]:cube(r['id']+'-handrail-'+str(side),[r['x']+side*.75,(r['y0']+r['y1'])/2+.9,(r['z0']+r['z1'])/2],[.06,.06,math.hypot(r['z1']-r['z0'],r['y1']-r['y0'])],'blocked',-angle)
# Named empty anchors keep interactive props separate from static architecture.
anchors=bpy.data.collections.new('02_InteractionAnchors');bpy.context.scene.collection.children.link(anchors)
for a in data['markers']+data['doors']:
    ob=bpy.data.objects.new(a['id']+'-anchor',None);anchors.objects.link(ob);p=a['p'];ob.location=(p[0],-p[2],p[1]);ob.empty_display_type='CUBE';ob.empty_display_size=.2;ob['runtime_only']=True
# Overview camera/light are excluded from the runtime asset.
bpy.ops.object.camera_add(location=(24,30,26));camera=bpy.context.object;camera.name='BlockoutOverview';camera.rotation_euler=(Vector((0,1,1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=36;bpy.context.scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(0,0,22));bpy.context.object.data.energy=2600;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=20
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False;scene.world.color=(.5,.5,.5)
scene.render.resolution_x=1000;scene.render.resolution_y=850;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard';scene.render.image_settings.file_format='PNG'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'design/blockout/liyuan-phase1.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in collection.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/graybox/liyuan-phase1.glb'),export_format='GLB',use_selection=True,export_cameras=False,export_lights=False,export_yup=True)
scene.render.filepath=str(ROOT/'design/blockout/overview.png');bpy.ops.render.render(write_still=True)
print('Saved editable Blender source, runtime GLB and overview')
