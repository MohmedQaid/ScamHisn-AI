# Builds the phone-on-paper scene used for the opening and closing shots of the ScamHisn AI video.
# Run inside Blender. Safe to re-run: it removes what it made before building again.
import math

import bmesh
import bpy
from mathutils import Vector

ROOT = r"C:\Users\iV1R3S\Desktop\ScamHisn-AI\docs\pitch\video"
FPS = 60
OPEN_END = 300  # opening shot: frames 1-300
CLOSE_START = 301  # closing shot: frames 301-540
CLOSE_END = 540


def lin(hex_str):
    """sRGB hex -> linear RGBA."""
    out = []
    for i in (0, 2, 4):
        c = int(hex_str[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


# ------------------------------------------------------------------ clean slate
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
    for b in list(coll):
        if b.users == 0:
            coll.remove(b)
scene = bpy.context.scene
for m in list(scene.timeline_markers):
    scene.timeline_markers.remove(m)

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end = CLOSE_END
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.filepath = ROOT + r"\renders\phone\phone_"
scene.render.use_motion_blur = True
try:
    scene.eevee.taa_render_samples = 48
    scene.eevee.use_shadows = True
    scene.eevee.use_raytracing = True
except Exception as e:  # property names differ between versions
    print("eevee setting skipped:", e)

prefs = bpy.context.preferences.edit
prefs.keyframe_new_interpolation_type = "BEZIER"
prefs.keyframe_new_handle_type = "AUTO_CLAMPED"

world = scene.world or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
bg.inputs[0].default_value = lin("FBF8F1")
bg.inputs[1].default_value = 0.5


def material(name, base, rough=0.5, metallic=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = base
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    return m


# ------------------------------------------------------------------ paper surface
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
ground = bpy.context.object
ground.name = "Paper surface"
ground.data.materials.append(material("Paper", lin("FBF8F1"), rough=0.95))

# ------------------------------------------------------------------ phone
W, H, D = 0.715, 1.467, 0.078  # ten times a real phone, in metres


def rounded_box(name, w, h, d, r, seg=14):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w, h, d), verts=bm.verts)
    upright = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 1e-6]
    bmesh.ops.bevel(bm, geom=upright, offset=r, segments=seg, profile=0.5, affect="EDGES")
    for f in bm.faces:
        f.smooth = True
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def rounded_plane(name, w, h, r, seg=12):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0))]
    bm.faces.new(vs)
    bmesh.ops.bevel(bm, geom=list(bm.verts), offset=r, segments=seg, profile=0.5, affect="VERTICES")
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for loop in f.loops:
            co = loop.vert.co
            loop[uv].uv = (co.x / w + 0.5, co.y / h + 0.5)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


phone = bpy.data.objects.new("Phone", rounded_box("Phone body", W, H, D, r=0.115))
scene.collection.objects.link(phone)
phone.location = (0, 0, D / 2 + 0.002)
phone.data.materials.append(material("Phone graphite", (0.035, 0.045, 0.04, 1), rough=0.34, metallic=0.9))
bev = phone.modifiers.new("Soft edges", "BEVEL")
bev.width = 0.012
bev.segments = 4
bev.limit_method = "ANGLE"
bev.angle_limit = math.radians(40)
phone.modifiers.new("Clean normals", "WEIGHTED_NORMAL")

screen = bpy.data.objects.new("Screen", rounded_plane("Screen glass", W - 0.05, H - 0.05, r=0.095))
scene.collection.objects.link(screen)
screen.parent = phone
screen.location = (0, 0, D / 2 + 0.0008)

sm = bpy.data.materials.get("Screen") or bpy.data.materials.new("Screen")
sm.use_nodes = True
nt = sm.node_tree
for n in list(nt.nodes):
    if n.type not in {"BSDF_PRINCIPLED", "OUTPUT_MATERIAL"}:
        nt.nodes.remove(n)
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.003, 0.004, 0.004, 1)
bsdf.inputs["Roughness"].default_value = 0.22
bsdf.inputs["Specular IOR Level"].default_value = 0.18


def tex(label, file):
    n = nt.nodes.new("ShaderNodeTexImage")
    n.label = label
    n.image = bpy.data.images.load(ROOT + "\\assets\\phone\\" + file, check_existing=True)
    n.extension = "EXTEND"
    return n


