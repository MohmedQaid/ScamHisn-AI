# Makes a small copy of the finished film for the repository (same 1080p60 picture, lower bitrate),
# using Blender's video sequencer. Leaves the open .blend untouched: it works in a throwaway scene.
import os

import bpy

ROOT = r"C:\Users\iV1R3S\Desktop\ScamHisn-AI\docs\pitch\video"
SRC = ROOT + r"\renders\final\ScamHisn-AI_pitch_1080p60.mp4"
DST = r"C:\Users\iV1R3S\Desktop\ScamHisn-AI\docs\pitch\ScamHisn-AI-Pitch-Video.mp4"

home = bpy.context.window.scene
sc = bpy.data.scenes.new("Web copy (temporary)")
try:
    sc.render.resolution_x = 1920
    sc.render.resolution_y = 1080
    sc.render.resolution_percentage = 100
    sc.render.fps = 60
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    se = sc.sequence_editor_create()
    strips = se.strips if hasattr(se, "strips") else se.sequences
    strip = strips.new_movie("film", SRC, 1, 1)
    sc.frame_start = 1
    sc.frame_end = strip.frame_final_duration
    r = sc.render
    try:
        r.image_settings.media_type = "VIDEO"
    except Exception:
        pass
    r.image_settings.file_format = "FFMPEG"
    r.ffmpeg.format = "MPEG4"
    r.ffmpeg.codec = "H264"
    r.ffmpeg.constant_rate_factor = "MEDIUM"
    r.ffmpeg.ffmpeg_preset = "GOOD"
    r.ffmpeg.gopsize = 120
    r.ffmpeg.audio_codec = "NONE"
    r.use_sequencer = True
    r.filepath = DST
    r.use_file_extension = False
    bpy.context.window.scene = sc
    bpy.ops.render.render(animation=True)
    print("frames", sc.frame_end, "size MB %.1f" % (os.path.getsize(DST) / 1e6))
finally:
    bpy.context.window.scene = home
    bpy.data.scenes.remove(sc)
