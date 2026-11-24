// Saves still frames of the MASTER comp at the times listed in scripts/preview_times.txt
// (one time in seconds per line) into renders/preview/, for checking the look.
#include "ae_lib.jsx"
(function () {
  var master = null, i;
  for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name.indexOf("MASTER") === 0) master = app.project.item(i);
  var f = new File(ROOT + "/scripts/preview_times.txt");
  f.open("r");
  var times = f.read().split(/[\r\n,\s]+/);
  f.close();
  var done = [];
  try {
    for (i = 0; i < times.length; i++) {
      if (times[i] === "") continue;
      var t = parseFloat(times[i]);
      var name = "m_" + ("0000" + Math.round(t * 100)).slice(-5) + ".png";
      var out = new File(ROOT + "/renders/preview/" + name);
      if (out.exists) out.remove();
      master.saveFrameToPng(t, out);
      done.push(name);
    }
  } catch (e) {
    done.push("ERROR line " + e.line + ": " + e.toString());
  }
  var lg = new File(ROOT + "/scripts/ae_preview.log");
  lg.open("w");
  lg.write(done.join("\n"));
  lg.close();
})();
