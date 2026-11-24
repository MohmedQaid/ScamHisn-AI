// Saves full-size promotional stills from the MASTER comp into renders/final/stills/.
#include "ae_lib.jsx"
(function () {
  var master = null, i, done = [];
  for (i = 1; i <= app.project.numItems; i++) if (app.project.item(i) instanceof CompItem && app.project.item(i).name === "MASTER - ScamHisn AI pitch") master = app.project.item(i);
  var shots = [[1.9, "01_real_or_fake"], [5.9, "02_seven_in_ten"], [14.2, "03_name"], [20.5, "04_app"], [26.4, "05_verdict"], [28.6, "06_evidence_lifted"], [37.9, "07_two_agents"], [43.7, "08_no_single_point_of_failure"], [47.3, "09_arabic"], [54.3, "10_report"], [58.2, "11_measured"], [67.7, "12_close"]];
  try {
    for (i = 0; i < shots.length; i++) {
      var f = new File(ROOT + "/renders/final/stills/" + shots[i][1] + ".png");
      if (f.exists) f.remove();
      master.saveFrameToPng(shots[i][0], f);
      done.push(shots[i][1]);
    }
  } catch (e) {
    done.push("ERROR line " + e.line + ": " + e.toString());
  }
  var lg = new File(ROOT + "/scripts/ae_stills.log");
  lg.open("w");
  lg.write(done.join("\n"));
  lg.close();
})();
