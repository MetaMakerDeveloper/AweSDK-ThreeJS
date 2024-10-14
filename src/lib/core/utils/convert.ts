/* eslint-disable */
import * as THREE from "three";
let bodyMorphTargetDictionary = {};
let teethMorphTargetDictionary = {};
export let bodyMeshName;
export let Tooth_downMeshName;
export let beardName = "";
export let eyelashesName = "";
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
export function setExtraBS(beard, eyelashes) {
  beardName = beard;
  eyelashesName = eyelashes;
}

export function ConvertGLTFAnimation(gltf: any): THREE.AnimationClip {
  let nameList = [];
  gltf.tracks.forEach((element) => {
    nameList.push(element.name);
  });

  if (!nameList.includes("Root_M.position")) {
    return new THREE.AnimationClip(
      gltf["name"],
      undefined,
      gltf.animations[0].tracks,
      THREE.NormalAnimationBlendMode
    );
  }

  let clip = _.cloneDeep(gltf);
  let newTracks = [];

  for (let index = 0; index < clip.tracks.length; index++) {
    let element = clip.tracks[index];

    // let child = humanModel.getObjectByName(element.name.split(".")[0])
    // if (child == undefined)
    //   continue;
    if (element.name.includes(".morph")) {
      // element.values = element.values.map((value) => value * 0.79)
      // element.values = element.values.map((value) => value *  0.)
      if (element.name == "head_part.morphTargetInfluences") {
        //let mouth =[73, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 68, 69, 70, 73, 75, 74, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 87, 88, 89, 86, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104];
        let mouth = [23];
        for (let base = 0; base < element.values.length; base += 156) {
          element.values[base] *= 2;
          element.values[base + 1] *= 2;
          mouth.forEach((offset) => {
            element.values[base + offset - 1] = 0;
          });
        }
      } else if (element.name == "tooth_down.morphTargetInfluences") {
        let mouth = [1];
        for (let base = 0; base < element.values.length; base += 28) {
          mouth.forEach((offset) => {
            element.values[base + offset - 1] = 0;
          });
        }
      }
    }
    // if (child.type != "Bone") {
    //   newTracks.push(element);
    //   continue;
    // }

    //
    if (element.name.includes(".position")) {
      // if (element.name.includes("Root_M")) {
      //   element.values = element.values.map(value => value / 100);
      // } else {
      //   continue;
      // }
    }
    if (element.name.includes(".scale") || element.name.includes("chin")) continue;

    if (
      element.name.includes("zero_") ||
      element.name.includes("one_") ||
      element.name.includes("two_") ||
      element.name.includes("three_") ||
      element.name.includes("four_") ||
      element.name.includes("five_")
    ) {
      continue;
    }

    newTracks.push(element);
  }

  // gltf.tracks.forEach(animation => {
  //   if(!animation.name.includes("position")){
  //     newTracks = newTracks.concat(animation)
  //   }
  // });
  clip.tracks = newTracks;

  return new THREE.AnimationClip(
    gltf["name"],
    undefined,
    newTracks,
    THREE.NormalAnimationBlendMode
  );
}

/**
 *
 * @param { object } fp 动画文件json结构的描述
 * @param {boolean} isEmotion 是否为表情类型的动画
 * @returns { AnimationClip }
 * @desc 通过将JSON结构的描述转化为 THREEJS 的AnimationClip
 */
export default function Convert(fp, isEmotion = false) {
  // console.log(fp);
  const kfs = new Array<THREE.KeyframeTrack>();
  const arry = fp["CurveInfos"] as Array<JSON>;
  if (fp["tracks"]) {
    return ConvertGLTFAnimation(fp);
  }
  var resetOrigin = fp["resetOrigin"];
  if (resetOrigin == undefined) resetOrigin = true;
  resetOrigin = false;
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
        if (str.indexOf("Position") > 0) {
          vs = new Float32Array(xs.length * 3);
          for (var j = 0; j < xs.length; j++) {
            vs[j * 3] = -xs[j];
            vs[j * 3 + 1] = ys[j];
            vs[j * 3 + 2] = zs[j];

            if (str.includes("hips/hips1:")) {
              if (resetOrigin == true) {
                vs[j * 3] -= -xs[0];
                vs[j * 3 + 1] -= ys[0];
                vs[j * 3 + 2] -= zs[0];
              }
            }
          }
          var track = new THREE.KeyframeTrack(trackName, times, vs, THREE.InterpolateLinear);
          if (str.includes("hips/hips1:")) kfs.push(track);
        } else if (str.indexOf("Scale") > 0) {
          vs = new Float32Array(xs.length * 3);
          for (var j = 0; j < xs.length; j++) {
            vs[j * 3] = xs[j];
            vs[j * 3 + 1] = ys[j];
            vs[j * 3 + 2] = zs[j];
          }
          var track = new THREE.KeyframeTrack(trackName, times, vs, THREE.InterpolateLinear);
        } else {
          var ws = arry[i + 3]["Keys"].map((k) => k["Value"]);
          var vs2 = [];
          for (var j = 0; j < xs.length; j++) {
            var q = new THREE.Quaternion(xs[j], ys[j], zs[j], ws[j]);
            vs2[j * 4] = q.x;
            vs2[j * 4 + 1] = -q.y;
            vs2[j * 4 + 2] = -q.z;
            vs2[j * 4 + 3] = q.w;
          }
          var track = new THREE.QuaternionKeyframeTrack(
            trackName,
            times,
            vs2,
            THREE.InterpolateLinear
          );
          track.ValueTypeName = "quaternion";
          kfs.push(track);
        }
      }
    } else if (str.indexOf("Skinned") > 0) {
      const s = str.split(":");
      const s2 = s[0].split("/");
      const boneName = s2[s2.length - 1];
      if (boneName == "body" || boneName == "head_part") {
        /////////////////////////////////liujun
        const temp = s[2].replace("blendShape.", "");
        const trackName =
          bodyMeshName +
          ".morphTargetInfluences[" +
          bodyMorphTargetDictionary[temp + "_" + addNum(temp)] +
          "]";
        const keys = element["Keys"] as Array<JSON>;
        const times = keys.map((k) => k["Time"] as number);
        const values = keys.map((k) => ((k["Value"] as number) / 100) * 0.65);
        const track = new THREE.KeyframeTrack(trackName, times, values);
        kfs.push(track);
        if (beardName.length) {
          const beardtrackName =
            beardName +
            ".morphTargetInfluences[" +
            bodyMorphTargetDictionary[temp + "_" + addNum(temp)] +
            "]";
          const beardtrack = new KeyframeTrack(beardtrackName, times, values);
          kfs.push(beardtrack);
        }
        if (eyelashesName.length) {
          const eyelashTrackName =
            eyelashesName +
            ".morphTargetInfluences[" +
            bodyMorphTargetDictionary[temp + "_" + addNum(temp)] +
            "]";
          const eyelashtrack = new KeyframeTrack(eyelashTrackName, times, values);
          kfs.push(eyelashtrack);
        }
      }
      if (boneName == "tooth_down") {
        const temp = s[2].replace("blendShape.", "");
        const trackName =
          Tooth_downMeshName +
          ".morphTargetInfluences[" +
          teethMorphTargetDictionary[temp + "_" + addNum(temp)] +
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

function addNum(s) {
  let ret = 0;
  for (let i = 0; i < s.length; i++) {
    ret += s.charCodeAt(i);
  }
  return ret.toString();
}
