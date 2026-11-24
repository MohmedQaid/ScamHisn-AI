# Opens a finished film in Blender's sequencer and saves a few of its frames as PNG,
# so the encoded file itself (not the project) can be checked. Works in a throwaway scene.
import bpy

ROOT = r"C:\Users\iV1R3S\Desktop\ScamHisn-AI\docs\pitch\video"
SRC = ROOT + r"\renders\final\ScamHisn-AI_pitch_1080p60.mp4"
FRAMES = [1, 1555, 1620, 1717, 2640, 4152]

home = bpy.context.window.scene
sc = bpy.data.scenes.new("Film check (temporary)")
try:
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.resolution_percentage = 50
    sc.render.fps = 60
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    se = sc.sequence_editor_create()
    strips = se.strips if hasattr(se, "strips") else se.sequences
    strip = strips.new_movie("film", SRC, 1, 1)
    print("frames in file", strip.frame_final_duration, "fps", strip.elements[0].orig_fps if strip.elements else "?")
    try:
        sc.render.image_settings.media_type = "IMAGE"
    except Exception:
        pass
    sc.render.image_settings.file_format = "PNG"
    sc.render.use_sequencer = True
    bpy.context.window.scene = sc
    for f in FRAMES:
        f = min(f, strip.frame_final_duration)
        sc.frame_set(f)
        sc.render.filepath = ROOT + "\\renders\\preview\\m_%05d.png" % round((f - 1) / 60 * 100)
        bpy.ops.render.render(write_still=True)
finally:
    bpy.context.window.scene = home
    bpy.data.scenes.remove(sc)
