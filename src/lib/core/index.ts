/* eslint-disable */
import * as THREE from "three";
import { GLTFLoader } from "./utils/GLTFLoader";

import { resetSSSMaterial } from "./utils/ResetMaterial";
import {
  setBodyMorphTargetDictionary,
  setTeethMorphTargetDictionary,
  bodyMeshName,
  Tooth_downMeshName,
  setExtraBS,
} from "./utils/convert";
import { downloadAnimation, loadAnimationData } from "./utils/downloadAnimation";

import Convert from "./utils/convert";

export const b64toBlob = (b64Data, contentType = "", sliceSize = 512) => {
  const byteCharacters = window.atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export const splitb64 = (str: string): { b64Data: string; contentType: string } => {
  const prefix = str.split(";")[0];
  const contentType = prefix.split("data:")[1];
  const b64Data = str.split(",")[1];
  return {
    b64Data,
    contentType,
  };
};

export async function parseImageToBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = url;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL();
      resolve(dataURL);
    };
  });
}

function loadGLTFModel(url: string): Promise<THREE.Group> {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      const model = gltf.scene;
      gltf.scene.traverse((child) => {
        if (child.type == "SkinnedMesh") {
          child.frustumCulled = false;
        }
        // var n:any =child ;
        // if (n.material != null ){
        //    if (n.material.name.indexOf("DiffNormalPacked") >= 0||n.material.name.indexOf("Custom/Diff") >= 0) {
        //     console.log("0000000000000000000000000"+n.material.depthWrite)
        //     console.log(n.name)
        //    }
        // }
      });

      setModelInfo(model, true);
      resolve(model);
    });
  });
}

function parseGLTFModel(buffer: ArrayBuffer): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.parse(
      buffer,
      "",
      (gltf) => {
        const model = gltf.scene;
        gltf.scene.traverse((child) => {
          if (child.type == "SkinnedMesh") {
            child.frustumCulled = false;
          }
        });
        setModelInfo(model);
        resolve(model);
      },
      (e) => {
        reject(e);
      }
    );
  });
}
function loadGLTFAnimation(url: string): Promise<THREE.AnimationClip> {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      //console.log("XXXXXXXXXXXXXXXXXXXXXXX"+url)
      //console.log(gltf.animations)

      if (gltf.animations.length > 1) {
        let newTracks = gltf.animations[0].tracks;
        newTracks = newTracks.concat(gltf.animations[1].tracks);
        gltf.animations[0].tracks = newTracks;
      }
      resolve(gltf.animations[0]);
    });
  });
}
//兼容2.0融合变形名称
function remapMorphtarget(obj) {
  for (var key in obj.morphTargetDictionary) {
    var ss = key.split("_");
    var newKey = key.replace("_" + ss[ss.length - 1], "");
    obj.morphTargetDictionary[newKey] = obj.morphTargetDictionary[key];
  }
}
// 设置Model信息
function setModelInfo(model, resetM = true) {
  if (resetM) {
    resetMaterial(model);
  }

  let body = model.getObjectByName("head_part");
  if (!body.morphTargetDictionary) {
    body = body.children[0] as THREE.Mesh;
  }

  if (body == undefined) {
    let body = model.getObjectByName("body").children[0] as THREE.Mesh;
    if (!body.morphTargetDictionary) {
      body = body.parent.children[1] as THREE.Mesh;
    }
  }

  let teeth = model.getObjectByName("tooth_down") as THREE.Mesh;
  if (!teeth.morphTargetDictionary) {
    teeth = teeth.children[0] as THREE.Mesh;
  }

  if (model.getObjectByName("character").userData.developVersion == "2.0") {
    remapMorphtarget(body);
    remapMorphtarget(teeth);
  }
  setBodyMorphTargetDictionary(body.name, body.morphTargetDictionary);
  setTeethMorphTargetDictionary(teeth.name, teeth.morphTargetDictionary);
  let beard = model.getObjectByName("beard_part") as THREE.Mesh;
  let eyelashes = model.getObjectByName("eyelashes_part") as THREE.Mesh;
  if (beard && eyelashes) {
    setExtraBS(beard.name, eyelashes.name);
    beard.updateMorphTargets();
    eyelashes.updateMorphTargets();
  } else if (beard) {
    setExtraBS(beard.name, "");
    beard.updateMorphTargets();
  } else if (eyelashes) {
    setExtraBS("", eyelashes.name);
    eyelashes.updateMorphTargets();
  }
  teeth.updateMorphTargets();
  body.updateMorphTargets();
  return model;
}

