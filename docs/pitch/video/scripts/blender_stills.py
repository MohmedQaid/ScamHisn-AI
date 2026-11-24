# Renders a few half-size test frames from the phone scene and reports how long each took.
import time

import bpy

ROOT = r"C:\Users\iV1R3S\Desktop\ScamHisn-AI\docs\pitch\video"
scene = bpy.context.scene
keep = (scene.render.filepath, scene.render.resolution_percentage)
scene.render.resolution_percentage = 50
for f in (62, 300, 330):
    scene.frame_set(f)
    # timeline markers switch the camera during animation renders; do the same for stills
    cam = None
    for m in sorted(scene.timeline_markers, key=lambda m: m.frame):
        if m.frame <= f and m.camera:
            cam = m.camera
    if cam:
        scene.camera = cam
    scene.render.filepath = ROOT + "\\renders\\preview\\phone_test_%04d.png" % f
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print("frame", f, "took %.1fs at half size" % (time.time() - t))
scene.render.filepath, scene.render.resolution_percentage = keep
