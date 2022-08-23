import * as THREE from "three";
let bodyMorphTargetDictionary = {};
let teethMorphTargetDictionary = {};
let bodyMeshName;
let Tooth_downMeshName;
export function setBodyMorphTargetDictionary(name, map) {
  bodyMorphTargetDictionary = map;
  console.log(bodyMorphTargetDictionary);
  bodyMeshName = name;
}
export function setTeethMorphTargetDictionary(name, map) {
  teethMorphTargetDictionary = map;
  Tooth_downMeshName = name;
  console.log(teethMorphTargetDictionary);
}
export default function Convert(fp, isEmotion = false) {
  // console.log(fp);
  const kfs = new Array<THREE.KeyframeTrack>();
  const arry = fp["CurveInfos"] as Array<JSON>;
  for (let i = 0; i < arry.length; i++) {
    const element = arry[i];
    const str = element["PathKey"] as string;
    const index = str.indexOf("Transform");
    if (index >= 0) {
      if (str.indexOf(".x") >= 0 && (!isEmotion || str.indexOf(".eye") >= 0)) {
        const s = str.split(":");
        const s2 = s[0].split("/");
        const boneName = s2[s2.length - 1];
        let trackName = boneName + ".";
        if (str.indexOf("Position") >= 0) {
          trackName = trackName + "position";
        }
        if (str.indexOf("Scale") >= 0) {
          trackName = trackName + "scale";
        }
        if (str.indexOf("Rotation") >= 0) {
          trackName = trackName + "quaternion";
        }
        const keys = element["Keys"] as Array<JSON>;
        const times = keys.map((k) => k["Time"] as number);
        const xs = keys.map((k) => k["Value"] as number);
        const ys = (arry[i + 1]["Keys"] as Array<JSON>).map((k) => k["Value"] as number);
        const zs = (arry[i + 2]["Keys"] as Array<JSON>).map((k) => k["Value"] as number);
        let vs = new Float32Array();
        if (str.indexOf("Rotation") < 0) {
          vs = new Float32Array(xs.length * 3);
          for (let j = 0; j < xs.length; j++) {
            vs[j * 3] = xs[j];
            vs[j * 3 + 1] = ys[j];
            vs[j * 3 + 2] = zs[j];
          }
          const track = new THREE.KeyframeTrack(trackName, times, vs, THREE.InterpolateLinear);
          // if(trackName.indexOf("hips") >= 0&&str.indexOf("Position") >= 0)
          // {
          //   console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"+str);
          //   console.log(track);
          //   kfs.push(track);
          // }
        } else {
          const ws = (arry[i + 3]["Keys"] as Array<JSON>).map((k) => k["Value"] as number);
          vs = new Float32Array(xs.length * 4);
          for (let j = 0; j < xs.length; j++) {
            const q = new THREE.Quaternion(xs[j], ys[j], zs[j], ws[j]);
            vs[j * 4] = q.x;
            vs[j * 4 + 1] = q.y;
            vs[j * 4 + 2] = q.z;
            vs[j * 4 + 3] = q.w;
          }
          const track = new THREE.KeyframeTrack(trackName, times, vs, THREE.InterpolateLinear);
          track.ValueTypeName = "quaternion";
          kfs.push(track);
        }
      }
    } else if (str.indexOf("Skinned") > 0) {
      const s = str.split(":");
      const s2 = s[0].split("/");
      const boneName = s2[s2.length - 1];
      if (boneName == "body") {
        /////////////////////////////////liujun
        const trackName =
          bodyMeshName +
          ".morphTargetInfluences[" +
          bodyMorphTargetDictionary[s[2].substring(11)] +
          "]";
        const keys = element["Keys"] as Array<JSON>;
        const times = keys.map((k) => k["Time"] as number);
        const values = keys.map((k) => ((k["Value"] as number) / 100) * 0.65);
        const track = new THREE.KeyframeTrack(trackName, times, values);
        kfs.push(track);
      }
      if (boneName == "tooth_down") {
        const trackName =
          Tooth_downMeshName +
          ".morphTargetInfluences[" +
          teethMorphTargetDictionary[s[2].substring(11)] +
          "]";
        const keys = element["Keys"] as Array<JSON>;
        const times = keys.map((k) => k["Time"] as number);
        const values = keys.map((k) => ((k["Value"] as number) / 100) * 0.65);
        const track = new THREE.KeyframeTrack(trackName, times, values);
        kfs.push(track);
      }
    }
  }
  const ac = new THREE.AnimationClip(fp["name"], undefined, kfs, THREE.NormalAnimationBlendMode);

  return ac;
}
