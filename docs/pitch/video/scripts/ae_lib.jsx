// Helpers shared by the ScamHisn AI video build (ExtendScript, ES3).
var ROOT = "C:/Users/iV1R3S/Desktop/ScamHisn-AI/docs/pitch/video";
var W = 1920, H = 1080, FPS = 60;
var S = 1.5; // one CSS pixel of the app = 1.5 video pixels
var ZOOM = 2666.667; // camera distance at which z = 0 is pixel-true

function rgb(hex) {
  return [parseInt(hex.substr(0, 2), 16) / 255, parseInt(hex.substr(2, 2), 16) / 255, parseInt(hex.substr(4, 2), 16) / 255];
}
var C = {
  paper: rgb("FBF8F1"), surface: rgb("FFFDF8"), ink: rgb("14201A"), muted: rgb("5C6660"), outline: rgb("1D2A23"),
  hair: rgb("E6E0D2"), brand: rgb("0E6B47"), brandTint: rgb("E4F1E8"), danger: rgb("C8322B"), dangerTint: rgb("FBE6E2"),
  warn: rgb("A66A12"), warnTint: rgb("FBF0D9")
};
var LOG = [];
function log(s) {
  LOG.push(s);
  var f = new File(ROOT + "/scripts/ae_progress.log");
  f.encoding = "UTF-8";
  f.open("a");
  f.writeln(s);
  f.close();
}
function writeLog(name) {
  var f = new File(ROOT + "/scripts/" + name);
  f.encoding = "UTF-8";
  f.open("w");
  f.write(LOG.join("\n"));
  f.close();
}
function readJSON(path) {
  var f = new File(path);
  f.encoding = "UTF-8";
  f.open("r");
  var s = f.read();
  f.close();
  return eval("(" + s + ")");
}
var MAN = null;
var FOLDERS = {};
function folder(name) {
  if (!FOLDERS[name]) FOLDERS[name] = app.project.items.addFolder(name);
  return FOLDERS[name];
}
var FOOT = {};
function footage(path, fold) {
  if (FOOT[path]) return FOOT[path];
  var it = app.project.importFile(new ImportOptions(new File(path)));
  it.parentFolder = folder(fold || "Assets");
  FOOT[path] = it;
  return it;
}
function sequence(firstPath, fps, fold) {
  if (FOOT[firstPath]) return FOOT[firstPath];
  var io = new ImportOptions(new File(firstPath));
  io.sequence = true;
  io.forceAlphabetical = true;
  var it = app.project.importFile(io);
  it.mainSource.conformFrameRate = fps;
  it.parentFolder = folder(fold || "Renders");
  FOOT[firstPath] = it;
  return it;
}
function mkComp(name, dur) {
  var c = app.project.items.addComp(name, W, H, 1, dur, FPS);
  c.bgColor = C.paper;
  c.parentFolder = folder("Scenes");
  c.motionBlur = true;
  c.shutterAngle = 180;
  return c;
}
function paperBg(comp) {
  var s = comp.layers.addSolid(C.paper, "Paper", W, H, 1);
  s.moveToEnd();
  return s;
}
var TR = { pos: "ADBE Position", scale: "ADBE Scale", op: "ADBE Opacity", anchor: "ADBE Anchor Point", rz: "ADBE Rotate Z", ry: "ADBE Rotate Y", rx: "ADBE Rotate X" };
function P(layer, name) {
  return layer.property("ADBE Transform Group").property(TR[name]);
}
// Easing as [influence leaving a key, influence arriving at a key]; speed is zero at every key.
var EASE = { out: [12, 88], io: [72, 72], inn: [82, 14], soft: [35, 65], snap: [6, 96] };
function K(prop, keys, ease) {
  if (ease === undefined) ease = "out";
  var i, k;
  for (i = 0; i < keys.length; i++) prop.setValueAtTime(keys[i][0], keys[i][1]);
  var spatial = prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL || prop.propertyValueType === PropertyValueType.TwoD_SPATIAL;
  for (i = 0; i < keys.length; i++) {
    k = prop.nearestKeyIndex(keys[i][0]);
    if (ease !== "lin") {
      var E = EASE[ease];
      var n = prop.keyInTemporalEase(k).length;
      var ein = [], eout = [];
      for (var d = 0; d < n; d++) {
        ein.push(new KeyframeEase(0, E[1]));
        eout.push(new KeyframeEase(0, E[0]));
      }
      prop.setTemporalEaseAtKey(k, ein, eout);
    }
    if (spatial) {
      var zero = prop.value.length === 3 ? [0, 0, 0] : [0, 0];
      try {
        prop.setSpatialAutoBezierAtKey(k, false);
        prop.setSpatialContinuousAtKey(k, false);
        prop.setSpatialTangentsAtKey(k, zero, zero);
      } catch (e) {}
    }
  }
}
function vec(prop, v) { // a uniform value sized for this property (2 or 3 numbers)
  var n = prop.value.length, out = [];
  for (var i = 0; i < n; i++) out.push(v);
  return out;
}
function mul(arr, f) {
  var out = [];
  for (var i = 0; i < arr.length; i++) out.push(arr[i] * f);
  return out;
}
function off(arr, dx, dy, dz) {
  var out = arr.slice(0);
  out[0] += dx || 0;
  out[1] += dy || 0;
  if (out.length === 3) out[2] += dz || 0;
  return out;
}
function blurProp(L) {
  var fx = L.property("ADBE Effect Parade");
  if (!fx.property("ADBE Gaussian Blur 2")) fx.addProperty("ADBE Gaussian Blur 2");
  return L.property("ADBE Effect Parade").property("ADBE Gaussian Blur 2").property("ADBE Gaussian Blur 2-0001");
}
function shadow(L, opacity, distance, softness) {
  var fx = L.property("ADBE Effect Parade");
  fx.addProperty("ADBE Drop Shadow");
  var d = L.property("ADBE Effect Parade").property("ADBE Drop Shadow");
  d.property("ADBE Drop Shadow-0001").setValue(C.ink); // colour
  d.property("ADBE Drop Shadow-0002").setValue(opacity * 2.55); // opacity (0-255)
  d.property("ADBE Drop Shadow-0003").setValue(180); // straight down
  d.property("ADBE Drop Shadow-0004").setValue(distance);
  d.property("ADBE Drop Shadow-0005").setValue(softness);
  return d;
}
/** Bring a layer in: fade, slide from an offset, optional scale-from and blur-to-sharp. */
function enter(L, t, o) {
  o = o || {};
  var d = o.d || 0.5;
  var target = o.op === undefined ? 100 : o.op;
  K(P(L, "op"), [[t, 0], [t + Math.min(d, 0.3), target]], "soft");
  var p = P(L, "pos"), v = p.value;
  var dy = o.dy === undefined ? 40 : o.dy;
  if (o.dx || dy || o.dz) K(p, [[t, off(v, o.dx || 0, dy, o.dz || 0)], [t + d, v]], o.ease || "out");
  if (o.s) {
    var sc = P(L, "scale"), sv = sc.value;
    K(sc, [[t, mul(sv, o.s)], [t + d, sv]], o.ease || "out");
  }
  if (o.blur) K(blurProp(L), [[t, o.blur], [t + d * 0.8, 0]], "out");
  L.inPoint = Math.max(0, t - 0.02);
}
/** Take a layer out: fade, optional slide, scale-to and blur. */
function leave(L, t, o) {
  o = o || {};
  var d = o.d || 0.3;
  var op = P(L, "op");
  K(op, [[t, op.valueAtTime(t, false)], [t + d, 0]], "inn");
  if (o.dx || o.dy || o.dz) {
    var p = P(L, "pos"), v = p.valueAtTime(t, false);
    K(p, [[t, v], [t + d, off(v, o.dx || 0, o.dy || 0, o.dz || 0)]], "inn");
  }
  if (o.s) {
    var sc = P(L, "scale"), sv = sc.valueAtTime(t, false);
    K(sc, [[t, sv], [t + d, mul(sv, o.s)]], "inn");
  }
  if (o.blur) {
    var b = blurProp(L);
    K(b, [[t, b.valueAtTime(t, false)], [t + d, o.blur]], "inn");
  }
  L.outPoint = t + d + 0.02;
}
/** A piece of the real app interface, placed where it sits on the page. */
function ui(comp, piece, o) {
  o = o || {};
  var m = MAN.pieces[piece];
  var L = comp.layers.add(footage(ROOT + "/assets/ui/" + piece + ".png", "UI pieces"));
  L.name = o.name || piece;
  L.threeDLayer = o.flat ? false : true;
  var k = (o.k || 1) * 100 * S / MAN.scale;
  P(L, "scale").setValue([k, k, k]);
  var x = o.x !== undefined ? o.x : (m.x + m.w / 2) * S + (o.dx || 0);
  var y = o.y !== undefined ? o.y : (m.y + m.h / 2) * S + (o.dy || 0);
  P(L, "pos").setValue(L.threeDLayer ? [x, y, o.z || 0] : [x, y]);
  L.motionBlur = true;
  return L;
}
function image(comp, file, o) {
  var L = comp.layers.add(footage(ROOT + "/assets/" + file, "Brand"));
  L.name = o.name || file;
  if (o.threeD) L.threeDLayer = true;
  P(L, "scale").setValue([o.scale, o.scale, o.scale]);
  P(L, "pos").setValue(o.threeD ? [o.x, o.y, o.z || 0] : [o.x, o.y]);
  L.motionBlur = true;
  return L;
}
function text(comp, str, o) {
  var L = comp.layers.addText(str);
  var tp = L.property("ADBE Text Properties").property("ADBE Text Document");
  var d = tp.value;
  d.resetCharStyle();
  d.font = o.font || "Nunito-ExtraBold";
  d.fontSize = o.size || 64;
  d.fillColor = o.color || C.ink;
  d.applyFill = true;
  d.applyStroke = false;
  d.tracking = o.track || 0;
  d.justification = ParagraphJustification.CENTER_JUSTIFY;
  if (o.leading) {
    try { d.autoLeading = false; d.leading = o.leading; } catch (e) {}
  }
  tp.setValue(d);
  var r = L.sourceRectAtTime(0, false);
  P(L, "anchor").setValue([r.left + r.width / 2, r.top + r.height / 2]);
  if (o.threeD) L.threeDLayer = true;
  var half = r.width * 0.5;
  var px = o.x;
  if (o.just === "left") px = o.x + half;
  if (o.just === "right") px = o.x - half;
  P(L, "pos").setValue(o.threeD ? [px, o.y, o.z || 0] : [px, o.y]);
  L.motionBlur = true;
  L.name = o.name || str.replace(/\r/g, " ").substr(0, 40);
  return L;
}
/** Live number that counts between two values, e.g. 0 -> 84%. */
function counter(comp, o) {
  var L = text(comp, o.txt, o);
  var m = Math.pow(10, o.dec || 0);
  L.property("ADBE Text Properties").property("ADBE Text Document").expression =
    "var a=" + o.t0 + ", b=" + o.t1 + ", from=" + o.from + ", to=" + o.to + ";\n" +
    "var v = time<=a ? from : time>=b ? to : easeOut(time,a,b,from,to);\n" +
    "(Math.round(v*" + m + ")/" + m + ").toFixed(" + (o.dec || 0) + ") + '" + (o.suffix || "") + "';";
  return L;
}
function vg(L) { return L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group"); }
/** Rounded rectangle shape layer in the app's card style. */
function rrect(comp, name, w, h, r, fill, stroke, sw, x, y, threeD) {
  var L = comp.layers.addShape();
  L.name = name;
  L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  vg(L).addProperty("ADBE Vector Shape - Rect");
  if (stroke) vg(L).addProperty("ADBE Vector Graphic - Stroke");
  if (fill) vg(L).addProperty("ADBE Vector Graphic - Fill");
  vg(L).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([w, h]);
  vg(L).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Roundness").setValue(r);
  if (stroke) {
    vg(L).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Color").setValue(stroke);
    vg(L).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width").setValue(sw || 2.25);
  }
  if (fill) vg(L).property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(fill);
  if (threeD) L.threeDLayer = true;
  P(L, "pos").setValue(threeD ? [x, y, 0] : [x, y]);
  L.motionBlur = true;
  return L;
}
function rectSize(L) { return vg(L).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size"); }
function rectPos(L) { return vg(L).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Position"); }
function ellipse(comp, name, d, fill, stroke, sw, x, y, threeD) {
  var L = comp.layers.addShape();
  L.name = name;
  L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  vg(L).addProperty("ADBE Vector Shape - Ellipse");
  if (stroke) vg(L).addProperty("ADBE Vector Graphic - Stroke");
  if (fill) vg(L).addProperty("ADBE Vector Graphic - Fill");
  vg(L).property("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([d, d]);
  if (stroke) {
    vg(L).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Color").setValue(stroke);
    vg(L).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width").setValue(sw || 3);
  }
  if (fill) vg(L).property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(fill);
  if (threeD) L.threeDLayer = true;
  P(L, "pos").setValue(threeD ? [x, y, 0] : [x, y]);
  return L;
}
/** Open stroked path that can be drawn on with Trim Paths. Returns the layer. */
function stroke(comp, name, verts, inT, outT, color, width, x, y) {
  var L = comp.layers.addShape();
  L.name = name;
  L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  vg(L).addProperty("ADBE Vector Shape - Group");
  vg(L).addProperty("ADBE Vector Graphic - Stroke");
  vg(L).addProperty("ADBE Vector Filter - Trim");
  var sh = new Shape();
  sh.vertices = verts;
  sh.inTangents = inT;
  sh.outTangents = outT;
  sh.closed = false;
  vg(L).property("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(sh);
  vg(L).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Color").setValue(color);
  vg(L).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width").setValue(width);
  vg(L).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Line Cap").setValue(2);
  P(L, "pos").setValue([x, y]);
  return L;
}
function trimEnd(L) { return vg(L).property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End"); }
/** The scribble the site draws under its headings, as a draw-on stroke `w` pixels wide. */
function scribble(comp, x, y, w, color, t, d) {
  var k = w / 194;
  var L = stroke(comp, "Scribble underline",
    [[0, 6.3 * k], [71 * k, 3.2 * k], [137 * k, 5.8 * k], [194 * k, 2.4 * k]],
    [[0, 0], [-25 * k, -3.2 * k], [-25 * k, 3 * k], [-19 * k, -2.2 * k]],
    [[24 * k, -5 * k], [23 * k, 3 * k], [21 * k, -2.5 * k], [0, 0]],
    color || C.brand, Math.max(5, 3.4 * k), x, y);
  K(trimEnd(L), [[t, 0], [t + (d || 0.5), 100]], "io");
  L.inPoint = Math.max(0, t - 0.02);
  return L;
}
function camera(comp) {
  var c = comp.layers.addCamera("Camera", [W / 2, H / 2]);
  c.property("ADBE Camera Options Group").property("ADBE Camera Zoom").setValue(ZOOM);
  P(c, "anchor").setValue([W / 2, H / 2, 0]);
  P(c, "pos").setValue([W / 2, H / 2, -ZOOM]);
  return c;
}
/** Camera keys as [time, lookAtX, lookAtY, distance, yawDegrees, pitchDegrees]. */
function camKeys(c, keys, ease) {
  var pk = [], ak = [];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i], yaw = (k[4] || 0) * Math.PI / 180, pitch = (k[5] || 0) * Math.PI / 180;
    pk.push([k[0], [k[1] + k[3] * Math.sin(yaw) * Math.cos(pitch), k[2] - k[3] * Math.sin(pitch), -k[3] * Math.cos(yaw) * Math.cos(pitch)]]);
    ak.push([k[0], [k[1], k[2], 0]]);
  }
  K(P(c, "pos"), pk, ease || "io");
  K(P(c, "anchor"), ak, ease || "io");
}
/** Slow scale drift for flat scenes, so a held frame is never dead still. */
function drift(comp, from, to) {
  var n = comp.layers.addNull(comp.duration);
  n.name = "Slow drift";
  P(n, "anchor").setValue([W / 2, H / 2]);
  P(n, "pos").setValue([W / 2, H / 2]);
  for (var i = 1; i <= comp.numLayers; i++) {
    var L = comp.layer(i);
    if (L === n || L.name === "Paper" || L.parent !== null || L instanceof CameraLayer || L.name.indexOf("[fixed]") === 0) continue;
    L.parent = n;
  }
  K(P(n, "scale"), [[0, [from, from]], [comp.duration, [to, to]]], "lin");
  n.enabled = false;
  return n;
}
/** Small touch indicator standing in for the pointer, with a click ring. */
function pointer(comp, threeD) {
  var L = ellipse(comp, "Pointer", 34, C.ink, C.surface, 4, 0, 0, threeD);
  P(L, "op").setValue(82);
  return L;
}
function clickRing(comp, x, y, z, t, threeD) {
  var L = ellipse(comp, "Click ring", 40, null, C.brand, 5, x, y, threeD);
  if (threeD) P(L, "pos").setValue([x, y, z]);
  K(P(L, "scale"), [[t, vec(P(L, "scale"), 80)], [t + 0.45, vec(P(L, "scale"), 330)]], "out");
  K(P(L, "op"), [[t, 90], [t + 0.45, 0]], "soft");
  L.inPoint = t;
  L.outPoint = t + 0.5;
  return L;
}