t_sms = tex("Scam SMS", "screen_sms.png")
t_app = tex("App verdict", "screen_app.png")
mix = nt.nodes.new("ShaderNodeMix")
mix.data_type = "RGBA"
mix.label = "Which screen (0 SMS, 1 app)"
mix.name = "ScreenMix"
nt.links.new(t_sms.outputs["Color"], mix.inputs["A"])
nt.links.new(t_app.outputs["Color"], mix.inputs["B"])
nt.links.new(mix.outputs["Result"], bsdf.inputs["Emission Color"])
screen.data.materials.append(sm)

phone.rotation_euler = (0, 0, math.radians(-9))

# ------------------------------------------------------------------ light
def area(name, loc, size, energy, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, "AREA")
    data.size = size
    data.energy = energy
    data.color = color
    ob = bpy.data.objects.new(name, data)
    scene.collection.objects.link(ob)
    ob.location = loc
    direction = Vector((0, 0, 0)) - Vector(loc)
    ob.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return ob


area("Key soft box", (-3.4, -2.4, 5.6), 5.0, 330)
area("Rim strip", (3.8, 2.6, 1.4), 2.0, 90, color=(1.0, 0.97, 0.92))

# ------------------------------------------------------------------ cameras
def camera(name, lens=85):
    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.dof.use_dof = True
    data.dof.aperture_fstop = 9.0
    ob = bpy.data.objects.new(name, data)
    scene.collection.objects.link(ob)
    target = bpy.data.objects.new(name + " target", None)
    target.empty_display_size = 0.1
    scene.collection.objects.link(target)
    con = ob.constraints.new("TRACK_TO")
    con.target = target
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    data.dof.focus_object = target
    return ob, target


def key(ob, frame, loc):
    ob.location = loc
    ob.keyframe_insert("location", frame=frame)


WIDE = ((1.25, -4.6, 4.9), (0.0, 0.05, 0.0))  # the pose the film starts and ends on
SMS_CLOSE = ((0.34, -1.75, 2.15), (-0.02, 0.1, 0.04))
APP_CLOSE = ((-0.3, -1.6, 2.3), (0.03, 0.2, 0.04))

cam_a, tgt_a = camera("Cam opening")
key(cam_a, 1, WIDE[0])
key(tgt_a, 1, WIDE[1])
key(cam_a, 345, SMS_CLOSE[0])  # the cut lands at 300, while the push is still travelling
key(tgt_a, 345, SMS_CLOSE[1])

cam_z, tgt_z = camera("Cam closing")
key(cam_z, 255, APP_CLOSE[0])  # already moving when the shot starts at 301
key(tgt_z, 255, APP_CLOSE[1])
key(cam_z, CLOSE_END, WIDE[0])
key(tgt_z, CLOSE_END, WIDE[1])

m1 = scene.timeline_markers.new("opening", frame=1)
m1.camera = cam_a
m2 = scene.timeline_markers.new("closing", frame=CLOSE_START)
m2.camera = cam_z
scene.camera = cam_a

# ------------------------------------------------------------------ screen animation
em = bsdf.inputs["Emission Strength"]
fac = mix.inputs["Factor"]


def kv(sock, frame, value):
    sock.default_value = value
    sock.keyframe_insert("default_value", frame=frame)


kv(em, 1, 0.0)
kv(em, 46, 0.0)
kv(em, 56, 1.0)  # the message lights the screen
kv(em, 496, 1.0)
kv(em, 522, 0.0)  # screen sleeps before the film loops
kv(em, CLOSE_END, 0.0)
kv(fac, OPEN_END, 0.0)
kv(fac, CLOSE_START, 1.0)
kv(fac, 1, 0.0)

# a short buzz as the message lands
base = phone.rotation_euler.z
for i, f in enumerate(range(46, 71, 3)):
    amp = math.radians(0.55) * (1 - i / 9)
    phone.rotation_euler.z = base + (amp if i % 2 == 0 else -amp)
    phone.keyframe_insert("rotation_euler", index=2, frame=f)
phone.rotation_euler.z = base
phone.keyframe_insert("rotation_euler", index=2, frame=43)
phone.keyframe_insert("rotation_euler", index=2, frame=74)

bpy.ops.wm.save_as_mainfile(filepath=ROOT + r"\blender\scamhisn_phone_shots.blend")
print("scene built", len(bpy.data.objects), "objects")
