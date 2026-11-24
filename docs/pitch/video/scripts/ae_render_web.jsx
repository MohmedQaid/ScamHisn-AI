// Renders a small copy of the silent film for the repository (1080p60 H.264 at about 5 Mbps).
#include "ae_lib.jsx"
(function () {
  var out = [], i, m = null;
  try {
    for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "MASTER - ScamHisn AI pitch") m = app.project.item(i);
    var rq = app.project.renderQueue;
    for (i = rq.numItems; i >= 1; i--) rq.item(i).remove();
    var it = rq.items.add(m);
    it.applyTemplate("Best Settings");
    var names = it.outputModule(1).templates, pick = null;
    for (i = 0; i < names.length; i++) if (/^H\.264 - Match Render Settings -\s+5 Mbps$/.test(names[i])) pick = names[i];
    it.outputModule(1).applyTemplate(pick);
    it.outputModule(1).file = new File("C:/Users/iV1R3S/Desktop/ScamHisn-AI/docs/pitch/ScamHisn-AI-Pitch-Video.mp4");
    var t0 = new Date().getTime();
    rq.render();
    out.push("template '" + pick + "' rendered in " + Math.round((new Date().getTime() - t0) / 1000) + "s, status " + rq.item(1).status + " (done=" + RQItemStatus.DONE + ")");
  } catch (e) {
    out.push("ERROR line " + e.line + ": " + e.toString());
  }
  var f = new File(ROOT + "/scripts/ae_render_web.log");
  f.open("w");
  f.write(out.join("\n"));
  f.close();
})();
