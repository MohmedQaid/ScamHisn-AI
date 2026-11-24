# Renders the opening (1-300) and closing (301-540) phone shots as a full-size PNG sequence.
import time

import bpy

ROOT = r"C:\Users\iV1R3S\Desktop\ScamHisn-AI\docs\pitch\video"
scene = bpy.context.scene
scene.render.resolution_percentage = 100
scene.render.filepath = ROOT + r"\renders\phone\phone_"
scene.frame_start = 1
scene.frame_end = 540
t = time.time()
bpy.ops.render.render(animation=True)
print("rendered 540 frames in %.0fs" % (time.time() - t))
