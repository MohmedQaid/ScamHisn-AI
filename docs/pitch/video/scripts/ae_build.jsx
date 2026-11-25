// Builds the whole ScamHisn AI pitch video project from scratch: eleven scene comps and a MASTER.
// Safe to re-run: it starts a new project each time and saves to ae/scamhisn_pitch_video.aep.
#include "ae_lib.jsx"

(function () {
  var OUT = new File(ROOT + "/ae/scamhisn_pitch_video.aep");
  // Never discard someone else's open work: park an unsaved foreign project in a file first.
  if (app.project.file === null && app.project.numItems > 0 && !(new File(ROOT + "/ae/_previously_open_untitled_project.aep")).exists) {
    app.project.save(new File(ROOT + "/ae/_previously_open_untitled_project.aep"));
  }
  log("start");
  app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
  log("closed");
  app.newProject();
  log("new project");
  app.beginSuppressDialogs();
  MAN = readJSON(ROOT + "/assets/ui/manifest.json");
  var scenes = [];
  function scene(name, dur, fn) {
    var c = mkComp(name, dur);
    try {
      fn(c);
      log("ok    " + name + " (" + c.numLayers + " layers)");
    } catch (e) {
      log("ERROR " + name + " line " + e.line + ": " + e.toString());
    }
    scenes.push(c);
    return c;
  }
  var PHONE = ROOT + "/renders/phone/phone_0001.png";
  var HEAD = { font: "Nunito-Black", size: 84, color: C.ink };
  function headline(c, str, y, t, o) {
    o = o || {};
    var L = text(c, str, { font: "Nunito-Black", size: o.size || 84, color: o.color || C.ink, x: o.x || 960, y: y, just: o.just });
    enter(L, t, { dy: 34, d: 0.55, blur: 26 });
    return L;
  }
  function caption(c, str, y, t, o) {
    o = o || {};
    var L = text(c, str, { font: o.font || "Nunito-ExtraBold", size: o.size || 44, color: o.color || C.ink, x: o.x || 960, y: y, just: o.just, track: o.track, leading: o.leading });
    enter(L, t, { dy: 24, d: 0.5, blur: 14 });
    return L;
  }

  // ====================================================================== 01 HOOK
  scene("01 Hook - a message arrives", 5.0, function (c) {
    var ph = c.layers.add(sequence(PHONE, FPS, "Blender renders"));
    ph.name = "Phone shot (Blender, frames 1-300)";
    var a = text(c, "Real", { font: "Nunito-Black", size: 112, color: C.ink, x: 1440, y: 300, just: "left" });
    var b = text(c, "or fake?", { font: "Nunito-Black", size: 112, color: C.danger, x: 1440, y: 420, just: "left" });
    enter(a, 0.98, { dy: 30, d: 0.5, blur: 24 });
    enter(b, 1.16, { dy: 30, d: 0.5, blur: 24 });
    leave(a, 2.9, { d: 0.32, dx: 160, blur: 30 });
    leave(b, 2.95, { d: 0.32, dx: 160, blur: 30 });
  });

  // ====================================================================== 02 PROBLEM
  scene("02 Problem - three numbers", 7.0, function (c) {
    paperBg(c);
    function beat(t0, t1, num, line, src) {
      var n = text(c, num, { font: "Nunito-Black", size: 310, color: C.danger, x: 960, y: 450 });
      var sc = P(n, "scale");
      K(sc, [[t0, [128, 128]], [t0 + 0.42, [100, 100]]], "out");
      K(sc, [[t0 + 0.43, [100, 100]], [t1 - 0.3, [105, 105]]], "lin");
      K(sc, [[t1 - 0.29, [105, 105]], [t1, [300, 300]]], "inn");
      K(P(n, "op"), [[t0, 0], [t0 + 0.2, 100]], "soft");
      K(P(n, "op"), [[t1 - 0.22, 100], [t1, 0]], "inn");
      K(blurProp(n), [[t0, 40], [t0 + 0.35, 0]], "out");
      K(blurProp(n), [[t1 - 0.29, 0], [t1, 50]], "inn");
      n.inPoint = t0;
      n.outPoint = t1;
      var l = text(c, line, { font: "Nunito-ExtraBold", size: 58, color: C.ink, x: 960, y: 690 });
      enter(l, t0 + 0.22, { dy: 26, d: 0.5, blur: 16 });
      leave(l, t1 - 0.32, { d: 0.24, blur: 24 });
      var s = text(c, src, { font: "Nunito-SemiBold", size: 25, color: C.muted, x: 960, y: 1000, name: "[fixed] source " + num });
      enter(s, t0 + 0.5, { dy: 0, d: 0.4 });
      leave(s, t1 - 0.32, { d: 0.2 });
    }
    beat(0.0, 2.5, "7 in 10", "people in the UAE have met a scam", "GASA and Trend Micro, State of Scams in the UAE, 2026");
    beat(2.5, 4.7, "1 in 3", "lost money to one in a year", "GASA and Trend Micro, State of Scams in the UAE, 2026");
    beat(4.7, 7.0, "Dh140M", "returned to victims by Abu Dhabi Police", "Abu Dhabi Police, October 2025, over two years");
  });

  // ====================================================================== 03 SOLUTION
  scene("03 Solution - the name", 4.0, function (c) {
    paperBg(c);
    var logo = image(c, "logo_1024.png", { x: 960, y: 300, scale: 21, name: "Logo mark" });
    K(P(logo, "scale"), [[0.1, [0, 0]], [0.42, [23.5, 23.5]], [0.6, [21, 21]]], "soft");
    logo.inPoint = 0.1;
    var name = text(c, "ScamHisn AI", { font: "Nunito-Black", size: 168, color: C.ink, x: 960, y: 560 });
    enter(name, 0.35, { dy: 40, d: 0.6, blur: 30 });
    var ar = image(c, "brand_ar.png", { x: 960, y: 706, scale: 26, name: "Arabic name" });
    enter(ar, 0.6, { dy: 24, d: 0.5 });
    var tag = text(c, "Check before you click.", { font: "Nunito-ExtraBold", size: 66, color: C.ink, x: 960, y: 860 });
    enter(tag, 1.05, { dy: 26, d: 0.5, blur: 18 });
    var r = tag.sourceRectAtTime(1.6, false);
    scribble(c, 960 + r.width / 2 - 178, 905, 174, C.brand, 1.5, 0.5);
    for (var i = 1; i <= c.numLayers; i++) {
      var L = c.layer(i);
      if (L.name === "Paper") continue;
      leave(L, 3.66, { d: 0.32, s: 1.9, blur: 46 });
    }
    drift(c, 100, 103.5);
  });

  // shared: the home screen pieces, in page order
  function homePieces(c) {
    var o = {};
    o.header = ui(c, "home_header");
    o.h1 = ui(c, "home_h1");
    o.sub = ui(c, "home_sub");
    o.fort = ui(c, "home_fort");
    o.form = ui(c, "home_form_empty");
    o.tabs = [];
    for (var i = 0; i < 4; i++) o.tabs.push(ui(c, "home_tab_" + i));
    o.samples = ui(c, "home_samples");
    return o;
  }

  // ====================================================================== 04 REVEAL
  scene("04 Reveal - the app assembles", 5.5, function (c) {
    paperBg(c);
    var h = homePieces(c);
    var order = [[h.form, -1500], [h.h1, -900], [h.fort, -1200], [h.header, -700], [h.sub, -520], [h.tabs[0], -1000], [h.tabs[1], -860], [h.tabs[2], -720], [h.tabs[3], -580], [h.samples, -400]];
    for (var i = 0; i < order.length; i++) enter(order[i][0], 0.1 + i * 0.075, { dy: 0, dz: order[i][1], d: 1.25, blur: 22 });
    var cam = camera(c);
    camKeys(cam, [[0, 960, 540, 3900, 24, 7], [2.3, 960, 540, 2700, 0, 0]], "io");
    camKeys(cam, [[2.31, 960, 540, 2700, 0, 0], [5.5, 960, 540, 2560, 0, 0]], "lin");
  });

  // ====================================================================== 05 DEMO
  scene("05 Demo - paste, check, verdict", 12.5, function (c) {
    paperBg(c);
    var h = homePieces(c);
    var mi = MAN.pieces.home_input_text, mb = MAN.pieces.home_check_button;
    var fy = (mi.y + mi.h / 2) * S;
    var dyRes = (MAN.pieces.res_form.y - MAN.pieces.home_form_filled.y) * S;

    // typing: the filled card sits over the empty one, a surface-coloured cover slides off the text
    var filled = ui(c, "home_form_filled");
    filled.inPoint = 1.02;
    var xr = 452 * S, w0 = 288 * S;
    var cover = rrect(c, "Typing cover", w0, 60, 0, C.surface, null, 0, xr, fy, true);
    P(cover, "pos").setValue([xr, fy, -1]);
    K(rectSize(cover), [[1.02, [w0, 60]], [2.2, [0, 60]]], "lin");
    K(rectPos(cover), [[1.02, [-w0 / 2, 0]], [2.2, [0, 0]]], "lin");
    cover.inPoint = 1.02;
    cover.outPoint = 2.25;
    var caret = rrect(c, "Caret", 4, 46, 2, C.ink, null, 0, xr - w0, fy, true);
    K(P(caret, "pos"), [[1.02, [xr - w0, fy, -2]], [2.2, [xr + 3, fy, -2]]], "lin");
    caret.inPoint = 0.95;
    caret.outPoint = 2.75;

    // pointer: to the box, then to Check
    var ptr = pointer(c, true);
    var bx = (mb.x + mb.width / 2) * S, by = (mb.y + mb.height / 2) * S;
    K(P(ptr, "pos"), [[0.2, [1300, 1010, -6]], [0.85, [760, fy + 8, -6]]], "io");
    K(P(ptr, "pos"), [[0.98, [760, fy + 8, -6]], [1.3, [860, fy + 86, -6]]], "io");
    K(P(ptr, "pos"), [[2.3, [860, fy + 86, -6]], [2.78, [bx, by + 4, -6]]], "io");
    K(P(ptr, "op"), [[0.2, 0], [0.4, 82]], "soft");
    K(P(ptr, "op"), [[3.0, 82], [3.2, 0]], "soft");
    ptr.inPoint = 0.2;
    ptr.outPoint = 3.25;
    clickRing(c, 760, fy + 8, -5, 0.9, true);
    clickRing(c, bx, by + 4, -5, 2.88, true);
    var fs = P(filled, "scale"), fv = fs.value;
    K(fs, [[2.86, fv], [2.94, mul(fv, 0.985)], [3.08, fv]], "soft");

    // the page rearranges into the result
    var gone = [h.h1, h.sub, h.fort, h.samples];
    for (var g = 0; g < gone.length; g++) leave(gone[g], 3.02 + g * 0.04, { d: 0.32, dy: -70, blur: 18 });
    h.form.outPoint = 1.1;
    var movers = [filled].concat(h.tabs);
    for (var m = 0; m < movers.length; m++) {
      var mp = P(movers[m], "pos"), mv = mp.value;
      K(mp, [[3.05 + m * 0.03, mv], [3.85 + m * 0.03, off(mv, 0, dyRes, 0)]], "io");
    }
    var rh1 = ui(c, "res_h1");
    enter(rh1, 3.4, { dy: 30, d: 0.5 });

    // the verdict band with its live counting number, built as one unit
    var mv2 = MAN.pieces.res_verdict;
    var Q = MAN.scale; // the unit is built at the full size of the captured piece, then shown at half
    var bw = Math.round(mv2.w * Q), bh = Math.round(mv2.h * Q);
    var bandComp = app.project.items.addComp("Verdict band (counting)", bw, bh, 1, c.duration, FPS);
    bandComp.parentFolder = folder("Scenes");
    bandComp.bgColor = C.paper;
    var bimg = bandComp.layers.add(footage(ROOT + "/assets/ui/res_verdict.png", "UI pieces"));
    bimg.name = "Verdict band (real interface)";
        P(bimg, "pos").setValue([bw / 2, bh / 2]);
    var lx = 411 * Q, ly = 84.5 * Q;
    rrect(bandComp, "Number patch", 232 * Q, 88 * Q, 0, C.dangerTint, null, 0, lx - 2 * Q, ly, false);
    counter(bandComp, { txt: "84%", from: 0, to: 84, t0: 4.12, t1: 5.0, suffix: "%", font: "Nunito-Black", size: 100 * Q / S, color: C.danger, x: lx, y: ly });
    var band = c.layers.add(bandComp);
    band.name = "Verdict band";
    band.threeDLayer = true;
    P(band, "scale").setValue([100 * S / Q, 100 * S / Q, 100 * S / Q]);
    band.motionBlur = true;
    var nx = (mv2.x + 411) * S, ny = (mv2.y + 84.5) * S;
    P(band, "pos").setValue([(mv2.x + mv2.w / 2) * S, (mv2.y + mv2.h / 2) * S, 0]);
    enter(band, 3.5, { dy: 110, dz: 380, d: 0.7, s: 0.95 });

    var et = ui(c, "res_evidence_title");
    enter(et, 4.12, { dy: 40, d: 0.5 });
    var rows = [null];
    for (var r = 1; r < 3; r++) {
      rows.push(ui(c, "res_row_" + r));
      enter(rows[r], 4.24 + r * 0.11, { dy: 46, d: 0.55 });
    }

    // focus pull: everything below these two layers blurs and dims while one piece is lifted
    var focus = c.layers.addSolid(C.paper, "Focus blur (adjustment)", W, H, 1);
    focus.adjustmentLayer = true;
    var fb = blurProp(focus);
    focus.property("ADBE Effect Parade").property("ADBE Gaussian Blur 2").property("ADBE Gaussian Blur 2-0003").setValue(1);
    K(blurProp(focus), [[5.2, 0], [5.7, 20]], "soft");
    K(blurProp(focus), [[11.6, 20], [12.05, 0]], "soft");
    focus.inPoint = 5.2;
    focus.outPoint = 12.1;
    var veil = c.layers.addSolid(C.paper, "Veil", W, H, 1);
    K(P(veil, "op"), [[5.2, 0], [5.7, 70]], "soft");
    K(P(veil, "op"), [[11.6, 70], [12.05, 0]], "soft");
    veil.inPoint = 5.2;
    veil.outPoint = 12.1;
    // the two pieces that get lifted sit above the focus layers
    var notice = ui(c, "res_notice");
    enter(notice, 3.98, { dy: 40, d: 0.5 });
    rows[0] = ui(c, "res_row_0");
    enter(rows[0], 4.24, { dy: 46, d: 0.55 });

    function lift(L, t0, t1) {
      var p = P(L, "pos"), v = p.valueAtTime(t0, false); // where it rests, not where it entered from
      K(p, [[t0, v], [t0 + 0.62, [960, 985, -520]]], "io");
      K(p, [[t1, [960, 985, -520]], [t1 + 0.55, v]], "io");
      var sh = shadow(L, 0, 34, 90);
      K(sh.property("ADBE Drop Shadow-0002"), [[t0, 0], [t0 + 0.6, 46]], "soft");
      K(sh.property("ADBE Drop Shadow-0002"), [[t1, 46], [t1 + 0.5, 0]], "soft");
    }
    function callout(label, line, t0, t1) {
      var a = text(c, label, { font: "Nunito-ExtraBold", size: 26, color: C.brand, x: 960, y: 196, track: 220 });
      var b = text(c, line, { font: "Nunito-Black", size: 80, color: C.ink, x: 960, y: 290 });
      enter(a, t0, { dy: 18, d: 0.45 });
      enter(b, t0 + 0.1, { dy: 30, d: 0.55, blur: 22 });
      leave(a, t1, { d: 0.25 });
      leave(b, t1, { d: 0.28, blur: 26 });
    }
    function recede(L, t0, t1) {
      K(blurProp(L), [[t0, 0], [t0 + 0.5, 15]], "soft");
      K(blurProp(L), [[t1 - 0.45, 15], [t1, 0]], "soft");
      K(P(L, "op"), [[t0, 100], [t0 + 0.5, 40]], "soft");
      K(P(L, "op"), [[t1 - 0.45, 40], [t1, 100]], "soft");
    }
    recede(notice, 5.2, 8.7);
    recede(rows[0], 8.8, 12.05);
    lift(rows[0], 5.3, 8.15);
    callout("THE EVIDENCE", "It names who is being faked.", 5.75, 7.95);
    lift(notice, 8.75, 11.5);
    callout("EVEN WHEN THE SITE IS GONE", "Dead link? Still caught.", 9.2, 11.3);

    var cam = camera(c);
    camKeys(cam, [[0, 960, 540, 2560, 0, 0], [0.9, 960, 660, 2440, 0, 0]], "io");
    camKeys(cam, [[3.0, 960, 660, 2440, 0, 0], [4.35, 960, 900, 3500, 0, 0]], "io");
    camKeys(cam, [[4.36, 960, 900, 3500, 0, 0], [11.9, 960, 900, 3380, 0, 0]], "lin");
    camKeys(cam, [[11.92, 960, 900, 3380, 0, 0], [12.5, nx, ny, 230, 0, 0]], "inn");
    var wash = c.layers.addSolid(C.dangerTint, "Wash to verdict colour", W, H, 1);
    K(P(wash, "op"), [[12.22, 0], [12.46, 100]], "soft");
    wash.inPoint = 12.2;
  });

  // ====================================================================== 06 TWO AGENTS + CHAIN
  scene("06 Differentiator - two agents, no single point of failure", 11.0, function (c) {
    paperBg(c);
    // the verdict colour that filled the last frame shrinks into a small verdict chip
    var chip = rrect(c, "Verdict chip", 380, 112, 56, C.dangerTint, null, 0, 960, 860, false);
    K(rectSize(chip), [[0, [2300, 1400]], [0.75, [380, 112]]], "io");
    K(P(chip, "pos"), [[0, [960, 540]], [0.75, [960, 860]]], "io");
    var chipText = text(c, "84%  scam", { font: "Nunito-Black", size: 50, color: C.danger, x: 960, y: 860 });
    enter(chipText, 0.6, { dy: 0, d: 0.35, s: 0.8 });

    var h1 = headline(c, "Two AI agents. One verdict.", 150, 0.55);

    function card(x, fill, fg, sub, label, name, line, t, fromX) {
      var bg = rrect(c, label + " card", 640, 300, 33, fill, C.outline, 2.25, x, 470, false);
      var a = text(c, label, { font: "Nunito-ExtraBold", size: 24, color: sub, x: x - 268, y: 378, just: "left", track: 200 });
      var b = text(c, name, { font: "Nunito-Black", size: 76, color: fg, x: x - 270, y: 462, just: "left" });
      var d = text(c, line, { font: "Nunito-SemiBold", size: 31, color: fg, x: x - 268, y: 552, just: "left" });
      var all = [bg, a, b, d];
      for (var i = 0; i < all.length; i++) enter(all[i], t + i * 0.05, { dx: fromX, dy: 0, d: 0.65 });
      return all;
    }
    var left = card(505, C.surface, C.ink, C.muted, "THE RESEARCHER", "Gemini", "reads the page and its images", 0.95, -160);
    var right = card(1415, C.brand, C.paper, C.brandTint, "THE JUDGE", "Falcon-H1", "built in Abu Dhabi, runs on our GPU", 1.1, 160);

    var l1 = stroke(c, "Researcher to verdict", [[505, 626], [880, 800]], [[0, 0], [0, -120]], [[0, 120], [0, 0]], C.outline, 3, 0, 0);
    var l2 = stroke(c, "Judge to verdict", [[1415, 626], [1040, 800]], [[0, 0], [0, -120]], [[0, 120], [0, 0]], C.outline, 3, 0, 0);
    K(trimEnd(l1), [[1.7, 0], [2.35, 100]], "io");
    K(trimEnd(l2), [[1.82, 0], [2.47, 100]], "io");
    l1.inPoint = 1.7;
    l2.inPoint = 1.82;
    K(P(chip, "scale"), [[2.42, [100, 100]], [2.56, [109, 109]], [2.85, [100, 100]]], "soft");
    var rule = caption(c, "Our own rules can overrule both.", 978, 2.9, { font: "Nunito-SemiBold", size: 32, color: C.muted });

    // out, then the fallback chain
    var out = left.concat(right, [l1, l2, chip, chipText, rule, h1]);
    for (var i = 0; i < out.length; i++) leave(out[i], 5.0 + (i % 4) * 0.03, { d: 0.3, dy: -40, blur: 18 });

    headline(c, "No single point of failure.", 250, 5.35, { size: 100 });
    var labels = ["Gemini, key 1", "Gemini, key 2", "Backup models", "Falcon-H1 alone", "Rules only"];
    var xs = [232, 596, 960, 1324, 1688];
    var y = 560, k;
    for (k = 0; k < 5; k++) {
      var pill = rrect(c, "Step " + (k + 1), 322, 112, 56, C.surface, C.outline, 2.25, xs[k], y, false);
      enter(pill, 5.6 + k * 0.09, { dy: 40, d: 0.5 });
      if (k < 4) {
        var link = stroke(c, "Link " + (k + 1), [[xs[k] + 168, y], [xs[k + 1] - 168, y]], [[0, 0], [0, 0]], [[0, 0], [0, 0]], C.outline, 3, 0, 0);
        K(trimEnd(link), [[6.0 + k * 0.09, 0], [6.25 + k * 0.09, 100]], "io");
        link.inPoint = 6.0 + k * 0.09;
      }
    }
    var hi = rrect(c, "Active step", 322, 112, 56, C.brandTint, C.brand, 6, xs[0], y, false);
    enter(hi, 6.35, { dy: 0, d: 0.3, s: 0.8 });
    var hop = [7.2, 7.95, 8.7];
    for (k = 0; k < 3; k++) K(P(hi, "pos"), [[hop[k], [xs[k], y]], [hop[k] + 0.36, [xs[k + 1], y]]], "io");
    for (k = 0; k < 5; k++) {
      var lab = text(c, labels[k], { font: "Nunito-ExtraBold", size: 32, color: C.ink, x: xs[k], y: y });
      enter(lab, 5.66 + k * 0.09, { dy: 40, d: 0.5 });
      if (k < 3) {
        K(P(lab, "op"), [[hop[k], 100], [hop[k] + 0.3, 38]], "soft");
        var cut = stroke(c, "Failed " + (k + 1), [[xs[k] - 112, y + 2], [xs[k] + 112, y - 2]], [[0, 0], [0, 0]], [[0, 0], [0, 0]], C.danger, 4, 0, 0);
        K(trimEnd(cut), [[hop[k] - 0.05, 0], [hop[k] + 0.22, 100]], "io");
        cut.inPoint = hop[k] - 0.05;
      }
    }
    caption(c, "One fails. The next takes over.", 770, 6.5, { size: 56 });
    caption(c, "Results always say what was checked.", 866, 9.3, { font: "Nunito-SemiBold", size: 32, color: C.muted });
    for (var j = 1; j <= c.numLayers; j++) {
      var Lj = c.layer(j);
      if (Lj.name !== "Paper" && Lj.outPoint >= 10.9) leave(Lj, 10.66, { d: 0.3, s: 1.5, blur: 40 });
    }
    drift(c, 100, 103);
  });

  // ====================================================================== 07 BILINGUAL + MODES
  scene("07 Arabic and English, four kinds of check", 5.6, function (c) {
    paperBg(c);
    var en = ui(c, "res_verdict", { x: 960, y: 520 });
    var ar = ui(c, "ar_verdict", { x: 960, y: 520 });
    enter(en, 0.1, { dy: 50, dz: 300, d: 0.6 });
    K(P(en, "ry"), [[1.0, 0], [1.3, 90]], "inn");
    en.outPoint = 1.31;
    K(P(ar, "ry"), [[1.3, -90], [1.68, 0]], "out");
    ar.inPoint = 1.3;
    var ys = [786, 872, 958], i;
    var both = [en, ar];
    for (i = 0; i < 3; i++) {
      var re = ui(c, "res_row_" + i, { x: 960, y: ys[i] });
      enter(re, 0.3 + i * 0.08, { dy: 40, d: 0.5 });
      leave(re, 1.0 + i * 0.06, { d: 0.25, dx: -90 });
      var ra = ui(c, "ar_row_" + i, { x: 960, y: ys[i] });
      enter(ra, 1.42 + i * 0.08, { dx: 90, dy: 0, d: 0.5 });
      both.push(ra);
    }
    var h1 = headline(c, "Arabic and English.", 150, 0.35);
    leave(h1, 2.72, { d: 0.26, blur: 24 });
    for (i = 1; i < both.length; i++) leave(both[i], 2.72 + i * 0.03, { d: 0.3, dz: 500, dy: -30 });

    headline(c, "Links. Jobs. Maps. Screenshots.", 250, 3.0);
    var xs = [285, 735, 1185, 1635];
    for (i = 0; i < 4; i++) {
      var tab = ui(c, "home_tab_" + i, { x: xs[i], y: 578, k: 1.5 });
      enter(tab, 3.2 + i * 0.12, { dy: 40, dz: 700, d: 0.7 });
      var cardBg = rrect(c, "Mode card outline " + (i + 1), 420, 230, 33, null, C.outline, 2.25, xs[i], 570, true);
      P(cardBg, "pos").setValue([xs[i], 570, -1]);
      enter(cardBg, 3.2 + i * 0.12, { dy: 40, dz: 700, d: 0.7 });
    }
    caption(c, "One box. Paste whatever looks wrong.", 800, 3.9, { font: "Nunito-SemiBold", size: 34, color: C.muted });
    var cam = camera(c);
    camKeys(cam, [[0, 960, 540, 2667, 0, 0], [5.6, 960, 540, 2540, 0, 0]], "lin");
    for (var j = 1; j <= c.numLayers; j++) {
      var Lj = c.layer(j);
      if (Lj.name !== "Paper" && !(Lj instanceof CameraLayer) && Lj.outPoint >= 5.5) leave(Lj, 5.3, { d: 0.28, blur: 30 });
    }
  });

  // ====================================================================== 08 REPORT
  scene("08 Ready to report", 5.0, function (c) {
    paperBg(c);
    var pdf = ui(c, "res_btn_report_pdf", { x: 565.5, y: 340 });
    var pol = ui(c, "res_btn_police", { x: 1354.5, y: 340 });
    var aman = ui(c, "res_aman", { x: 960, y: 610 });
    enter(pdf, 0.15, { dy: 40, dz: 300, d: 0.55 });
    enter(pol, 0.25, { dy: 40, dz: 300, d: 0.55 });
    headline(c, "Ready to report.", 150, 0.3);
    var ptr = pointer(c, false);
    K(P(ptr, "pos"), [[0.8, [1560, 800]], [1.4, [1354, 350]]], "io");
    K(P(ptr, "op"), [[0.8, 0], [1.0, 82]], "soft");
    K(P(ptr, "op"), [[2.0, 82], [2.25, 0]], "soft");
    ptr.inPoint = 0.8;
    ptr.outPoint = 2.3;
    clickRing(c, 1354, 350, 0, 1.5, false);
    var ps = P(pol, "scale"), pv = ps.value;
    K(ps, [[1.48, pv], [1.56, mul(pv, 0.975)], [1.72, pv]], "soft");
    enter(aman, 1.66, { dy: -70, d: 0.6, s: 0.96 });
    caption(c, "An evidence file, and the official Aman channels.", 880, 2.4);
    var cam = camera(c);
    camKeys(cam, [[0, 960, 540, 2667, 0, 0], [5.0, 960, 540, 2560, 0, 0]], "lin");
    for (var j = 1; j <= c.numLayers; j++) {
      var Lj = c.layer(j);
      if (Lj.name !== "Paper" && !(Lj instanceof CameraLayer) && Lj.outPoint >= 4.9) leave(Lj, 4.7, { d: 0.28, blur: 30 });
    }
  });

  // ====================================================================== 09 PROOF
  scene("09 Measured, not claimed", 5.6, function (c) {
    paperBg(c);
    headline(c, "Measured, not claimed.", 170, 0.2);
    var cols = [
      [400, "91.5%", 0, 91.5, 1, "%", "accuracy on 141 addresses\rit had never seen"],
      [960, "0", 12, 0, 0, "", "false alarms\ron 76 real sites"],
      [1520, "139", 0, 139, 0, "", "automated tests,\rall passing"]
    ];
    for (var i = 0; i < 3; i++) {
      var q = cols[i], t = 0.6 + i * 0.22;
      var n = counter(c, { txt: q[1], from: q[2], to: q[3], dec: q[4], suffix: q[5], t0: t, t1: t + 1.1, font: "Nunito-Black", size: 190, color: C.brand, x: q[0], y: 500 });
      enter(n, t, { dy: 40, d: 0.55, blur: 20 });
      var l = text(c, q[6], { font: "Nunito-SemiBold", size: 34, color: C.ink, x: q[0], y: 690, leading: 44 });
      enter(l, t + 0.25, { dy: 24, d: 0.5 });
    }
    var f = text(c, "Accuracy is for the address-check layer, on synthetic look-alikes. The full pipeline is not yet measured.", { font: "Nunito-Regular", size: 24, color: C.muted, x: 960, y: 1000, name: "[fixed] footnote" });
    enter(f, 1.6, { dy: 0, d: 0.5 });
    for (var j = 1; j <= c.numLayers; j++) {
      var Lj = c.layer(j);
      if (Lj.name !== "Paper") leave(Lj, 5.3, { d: 0.28, blur: 30 });
    }
    drift(c, 100, 103);
  });

  // ====================================================================== 10 VISION
  scene("10 Today the link, next the claim", 4.0, function (c) {
    paperBg(c);
    var a = text(c, "Today we check the link.", { font: "Nunito-Black", size: 104, color: C.ink, x: 960, y: 430 });
    enter(a, 0.15, { dy: 36, d: 0.6, blur: 28 });
    var b = text(c, "Next, with TAMM: the claim.", { font: "Nunito-Black", size: 104, color: C.brand, x: 960, y: 580 });
    enter(b, 1.2, { dy: 36, d: 0.6, blur: 28 });
    var tagBg = rrect(c, "Concept tag", 210, 54, 27, null, C.warn, 3, 960, 720, false);
    var tag = text(c, "CONCEPT", { font: "Nunito-ExtraBold", size: 24, color: C.warn, x: 960, y: 720, track: 260 });
    enter(tagBg, 1.85, { dy: 14, d: 0.4 });
    enter(tag, 1.85, { dy: 14, d: 0.4 });
    for (var j = 1; j <= c.numLayers; j++) {
      var Lj = c.layer(j);
      if (Lj.name !== "Paper") leave(Lj, 3.68, { d: 0.3, s: 1.6, blur: 40 });
    }
    drift(c, 100, 103.5);
  });

  // ====================================================================== 11 CLOSE
  scene("11 Close - back to the phone", 4.0, function (c) {
    var ph = c.layers.add(sequence(PHONE, FPS, "Blender renders"));
    ph.name = "Phone shot (Blender, frames 301-540)";
    ph.startTime = -5.0;
    var logo = image(c, "logo_1024.png", { x: 1640, y: 372, scale: 13.5, name: "Logo mark" });
    var name = text(c, "ScamHisn AI", { font: "Nunito-Black", size: 74, color: C.ink, x: 1640, y: 500 });
    var tag = text(c, "Check before you click.", { font: "Nunito-SemiBold", size: 34, color: C.ink, x: 1640, y: 568 });
    var url = text(c, "scamhisn-ai-v1.onrender.com", { font: "Nunito-ExtraBold", size: 27, color: C.brand, x: 1640, y: 634 });
    var all = [logo, name, tag, url];
    for (var i = 0; i < all.length; i++) {
      enter(all[i], 1.9 + i * 0.1, { dy: 26, d: 0.55, blur: 16 });
      leave(all[i], 3.4, { d: 0.34 });
    }
  });

  // ====================================================================== MASTER
  var total = 0, i;
  for (i = 0; i < scenes.length; i++) total += scenes[i].duration;
  var master = app.project.items.addComp("MASTER - ScamHisn AI pitch", W, H, 1, total, FPS);
  master.bgColor = C.paper;
  master.motionBlur = true;
  var t = 0;
  for (i = 0; i < scenes.length; i++) {
    var L = master.layers.add(scenes[i]);
    L.startTime = t;
    L.moveToEnd();
    log("  " + scenes[i].name + " starts " + t.toFixed(2) + "s");
    t += scenes[i].duration;
  }
  log("master duration " + total.toFixed(2) + "s");

  // a second master that carries the optional sound-effects track
  var sfxFile = new File(ROOT + "/assets/sfx/scamhisn_sfx_synth.wav");
  if (sfxFile.exists) {
    var withSfx = app.project.items.addComp("MASTER with sound effects", W, H, 1, total, FPS);
    withSfx.bgColor = C.paper;
    withSfx.motionBlur = true;
    withSfx.layers.add(master);
    var au = withSfx.layers.add(footage(ROOT + "/assets/sfx/scamhisn_sfx_synth.wav", "Sound"));
    au.name = "Synthesised sound effects (replaceable)";
    log("sound-effects master added");
  }

  // tidy the project panel
  for (i = app.project.numItems; i >= 1; i--) {
    var it = app.project.item(i);
    if (it instanceof FootageItem && it.mainSource instanceof SolidSource && it.parentFolder === app.project.rootFolder) it.parentFolder = folder("Solids");
  }
  app.endSuppressDialogs(false);
  app.project.save(OUT);
  log("saved " + OUT.fsName);
  writeLog("ae_build.log");
})();
