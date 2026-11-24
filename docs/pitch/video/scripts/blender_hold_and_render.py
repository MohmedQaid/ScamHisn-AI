# Holds the opening camera on its wide pose for the first second (so the question has room and
# the loop starts from rest), then re-renders the opening shot, frames 1-300.
import time

import bpy

ROOT = r"C:\Users\iV1R3S\Desktop\ScamHisn-AI\docs\pitch\video"
WIDE = ((1.25, -4.6, 4.9), (0.0, 0.05, 0.0))
scene = bpy.context.scene
cam = bpy.data.objects["Cam opening"]
tgt = bpy.data.objects["Cam opening target"]
cam.location = WIDE[0]
cam.keyframe_insert("location", frame=66)
tgt.location = WIDE[1]
tgt.keyframe_insert("location", frame=66)
bpy.ops.wm.save_mainfile()

scene.render.resolution_percentage = 100
scene.render.filepath = ROOT + r"\renders\phone\phone_"
scene.frame_start = 1
scene.frame_end = 300
t = time.time()
bpy.ops.render.render(animation=True)
scene.frame_end = 540
print("re-rendered 300 frames in %.0fs" % (time.time() - t))
