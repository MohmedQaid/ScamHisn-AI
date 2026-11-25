// Queues and renders the finished films from the open project:
//   MASTER                      -> 1080p60 H.264 at 15 Mbps (presentation) and 40 Mbps (master), no sound
//   MASTER with sound effects   -> 1080p60 H.264 at 15 Mbps with the optional effects track
#include "ae_lib.jsx"
(function () {
  var out = [], i;
  function find(name) {
    for (var k = 1; k <= app.project.numItems; k++) if (app.project.item(k) instanceof CompItem && app.project.item(k).name === name) return app.project.item(k);
    return null;
  }
  try {
    var rq = app.project.renderQueue;
    for (i = rq.numItems; i >= 1; i--) rq.item(i).remove();
    var dir = ROOT + "/renders/final/";
    var m = find("MASTER - ScamHisn AI pitch");
    var it = rq.items.add(m);
    it.applyTemplate("Best Settings");
    it.outputModule(1).applyTemplate("H.264 - Match Render Settings - 15 Mbps");
    it.outputModule(1).file = new File(dir + "ScamHisn-AI_pitch_1080p60" + (LANG_AR ? "_ar" : "") + ".mp4");
    var om2 = it.outputModules.add();
    om2.applyTemplate("H.264 - Match Render Settings - 40 Mbps");
    om2.file = new File(dir + "ScamHisn-AI_pitch_1080p60_master" + (LANG_AR ? "_ar" : "") + ".mp4");
    var s = find("MASTER with sound effects");
    if (s) {
      var it2 = rq.items.add(s);
      it2.applyTemplate("Best Settings");
      it2.outputModule(1).applyTemplate("H.264 - Match Render Settings - 15 Mbps");
      it2.outputModule(1).file = new File(dir + "ScamHisn-AI_pitch_1080p60_with_sfx" + (LANG_AR ? "_ar" : "") + ".mp4");
    }
    app.project.save();
    var t0 = new Date().getTime();
    rq.render();
    out.push("rendered " + rq.numItems + " queue items in " + Math.round((new Date().getTime() - t0) / 1000) + "s");
    for (i = 1; i <= rq.numItems; i++) out.push("  item " + i + " status " + rq.item(i).status + " (done=" + RQItemStatus.DONE + ")");
  } catch (e) {
    out.push("ERROR line " + e.line + ": " + e.toString());
  }
  var f = new File(ROOT + "/scripts/ae_render.log");
  f.open("w");
  f.write(out.join("\n"));
  f.close();
})();
