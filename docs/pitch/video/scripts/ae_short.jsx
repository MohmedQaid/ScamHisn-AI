// The one-minute cut: the finished MASTER sped up evenly to 59 seconds, the sound effects under it
// at -25 dB, and any voice-over clips listed in assets/vo/<lang>/placement.json on top.
// Renders the presentation copy and the small copy kept in git.
#include "ae_lib.jsx"
(function () {
  var out = [], i;
  var LEN = 59.0, FULL = 69.2;
  var lang = LANG_AR ? "ar" : "en";
  function find(name) {
    for (var k = 1; k <= app.project.numItems; k++) if (app.project.item(k) instanceof CompItem && app.project.item(k).name === name) return app.project.item(k);
    return null;
  }
  try {
    var master = find("MASTER - ScamHisn AI pitch");
    var old = find("SHORT - 59 seconds");
    if (old) old.remove();
    var c = app.project.items.addComp("SHORT - 59 seconds", W, H, 1, LEN, FPS);
    c.bgColor = C.paper;
    c.motionBlur = true;
    var m = c.layers.add(master);
    m.name = "The film, sped up evenly";
    m.stretch = 100 * LEN / FULL;

    var sfx = c.layers.add(app.project.importFile(new ImportOptions(new File(ROOT + "/assets/sfx/scamhisn_sfx_59s.wav"))));
    sfx.name = "Sound effects (background, -25 dB)";
    sfx.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([-25, -25]);

    var pf = new File(ROOT + "/assets/vo/" + lang + "/placement.json");
    var placed = 0;
    if (pf.exists) {
      var list = readJSON(pf.fsName);
      for (i = 0; i < list.length; i++) {
        var vo = c.layers.add(app.project.importFile(new ImportOptions(new File(ROOT + "/assets/vo/" + lang + "/" + list[i].file))));
        vo.name = "Voice: " + list[i].line;
        vo.startTime = list[i].at - list[i].speechFrom; // the words start exactly at "at"
        if (list[i].gain) vo.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([list[i].gain, list[i].gain]);
        placed++;
      }
    }
    out.push("comp built: " + LEN + "s, voice clips placed: " + placed);

    var rq = app.project.renderQueue;
    for (i = rq.numItems; i >= 1; i--) rq.item(i).remove();
    var it = rq.items.add(c);
    it.applyTemplate("Best Settings");
    it.outputModule(1).applyTemplate("H.264 - Match Render Settings - 15 Mbps");
    it.outputModule(1).file = new File(ROOT + "/renders/final/ScamHisn-AI_pitch_59s" + (LANG_AR ? "_ar" : "") + ".mp4");
    var names = it.outputModule(1).templates, pick = null;
    for (i = 0; i < names.length; i++) if (/^H\.264 - Match Render Settings -\s+5 Mbps$/.test(names[i])) pick = names[i];
    var om2 = it.outputModules.add();
    om2.applyTemplate(pick);
    om2.file = new File("C:/Users/iV1R3S/Desktop/ScamHisn-AI/docs/pitch/ScamHisn-AI-Pitch-Video" + (LANG_AR ? "-AR" : "") + ".mp4");
    app.project.save();
    var t0 = new Date().getTime();
    rq.render();
    out.push("rendered in " + Math.round((new Date().getTime() - t0) / 1000) + "s, status " + rq.item(1).status + " (done=" + RQItemStatus.DONE + ")");
  } catch (e) {
    out.push("ERROR line " + e.line + ": " + e.toString());
  }
  var f = new File(ROOT + "/scripts/ae_short.log");
  f.open("w");
  f.write(out.join("\n"));
  f.close();
})();
