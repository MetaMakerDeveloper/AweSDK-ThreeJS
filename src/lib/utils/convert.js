/* eslint-disable no-redeclare */
import * as THREE from "three";
var bodyMorphTargetDictionary = {};
var teethMorphTargetDictionary = {};

export function setBodyMorphTargetDictionary(map) {
  bodyMorphTargetDictionary = map;
  console.log(bodyMorphTargetDictionary);
}
export function setTeethMorphTargetDictionary(map) {
  teethMorphTargetDictionary = map;
  console.log(teethMorphTargetDictionary);
}
export default function Convert(fp, isEmotion = false) {
  var kfs = [];
  var arry = fp["CurveInfos"];
  for (var i = 0; i < arry.length; i++) {
    var element = arry[i];
    var str = element["PathKey"];
    var index = str.indexOf("Transform");
    if (index >= 0) {
      if (str.indexOf(".x") >= 0 && (!isEmotion || str.indexOf(".eye") >= 0)) {
        var s = str.split(":");
        var s2 = s[0].split("/");
        var boneName = s2[s2.length - 1];
        var trackName = boneName + ".";
        if (str.indexOf("Position") >= 0) {
          trackName = trackName + "position";
        }
        if (str.indexOf("Scale") >= 0) {
          trackName = trackName + "scale";
        }
        if (str.indexOf("Rotation") >= 0) {
          trackName = trackName + "quaternion";
        }
        var keys = element["Keys"];
        var times = keys.map((k) => k["Time"]);
        var xs = keys.map((k) => k["Value"]);
        var ys = arry[i + 1]["Keys"].map((k) => k["Value"]);
        var zs = arry[i + 2]["Keys"].map((k) => k["Value"]);
        var vs = new Float32Array();
        if (str.indexOf("Rotation") < 0) {
          vs = new Float32Array(xs.length * 3);
          for (var j = 0; j < xs.length; j++) {
            vs[j * 3] = xs[j];
            vs[j * 3 + 1] = ys[j];
            vs[j * 3 + 2] = zs[j];
          }
          var track = new THREE.KeyframeTrack(trackName, times, vs, THREE.InterpolateLinear);
        } else {
          var ws = arry[i + 3]["Keys"].map((k) => k["Value"]);
          vs = new Float32Array(xs.length * 4);
          for (var j = 0; j < xs.length; j++) {
            var q = new THREE.Quaternion(xs[j], ys[j], zs[j], ws[j]);
            vs[j * 4] = q.x;
            vs[j * 4 + 1] = q.y;
            vs[j * 4 + 2] = q.z;
            vs[j * 4 + 3] = q.w;
          }
          var track = new THREE.KeyframeTrack(trackName, times, vs, THREE.InterpolateLinear);
          kfs.push(track);
        }
      }
    } else if (str.indexOf("Skinned") > 0) {
      var s = str.split(":");
      var s2 = s[0].split("/");
      var boneName = s2[s2.length - 1];
      if (boneName == "body") {
        boneName = "pingjunren"; //////////////////////////////////liujun
        var trackName =
          boneName +
          ".morphTargetInfluences[" +
          bodyMorphTargetDictionary[s[2].substring(11)] +
          "]";
        var keys = element["Keys"];
        var times = keys.map((k) => k["Time"]);
        var values = keys.map((k) => (k["Value"] / 100) * 0.65);
        var track = new THREE.KeyframeTrack(trackName, times, values);
        kfs.push(track);
      }
      if (boneName == "tooth_down") {
        var trackName =
          boneName +
          ".morphTargetInfluences[" +
          teethMorphTargetDictionary[s[2].substring(11)] +
          "]";
        var keys = element["Keys"];
        var times = keys.map((k) => k["Time"]);
        var values = keys.map((k) => (k["Value"] / 100) * 0.65);
        var track = new THREE.KeyframeTrack(trackName, times, values);
        kfs.push(track);
      }
    }
  }
  var ac = new THREE.AnimationClip(fp["name"], undefined, kfs, THREE.NormalAnimationBlendMode);

  return ac;
}