function resetMaterial(model) {
  const hairs: any[] = [];
  const s = 1.04;
  model.traverse((n) => {
    if (n.material != null) {
      if (n.material.name.indexOf("Hair") >= 0) {
        hairs.push(n);
        n.scale.x = n.scale.x * s;
        n.scale.z = n.scale.z * s;
      } else if (
        n.material.name.indexOf("DiffNormalPacked") >= 0 ||
        n.material.name.indexOf("Custom/Diff") >= 0
      ) {
        n.scale.x = n.scale.x * s;
        n.scale.z = n.scale.z * s;
        const m = new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
        });
        m.map = n.material.map;
        m.name = n.material.name + "_resetMaterial_hat";
        n.material = m;
      } else {
        // n.material.roughness=0.8;
      }
      resetSSSMaterial(n);
    }
  });

  hairs.forEach((n) => {
    const materialFirstPass = new THREE.MeshBasicMaterial({
      alphaTest: 0.99,
      transparent: false,
      side: THREE.DoubleSide,
    });
    const materialBackSide = new THREE.MeshBasicMaterial({
      blending: THREE.NormalBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      depthWrite: false,
      depthTest: true,
      transparent: true,
      side: THREE.BackSide,
    });
    const materialFrontSide = new THREE.MeshBasicMaterial({
      blending: THREE.NormalBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      depthWrite: false,
      depthTest: true,
      transparent: true,
      side: THREE.FrontSide,
    });
    materialFirstPass.map = n.material.map;
    materialBackSide.map = n.material.map;
    materialFrontSide.map = n.material.map;
    materialFirstPass.name = n.material.name + "materialFirstPass";
    materialBackSide.name = n.material.name + "materialBackSide";
    materialFrontSide.name = n.material.name + "materialFrontSide";
    let mesh = n;
    let mesh2 = n.clone();
    n.parent.add(mesh2);
    let mesh3 = n.clone();
    n.parent.add(mesh3);
    mesh.material = materialFirstPass;
    mesh2.material = materialBackSide;
    mesh2.renderOrder = n.renderOrder + 1;
    mesh3.material = materialFrontSide;
    mesh3.renderOrder = n.renderOrder + 2;
  });
}

function resetPolygonOffset(model, camera) {
  //return;
  model.traverse((n) => {
    if (n.material != null) {
      if (n.material.name.indexOf("Hair") >= 0) {
      } else if (
        n.material.name.indexOf("DiffNormalPacked") >= 0 ||
        n.material.name.indexOf("Custom/Diff") >= 0
      ) {
      } else if (
        n.material.name.indexOf("head_sss") >= 0 ||
        n.material.name.indexOf("body_sss") >= 0
      ) {
      } else if (
        n.material.name.indexOf("eye") >= 0 ||
        n.material.name.indexOf("Eye") >= 0 ||
        n.material.name.indexOf("yachi") >= 0 ||
        n.material.name.indexOf("Eye") >= 0
      ) {
      } else {
        console.log("XXXXXXXXXXXXXXXXXXXXXXX" + n.name + "  " + n.material.name);

        var m = n.material.clone();
        m.polygonOffset = true;

        m.polygonOffsetFactor = -1.0;
        var p = model.position.clone().sub(camera.position);
        p.y = 0;
        console.log(p);
        m.polygonOffsetUnits = -3000.0 / p.length();
        n.material = m;
      }
    }
  });
}
function loadTTSTeethAnimation(url: string, ratio?: number): Promise<THREE.AnimationClip> {
  return downloadAnimation(url, Tooth_downMeshName, ratio);
}

function loadTTSEmoAnimation(url: string, ratio?: number): Promise<THREE.AnimationClip> {
  return downloadAnimation(url, bodyMeshName, ratio);
}

export {
  Convert,
  loadAnimationData,
  downloadAnimation,
  loadGLTFModel,
  parseGLTFModel,
  loadTTSTeethAnimation,
  loadTTSEmoAnimation,
  resetPolygonOffset,
  loadGLTFAnimation,
  setModelInfo,
};
